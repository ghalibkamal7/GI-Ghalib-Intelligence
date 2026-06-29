import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const DEFAULT_SYSTEM = `You are GI (Ghalib Intelligence), a smart and helpful GI Assistant.
Always refer to yourself as GI or GI Assistant — never as AI Assistant or AI.
Be helpful, accurate, and concise.`;

function getModel(systemPrompt) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt || DEFAULT_SYSTEM,
  });
}

function buildHistory(messages) {
  return messages.slice(0, -1).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: msg.image
      ? [
          { text: msg.text || "Analyze this image" },
          { inlineData: { mimeType: "image/jpeg", data: msg.image.split(",")[1] } },
        ]
      : [{ text: msg.text || "" }],
  }));
}

export async function streamGeminiResponse(messages, systemPrompt = null, onChunk) {
  const model = getModel(systemPrompt);
  const history = buildHistory(messages);
  const last = messages[messages.length - 1];
  const chat = model.startChat({ history });
  const parts = last.image
    ? [
        { text: last.text || "Analyze this image" },
        { inlineData: { mimeType: "image/jpeg", data: last.image.split(",")[1] } },
      ]
    : [{ text: last.text || "" }];
  const result = await chat.sendMessageStream(parts);
  let full = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) { full += text; onChunk(full); }
  }
  return full;
}

export async function generateGeminiResponse(messages, systemPrompt = null) {
  const model = getModel(systemPrompt);
  const history = buildHistory(messages);
  const last = messages[messages.length - 1];
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(last.text || "");
  return result.response.text();
}

export async function generateSuggestions(lastMsg) {
  if (!lastMsg) return [];
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Based on this GI response, generate exactly 3 short follow-up questions a student might ask.
Return ONLY a JSON array of 3 strings. No markdown, no explanation.
Response: "${lastMsg.slice(0, 300)}"`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean).slice(0, 3);
  } catch {
    return [];
  }
}