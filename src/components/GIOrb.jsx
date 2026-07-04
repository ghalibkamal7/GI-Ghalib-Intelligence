import { useRef, useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import GILogo from "./GILogo";

function GIOrb({ size = 220, thinking = false, speaking = false }) {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handlePointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const py = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setTilt({ x: px * 10, y: py * -10 });
  }, []);

  const handlePointerLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const handleTouchMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el || !e.touches[0]) return;
    const rect = el.getBoundingClientRect();
    const touch = e.touches[0];
    const px = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const py = ((touch.clientY - rect.top) / rect.height) * 2 - 1;
    setTilt({ x: px * 8, y: py * -8 });
  }, []);

  const particleCount = 10;
  const particles = Array.from({ length: particleCount });
  const ringDuration = thinking ? 3 : speaking ? 5 : 9;

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerLeave}
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.18) 45%, transparent 72%)",
        }}
        animate={{
          scale: thinking ? [1, 1.12, 1] : [1, 1.04, 1],
          opacity: thinking ? [0.7, 1, 0.7] : [0.55, 0.75, 0.55],
        }}
        transition={{ duration: thinking ? 1.2 : 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="absolute inset-0 gi-orb-ring"
        style={{ animationDuration: `${ringDuration}s` }}
      >
        {particles.map((_, i) => {
          const angle = (360 / particleCount) * i;
          const radius = size * 0.46;
          return (
            <span
              key={i}
              className="gi-orb-particle"
              style={{
                transform: `rotate(${angle}deg) translateX(${radius}px)`,
                animationDelay: `${(i % 5) * 0.3}s`,
              }}
            />
          );
        })}
      </div>

      <motion.div
        animate={{ rotateX: tilt.y, rotateY: tilt.x }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <GILogo size={size * 0.5} animate spinning={thinking} glow />
      </motion.div>
    </div>
  );
}

export default memo(GIOrb);