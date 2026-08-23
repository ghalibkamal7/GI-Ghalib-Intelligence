// A SEPARATE, dedicated pub/sub for continuous hand position (not the
// same channel as gestureEvents.js, which is for discrete named
// gestures). Keeping these separate matters: hand position updates
// fire on every detected frame (~11 times/second) while a hand is
// visible, and JarvisDashboard's activity feed logs every named
// gesture — mixing the two channels would spam that feed with a new
// log line 11 times a second.
const target = new EventTarget();

export function emitHandPosition(x, y, present) {
  target.dispatchEvent(new CustomEvent("gi:hand-position", { detail: { x, y, present } }));
}

export function onHandPosition(handler) {
  const listener = (e) => handler(e.detail);
  target.addEventListener("gi:hand-position", listener);
  return () => target.removeEventListener("gi:hand-position", listener);
}