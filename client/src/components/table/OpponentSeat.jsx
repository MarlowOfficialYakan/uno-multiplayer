import { memo } from "react";
import { motion } from "framer-motion";
import CardBack from "../cards/CardBack";
import TurnRing from "./TurnRing";
import { useSettings } from "../../context/SettingsContext";

function OpponentSeat({ player, isActive, onCatchUno }) {
  const { isLow } = useSettings();
  const stackCount = Math.min(player.cardCount, 7);

  return (
    <div className="flex flex-col items-center gap-1 w-20">
      <TurnRing active={isActive}>
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-white/90 border-2 border-white/30">
          {player.name.slice(0, 2).toUpperCase()}
        </div>
      </TurnRing>

      {/* fanned card-back stack — "breathing" idle animation in high mode only.
          overflow-hidden here is a defensive safety net: if a card back ever
          fails to size correctly (e.g. a CSS load hiccup), it gets clipped
          to this small box instead of cascading across the whole screen. */}
      <div className={`relative h-9 w-16 overflow-hidden ${isLow ? "" : "animate-breathe"}`}>
        {Array.from({ length: stackCount }).map((_, i) => (
          <CardBack
            key={i}
            size="sm"
            className="absolute"
            style={{ left: i * 3, transform: `rotate(${(i - stackCount / 2) * 5}deg)`, zIndex: i }}
          />
        ))}
      </div>

      <span className="text-[11px] font-body text-white/85 flex items-center gap-1 max-w-[5.5rem] truncate">
        {player.name} {!player.connected && <span title="Terputus">⚠️</span>}
      </span>
      <span className="text-[10px] text-white/50 font-body">{player.cardCount} kartu</span>

      {player.mustCallUno && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onCatchUno(player.id)}
          className={`mt-0.5 px-2 py-0.5 rounded-full bg-uno-red text-white text-[10px] font-bold ${
            isLow ? "" : "shadow-glow-red animate-pulse-ring"
          }`}
        >
          Tangkap UNO!
        </motion.button>
      )}
    </div>
  );
}

export default memo(OpponentSeat);
