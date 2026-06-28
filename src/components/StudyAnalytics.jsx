import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, MessageSquare, Flame } from "lucide-react";

function StudyAnalytics({ isOpen, onClose, chats, messages }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isOpen || !chats || !messages) return;
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d.toDateString();
    });
    const msgsByDay = days.map((day) => ({
      label: new Date(day).toLocaleDateString("en", { weekday: "short" }),
      count: messages.filter((m) => {
        const d = m.createdAt?.toDate?.();
        return d && d.toDateString() === day;
      }).length,
    }));
    const totalMsgs = messages.length;
    const userMsgs = messages.filter((m) => m.role === "user").length;
    const topics = messages
      .filter((m) => m.role === "user" && m.text?.length > 5)
      .slice(-20)
      .map((m) => m.text.split(" ").slice(0, 3).join(" "));
    setStats({ msgsByDay, totalMsgs, userMsgs, totalChats: chats.length, topics });
  }, [isOpen, chats, messages]);

  if (!isOpen) return null;

  const maxCount = Math.max(...(stats?.msgsByDay?.map((d) => d.count) || [1]), 1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl p-7 w-full max-w-md mx-4 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <X size={18} />
          </button>
          <h3 className="text-white font-bold text-xl mb-1">📊 Study Analytics</h3>
          <p className="text-slate-500 text-xs mb-6">Your learning activity this week</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: <MessageSquare size={16} />, label: "Total Chats", value: stats?.totalChats || 0, color: "indigo" },
              { icon: <TrendingUp size={16} />, label: "Questions", value: stats?.userMsgs || 0, color: "purple" },
              { icon: <Flame size={16} />, label: "AI Replies", value: (stats?.totalMsgs || 0) - (stats?.userMsgs || 0), color: "emerald" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06] text-center">
                <div className={`text-${s.color}-400 flex justify-center mb-1`}>{s.icon}</div>
                <p className="text-white font-bold text-xl">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Messages This Week</p>
            <div className="flex items-end gap-2 h-28">
              {stats?.msgsByDay?.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.round((d.count / maxCount) * 100)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-purple-500 min-h-[4px]"
                  />
                  <span className="text-slate-600 text-xs">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {stats?.topics?.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Recent Topics</p>
              <div className="flex flex-wrap gap-2">
                {[...new Set(stats.topics)].slice(0, 8).map((t, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs text-slate-300 bg-white/5 border border-white/10">
                    {t}...
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StudyAnalytics;