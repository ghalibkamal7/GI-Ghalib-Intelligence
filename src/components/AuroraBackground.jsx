import { memo, useMemo } from "react";

function AuroraBackground({ starCount = 40 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: starCount }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() < 0.8 ? 1 : 2,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 2.5,
      })),
    [starCount]
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#05060f]" />

      <div className="gi-aurora-blob gi-aurora-1" />
      <div className="gi-aurora-blob gi-aurora-2" />
      <div className="gi-aurora-blob gi-aurora-3" />

      {stars.map((s) => (
        <span
          key={s.id}
          className="gi-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05060f]/60" />
    </div>
  );
}

export default memo(AuroraBackground);