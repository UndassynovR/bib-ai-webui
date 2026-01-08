// src/lib/i18n/index.ts
import en from './translations/en';
import ru from './translations/ru';
import kk from './translations/kk';

export type Locale = 'en' | 'ru' | 'kk';

export type TranslationKey = string;

export const translations = {
  en,
  ru,
  kk,
} as const;

export const availableLocales: Locale[] = ['en', 'ru', 'kk'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  kk: 'Қазақша',
};

// Helper to get nested translation value
export function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

// Helper to interpolate variables in translation strings
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key]?.toString() || match;
  });
}
