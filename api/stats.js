const { getStatus } = require('../lib/daily');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
        const status = await getStatus(ip);
        return res.json({ ok: true, ...status });
    } catch (e) {
        return res.status(500).json({ ok: false, why: e.message });
    }
};