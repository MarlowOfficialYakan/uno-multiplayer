import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlayingCard from "../cards/PlayingCard";
import { COLOR_HEX } from "../../utils/theme";
import { hashRotation } from "../../utils/cardLabel";

export default function DiscardPile({ topCard, currentColor }) {
  const rotation = useMemo(() => (topCard ? hashRotation(topCard.id) : 0), [topCard?.id]);

  if (!topCard) return null;

  return (
    <div className="relative w-[4.5rem] h-[6.5rem] sm:w-20 sm:h-28">
      {/* ghost cards behind, purely decorative — gives the pile depth without needing discard history from the server */}
      <div className="absolute inset-0 rounded-xl bg-black/30 rotate-6 scale-95 blur-[1px]" />
      <div className="absolute inset-0 rounded-xl bg-black/20 -rotate-3 scale-95 blur-[1px]" />

      <AnimatePresence mode="popLayout">
        <motion.div
          key={topCard.id}
          initial={{ y: 140, rotate: -20, scale: 0.7, opacity: 0 }}
          animate={{ y: 0, rotate: rotation, scale: 1, opacity: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
          className="absolute inset-0"
        >
          <PlayingCard card={topCard} size="lg" disabled />
        </motion.div>
      </AnimatePresence>

      {/* active color indicator (matters most right after a Wild is played) */}
      <span
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white/70"
        style={{ background: COLOR_HEX[currentColor] }}
      />
    </div>
  );
}
