// Full shared keys endpoint (returns actual keys for API calls)
// Used internally by the app to make API calls with shared keys

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Load keys from environment variable
    let keys = {};
    try {
        keys = JSON.parse(process.env.SHARED_KEYS || '{}');
    } catch (e) {
        console.error('[SharedKeys] Failed to parse SHARED_KEYS env var:', e.message);
    }

    return res.json(keys);
};
