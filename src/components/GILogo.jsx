import { memo } from "react";

function GILogo({ size = 64, animate = true, spinning = false }) {
  const s = size;

  const spinClass = animate ? (spinning ? "gi-spin-fast" : "gi-spin-slow") : "";
  const pulseClass = animate && !spinning ? "gi-pulse" : "";

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <defs>
        <radialGradient id="gi-grad" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#66E6FF" />
          <stop offset="55%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#3B82F6" />
        </radialGradient>
      </defs>

      {!spinning && (
        <circle
          cx="50" cy="50" r="46"
          fill="none" stroke="#00D4FF" strokeWidth="1"
          strokeDasharray="2 4" strokeOpacity="0.4"
        />
      )}

      <g className={spinClass} style={{ transformOrigin: "50px 50px" }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <path
            key={deg}
            d="M50 8 C 54 18, 56 26, 50 34 C 44 26, 46 18, 50 8 Z"
            fill="url(#gi-grad)"
            opacity="0.85"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
      </g>

      <g className={pulseClass} style={{ transformOrigin: "50px 50px" }}>
        <circle cx="50" cy="50" r="18" fill="#050B18" stroke="#00D4FF" strokeWidth="0.8" strokeOpacity="0.5" />
        <text
          x="50" y="56"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800"
          fontSize="14"
          letterSpacing="-0.5"
          fill="#FFFFFF"
        >
          GI
        </text>
      </g>
    </svg>
  );
}

export default memo(GILogo);