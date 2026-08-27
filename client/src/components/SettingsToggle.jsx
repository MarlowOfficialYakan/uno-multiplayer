import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

export default function SettingsToggle() {
  const [open, setOpen] = useState(false);
  const { graphicsMode, setGraphicsMode } = useSettings();

  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="w-52 bg-black/80 border border-white/15 rounded-2xl p-3 flex flex-col gap-2"
          >
            <p className="font-display font-bold text-white text-sm">Grafis</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGraphicsMode("high")}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold font-body transition-colors ${
                  graphicsMode === "high" ? "bg-uno-blue text-white" : "bg-white/10 text-white/60"
                }`}
              >
                Tinggi
              </button>
              <button
                type="button"
                onClick={() => setGraphicsMode("low")}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold font-body transition-colors ${
                  graphicsMode === "low" ? "bg-uno-blue text-white" : "bg-white/10 text-white/60"
                }`}
              >
                Hemat
              </button>
            </div>
            <p className="text-[10px] text-white/50 font-body leading-snug">
              Mode Hemat mematikan efek glow, blur, dan animasi berat — cocok untuk HP dengan spesifikasi rendah.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Pengaturan grafis"
        className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center shadow-lg text-lg"
      >
        ⚙️
      </button>
    </div>
  );
}
