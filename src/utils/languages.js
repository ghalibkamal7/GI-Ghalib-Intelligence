// Central language list — code (ISO 639-1) is what we send to Gemini
// for translation; bcp47 is what the browser's SpeechRecognition and
// SpeechSynthesis APIs need. Kept in one place so adding a language
// later means editing exactly this array, nowhere else.
export const LANGUAGES = [
  { code: "en", label: "English",    bcp47: "en-US" },
  { code: "hi", label: "Hindi",      bcp47: "hi-IN" },
  { code: "ur", label: "Urdu",       bcp47: "ur-PK" },
  { code: "bn", label: "Bengali",    bcp47: "bn-IN" },
  { code: "ta", label: "Tamil",      bcp47: "ta-IN" },
  { code: "te", label: "Telugu",     bcp47: "te-IN" },
  { code: "mr", label: "Marathi",    bcp47: "mr-IN" },
  { code: "gu", label: "Gujarati",   bcp47: "gu-IN" },
  { code: "pa", label: "Punjabi",    bcp47: "pa-IN" },
  { code: "kn", label: "Kannada",    bcp47: "kn-IN" },
  { code: "ml", label: "Malayalam",  bcp47: "ml-IN" },
  { code: "es", label: "Spanish",    bcp47: "es-ES" },
  { code: "fr", label: "French",     bcp47: "fr-FR" },
  { code: "de", label: "German",     bcp47: "de-DE" },
  { code: "pt", label: "Portuguese", bcp47: "pt-PT" },
  { code: "it", label: "Italian",    bcp47: "it-IT" },
  { code: "ru", label: "Russian",    bcp47: "ru-RU" },
  { code: "ar", label: "Arabic",     bcp47: "ar-SA" },
  { code: "zh", label: "Chinese",    bcp47: "zh-CN" },
  { code: "ja", label: "Japanese",   bcp47: "ja-JP" },
  { code: "ko", label: "Korean",     bcp47: "ko-KR" },
  { code: "tr", label: "Turkish",    bcp47: "tr-TR" },
  { code: "id", label: "Indonesian", bcp47: "id-ID" },
  { code: "vi", label: "Vietnamese", bcp47: "vi-VN" },
  { code: "th", label: "Thai",       bcp47: "th-TH" },
  { code: "nl", label: "Dutch",      bcp47: "nl-NL" },
  { code: "pl", label: "Polish",     bcp47: "pl-PL" },
  { code: "uk", label: "Ukrainian",  bcp47: "uk-UA" },
];

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code);
}

export function getLanguageLabel(code) {
  return getLanguage(code)?.label || code;
}