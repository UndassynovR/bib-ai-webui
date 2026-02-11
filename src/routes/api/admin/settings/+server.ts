import type { RequestHandler } from './$types';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

const SETTINGS_DIR = '/app/data/settings';
const SETTINGS_FILE = join(SETTINGS_DIR, 'config.json');
const CERT_FILE = join(SETTINGS_DIR, 'ldap-cert.crt');

export const GET: RequestHandler = async () => {
  try {
    await mkdir(SETTINGS_DIR, { recursive: true });
    
    const data = await readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);

    return new Response(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Return empty settings if file doesn't exist
    return new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    const settings = {
      openaiKey: formData.get('openaiKey') as string,
      ldapUrl: formData.get('ldapUrl') as string,
      ldapBaseDn: formData.get('ldapBaseDn') as string,
      ldapAdminLogin: formData.get('ldapAdminLogin') as string,
      ldapAdminPassword: formData.get('ldapAdminPassword') as string,
      libraryDbHost: formData.get('libraryDbHost') as string,
      libraryDbPort: formData.get('libraryDbPort') as string,
      libraryDbName: formData.get('libraryDbName') as string,
      libraryDbUser: formData.get('libraryDbUser') as string,
      libraryDbPassword: formData.get('libraryDbPassword') as string
    };

    const certFile = formData.get('ldapCertificate') as File | null;

    // Ensure directory exists
    await mkdir(SETTINGS_DIR, { recursive: true });

    // Save settings
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));

    // Save certificate if provided
    if (certFile) {
      const certContent = await certFile.text();
      await writeFile(CERT_FILE, certContent);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to save settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
