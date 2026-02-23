import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Available Gemini models mapping.
 */
export const AVAILABLE_MODELS = {
  GEMINI_2_5_FLASH: "gemini-2.5-flash",
  GEMINI_2_5_PRO: "gemini-2.5-pro",
  GEMINI_3_0_FLASH: "gemini-3.0-flash",
  GEMINI_3_0_PRO: "gemini-3.0-pro",
} as const;

export type ModelName = typeof AVAILABLE_MODELS[keyof typeof AVAILABLE_MODELS];

/**
 * Returns an LLM instance based on the provided model name.
 * @param modelName - The name of the model to use (default: GEMINI_2_5_FLASH)
 * @returns An instance of ChatGoogleGenerativeAI
 */
export const getLLM = (modelName: ModelName = AVAILABLE_MODELS.GEMINI_2_5_FLASH) => {
  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
  });
};

// Keep the existing llm instance for backward compatibility
export const llm = getLLM();
