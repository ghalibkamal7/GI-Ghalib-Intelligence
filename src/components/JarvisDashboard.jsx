import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mic, Timer, BookOpen, FileImage, Droplet, BarChart2, Pin,
  Image as ImageIcon, Scissors, Volume2,
} from "lucide-react";
import GIOrb from "./GIOrb";
import ImageResizer from "./ImageResizer";
import BackgroundRemover from "./BackgroundRemover";
import { normalizeSpokenGI, cleanForSpeech, getPreferredVoice, getVoiceGenderPref, setVoiceGenderPref } from "../utils/giSpeech";
import { fetchWeather, describeWeatherCode, getCurrentPosition } from "../utils/weather";

function JarvisDashboard({
  isOpen, onClose, onUserSpeech, aiReply, isThinking,
  onOpenTool,
}) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [paused, setPaused] = useState(false);
  const [voiceGender, setVoiceGender] = useState(getVoiceGenderPref());
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(false);
  const [subTool, setSubTool] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const lastSpokenRef = useRef("");
  const pausedRef = useRef(false);
  const openRef = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { openRef.current = isOpen; }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || weather || weatherError) return;
    (async () => {
      try {
        const { lat, lon } = await getCurrentPosition();
        const w = await fetchWeather(lat, lon);
        setWeather(w);
      } catch {
        setWeatherError(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
    r.onerror = () => { if (openRef.current && !pausedRef.current) startListening(); };
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
      setSubTool(null);
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
    utt.pitch = voiceGender === "female" ? 1.05 : 0.92;
    const voice = getPreferredVoice(synth, voiceGender);
    if (voice) utt.voice = voice;

    setPhase("speaking");
    utt.onend = () => { if (openRef.current && !pausedRef.current) startListening(); else setPhase("idle"); };
    utt.onerror = () => { if (openRef.current && !pausedRef.current) startListening(); };
    synth.speak(utt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiReply, isThinking, isOpen, voiceGender]);

  useEffect(() => {
    if (subTool) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      synthRef.current?.cancel();
    } else if (isOpen && !paused) {
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTool]);

  const togglePause = () => {
    if (paused) { setPaused(false); startListening(); }
    else {
      setPaused(true);
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      synthRef.current?.cancel();
      setPhase("idle");
    }
  };

  const toggleGender = useCallback(() => {
    const next = voiceGender === "female" ? "male" : "female";
    setVoiceGender(next);
    setVoiceGenderPref(next);
  }, [voiceGender]);

  const handleClose = () => { stopEverything(); onClose(); };

  const launchTool = (key) => {
    stopEverything();
    onClose();
    onOpenTool?.(key);
  };

  if (!isOpen) return null;

  const statusText = !supported
    ? "Voice isn't supported in this browser"
    : paused ? "Paused — tap mic to resume"
    : phase === "listening" ? "Listening..."
    : phase === "thinking" ? "GI is thinking..."
    : phase === "speaking" ? "GI is speaking..."
    : "Tap mic to start";

  const w = weather ? describeWeatherCode(weather.code) : null;
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

  const TOOLS = [
    { key: "focus",   icon: <Timer size={17} />,    label: "Focus" },
    { key: "cards",   icon: <BookOpen size={17} />, label: "Cards" },
    { key: "pdf",     icon: <FileImage size={17} />,label: "PDF" },
    { key: "cycle",   icon: <Droplet size={17} />,  label: "Periods" },
    { key: "stats",   icon: <BarChart2 size={17} />,label: "Stats" },
    { key: "pins",    icon: <Pin size={17} />,      label: "Pins" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col bg-[#05060f]/98 backdrop-blur-xl overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 shrink-0">
          <div>
            <p className="text-white font-bold text-xl tabular-nums">{timeStr}</p>
            <p className="text-slate-600 text-xs">{dateStr}</p>
          </div>

          <div className="flex items-center gap-3">
            {weather && w && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-lg">{w.icon}</span>
                <span className="text-white text-sm font-medium">{weather.tempC}°C</span>
              </div>
            )}
            <button onClick={handleClose} className="p-2.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center min-h-[380px]">
          <GIOrb size={220} thinking={phase === "thinking"} speaking={phase === "speaking"} />

          <p className="text-white font-semibold text-lg mt-6 mb-1">GI Assistant</p>
          <p className="text-slate-500 text-sm mb-6">{statusText}</p>

          <AnimatePresence>
            {transcript && (
              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-sm text-slate-300 text-base italic px-4 mb-6"
              >
                "{transcript}"
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={togglePause}
              disabled={!supported}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                paused ? "bg-white/10 border border-white/20" : "bg-indigo-600 shadow-indigo-500/40"
              }`}
            >
              <Mic size={24} className="text-white" />
            </motion.button>

            <button
              onClick={toggleGender}
              title="Switch voice"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white text-xs transition-colors"
            >
              <Volume2 size={14} />
              {voiceGender === "female" ? "Female voice" : "Male voice"}
            </button>
          </div>
        </div>

        <div className="shrink-0 px-5 sm:px-8 pb-6 pt-2">
          <p className="text-slate-700 text-xs uppercase tracking-widest mb-3 text-center">Quick Functions</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-w-2xl mx-auto">
            <button onClick={() => setSubTool("resize")}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-indigo-500/10 text-slate-300 hover:text-white transition-all">
              <ImageIcon size={17} />
              <span className="text-[10px]">Resize</span>
            </button>
            <button onClick={() => setSubTool("bgremove")}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-indigo-500/10 text-slate-300 hover:text-white transition-all">
              <Scissors size={17} />
              <span className="text-[10px]">BG Remove</span>
            </button>
            {TOOLS.map((t) => (
              <button key={t.key} onClick={() => launchTool(t.key)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-indigo-500/10 text-slate-300 hover:text-white transition-all">
                {t.icon}
                <span className="text-[10px]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <ImageResizer isOpen={subTool === "resize"} onClose={() => setSubTool(null)} />
      <BackgroundRemover isOpen={subTool === "bgremove"} onClose={() => setSubTool(null)} />
    </AnimatePresence>
  );
}

export default JarvisDashboard;