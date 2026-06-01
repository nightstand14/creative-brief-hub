module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const body = req.body;

  // Health ping
  if (body && body.ping) return res.status(200).json({ ok: true });

  const {
    name, platform, type, size, quality,
    module: modelName, textLayers, visualBrief, textPlacement, sampleUrls,
  } = body || {};

  const userMsg = `You are a creative director specialising in social media visuals. Build a precise, detailed image generation prompt based on this brief. Return ONLY the prompt text — no explanation, no preamble.

Campaign: ${name || ''}
Platform: ${platform || ''}
Type: ${type || ''}
Size: ${size || ''}
Quality: ${quality || ''}
Model: ${modelName || ''}
Text Layers: ${textLayers || 'none'}
Visual Brief: ${visualBrief || 'none'}
Text Placement: ${textPlacement || 'none'}
Reference URLs: ${(sampleUrls || []).join(', ') || 'none'}

Write a prompt under 250 words. Be specific about composition, lighting, color palette, mood, typography style, and any text/copy placement.`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.error?.message || 'Claude API error' });
    }

    const data = await upstream.json();
    const prompt = data.content?.find(c => c.type === 'text')?.text?.trim() || '';
    return res.status(200).json({ prompt, usage: data.usage });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
