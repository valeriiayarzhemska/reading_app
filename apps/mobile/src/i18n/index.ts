import './intl-polyfills';

import { initReactI18next } from 'react-i18next';

import { getLocales } from 'expo-localization';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInstance } from 'i18next';

import en from './locales/en';
import uk from './locales/uk';

export const i18n = createInstance();

export const LANGUAGES = ['en', 'uk'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'language';

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;

  return code === 'uk' ? 'uk' : 'en';
}

// Synchronous, at import time: components can call useTranslation() on their
// very first render. The saved choice is applied later by loadSavedLanguage().
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uk: { translation: uk },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  initAsync: false,
  interpolation: {
    // React already escapes rendered strings
    escapeValue: false,
  },
});

export async function loadSavedLanguage(): Promise<void> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);

  if (isLanguage(saved) && saved !== i18n.language) {
    await i18n.changeLanguage(saved);
  }
}

export async function setLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(STORAGE_KEY, language);
}

export function currentLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : 'en';
}
