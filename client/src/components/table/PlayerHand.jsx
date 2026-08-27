import { useState } from "react";
import { motion } from "framer-motion";
import PlayingCard from "../cards/PlayingCard";
import { useSettings } from "../../context/SettingsContext";

export default function PlayerHand({ cards, disabled, onPlay, justDrawnId }) {
  const [hoveredId, setHoveredId] = useState(null);
  const { isLow } = useSettings();
  const n = cards.length;
  const maxAngle = Math.min(10, 60 / Math.max(n, 1));
  const mid = (n - 1) / 2;

  return (
    <div
      className="relative flex justify-center items-end -space-x-6 sm:-space-x-8 h-40 sm:h-48 px-2 pb-2 overflow-visible"
      style={{ perspective: 1000 }}
    >
      {cards.map((card, i) => {
        const angle = isLow ? 0 : (i - mid) * maxAngle;
        const arcLift = isLow ? 0 : Math.abs(i - mid) * 2; // slight downward curve at the fan's edges
        const isHovered = !isLow && hoveredId === card.id;

        return (
          <motion.div
            key={card.id}
            className="origin-bottom"
            style={{ zIndex: isHovered ? 50 : i }}
            animate={{
              rotate: angle,
              y: arcLift - (isHovered ? 40 : 0),
              scale: isHovered ? 1.1 : 1,
            }}
            transition={isLow ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 20 }}
            onMouseEnter={() => setHoveredId(card.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <PlayingCard
              card={card}
              size="lg"
              disabled={disabled}
              onClick={onPlay}
              justDrawn={card.id === justDrawnId}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
