import { motion } from "framer-motion";
import { COLOR_HEX, GLOW_CLASS } from "../../utils/theme";

const COLORS = ["red", "yellow", "green", "blue"];
const RADIUS = 72;

export default function ColorPicker({ onPick }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-48 h-48">
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
              className={`absolute w-14 h-14 rounded-full border-4 border-white/85 ${GLOW_CLASS[c]}`}
              style={{
                background: COLOR_HEX[c],
                left: `calc(50% + ${x}px - 28px)`,
                top: `calc(50% + ${y}px - 28px)`,
              }}
              aria-label={c}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
