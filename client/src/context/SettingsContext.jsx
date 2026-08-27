import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext(null);
const STORAGE_KEY = "uno_graphics_mode";

function detectDefaultMode() {
  // Rough heuristic only — the user can always override manually via the
  // settings toggle. Low core count is a reasonable signal for older/
  // budget devices ("HP kentang") where heavy blur/glow effects lag.
  if (typeof navigator !== "undefined" && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return "low";
  }
  return "high";
}

export function SettingsProvider({ children }) {
  const [graphicsMode, setGraphicsModeState] = useState(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return stored === "low" || stored === "high" ? stored : detectDefaultMode();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, graphicsMode);
  }, [graphicsMode]);

  const setGraphicsMode = (mode) => setGraphicsModeState(mode === "low" ? "low" : "high");

  return (
    <SettingsContext.Provider value={{ graphicsMode, setGraphicsMode, isLow: graphicsMode === "low" }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
