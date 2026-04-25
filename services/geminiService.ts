
import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getMaintenanceAdvice(taskTitle: string, description: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `As an expert property manager, provide quick advice (max 100 words) for this maintenance task: ${taskTitle}. Description: ${description}. Focus on cost efficiency and safety.` }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not retrieve automatic advice at this time.";
  }
}

export async function analyzeAccounting(data: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `Analyze the following accounting data from a property management business and detect anomalies or suggest financial improvements. Data: ${data}. Respond concisely and professionally in English.` }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error analyzing accounting data.";
  }
}
