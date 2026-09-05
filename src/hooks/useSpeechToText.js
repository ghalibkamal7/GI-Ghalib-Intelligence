import { useRef, useState, useCallback, useEffect } from "react";

/**
 * A general-purpose speech-to-text hook — language-aware (unlike the
 * assistant's own always-English-Indian recognizer), used only by
 * GI Talk. Kept separate from the JarvisDashboard/GestureControl
 * recognizers so a change here can never affect the main assistant.
 */
export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const onFinalRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setIsSupported(false); return; }
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
  }, []);

  const start = useCallback((bcp47Lang, onFinal) => {
    const r = recognitionRef.current;
    if (!r) { setError("Speech recognition isn't supported in this browser."); return; }
    setError("");
    setTranscript("");
    setInterimTranscript("");
    onFinalRef.current = onFinal;
    r.lang = bcp47Lang;

    r.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInterimTranscript(interim);
      if (final) {
        setTranscript(final);
        setInterimTranscript("");
      }
    };
    r.onerror = (e) => {
      setIsListening(false);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setError("Microphone permission was denied.");
      } else if (e.error === "no-speech") {
        setError("Didn't catch that — please try again.");
      } else if (e.error === "language-not-supported") {
        setError("Speech recognition may not fully support this language in your browser.");
      } else {
        setError("Speech recognition error — please try again.");
      }
    };
    r.onend = () => {
      setIsListening(false);
      setInterimTranscript((prevInterim) => {
        // If we ended with only interim (no final event fired) but the
        // user clearly said something, treat the last interim as final
        // rather than silently losing it.
        return prevInterim;
      });
    };

    try {
      r.start();
      setIsListening(true);
    } catch {
      setError("Could not start listening — please try again.");
    }
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setIsListening(false);
  }, []);

  // Fire the caller's callback once a genuinely final transcript lands.
  useEffect(() => {
    if (transcript && onFinalRef.current) {
      onFinalRef.current(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError("");
  }, []);

  return { isListening, transcript, interimTranscript, isSupported, error, start, stop, reset };
}