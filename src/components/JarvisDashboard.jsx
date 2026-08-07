import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mic, Timer, BookOpen, FileImage, Droplet, BarChart2, Pin,
  Image as ImageIcon, Scissors, Volume2, Briefcase,
} from "lucide-react";
import GILogo from "./GILogo";
import { normalizeSpokenGI, cleanForSpeech, getPreferredVoice, getVoiceGenderPref, setVoiceGenderPref } from "../utils/giSpeech";
import { fetchWeather, describeWeatherCode, getCurrentPosition } from "../utils/weather";

// Decorative HUD ring — a plain SVG circle with a partial stroke that
// slowly rotates via CSS transform. This is what gives the "sci-fi
// dashboard" look without any per-frame JS, canvas, or WebGL — just
// one lightweight composited animation.
function HudRing({ size, strokeWidth = 1.5, dash, duration = 20, reverse = false, opacity = 0.4, color = "#22d3ee" }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0"
      style={{
        animation: `gi-hud-spin ${duration}s linear infinite ${reverse ? "reverse" : ""}`,
      }}
    >
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={dash || `${circ * 0.15} ${circ * 0.05}`}
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}

function HudPanel({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-cyan-500/20 bg-cyan-950/10 backdrop-blur-sm px-4 py-3 ${className}`}>
      {children}
    </div>
  );
}

function JarvisDashboard({
  isOpen, onClose, onUserSpeech, aiReply, isThinking, onOpenTool,
}) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [paused, setPaused] = useState(false);
  const [voiceGender, setVoiceGender] = useState(getVoiceGenderPref());
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const lastSpokenRef = useRef("");
  const pausedRef = useRef(false);
  const openRef = useRef(false);
  const stuckTimerRef = useRef(null);

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
    clearTimeout(stuckTimerRef.current);
  };

  useEffect(() => {
    if (isOpen) {
      lastSpokenRef.current = "";
      pausedRef.current = false;
      setPaused(false);
      const t = setTimeout(startListening, 300);
      return () => clearTimeout(t);
    } else {
      stopEverything();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isThinking) {
      setPhase("thinking");
      // Safety net: if nothing comes back within 20s (network hiccup,
      // dropped response, etc.) resume listening instead of hanging
      // in "thinking" forever.
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = setTimeout(() => {
        if (openRef.current && !pausedRef.current) startListening();
      }, 20000);
    }
    return () => clearTimeout(stuckTimerRef.current);
  }, [isThinking, isOpen]);

  useEffect(() => {
    if (!isOpen || !aiReply || isThinking) return;
    if (aiReply === lastSpokenRef.current) return;
    lastSpokenRef.current = aiReply;
    clearTimeout(stuckTimerRef.current);

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

  const togglePause = () => {
    if (paused) {
      // Update the ref synchronously — the effect that syncs pausedRef
      // from `paused` state hasn't run yet at this point in the same
      // tick, so startListening() would otherwise see a stale "still
      // paused" value and immediately bail out.
      pausedRef.current = false;
      setPaused(false);
      startListening();
    } else {
      pausedRef.current = true;
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
    : paused ? "PAUSED"
    : phase === "listening" ? "LISTENING"
    : phase === "thinking" ? "PROCESSING"
    : phase === "speaking" ? "RESPONDING"
    : "STANDBY";

  const w = weather ? describeWeatherCode(weather.code) : null;
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });

  const TOOLS = [
    { key: "focus",     icon: <Timer size={16} />,     label: "Focus" },
    { key: "cards",     icon: <BookOpen size={16} />,  label: "Cards" },
    { key: "pdf",       icon: <FileImage size={16} />, label: "PDF" },
    { key: "cycle",     icon: <Droplet size={16} />,   label: "Periods" },
    { key: "interview", icon: <Briefcase size={16} />, label: "Interview" },
    { key: "stats",     icon: <BarChart2 size={16} />, label: "Stats" },
    { key: "pins",      icon: <Pin size={16} />,       label: "Pins" },
  ];

  const activeColor = phase === "listening" ? "#22d3ee" : phase === "speaking" ? "#a78bfa" : phase === "thinking" ? "#fbbf24" : "#0ea5b7";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        role="dialog" aria-modal="true" aria-label="GI Assistant Dashboard"
        className="fixed inset-0 z-[60] flex flex-col overflow-y-auto"
        style={{ background: "radial-gradient(ellipse at center, #061014 0%, #020408 75%)" }}
      >
        {/* Faint scanline / grid texture for HUD feel — pure CSS, no assets */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

        {/* Top HUD bar */}
        <div className="relative flex items-start justify-between px-5 sm:px-8 py-4 shrink-0 gap-3">
          <HudPanel className="font-mono">
            <p className="text-cyan-300 font-bold text-xl tabular-nums tracking-widest">{timeStr}</p>
            <p className="text-cyan-600 text-[10px] uppercase tracking-widest mt-0.5">{dateStr}</p>
          </HudPanel>

          <div className="flex items-center gap-2">
            {weather && w && (
              <HudPanel className="font-mono flex items-center gap-2">
                <span className="text-lg">{w.icon}</span>
                <div>
                  <p className="text-cyan-300 text-sm font-bold leading-none">{weather.tempC}°C</p>
                  <p className="text-cyan-700 text-[9px] uppercase tracking-wider mt-0.5">{w.label}</p>
                </div>
              </HudPanel>
            )}
            <button onClick={handleClose} aria-label="Close"
              className="p-2.5 rounded-full text-cyan-600 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/20 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Center — HUD rings around the voice orb */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center min-h-[380px]">
          <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
            <HudRing size={280} duration={30} color={activeColor} opacity={0.25} strokeWidth={1} />
            <HudRing size={230} duration={22} reverse color={activeColor} opacity={0.35} strokeWidth={1.5} />
            <HudRing size={190} duration={16} color={activeColor} opacity={0.5} strokeWidth={2} dash="6 10" />

            <motion.div
              animate={{
                scale: phase === "listening" ? [1, 1.06, 1] : phase === "speaking" ? [1, 1.03, 1] : 1,
              }}
              transition={{ duration: phase === "listening" ? 1.1 : 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: `drop-shadow(0 0 24px ${activeColor}66)` }}
            >
              <GILogo size={110} animate spinning={phase === "thinking"} glow />
            </motion.div>
          </div>

          <p className="font-mono text-xs tracking-[0.3em] mt-6 mb-1" style={{ color: activeColor }}>
            {statusText}
          </p>
          <p className="text-slate-600 text-xs mb-4">GI Assistant Online</p>

          <AnimatePresence>
            {transcript && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-sm text-cyan-200 text-base italic px-4 mb-4">
                "{transcript}"
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4 mt-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={togglePause} disabled={!supported}
              className="w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300"
              style={{
                background: paused ? "transparent" : `${activeColor}22`,
                borderColor: paused ? "rgba(255,255,255,0.15)" : activeColor,
                boxShadow: paused ? "none" : `0 0 24px ${activeColor}55`,
              }}
            >
              <Mic size={24} style={{ color: paused ? "#94a3b8" : activeColor }} />
            </motion.button>

            <button onClick={toggleGender} title="Switch voice"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-500 hover:text-cyan-300 text-xs font-mono transition-colors">
              <Volume2 size={14} />
              {voiceGender === "female" ? "F-VOICE" : "M-VOICE"}
            </button>
          </div>
        </div>

        {/* Bottom — tool launcher HUD grid */}
        <div className="relative shrink-0 px-5 sm:px-8 pb-6 pt-2">
          <p className="text-cyan-700 text-[10px] font-mono uppercase tracking-[0.3em] mb-3 text-center">
            System Functions
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-9 gap-2 max-w-3xl mx-auto">
            <button onClick={() => launchTool("resize")}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cyan-950/20 border border-cyan-500/15 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-cyan-500 hover:text-cyan-200 transition-all">
              <ImageIcon size={16} />
              <span className="text-[9px] font-mono uppercase">Resize</span>
            </button>
            <button onClick={() => launchTool("bgremove")}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cyan-950/20 border border-cyan-500/15 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-cyan-500 hover:text-cyan-200 transition-all">
              <Scissors size={16} />
              <span className="text-[9px] font-mono uppercase">BG Del</span>
            </button>
            {TOOLS.map((t) => (
              <button key={t.key} onClick={() => launchTool(t.key)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cyan-950/20 border border-cyan-500/15 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-cyan-500 hover:text-cyan-200 transition-all">
                {t.icon}
                <span className="text-[9px] font-mono uppercase">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default JarvisDashboard;