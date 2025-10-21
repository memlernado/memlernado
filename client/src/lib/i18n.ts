import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en/translation.json';
import es from '../locales/es/translation.json';
import pl from '../locales/pl/translation.json';

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

// Ensure i18n is ready
i18n.on('initialized', () => {
  console.log('i18n initialized with language:', i18n.language);
});

export default i18n;
