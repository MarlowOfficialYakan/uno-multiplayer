import { forwardRef } from "react";
import CardBack from "../cards/CardBack";
import { useSettings } from "../../context/SettingsContext";

const DrawPile = forwardRef(function DrawPile({ count, onClick, disabled }, ref) {
  const { isLow } = useSettings();
  return (
    // The "N kartu" label lives in normal document flow (not absolutely
    // positioned below the card) so it reserves real space instead of
    // floating over whatever sits underneath — that overlap was the cause
    // of text getting visually stacked on some phones.
    <div ref={ref} className="flex flex-col items-center gap-1">
      <div className="relative">
        {!isLow && (
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-14 h-4 rounded-full bg-black/50 blur-md" />
        )}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="group relative w-[4.5rem] h-[6.5rem] sm:w-20 sm:h-28 overflow-hidden rounded-xl disabled:cursor-default"
        >
          {[2, 1, 0].map((i) => (
            <CardBack
              key={i}
              size="lg"
              className="absolute transition-transform group-active:translate-y-1"
              style={{ top: -i * 2, left: -i * 2, zIndex: i }}
            />
          ))}
          {!disabled && (
            <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors" />
          )}
        </button>
      </div>
      <span className="text-[11px] text-white/70 font-body whitespace-nowrap">{count} kartu</span>
    </div>
  );
});

export default DrawPile;
