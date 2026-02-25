import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import logomark from "@/assets/logomark.png";

const AnimatedEyes = ({ size = 200 }: { size?: number }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const interval = setInterval(() => {
      if (Math.random() > 0.5) blink();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const getEyeOffset = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.38;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = size * 0.03;
    const factor = Math.min(maxOffset, dist * 0.02);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * factor, y: Math.sin(angle) * factor };
  };

  const offset = getEyeOffset();
  const eyeSize = size * 0.115;

  return (
    <div ref={containerRef} className="relative" style={{ width: size, height: size }}>
      <img src={logomark} alt="Lovelace" className="w-full h-full object-contain" />
      {/* Left eye overlay */}
      <motion.div
        className="absolute rounded-full bg-foreground"
        style={{
          width: eyeSize,
          height: blinking ? eyeSize * 0.15 : eyeSize,
          left: `${31.5}%`,
          top: `${34}%`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
        animate={{
          height: blinking ? eyeSize * 0.15 : eyeSize,
          borderRadius: "50%",
        }}
        transition={{ duration: 0.08 }}
      />
      {/* Right eye overlay */}
      <motion.div
        className="absolute rounded-full bg-foreground"
        style={{
          width: eyeSize,
          height: blinking ? eyeSize * 0.15 : eyeSize,
          left: `${56.5}%`,
          top: `${34}%`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
        animate={{
          height: blinking ? eyeSize * 0.15 : eyeSize,
          borderRadius: "50%",
        }}
        transition={{ duration: 0.08 }}
      />
    </div>
  );
};

export default AnimatedEyes;
