import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic } from "lucide-react";
import GILogo from "./GILogo";
import { normalizeSpokenGI, cleanForSpeech, getPreferredVoice } from "../utils/giSpeech";

function GIVoiceAssistant({ isOpen, onClose, onUserSpeech, aiReply, isThinking }) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [paused, setPaused] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const lastSpokenRef = useRef("");
  const pausedRef = useRef(false);
  const openRef = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { openRef.current = isOpen; }, [isOpen]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-IN";

    r.onresult = (e) => {
      const raw = Array.from(e.results).map((res) => res[0].transcript).join("");
      const norm = normalizeSpokenGI(raw);
      setTranscript(norm);
      if (e.results[e.results.length - 1].isFinal) {
        setTranscript("");
        if (norm.trim()) {
          setPhase("thinking");
          onUserSpeech(norm.trim());
        } else {
          startListening();
        }
      }
    };
    r.onerror = () => {
      if (openRef.current && !pausedRef.current) startListening();
    };
    r.onend = () => {
      if (openRef.current && !pausedRef.current && phase === "listening") {
        try { r.start(); } catch { /* already running */ }
      }
    };

    recognitionRef.current = r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || pausedRef.current) return;
    setPhase("listening");
    try { recognitionRef.current.start(); } catch { /* already running */ }
  };

  const stopEverything = () => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    synthRef.current?.cancel();
    setPhase("idle");
    setTranscript("");
  };

  useEffect(() => {
    if (isOpen) {
      lastSpokenRef.current = "";
      setPaused(false);
      const t = setTimeout(startListening, 300);
      return () => clearTimeout(t);
    } else {
      stopEverything();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isThinking) setPhase("thinking");
  }, [isThinking, isOpen]);

  useEffect(() => {
    if (!isOpen || !aiReply || isThinking) return;
    if (aiReply === lastSpokenRef.current) return;
    lastSpokenRef.current = aiReply;

    const synth = synthRef.current;
    if (!synth) { startListening(); return; }

    synth.cancel();
    const utt = new SpeechSynthesisUtterance(cleanForSpeech(aiReply));
    utt.lang = "en-IN";
    utt.rate = 0.98;
    utt.pitch = 1;
    const voice = getPreferredVoice(synth);
    if (voice) utt.voice = voice;

    setPhase("speaking");
    utt.onend = () => {
      if (openRef.current && !pausedRef.current) startListening();
      else setPhase("idle");
    };
    utt.onerror = () => {
      if (openRef.current && !pausedRef.current) startListening();
    };
    synth.speak(utt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiReply, isThinking, isOpen]);

  const togglePause = () => {
    if (paused) {
      setPaused(false);
      startListening();
    } else {
      setPaused(true);
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      synthRef.current?.cancel();
      setPhase("idle");
    }
  };

  const handleClose = () => {
    stopEverything();
    onClose();
  };

  if (!isOpen) return null;

  const statusText = !supported
    ? "Voice isn't supported in this browser"
    : paused
    ? "Paused — tap mic to resume"
    : phase === "listening"
    ? "Listening..."
    : phase === "thinking"
    ? "GI is thinking..."
    : phase === "speaking"
    ? "GI is speaking..."
    : "Tap mic to start";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#05060f]/97 backdrop-blur-xl"
      >
        <button onClick={handleClose}
          className="absolute top-6 right-6 p-2.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
          <X size={22} />
        </button>

        <div className="flex flex-col items-center gap-8 px-6 text-center">
          <motion.div
            animate={
              phase === "listening" ? { scale: [1, 1.06, 1] } :
              phase === "speaking"  ? { scale: [1, 1.03, 1] } :
              { scale: 1 }
            }
            transition={{ duration: phase === "listening" ? 1.1 : 0.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <GILogo size={140} animate spinning={phase === "thinking"} />
          </motion.div>

          <div>
            <p className="text-white font-semibold text-lg mb-1">GI Assistant</p>
            <p className="text-slate-500 text-sm">{statusText}</p>
          </div>

          <AnimatePresence>
            {transcript && (
              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-sm text-slate-300 text-base italic px-4"
              >
                "{transcript}"
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePause}
            disabled={!supported}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              paused ? "bg-white/10 border border-white/20" : "bg-indigo-600 shadow-indigo-500/40"
            }`}
          >
            <Mic size={24} className="text-white" />
          </motion.button>

          <p className="text-slate-700 text-xs max-w-xs">
            Speak naturally — GI will reply out loud, just like a voice call.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GIVoiceAssistant;