import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, X } from "lucide-react";
import { normalizeSpokenGI, cleanForSpeech, getPreferredVoice } from "../utils/giSpeech";

function VoiceMode({ onTranscript, lastAIMessage, isOpen, onClose }) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (e) => {
      const raw = Array.from(e.results).map((r) => r[0].transcript).join("");
      const t = normalizeSpokenGI(raw);
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        onTranscript(t);
        setTranscript("");
        setListening(false);
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListen = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  const speakText = (text) => {
    if (!text) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(cleanForSpeech(text));
    utt.lang = "en-IN";
    utt.rate = 0.95;
    utt.pitch = 1;
    const voice = getPreferredVoice(synthRef.current);
    if (voice) utt.voice = voice;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    synthRef.current.speak(utt);
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl p-8 w-full max-w-sm mx-4 text-center border border-white/10 shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>

          <h3 className="text-white font-semibold text-lg mb-1">Voice Mode</h3>
          <p className="text-slate-500 text-xs mb-8">
            {!supported ? "Not supported in this browser" : listening ? "Listening..." : "Tap mic to speak"}
          </p>

          <div className="relative flex items-center justify-center mb-8">
            {listening && (
              <>
                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute w-28 h-28 rounded-full bg-indigo-500/20" />
                <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                  className="absolute w-20 h-20 rounded-full bg-indigo-500/30" />
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListen}
              disabled={!supported}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                listening ? "bg-red-500 shadow-red-500/40" : "bg-indigo-600 shadow-indigo-500/40"
              }`}
            >
              {listening ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
            </motion.button>
          </div>

          {transcript && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm italic">
              "{transcript}"
            </motion.div>
          )}

          {lastAIMessage && (
            <button
              onClick={() => speaking ? stopSpeaking() : speakText(lastAIMessage)}
              className={`flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                speaking ? "bg-purple-600/30 text-purple-300 border border-purple-500/30" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {speaking ? <><VolumeX size={15} /> Stop Speaking</> : <><Volume2 size={15} /> Read Last Reply</>}
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default VoiceMode;