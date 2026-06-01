module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.HIGGSFIELD_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'HIGGSFIELD_API_KEY not configured' });

  const { prompt, width = 1080, height = 1080, module: model, quality } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  // Map quality to steps
  const stepsMap = { draft: 20, standard: 30, high: 40, ultra: 50 };
  const steps = stepsMap[quality] || 30;

  try {
    const upstream = await fetch('https://api.higgsfield.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({ prompt, width, height, num_images: 1, steps, model }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.message || 'Higgsfield API error' });
    }

    const data = await upstream.json();
    const images = data.data?.map(d => d.url) || data.images || [];
    return res.status(200).json({ images });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
