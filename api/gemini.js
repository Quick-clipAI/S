export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, generationConfig } = req.body;
  const apiKey = req.headers['x-gemini-key'];

  if (!apiKey) return res.status(401).json({ error: 'No Gemini key.' });
  if (!prompt) return res.status(400).json({ error: 'prompt required.' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: generationConfig || { temperature: 0.9, maxOutputTokens: 4096 },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Gemini API error' });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const finishReason = data?.candidates?.[0]?.finishReason || '';
    res.json({ text, finishReason });
  } catch (err) {
    res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}
