const MAIN_SITE = 'https://www.nmbxd1.com'

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const path = url.pathname.replace(/^\/post\//, '')

  if (!path) {
    return new Response('Not Found', { status: 404 })
  }

  const upstream = `${MAIN_SITE}/${path}${url.search}`

  try {
    const formData = await context.request.formData().catch(() => null)

    const headers = new Headers()
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    headers.set('Referer', 'https://www.nmbxd1.com/')
    headers.set('Origin', 'https://www.nmbxd1.com')

    const upstreamRes = await fetch(upstream, {
      method: context.request.method,
      headers,
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
  } catch (err) {
    return new Response(JSON.stringify({ error: 'proxy_error', message: err.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': url.origin,
      },
    })
  }
}
