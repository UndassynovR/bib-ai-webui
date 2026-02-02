import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;

  // Not logged in
  if (!user) {
	console.log('User is not logged in');
    throw redirect(302, '/');
  }

  // Guests are never admins
  if (user.is_guest) {
	console.log('User is guest');
    throw redirect(302, '/');
  }

  // Role-based access
  if (user.role !== 'admin') {
	console.log('User is not an admin: ', user.role);
    throw redirect(302, '/');
  }

  return {
    user
  };
};
