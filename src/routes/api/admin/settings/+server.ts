import type { RequestHandler } from './$types';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { reloadConfig } from '$lib/server/config';

const SETTINGS_DIR = '/app/data/settings';
const SETTINGS_FILE = join(SETTINGS_DIR, 'config.json');
const CERT_FILE = join(SETTINGS_DIR, 'ldap-cert.crt');

export const GET: RequestHandler = async () => {
    try {
        await mkdir(SETTINGS_DIR, { recursive: true });
        const data = await readFile(SETTINGS_FILE, 'utf-8');
        return new Response(data, {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({}), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        
        // Extract the cert specifically to handle it as a file
        const certFile = formData.get('LDAP_CERTIFICATE') as File | null;
        
        // Capture everything else directly into an UPPERCASE object
        const settings: Record<string, string> = {};
        for (const [key, value] of formData.entries()) {
            if (key !== 'LDAP_CERTIFICATE' && typeof value === 'string') {
                settings[key] = value;
            }
        }

        await mkdir(SETTINGS_DIR, { recursive: true });
        
        // Save the JSON
        await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));

        // Save the cert if provided
        if (certFile && certFile.size > 0) {
            const certBuffer = Buffer.from(await certFile.arrayBuffer());
            await writeFile(CERT_FILE, certBuffer);
        }

        // Wipe the server-side cache so changes are immediate
        reloadConfig();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Save error:', error);
        return new Response(JSON.stringify({ error: 'Failed to save settings' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
