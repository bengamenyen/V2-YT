// ============================================================
// GET /api/youtube-data?api=data&path=/channels&part=statistics&mine=true
// GET /api/youtube-data?api=analytics&path=/reports&ids=channel==MINE&...
// Authorization: Bearer <user's Google access_token>
// Proxies to the YouTube Data API v3 (api=data) or the YouTube
// Analytics API v2 (api=analytics) and returns the JSON.
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing bearer token' });

  const api  = (req.query && req.query.api) || 'data';
  const path = (req.query && req.query.path) || '';
  if (!path || !path.startsWith('/')) return res.status(400).json({ error: 'path required (must start with /)' });

  const bases = {
    data:      'https://www.googleapis.com/youtube/v3',
    analytics: 'https://youtubeanalytics.googleapis.com/v2',
  };
  const base = bases[api];
  if (!base) return res.status(400).json({ error: 'invalid api (expected "data" or "analytics")' });

  // Forward all query params except `api` and `path` themselves
  const fwd = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) {
    if (k !== 'api' && k !== 'path') fwd.set(k, String(v));
  }
  const qs = fwd.toString();
  const url = base + path + (qs ? '?' + qs : '');

  try {
    const r = await fetch(url, {
      headers: { 'Authorization': auth, 'Accept': 'application/json' },
    });
    const text = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (e) {
    return res.status(500).json({ error: 'proxy fetch failed: ' + (e && e.message ? e.message : String(e)) });
  }
}
