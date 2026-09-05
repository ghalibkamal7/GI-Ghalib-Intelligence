import { GoogleGenerativeAI } from "@google/generative-ai";
import { getLanguageLabel } from "../utils/languages";

// A separate, minimal Gemini client (same SDK, same API key as the
// main chat) rather than importing from gemini.js — keeps this
// feature isolated so nothing here can accidentally affect the main
// chat's model config, and vice versa.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function getModel() {
  if (!API_KEY) throw new Error("Missing Gemini API key.");
  const genAI = new GoogleGenerativeAI(API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

function isRetryable(err) {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("429") || msg.includes("quota") || msg.includes("503") || msg.includes("overloaded");
}

async function withRetry(fn, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (!isRetryable(err) || i === retries) throw err;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    }
  }
}

/**
 * Provider-agnostic translation call. Swapping to a different
 * translation provider later means changing only this function's
 * internals — every caller just gets back { translation, detectedLanguageCode }.
 *
 * @param {string} text
 * @param {string} sourceCode - a language code from languages.js, or "auto"
 * @param {string} targetCode - a language code from languages.js
 */
export async function translateText(text, sourceCode, targetCode) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Nothing to translate.");

  const targetLabel = getLanguageLabel(targetCode);
  const sourceLabel = sourceCode === "auto" ? null : getLanguageLabel(sourceCode);

  const prompt = `Translate the text below${sourceLabel ? ` from ${sourceLabel}` : ""} into ${targetLabel}.
Return ONLY a raw JSON object, no markdown fences, in exactly this shape:
{"detectedLanguage": "<ISO 639-1 code of the ORIGINAL text's language, e.g. en, hi, es>", "translation": "<the translated text>"}

Text: ${JSON.stringify(trimmed)}`;

  return withRetry(async () => {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Translation service returned an unexpected format.");
    }
    if (!parsed.translation) throw new Error("Translation failed — please try again.");
    return {
      translation: parsed.translation,
      detectedLanguageCode: parsed.detectedLanguage || sourceCode,
    };
  });
}
/**
 * For TALK mode: given two known languages in the conversation, detect
 * which one the speaker just used and translate into the OTHER one —
 * in a single Gemini call, so direction-switching costs no extra
 * round trip.
 */
export async function translateForConversation(text, lang1Code, lang2Code) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Nothing to translate.");

  const lang1Label = getLanguageLabel(lang1Code);
  const lang2Label = getLanguageLabel(lang2Code);

  const prompt = `This is a live bilingual conversation between two people, one speaking ${lang1Label} and the other speaking ${lang2Label}.
Someone just said the text below. Detect whether it's in ${lang1Label} or ${lang2Label} (if genuinely neither, pick whichever is closer), then translate it into the OTHER language.
Return ONLY a raw JSON object, no markdown fences, in exactly this shape:
{"detectedLanguage": "${lang1Code} or ${lang2Code}", "translation": "<translated text in the other language>"}

Text: ${JSON.stringify(trimmed)}`;

  return withRetry(async () => {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Translation service returned an unexpected format.");
    }
    if (!parsed.translation) throw new Error("Translation failed — please try again.");
    const detected = parsed.detectedLanguage === lang2Code ? lang2Code : lang1Code;
    return {
      translation: parsed.translation,
      detectedLanguageCode: detected,
      targetLanguageCode: detected === lang1Code ? lang2Code : lang1Code,
    };
  });
}