const GREETING_PATTERNS = [
  /^\s*(hello|hi|hey|namaste|hola)\s*(gi|there)?\s*[!.]*\s*$/i,
  /^\s*(good\s*(morning|afternoon|evening|night))\s*(gi)?\s*[!.]*\s*$/i,
];

export function isGreeting(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.split(/\s+/).length > 4) return false;
  return GREETING_PATTERNS.some((p) => p.test(trimmed));
}

export function getGreetingReply(firstName) {
  const name = firstName || "there";
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const options = [
    `Hello, ${name}! 👋 I'm GI — what can I help you with today?`,
    `${timeGreeting}, ${name}! Great to hear from you. What's on your mind?`,
    `Hey ${name}! I'm all ears — what would you like to explore today?`,
  ];
  return options[Math.floor(Math.random() * options.length)];
}