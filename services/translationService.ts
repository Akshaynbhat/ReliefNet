
import { GoogleGenAI, Type } from "@google/genai";
import { SupportedLanguage } from '../types';

const LANG_MAP: Record<SupportedLanguage, string> = {
  en: 'English',
  kn: 'Kannada',
  hi: 'Hindi'
};

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'tr_' + Math.abs(hash).toString(36);
};

class TranslationService {
  private cache: Record<string, Record<string, string>> = {};
  private listeners: Set<() => void> = new Set();
  
  // Batching Logic
  private batchQueue: Map<string, string> = new Map(); // id -> original text
  private batchTimer: number | null = null;
  private isProcessing = false;
  private keyPrompted = false;

  constructor() {
    const saved = localStorage.getItem('reliefnet_translation_cache');
    if (saved) {
      try { this.cache = JSON.parse(saved); } catch (e) { this.cache = {}; }
    }
  }

  private saveToDisk() {
    localStorage.setItem('reliefnet_translation_cache', JSON.stringify(this.cache));
  }

  // Fixed: explicitly return void in the cleanup function to satisfy React useEffect destructor types
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  translate(text: string, lang: SupportedLanguage): string {
    if (!text || lang === 'en') return text;
    
    const id = getHash(text);
    
    // 1. Check Cache
    if (this.cache[id]?.[lang]) {
      return this.cache[id][lang];
    }

    // 2. Add to batch queue
    if (!this.batchQueue.has(id)) {
      this.batchQueue.set(id, text);
      this.scheduleBatch(lang);
    }

    return text; // Return original while waiting
  }

  private scheduleBatch(lang: SupportedLanguage) {
    if (this.batchTimer) window.clearTimeout(this.batchTimer);
    
    // Increased debounce to 800ms to ensure we catch ALL strings during page load
    this.batchTimer = window.setTimeout(() => {
      this.processBatch(lang);
    }, 800); 
  }

  private async processBatch(lang: SupportedLanguage) {
    if (this.isProcessing || this.batchQueue.size === 0) return;
    
    // Ensure we have a key, but don't spam the user
    if (!process.env.API_KEY) {
      const aistudio = (window as any).aistudio;
      if (aistudio && !this.keyPrompted) {
        this.keyPrompted = true;
        await aistudio.openSelectKey();
      }
      return; // Stop and wait for user to select a key
    }

    this.isProcessing = true;
    const currentBatch = Array.from(this.batchQueue.entries());
    this.batchQueue.clear();

    try {
      // Create fresh instance per call to ensure latest key is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const textsToTranslate = currentBatch.map(([_, text]) => text);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following list of strings into ${LANG_MAP[lang]}. 
        Return ONLY a JSON array of strings in the exact same order.
        Do not explain anything. 
        
        Strings: ${JSON.stringify(textsToTranslate)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const translatedArray = JSON.parse(response.text || '[]');

      if (Array.isArray(translatedArray)) {
        translatedArray.forEach((translatedText, index) => {
          if (index < currentBatch.length) {
            const [id] = currentBatch[index];
            if (!this.cache[id]) this.cache[id] = {};
            this.cache[id][lang] = translatedText;
          }
        });
        
        this.saveToDisk();
        this.notify();
      }
    } catch (e: any) {
      console.warn("Translation batch failed (likely quota). Will retry on next interaction.");
      // If we failed due to 429, we don't clear the queue so they can try again later
      // But for now, we just let it fail silently to not annoy the user.
    } finally {
      this.isProcessing = false;
      if (this.batchQueue.size > 0) {
        this.scheduleBatch(lang);
      }
    }
  }

  getCached(text: string, lang: SupportedLanguage): string {
    if (lang === 'en') return text;
    const id = getHash(text);
    return this.cache[id]?.[lang] || text;
  }
}

export const translationService = new TranslationService();
