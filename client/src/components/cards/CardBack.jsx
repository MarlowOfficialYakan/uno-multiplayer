import { memo } from "react";

const SIZE_CLASS = {
  sm: "w-9 h-[3.25rem]",
  md: "w-16 h-24",
  lg: "w-[4.5rem] h-[6.5rem] sm:w-20 sm:h-28",
};

function CardBack({ size = "md", className = "", style }) {
  return (
    <div
      className={`relative ${SIZE_CLASS[size]} rounded-xl border-2 border-white/30 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 shadow-lg shadow-black/50 overflow-hidden ${className}`}
      style={style}
    >
      <div className="absolute inset-1 rounded-lg border border-white/10 overflow-hidden">
        {/* embossed diamond-lattice pattern instead of a flat solid color */}
        <div className="absolute inset-0 opacity-[0.16] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.18)_0px,rgba(255,255,255,0.18)_1px,transparent_1px,transparent_6px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_6px)]" />
        {/* soft sheen */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.10),transparent_65%)]" />
      </div>
      <span className="absolute inset-0 flex items-center justify-center font-display italic font-black text-white/70 text-[0.6em] tracking-wide -rotate-12">
        UNO
      </span>
    </div>
  );
}

export default memo(CardBack);
