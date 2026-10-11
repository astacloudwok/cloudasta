/**
 * Daily Limit pakai Upstash Redis
 * Reset otomatis jam 00:00 WIB (17:00 UTC)
 */

const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

// ====== CONFIG ======
const DAILY_LIMIT_GLOBAL = 5;    // Max 5 akun per hari (total)
const DAILY_LIMIT_PER_IP = 2;    // Max 2 akun per hari per IP
const DAILY_LIMIT_PER_EMAIL = 1; // Max 1 akun per email per hari

// Waktu reset: 00:00 WIB = 17:00 UTC (hari sebelumnya)
function getTodayWIB() {
    const now = new Date();
    // WIB = UTC+7
    const wibMs = now.getTime() + (7 * 60 * 60 * 1000);
    const wib = new Date(wibMs);
    return wib.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getSecondsUntilReset() {
    const now = new Date();
    const wibMs = now.getTime() + (7 * 60 * 60 * 1000);
    const wib = new Date(wibMs);
    const tomorrow = new Date(wib);
    tomorrow.setUTCHours(24, 0, 0, 0);
    const tomorrowWibMs = tomorrow.getTime() - (7 * 60 * 60 * 1000);
    return Math.max(60, Math.ceil((tomorrowWibMs - now.getTime()) / 1000));
}

// Key helper
const K = {
    total: (date) => `amprem:daily:${date}:total`,
    ip: (date, ip) => `amprem:daily:${date}:ip:${ip}`,
    email: (date, email) => `amprem:daily:${date}:email:${email.toLowerCase()}`
};

async function getStatus(ip) {
    const date = getTodayWIB();
    const [total, ipCount] = await Promise.all([
        redis.get(K.total(date)),
        redis.get(K.ip(date, ip))
    ]);
    const t = parseInt(total) || 0;
    const i = parseInt(ipCount) || 0;
    return {
        date,
        total: t,
        totalMax: DAILY_LIMIT_GLOBAL,
        sisa: Math.max(0, DAILY_LIMIT_GLOBAL - t),
        ipCount: i,
        ipMax: DAILY_LIMIT_PER_IP,
        resetAt: 'Besok 00:00 WIB',
        resetInSeconds: getSecondsUntilReset()
    };
}

async function checkLimit(ip, email) {
    const date = getTodayWIB();

    const [totalRaw, ipRaw, emailRaw] = await Promise.all([
        redis.get(K.total(date)),
        redis.get(K.ip(date, ip)),
        email ? redis.get(K.email(date, email)) : Promise.resolve(0)
    ]);

    const total = parseInt(totalRaw) || 0;
    const ipCount = parseInt(ipRaw) || 0;
    const emailCount = parseInt(emailRaw) || 0;

    // 1. Global limit
    if (total >= DAILY_LIMIT_GLOBAL) {
        return {
            ok: false,
            code: 'GLOBAL_LIMIT',
            why: `Batas harian tercapai (${DAILY_LIMIT_GLOBAL} akun/hari). Coba lagi besok ya 🌸`,
            resetAt: 'Besok 00:00 WIB',
            sisa: 0
        };
    }

    // 2. Per-IP limit
    if (ipCount >= DAILY_LIMIT_PER_IP) {
        return {
            ok: false,
            code: 'IP_LIMIT',
            why: `Kamu sudah dapat ${DAILY_LIMIT_PER_IP} akun hari ini. Tunggu besok ya 🪸`,
            resetAt: 'Besok 00:00 WIB',
            sisa: Math.max(0, DAILY_LIMIT_GLOBAL - total)
        };
    }

    // 3. Email limit
    if (email && emailCount >= DAILY_LIMIT_PER_EMAIL) {
        return {
            ok: false,
            code: 'EMAIL_LIMIT',
            why: `Email ini sudah dipakai hari ini. Pakai email lain atau tunggu besok 🌸`,
            resetAt: 'Besok 00:00 WIB',
            sisa: Math.max(0, DAILY_LIMIT_GLOBAL - total)
        };
    }

    return {
        ok: true,
        sisa: Math.max(0, DAILY_LIMIT_GLOBAL - total)
    };
}

async function consumeSlot(ip, email) {
    const date = getTodayWIB();
    const ttl = getSecondsUntilReset() + 60; // tambah buffer 60s

    const pipeline = redis.pipeline();
    pipeline.incr(K.total(date));
    pipeline.expire(K.total(date), ttl);
    pipeline.incr(K.ip(date, ip));
    pipeline.expire(K.ip(date, ip), ttl);

    if (email) {
        pipeline.incr(K.email(date, email));
        pipeline.expire(K.email(date, email), ttl);
    }

    await pipeline.exec();
    console.log(`[DAILY] Consumed slot for ${email} from ${ip} (${date})`);
}

module.exports = {
    getStatus,
    checkLimit,
    consumeSlot,
    DAILY_LIMIT_GLOBAL,
    DAILY_LIMIT_PER_IP,
    DAILY_LIMIT_PER_EMAIL
};