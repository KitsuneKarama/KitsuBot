import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

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

function parseNodesPayload(parsed) {
    if (Array.isArray(parsed)) {
        return parsed;
    }
    if (Array.isArray(parsed?.nodes)) {
        return parsed.nodes;
    }
    return null;
}

function loadNodesFromFile() {
    const nodesFile = process.env.LAVALINK_NODES_FILE?.trim()
        || path.join(projectRoot, 'lavalink', 'nodes.json');

    if (!existsSync(nodesFile)) {
        return null;
    }

    try {
        const parsed = JSON.parse(readFileSync(nodesFile, 'utf8'));
        return parseNodesPayload(parsed);
    } catch {
        return null;
    }
}

export function getLavalinkNodes() {
    const nodes = parseNodesFromEnv();
    if (nodes?.length) {
        console.log(`✅ Loaded ${nodes.length} node(s) from LAVALINK_NODES`);
        return nodes;
    }

    const fromFile = loadNodesFromFile();
    if (fromFile?.length) {
        return fromFile;
    }

    const host = process.env.LAVALINK_HOST || 'localhost';
    const port = Number(process.env.LAVALINK_PORT || 2333);
    const password = process.env.LAVALINK_PASSWORD || 'youshallnotpass';
    const secure = parseBoolean(process.env.LAVALINK_SECURE, false);

    return [{
        host,
        port,
        password,
        secure,
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
