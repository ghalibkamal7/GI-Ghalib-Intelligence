import { motion } from "framer-motion";

function GILogo({ size = 64, animate = true }) {
  const s = size;
  const center = s / 2;
  const r1 = s * 0.42;
  const r2 = s * 0.34;

  return (
    <div style={{ width: s, height: s, position: "relative", display: "inline-block" }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="gi-core" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </radialGradient>
          <radialGradient id="gi-flame1" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gi-flame2" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
          <filter id="gi-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="gi-glow-strong">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer ring pulse */}
        {animate && (
          <motion.circle cx={center} cy={center} r={r1 + 4}
            fill="none" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5"
            animate={{ r: [r1 + 3, r1 + 8, r1 + 3], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Main circle */}
        <circle cx={center} cy={center} r={r1} fill="url(#gi-core)" filter="url(#gi-glow)" />

        {/* Blue flame 1 — left */}
        {animate ? (
          <motion.ellipse cx={center - s * 0.1} cy={center + r1 * 0.3}
            rx={s * 0.09} ry={s * 0.2}
            fill="url(#gi-flame1)" filter="url(#gi-glow)"
            animate={{ ry: [s*0.18, s*0.24, s*0.18], cy: [center+r1*0.28, center+r1*0.35, center+r1*0.28], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <ellipse cx={center - s*0.1} cy={center + r1*0.3} rx={s*0.09} ry={s*0.2} fill="url(#gi-flame1)" />
        )}

        {/* Blue flame 2 — right */}
        {animate ? (
          <motion.ellipse cx={center + s * 0.1} cy={center + r1 * 0.3}
            rx={s * 0.09} ry={s * 0.22}
            fill="url(#gi-flame2)" filter="url(#gi-glow)"
            animate={{ ry: [s*0.2, s*0.27, s*0.2], cy: [center+r1*0.3, center+r1*0.38, center+r1*0.3], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        ) : (
          <ellipse cx={center + s*0.1} cy={center + r1*0.3} rx={s*0.09} ry={s*0.22} fill="url(#gi-flame2)" />
        )}

        {/* Center flame — brightest */}
        {animate ? (
          <motion.ellipse cx={center} cy={center + r1 * 0.25}
            rx={s * 0.07} ry={s * 0.28}
            fill="#93c5fd" filter="url(#gi-glow-strong)"
            animate={{ ry: [s*0.25, s*0.33, s*0.25], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          />
        ) : (
          <ellipse cx={center} cy={center + r1*0.25} rx={s*0.07} ry={s*0.28} fill="#93c5fd" />
        )}

        {/* GI Text */}
        <text x={center} y={center + s * 0.08} textAnchor="middle"
          fill="white" fontSize={s * 0.28} fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif" letterSpacing="-0.5">
          GI
        </text>
      </svg>
    </div>
  );
}

export default GILogo;