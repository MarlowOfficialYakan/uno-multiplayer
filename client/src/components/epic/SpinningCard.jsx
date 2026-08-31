import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * A simple glowing card-shaped box, slowly spinning and bobbing — stands
 * in for "the key card" during FOCUS/CHARGE. Deliberately simple geometry
 * (a thin box, not a modeled card) to keep this cheap and low-risk.
 */
export default function SpinningCard({ color = "#ffd60a" }) {
  const ref = useRef(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 1.6;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.4) * 0.15;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.08;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.6, 2.3, 0.08]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} roughness={0.35} metalness={0.15} />
    </mesh>
  );
}
