module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.CANVA_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'CANVA_API_KEY not configured' });

  const { imageUrl, designName } = req.body;

  // Canva Connect API — import an asset and return edit URL
  // https://www.canva.com/developers/docs/
  try {
    const upstream = await fetch('https://api.canva.com/rest/v1/assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        name: designName || 'Creative Brief Hub Export',
        url: imageUrl,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.message || 'Canva API error' });
    }

    const data = await upstream.json();
    return res.status(200).json({ ok: true, editUrl: data.asset?.url || 'https://www.canva.com/create/' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
