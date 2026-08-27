export default function TableBackground({ children, className = "" }) {
  return (
    <div className={`relative w-full h-screen overflow-hidden bg-felt-900 ${className}`}>
      {/* felt gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#123328_0%,_#0b1f1a_55%,_#050a08_100%)]" />
      {/* subtle woven felt texture */}
      <div className="absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(45deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_10px)]" />
      {/* vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_180px_80px_rgba(0,0,0,0.75)]" />
      {/* soft glow behind the center discard pile */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-uno-yellow/10 blur-3xl" />

      {/* ambient particles — fixed positions, gentle CSS-driven drift (cheap on mobile, no JS per-frame work) */}
      <div className="absolute w-1.5 h-1.5 rounded-full bg-white/30 blur-[1px] animate-float1" style={{ top: "20%", left: "15%" }} />
      <div className="absolute w-1 h-1 rounded-full bg-white/20 blur-[1px] animate-float2" style={{ top: "65%", left: "80%" }} />
      <div className="absolute w-2 h-2 rounded-full bg-white/15 blur-[2px] animate-float3" style={{ top: "40%", left: "50%" }} />
      <div className="absolute w-1 h-1 rounded-full bg-white/25 blur-[1px] animate-float2" style={{ top: "80%", left: "25%" }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-white/20 blur-[1px] animate-float1" style={{ top: "10%", left: "70%" }} />
      <div className="absolute w-1 h-1 rounded-full bg-white/20 blur-[1px] animate-float3" style={{ top: "55%", left: "10%" }} />

      {children}
    </div>
  );
}
