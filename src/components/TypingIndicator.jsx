import { motion } from "framer-motion";
import GILogo from "./GILogo";

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 mb-4"
    >
      {/* Spinning GI logo instead of 3 dots */}
      <div className="shrink-0 mt-0.5">
        <GILogo size={32} animate={true} spinning={true} />
      </div>
    </motion.div>
  );
}

export default TypingIndicator;