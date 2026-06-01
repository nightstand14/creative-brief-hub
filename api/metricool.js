export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.METRICOOL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'METRICOOL_API_KEY not configured' });

  const { briefName, imageUrls, platform } = req.body;
  if (!imageUrls?.length) return res.status(400).json({ error: 'imageUrls required' });

  // Metricool draft post creation
  // https://app.metricool.com/api/v2 — adjust endpoint per their docs
  const networks = platform === 'Facebook' ? ['facebook'] : platform === 'Both' ? ['instagram','facebook'] : ['instagram'];

  try {
    const upstream = await fetch('https://app.metricool.com/api/v2/posts/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        text: briefName,
        media: imageUrls.map(url => ({ url, type: 'image' })),
        networks,
        status: 'draft',
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.message || 'Metricool API error' });
    }

    const data = await upstream.json();
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
