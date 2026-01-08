import { GoogleGenAI } from "@google/genai";

/**
 * Generates a chat response using the Gemini 3 Flash model.
 * Implements robust key handling and specific quota error catching.
 */
export const generateChatResponse = async (history: {role: 'user' | 'model', text: string}[], message: string): Promise<string> => {
  try {
    const aistudio = (window as any).aistudio;
    
    // 1. Mandatory API Key Check
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
      }
    }

    // 2. Initialize fresh for current key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `You are the ReliefNet AI Assistant. 
    Your goal is to help users report disasters, find safety information, and understand how to donate.
    ReliefNet operates in the Bangalore region. Be calm, empathetic, and concise. 
    If a user reports an emergency, advise them to contact local emergency services (112/100) immediately.`;

    const contents: any[] = [];
    let lastRole: string | null = null;

    for (const h of history) {
      if (h.role === 'user' && (lastRole === null || lastRole === 'model')) {
        contents.push({ role: 'user', parts: [{ text: h.text }] });
        lastRole = 'user';
      } else if (h.role === 'model' && lastRole === 'user') {
        contents.push({ role: 'model', parts: [{ text: h.text }] });
        lastRole = 'model';
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm here to help, but I didn't receive a response. Could you try asking that again?";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMsg = error.message || "";
    
    // 429 Quota Error
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      return "QUOTA_EXCEEDED";
    }

    // 403/Unauthorized/Invalid Key
    if (errorMsg.includes('403') || errorMsg.includes('API_KEY') || errorMsg.includes('not found')) {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.openSelectKey === 'function') {
        await aistudio.openSelectKey();
      }
      return "AUTH_ERROR";
    }

    return "I'm having a bit of trouble connecting to my service. Please check your internet connection and ensure a valid API key is selected.";
  }
};