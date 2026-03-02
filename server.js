const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files (index.html, style.css, app.js)
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for API calls (avoids CORS issues)
app.post('/proxy', async (req, res) => {
    const { endpoint, method, headers, body } = req.body;

    console.log(`[Proxy] ${method} → ${endpoint}`);
    console.log(`[Proxy] Model: ${body?.model || 'N/A'}`);

    try {
        const response = await fetch(endpoint, {
            method: method || 'POST',
            headers: headers || {},
            body: JSON.stringify(body)
        });

        // Set status
        res.status(response.status);

        // Handle Streaming
        if (body?.stream && response.ok) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders && res.flushHeaders();

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
});

app.listen(PORT, () => {
    console.log(`\n🚀 Himanshu AI running at http://localhost:${PORT}`);
    console.log(`   Proxy endpoint: http://localhost:${PORT}/proxy\n`);
});
