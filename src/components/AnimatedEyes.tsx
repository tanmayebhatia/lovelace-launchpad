import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import logomark from "@/assets/logomark.png";

const AnimatedEyes = ({ size = 200, animate = true }: { size?: number; animate?: boolean }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [animate]);

  useEffect(() => {
    if (!animate) return;
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const interval = setInterval(() => {
      if (Math.random() > 0.5) blink();
    }, 2500);
    return () => clearInterval(interval);
  }, [animate]);

  const getEyeOffset = () => {
    if (!animate || !containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.38;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = size * 0.025;
    const factor = Math.min(maxOffset, dist * 0.015);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * factor, y: Math.sin(angle) * factor };
  };

  const offset = getEyeOffset();
  const eyeSize = size * 0.105;
  // White cover slightly larger to hide original eyes
  const coverSize = eyeSize * 1.8;

  return (
    <div ref={containerRef} className="relative" style={{ width: size, height: size }}>
      <img src={logomark} alt="Lovelace" className="w-full h-full object-contain" />
      
      {animate && (
        <>
          {/* White covers to hide original eyes */}
          <div
            className="absolute rounded-full bg-background"
            style={{
              width: coverSize,
              height: coverSize,
              left: `${29}%`,
              top: `${29.5}%`,
              transform: "translate(-10%, -10%)",
            }}
          />
          <div
            className="absolute rounded-full bg-background"
            style={{
              width: coverSize,
              height: coverSize,
              left: `${54.5}%`,
              top: `${29.5}%`,
              transform: "translate(-10%, -10%)",
            }}
          />

          {/* Animated left eye */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: eyeSize,
              height: blinking ? eyeSize * 0.15 : eyeSize,
              backgroundColor: "black",
              left: `${31.5}%`,
              top: `${33}%`,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
            animate={{
              height: blinking ? eyeSize * 0.15 : eyeSize,
            }}
            transition={{ duration: 0.08 }}
          />
          {/* Animated right eye */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: eyeSize,
              height: blinking ? eyeSize * 0.15 : eyeSize,
              backgroundColor: "black",
              left: `${57}%`,
              top: `${33}%`,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
            animate={{
              height: blinking ? eyeSize * 0.15 : eyeSize,
            }}
            transition={{ duration: 0.08 }}
          />
        </>
      )}
    </div>
  );
};

export default AnimatedEyes;
