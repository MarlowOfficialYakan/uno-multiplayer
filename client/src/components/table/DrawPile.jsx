import CardBack from "../cards/CardBack";

export default function DrawPile({ count, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative w-[4.5rem] h-[6.5rem] sm:w-20 sm:h-28 disabled:cursor-default"
    >
      {[2, 1, 0].map((i) => (
        <CardBack
          key={i}
          size="lg"
          className="absolute transition-transform group-active:translate-y-1"
          style={{ top: -i * 2, left: -i * 2, zIndex: i }}
        />
      ))}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-white/70 font-body whitespace-nowrap">
        {count} kartu
      </span>
      {!disabled && (
        <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors" />
      )}
    </button>
  );
}
