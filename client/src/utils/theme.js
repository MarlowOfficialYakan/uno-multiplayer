// Single source of truth for UNO's color language, so every component
// (cards, discard pile, color picker, turn rings) stays visually in sync.
//
// IMPORTANT: keep these as literal strings (not template-interpolated) in
// every component that uses them — Tailwind's JIT scanner needs to see the
// full class name as text in the source to generate the CSS for it.

export const COLOR_HEX = {
  red: "#ff2d55",
  yellow: "#ffd60a",
  green: "#22e07a",
  blue: "#2f7dff",
  wild: "#c084fc",
};

export const GLOW_CLASS = {
  red: "shadow-glow-red",
  yellow: "shadow-glow-yellow",
  green: "shadow-glow-green",
  blue: "shadow-glow-blue",
  wild: "shadow-glow-wild",
};

export const BG_GRADIENT_CLASS = {
  red: "from-uno-red to-red-900",
  yellow: "from-uno-yellow to-amber-700",
  green: "from-uno-green to-emerald-900",
  blue: "from-uno-blue to-blue-900",
};
