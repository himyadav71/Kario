const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Add CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { endpoint, method, headers, body } = req.body;

    try {
        const response = await fetch(endpoint, {
            method: method || 'POST',
            headers: headers || {},
            body: JSON.stringify(body)
        });

        res.status(response.status);

        // Handle Streaming
        if (body.stream && response.ok) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Pipe the stream
            response.body.pipe(res);
        } else {
            const text = await response.text();
            res.setHeader('Content-Type', 'application/json');
            res.send(text);
        }
    } catch (error) {
        res.status(500).json({ error: 'Proxy failed', details: error.message });
    }
};
