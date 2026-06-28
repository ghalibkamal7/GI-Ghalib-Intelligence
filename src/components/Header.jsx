import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function Header({ greeting, messageCount }) {
  const { user } = useAuth();
  if (messageCount > 0) return null;

  const firstName = user?.displayName?.split(" ")[0] || "there";

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
        className="text-slate-400 text-base max-w-md"
      >
        Learn Smarter With GI
      </motion.p>
    </motion.div>
  );
}

export default Header;