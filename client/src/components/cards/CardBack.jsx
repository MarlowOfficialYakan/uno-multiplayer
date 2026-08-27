const SIZE_CLASS = {
  sm: "w-9 h-[3.25rem]",
  md: "w-16 h-24",
  lg: "w-[4.5rem] h-[6.5rem] sm:w-20 sm:h-28",
};

export default function CardBack({ size = "md", className = "", style }) {
  return (
    <div
      className={`relative ${SIZE_CLASS[size]} rounded-xl border-2 border-white/30 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 shadow-lg shadow-black/50 ${className}`}
      style={style}
    >
      <div className="absolute inset-1 rounded-lg border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.10),transparent_65%)]" />
      <span className="absolute inset-0 flex items-center justify-center font-display italic font-black text-white/70 text-[0.6em] tracking-wide -rotate-12">
        UNO
      </span>
    </div>
  );
}
