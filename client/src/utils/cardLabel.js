export function getCardLabel(card) {
  switch (card.type) {
    case "number":
      return card.value;
    case "wild":
      return "★";
    case "wild4":
      return "+4";
    case "wild10":
      return "+10";
    case "draw2":
      return "+2";
    case "skip":
      return "⦸";
    case "reverse":
      return "⇄";
    default:
      return "?";
  }
}

// Deterministic pseudo-random rotation from a card id, so the same card
// always lands at the same jaunty angle on the discard pile instead of
// jittering on every re-render.
export function hashRotation(id, spread = 14) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (h % spread) - spread / 2;
}
