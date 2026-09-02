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

function imageToPart(dataUrl) {
  return { inlineData: { mimeType: "image/jpeg", data: dataUrl.split(",")[1] } };
}

function buildHistory(messages) {
  const prior = messages.slice(0, -1).filter((m) => (m.text && m.text.trim()) || m.images?.length || m.image);
  while (prior.length && prior[0].role !== "user") {
    prior.shift();
  }
  return prior.map((msg) => {
    const imgs = msg.images?.length ? msg.images : msg.image ? [msg.image] : [];
    return {
      role: msg.role === "user" ? "user" : "model",
      parts: imgs.length
        ? [{ text: msg.text || "Analyze these images" }, ...imgs.map(imageToPart)]
        : [{ text: msg.text || "" }],
    };
  });
}

function buildLastParts(last) {
  if (!last) return [{ text: "" }];
  const imgs = last.images?.length ? last.images : last.image ? [last.image] : [];
  return imgs.length
    ? [{ text: last.text || "Analyze these images" }, ...imgs.map(imageToPart)]
    : [{ text: last.text || "" }];
}

function isRateLimitError(err) {
  const msg = err?.message || "";
  return msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit");
}

function getRetryDelayMs(err, attempt) {
  const msg = err?.message || "";
  const match = msg.match(/"retryDelay":"(\d+)s"/);
  if (match) return parseInt(match[1], 10) * 1000 + 250;
  return Math.min(1000 * 2 ** attempt, 15000);
}

const MAX_RETRIES = 5;

async function withRetry(fn) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRateLimitError(err) || attempt === MAX_RETRIES) throw err;
      const delay = getRetryDelayMs(err, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export async function streamGeminiResponse(messages, systemPrompt = null, onChunk) {
  return withRetry(async () => {
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
      const finalResp = await result.response;
      full = finalResp.text() || "";
    }

    return full;
  });
}

export async function generateGeminiResponse(messages, systemPrompt = null) {
  return withRetry(async () => {
    const model = getModel(systemPrompt);
    const history = buildHistory(messages);
    const last = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(buildLastParts(last));
    return result.response.text();
  });
}

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
import { TOOL_DECLARATIONS, executeTool, TOOL_EXECUTING_LABELS } from "./tools/toolRegistry";

const MAX_TOOL_ROUNDS = 4;

function getModelWithTools(systemPrompt) {
  const genAI = getGenAI();
  const base = systemPrompt || DEFAULT_SYSTEM;
  // Critical: without this explicit clarification, attaching function
  // tools makes some Gemini responses treat the tool list as the
  // model's ENTIRE capability set, refusing normal conversation with
  // "I can only tell you the time/weather." The tools are an ADDITION
  // to full general-purpose conversation, never a restriction on it.
  const augmented = `${base}

You have two special tools available: one for the current time/date, and one for current weather. Use them ONLY when a question genuinely needs live, real-time data (e.g. "what time is it", "will it rain today"). For everything else — advice, explanations, career guidance, writing help, general knowledge, casual conversation — answer normally and fully using your own knowledge, exactly as you would with no tools at all. Never say your capabilities are "limited to" the tools; that is false and you must not claim it.`;

  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: augmented,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
  });
}

// Same conversational flow as streamGeminiResponse, but lets the model
// call real tools (time, weather, ...) instead of guessing. Since a
// function-call round-trip has to be a plain sendMessage (we need to
// inspect functionCalls() before deciding what happens next), only
// the FINAL turn is streamed — earlier tool-decision turns are
// invisible to the user by design, surfaced instead via onToolCall so
// the UI can show "EXECUTING — Checking weather...".
export async function streamGeminiResponseWithTools(messages, systemPrompt, onChunk, onToolCall) {
  return withRetry(async () => {
    const model = getModelWithTools(systemPrompt);
    const history = buildHistory(messages);
    const last = messages[messages.length - 1];
    const chat = model.startChat({ history });

    let parts = buildLastParts(last);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const result = await chat.sendMessage(parts);
      const calls = result.response.functionCalls?.() || [];

      if (!calls.length) {
        // No more tools needed — this is the real final answer. It's
        // already been generated non-streamed by sendMessage above,
        // so we reveal it progressively ourselves to keep the same
        // "streaming" feel as the rest of the app (same technique
        // already used for the instant Ghalib-bio/greeting replies).
        const text = result.response.text();
        const words = text.split(" ");
        let built = "";
        for (let i = 0; i < words.length; i++) {
          built += (i > 0 ? " " : "") + words[i];
          onChunk?.(built);
          if (i % 4 === 0) await new Promise((r) => setTimeout(r, 15));
        }
        return text;
      }

      // Model wants to call one or more tools before answering.
      const responseParts = [];
      for (const call of calls) {
        onToolCall?.(TOOL_EXECUTING_LABELS[call.name] || `Running ${call.name}...`);
        const output = await executeTool(call.name, call.args);
        responseParts.push({ functionResponse: { name: call.name, response: output } });
      }
      parts = responseParts;
    }

    throw new Error("Tool call loop did not resolve — please try again.");
  });
}