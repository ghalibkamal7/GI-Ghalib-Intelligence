const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function generateGeminiResponse(messages, systemPrompt = null) {
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

  const body = { contents };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from GI.";
}

export async function generateSuggestions(lastAIMessage) {
  if (!lastAIMessage) return [];
  const prompt = `Based on this AI response, generate exactly 3 short follow-up questions a student might ask. 
Return ONLY a JSON array of 3 strings. No explanation, no markdown, just the array.
Response: "${lastAIMessage.slice(0, 300)}"`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean).slice(0, 3);
  } catch {
    return [];
  }
}