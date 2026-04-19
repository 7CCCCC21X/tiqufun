export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sort = String(req.query.sort || 'weekly');
    const offset = Math.max(0, Number(req.query.offset || 0));
    const limitRaw = Number(req.query.limit || 100);
    const limit = Math.max(1, Math.min(100, limitRaw));

    const upstream = new URL('https://api.flamy.gg/points/leaderboard');
    upstream.searchParams.set('sort', sort);
    upstream.searchParams.set('offset', String(offset));
    upstream.searchParams.set('limit', String(limit));

    const response = await fetch(upstream.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'referer': 'https://flamy.gg/',
        'origin': 'https://flamy.gg',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
      }
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    const looksLikeCloudflare =
      text.includes('Just a moment') ||
      text.includes('cf_chl_opt') ||
      text.includes('challenge-platform') ||
      text.includes('Enable JavaScript and cookies to continue');

    if (looksLikeCloudflare) {
      return res.status(403).json({
        ok: false,
        code: 'CLOUDFLARE_BLOCKED',
        message: '被 Cloudflare 拦截了，当前返回的是验证页，不是真实 JSON 数据',
        preview: text.slice(0, 300)
      });
    }

    const looksLikeJson =
      contentType.includes('application/json') ||
      text.trim().startsWith('{') ||
      text.trim().startsWith('[');

    if (!looksLikeJson) {
      return res.status(502).json({
        ok: false,
        code: 'INVALID_UPSTREAM_RESPONSE',
        message: '上游返回的不是有效 JSON',
        preview: text.slice(0, 300)
      });
    }

    res.status(response.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(text);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      code: 'PROXY_REQUEST_FAILED',
      message: error?.message || 'Proxy request failed'
    });
  }
}
