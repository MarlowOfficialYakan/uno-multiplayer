import { memo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GLOW_CLASS, BG_GRADIENT_CLASS } from "../../utils/theme";
import { getCardLabel } from "../../utils/cardLabel";
import { useSettings } from "../../context/SettingsContext";

const SIZE_CLASS = {
  sm: "w-9 h-[3.25rem] text-[10px]",
  md: "w-16 h-24 text-base",
  lg: "w-[4.5rem] h-[6.5rem] sm:w-20 sm:h-28 text-xl sm:text-2xl",
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * A single face-up UNO card.
 *
 * - Hover: pointer-tracked 3D tilt (CSS 3D, no WebGL) via Framer Motion spring.
 * - Drag: VISUAL ONLY — tilts along the drag direction and springs back to
 *   its original position on release (`dragSnapToOrigin`). Dragging never
 *   plays the card; only a tap does (`onTap`), so this is purely tactile
 *   flair layered on top of the existing tap-to-play flow.
 * - Wild/+4/+10: continuous pulsing glow (`animate-wild-glow`) so they read
 *   as "special" even at rest, plus the holographic gradient sweep.
 *
 * In "low" graphics mode this renders as a PLAIN <button> — no Framer
 * Motion, no tilt, no drag, no glow — for low-end/mid phones.
 *
 * `justDrawn` adds a brief pulsing highlight so a freshly-drawn card is
 * easy to spot and tap immediately (the "quick play after draw" feature).
 */
function PlayingCard({ card, size = "md", disabled = false, onClick, justDrawn = false, className = "" }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [dragRotate, setDragRotate] = useState(0);
  const { isLow } = useSettings();
  const isWild = card.color === "wild";
  const label = getCardLabel(card);

  const handleMove = (e) => {
    if (disabled || isLow || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -12, ry: px * 12 });
  };
  const reset = () => setTilt({ rx: 0, ry: 0 });

  const wildBg = isLow
    ? "bg-gradient-to-br from-fuchsia-700 to-indigo-900"
    : "bg-[linear-gradient(120deg,#ff2d55,#ffd60a,#22e07a,#2f7dff,#ff2d55)] bg-[length:250%_250%] animate-holo";

  const glow = disabled || isLow ? "shadow-md shadow-black/40" : isWild ? "animate-wild-glow" : GLOW_CLASS[card.color];

  // "+10" is wider than every other label — shrink it a bit so it never
  // overflows the card (this was part of the text-overlap bug reports).
  const centerTextSize = label.length >= 3 ? "text-[1.15em]" : "text-[1.6em]";
  const cornerTextSize = label.length >= 3 ? "text-[0.75em]" : "text-[1em]";

  const highlightRing = justDrawn ? "ring-4 ring-white animate-pulse-ring" : "";

  const content = (
    <>
      {/* glossy highlight sweep on hover — skipped in low mode */}
      {!isLow && (
        <span className="pointer-events-none absolute -inset-y-6 -left-1/2 w-1/3 bg-white/40 blur-sm -rotate-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-[260%] transition-all duration-700 ease-out" />
      )}
      {/* corner index, like a real card */}
      <span className={`absolute top-1 left-1.5 font-display font-extrabold text-white drop-shadow ${cornerTextSize}`}>
        {label}
      </span>
      <span
        className={`absolute bottom-1 right-1.5 font-display font-extrabold text-white drop-shadow rotate-180 ${cornerTextSize}`}
      >
        {label}
      </span>
      {/* center pip */}
      <span
        className={`absolute inset-0 flex items-center justify-center font-display font-black text-white drop-shadow-lg ${centerTextSize}`}
      >
        {label}
      </span>
    </>
  );

  const sharedClassName = `group relative ${SIZE_CLASS[size]} rounded-xl border-2 border-white/80 overflow-hidden select-none
    ${isWild ? wildBg : `bg-gradient-to-br ${BG_GRADIENT_CLASS[card.color]}`}
    ${glow} ${highlightRing}
    ${disabled ? "cursor-default" : "cursor-pointer"} ${className}`;

  if (isLow) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => onClick?.(card, { x: e.clientX, y: e.clientY })}
        className={sharedClassName}
      >
        {content}
      </button>
    );
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      onTap={(_e, info) => !disabled && onClick?.(card, info.point)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      drag={!disabled}
      dragElastic={0.55}
      dragSnapToOrigin
      dragTransition={{ bounceStiffness: 420, bounceDamping: 24 }}
      whileDrag={{ scale: 1.12, zIndex: 60 }}
      onDrag={(_e, info) => setDragRotate(clamp(info.offset.x / 8, -22, 22))}
      onDragEnd={() => setDragRotate(0)}
      animate={{ rotateX: tilt.rx, rotateY: tilt.ry, rotateZ: dragRotate }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      style={{ transformStyle: "preserve-3d" }}
      className={sharedClassName}
    >
      {content}
    </motion.button>
  );
}

export default memo(PlayingCard);
