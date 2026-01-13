import { SupportedLanguage } from '../types';

/**
 * Translation is DISABLED in the public version of ReliefNet.
 * Reason: uses paid AI APIs and should not be exposed publicly.
 * 
 * TODO:
 * - Re-enable via backend proxy
 * - Or restricted API key for private deployments
 */

class TranslationService {
  translate(text: string, _lang: SupportedLanguage): string {
    // Public build: no translation
    return text;
  }

  getCached(text: string, _lang: SupportedLanguage): string {
    return text;
  }

  subscribe() {
    return () => {};
  }
}

export const translationService = new TranslationService();
