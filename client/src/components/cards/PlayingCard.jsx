import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { GLOW_CLASS, BG_GRADIENT_CLASS } from "../../utils/theme";
import { getCardLabel } from "../../utils/cardLabel";

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
 */
export default function PlayingCard({ card, size = "md", disabled = false, onClick, className = "" }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const isWild = card.color === "wild";
  const label = getCardLabel(card);

  const handleMove = (e) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -12, ry: px * 12 });
  };
  const reset = () => setTilt({ rx: 0, ry: 0 });

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
      className={`group relative ${SIZE_CLASS[size]} rounded-xl border-2 border-white/80 overflow-hidden select-none
        ${
          isWild
            ? "bg-[linear-gradient(120deg,#ff2d55,#ffd60a,#22e07a,#2f7dff,#ff2d55)] bg-[length:250%_250%] animate-holo"
            : `bg-gradient-to-br ${BG_GRADIENT_CLASS[card.color]}`
        }
        ${!disabled ? GLOW_CLASS[isWild ? "wild" : card.color] : "shadow-md shadow-black/40"}
        ${disabled ? "cursor-default" : "cursor-pointer"} ${className}`}
    >
      {/* glossy highlight sweep on hover */}
      <span className="pointer-events-none absolute -inset-y-6 -left-1/2 w-1/3 bg-white/40 blur-sm -rotate-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-[260%] transition-all duration-700 ease-out" />
      {/* corner index, like a real card */}
      <span className="absolute top-1 left-1.5 font-display font-extrabold text-white drop-shadow">{label}</span>
      <span className="absolute bottom-1 right-1.5 font-display font-extrabold text-white drop-shadow rotate-180">
        {label}
      </span>
      {/* center pip */}
      <span className="absolute inset-0 flex items-center justify-center font-display font-black text-white drop-shadow-lg text-[1.6em]">
        {label}
      </span>
    </motion.button>
  );
}
