declare global {
  namespace App {
    interface Locals {
      userId?: string;
      user?: {
        id: string;
        email: string | null;
        name: string | null;
        is_guest: boolean;
      };
    }
  }
}

export {};
