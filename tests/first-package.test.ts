import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import https from 'node:https'
import dns from 'node:dns/promises'
import { devBypassId } from '../lib/auth/devBypass'
import { articleUrl, publicAddress, pinnedAddress, fetchArticlePage } from '../lib/security/safeArticleFetch'
import { acquireArticleRead } from '../lib/security/articleAccess'
import { toArticleDisplay, dedupeStories, findRelatedStories, selectBreakingStories } from '../lib/articleUtils'
import { sourceDate } from '../scripts/pipeline/sourceDate'
import { observeSource, sourceScope, resultStatus, runStatus, type SourceOutcome } from '../scripts/pipeline/sourceStatus'
import type { Database } from '../types/supabase'

type FakeResponse = PassThrough & { statusCode: number; headers: Record<string, string> }
type FakeOptions = { signal: AbortSignal; lookup: (host: string, options: object, callback: (error: unknown, address: string) => void) => void }
const now = Date.now()
function article(id: string, headline: string, published_at: string | null = new Date(now - 86400000).toISOString()) {
  return { id, headline, published_at, source_name: 'Local Paper', tags: ['Boston'], urgency_score: 5 } as Database['distilled']['Tables']['articles']['Row']
}
test('bypass is local development only', () => {
  assert.equal(devBypassId({ NODE_ENV: 'development', DEV_BYPASS_USER_ID: 'dev' }), 'dev')
  for (const env of [{ NODE_ENV: 'production' }, { NODE_ENV: 'development', VERCEL: '1' }, { NODE_ENV: 'development', VERCEL_ENV: 'preview' }, {}]) {
    assert.equal(devBypassId({ ...env, DEV_BYPASS_USER_ID: 'dev' } as NodeJS.ProcessEnv), undefined)
  }
})
test('unknown, old and future articles do not appear new or breaking', () => {
  for (const date of [null, '', 'invalid', new Date(now + 60000).toISOString(), new Date(now - 86400000).toISOString()]) {
    const display = [article('1', 'headline', date)].map(row => toArticleDisplay(row, now))[0]
    assert.equal(display.isNew, false)
    assert.equal(selectBreakingStories([display]).length, 0)
  }
  assert.equal(toArticleDisplay(article('2','fresh',new Date(now - 1000).toISOString()),now).isNew,true)
  assert.equal(sourceDate(undefined), '')
  assert.equal(sourceDate('bad'), '')
})
test('unrelated events survive; identical identity and headlines deduplicate', () => {
  const a = toArticleDisplay(article('a','Boston school budget approved'))
  const b = toArticleDisplay(article('b','Boston hospital opens wing'))
  const c = toArticleDisplay(article('c','Boston school budget rejected'))
  assert.equal(dedupeStories([a,b,c]).length,3)
  assert.equal(findRelatedStories(a,[b,c]).length,0)
  assert.equal(dedupeStories([a,{...a}, {...a,id:'copy'}]).length,1)
  assert.equal(dedupeStories([a,{...a,id:'later',publishedAt:new Date(now + 86400000).toISOString()}]).length,2)
})
test('protocols, credentials, literals and unsafe ports are refused', () => {
  for (const url of ['file:///etc/passwd','https://user:pass@example.com','http://127.1','http://2130706433','http://0x7f000001','http://[::1]','http://example.com:8080','http://localhost']) {
    assert.throws(() => articleUrl(url), Error, url)
  }
  assert.equal(articleUrl('https://example.com/a').hostname,'example.com')
})
test('special addresses and mixed public/private DNS answers are refused', async () => {
  for (const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','100.100.100.200','192.168.1.1','224.0.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1','2002:7f00:1::']) assert.equal(publicAddress(ip),false,ip)
  assert.equal(publicAddress('93.184.216.34'),true)
  assert.equal(publicAddress('2606:4700:4700::1111'),true)
  await assert.rejects(pinnedAddress('example.com', (async () => [{ address:'93.184.216.34',family:4 },{address:'10.0.0.1',family:4}])))
})
test('limiter bounds concurrent work and does not double release', () => {
  const releases = Array.from({length:4},(_,i)=>acquireArticleRead(`u${i}`,now))
  assert.ok(releases.every(Boolean)); assert.equal(acquireArticleRead('other',now),null)
  for(const release of releases){release!();release!()}
  for(let i=0;i<10;i++)acquireArticleRead('one',now)!()
  assert.equal(acquireArticleRead('one',now),null)
  assert.ok(acquireArticleRead('one',now+60001))
})
test('source outcomes distinguish empty success, partial failure and total failure without secret logs', async () => {
  const outcomes: SourceOutcome[]=[]
  await sourceScope.run(outcomes,async()=>{
    await observeSource('one',async()=>[],r=>r.length)
    await assert.rejects(observeSource('two',async()=>{throw new Error('secret-token')},()=>0), /Source request failed/)
  })
  assert.equal(outcomes[0].status,'success')
  assert.equal(resultStatus(false,outcomes),'partial')
  assert.equal(resultStatus(false,[outcomes[1]]),'failed')
  assert.equal(resultStatus(false,[]),'success')
  assert.equal(runStatus([{status:'success'},{status:'partial'}]),'partial')
  assert.equal(runStatus([]),'failed')
  assert.ok(!JSON.stringify(outcomes).includes('secret-token'))
})

test('transport pins DNS and rejects redirected internal destinations before connection', async () => {
  let calls=0
  mock.method(dns,'lookup', async (host:string)=> [{address:host==='internal.example'?'127.0.0.1':'93.184.216.34',family:4}])
  mock.method(https,'request', (_url:URL,opts:FakeOptions,callback:(response: FakeResponse) => void)=>{
    calls++
    opts.lookup('example.com',{},(err:unknown,address:string)=>{assert.equal(err,null);assert.equal(address,'93.184.216.34')})
    const req=Object.assign(new EventEmitter(), { end: () => {} })
    req.end=()=>{
      const res=Object.assign(new PassThrough(), { statusCode: 200, headers: {} as Record<string, string> })
      res.statusCode=302;res.headers={location:'https://internal.example/'};callback(res)
    }
    return req
  })
  try{await assert.rejects(fetchArticlePage('https://example.com/'),/Blocked destination/);assert.equal(calls,1)}finally{mock.restoreAll()}
})

test('transport handles ordinary HTML and bounds body, type, redirects and deadline', async () => {
  mock.method(dns,'lookup',async()=>[{address:'93.184.216.34',family:4}])
  let mode='ok',calls=0
  mock.method(https,'request', (_url:URL,opts:FakeOptions,callback:(response: FakeResponse) => void)=>{
    calls++
    const req=Object.assign(new EventEmitter(), { end: () => {} })
    req.end=()=>{
      if(mode==='slow'){opts.signal.addEventListener('abort',()=>req.emit('error',new Error('timeout')),{once:true});return}
      const res=Object.assign(new PassThrough(), { statusCode: 200, headers: {} as Record<string, string> })
      res.statusCode=mode==='loop'?302:200
      res.headers=mode==='loop'?{location:'/again'}:{'content-type':mode==='type'?'image/png':'text/html'}
      callback(res)
      if(!res.destroyed)res.end(mode==='large'?Buffer.alloc(2*1024*1024+1):'<p>Publisher article</p>')
    }
    return req
  })
  try{
    assert.match((await fetchArticlePage('https://example.com/')).html,/Publisher/)
    mode='large';await assert.rejects(fetchArticlePage('https://example.com/'),/too large/)
    mode='type';await assert.rejects(fetchArticlePage('https://example.com/'),/Unsupported/)
    mode='loop';calls=0;await assert.rejects(fetchArticlePage('https://example.com/'),/redirects/);assert.equal(calls,5)
    mode='slow';const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20)
    await assert.rejects(fetchArticlePage('https://example.com/',controller.signal),/timeout/);clearTimeout(timer)
  }finally{mock.restoreAll()}
})
