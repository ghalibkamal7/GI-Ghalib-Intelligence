import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Download, Lock, Unlock } from "lucide-react";

function ImageResizer({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [origDims, setOrigDims] = useState(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockRatio, setLockRatio] = useState(true);
  const [quality, setQuality] = useState(0.9);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const ratioRef = useRef(4 / 3);

  const loadFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setOrigDims({ width: img.naturalWidth, height: img.naturalHeight });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      ratioRef.current = img.naturalWidth / img.naturalHeight;
    };
    img.src = url;
    setFile(f);
    setPreviewUrl(url);
  };

  const handleFileInput = (e) => {
    loadFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    loadFile(e.dataTransfer.files[0]);
  };

  const updateWidth = (v) => {
    const w = parseInt(v, 10) || 0;
    setWidth(w);
    if (lockRatio) setHeight(Math.round(w / ratioRef.current));
  };

  const updateHeight = (v) => {
    const h = parseInt(v, 10) || 0;
    setHeight(h);
    if (lockRatio) setWidth(Math.round(h * ratioRef.current));
  };

  const applyPreset = (percent) => {
    if (!origDims) return;
    const w = Math.round(origDims.width * percent);
    const h = Math.round(origDims.height * percent);
    setWidth(w);
    setHeight(h);
  };

  const downloadResized = useCallback(() => {
    if (!previewUrl || !width || !height) return;
    setProcessing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `GI-resized-${width}x${height}.jpg`;
          link.click();
          setProcessing(false);
        },
        "image/jpeg",
        quality
      );
    };
    img.src = previewUrl;
  }, [previewUrl, width, height, quality]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      role="dialog" aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

          <div className="flex items-center justify-between p-6 border-b border-white/[0.06] shrink-0">
            <div>
              <h3 className="text-white font-bold text-lg">🖼️ Image Resize</h3>
              <p className="text-slate-500 text-xs mt-0.5">Resize & compress, entirely on-device</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
  <X size={18} />
</button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {!previewUrl ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-500/40 bg-white/[0.02] hover:bg-indigo-500/5 cursor-pointer transition-all"
              >
                <Upload size={22} className="text-slate-500" />
                <p className="text-slate-400 text-sm">Drag & drop an image, or click to browse</p>
              </div>
            ) : (
              <>
                <img src={previewUrl} alt="" className="w-full h-40 object-contain rounded-xl bg-black/30 mb-4" />
                <p className="text-slate-600 text-xs mb-4 text-center">
                  Original: {origDims?.width} × {origDims?.height}px
                </p>

                <div className="flex gap-2 mb-4">
                  {[0.25, 0.5, 0.75, 1].map((p) => (
                    <button key={p} onClick={() => applyPreset(p)}
                      className="flex-1 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-white/10 transition-all">
                      {Math.round(p * 100)}%
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1">
                    <label className="text-slate-500 text-xs block mb-1">Width</label>
                    <input type="number" value={width} onChange={(e) => updateWidth(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" />
                  </div>
                  <button onClick={() => setLockRatio((v) => !v)}
                    className="mt-5 p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
                    title={lockRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}>
                    {lockRatio ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <div className="flex-1">
                    <label className="text-slate-500 text-xs block mb-1">Height</label>
                    <input type="number" value={height} onChange={(e) => updateHeight(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="text-slate-500 text-xs block mb-1">Quality: {Math.round(quality * 100)}%</label>
                  <input type="range" min="0.3" max="1" step="0.05" value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500" />
                </div>

                <button onClick={() => { setPreviewUrl(null); setFile(null); setOrigDims(null); }}
                  className="text-xs text-slate-500 hover:text-white transition-colors mt-2">
                  ← Choose a different image
                </button>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
          </div>

          {previewUrl && (
            <div className="p-6 border-t border-white/[0.06] shrink-0">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={downloadResized} disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-colors">
                <Download size={16} />
                {processing ? "Processing..." : `Download (${width}×${height})`}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ImageResizer;