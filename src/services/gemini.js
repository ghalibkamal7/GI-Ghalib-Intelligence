const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function generateGeminiResponse(messages) {
  const formatted = messages.map((msg) => {
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

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: formatted }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from GI.";
}