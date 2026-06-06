export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic origin check — only your site can call this
  const origin = req.headers.origin || '';
  const allowed = ['https://edulib-rdc-web.vercel.app', 'http://localhost:3000'];
  if (origin && !allowed.some(function(o) { return origin.startsWith(o); })) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    var body = req.body;
    if (!body || !body.messages) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    var response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.MISTRAL_KEY
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: body.messages,
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    var data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
