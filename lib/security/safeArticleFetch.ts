import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { BlockList, isIP } from 'node:net'

const blocked = new BlockList()
for (const [ip, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 3],
] as const) blocked.addSubnet(ip, prefix, 'ipv4')
const globalV6 = new BlockList()
globalV6.addSubnet('2000::', 3, 'ipv6')
for (const [ip, prefix] of [['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20]] as const) {
  blocked.addSubnet(ip, prefix, 'ipv6')
}
export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) return !blocked.check(address, 'ipv4')
  return isIP(address) === 6 && globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6')
}
export function articleUrl(input: string): URL {
  if (input.length > 4096) throw new Error('Invalid URL')
  const url = new URL(input)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) {
    throw new Error('Unsupported URL')
  }
  // Literal IPs are unnecessary for publisher URLs; URL parsing normalizes encoded IPs.
  if (isIP(url.hostname.replace(/^\[|\]$/g, '')) || !url.hostname.includes('.') || url.hostname.endsWith('.')) {
    throw new Error('Unsupported host')
  }
  return url
}
export async function pinnedAddress(host: string, resolve: (host: string, options: { all: true; verbatim: true }) => Promise<{ address: string; family: number }[]> = lookup) {
  const addresses = await resolve(host, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error('Blocked destination')
  return addresses[0]
}

const MAX_BYTES = 2 * 1024 * 1024
export type ArticlePage = { html: string; finalUrl: string }
// One deadline covers DNS, connections, redirects and all response bodies.
export async function fetchArticlePage(input: string, signal = AbortSignal.timeout(8000)): Promise<ArticlePage> {
  let target = articleUrl(input)
  for (let hop = 0; hop <= 4; hop++) {
    signal.throwIfAborted()
    let onAbort: (() => void) | undefined
    const address = await Promise.race([
      pinnedAddress(target.hostname),
      new Promise<never>((_, reject) => {
        onAbort = () => reject(new Error('Fetch timed out'))
        signal.addEventListener('abort', onAbort, { once: true })
      }),
    ]).finally(() => { if (onAbort) signal.removeEventListener('abort', onAbort) })
    signal.throwIfAborted()
    const result = await new Promise<{ html?: string; redirect?: string }>((resolve, reject) => {
      const send = target.protocol === 'https:' ? httpsRequest : httpRequest
      const req = send(target, {
        agent: false, signal, family: address.family,
        // Connect only to the address checked above; retain original Host and TLS name.
        lookup: (_host, _options, callback) => callback(null, address.address, address.family),
        headers: { 'User-Agent': 'Distilled/1.0 Article Reader', Accept: 'text/html,application/xhtml+xml', 'Accept-Encoding': 'identity' },
      }, res => {
        const status = res.statusCode ?? 0
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = res.headers.location
          res.destroy()
          if (!location) reject(new Error('Missing redirect'))
          else resolve({ redirect: location })
          return
        }
        if (status < 200 || status >= 300 ||
            !/^(text\/html|application\/xhtml\+xml)(;|$)/i.test(res.headers['content-type'] ?? '') ||
            (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity') ||
            Number(res.headers['content-length'] ?? 0) > MAX_BYTES) {
          res.destroy(); reject(new Error('Unsupported response')); return
        }
        const chunks: Buffer[] = []
        let bytes = 0
        res.on('data', (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > MAX_BYTES) { res.destroy(); reject(new Error('Response too large')); return }
          chunks.push(chunk)
        })
        res.on('error', reject)
        res.on('aborted', () => reject(new Error('Response interrupted')))
        res.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8') }))
      })
      req.on('error', reject)
      req.end()
    })
    if (result.redirect) { target = articleUrl(new URL(result.redirect, target).href); continue }
    return { html: result.html ?? '', finalUrl: target.href }
  }
  throw new Error('Too many redirects')
}
