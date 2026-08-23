import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Hand } from "lucide-react";
import { onHandPosition } from "../utils/handPosition";

// An original GI visual — a glowing wireframe icosahedron core, not a
// copy of any existing character or product. Rotates via mouse/touch
// drag (always available) or, when Gesture Control is already
// running elsewhere in the app, via hand movement — it reuses that
// SAME camera feed through the handPosition pub/sub rather than
// opening a second camera, so this component itself never touches
// getUserMedia or MediaPipe directly.
function GI3DCore({ isOpen, onClose }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    scene: null, camera: null, renderer: null, mesh: null, glowMesh: null,
    rotation: { x: 0.4, y: 0.6 },
    dragging: false, lastPointer: { x: 0, y: 0 },
    zoom: 4.5,
    frameId: null,
    lastHand: null,
  });
  const [gestureActive, setGestureActive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let disposed = false;

    (async () => {
      const THREE = await import("three");
      if (disposed || !mountRef.current) return;

      const st = stateRef.current;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      // Core geometry — wireframe icosahedron, GI's own visual identity
      const geometry = new THREE.IcosahedronGeometry(1.4, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Soft glow shell — slightly larger, very transparent
      const glowGeometry = new THREE.IcosahedronGeometry(1.55, 1);
      const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.15 });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      scene.add(glowMesh);

      // Inner core point light stand-in (basic material scene has no
      // lighting needs since everything is wireframe/basic — kept
      // deliberately simple and cheap)
      camera.position.z = st.zoom;

      st.scene = scene;
      st.camera = camera;
      st.renderer = renderer;
      st.mesh = mesh;
      st.glowMesh = glowMesh;

      const animate = () => {
        if (disposed) return;
        mesh.rotation.x = st.rotation.x;
        mesh.rotation.y = st.rotation.y;
        glowMesh.rotation.x = st.rotation.x * 0.8;
        glowMesh.rotation.y = st.rotation.y * 0.8;
        if (!st.dragging && !gestureActive) {
          st.rotation.y += 0.003; // gentle idle spin when untouched
        }
        camera.position.z = st.zoom;
        renderer.render(scene, camera);
        st.frameId = requestAnimationFrame(animate);
      };
      animate();
      setReady(true);
    })();

    return () => {
      disposed = true;
      const st = stateRef.current;
      if (st.frameId) cancelAnimationFrame(st.frameId);
      if (st.renderer) {
        st.renderer.dispose();
        st.renderer.domElement?.remove();
      }
      st.mesh?.geometry?.dispose();
      st.mesh?.material?.dispose();
      st.glowMesh?.geometry?.dispose();
      st.glowMesh?.material?.dispose();
      stateRef.current = {
        scene: null, camera: null, renderer: null, mesh: null, glowMesh: null,
        rotation: { x: 0.4, y: 0.6 }, dragging: false, lastPointer: { x: 0, y: 0 },
        zoom: 4.5, frameId: null, lastHand: null,
      };
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Mouse/touch drag — always available, independent of gestures
  useEffect(() => {
    const el = mountRef.current;
    if (!el || !isOpen) return;
    const st = stateRef.current;

    const onDown = (e) => {
      st.dragging = true;
      const p = e.touches ? e.touches[0] : e;
      st.lastPointer = { x: p.clientX, y: p.clientY };
    };
    const onMove = (e) => {
      if (!st.dragging) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - st.lastPointer.x;
      const dy = p.clientY - st.lastPointer.y;
      st.rotation.y += dx * 0.008;
      st.rotation.x += dy * 0.008;
      st.lastPointer = { x: p.clientX, y: p.clientY };
    };
    const onUp = () => { st.dragging = false; };
    const onWheel = (e) => {
      e.preventDefault();
      st.zoom = Math.min(8, Math.max(2.5, st.zoom + e.deltaY * 0.003));
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [isOpen]);

  // Gesture-driven rotation — reuses Gesture Control's existing
  // camera feed via the handPosition pub/sub. If Gesture Control
  // isn't enabled elsewhere, this simply never fires and mouse/touch
  // remains the only input — exactly the required fallback behavior.
  useEffect(() => {
    if (!isOpen) return;
    return onHandPosition(({ x, y, present }) => {
      setGestureActive(present);
      const st = stateRef.current;
      if (!present) { st.lastHand = null; return; }
      if (st.lastHand) {
        const dx = x - st.lastHand.x;
        const dy = y - st.lastHand.y;
        st.rotation.y += dx * 4;
        st.rotation.x += dy * 4;
      }
      st.lastHand = { x, y };
    });
  }, [isOpen]);

  const resetView = () => {
    const st = stateRef.current;
    st.rotation = { x: 0.4, y: 0.6 };
    st.zoom = 4.5;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        role="dialog" aria-modal="true" aria-label="GI 3D Core"
        className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">

        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-sm">GI Core</p>
            {gestureActive && (
              <span className="flex items-center gap-1 text-emerald-400 text-xs">
                <Hand size={12} /> Gesture control active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetView} aria-label="Reset view"
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <RotateCcw size={16} />
            </button>
            <button onClick={onClose} aria-label="Close"
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div ref={mountRef} className="flex-1 cursor-grab active:cursor-grabbing touch-none" />

        <p className="text-center text-slate-600 text-xs pb-4">
          {gestureActive ? "Move your hand to rotate" : "Drag to rotate · Scroll to zoom"}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

export default GI3DCore;