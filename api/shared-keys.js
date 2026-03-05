// Shared keys endpoint for Vercel (GET and POST)
// On Vercel, shared keys are stored via SHARED_KEYS environment variable (JSON string)
// Set this in Vercel Dashboard → Settings → Environment Variables

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Load keys from environment variable
    let keys = {};
    try {
        keys = JSON.parse(process.env.SHARED_KEYS || '{}');
    } catch (e) {
        console.error('[SharedKeys] Failed to parse SHARED_KEYS env var:', e.message);
    }

    if (req.method === 'GET') {
        // Return masked keys for public display
        const publicKeys = {};
        for (const [provider, data] of Object.entries(keys)) {
            publicKeys[provider] = {
                baseUrl: data.baseUrl || '',
                hasKey: !!(data.apiKey && data.apiKey.length > 0),
                maskedKey: data.apiKey ? data.apiKey.slice(0, 8) + '••••••••' : '',
                enabled: data.enabled || false,
            };
        }
        return res.json(publicKeys);
    }

    if (req.method === 'POST') {
        // On Vercel, env vars are read-only at runtime.
        // Return current keys as confirmation but note they can't be saved dynamically.
        return res.status(200).json({
            success: true,
            message: 'Shared keys are managed via Vercel environment variables. Update SHARED_KEYS in your Vercel dashboard.',
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
