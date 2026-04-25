
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

type Locale = 'en' | 'es';

const translations: Record<Locale, Record<string, unknown>> = { 
  en: enTranslations as Record<string, unknown>, 
  es: esTranslations as Record<string, unknown> 
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const getNestedTranslation = (obj: Record<string, unknown>, key: string): string => {
  return key.split('.').reduce((o: unknown, i) => {
    if (o && typeof o === 'object' && i in (o as Record<string, unknown>)) {
      return (o as Record<string, unknown>)[i];
    }
    return undefined;
  }, obj) as string || key;
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    // Default language selection strategy
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') {
      setLocale('es');
    }
  }, []); // Empty dependency array ensures this runs only once on mount.

  const t = (key: string): string => {
    const translation = getNestedTranslation(translations[locale], key);
    return translation || key; // Fallback to key if not found.
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
