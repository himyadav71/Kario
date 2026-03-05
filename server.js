const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3001;

const SHARED_KEYS_FILE = path.join(__dirname, 'shared-keys.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files (index.html, style.css, app.js)
app.use(express.static(path.join(__dirname)));

// ---- Shared API Keys ----

// Load shared keys from file
function loadSharedKeys() {
    try {
        if (fs.existsSync(SHARED_KEYS_FILE)) {
            return JSON.parse(fs.readFileSync(SHARED_KEYS_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[SharedKeys] Error reading file:', err.message);
    }
    return {};
}

// Save shared keys to file
function saveSharedKeys(keys) {
    try {
        fs.writeFileSync(SHARED_KEYS_FILE, JSON.stringify(keys, null, 2), 'utf8');
        console.log('[SharedKeys] Keys saved successfully');
    } catch (err) {
        console.error('[SharedKeys] Error saving file:', err.message);
    }
}

// GET shared keys (returns masked keys + enabled status for public use)
app.get('/api/shared-keys', (req, res) => {
    const keys = loadSharedKeys();
    // Return which providers have keys (mask the actual key for security display)
    const publicKeys = {};
    for (const [provider, data] of Object.entries(keys)) {
        publicKeys[provider] = {
            baseUrl: data.baseUrl || '',
            hasKey: !!(data.apiKey && data.apiKey.length > 0),
            maskedKey: data.apiKey ? data.apiKey.slice(0, 8) + '••••••••' : '',
            enabled: data.enabled || false,
        };
    }
    res.json(publicKeys);
});

// GET full shared keys (used internally by the app to make API calls)
app.get('/api/shared-keys/full', (req, res) => {
    const keys = loadSharedKeys();
    res.json(keys);
});

// POST save shared keys (admin saves from settings)
app.post('/api/shared-keys', (req, res) => {
    const { providerKeys, password } = req.body;

    // Require the admin password
    if (password !== '8492') {
        return res.status(403).json({ error: 'Invalid admin password' });
    }

    if (!providerKeys || typeof providerKeys !== 'object') {
        return res.status(400).json({ error: 'Invalid provider keys' });
    }

    // Merge: only update providers that have non-empty keys
    const existing = loadSharedKeys();
    for (const [provider, data] of Object.entries(providerKeys)) {
        if (data.apiKey && data.apiKey.trim()) {
            existing[provider] = {
                baseUrl: data.baseUrl || '',
                apiKey: data.apiKey.trim(),
                enabled: data.enabled !== false,
            };
        } else if (data.enabled === false && existing[provider]) {
            // Disable provider if explicitly disabled
            existing[provider].enabled = false;
        }
    }

    saveSharedKeys(existing);
    res.json({ success: true, message: 'Shared keys saved' });
});

// Proxy endpoint for API calls (avoids CORS issues)
app.post('/proxy', async (req, res) => {
    const { endpoint, method, headers, body } = req.body;

    console.log(`[Proxy] ${method} → ${endpoint}`);
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
    console.log(`\n🚀 Kairo running at http://localhost:${PORT}`);
    console.log(`   Proxy endpoint: http://localhost:${PORT}/proxy`);
    console.log(`   Shared Keys API: http://localhost:${PORT}/api/shared-keys\n`);
});
