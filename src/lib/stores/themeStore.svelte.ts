// src/lib/stores/themeStore.svelte.ts
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

class ThemeStore {
  theme = $state<Theme>('system');
  actualTheme = $state<'light' | 'dark'>('light');
  private mediaQuery: MediaQueryList | null = null;
  private initialized = false;

  constructor() {
    if (browser) {
      // Load from localStorage as fallback
      const saved = localStorage.getItem('theme') as Theme;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        this.theme = saved;
      }
      
      this.applyTheme();
      
      // Listen for system theme changes
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.theme === 'system') {
          this.applyTheme();
        }
      });
    }
  }

  // Initialize with user's saved preference from database
  initialize(userTheme?: string) {
    if (this.initialized) return;
    this.initialized = true;

    if (userTheme && ['light', 'dark', 'system'].includes(userTheme)) {
      this.theme = userTheme as Theme;
      if (browser) {
        localStorage.setItem('theme', userTheme);
        this.applyTheme();
      }
    }
  }

  async setTheme(newTheme: Theme) {
    this.theme = newTheme;
    
    if (browser) {
      localStorage.setItem('theme', newTheme);
      this.applyTheme();
      
      // Save to database
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        });
        
        if (!response.ok) {
          console.error('Failed to save theme preference');
        }
      } catch (err) {
        console.error('Error saving theme:', err);
      }
    }
  }

  private applyTheme() {
    if (!browser) return;

    let effectiveTheme: 'light' | 'dark';

    if (this.theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effectiveTheme = this.theme;
    }

    this.actualTheme = effectiveTheme;

    // Apply to document
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

export const themeStore = new ThemeStore();
