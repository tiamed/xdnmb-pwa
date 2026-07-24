const CDN_BASE = 'https://image.nmb.best/'

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/image\//, '')

  if (!path) {
    return new Response('Not Found', { status: 404 })
  }

  const upstream = `${CDN_BASE}image/${path}${url.search}`

  const upstreamRes = await fetch(upstream, {
    cf: { cacheTtl: 86400, cacheEverything: true },
  })

  const responseHeaders = new Headers(upstreamRes.headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.delete('x-frame-options')

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  })
}
