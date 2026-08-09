// Pure geometry helpers that turn 21 MediaPipe hand landmarks into a
// named gesture. No React, no camera code — just math — so it's easy
// to unit-test and to mock out entirely in Playwright.
//
// MediaPipe hand landmark indices (same for every detected hand):
//   0 wrist
//   1-4   thumb  (CMC, MCP, IP, TIP)
//   5-8   index  (MCP, PIP, DIP, TIP)
//   9-12  middle (MCP, PIP, DIP, TIP)
//   13-16 ring   (MCP, PIP, DIP, TIP)
//   17-20 pinky  (MCP, PIP, DIP, TIP)

const FINGERS = {
  thumb:  { mcp: 2, pip: 3, tip: 4 },
  index:  { mcp: 5, pip: 6, tip: 8 },
  middle: { mcp: 9, pip: 10, tip: 12 },
  ring:   { mcp: 13, pip: 14, tip: 16 },
  pinky:  { mcp: 17, pip: 18, tip: 20 },
};

function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// A non-thumb finger counts as "extended" when its tip is meaningfully
// further from the wrist than its middle knuckle (PIP) is — this is
// scale-invariant (works whether the hand fills the frame or is far
// away) unlike a fixed pixel-distance threshold would be.
function isFingerExtended(landmarks, finger) {
  const { mcp, pip, tip } = FINGERS[finger];
  const wrist = landmarks[0];
  return dist(landmarks[tip], wrist) > dist(landmarks[pip], wrist) * 1.15
      && dist(landmarks[tip], wrist) > dist(landmarks[mcp], wrist);
}

// Thumb extension is judged differently — it moves mostly sideways
// relative to the palm rather than up/down like the other fingers.
function isThumbExtended(landmarks, handedness) {
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];
  const palmWidth = dist(indexMcp, pinkyMcp) || 0.001;
  // Thumb tip should sit clearly outside the line from index-MCP to
  // pinky-MCP (i.e. away from the palm), scaled by palm width so it
  // works at any distance from the camera.
  return dist(thumbTip, thumbMcp) > palmWidth * 0.55;
}

function fingerStates(landmarks, handedness) {
  return {
    thumb: isThumbExtended(landmarks, handedness),
    index: isFingerExtended(landmarks, "index"),
    middle: isFingerExtended(landmarks, "middle"),
    ring: isFingerExtended(landmarks, "ring"),
    pinky: isFingerExtended(landmarks, "pinky"),
  };
}

// Normalized pinch distance between thumb tip and index tip, scaled
// by palm width so "how close counts as a pinch" doesn't depend on
// how close the hand is to the camera.
function pinchDistance(landmarks) {
  const palmWidth = dist(landmarks[5], landmarks[17]) || 0.001;
  return dist(landmarks[4], landmarks[8]) / palmWidth;
}

/**
 * Classify a single hand's 21 landmarks into one of the gestures GI
 * understands, or null if nothing recognizable is held right now.
 * This only looks at ONE frame — temporal stability (holding the
 * gesture for ~700ms) is handled separately by useHandGestures.
 */
export function classifyHandGesture(landmarks, handedness) {
  if (!landmarks || landmarks.length < 21) return null;

  const f = fingerStates(landmarks, handedness);
  const extendedCount = [f.index, f.middle, f.ring, f.pinky].filter(Boolean).length;
  const pinch = pinchDistance(landmarks);

  // Pinch takes priority — it's a fine-motor gesture that can look
  // like a half-open hand otherwise.
  if (pinch < 0.35) return "pinch";

  // Open palm: all 5 fingers extended
  if (f.thumb && extendedCount === 4) return "open_palm";

  // Fist: nothing extended
  if (!f.thumb && extendedCount === 0) return "fist";

  // Thumbs up: only thumb extended, and it's pointing upward
  // (smaller y = higher on screen in normalized image coordinates)
  if (f.thumb && extendedCount === 0) {
    const thumbTip = landmarks[4];
    const wrist = landmarks[0];
    if (thumbTip.y < wrist.y - 0.05) return "thumbs_up";
  }

  // Two fingers (peace sign): index + middle extended, ring + pinky curled
  if (f.index && f.middle && !f.ring && !f.pinky) return "two_fingers";

  return null;
}

// Gesture display metadata — used by the indicator UI so the visual
// label and the internal key never drift apart.
export const GESTURE_LABELS = {
  open_palm: "Open Palm detected",
  fist: "Fist detected",
  thumbs_up: "Thumbs Up detected",
  two_fingers: "Two Fingers detected",
  pinch: "Pinch detected",
  wave: "Wave detected",
};