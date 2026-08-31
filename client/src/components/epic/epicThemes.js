// One entry per trigger type. EpicMoment.jsx reads this table to theme the
// 5-beat sequence — adding a new trigger later means adding an entry here,
// not touching the sequence logic itself.
//
// `beats` are per-beat durations in ms. `skipFreeze` condenses the sequence
// (used for the quick UNO-call version per the spec's trigger table).
// `label(payload)` returns the RESOLVE-beat banner text.

export const EPIC_THEMES = {
  win: {
    color: "#ffd60a", // gold
    colorSecondary: "#ffffff",
    icon: "🏆",
    skipFreeze: false,
    beats: { freeze: 350, focus: 650, charge: 750, burst: 550, resolve: 1300 },
    particleCount: 90,
    label: (p) => `UNO OUT — ${p.winnerName || "?"} MENANG!`,
  },
  uno: {
    color: "#ffd60a",
    colorSecondary: "#fff7cc",
    icon: "❗",
    skipFreeze: true, // condensed: quick FOCUS -> BURST, no FREEZE pause
    beats: { freeze: 0, focus: 300, charge: 250, burst: 400, resolve: 600 },
    particleCount: 40,
    label: (p) => `UNO! — ${p.playerName || "?"}`,
  },
  attack: {
    color: "#ff2d55", // red
    colorSecondary: "#ff9db0",
    icon: "⚠️",
    skipFreeze: false,
    beats: { freeze: 250, focus: 500, charge: 650, burst: 500, resolve: 900 },
    particleCount: 70,
    label: (p) => `${p.attackerName || "?"} MENYERANG ${p.targetName || "?"} (+${p.amount ?? "?"})`,
  },
  comeback: {
    // Optional/nice-to-have per the spec. Theme + sequence are fully wired
    // and ready to fire — only the actual "flipped from a losing position"
    // detection heuristic in App.jsx is left as a TODO (see comment there),
    // since it needs game-history tracking that's genuinely ambiguous to
    // define precisely.
    color: "#38bdf8", // electric blue
    colorSecondary: "#bae6fd",
    icon: "⚡",
    skipFreeze: false,
    beats: { freeze: 350, focus: 650, charge: 750, burst: 550, resolve: 1300 },
    particleCount: 90,
    label: (p) => `PEMBALIKAN KEADAAN — ${p.playerName || "?"}!`,
  },
};
