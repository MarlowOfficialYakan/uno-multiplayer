import { Suspense, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EPIC_THEMES } from "./epicThemes";
import { useSettings } from "../../context/SettingsContext";
import { useSound } from "../../hooks/useSound";
import EpicScene from "./EpicScene";

/**
 * A short, camera-hijacking cinematic sequence that plays over the board
 * at high-stakes moments. Always the same 5-beat structure, re-themed per
 * trigger via EPIC_THEMES — adding a new trigger type means adding a theme
 * entry, not writing a new sequence.
 *
 * IMPORTANT: this is a pure visual overlay. It never touches game state or
 * Socket.io — the caller already has the new state; this component only
 * controls *when the player gets to see it* (see App.jsx's win-freeze).
 *
 * @param {object|null} trigger - null renders nothing. Otherwise
 *   { type: 'win'|'uno'|'attack'|'comeback', payload: {...}, key: string }.
 *   `key` should change on every firing (even same-type back-to-back) so
 *   the sequence reliably restarts.
 * @param {() => void} onDone - called automatically when RESOLVE finishes,
 *   or immediately if the player taps "Lewati".
 * @param {(trigger) => void} [onCharge] - SFX/haptic hook, fires at CHARGE.
 * @param {(trigger) => void} [onBurst] - SFX/haptic hook, fires at BURST.
 * @param {(trigger) => void} [onResolve] - SFX/haptic hook, fires at RESOLVE.
 */
export default function EpicMoment({ trigger, onDone, onCharge, onBurst, onResolve }) {
  const { isLow } = useSettings();
  const playSound = useSound();
  const [beat, setBeat] = useState(null);
  const [canSkip, setCanSkip] = useState(false);
  const timers = useRef([]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const theme = trigger ? EPIC_THEMES[trigger.type] : null;

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setCanSkip(false);

    if (!trigger || !theme) {
      setBeat(null);
      return undefined;
    }

    const sequence = theme.skipFreeze ? ["focus", "charge", "burst", "resolve"] : ["freeze", "focus", "charge", "burst", "resolve"];

    let elapsed = 0;
    for (const b of sequence) {
      const delay = elapsed;
      timers.current.push(
        setTimeout(() => {
          setBeat(b);
          if (b === "charge") {
            playSound("epicCharge");
            onCharge?.(trigger);
          }
          if (b === "burst") {
            playSound("epicBurst");
            onBurst?.(trigger);
          }
          if (b === "resolve") {
            playSound("epicResolve");
            onResolve?.(trigger);
          }
        }, delay)
      );
      elapsed += theme.beats[b] ?? 400;
    }

    timers.current.push(setTimeout(() => setCanSkip(true), 1500));
    timers.current.push(setTimeout(() => onDoneRef.current?.(), elapsed + 150));

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.type, trigger?.key]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    onDoneRef.current?.();
  };

  if (!trigger || !theme || !beat) return null;

  const label = theme.label(trigger.payload || {});
  const chargeMs = theme.beats.charge ?? 600;
  const burstMs = theme.beats.burst ?? 500;
  const showScene = !isLow && (beat === "focus" || beat === "charge" || beat === "burst");

  return (
    <div className="fixed inset-0 z-[100]">
      {/* FREEZE: dim + blur backdrop, held through the whole sequence so
          nothing else distracts — game interaction is blocked underneath
          simply because this overlay covers the full screen. */}
      <motion.div
        className={`absolute inset-0 bg-black/70 ${isLow ? "" : "backdrop-blur-md"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* FOCUS: target-lock ring */}
      <AnimatePresence>
        {(beat === "focus" || beat === "charge") && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-4"
            style={{ borderColor: theme.color, boxShadow: `0 0 30px 4px ${theme.color}` }}
            initial={{ scale: 2.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          />
        )}
      </AnimatePresence>

      {/* CHARGE: energy beam travelling upward from the "source" toward the target */}
      {beat === "charge" && (
        <motion.div
          className="absolute left-1/2 bottom-20 w-2 -translate-x-1/2 rounded-full"
          style={{
            background: `linear-gradient(to top, ${theme.color}, transparent)`,
            boxShadow: `0 0 24px 6px ${theme.color}`,
          }}
          initial={{ height: 0, opacity: 0.3 }}
          animate={{ height: "45vh", opacity: 1 }}
          transition={{ duration: chargeMs / 1000, ease: "easeIn" }}
        />
      )}

      {/* BURST: full-screen flash + screen shake — the emotional peak */}
      {beat === "burst" && (
        <>
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${theme.colorSecondary} 0%, ${theme.color}66 35%, transparent 70%)`,
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.6, 2] }}
            transition={{ duration: burstMs / 1000, ease: "easeOut" }}
          />
          <div className="absolute inset-0 animate-epic-shake" />
        </>
      )}

      {/* R3F hero visuals — Mode Tinggi only; mounted/unmounted with the
          sequence, so it costs nothing outside these ~1-1.5s. */}
      {showScene && (
        <Suspense fallback={null}>
          <EpicScene beat={beat} theme={theme} />
        </Suspense>
      )}

      {/* RESOLVE: result banner over the still-glowing moment */}
      <AnimatePresence>
        {beat === "resolve" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
            >
              <div className="text-5xl mb-2">{theme.icon}</div>
              <p
                className="font-display font-black text-2xl sm:text-4xl leading-tight"
                style={{ color: theme.color, textShadow: `0 0 24px ${theme.color}` }}
              >
                {label}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* skip-on-tap, appears ~1.5s in so repeat players can speed through */}
      {canSkip && (
        <button
          type="button"
          onClick={skip}
          className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-white/10 border border-white/25 text-white text-xs font-body backdrop-blur"
        >
          Lewati ▸
        </button>
      )}
    </div>
  );
}
