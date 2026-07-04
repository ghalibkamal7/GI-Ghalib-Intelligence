import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

function MagneticButton({ children, onClick, className = "", disabled = false, type = "button" }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);

  const handleMouseMove = useCallback((e) => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    setOffset({ x: relX * 0.15, y: relY * 0.25 });
  }, [disabled]);

  const handleMouseLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  const handleClick = useCallback((e) => {
    if (disabled) return;
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const id = Date.now();
      setRipples((prev) => [
        ...prev,
        { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
      ]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    }
    onClick?.(e);
  }, [onClick, disabled]);

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 150, damping: 12 }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden transition-shadow duration-300 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_24px_rgba(99,102,241,0.45)]"
      } ${className}`}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 pointer-events-none gi-ripple"
          style={{ left: r.x, top: r.y, width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
        />
      ))}
    </motion.button>
  );
}

export default MagneticButton;