const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/proxy', async (req, res) => {
    const { endpoint, method, headers, body } = req.body;

    console.log(`Proxying ${method} request to: ${endpoint}`);

    try {
        const response = await fetch(endpoint, {
            method: method || 'POST',
            headers: headers || {},
            body: JSON.stringify(body)
        });

        // Set status
        res.status(response.status);

        // Handle Streaming
        if (body.stream && response.ok) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders && res.flushHeaders();

            response.body.pipe(res);

            response.body.on('error', (err) => {
                console.error('Streaming error:', err);
                res.end();
            });
        } else {
            // Handle JSON (error or non-streaming)
            const text = await response.text();
            res.setHeader('Content-Type', 'application/json');
            res.send(text);
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy failed to reach API', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
