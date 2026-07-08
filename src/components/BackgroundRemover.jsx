import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Download, Info, Wand2 } from "lucide-react";

function BackgroundRemover({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [tolerance, setTolerance] = useState(32);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  const loadFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
  };

  const handleFileInput = (e) => { loadFile(e.target.files[0]); e.target.value = ""; };
  const handleDrop = (e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); };

  const removeBackground = () => {
    if (!previewUrl) return;
    setProcessing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const { width, height } = canvas;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      const corners = [
        0,
        (width - 1) * 4,
        (height - 1) * width * 4,
        ((height - 1) * width + (width - 1)) * 4,
      ];
      const bg = corners.reduce(
        (acc, idx) => {
          acc.r += data[idx]; acc.g += data[idx + 1]; acc.b += data[idx + 2];
          return acc;
        },
        { r: 0, g: 0, b: 0 }
      );
      bg.r /= corners.length; bg.g /= corners.length; bg.b /= corners.length;

      const visited = new Uint8Array(width * height);
      const stack = [];
      for (let x = 0; x < width; x++) { stack.push(x); stack.push((height - 1) * width + x); }
      for (let y = 0; y < height; y++) { stack.push(y * width); stack.push(y * width + (width - 1)); }

      const matches = (i) => {
        const idx = i * 4;
        const dr = data[idx] - bg.r, dg = data[idx + 1] - bg.g, db = data[idx + 2] - bg.b;
        return Math.sqrt(dr * dr + dg * dg + db * db) < tolerance;
      };

      while (stack.length) {
        const p = stack.pop();
        if (p < 0 || p >= width * height || visited[p]) continue;
        visited[p] = 1;
        if (!matches(p)) continue;
        data[p * 4 + 3] = 0;
        const x = p % width, y = Math.floor(p / width);
        if (x > 0) stack.push(p - 1);
        if (x < width - 1) stack.push(p + 1);
        if (y > 0) stack.push(p - width);
        if (y < height - 1) stack.push(p + width);
      }

      ctx.putImageData(imageData, 0, 0);
      setResultUrl(canvas.toDataURL("image/png"));
      setProcessing(false);
    };
    img.src = previewUrl;
  };

  const download = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `GI-no-bg-${Date.now()}.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

          <div className="flex items-center justify-between p-6 border-b border-white/[0.06] shrink-0">
            <div>
              <h3 className="text-white font-bold text-lg">✂️ Background Remover</h3>
              <p className="text-slate-500 text-xs mt-0.5">Best on plain / solid backgrounds</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
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
                <div
                  className="w-full h-48 rounded-xl mb-4 flex items-center justify-center"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                    backgroundColor: "#0f172a",
                  }}
                >
                  <img src={resultUrl || previewUrl} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>

                <div className="mb-4">
                  <label className="text-slate-500 text-xs block mb-1">Sensitivity: {tolerance}</label>
                  <input type="range" min="8" max="80" value={tolerance}
                    onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500" />
                  <p className="text-slate-700 text-xs mt-1">Higher = removes more of similar shades near the edges</p>
                </div>

                <button onClick={() => { setPreviewUrl(null); setResultUrl(null); setFile(null); }}
                  className="text-xs text-slate-500 hover:text-white transition-colors">
                  ← Choose a different image
                </button>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-start gap-2 mt-5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-slate-600 text-xs">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>Works by detecting a solid background color from the edges — great for ID photos or product shots, less precise on busy backgrounds.</span>
            </div>
          </div>

          {previewUrl && (
            <div className="p-6 border-t border-white/[0.06] shrink-0 flex gap-2">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={removeBackground} disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-colors">
                <Wand2 size={16} />
                {processing ? "Processing..." : "Remove Background"}
              </motion.button>
              {resultUrl && (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={download}
                  className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                  <Download size={16} />
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BackgroundRemover;