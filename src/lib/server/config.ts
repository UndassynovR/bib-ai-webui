import { readFile } from 'fs/promises';
import { join } from 'path';

const SETTINGS_FILE = '/app/data/settings/config.json';

// Simple in-memory cache
let cachedConfig: Record<string, string> | null = null;

export async function getAppConfig() {
    // If we have it in memory, return it immediately
    if (cachedConfig) return cachedConfig;

    try {
        const data = await readFile(SETTINGS_FILE, 'utf-8');
        cachedConfig = JSON.parse(data);
        return cachedConfig!;
    } catch (error) {
        console.warn('Config file not found, falling back to process.env');
        return process.env as Record<string, string>;
    }
}

// Call this from your POST handler after saving to clear the cache
export function reloadConfig() {
    cachedConfig = null;
}
