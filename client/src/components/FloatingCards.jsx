import { motion } from "framer-motion";
import PlayingCard from "./cards/PlayingCard";

const DECOR_CARDS = [
  { card: { id: "decor-r7", color: "red", value: "7", type: "number" }, style: { top: "8%", left: "6%" }, duration: 9, delay: 0 },
  { card: { id: "decor-w", color: "wild", value: "wild", type: "wild" }, style: { top: "62%", left: "82%" }, duration: 11, delay: 0.6 },
  { card: { id: "decor-b3", color: "blue", value: "3", type: "number" }, style: { top: "72%", left: "10%" }, duration: 10, delay: 1.2 },
];

/**
 * Purely decorative, non-interactive cards drifting slowly in the
 * background of the home/menu screen — "entering a match" ambiance rather
 * than a plain form. Mode Tinggi only; cheap (3 elements, CSS/Framer only).
 */
export default function FloatingCards() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {DECOR_CARDS.map(({ card, style, duration, delay }) => (
        <motion.div
          key={card.id}
          className="absolute"
          style={style}
          animate={{ y: [0, -18, 0], rotate: [-6, 6, -6] }}
          transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <PlayingCard card={card} size="lg" disabled />
        </motion.div>
      ))}
    </div>
  );
}
