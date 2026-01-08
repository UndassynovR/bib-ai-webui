// src/lib/stores/i18nStore.svelte.ts
import { browser } from '$app/environment';
import { translations, getNestedValue, interpolate, type Locale } from '$lib/i18n';

type LanguageSetting = 'auto' | Locale;

// Extend window type to include our global variables
declare global {
  interface Window {
    __INITIAL_LOCALE__?: Locale;
    __INITIAL_LANGUAGE_SETTING__?: LanguageSetting;
  }
}

class I18nStore {
  locale = $state<Locale>('en');
  setting = $state<LanguageSetting>('auto');
  private initialized = false;

  constructor() {
    if (browser) {
      // Use the globally set locale from app.html if available
      if (window.__INITIAL_LOCALE__) {
        this.locale = window.__INITIAL_LOCALE__;
      }
      if (window.__INITIAL_LANGUAGE_SETTING__) {
        this.setting = window.__INITIAL_LANGUAGE_SETTING__;
      }
      
      // Fallback: Load from localStorage if globals aren't set
      if (!window.__INITIAL_LOCALE__) {
        const savedSetting = localStorage.getItem('language') as LanguageSetting;
        if (savedSetting && this.isValidLanguageSetting(savedSetting)) {
          this.setting = savedSetting;
        }
        this.applyLocale();
      }
      
      // Remove loading class to show content now that locale is set
      document.documentElement.classList.remove('loading');
    }
  }

  // Initialize with user's saved preference from database
  initialize(userLanguage?: string) {
    if (this.initialized) return;
    this.initialized = true;

    // Only update if the database value differs from what we already loaded
    if (userLanguage && 
        this.isValidLanguageSetting(userLanguage) && 
        userLanguage !== this.setting) {
      this.setting = userLanguage as LanguageSetting;
      if (browser) {
        localStorage.setItem('language', userLanguage);
        this.applyLocale();
      }
    }
  }

  async setLanguage(newLanguage: LanguageSetting) {
    this.setting = newLanguage;
    
    if (browser) {
      localStorage.setItem('language', newLanguage);
      this.applyLocale();
      
      // Save to database
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLanguage }),
        });
        
        if (!response.ok) {
          console.error('Failed to save language preference');
        }
      } catch (err) {
        console.error('Error saving language:', err);
      }
    }
  }

  private applyLocale() {
    if (!browser) return;

    let effectiveLocale: Locale;

    if (this.setting === 'auto') {
      effectiveLocale = this.detectBrowserLocale();
    } else {
      effectiveLocale = this.setting;
    }

    // This assignment triggers Svelte's reactivity
    this.locale = effectiveLocale;

    // Set HTML lang attribute
    document.documentElement.lang = effectiveLocale;
  }

  private detectBrowserLocale(): Locale {
    if (!browser) return 'en';

    const browserLang = navigator.language.toLowerCase();
    
    // Check for exact matches or language family
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('kk')) return 'kk';
    
    // Default to English
    return 'en';
  }

  private isValidLanguageSetting(value: string): boolean {
    return value === 'auto' || value === 'en' || value === 'ru' || value === 'kk';
  }

  // Translation function
  t(key: string, vars?: Record<string, string | number>): string {
    const translation = getNestedValue(translations[this.locale], key);
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in locale: ${this.locale}`);
      // Fallback to English
      const fallback = getNestedValue(translations.en, key);
      return fallback ? interpolate(fallback, vars) : key;
    }
    
    return interpolate(translation, vars);
  }

  // Helper for getting current translations object
  get currentTranslations() {
    return translations[this.locale];
  }
}

export const i18n = new I18nStore();
