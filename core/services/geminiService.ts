
import { GoogleGenAI } from "@google/genai";
import { logger } from '../lib/logger.ts';

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

const handleError = (error: unknown, correlationId?: string, operation?: string) => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      logger.warn(`Gemini API Quota Exceeded in ${operation}`, {
        correlationId,
      });
      return `Service temporarily unavailable due to API quota limits. Please try again later.`;
    } else {
      logger.error(`Gemini API Error in ${operation}`, {
        correlationId,
        error: errorMessage,
      });
      return `An error occurred during ${operation}. Please check logs for Correlation ID: ${correlationId}.`;
    }
};

export async function getMaintenanceAdvice(taskTitle: string, description: string, correlationId: string) {
  const operation = 'getMaintenanceAdvice';
  logger.info('Starting operation', { correlationId, operation, taskTitle });

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `As an expert property manager, provide quick advice (max 100 words) for this maintenance task: ${taskTitle}. Description: ${description}. Focus on cost efficiency and safety.` }] }],
    });
    logger.info('Operation successful', { correlationId, operation });
    return response.text;
  } catch (error) {
    return handleError(error, correlationId, operation);
  }
}

export async function analyzeAccounting(data: string, correlationId: string) {
  const operation = 'analyzeAccounting';
  logger.info('Starting operation', { correlationId, operation });

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `Analyze the following accounting data from a property management business and detect anomalies or suggest financial improvements. Data: ${data}. Respond concisely and professionally in English.` }] }],
    });
    logger.info('Operation successful', { correlationId, operation });
    return response.text;
  } catch (error) {
    return handleError(error, correlationId, operation);
  }
}

export type ConnectionStatus = 'ok' | 'error' | 'quota_exceeded';

export async function checkApiConnection(correlationId: string): Promise<ConnectionStatus> {
  const operation = 'checkApiConnection';
  logger.info('Starting operation', { correlationId, operation });

  try {
    const ai = getAI();
    // Using a structured Content object and a slightly more substantial prompt
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: 'System check: respond with "OK".' }] }],
    });
    logger.info('Operation successful', { correlationId, operation });
    return 'ok'; // Success
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      logger.warn(`Gemini API Quota Exceeded in ${operation}`, {
        correlationId,
      });
      return 'quota_exceeded';
    } else {
      logger.error(`Gemini API Error in ${operation}`, {
        correlationId,
        error: errorMessage,
      });
      return 'error';
    }
  }
}
