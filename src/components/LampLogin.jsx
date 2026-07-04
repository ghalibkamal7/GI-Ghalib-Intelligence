import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playLampClick } from "../utils/sounds";

function LampLogin({ on, onToggle }) {
  const [pulling, setPulling] = useState(false);

  const handlePull = () => {
    playLampClick();
    setPulling(true);
    setTimeout(() => setPulling(false), 220);
    onToggle();
  };

  return (
    <div className="relative flex flex-col items-center h-full justify-center select-none">
      <div className="w-10 h-2 rounded-b-md bg-slate-700/80 shrink-0" />
      <div className="w-[2px] bg-slate-600/70" style={{ height: 90 }} />

      <motion.div
        animate={{ rotate: pulling ? [0, -6, 5, -2, 0] : [0, 1.5, -1.5, 0] }}
        transition={
          pulling
            ? { duration: 0.6, ease: "easeOut" }
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ transformOrigin: "top center" }}
        className="flex flex-col items-center cursor-pointer"
        onClick={handlePull}
      >
        <svg width="90" height="60" viewBox="0 0 90 60">
          <polygon points="30,0 60,0 90,55 0,55" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <ellipse cx="45" cy="55" rx="45" ry="4" fill="#0f172a" />
        </svg>

        <div className="relative -mt-1 flex flex-col items-center">
          <AnimatePresence>
            {on && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.35 }}
                className="absolute -top-2 w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(250,204,21,0.55) 0%, rgba(250,204,21,0.15) 40%, transparent 70%)",
                }}
              />
            )}
          </AnimatePresence>
          <div
            className="w-4 h-5 rounded-full transition-colors duration-300"
            style={{
              background: on ? "#facc15" : "#3f3f46",
              boxShadow: on ? "0 0 20px 6px rgba(250,204,21,0.65)" : "none",
            }}
          />
        </div>

        <motion.div
          animate={{ height: pulling ? 46 : 34 }}
          transition={{ duration: 0.2 }}
          className="w-[1.5px] bg-slate-500 mt-1"
        />
        <div className="w-2 h-2.5 rounded-sm bg-slate-500 -mt-0.5" />
      </motion.div>

      <p className="text-slate-700 text-xs mt-6 tracking-wide">
        {on ? "Tap the bulb to turn off" : "Tap the bulb to turn on"}
      </p>

      <AnimatePresence>
        {on && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-[150px] left-1/2 -translate-x-1/2 w-[420px] h-[420px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(250,204,21,0.14) 0%, transparent 65%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default LampLogin;