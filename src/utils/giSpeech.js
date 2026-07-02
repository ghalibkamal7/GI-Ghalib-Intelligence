const GI_SPOKEN_VARIANTS = [
  /\bgee\s*eye\b/gi,
  /\bji\s+ai\b/gi,
  /\bg\s*\.?\s*i\s*\.?\b/gi,
];

export function normalizeSpokenGI(text) {
  let out = text;
  for (const pattern of GI_SPOKEN_VARIANTS) {
    out = out.replace(pattern, "GI");
  }
  out = out.replace(/\b(hello|hey|hi|namaste)\s+ji\b/gi, "$1 GI");
  return out;
}

export function forSpeech(text) {
  return text.replace(/\bGI\b/g, "Gee Eye");
}

export function cleanForSpeech(text, maxLen = 600) {
  const stripped = (text || "").replace(/[#*`_~\[\]]/g, "").slice(0, maxLen);
  return forSpeech(stripped);
}

export function getPreferredVoice(synth) {
  const voices = synth.getVoices();
  return voices.find((v) => v.lang.includes("en-IN")) ||
         voices.find((v) => v.lang.includes("en-GB")) ||
         voices.find((v) => v.lang.startsWith("en")) ||
         voices[0];
}