import { motion } from "framer-motion";

const ACTIONS = [
  { label: "📄 Summarize PDF", prompt: "Help me summarize a PDF document." },
  { label: "📝 Smart Notes", prompt: "Help me create smart structured notes on a topic." },
  { label: "🧠 Quiz Me", prompt: "Create a 5-question quiz on any topic I choose." },
  { label: "💻 Debug Code", prompt: "I have a coding problem. Help me debug and fix it." },
  { label: "📅 Study Plan", prompt: "Create a focused study plan for today." },
  { label: "📸 Solve Image", prompt: "I'll upload an image with a question. Please solve it." },
];

function QuickActions({ onAction, hidden }) {
  if (hidden) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="max-w-3xl mx-auto px-4 pb-6 w-full">
      <p className="text-slate-600 text-xs uppercase tracking-widest mb-3 text-center">Quick Actions</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {ACTIONS.map((a) => (
          <motion.button
            key={a.label}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAction(a.prompt)}
            className="px-4 py-2 rounded-2xl text-sm text-slate-300 glass border border-white/10 hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all duration-200 cursor-pointer"
          >
            {a.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default QuickActions;