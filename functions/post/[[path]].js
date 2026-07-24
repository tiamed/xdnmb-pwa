const MAIN_SITE = 'https://www.nmbxd1.com'

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/post\//, '')

  if (!path) {
    return new Response('Not Found', { status: 404 })
  }

  const upstream = `${MAIN_SITE}/${path}${url.search}`

  const formData = await request.formData().catch(() => null)

  const upstreamRes = await fetch(upstream, {
    method: request.method,
    headers: {
      'User-Agent': 'xdnmb-pwa/1.0',
    },
    body: formData || undefined,
  })

  const text = await upstreamRes.text()
  const responseHeaders = new Headers()
  responseHeaders.set('Content-Type', 'text/html; charset=utf-8')
  responseHeaders.set('Access-Control-Allow-Origin', url.origin)

  return new Response(text, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  })
}
