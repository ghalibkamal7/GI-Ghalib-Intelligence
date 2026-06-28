import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Brain } from "lucide-react";

const MODES = [
  { label: "Focus", duration: 25 * 60, emoji: "🧠" },
  { label: "Short Break", duration: 5 * 60, emoji: "☕" },
  { label: "Long Break", duration: 15 * 60, emoji: "🌿" },
];

function FocusMode({ isOpen, onClose, onAskGI }) {
  const [modeIdx, setModeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODES[0].duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [topic, setTopic] = useState("");
  const intervalRef = useRef(null);
  const mode = MODES[modeIdx];

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (modeIdx === 0) setSessions((s) => s + 1);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, modeIdx]);

  const switchMode = (idx) => {
    setModeIdx(idx);
    setTimeLeft(MODES[idx].duration);
    setRunning(false);
  };

  const reset = () => { setTimeLeft(mode.duration); setRunning(false); };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const progress = ((mode.duration - timeLeft) / mode.duration) * 100;
  const r = 54;
  const circ = 2 * Math.PI * r;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl p-8 w-full max-w-sm mx-4 border border-white/10 shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <X size={18} />
          </button>
          <div className="text-center mb-6">
            <h3 className="text-white font-bold text-xl mb-1">🎯 Focus Mode</h3>
            <p className="text-slate-500 text-xs">{sessions} sessions completed today</p>
          </div>
          <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl">
            {MODES.map((m, i) => (
              <button key={m.label} onClick={() => switchMode(i)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  modeIdx === i ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="60" cy="60" r={r} fill="none"
                  stroke={modeIdx === 0 ? "#6366f1" : modeIdx === 1 ? "#10b981" : "#a855f7"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ - (circ * progress) / 100}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-3xl tabular-nums">{fmt(timeLeft)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={reset} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <RotateCcw size={18} />
            </button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setRunning((r) => !r)}
              className={`px-8 py-3 rounded-2xl font-semibold text-white flex items-center gap-2 transition-all ${
                running ? "bg-red-500/80 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"
              }`}>
              {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
            </motion.button>
          </div>
          <div className="border-t border-white/[0.07] pt-5">
            <p className="text-slate-500 text-xs mb-2 text-center">What are you studying?</p>
            <div className="flex gap-2">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. React Hooks, Calculus..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
              />
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { if (topic.trim()) { onAskGI(`Create a focused 25-minute study plan for: ${topic}`); onClose(); }}}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors"
              >
                <Brain size={15} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FocusMode;