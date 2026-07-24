const API_BASE = 'https://api.nmb.best/api/'
const CDN_BASE = 'https://image.nmb.best/'
const MAIN_SITE = 'https://www.nmbxd1.com'

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\//, '')

  if (!path) {
    return new Response('Not Found', { status: 404 })
  }

  const upstream = `${API_BASE}${path}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('origin')
  headers.delete('referer')
  headers.set('User-Agent', 'xdnmb-pwa/1.0')

  const upstreamRes = await fetch(upstream, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  })

  const responseHeaders = new Headers(upstreamRes.headers)
  responseHeaders.set('Access-Control-Allow-Origin', url.origin)
  responseHeaders.set('Access-Control-Allow-Credentials', 'true')
  responseHeaders.delete('x-frame-options')
  responseHeaders.delete('set-cookie')

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  })
}
