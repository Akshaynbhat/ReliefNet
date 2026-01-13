import { GoogleGenAI } from "@google/genai";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateChatResponse = async (
  history: ChatMessage[],
  message: string
): Promise<string> => {
  // 1. API key check
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key missing");
    return "AI service is not configured. Please try again later.";
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    const systemInstruction = `
You are the ReliefNet AI Assistant.
Your goal is to help users report disasters, find safety information, and understand how to donate.
ReliefNet operates in the Bangalore region.
Be calm, empathetic, and concise.
If a user reports an emergency, advise them to contact local emergency services (112/100) immediately.
`;

    const contents = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return (
      response.text ||
      "I'm here to help, but I didn't receive a response. Please try again."
    );
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    const msg = error?.message || "";

    if (msg.includes("429") || msg.includes("quota")) {
      return "QUOTA_EXCEEDED";
    }

    if (msg.includes("403") || msg.includes("API_KEY")) {
      return "AUTH_ERROR";
    }

    return "I'm having trouble connecting right now. Please try again later.";
  }
};
