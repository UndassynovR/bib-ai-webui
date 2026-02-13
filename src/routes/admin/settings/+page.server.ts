// Better solution: Use SvelteKit form actions instead of fetch

// src/routes/admin/settings/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CONFIG_PATH = '/app/data/settings/config.json';
const CERT_FILE_PATH = '/app/data/settings/ldap-cert.crt';

async function ensureConfigDir() {
  const dir = path.dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function readConfig() {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return {};
    }
    const data = await readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read config:', error);
    return {};
  }
}

async function writeConfig(config: any) {
  await ensureConfigDir();
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const config = await readConfig();
  return { config };
};

export const actions = {
  save: async ({ request, locals }) => {
    console.log('[FormAction] Save settings action called');
    
    // Check if user is admin
    if (!locals.user || locals.user.role !== 'admin') {
      return fail(403, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      console.log('[FormAction] Form data keys:', Array.from(formData.keys()));
      
      const config: any = {};
      
      // Extract all non-file fields
      for (const [key, value] of formData.entries()) {
        if (key !== 'LDAP_CERTIFICATE' && typeof value === 'string') {
          config[key] = value;
        }
      }
      
      // Handle LDAP certificate file
      const certFile = formData.get('LDAP_CERTIFICATE');
      if (certFile && certFile instanceof File && certFile.size > 0) {
        console.log('[FormAction] Processing certificate:', certFile.name);
        await ensureConfigDir();
        const certBuffer = await certFile.arrayBuffer();
        await writeFile(CERT_FILE_PATH, Buffer.from(certBuffer));
        console.log('[FormAction] Certificate saved');
      }
      
      // Write config
      await writeConfig(config);
      console.log('[FormAction] Config saved successfully');
      
      return { success: true };
    } catch (error) {
      console.error('[FormAction] Error saving settings:', error);
      return fail(500, { error: 'Failed to save settings' });
    }
  }
} satisfies Actions;

