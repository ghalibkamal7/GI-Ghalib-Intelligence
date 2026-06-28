import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

function SmartSuggestions({ suggestions, onSelect, visible }) {
  if (!visible || !suggestions || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="max-w-3xl mx-auto px-4 pb-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={12} className="text-indigo-400" />
          <span className="text-xs text-slate-500 uppercase tracking-widest">Follow-up suggestions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(s)}
              className="px-3 py-1.5 rounded-xl text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-400/40 transition-all duration-200 cursor-pointer text-left"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SmartSuggestions;