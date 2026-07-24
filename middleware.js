export const config = {
  matcher: ['/api/:path*', '/image/:path*', '/thumb/:path*', '/post/:path*'],
}

const API_BASE = 'https://api.nmb.best/api/'
const CDN_BASE = 'https://image.nmb.best/'
const MAIN_SITE = 'https://www.nmbxd1.com'

export default async function handler(request) {
  const url = new URL(request.url)
  const origin = url.origin

  let upstream = ''
  let cacheTtl = 0

  if (url.pathname.startsWith('/api/')) {
    const path = url.pathname.replace('/api/', '')
    upstream = `${API_BASE}${path}${url.search}`
  } else if (url.pathname.startsWith('/image/')) {
    const path = url.pathname.replace('/image/', '')
    upstream = `${CDN_BASE}image/${path}${url.search}`
    cacheTtl = 86400
  } else if (url.pathname.startsWith('/thumb/')) {
    const path = url.pathname.replace('/thumb/', '')
    upstream = `${CDN_BASE}thumb/${path}${url.search}`
    cacheTtl = 86400
  } else if (url.pathname.startsWith('/post/')) {
    const path = url.pathname.replace('/post/', '')
    upstream = `${MAIN_SITE}/${path}${url.search}`
  } else {
    return new Response('Not Found', { status: 404 })
  }

  try {
    const headers = new Headers()
    headers.set('Host', new URL(upstream).hostname)
    headers.set('Referer', 'https://www.nmbxd1.com/')
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    headers.set('Accept', 'application/json, text/plain, */*')
    headers.set('Accept-Language', 'zh-CN,zh;q=0.9')
    headers.set('X-Requested-With', 'XMLHttpRequest')

    const init = {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    }

    const upstreamRes = await fetch(upstream, init)

    const responseHeaders = new Headers(upstreamRes.headers)
    responseHeaders.set('Access-Control-Allow-Origin', origin)
    responseHeaders.set('Access-Control-Allow-Credentials', 'true')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Cookie')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    responseHeaders.delete('x-frame-options')

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: responseHeaders })
    }

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
        'Access-Control-Allow-Origin': origin,
      },
    })
  }
}
