// A tiny pub/sub so gesture detection (which lives near the camera/
// MediaPipe code) can notify UI pieces like GIOrb without threading
// a prop through every layer of the component tree, and without
// putting gesture state in a React context (which would re-render
// everything subscribed to it on every frame).
const target = new EventTarget();

export function emitGesture(name, detail = {}) {
  target.dispatchEvent(new CustomEvent("gi:gesture", { detail: { name, ...detail } }));
}

export function onGesture(handler) {
  const listener = (e) => handler(e.detail);
  target.addEventListener("gi:gesture", listener);
  return () => target.removeEventListener("gi:gesture", listener);
}