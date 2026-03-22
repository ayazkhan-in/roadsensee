import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "../config/env.js";

let geminiModel = null;

if (env.geminiApiKey) {
  const client = new GoogleGenerativeAI(env.geminiApiKey);
  geminiModel = client.getGenerativeModel({ model: env.geminiModelName });
}

export async function generateAiExplanation(prompt) {
  if (!geminiModel) {
    return "AI explanation unavailable because GEMINI_API_KEY is not configured.";
  }

  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "AI service is temporarily unavailable. Using fallback rule-based analysis.";
  }
}
