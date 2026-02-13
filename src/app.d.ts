// src/app.d.ts
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      userId?: string;
      user?: {
        id: string;
        email: string | null;
        name: string | null;
        is_guest: boolean;
        role?: string;
        auth_type?: 'local' | 'ldap'; // Add auth_type to user interface
      };
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
