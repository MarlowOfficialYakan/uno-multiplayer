import { Canvas } from "@react-three/fiber";
import BurstParticles from "./BurstParticles";
import SpinningCard from "./SpinningCard";

/**
 * The only place in the app that mounts a WebGL canvas, and only for the
 * few hundred ms an Epic Moment's FOCUS/CHARGE/BURST beats are active —
 * per the spec, WebGL is reserved for hero moments only, everything else
 * stays CSS/Framer Motion.
 */
export default function EpicScene({ beat, theme }) {
  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [0, 0, 6], fov: 50 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[2, 2, 4]} intensity={1.4} color={theme.color} />
      {(beat === "focus" || beat === "charge") && <SpinningCard color={theme.color} />}
      {beat === "burst" && <BurstParticles color={theme.color} count={theme.particleCount} />}
    </Canvas>
  );
}
