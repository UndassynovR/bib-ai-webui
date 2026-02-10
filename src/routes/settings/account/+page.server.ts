// src/routes/settings/account/+page.server.ts (or wherever this page is located)
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  // Redirect to home if not logged in or if guest user
  if (!user || user.is_guest) {
    throw redirect(303, '/');
  }
  
  return {
    user
  };
};
