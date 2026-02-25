import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const AnimatedEyes = ({ size = 200 }: { size?: number }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blink randomly
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

  // Calculate eye offset based on mouse position relative to center
  const getEyeOffset = (eyeCenterX: number, eyeCenterY: number) => {
    const dx = mousePos.x - eyeCenterX;
    const dy = mousePos.y - eyeCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = size * 0.04;
    const scale = Math.min(maxOffset / (dist + 1), 0.08);
    return { x: dx * scale, y: dy * scale };
  };

  const scale = size / 200;
  const eyeRadius = 14 * scale;
  const pupilRadius = 14 * scale;

  // Eye positions relative to the SVG viewbox
  const leftEye = { cx: 68 * scale, cy: 72 * scale };
  const rightEye = { cx: 132 * scale, cy: 72 * scale };

  const leftOffset = getEyeOffset(
    window.innerWidth / 2 - 32 * scale,
    window.innerHeight / 2 - 28 * scale
  );
  const rightOffset = getEyeOffset(
    window.innerWidth / 2 + 32 * scale,
    window.innerHeight / 2 - 28 * scale
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
    >
      {/* Logo shape - the square with smile */}
      <rect x={0} y={16 * scale} width={size} height={size - 16 * scale} fill="black" rx={0} />
      {/* Top bar */}
      <rect x={0} y={0} width={size * 0.75} height={18 * scale} fill="black" />

      {/* Smile cutout */}
      <ellipse
        cx={size / 2}
        cy={size * 0.65}
        rx={size * 0.35}
        ry={size * 0.32}
        fill="white"
      />

      {/* Left eye */}
      <motion.circle
        cx={leftEye.cx + leftOffset.x}
        cy={leftEye.cy + leftOffset.y}
        r={blinking ? pupilRadius * 0.2 : pupilRadius}
        fill="black"
        animate={{
          cy: blinking ? leftEye.cy : leftEye.cy + leftOffset.y,
          r: blinking ? pupilRadius * 0.2 : pupilRadius,
        }}
        transition={{ duration: 0.1 }}
      />

      {/* Right eye */}
      <motion.circle
        cx={rightEye.cx + rightOffset.x}
        cy={rightEye.cy + rightOffset.y}
        r={blinking ? pupilRadius * 0.2 : pupilRadius}
        fill="black"
        animate={{
          cy: blinking ? rightEye.cy : rightEye.cy + rightOffset.y,
          r: blinking ? pupilRadius * 0.2 : pupilRadius,
        }}
        transition={{ duration: 0.1 }}
      />
    </svg>
  );
};

export default AnimatedEyes;
