import { useRef, useState, useCallback, useEffect } from "react";
import { classifyHandGesture } from "../utils/gestureDetection";

const STABILITY_MS = 800;
const COOLDOWN_MS = 1800;
const DISPLAY_MS = 1500;
const WAVE_WINDOW_MS = 1200;
const WAVE_MIN_REVERSALS = 2;
const DETECT_INTERVAL_MS = 90;
const OVERLAY_RES = 320;

const VISION_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// Standard 21-point MediaPipe hand topology — which landmark indices
// are connected by a "bone" for the skeleton overlay.
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

/**
 * Fully self-contained hand-gesture engine: owns the camera stream,
 * the MediaPipe HandLandmarker, the detection loop, and the
 * stability/debounce/cooldown state machine:
 *
 *   detected -> stable ~700-1000ms -> trigger -> cooldown ~1.5-2s -> wait for release
 *
 * If an `overlayCanvasRef` is passed in, the glowing skeleton overlay
 * is drawn directly onto it inside the SAME per-frame loop — plain
 * canvas 2D calls that never trigger a React re-render.
 */
export function useHandGestures({ enabled, onGesture, overlayCanvasRef }) {
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

  const gestureStateRef = useRef({
    candidate: null,
    candidateSince: 0,
    fired: null,
    lastFiredAt: {},
    wristHistory: [],
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

  const drawSkeleton = useCallback((landmarks) => {
    const canvas = overlayCanvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (canvas.width !== OVERLAY_RES) canvas.width = OVERLAY_RES;
    if (canvas.height !== OVERLAY_RES) canvas.height = OVERLAY_RES;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    const toPx = (pt) => [pt.x * canvas.width, pt.y * canvas.height];

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(34, 211, 238, 0.85)";
    ctx.shadowColor = "rgba(34, 211, 238, 0.9)";
    ctx.shadowBlur = 6;
    for (const [a, b] of HAND_CONNECTIONS) {
      const [ax, ay] = toPx(landmarks[a]);
      const [bx, by] = toPx(landmarks[b]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    const TIP_INDICES = new Set([4, 8, 12, 16, 20]);
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = toPx(landmarks[i]);
      const isTip = TIP_INDICES.has(i);
      ctx.beginPath();
      ctx.arc(x, y, isTip ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? "rgba(216, 180, 254, 0.95)" : "rgba(34, 211, 238, 0.9)";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = isTip ? 8 : 4;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }, [overlayCanvasRef]);

  const processFrame = useCallback((result, now) => {
    const st = gestureStateRef.current;
    const hasHand = result?.landmarks?.length > 0;
    setHandPresent((prev) => (prev !== hasHand ? hasHand : prev));

    if (!hasHand) {
      st.candidate = null;
      st.fired = null;
      st.wristHistory = [];
      drawSkeleton(null);
      return;
    }

    const landmarks = result.landmarks[0];
    drawSkeleton(landmarks);
    const handedness = result.handedness?.[0]?.[0]?.categoryName;
    let gesture = classifyHandGesture(landmarks, handedness);

    const openHandLike = gesture === "open_palm";
    if (detectWave(landmarks[0].x, now, openHandLike)) {
      gesture = "wave";
    }

    if (!gesture) {
      st.candidate = null;
      return;
    }

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
  }, [detectWave, drawSkeleton]);

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
          // A stray frame failing to process isn't fatal
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
    if (overlayCanvasRef?.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
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