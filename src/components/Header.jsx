import { motion } from "framer-motion";

function Header({ greeting, messageCount }) {
  if (messageCount > 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-5 shadow-lg glow"
      >
        GI
      </motion.div>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-3xl font-bold text-gradient mb-2">
        {greeting}
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-slate-400 text-base max-w-md">
        I&apos;m GI — your personal AI companion. Ask me anything, share an image, or pick a quick action below.
      </motion.p>
    </motion.div>
  );
}

export default Header;