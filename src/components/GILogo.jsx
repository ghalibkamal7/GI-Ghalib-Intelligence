import { useEffect, useRef } from "react";

function GILogo({ size = 64, animate = true }) {
  const id = useRef(`gi-${Math.random().toString(36).slice(2, 7)}`).current;
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  const flameW = s * 0.138;
  const flameH = s * 0.75;
  const innerW = s * 0.063;
  const innerH = s * 0.375;
  const tipY   = s * 0.19;
  const tipY2  = s * 0.205;

  return (
    <svg
      width={s} height={s}
      viewBox={`0 0 ${s} ${s}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={`fg1-${id}`} cx="50%" cy="85%" r="65%">
          <stop offset="0%"   stopColor="#66E6FF" stopOpacity="1"/>
          <stop offset="40%"  stopColor="#00D4FF" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`fg2-${id}`} cx="50%" cy="80%" r="70%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.9"/>
          <stop offset="30%"  stopColor="#66E6FF" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0"/>
        </radialGradient>
        <filter id={`glow-${id}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={s * 0.06} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`glows-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={s * 0.04} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`tg-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={s * 0.03} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <style>{`
          @keyframes gi-spin-${id}  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes gi-breath-${id}{ 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.02);opacity:.92} }
          @keyframes gi-f1-${id}    { 0%{opacity:.75;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.08)} 100%{opacity:.8;transform:scaleY(.96)} }
          @keyframes gi-f2-${id}    { 0%{opacity:.6;transform:scaleY(.94)} 60%{opacity:.95;transform:scaleY(1.06)} 100%{opacity:.7;transform:scaleY(1)} }
          @keyframes gi-orbit-${id} { 0%,100%{opacity:.18;transform:scale(1)} 50%{opacity:.32;transform:scale(1.03)} }
          .gi-spin-${id}   { transform-origin:${cx}px ${cy}px; ${animate ? `animation:gi-spin-${id} 18s linear infinite` : ''} }
          .gi-breath-${id} { transform-origin:${cx}px ${cy}px; ${animate ? `animation:gi-breath-${id} 3.5s ease-in-out infinite` : ''} }
          .gi-f1-${id}     { transform-origin:${cx}px ${cy}px; ${animate ? `animation:gi-f1-${id} 1.6s ease-in-out infinite alternate` : ''} }
          .gi-f2-${id}     { transform-origin:${cx}px ${cy}px; ${animate ? `animation:gi-f2-${id} 2.1s ease-in-out infinite alternate` : ''} }
          .gi-orb-${id}    { transform-origin:${cx}px ${cy}px; ${animate ? `animation:gi-orbit-${id} 3s ease-in-out infinite` : ''} }
        `}</style>
      </defs>

      {/* Orbit ring */}
      <circle className={`gi-orb-${id}`} cx={cx} cy={cy} r={s*0.37}
        fill="none" stroke="#00D4FF" strokeWidth="0.6" strokeDasharray={`${s*0.015} ${s*0.025}`} strokeOpacity="0.5"/>

      {/* 8 rotating flame arms */}
      <g className={`gi-spin-${id}`}>
        {[0,45,90,135,180,225,270,315].map((deg, i) => (
          <g key={deg} className={i%2===0 ? `gi-f1-${id}` : `gi-f2-${id}`}>
            <ellipse cx={cx} cy={tipY} rx={flameW/2} ry={flameH/2}
              fill={`url(#fg1-${id})`} filter={`url(#glows-${id})`}
              transform={`rotate(${deg} ${cx} ${cy})`}/>
            <ellipse cx={cx} cy={tipY2} rx={innerW/2} ry={innerH/2}
              fill={`url(#fg2-${id})`} filter={`url(#glow-${id})`}
              transform={`rotate(${deg} ${cx} ${cy})`}/>
          </g>
        ))}
      </g>

      {/* Center disc */}
      <g className={`gi-breath-${id}`}>
        <circle cx={cx} cy={cy} r={s*0.18} fill="#050B18"/>
        <circle cx={cx} cy={cy} r={s*0.18} fill="none" stroke="#00D4FF" strokeWidth="0.8" strokeOpacity="0.4"/>
        <text
          x={cx} y={cy + s*0.07}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800"
          fontSize={s*0.135}
          letterSpacing="-0.5"
          fill="#FFFFFF"
          filter={`url(#tg-${id})`}
        >GI</text>
      </g>
    </svg>
  );
}

export default GILogo;