const STORAGE_KEY = "gi-sound-enabled";

export function isSoundEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on) {
  try { localStorage.setItem(STORAGE_KEY, String(on)); } catch { /* ignore */ }
}

let ctx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone({ freq = 440, duration = 0.12, type = "sine", gain = 0.05, delay = 0 }) {
  if (!isSoundEnabled()) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g);
  g.connect(audioCtx.destination);
  const start = audioCtx.currentTime + delay;
  osc.start(start);
  g.gain.linearRampToValueAtTime(gain, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.stop(start + duration + 0.02);
}

export function playBoot() {
  tone({ freq: 220, duration: 0.18, type: "sine", gain: 0.04 });
  tone({ freq: 440, duration: 0.22, type: "sine", gain: 0.045, delay: 0.15 });
  tone({ freq: 660, duration: 0.3, type: "sine", gain: 0.05, delay: 0.32 });
}

export function playLampClick() {
  tone({ freq: 800, duration: 0.05, type: "square", gain: 0.03 });
}

export function playAssistantOpen() {
  tone({ freq: 520, duration: 0.1, type: "sine", gain: 0.04 });
  tone({ freq: 780, duration: 0.15, type: "sine", gain: 0.04, delay: 0.08 });
}

export function playNotification() {
  tone({ freq: 660, duration: 0.09, type: "sine", gain: 0.04 });
  tone({ freq: 880, duration: 0.12, type: "sine", gain: 0.04, delay: 0.07 });
}

// A subtle "futuristic activation" chime for the signature Open Palm
// gesture — a quick rising sweep rather than a flat beep.
export function playGestureActivate() {
  tone({ freq: 440, duration: 0.08, type: "sine", gain: 0.035 });
  tone({ freq: 660, duration: 0.1, type: "sine", gain: 0.04, delay: 0.06 });
  tone({ freq: 990, duration: 0.16, type: "sine", gain: 0.045, delay: 0.13 });
}

// A soft, low-key tick for lightweight gesture feedback (thumbs up,
// two-fingers, pinch, fist) — deliberately quieter/shorter than the
// activation chime so it doesn't compete with it.
export function playGestureTick() {
  tone({ freq: 720, duration: 0.05, type: "triangle", gain: 0.025 });
}