import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import logger from "./logger";

/**
 * Available Gemini models mapping.
 */

type GetLLMProps = {
  model:
    | "llama-3.3-70b-versatile"
    | "meta-llama/llama-4-maverick-17b-128e-instruct"
    | "meta-llama/llama-4-scout-17b-16e-instruct"
    | "meta-llama/llama-guard-4-12b"
    | "moonshotai/kimi-k2-instruct"
    | "openai/gpt-oss-120b"
    | "openai/gpt-oss-20b"
    | "qwen/qwen3-32b"
    | "gemini-2.5-flash";
  provider: "google" | "groq";
};

/**
 * Returns an LLM instance based on the provided model name.
 * @param modelName - The name of the model to use (default: GEMINI_2_5_FLASH)
 * @returns An instance of ChatGoogleGenerativeAI
 */
export const getLLM = (options: GetLLMProps) => {
  if (options.provider === "google") {
    logger.info("Using the gemini");
    return new ChatGoogleGenerativeAI({
      model: options.model,
      apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
    });
  }
  logger.info("Using the groq");
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: options.model || "openai/gpt-oss-20b",
  });
};

// Keep the existing llm instance for backward compatibility

export const llm =
  process.env.LLM_PROVIDER === "google"
    ? getLLM({ model: "gemini-2.5-flash", provider: "google" })
    : getLLM({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        provider: "groq",
      });
