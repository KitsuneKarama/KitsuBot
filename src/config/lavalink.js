function parseBoolean(value, defaultValue = false) {
    if (value == null || value === '') return defaultValue;
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase().trim());
}

function parseNodesFromEnv() {
    const raw = process.env.LAVALINK_NODES?.trim();
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (e) {
        console.warn('❌ Failed to parse LAVALINK_NODES:', e.message);
        return null;
    }
}

export function getLavalinkNodes() {
    const nodes = parseNodesFromEnv();
    if (nodes?.length) {
        console.log(`✅ Loaded ${nodes.length} node(s) from LAVALINK_NODES`);
        return nodes;
    }

    const node = {
        identifier: process.env.LAVALINK_NAME || 'Main',
        name: process.env.LAVALINK_NAME || 'Main',
        host: process.env.LAVALINK_HOST || 'localhost',
        port: parseInt(process.env.LAVALINK_PORT) || 2333,
        password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
        secure: parseBoolean(process.env.LAVALINK_SECURE),
        retryAmount: 5,
        retryDelay: 4000,
    };

    console.log(`🔌 Lavalink Config:`);
    console.log(`   Host     : ${node.host}`);
    console.log(`   Port     : ${node.port}`);
    console.log(`   Secure   : ${node.secure}`);
    console.log(`   Password : ${node.password ? '••••••••' : 'None'}`);

    return [node];
}

export const lavalinkConfig = {
    nodes: getLavalinkNodes(),
    defaultSearchPlatform: process.env.LAVALINK_SEARCH_PLATFORM || 'ytmsearch',
    restVersion: 'v4',
};

export default lavalinkConfig;
