import { motion, AnimatePresence } from "framer-motion";
import { GESTURE_LABELS } from "../utils/gestureDetection";

// A small, unobtrusive status pill — matches GI's existing glass/dark
// aesthetic rather than looking like a debug overlay. Shows on/off
// state at rest, and briefly flashes the recognized gesture's name
// when one fires.
function GestureIndicator({ isActive, isLoading, currentGesture, handPresent }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
          isActive
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-white/5 border-white/10 text-slate-500"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
          }`}
        />
        {isLoading ? "Starting..." : isActive ? "Gesture Control Active" : "Gesture Control Off"}
      </div>

      {isActive && handPresent && (
        <p className="text-[10px] text-slate-600">Hand detected</p>
      )}

      <AnimatePresence>
        {currentGesture && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium"
          >
            {GESTURE_LABELS[currentGesture] || currentGesture}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GestureIndicator;