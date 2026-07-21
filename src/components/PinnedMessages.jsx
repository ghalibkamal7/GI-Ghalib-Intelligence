import { motion, AnimatePresence } from "framer-motion";
import { X, Pin } from "lucide-react";

function PinnedMessages({ pins, isOpen, onClose, onUnpin }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      role="dialog" aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Pin size={16} className="text-indigo-400" />
              <h3 className="text-white font-bold">Pinned Messages</h3>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
  <X size={18} />
</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pins.length === 0 ? (
              <div className="text-center py-10 text-slate-600">
                <Pin size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pinned messages yet</p>
                <p className="text-xs mt-1">Hover over any GI reply and click Pin</p>
              </div>
            ) : (
              pins.map((pin, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="group flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/20 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                    GI
                  </div>
                  <p className="flex-1 text-slate-300 text-sm leading-relaxed line-clamp-3">{pin.text}</p>
                  <button onClick={() => onUnpin(i)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all shrink-0">
                    <X size={13} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PinnedMessages;