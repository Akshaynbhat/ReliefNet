import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage } from '../types';
import { translationService } from '../services/translationService';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (localStorage.getItem('reliefnet_lang') as SupportedLanguage) || 'en'
  );
  
  // State to force re-render when translations arrive
  const [, setTick] = useState(0);

  useEffect(() => {
    // Listen for cache updates from the translation service
    const unsub = translationService.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('reliefnet_lang', lang);
  };

  /**
   * The Translation Function (t)
   * 1. Returns cached version if available.
   * 2. Triggers async translation in the background if not cached.
   */
  const t = (text: string): string => {
    if (!text) return '';
    if (language !== 'en') {
      // Kick off background translation if missing
      translationService.translate(text, language);
      return translationService.getCached(text, language);
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};