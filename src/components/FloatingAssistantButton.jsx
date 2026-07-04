import { motion } from "framer-motion";
import GILogo from "./GILogo";
import { playAssistantOpen } from "../utils/sounds";

function FloatingAssistantButton({ onOpen }) {
  const handleClick = () => {
    playAssistantOpen();
    onOpen();
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 16 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
      title="Talk to GI Assistant"
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full glass-strong border border-indigo-500/30 flex items-center justify-center shadow-2xl"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <GILogo size={34} animate={false} glow />
      </motion.div>
    </motion.button>
  );
}

export default FloatingAssistantButton;