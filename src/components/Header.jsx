import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import GIOrb from "./GIOrb";

const QUICK_PROMPTS = [
  { icon: "🧠", text: "Explain like I'm 10" },
  { icon: "💡", text: "Give me a fun fact" },
  { icon: "📚", text: "Help me study" },
  { icon: "🔥", text: "Motivate me" },
];

function Header({ greeting, messageCount, onAction }) {
  const { user } = useAuth();
  if (messageCount > 0) return null;
  const firstName = user?.displayName?.split(" ")[0] || "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-8 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-3"
      >
        <GIOrb size={160} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-gradient mb-2"
      >
        {greeting}, {firstName}!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-slate-400 text-sm max-w-sm mb-6"
      >
        Learn Smarter With GI
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {QUICK_PROMPTS.map((q) => (
          <motion.button
            key={q.text}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAction?.(q.text)}
            className="px-4 py-2 rounded-2xl text-sm text-slate-300 glass border border-white/10 hover:border-indigo-500/30 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all cursor-pointer"
          >
            {q.icon} {q.text}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Header;