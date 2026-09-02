import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, EyeOff, Eye } from "lucide-react";
import { useHandGestures } from "../hooks/useHandGestures";
import GestureIndicator from "./GestureIndicator";
import { emitGesture } from "../utils/gestureEvents";
import { emitHandPosition } from "../utils/handPosition";
import { playGestureActivate, playGestureTick } from "../utils/sounds";
import { getPreferredVoice, getVoiceGenderPref } from "../utils/giSpeech";

const STORAGE_KEY = "gi-gesture-control-enabled";

function loadPref() {
  try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
}
function savePref(v) {
  try { localStorage.setItem(STORAGE_KEY, String(v)); } catch { /* ignore */ }
}

function speakHelloG() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utt = new SpeechSynthesisUtterance("Hello... G...");
  utt.lang = "en-IN";
  utt.rate = 0.85;
  const voice = getPreferredVoice(synth, getVoiceGenderPref());
  if (voice) utt.voice = voice;
  synth.speak(utt);
}

// Short spoken acknowledgments for the other gestures, so GI feels
// conversational whether the person is talking to it or signing to
// it — not just a silent beep. Deliberately brief and non-interrupting:
// it doesn't cancel() any in-progress speech, so it queues politely
// after whatever the assistant is already saying.
function speakAck(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-IN";
  utt.rate = 1.05;
  const voice = getPreferredVoice(synth, getVoiceGenderPref());
  if (voice) utt.voice = voice;
  synth.speak(utt);
}

function GestureControl({
  onActivate,
  onOpenAssistant,
  onConfirm,
  onNext,
  onStop,
  onSelect,
  onStateChange,   // optional: ({enabled, isActive, currentGesture, handPresent}) => void
}) {
  const [enabled, setEnabled] = useState(loadPref);
  const [previewHidden, setPreviewHidden] = useState(false);
  const [showHint, setShowHint] = useState(false);
  // Bottom-right by default so the preview never sits over chat
  // content or the top toolbar — computed from window size so it
  // works on any screen, and re-clamped on resize/orientation change.
  const [dragPos, setDragPos] = useState(() => ({
    x: Math.max(8, (typeof window !== "undefined" ? window.innerWidth : 400) - 176),
    y: Math.max(8, (typeof window !== "undefined" ? window.innerHeight : 700) - 260),
  }));
  const dragState = useRef(null);
  const overlayCanvasRef = useRef(null);

  const handleGesture = useCallback((gesture) => {
    emitGesture(gesture);
    switch (gesture) {
      case "open_palm":
        playGestureActivate();
        speakHelloG();
        onActivate?.();
        break;
      case "wave":
        playGestureActivate();
        speakAck("Hey there!");
        onOpenAssistant?.();
        break;
      case "thumbs_up":
        playGestureTick();
        speakAck("Got it.");
        onConfirm?.();
        break;
      case "two_fingers":
        playGestureTick();
        speakAck("Next.");
        onNext?.();
        break;
      case "fist":
        playGestureTick();
        onStop?.();
        break;
      case "pinch":
        playGestureTick();
        speakAck("Selected.");
        onSelect?.();
        break;
      default:
        break;
    }
  }, [onActivate, onOpenAssistant, onConfirm, onNext, onStop, onSelect]);
  const { videoRef, isSupported, isLoading, isActive, error, currentGesture, handPresent } =
    useHandGestures({ enabled, onGesture: handleGesture, overlayCanvasRef, onHandMove: emitHandPosition });
  
  useEffect(() => {
    onStateChange?.({ enabled, isActive, currentGesture, handPresent });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isActive, currentGesture, handPresent]);

  useEffect(() => {
    if (isActive) {
      setShowHint(true);
      const t = setTimeout(() => setShowHint(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    savePref(next);
  };

  const onDragStart = (e) => {
    const point = e.touches ? e.touches[0] : e;
    dragState.current = { startX: point.clientX, startY: point.clientY, origin: dragPos };
  };
  const onDragMove = (e) => {
    if (!dragState.current) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - dragState.current.startX;
    const dy = point.clientY - dragState.current.startY;
    const maxX = window.innerWidth - 168;
    const maxY = window.innerHeight - 130;
    setDragPos({
      x: Math.min(maxX, Math.max(8, dragState.current.origin.x + dx)),
      y: Math.min(maxY, Math.max(8, dragState.current.origin.y + dy)),
    });
  };
  const onDragEnd = () => { dragState.current = null; };

  useEffect(() => {
    if (!dragState.current) return;
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove);
    window.addEventListener("touchend", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
      window.removeEventListener("touchmove", onDragMove);
      window.removeEventListener("touchend", onDragEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return (
    <>
      <button
        onClick={toggle}
        aria-label={enabled ? "Turn off Gesture Control" : "Turn on Gesture Control"}
        title={enabled ? "Turn off Gesture Control" : "Turn on Gesture Control"}
        className={`p-1.5 rounded-lg transition-colors ${
          enabled ? "text-indigo-400 hover:text-indigo-300 bg-indigo-500/10" : "text-slate-600 hover:text-white"
        }`}
      >
        <Hand size={14} />
      </button>

      {!enabled ? null : (
        <>
          <div className="fixed top-16 sm:top-20 right-3 z-40 pointer-events-none">
            <div className="pointer-events-auto">
              <GestureIndicator
                isActive={isActive}
                isLoading={isLoading}
                currentGesture={currentGesture}
                handPresent={handPresent}
              />
            </div>
          </div>

          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed top-28 sm:top-32 right-3 z-40 px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs max-w-[220px]"
              >
                Show your hand to GI ✋
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="fixed top-28 sm:top-32 right-3 z-40 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs max-w-[240px]">
              {error}
            </div>
          )}

          {previewHidden ? (
            <>
              <video ref={videoRef} muted playsInline className="hidden" />
              {isActive && (
                <button
                  onClick={() => setPreviewHidden(false)}
                  aria-label="Show camera preview"
                  title="Show Camera Preview"
                  className="fixed z-40 bottom-24 left-3 p-2 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white"
                >
                  <Eye size={14} />
                </button>
              )}
            </>
          ) : (
            <div
              className="fixed z-40 w-40 h-32 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-2xl bg-black cursor-grab active:cursor-grabbing select-none"
              style={{ left: dragPos.x, top: dragPos.y }}
              onMouseDown={onDragStart}
              onTouchStart={onDragStart}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover -scale-x-100"
              />
              {/* Glowing skeleton overlay — drawn by useHandGestures
                  directly onto this canvas every detected frame, in
                  exact sync with the video underneath it. */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none"
              />
              {isActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewHidden(true); }}
                  aria-label="Hide camera preview"
                  title="Hide Camera Preview"
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:text-white z-10"
                >
                  <EyeOff size={11} />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default GestureControl;