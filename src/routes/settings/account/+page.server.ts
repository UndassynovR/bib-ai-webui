// src/routes/settings/account/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect guests to login
  if (!locals.user || locals.user.is_guest) {
    throw redirect(302, '/');
  }

  // Pass user data including auth_type to the page
  return {
    user: {
      id: locals.user.id,
      email: locals.user.email,
      name: locals.user.name,
      is_guest: locals.user.is_guest,
      role: locals.user.role,
      auth_type: locals.user.auth_type // Important: include auth_type
    }
  };
};
