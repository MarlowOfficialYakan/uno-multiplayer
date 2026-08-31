import { useSettings } from "../../context/SettingsContext";
import TablePlane from "./TablePlane";

export default function TableBackground({ children, className = "", tilted = false }) {
  const { isLow } = useSettings();
  const showTiltedPlane = tilted && !isLow;

  return (
    // 100dvh (not h-screen/100vh) so mobile browser chrome resizing the
    // viewport doesn't leave stale extra space that content can visually
    // collide with.
    <div className={`relative w-full h-[100dvh] overflow-hidden bg-felt-900 ${className}`}>
      {isLow ? (
        <div className="absolute inset-0 bg-felt-900" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#123328_0%,_#0b1f1a_55%,_#050a08_100%)]" />
      )}

      {!isLow && (
        <div className="absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(45deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_10px)]" />
      )}

      {/* Part 1: tilted 3D table plane — game screen + Mode Tinggi only.
          Purely decorative, sits behind all real (flat) UI content. */}
      {showTiltedPlane && <TablePlane />}

      {/* vignette — a lighter version in low mode, full heavy inset-shadow otherwise */}
      <div
        className={`absolute inset-0 ${
          isLow ? "shadow-[inset_0_0_60px_20px_rgba(0,0,0,0.6)]" : "shadow-[inset_0_0_180px_80px_rgba(0,0,0,0.75)]"
        }`}
      />

      {!isLow && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-uno-yellow/10 blur-3xl" />
          {/* ambient particles — fixed positions, gentle CSS-driven drift; skipped entirely in low mode */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white/30 blur-[1px] animate-float1" style={{ top: "20%", left: "15%" }} />
          <div className="absolute w-1 h-1 rounded-full bg-white/20 blur-[1px] animate-float2" style={{ top: "65%", left: "80%" }} />
          <div className="absolute w-2 h-2 rounded-full bg-white/15 blur-[2px] animate-float3" style={{ top: "40%", left: "50%" }} />
          <div className="absolute w-1 h-1 rounded-full bg-white/25 blur-[1px] animate-float2" style={{ top: "80%", left: "25%" }} />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white/20 blur-[1px] animate-float1" style={{ top: "10%", left: "70%" }} />
          <div className="absolute w-1 h-1 rounded-full bg-white/20 blur-[1px] animate-float3" style={{ top: "55%", left: "10%" }} />
        </>
      )}

      {children}
    </div>
  );
}
