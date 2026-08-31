/**
 * A purely decorative, tilted 3D "table surface" rendered BEHIND the real
 * (flat, upright, fully readable) game UI. Only mounted in Mode Tinggi for
 * the actual game screen — this is what gives the "looking down at a real
 * table from a slight angle" feel from the spec, without ever rotating any
 * interactive element, so hit-testing/readability stay exactly as before.
 *
 * `pointer-events-none` throughout so it never intercepts taps.
 */
export default function TablePlane() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      style={{ perspective: "1400px" }}
    >
      <div
        className="absolute w-[150%] h-[145%] rounded-[3rem]"
        style={{
          transform: "rotateX(38deg) scale(1.05)",
          transformOrigin: "50% 28%",
          background: "radial-gradient(ellipse at 50% 18%, #1a4433 0%, #0e2a1f 45%, #051309 100%)",
          boxShadow: "0 60px 140px rgba(0,0,0,0.85)",
        }}
      >
        {/* directional light from "above" the table */}
        <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-white/10 via-transparent to-black/50" />
        {/* woven felt texture */}
        <div className="absolute inset-0 rounded-[3rem] opacity-[0.05] bg-[repeating-linear-gradient(45deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_10px)]" />
        {/* slow ambient light flicker so the table never feels static */}
        <div className="absolute inset-0 rounded-[3rem] bg-white/5 animate-flicker" />
      </div>
    </div>
  );
}
