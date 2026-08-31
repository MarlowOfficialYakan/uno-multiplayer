import { motion } from "framer-motion";

/**
 * A one-shot ghost card flown from the draw pile's on-screen position
 * toward the hand, with a glow trail that fades as it lands. Purely
 * decorative — the actual new card already exists in state by the time
 * this plays (see the `justDrawn` highlight in PlayerHand for the "which
 * card is it" part).
 *
 * `to` is an approximate hand-area point rather than a precise per-card
 * target — the fan re-flows on every hand change, so animating toward a
 * single stable point (bottom-center) reads just as well without needing
 * to track individual card positions mid-flight.
 */
export default function DrawFlight({ from, to, color = "#ffd60a" }) {
  if (!from || !to) return null;

  return (
    <motion.div
      className="fixed z-[65] pointer-events-none w-12 h-16 rounded-lg border-2 border-white/70"
      style={{
        top: 0,
        left: 0,
        background: "linear-gradient(135deg, #4c1d95, #1e1b4b)",
      }}
      initial={{ x: from.x, y: from.y, opacity: 0.95, scale: 0.9, boxShadow: `0 0 22px 8px ${color}` }}
      animate={{ x: to.x, y: to.y, opacity: 0, scale: 1.05, boxShadow: `0 0 2px 0px ${color}` }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    />
  );
}
