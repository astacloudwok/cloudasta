/**
 * Astacloud Config
 * Semua endpoint backend dipanggil dari sini.
 * Kalau pindah server, cuma ganti API_BASE.
 */

window.ASTACLOUD_CONFIG = {
    // ═══════════════════════════════════════════
    // BACKEND (Pterodactyl)
    // ═══════════════════════════════════════════
    API_BASE: 'https://api.astamotion.my.id',

    // Endpoint mapping
    ENDPOINTS: {
        HEALTH: '/api/health',
        STATS: '/stats',
        SEND: '/send',
        VERIFY: '/verify',
        WS: '/ws'
    },

    // ═══════════════════════════════════════════
    // SITE
    // ═══════════════════════════════════════════
    SITE_URL: 'https://asta.astamotion.my.id',

    // ═══════════════════════════════════════════
    // INFO
    // ═══════════════════════════════════════════
    INFO: {
        DEVELOPER: 'Imran',
        VERSION: '1.0.0',
        DEFAULT_LANG: 'id'
    },

    // ═══════════════════════════════════════════
    // SOCIAL MEDIA
    // ═══════════════════════════════════════════
    SOCIAL: {
        tiktok1: 'https://tiktok.com/@imxxxzzz',
        tiktok2: 'https://tiktok.com/@astacloud2',
        waChannel: 'https://whatsapp.com/channel/0029VbCdCFkI1rceYd2vik31',
        waContact: 'https://wa.me/62882019782087'
    }
};