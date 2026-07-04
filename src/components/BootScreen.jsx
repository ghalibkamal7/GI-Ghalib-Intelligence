import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GILogo from "./GILogo";
import { playBoot } from "../utils/sounds";

const STEPS = [
  "Initializing...",
  "Loading AI Engine...",
  "Connecting Neural Network...",
  "Preparing Workspace...",
];

function BootScreen({ userName, onDone }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    playBoot();
    const stepInterval = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 480);

    const finish = setTimeout(() => {
      clearInterval(stepInterval);
      setDone(true);
      setTimeout(onDone, 500);
    }, 2400);

    return () => { clearInterval(stepInterval); clearTimeout(finish); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05060f]"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <GILogo size={96} animate spinning glow />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white font-semibold text-lg mt-8 tracking-wide"
          >
            GHALIB INTELLIGENCE
          </motion.p>

          <div className="h-6 mt-3">
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-slate-500 text-xs tracking-widest uppercase"
              >
                {stepIdx < STEPS.length ? STEPS[stepIdx] : `Welcome${userName ? `, ${userName}` : ""}.`}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="w-52 h-[3px] rounded-full bg-white/[0.06] mt-6 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.3, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BootScreen;