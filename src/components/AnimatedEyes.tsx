import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import logomark from "@/assets/logomark.png";

const AnimatedEyes = ({ size = 200, animate = true }: { size?: number; animate?: boolean }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [eyePositions, setEyePositions] = useState<{ left: { x: number; y: number }; right: { x: number; y: number }; radius: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect eye positions by scanning the image pixels
  const detectEyes = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Scan upper portion for dark circular dots (eyes)
      // Eyes should be in roughly the top 30-45% vertically, 25-75% horizontally
      const scanTop = Math.floor(img.height * 0.25);
      const scanBottom = Math.floor(img.height * 0.45);
      const scanLeft = Math.floor(img.width * 0.25);
      const scanRight = Math.floor(img.width * 0.75);

      const darkPixels: { x: number; y: number }[] = [];
      const imageData = ctx.getImageData(scanLeft, scanTop, scanRight - scanLeft, scanBottom - scanTop);

      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * imageData.width + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          // Check if pixel is very dark (part of the eye)
          if (r < 30 && g < 30 && b < 30) {
            darkPixels.push({ x: x + scanLeft, y: y + scanTop });
          }
        }
      }

      if (darkPixels.length === 0) return;

      // Cluster dark pixels into two groups (left and right eye)
      const midX = img.width / 2;
      const leftPixels = darkPixels.filter(p => p.x < midX);
      const rightPixels = darkPixels.filter(p => p.x >= midX);

      if (leftPixels.length === 0 || rightPixels.length === 0) return;

      // Find center of each cluster
      const avgPos = (pixels: { x: number; y: number }[]) => ({
        x: pixels.reduce((s, p) => s + p.x, 0) / pixels.length,
        y: pixels.reduce((s, p) => s + p.y, 0) / pixels.length,
      });

      const leftCenter = avgPos(leftPixels);
      const rightCenter = avgPos(rightPixels);

      // Estimate radius from cluster spread
      const maxDist = (pixels: { x: number; y: number }[], center: { x: number; y: number }) => {
        let max = 0;
        for (const p of pixels) {
          const d = Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2);
          if (d > max) max = d;
        }
        return max;
      };

      const radius = Math.max(maxDist(leftPixels, leftCenter), maxDist(rightPixels, rightCenter));

      // Convert to percentages of image size
      setEyePositions({
        left: { x: (leftCenter.x / img.width) * 100, y: (leftCenter.y / img.height) * 100 },
        right: { x: (rightCenter.x / img.width) * 100, y: (rightCenter.y / img.height) * 100 },
        radius: (radius / img.width) * 100,
      });
    };
    img.src = logomark;
  }, []);

  useEffect(() => {
    if (animate) detectEyes();
  }, [animate, detectEyes]);

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
    const cy = rect.top + rect.height * 0.35;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = size * 0.025;
    const factor = Math.min(maxOffset, dist * 0.015);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * factor, y: Math.sin(angle) * factor };
  };

  const offset = getEyeOffset();

  return (
    <div ref={containerRef} className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} className="hidden" />
      <img src={logomark} alt="Lovelace" className="w-full h-full object-contain" />

      {animate && eyePositions && (
        <>
          {/* White covers to hide original eyes */}
          {[eyePositions.left, eyePositions.right].map((eye, i) => (
            <div
              key={`cover-${i}`}
              className="absolute rounded-full bg-background"
              style={{
                width: `${eyePositions.radius * 3}%`,
                height: `${eyePositions.radius * 3}%`,
                left: `${eye.x}%`,
                top: `${eye.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Animated eyes */}
          {[eyePositions.left, eyePositions.right].map((eye, i) => (
            <motion.div
              key={`eye-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${eyePositions.radius * 1.8}%`,
                height: blinking ? `${eyePositions.radius * 0.3}%` : `${eyePositions.radius * 1.8}%`,
                backgroundColor: "black",
                left: `${eye.x}%`,
                top: `${eye.y}%`,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
              animate={{
                height: blinking ? `${eyePositions.radius * 0.3}%` : `${eyePositions.radius * 1.8}%`,
              }}
              transition={{ duration: 0.08 }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default AnimatedEyes;
