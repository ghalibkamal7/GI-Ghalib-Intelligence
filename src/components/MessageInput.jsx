import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ImagePlus, X, Mic, MicOff } from "lucide-react";
import { normalizeSpokenGI } from "../utils/giSpeech";


const MAX_IMAGES = 4;

function MessageInput({ value, setValue, onSend, loading, onVoiceOpen }) {
  const [images, setImages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const valueRef = useRef(value);
  const imagesRef = useRef(images);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { imagesRef.current = images; }, [images]);

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

  const addFiles = async (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setImageError("");

    const room = MAX_IMAGES - imagesRef.current.length;
    if (room <= 0) {
      setImageError(`You can attach up to ${MAX_IMAGES} images at once.`);
      return;
    }
    const toAdd = imageFiles.slice(0, room);
    if (imageFiles.length > toAdd.length) {
      setImageError(`Only added ${toAdd.length} — max ${MAX_IMAGES} images per message.`);
    }

    const results = await Promise.allSettled(toAdd.map(compressImage));
    const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failed = results.some((r) => r.status === "rejected");
    if (failed && !imageError) {
      setImageError("One or more images couldn't be processed and were skipped.");
    }
    if (succeeded.length) {
      setImages((prev) => [...prev, ...succeeded]);
    }
    // The native OS file picker steals focus away from the textarea
    // and doesn't return it — without this, Enter (or even typing)
    // right after attaching an image goes nowhere because nothing is
    // focused to receive it.
    textareaRef.current?.focus();
  };

  const handleImage = async (e) => {
    // Extract into a real array BEFORE resetting the input — e.target.files
    // is a "live" FileList tied to the input element, so clearing
    // e.target.value also empties that same list out from under any
    // variable still pointing at it. Array.from() copies the File
    // object references out first, so they survive the reset.
    const fileList = Array.from(e.target.files || []);
    e.target.value = "";
    if (!fileList.length) return;
    await addFiles(fileList);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (!e.dataTransfer.files?.length) return;
    await addFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const sendingRef = useRef(false);

  const handleSend = () => {
    const text = valueRef.current;
    const imgs = imagesRef.current;
    if (!text.trim() && !imgs.length) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    onSend({ text, images: imgs });
    setValue("");
    setImages([]);
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
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            <AnimatePresence>
              {images.map((img, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative inline-block"
                >
                  <img src={img} alt={`Preview ${i + 1}`}
                    className="h-20 rounded-xl border border-white/10 object-cover shadow-lg" />
                  <button onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-md transition-colors">
                    <X size={10} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className={`flex items-end gap-2 glass rounded-2xl px-3 sm:px-4 py-3 transition-all duration-200 ${
          loading ? "border-white/5" : "border-white/10 focus-within:border-cyan-500/40"
        } border`}>
          <button onClick={() => fileRef.current?.click()}
            title="Attach image (or drag & drop)"
            className="p-1.5 rounded-xl text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all shrink-0 mb-0.5 tooltip"
            data-tip="Attach image">
            <ImagePlus size={17} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImage} className="hidden" />

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
                : "text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10"
            }`}>
            {isListening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleSend}
            disabled={loading || (!value.trim() && !images.length)}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all shrink-0 mb-0.5 shadow-md"
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