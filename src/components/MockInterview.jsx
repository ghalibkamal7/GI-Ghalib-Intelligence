import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, RotateCcw, Award, Loader2, Briefcase } from "lucide-react";
import { generateGeminiResponse } from "../services/gemini";

const ROLE_PRESETS = [
  "Frontend Developer", "Backend Developer", "Data Scientist",
  "Product Manager", "UI/UX Designer", "College Admission",
];

const TOTAL_QUESTIONS = 5;

function MockInterview({ isOpen, onClose }) {
  const [phase, setPhase] = useState("setup");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPhase("setup");
      setRole("");
      setQuestions([]);
      setAnswer("");
      setSummary("");
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions, currentQ]);

  const askNextQuestion = async (history) => {
    setLoading(true);
    setError("");
    try {
      const askedSoFar = history.map((h, i) => `Q${i + 1}: ${h.q}\nCandidate's answer: ${h.answer}`).join("\n\n");
      const prompt = `You are conducting a mock job interview for the role "${role}" at ${difficulty} difficulty.
${history.length === 0 ? "Ask the FIRST interview question now." : `So far:\n${askedSoFar}\n\nBriefly (1 sentence) acknowledge the last answer, then ask the NEXT interview question (question ${history.length + 1} of ${TOTAL_QUESTIONS}).`}
Return ONLY the interviewer's next message — no labels, no markdown, no "Question X:" prefix, just what the interviewer would naturally say.`;

      const res = await generateGeminiResponse([{ role: "user", text: prompt }]);
      setCurrentQ(res.trim());
    } catch (err) {
      console.error("Mock interview question generation failed:", err);
      setError("Couldn't generate the next question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    if (!role.trim()) return;
    setPhase("interviewing");
    await askNextQuestion([]);
  };

  const submitAnswer = async () => {
    if (!answer.trim() || loading) return;
    const entry = { q: currentQ, answer: answer.trim() };
    const nextHistory = [...questions, entry];
    setQuestions(nextHistory);
    setAnswer("");
    setCurrentQ("");

    if (nextHistory.length >= TOTAL_QUESTIONS) {
      await finishInterview(nextHistory);
    } else {
      await askNextQuestion(nextHistory);
    }
  };

  const finishInterview = async (history) => {
    setLoading(true);
    setError("");
    try {
      const transcript = history.map((h, i) => `Q${i + 1}: ${h.q}\nA${i + 1}: ${h.answer}`).join("\n\n");
      const prompt = `You just finished a mock interview for the role "${role}" (${difficulty} difficulty). Here is the full transcript:

${transcript}

Give brief, constructive feedback (max 150 words): 2-3 strengths, 2-3 areas to improve, and an overall encouraging closing line. Use short paragraphs, no markdown headers.`;
      const res = await generateGeminiResponse([{ role: "user", text: prompt }]);
      setSummary(res.trim());
      setPhase("finished");
    } catch (err) {
      console.error("Mock interview summary failed:", err);
      setError("Couldn't generate feedback. Your answers are still shown below.");
      setPhase("finished");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setPhase("setup");
    setRole("");
    setQuestions([]);
    setCurrentQ("");
    setAnswer("");
    setSummary("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        role="dialog" aria-modal="true" aria-label="Mock Interview"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

          <div className="flex items-center justify-between p-6 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-indigo-400" />
              <div>
                <h3 className="text-white font-bold text-lg">Mock Interview</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  {phase === "setup" ? "Practice with AI-generated questions" : `Question ${Math.min(questions.length + 1, TOTAL_QUESTIONS)} of ${TOTAL_QUESTIONS}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {phase === "interviewing" && (
            <div className="h-1 bg-white/5 shrink-0">
              <motion.div
                animate={{ width: `${(questions.length / TOTAL_QUESTIONS) * 100}%` }}
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-300" />
            </div>
          )}

          <div className="p-6 overflow-y-auto flex-1">
            {phase === "setup" && (
              <div>
                <label className="text-slate-500 text-xs block mb-2">What role are you interviewing for?</label>
                <input value={role} onChange={(e) => setRole(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startInterview()}
                  placeholder="e.g. Frontend Developer, MBA Admission..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 mb-3" />

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {ROLE_PRESETS.map((r) => (
                    <button key={r} onClick={() => setRole(r)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-white/10 transition-all">
                      {r}
                    </button>
                  ))}
                </div>

                <label className="text-slate-500 text-xs block mb-2">Difficulty</label>
                <div className="flex gap-2 mb-6">
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        difficulty === d ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>

                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={startInterview} disabled={!role.trim() || loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-sm transition-colors">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
                  {loading ? "Preparing..." : "Start Interview"}
                </motion.button>
              </div>
            )}

            {phase === "interviewing" && (
              <div>
                {questions.map((q, i) => (
                  <div key={i} className="mb-5">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs text-indigo-400 font-medium shrink-0 mt-0.5">Q{i + 1}</span>
                      <p className="text-slate-300 text-sm">{q.q}</p>
                    </div>
                    <div className="ml-6 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <p className="text-slate-400 text-xs whitespace-pre-wrap">{q.answer}</p>
                    </div>
                  </div>
                ))}

                {currentQ && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xs text-indigo-400 font-medium shrink-0 mt-0.5">Q{questions.length + 1}</span>
                      <p className="text-white text-sm font-medium">{currentQ}</p>
                    </div>
                    <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAnswer(); }}
                      placeholder="Type your answer... (Cmd/Ctrl+Enter to submit)"
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 resize-none" />
                  </motion.div>
                )}

                {loading && !currentQ && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 size={14} className="animate-spin" /> GI is preparing the next question...
                  </div>
                )}

                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
                <div ref={bottomRef} />
              </div>
            )}

            {phase === "finished" && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Award size={20} className="text-amber-400" />
                  <h4 className="text-white font-bold">Interview Complete!</h4>
                </div>
                {summary && (
                  <div className="px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap mb-5">
                    {summary}
                  </div>
                )}
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Your Answers</p>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={i}>
                      <p className="text-indigo-400 text-xs font-medium mb-1">Q{i + 1}: {q.q}</p>
                      <p className="text-slate-400 text-xs pl-3 border-l-2 border-white/10">{q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {phase === "interviewing" && currentQ && (
            <div className="p-6 border-t border-white/[0.06] shrink-0">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={submitAnswer} disabled={!answer.trim() || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-sm transition-colors">
                <Send size={15} />
                {questions.length + 1 >= TOTAL_QUESTIONS ? "Submit & Finish" : "Submit Answer"}
              </motion.button>
            </div>
          )}

          {phase === "finished" && (
            <div className="p-6 border-t border-white/[0.06] shrink-0">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={restart}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors">
                <RotateCcw size={15} /> Practice Again
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MockInterview;