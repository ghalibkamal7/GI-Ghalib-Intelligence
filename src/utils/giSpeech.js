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

// Google's network-backed voices sound noticeably more natural than
// each OS's offline default voice — prioritized first.
const FEMALE_HINTS = ["google uk english female", "google us english", "samantha", "victoria", "zira", "moira", "tessa", "veena", "female"];
const MALE_HINTS = ["google uk english male", "daniel", "alex", "fred", "david", "rishi", "aaron", "male"];
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