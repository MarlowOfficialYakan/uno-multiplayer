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

/**
 * A single face-up UNO card.
 *
 * The 3D tilt tracks the pointer position and rotates the card toward it
 * (a lightweight CSS-3D trick — no WebGL needed) via Framer Motion's
 * spring animate, so it settles back smoothly instead of snapping.
 *
 * In "low" graphics mode (see SettingsContext), this renders as a PLAIN
 * <button> instead of a Framer Motion component at all — no spring loop,
 * no pointer-tilt tracking, no glow shadows, no glossy sweep, and the
 * holographic Wild gradient becomes a static color. Those are the parts
 * that cost the most on low-end/mid phones (blur + many simultaneous
 * animated box-shadows is the classic mobile-Chrome lag source).
 *
 * `justDrawn` adds a brief pulsing highlight so a freshly-drawn card is
 * easy to spot and tap immediately (the "quick play after draw" feature).
 */
function PlayingCard({ card, size = "md", disabled = false, onClick, justDrawn = false, className = "" }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
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

  const glow = disabled || isLow ? "shadow-md shadow-black/40" : GLOW_CLASS[isWild ? "wild" : card.color];

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
      <button type="button" disabled={disabled} onClick={() => onClick?.(card)} className={sharedClassName}>
        {content}
      </button>
    );
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={() => onClick?.(card)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      style={{ transformStyle: "preserve-3d" }}
      className={sharedClassName}
    >
      {content}
    </motion.button>
  );
}

export default memo(PlayingCard);
