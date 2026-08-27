import CardBack from "../cards/CardBack";

export default function DrawPile({ count, onClick, disabled }) {
  return (
    // The "N kartu" label lives in normal document flow (not absolutely
    // positioned below the card) so it reserves real space instead of
    // floating over whatever sits underneath — that overlap was the cause
    // of text getting visually stacked on some phones.
    <div className="flex flex-col items-center gap-1">
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
      <span className="text-[11px] text-white/70 font-body whitespace-nowrap">{count} kartu</span>
    </div>
  );
}
