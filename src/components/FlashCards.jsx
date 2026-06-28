import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Shuffle, RotateCcw, Sparkles } from "lucide-react";
import { generateGeminiResponse } from "../services/gemini";

function Flashcards({ isOpen, onClose }) {
  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mastered, setMastered] = useState([]);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setCards([]);
    setCurrent(0);
    setFlipped(false);
    setMastered([]);
    try {
      const prompt = `Create 8 flashcards about "${topic}". Return ONLY a JSON array. Each object must have "front" (question) and "back" (answer, max 2 sentences). No markdown, no explanation, just the JSON array.`;
      const res = await generateGeminiResponse([{ role: "user", text: prompt }]);
      const clean = res.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setCards(parsed);
    } catch {
      setCards([{ front: "Could not generate cards", back: "Please try again with a different topic." }]);
    } finally {
      setLoading(false);
    }
  };

  const shuffle = () => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrent(0);
    setFlipped(false);
  };

  const next = () => { setFlipped(false); setTimeout(() => setCurrent((c) => (c + 1) % cards.length), 150); };
  const prev = () => { setFlipped(false); setTimeout(() => setCurrent((c) => (c - 1 + cards.length) % cards.length), 150); };
  const markMastered = () => {
    setMastered((m) => [...m, current]);
    if (current < cards.length - 1) next();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <div>
              <h3 className="text-white font-bold text-lg">🃏 Flashcards</h3>
              <p className="text-slate-500 text-xs mt-0.5">AI-generated study cards</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {/* Topic input */}
            <div className="flex gap-2 mb-6">
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="Enter a topic (e.g. Photosynthesis, React Hooks...)"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-colors" />
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={generate} disabled={loading || !topic.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium flex items-center gap-1.5 transition-colors">
                <Sparkles size={14} /> {loading ? "Generating..." : "Generate"}
              </motion.button>
            </div>

            {/* Loading shimmer */}
            {loading && (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-12 rounded-xl shimmer" />
                ))}
              </div>
            )}

            {/* Cards */}
            {cards.length > 0 && !loading && (
              <>
                {/* Progress */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-xs">{current + 1} / {cards.length}</span>
                  <span className="text-emerald-400 text-xs">{mastered.length} mastered</span>
                  <button onClick={shuffle} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
                    <Shuffle size={12} /> Shuffle
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-white/5 rounded-full mb-5 overflow-hidden">
                  <motion.div animate={{ width: `${((current + 1) / cards.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-300" />
                </div>

                {/* Flashcard */}
                <div className="flashcard h-44 mb-5 cursor-pointer" onClick={() => setFlipped((f) => !f)}>
                  <div className={`flashcard-inner ${flipped ? "flipped" : ""}`}>
                    <div className="flashcard-front bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/20">
                      <div className="text-center">
                        <p className="text-xs text-indigo-400 mb-2 uppercase tracking-widest">Question</p>
                        <p className="text-white font-medium text-base leading-relaxed">{cards[current]?.front}</p>
                        <p className="text-slate-600 text-xs mt-3">Tap to reveal answer</p>
                      </div>
                    </div>
                    <div className="flashcard-back bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/20">
                      <div className="text-center">
                        <p className="text-xs text-emerald-400 mb-2 uppercase tracking-widest">Answer</p>
                        <p className="text-slate-100 text-sm leading-relaxed">{cards[current]?.back}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <button onClick={prev} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex gap-2">
                    <button onClick={() => { setFlipped(false); next(); }}
                      className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-sm transition-all">
                      Again
                    </button>
                    <button onClick={markMastered}
                      className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm transition-all">
                      ✓ Got it
                    </button>
                  </div>

                  <button onClick={next} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Flashcards;