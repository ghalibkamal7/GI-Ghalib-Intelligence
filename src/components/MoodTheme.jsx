const MOOD_THEMES = {
  excited: { accent: "#f59e0b", glow: "rgba(245,158,11,0.3)", label: "⚡ Energetic" },
  happy:   { accent: "#10b981", glow: "rgba(16,185,129,0.3)", label: "😊 Positive" },
  focused: { accent: "#6366f1", glow: "rgba(99,102,241,0.3)", label: "🎯 Focused" },
  curious: { accent: "#8b5cf6", glow: "rgba(139,92,246,0.3)", label: "🔮 Curious" },
  calm:    { accent: "#06b6d4", glow: "rgba(6,182,212,0.3)",  label: "🌊 Calm" },
  warning: { accent: "#ef4444", glow: "rgba(239,68,68,0.3)",  label: "⚠️ Alert" },
};

const MOOD_KEYWORDS = {
  excited: ["amazing", "excellent", "fantastic", "great", "awesome", "incredible", "wow"],
  happy:   ["happy", "glad", "wonderful", "nice", "good", "love", "perfect", "correct", "yes"],
  focused: ["let me explain", "here's how", "step by step", "algorithm", "code", "function", "solution"],
  curious: ["interesting", "fascinating", "explore", "discover", "wonder", "question", "theory"],
  calm:    ["sure", "okay", "certainly", "of course", "absolutely", "alright", "noted"],
  warning: ["error", "wrong", "incorrect", "mistake", "danger", "warning", "careful", "issue"],
};

export function detectMood(text) {
  if (!text) return "focused";
  const lower = text.toLowerCase();
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return mood;
  }
  return "focused";
}

export function applyMoodTheme(mood) {
  const theme = MOOD_THEMES[mood] || MOOD_THEMES.focused;
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--accent-glow", theme.glow);
  return theme;
}

export { MOOD_THEMES };