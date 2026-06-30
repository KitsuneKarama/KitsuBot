function parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const str = String(value).toLowerCase().trim();
    return ['true', '1', 'yes', 'on'].includes(str);
}

function parseNodesFromEnv() {
    const raw = process.env.LAVALINK_NODES?.trim();
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch (err) {
        console.warn('⚠️ Failed to parse LAVALINK_NODES JSON:', err.message);
        return null;
    }
}

export function getLavalinkNodes() {
    // Priority 1: Multiple nodes from JSON environment variable
    const fromJson = parseNodesFromEnv();
    if (fromJson?.length) {
        console.log(`✅ Loaded ${fromJson.length} Lavalink node(s) from LAVALINK_NODES`);
        return fromJson;
    }

    // Priority 2: Single node from individual environment variables
    const host = process.env.LAVALINK_HOST || 'localhost';
    const port = parseInt(process.env.LAVALINK_PORT, 10) || 2333;
    const password = process.env.LAVALINK_PASSWORD || 'youshallnotpass';
    const secure = parseBoolean(process.env.LAVALINK_SECURE, false);
    const name = process.env.LAVALINK_NAME || 'Main';

    console.log(`✅ Using single Lavalink node: ${host}:${port} (${secure ? 'wss' : 'ws'})`);

    return [{
        identifier: name,
        name,
        host,
        port,
        password,
        secure,
        retryAmount: parseInt(process.env.LAVALINK_RETRY_AMOUNT) || 5,
        retryDelay: parseInt(process.env.LAVALINK_RETRY_DELAY) || 3000,
    }];
}

export const lavalinkConfig = {
    nodes: getLavalinkNodes(),
    
    defaultSearchPlatform: process.env.LAVALINK_SEARCH_PLATFORM || 'ytmsearch',
    restVersion: process.env.LAVALINK_REST_VERSION || 'v4', // Lavalink v4 recommended
    
    // Additional recommended options
    resumeKey: process.env.LAVALINK_RESUME_KEY || 'titanbot-resume',
    resumeTimeout: parseInt(process.env.LAVALINK_RESUME_TIMEOUT) || 300,
    
    // Connection settings
    reconnectTimeout: parseInt(process.env.LAVALINK_RECONNECT_TIMEOUT) || 5000,
    maxReconnectAttempts: parseInt(process.env.LAVALINK_MAX_RECONNECTS) || 10,
};

export default lavalinkConfig;
