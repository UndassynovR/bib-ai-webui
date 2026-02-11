import type { RequestHandler } from './$types';
import { Client } from 'ldapts';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const url = formData.get('url') as string;
    const baseDn = formData.get('baseDn') as string;
    const adminLogin = formData.get('adminLogin') as string;
    const adminPassword = formData.get('adminPassword') as string;
    const certFile = formData.get('certificate') as File | null;

    if (!url || !baseDn || !adminLogin || !adminPassword) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let tlsOptions = {};

    if (certFile) {
      const certContent = await certFile.text();
      tlsOptions = {
        ca: [certContent]
      };
    }

    const client = new Client({
      url,
      tlsOptions
    });

    try {
      await client.bind(adminLogin, adminPassword);
      
      // Try a simple search to verify connection
      await client.search(baseDn, {
        scope: 'base',
        filter: '(objectClass=*)'
      });

      await client.unbind();

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (ldapError) {
      console.error('LDAP connection error:', ldapError);
      return new Response(JSON.stringify({ error: 'LDAP connection failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('LDAP test error:', error);
    return new Response(JSON.stringify({ error: 'Connection failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
