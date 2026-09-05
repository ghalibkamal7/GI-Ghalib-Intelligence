/**
 * General-purpose, language-aware TTS — separate from giSpeech.js,
 * which is specifically tuned for the assistant's own English/Hinglish
 * voice. GI Talk needs to speak arbitrary target languages instead.
 */
export function speakInLanguage(text, bcp47Lang, { onStart, onEnd, onError } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onError?.("Text-to-speech isn't available in this browser.");
    return null;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = bcp47Lang;

  const voices = synth.getVoices();
  const match = voices.find((v) => v.lang === bcp47Lang) ||
    voices.find((v) => v.lang.startsWith(bcp47Lang.split("-")[0]));
  if (match) utt.voice = match;
  else onError?.(`No installed voice found for this language — playback may use a default voice or fail silently.`);

  utt.onstart = () => onStart?.();
  utt.onend = () => onEnd?.();
  utt.onerror = () => onError?.("Couldn't play audio for this language.");

  synth.speak(utt);
  return utt;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}