import { motion } from "framer-motion";

const ACTIONS = [
  { label: "✨ GI Chat", prompt: "Hello! What can you help me with today?" },
  { label: "📄 PDF Analysis", prompt: "Help me summarize and analyze a PDF document." },
  { label: "🧠 Smart Notes", prompt: "Help me create smart structured notes on a topic I will share." },
  { label: "💻 Code Help", prompt: "I have a coding problem. Help me debug and fix it." },
  { label: "📅 Study Plan", prompt: "Create a focused study plan for today." },
  { label: "🧪 Quiz Me", prompt: "Create a 5-question quiz on any topic I choose." },
];

function QuickActions({ onAction, hidden }) {
  if (hidden) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="max-w-3xl mx-auto px-4 pb-6 w-full"
    >
      <p className="text-slate-600 text-xs uppercase tracking-widest mb-3 text-center">
        What can GI help you with?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ACTIONS.map((a) => (
          <motion.button
            key={a.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAction(a.prompt)}
            className="px-4 py-3 rounded-2xl text-sm text-slate-300 glass border border-white/10 hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all duration-200 cursor-pointer text-left"
          >
            {a.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default QuickActions;