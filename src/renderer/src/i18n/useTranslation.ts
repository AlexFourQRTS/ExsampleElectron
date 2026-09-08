/**
 * useTranslation hook for i18n support
 * Supports nested keys with dot notation: "common.delete"
 */

import { useCallback } from 'react';
import en from './locales/en.json';

type Translations = typeof en;

const translations: Record<string, Translations> = {
  en,
};

export const useTranslation = (lang: string = 'en') => {
  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let value: unknown = translations[lang] || translations.en;

      for (const k of keys) {
        if (typeof value === 'object' && value !== null) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key; // Fallback if key not found
        }
      }

      return typeof value === 'string' ? value : key;
    },
    [lang]
  );

  return { t };
};
