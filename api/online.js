/**
 * Online Tracking — Heartbeat
 * Frontend kirim ping tiap 20 detik
 */

const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();
const KEY = 'astacloud:chat:online';
const ONLINE_TIMEOUT = 60; // detik

function ok(res, data, status = 200) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(data);
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // ===== POST → kirim heartbeat =====
        if (req.method === 'POST') {
            const { user, action } = req.body || {};
            if (!user) return ok(res, { ok: false, why: 'user wajib' }, 400);

            const cleanUser = String(user).trim().substring(0, 20);

            // action = 'leave' → hapus dari online
            if (action === 'leave') {
                await redis.srem(KEY, cleanUser);
            } else {
                await redis.sadd(KEY, cleanUser);
            }

            const onlineUsers = await redis.smembers(KEY) || [];

            return ok(res, {
                ok: true,
                online: onlineUsers,
                onlineCount: onlineUsers.length
            });
        }

        // ===== GET → list online =====
        if (req.method === 'GET') {
            const onlineUsers = await redis.smembers(KEY) || [];
            return ok(res, {
                ok: true,
                online: onlineUsers,
                onlineCount: onlineUsers.length
            });
        }

        return ok(res, { ok: false, why: 'Method not allowed' }, 405);
    } catch (e) {
        return ok(res, { ok: false, why: e.message }, 500);
    }
};