const CDN_BASE = 'https://image.nmb.best/thumb/'

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const path = url.pathname.replace(/^\/thumb\//, '')

  if (!path) {
    return new Response('Not Found', { status: 404 })
  }

  const upstream = `${CDN_BASE}${path}${url.search}`

  const headers = new Headers()
  headers.set('Referer', 'https://www.nmbxd1.com/')
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  const upstreamRes = await fetch(upstream, {
    cf: { cacheTtl: 86400, cacheEverything: true },
    headers,
  })

  const responseHeaders = new Headers(upstreamRes.headers)
  responseHeaders.set('Access-Control-Allow-Origin', url.origin)
  responseHeaders.delete('x-frame-options')

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  })
}
