import { useSettings } from "../../context/SettingsContext";

/**
 * Wraps an avatar with a glowing pulse ring when it's that player's turn.
 * In low graphics mode, the blurred glow + pulsing animation are dropped
 * in favor of a plain static ring — still clearly shows whose turn it is,
 * just without the GPU-costly parts.
 *
 * There's no server-side turn timer in the current game logic, so this
 * only shows an indeterminate ring rather than a fabricated countdown.
 * If a turn timer is ever added server-side, this is the place to render
 * a numeric/arc countdown — swap the ring for an SVG `<circle>` with
 * `strokeDashoffset` driven by a `secondsLeft` prop.
 */
export default function TurnRing({ active, children }) {
  const { isLow } = useSettings();

  let ringClass = "ring-2 ring-white/10";
  if (active) {
    ringClass = isLow ? "ring-4 ring-uno-yellow" : "ring-4 ring-uno-yellow shadow-glow-yellow animate-pulse-ring";
  }

  return <div className={`rounded-full transition-all duration-300 ${ringClass}`}>{children}</div>;
}
