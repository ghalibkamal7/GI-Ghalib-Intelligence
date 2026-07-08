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

const VOICE_GENDER_KEY = "gi-voice-gender";

export function getVoiceGenderPref() {
  try { return localStorage.getItem(VOICE_GENDER_KEY) || "female"; } catch { return "female"; }
}

export function setVoiceGenderPref(gender) {
  try { localStorage.setItem(VOICE_GENDER_KEY, gender); } catch { /* ignore */ }
}

const FEMALE_HINTS = ["female", "samantha", "victoria", "zira", "google us english", "google uk english female", "moira", "tessa", "veena"];
const MALE_HINTS = ["male", "daniel", "alex", "fred", "google uk english male", "david", "rishi", "aaron"];

export function getPreferredVoice(synth, gender = getVoiceGenderPref()) {
  const voices = synth.getVoices();
  if (!voices.length) return null;
  const enVoices = voices.filter((v) => v.lang.startsWith("en"));
  const pool = enVoices.length ? enVoices : voices;
  const hints = gender === "male" ? MALE_HINTS : FEMALE_HINTS;

  for (const hint of hints) {
    const match = pool.find((v) => v.name.toLowerCase().includes(hint));
    if (match) return match;
  }
  return (
    pool.find((v) => v.lang.includes("en-IN")) ||
    pool.find((v) => v.lang.includes("en-GB")) ||
    pool[0]
  );
}