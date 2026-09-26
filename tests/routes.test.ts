import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Execute the actual route with external boundaries stubbed: no auth, DB or network calls.
function loadRoute(file: string, dependencies: Record<string, unknown>, env = {}) {
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports: Record<string, (request: unknown) => Promise<{ status: number; body: { paragraphs?: string[]; success?: boolean; status?: string } }>> = {}
  vm.runInNewContext(compiled, {
    exports, URL, AbortSignal, Buffer, process: { env }, console: { error() {} },
    require: (name: string) => {
      if (!(name in dependencies)) throw new Error(`Unexpected import ${name}`)
      return dependencies[name]
    },
  })
  return exports
}
const next = { NextResponse: { json: (body: unknown, options: {status?: number} = {}) => ({ body, status: options.status ?? 200 }) } }

test('article route denies unauthenticated and unknown articles before outbound requests', async () => {
  let user: { id: string } | null = null
  let found = false, dbCalls = 0, fetchCalls = 0, releases = 0
  const route = loadRoute('app/api/article/route.ts', {
    'next/server': next,
    '@mozilla/readability': { Readability: class { parse() { return null } } },
    linkedom: { parseHTML: () => ({ document: {} }) },
    '@/lib/supabase/server': {
      getEffectiveUser: async () => user,
      createServerSupabase: () => {
        dbCalls++
        const query = { select: () => query, eq: () => query, limit: () => query,
          maybeSingle: async () => ({ data: found ? { source_url: 'https://publisher.example/story' } : null, error: null }) }
        return { from: () => query }
      },
    },
    '@/lib/security/safeArticleFetch': {
      articleUrl: (url: string) => new URL(url),
      fetchArticlePage: async (url: string) => { fetchCalls++; return { html: '<p>This is a sufficiently long publisher paragraph for the original extraction function.</p>', finalUrl: url } },
    },
    '@/lib/security/articleAccess': { acquireArticleRead: () => () => { releases++ } },
  })
  const request = { nextUrl: new URL('https://app.example/api/article?url=https://publisher.example/story') }
  assert.equal((await route.GET(request)).status, 401)
  assert.equal(dbCalls, 0); assert.equal(fetchCalls, 0)
  user = { id: 'user' }
  assert.equal((await route.GET(request)).status, 404)
  assert.equal(fetchCalls, 0)
  found = true
  const response = await route.GET(request)
  assert.equal(response.status, 200)
  assert.equal(fetchCalls, 1)
  assert.equal(response.body.paragraphs?.length, 1)
  assert.equal(releases, 2)
})

test('pipeline route fails closed on missing secret, validates zones and reports partial failure', async () => {
  let calls = 0
  const dependencies = {
    'next/server': next,
    '@/scripts/pipeline/index': { runPipeline: async () => { calls++; return [{ zone: 'tech', status: 'partial', sources: [] }] } },
    '@/scripts/pipeline/sourceStatus': { runStatus: () => 'partial' },
  }
  const request = (secret: string | null, body = {}) => ({ headers: { get: () => secret }, json: async () => body })
  const missing = loadRoute('app/api/pipeline/trigger/route.ts', dependencies)
  assert.equal((await missing.POST(request(null))).status,401)
  assert.equal(calls,0)
  const route = loadRoute('app/api/pipeline/trigger/route.ts', dependencies,{CRON_SECRET:'test'})
  assert.equal((await route.POST(request('wrong'))).status,401)
  assert.equal((await route.POST(request('test',{zones:['unknown']}))).status,400)
  assert.equal((await route.POST(request('test',{zones:[]}))).status,400)
  assert.equal(calls,0)
  const response = await route.POST(request('test',{zones:['tech']}))
  assert.equal(response.status,502)
  assert.equal(response.body.success,false)
  assert.equal(response.body.status,'partial')
})
