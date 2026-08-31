import { motion } from "framer-motion";
import { COLOR_HEX, GLOW_CLASS } from "../../utils/theme";
import { useSettings } from "../../context/SettingsContext";

const COLORS = ["red", "yellow", "green", "blue"];
const RADIUS = 72;
const WHEEL_SIZE = 192; // px, matches the w-48 h-48 box below

/**
 * Pops the color wheel out from wherever the Wild card was tapped
 * (`origin`, in viewport coordinates), instead of always centering it —
 * per the spec, this should visually emanate from the card itself. Falls
 * back to screen-center if no origin was captured for some reason.
 */
export default function ColorPicker({ onPick, origin }) {
  const { isLow } = useSettings();
  const center = origin || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  // keep the wheel fully on-screen even if tapped near an edge
  const left = Math.min(Math.max(center.x - WHEEL_SIZE / 2, 8), window.innerWidth - WHEEL_SIZE - 8);
  const top = Math.min(Math.max(center.y - WHEEL_SIZE / 2, 8), window.innerHeight - WHEEL_SIZE - 8);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[70] bg-black/70 ${isLow ? "" : "backdrop-blur-sm"}`}
    >
      <motion.div
        className="absolute w-48 h-48"
        style={{ left, top }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <span className="absolute inset-0 flex flex-col items-center justify-center text-center font-display font-bold text-white/90 text-sm leading-tight pointer-events-none">
          Pilih
          <br />
          Warna
        </span>
        {COLORS.map((c, i) => {
          const angle = (i / COLORS.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * RADIUS;
          const y = Math.sin(angle) * RADIUS;
          return (
            <motion.button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 16 }}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              className={`absolute w-14 h-14 rounded-full border-4 border-white/85 ${isLow ? "" : GLOW_CLASS[c]}`}
              style={{
                background: COLOR_HEX[c],
                left: `calc(50% + ${x}px - 28px)`,
                top: `calc(50% + ${y}px - 28px)`,
              }}
              aria-label={c}
            />
          );
        })}
      </motion.div>
    </motion.div>
  );
}
