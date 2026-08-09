import { useRef, useState, useCallback, useEffect } from "react";
import { classifyHandGesture } from "../utils/gestureDetection";

// ── Tunables ────────────────────────────────────────────────
const STABILITY_MS = 800;        // how long a gesture must hold steady before it "fires"
const COOLDOWN_MS = 1800;        // minimum gap between two triggers of the same gesture
const DISPLAY_MS = 1500;         // how long the UI shows "X detected" after a trigger
const WAVE_WINDOW_MS = 1200;     // time window used to detect side-to-side wrist motion
const WAVE_MIN_REVERSALS = 2;    // direction changes needed inside that window to count as a wave
const DETECT_INTERVAL_MS = 90;   // ~11fps inference — plenty for gesture control, easy on CPU/battery

const VISION_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/**
 * Fully self-contained hand-gesture engine: owns the camera stream,
 * the MediaPipe HandLandmarker, the detection loop, and the
 * stability/debounce/cooldown state machine described in the spec:
 *
 *   detected -> stable ~700-1000ms -> trigger -> cooldown ~1.5-2s -> wait for release
 *
 * Everything per-frame lives in refs so re-renders only happen for
 * the handful of values the UI actually needs to react to.
 */
export function useHandGestures({ enabled, onGesture }) {
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");
  const [currentGesture, setCurrentGesture] = useState(null);
  const [handPresent, setHandPresent] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const intervalGateRef = useRef(0);
  const mountedRef = useRef(true);
  const onGestureRef = useRef(onGesture);
  useEffect(() => { onGestureRef.current = onGesture; }, [onGesture]);

  // Stability/cooldown state - plain mutable object in a ref, not
  // state, since it changes every frame and must never itself cause
  // a re-render.
  const gestureStateRef = useRef({
    candidate: null,        // gesture seen on the most recent frame(s)
    candidateSince: 0,      // ms timestamp candidate first appeared
    fired: null,            // gesture currently "active" (fired, awaiting release)
    lastFiredAt: {},        // { [gestureName]: timestamp } for per-gesture cooldown
    wristHistory: [],       // [{x, t}] for wave detection
    displayClearTimer: null,
  });

  const isDeviceSupported = useCallback(() => {
    return !!navigator.mediaDevices?.getUserMedia;
  }, []);

  const detectWave = useCallback((wristX, now, openHand) => {
    const st = gestureStateRef.current;
    if (!openHand) { st.wristHistory = []; return false; }
    st.wristHistory.push({ x: wristX, t: now });
    st.wristHistory = st.wristHistory.filter((p) => now - p.t <= WAVE_WINDOW_MS);
    if (st.wristHistory.length < 5) return false;

    let reversals = 0;
    let dir = 0;
    let minX = 1, maxX = 0;
    for (let i = 1; i < st.wristHistory.length; i++) {
      const d = st.wristHistory[i].x - st.wristHistory[i - 1].x;
      minX = Math.min(minX, st.wristHistory[i].x);
      maxX = Math.max(maxX, st.wristHistory[i].x);
      if (Math.abs(d) < 0.005) continue;
      const newDir = d > 0 ? 1 : -1;
      if (dir !== 0 && newDir !== dir) reversals++;
      dir = newDir;
    }
    return reversals >= WAVE_MIN_REVERSALS && (maxX - minX) > 0.12;
  }, []);

  const processFrame = useCallback((result, now) => {
    const st = gestureStateRef.current;
    const hasHand = result?.landmarks?.length > 0;
    setHandPresent((prev) => (prev !== hasHand ? hasHand : prev));

    if (!hasHand) {
      st.candidate = null;
      st.fired = null; // hand left the frame - release requirement satisfied
      st.wristHistory = [];
      return;
    }

    const landmarks = result.landmarks[0];
    const handedness = result.handedness?.[0]?.[0]?.categoryName;
    let gesture = classifyHandGesture(landmarks, handedness);

    // Wave overrides a held-open-palm reading when the wrist is
    // clearly oscillating side to side.
    const openHandLike = gesture === "open_palm";
    if (detectWave(landmarks[0].x, now, openHandLike)) {
      gesture = "wave";
    }

    if (!gesture) {
      st.candidate = null;
      return;
    }

    // Signature gesture (open_palm) requires the hand to fully leave
    // frame before it can fire again - everything else just needs
    // its per-gesture cooldown to expire.
    if (gesture === "open_palm" && st.fired === "open_palm") return;

    if (st.candidate !== gesture) {
      st.candidate = gesture;
      st.candidateSince = now;
      return;
    }

    const heldFor = now - st.candidateSince;
    if (heldFor < STABILITY_MS) return;

    const lastFired = st.lastFiredAt[gesture] || 0;
    if (now - lastFired < COOLDOWN_MS) return;

    // Trigger
    st.lastFiredAt[gesture] = now;
    if (gesture === "open_palm") st.fired = "open_palm";
    st.candidate = null;

    if (mountedRef.current) {
      setCurrentGesture(gesture);
      clearTimeout(st.displayClearTimer);
      st.displayClearTimer = setTimeout(() => {
        if (mountedRef.current) setCurrentGesture(null);
      }, DISPLAY_MS);
    }
    onGestureRef.current?.(gesture);
  }, [detectWave]);

  const loop = useCallback(() => {
    if (!mountedRef.current || !landmarkerRef.current || !videoRef.current) return;
    const now = performance.now();
    if (now - intervalGateRef.current >= DETECT_INTERVAL_MS) {
      intervalGateRef.current = now;
      const video = videoRef.current;
      if (video.readyState >= 2) {
        try {
          const result = landmarkerRef.current.detectForVideo(video, now);
          processFrame(result, now);
        } catch {
          // A stray frame failing to process isn't fatal - just skip it.
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [processFrame]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (landmarkerRef.current) {
      try { landmarkerRef.current.close(); } catch { /* noop */ }
      landmarkerRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    clearTimeout(gestureStateRef.current.displayClearTimer);
    gestureStateRef.current = {
      candidate: null, candidateSince: 0, fired: null,
      lastFiredAt: {}, wristHistory: [], displayClearTimer: null,
    };
    setIsActive(false);
    setHandPresent(false);
    setCurrentGesture(null);
  }, []);

  const start = useCallback(async () => {
    setError("");
    if (!isDeviceSupported()) {
      setIsSupported(false);
      setError("Gesture Control isn't supported on this device.");
      return;
    }
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      });
      if (!mountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      if (!landmarkerRef.current) {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: "GPU" },
          numHands: 1,
          runningMode: "VIDEO",
        });
      }

      if (!mountedRef.current) return;
      setIsActive(true);
      setIsLoading(false);
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error("Gesture Control failed to start:", err);
      setIsLoading(false);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setError("Camera permission was denied. Gesture Control needs camera access to work.");
      } else if (err?.name === "NotFoundError") {
        setError("No camera was found on this device.");
      } else {
        setIsSupported(false);
        setError("Gesture Control isn't supported on this device.");
      }
      stop();
    }
  }, [isDeviceSupported, loop, stop]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (enabled) start(); else stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { videoRef, isSupported, isLoading, isActive, error, currentGesture, handPresent, start, stop };
}