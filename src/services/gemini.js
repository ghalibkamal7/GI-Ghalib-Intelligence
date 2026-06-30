import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const DEFAULT_SYSTEM = `You are GI (pronounced "Gee Eye", short for Ghalib Intelligence), a smart and helpful assistant.
Always refer to yourself as GI — never as "AI Assistant" or generic "AI".
If the user writes "Gee Eye", "G.I.", "Ji AI", or similar phonetic spellings, understand that they mean "GI" (you).
Be helpful, accurate, and concise.`;

function getGenAI() {
  if (!API_KEY) {
    throw new Error("Missing Gemini API key. Check VITE_GEMINI_API_KEY in your .env file.");
  }
  return new GoogleGenerativeAI(API_KEY);
}

function getModel(systemPrompt) {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt || DEFAULT_SYSTEM,
  });
}

// Gemini SDK requires history to start with a "user" turn.
// Build it from all messages EXCEPT the very last one (which we send separately),
// and drop a stray leading "model" turn if present (e.g. an empty placeholder).
function buildHistory(messages) {
  const prior = messages.slice(0, -1).filter((m) => (m.text && m.text.trim()) || m.image);
  while (prior.length && prior[0].role !== "user") {
    prior.shift();
  }
  return prior.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: msg.image
      ? [
          { text: msg.text || "Analyze this image" },
          { inlineData: { mimeType: "image/jpeg", data: msg.image.split(",")[1] } },
        ]
      : [{ text: msg.text || "" }],
  }));
}

function buildLastParts(last) {
  if (!last) return [{ text: "" }];
  return last.image
    ? [
        { text: last.text || "Analyze this image" },
        { inlineData: { mimeType: "image/jpeg", data: last.image.split(",")[1] } },
      ]
    : [{ text: last.text || "" }];
}

// ── Streaming ─────────────────────────────────────────────
export async function streamGeminiResponse(messages, systemPrompt = null, onChunk) {
  const model = getModel(systemPrompt);
  const history = buildHistory(messages);
  const last = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const parts = buildLastParts(last);

  const result = await chat.sendMessageStream(parts);

  let full = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      onChunk(full);
    }
  }

  if (!full) {
    // Stream completed but produced nothing — fall back to the
    // aggregated response object, which sometimes has the text
    // even when individual chunks did not.
    const finalResp = await result.response;
    full = finalResp.text() || "";
  }

  return full;
}

// ── Non-streaming fallback ────────────────────────────────
export async function generateGeminiResponse(messages, systemPrompt = null) {
  const model = getModel(systemPrompt);
  const history = buildHistory(messages);
  const last = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(buildLastParts(last));
  return result.response.text();
}

// ── Smart suggestions ─────────────────────────────────────
export async function generateSuggestions(lastMsg) {
  if (!lastMsg) return [];
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Based on this response from GI, generate exactly 3 short follow-up questions a student might ask next.
Return ONLY a JSON array of 3 strings. No markdown, no explanation.
Response: "${lastMsg.slice(0, 300)}"`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}