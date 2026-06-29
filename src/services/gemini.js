const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash`;

const DEFAULT_SYSTEM = `You are GI (Ghalib Intelligence), a smart and helpful GI Assistant.
Always refer to yourself as GI or GI Assistant — never as AI Assistant or AI.
Be helpful, accurate, and concise.`;

function buildBody(messages, systemPrompt) {
  const contents = messages.map((msg) => {
    if (msg.image) {
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [
          { text: msg.text || "Analyze this image" },
          { inline_data: { mime_type: "image/jpeg", data: msg.image.split(",")[1] } },
        ],
      };
    }
    return {
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text || "" }],
    };
  });
  return {
    contents,
    systemInstruction: { parts: [{ text: systemPrompt || DEFAULT_SYSTEM }] },
  };
}

export async function streamGeminiResponse(messages, systemPrompt = null, onChunk) {
  const url = `${BASE_URL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildBody(messages, systemPrompt)),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "GI streaming error");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6));
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) {
          full += text;
          onChunk(full);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
  return full;
}

export async function generateGeminiResponse(messages, systemPrompt = null) {
  const url = `${BASE_URL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildBody(messages, systemPrompt)),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "GI error");
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from GI.";
}

export async function generateSuggestions(lastMsg) {
  if (!lastMsg) return [];
  const url = `${BASE_URL}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `Based on this GI response, generate exactly 3 short follow-up questions a student might ask.
Return ONLY a JSON array of 3 strings. No markdown, no explanation, just the array.
Response: "${lastMsg.slice(0, 300)}"`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean).slice(0, 3);
  } catch {
    return [];
  }
}