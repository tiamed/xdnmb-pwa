export default async function handler(req, res) {
  const { path = '' } = req.query
  const target = Array.isArray(path) ? path.join('/') : path

  const API_BASE = 'https://api.nmb.best/api/'
  const CDN_BASE = 'https://image.nmb.best/'
  const MAIN_SITE = 'https://www.nmbxd1.com'

  let upstream = ''
  let isBinary = false

  if (target.startsWith('image/')) {
    upstream = `${CDN_BASE}${target}${req.url.includes('?') ? req.url.split('?')[1] : ''}`
    isBinary = true
  } else if (target.startsWith('thumb/')) {
    upstream = `${CDN_BASE}${target}${req.url.includes('?') ? req.url.split('?')[1] : ''}`
    isBinary = true
  } else if (target.startsWith('post/')) {
    upstream = `${MAIN_SITE}/${target.slice(5)}${req.url.includes('?') ? req.url.split('?')[1] : ''}`
  } else {
    upstream = `${API_BASE}${target}${req.url.includes('?') ? req.url.split('?')[1] : ''}`
  }

  try {
    const headers = {}
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type']
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    headers['Referer'] = 'https://www.nmbxd1.com/'
    headers['Accept'] = req.headers['accept'] || '*/*'

    const upstreamRes = await fetch(upstream, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    })

    const contentType = upstreamRes.headers.get('content-type') || 'application/json'

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', contentType)

    if (isBinary) {
      const buffer = Buffer.from(await upstreamRes.arrayBuffer())
      res.status(upstreamRes.status).send(buffer)
    } else {
      const text = await upstreamRes.text()
      res.status(upstreamRes.status).send(text)
    }
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', message: err.message })
  }
}
