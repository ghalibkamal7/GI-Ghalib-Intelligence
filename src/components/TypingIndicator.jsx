import { motion } from "framer-motion";
import GILogo from "./GILogo";

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 mb-4"
    >
      <div className="shrink-0 mt-1">
        <GILogo size={40} animate={true} spinning={true} />
      </div>
    </motion.div>
  );
}

export default TypingIndicator;