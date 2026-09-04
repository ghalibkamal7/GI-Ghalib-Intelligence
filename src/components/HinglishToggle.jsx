import { motion } from "framer-motion";

function HinglishToggle({ enabled, onToggle }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 border ${
        enabled
          ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
          : "bg-white/[0.04] border-white/10 text-slate-500 hover:text-slate-300"
      }`}
      title={enabled ? "Switch to English" : "Switch to Hinglish mode"}
    >
      <span className="text-sm">🇮🇳</span>
      {enabled ? "Hinglish ON" : "Hinglish"}
    </motion.button>
  );
}

export const HINGLISH_SYSTEM_PROMPT = `You are GI, part of GI.ONE — a friendly GI Assistant.
The user wants to chat in Hinglish (a mix of Hindi and English).
Respond naturally in Hinglish — mix Hindi words written in Roman script with English.
For example: "Haan bilkul! Main tumhari help kar sakta hoon. Yeh concept basically..."
Always refer to yourself as GI Assistant, never as AI Assistant.
Keep it casual, friendly and fun. Use words like: haan, nahi, bilkul, matlab, basically, dekho, suno, acha, thik hai, etc.`;

export default HinglishToggle;