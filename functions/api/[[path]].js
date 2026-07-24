const API_BASE = 'https://www.nmbxd1.com/Api/'

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const path = url.pathname.replace(/^\/api\//, '')

  if (!path) {
    return new Response(JSON.stringify({ error: 'missing path' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': url.origin,
      },
    })
  }

  const upstream = `${API_BASE}${path}${url.search}`

  try {
    const headers = new Headers()
    headers.set('Host', 'www.nmbxd1.com')
    headers.set('Accept', 'application/json, text/plain, */*')
    headers.set('Accept-Language', 'zh-CN,zh;q=0.9')
    headers.set('Referer', 'https://www.nmbxd1.com/')
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    headers.set('X-Requested-With', 'XMLHttpRequest')

    const upstreamRes = await fetch(upstream, {
      method: context.request.method,
      headers,
      body: context.request.method !== 'GET' && context.request.method !== 'HEAD' ? context.request.body : undefined,
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
