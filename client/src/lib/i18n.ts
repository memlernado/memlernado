import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en/translation.json';
import es from '../locales/es/translation.json';
import pl from '../locales/pl/translation.json';
import ru from '../locales/ru/translation.json';
import he from '../locales/he/translation.json';

// Translation resources
const resources = {
  en: {
    translation: en
  },
  es: {
    translation: es
  },
  pl: {
    translation: pl
  },
  ru: {
    translation: ru
  },
  he: {
    translation: he
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      // Check localStorage first for user preference
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Ensure i18n is ready before components render
    initImmediate: false,
  });

// RTL languages
const rtlLanguages = ['he', 'ar', 'fa', 'ur'];

// Ensure i18n is ready
i18n.on('initialized', () => {
  console.log('i18n initialized with language:', i18n.language);
  updateDocumentDirection(i18n.language);
});

i18n.on('languageChanged', (lng) => {
  updateDocumentDirection(lng);
});

function updateDocumentDirection(language: string) {
  const isRTL = rtlLanguages.includes(language);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
}

export default i18n;
