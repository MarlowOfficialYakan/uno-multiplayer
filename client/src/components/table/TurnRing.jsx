/**
 * Wraps an avatar with a glowing pulse ring when it's that player's turn.
 *
 * There's no server-side turn timer in the current game logic, so this
 * only shows an indeterminate pulse rather than a fabricated countdown.
 * If a turn timer is ever added server-side, this is the place to render
 * a numeric/arc countdown — swap the static ring for an SVG `<circle>`
 * with `strokeDashoffset` driven by a `secondsLeft` prop.
 */
export default function TurnRing({ active, children }) {
  return (
    <div
      className={`rounded-full transition-all duration-300 ${
        active ? "ring-4 ring-uno-yellow shadow-glow-yellow animate-pulse-ring" : "ring-2 ring-white/10"
      }`}
    >
      {children}
    </div>
  );
}
