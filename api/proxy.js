const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { endpoint, method, headers, body } = req.body;

    if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint' });
    }

    console.log(`[Proxy] ${method || 'POST'} → ${endpoint}`);
    console.log(`[Proxy] Model: ${body?.model || 'N/A'}`);

    try {
        // Merge provided headers with browser-like defaults to bypass Cloudflare bot detection
        const proxyHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/event-stream, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            ...headers,
        };

        const response = await fetch(endpoint, {
            method: method || 'POST',
            headers: proxyHeaders,
            body: JSON.stringify(body),
        });

        res.status(response.status);

        // Handle Streaming
        if (body?.stream && response.ok) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            // Pipe the stream
            response.body.pipe(res);

            response.body.on('error', (err) => {
                console.error('[Proxy] Stream error:', err);
                res.end();
            });
        } else {
            // Handle JSON (error or non-streaming)
            const text = await response.text();
            res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
            res.send(text);
        }
    } catch (error) {
        console.error('[Proxy] Error:', error.message);
        res.status(500).json({ error: 'Proxy failed to reach API', details: error.message });
    }
};
