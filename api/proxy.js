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
        'accept': 'application/json',
        'user-agent': 'Mozilla/5.0'
      }
    });

    const text = await response.text();

    res.status(response.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(text);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error?.message || 'Proxy request failed'
    });
  }
}
