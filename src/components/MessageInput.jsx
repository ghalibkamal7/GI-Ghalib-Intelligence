import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ImagePlus, X, Mic, MicOff } from "lucide-react";
import { normalizeSpokenGI } from "../utils/giSpeech";


function MessageInput({ value, setValue, onSend, loading, onVoiceOpen }) {
  const [image, setImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const valueRef = useRef(value);
  const imageRef = useRef(image);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { imageRef.current = image; }, [image]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-IN";
    r.onresult = (e) => {
      const raw = e.results[0][0].transcript;
      const t = normalizeSpokenGI(raw);
      setValue((prev) => prev + (prev ? " " : "") + t);
      setIsListening(false);
    };
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    recognitionRef.current = r;
  }, []);

  // Firestore rejects any document field over ~1MB — a raw phone photo
  // (2-5MB) blows straight through that as base64. Every image gets
  // downscaled + re-encoded as JPEG here before it ever reaches state,
  // so it can never silently fail to save later.
  const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const scale = MAX_DIM / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try progressively lower quality until it's safely under
        // Firestore's limit (750KB leaves headroom for the rest of
        // the document's fields).
        let quality = 0.82;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 750000 && quality > 0.35) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        if (dataUrl.length > 750000) {
          reject(new Error("Image is too large even after compression. Try a smaller photo."));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Couldn't read that image file."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });

  const [imageError, setImageError] = useState("");

  const handleImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImageError("");
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
    } catch (err) {
      setImageError(err.message);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageError("");
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
    } catch (err) {
      setImageError(err.message);
    }
  };

  const sendingRef = useRef(false);

  const handleSend = () => {
    const text = valueRef.current;
    const img = imageRef.current;
    if (!text.trim() && !img) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    onSend({ text, image: img });
    setValue("");
    setImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }
    setTimeout(() => { sendingRef.current = false; }, 300);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) { onVoiceOpen?.(); return; }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const resizeTextarea = (e) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div
      className="border-t border-white/[0.06] bg-[#0a0f1e]/90 backdrop-blur-md px-3 sm:px-4 py-3 sm:py-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="max-w-3xl mx-auto">
        {imageError && (
          <p className="text-red-400 text-xs mb-2 px-1">{imageError}</p>
        )}
        <AnimatePresence>
          {image && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 relative inline-block"
            >
              <img src={image} alt="Preview"
                className="h-20 rounded-xl border border-white/10 object-cover shadow-lg" />
              <button onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-md transition-colors">
                <X size={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex items-end gap-2 glass rounded-2xl px-3 sm:px-4 py-3 transition-all duration-200 ${
          loading ? "border-white/5" : "border-white/10 focus-within:border-indigo-500/40"
        } border`}>
          <button onClick={() => fileRef.current?.click()}
            title="Attach image (or drag & drop)"
            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all shrink-0 mb-0.5 tooltip"
            data-tip="Attach image">
            <ImagePlus size={17} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={resizeTextarea}
            onKeyDown={handleKey}
            placeholder={loading ? "GI is thinking..." : "Ask GI anything... (Enter to send)"}
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 resize-none outline-none text-sm leading-relaxed max-h-40 overflow-y-auto disabled:opacity-50"
            style={{ height: "24px" }}
          />

          <button onClick={toggleMic}
            title={isListening ? "Stop listening" : "Voice input"}
            className={`p-1.5 rounded-xl transition-all shrink-0 mb-0.5 ${
              isListening
                ? "text-red-400 bg-red-500/15 animate-pulse"
                : "text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
            }`}>
            {isListening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleSend}
            disabled={loading || (!value.trim() && !image)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all shrink-0 mb-0.5 shadow-md"
          >
            <Send size={15} />
          </motion.button>
        </div>

        <p className="text-center text-slate-700 text-xs mt-2 hidden sm:block">
          Enter to send · Shift+Enter for newline · Drag & drop images
        </p>
      </div>
    </div>
  );
}

export default MessageInput;