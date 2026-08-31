import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * A one-shot particle explosion using a plain THREE.Points cloud (no extra
 * libraries beyond three/@react-three/fiber). Velocities are randomized on
 * a sphere; each frame nudges position by velocity*time with a touch of
 * "gravity" on Y, and fades opacity out — classic, cheap, and easy to
 * reason about compared to a full particle-system library.
 */
export default function BurstParticles({ color = "#ffd60a", count = 80 }) {
  const pointsRef = useRef(null);
  const materialRef = useRef(null);
  const elapsed = useRef(0);

  const velocities = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 2 + Math.random() * 3;
      arr[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      arr[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      arr[i * 3 + 2] = Math.cos(phi) * speed * 0.5;
    }
    return arr;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame((_state, delta) => {
    elapsed.current += delta;
    const t = elapsed.current;
    const posAttr = pointsRef.current?.geometry?.attributes?.position;
    if (!posAttr) return;

    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] = velocities[i * 3] * t;
      posAttr.array[i * 3 + 1] = velocities[i * 3 + 1] * t - t * t * 1.3; // gentle gravity arc
      posAttr.array[i * 3 + 2] = velocities[i * 3 + 2] * t;
    }
    posAttr.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = Math.max(0, 1 - t / 1.1);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={color}
        size={0.14}
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
