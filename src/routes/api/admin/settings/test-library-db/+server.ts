import type { RequestHandler } from './$types';
import sql from 'mssql';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { host, port, database, user, password } = await request.json();

    if (!host || !database || !user || !password) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const config: sql.config = {
      server: host,
      port: parseInt(port) || 1433,
      database,
      user,
      password,
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    };

    try {
      const pool = await sql.connect(config);
      await pool.request().query('SELECT 1');
      await pool.close();

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return new Response(JSON.stringify({ error: 'Database connection failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Database test error:', error);
    return new Response(JSON.stringify({ error: 'Connection failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
