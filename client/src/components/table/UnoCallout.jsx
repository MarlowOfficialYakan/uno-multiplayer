import { motion } from "framer-motion";

/**
 * Renders nothing until `triggerKey` becomes truthy, then plays a flash +
 * pop-text animation once. Pass an incrementing number as triggerKey (e.g.
 * `unoCallCount`) — changing the key forces React to remount the inner
 * motion.div, which replays the initial -> animate sequence every time,
 * even for repeated UNO calls in the same game.
 */
export default function UnoCallout({ triggerKey }) {
  if (!triggerKey) return null;

  return (
    <motion.div
      key={triggerKey}
      className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.9, delay: 0.4 }}
    >
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      />
      <motion.span
        className="relative font-display font-black text-uno-yellow text-6xl sm:text-8xl"
        style={{ WebkitTextStroke: "3px rgba(0,0,0,0.5)", filter: "drop-shadow(0 0 25px rgba(255,214,10,0.8))" }}
        initial={{ scale: 0.2, rotate: -8 }}
        animate={{ scale: [0.2, 1.3, 1], rotate: [-8, 4, 0] }}
        transition={{ duration: 0.5, times: [0, 0.6, 1] }}
      >
        UNO!
      </motion.span>
    </motion.div>
  );
}
