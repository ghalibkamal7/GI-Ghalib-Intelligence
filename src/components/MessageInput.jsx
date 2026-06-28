import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ImagePlus, X } from "lucide-react";

function MessageInput({ value, setValue, onSend, loading }) {
  const [image, setImage] = useState(null);
  const fileRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = () => {
    if (!value.trim() && !image) return;
    onSend({ text: value, image });
    setValue("");
    setImage(null);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="border-t border-white/[0.07] bg-[#0a0f1e]/80 backdrop-blur-sm px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence>
          {image && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 relative inline-block">
              <img src={image} alt="Preview" className="h-20 rounded-xl border border-white/10 object-cover" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md hover:bg-red-600 transition-colors">
                <X size={11} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 glass rounded-2xl px-4 py-3 border border-white/10 focus-within:border-indigo-500/50 transition-colors duration-200">
          <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all shrink-0 mb-0.5" title="Attach image">
            <ImagePlus size={18} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />

          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
            }}
            onKeyDown={handleKey}
            placeholder="Ask GI anything... (Enter to send, Shift+Enter for newline)"
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 resize-none outline-none text-sm leading-relaxed max-h-40 overflow-y-auto"
            style={{ height: "24px" }}
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={loading || (!value.trim() && !image)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0 mb-0.5"
          >
            <Send size={16} />
          </motion.button>
        </div>
        <p className="text-center text-slate-700 text-xs mt-2">GI can make mistakes. Double-check important info.</p>
      </div>
    </div>
  );
}

export default MessageInput;