"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EyePositions {
  left: { x: number; y: number };
  right: { x: number; y: number };
  radius: number;
}

interface AnimatedEyesProps {
  size?: number;
  showEyes?: boolean;
  dropIn?: boolean;
}

export function AnimatedEyes({ size = 160, showEyes = false }: AnimatedEyesProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [eyePositions, setEyePositions] = useState<EyePositions | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect eye socket positions from logomark.png via canvas pixel scan
  const detectEyes = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const scanTop    = Math.floor(img.height * 0.25);
      const scanBottom = Math.floor(img.height * 0.50);
      const scanLeft   = Math.floor(img.width * 0.20);
      const scanRight  = Math.floor(img.width * 0.80);

      const imageData = ctx.getImageData(scanLeft, scanTop, scanRight - scanLeft, scanBottom - scanTop);
      const darkPixels: { x: number; y: number }[] = [];

      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * imageData.width + x) * 4;
          if (imageData.data[i] < 30 && imageData.data[i + 1] < 30 && imageData.data[i + 2] < 30) {
            darkPixels.push({ x: x + scanLeft, y: y + scanTop });
          }
        }
      }

      if (darkPixels.length === 0) return;

      const midX = img.width / 2;
      const leftPixels  = darkPixels.filter((p) => p.x < midX);
      const rightPixels = darkPixels.filter((p) => p.x >= midX);
      if (!leftPixels.length || !rightPixels.length) return;

      const avg = (px: { x: number; y: number }[]) => ({
        x: px.reduce((s, p) => s + p.x, 0) / px.length,
        y: px.reduce((s, p) => s + p.y, 0) / px.length,
      });
      const maxDist = (px: { x: number; y: number }[], c: { x: number; y: number }) =>
        Math.max(...px.map((p) => Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2)));

      const leftCenter  = avg(leftPixels);
      const rightCenter = avg(rightPixels);
      const radius = Math.max(maxDist(leftPixels, leftCenter), maxDist(rightPixels, rightCenter));

      setEyePositions({
        left:  { x: (leftCenter.x  / img.width) * 100, y: (leftCenter.y  / img.height) * 100 },
        right: { x: (rightCenter.x / img.width) * 100, y: (rightCenter.y / img.height) * 100 },
        radius: (radius / img.width) * 100,
      });
    };
    img.src = "/logomark.png";
  }, []);

  useEffect(() => { detectEyes(); }, [detectEyes]);

  // Mouse tracking — only when eyes are visible
  useEffect(() => {
    if (!showEyes) return;
    const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [showEyes]);

  // Random blinking — only when eyes are visible
  useEffect(() => {
    if (!showEyes) return;
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 140);
    };
    const id = setInterval(() => { if (Math.random() > 0.5) blink(); }, 2500);
    return () => clearInterval(id);
  }, [showEyes]);

  // Opening blink when eyes first appear
  useEffect(() => {
    if (!showEyes) return;
    const t1 = setTimeout(() => setBlinking(true),  80);
    const t2 = setTimeout(() => setBlinking(false), 220);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showEyes]);

  const getOffset = (): { x: number; y: number } => {
    if (!showEyes || !containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.35;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOff = size * 0.025;
    const factor = Math.min(maxOff, dist * 0.015);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * factor, y: Math.sin(angle) * factor };
  };

  const offset = getOffset();
  const eyeSize  = eyePositions ? `${eyePositions.radius * 1.8}%` : "0";
  const coverSize = eyePositions ? `${eyePositions.radius * 2.8}%` : "0";

  return (
    <div ref={containerRef} className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} className="hidden" />

      {/* Logomark — always rendered */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logomark.png"
        alt="Lovelace"
        className="w-full h-full object-contain"
        draggable={false}
      />

      {eyePositions && (
        <>
          {/* White covers over original eye holes — fade in with eyes */}
          <AnimatePresence>
            {showEyes && [eyePositions.left, eyePositions.right].map((eye, i) => (
              <motion.div
                key={`cover-${i}`}
                className="absolute rounded-full bg-background"
                style={{
                  width: coverSize,
                  height: coverSize,
                  left: `${eye.x}%`,
                  top: `${eye.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              />
            ))}
          </AnimatePresence>

          {/* Animated pupils — fade in and track mouse */}
          <AnimatePresence>
            {showEyes && [eyePositions.left, eyePositions.right].map((eye, i) => (
              <motion.div
                key={`eye-${i}`}
                className="absolute rounded-full bg-foreground"
                style={{
                  width: eyeSize,
                  left: `${eye.x}%`,
                  top: `${eye.y}%`,
                }}
                initial={{ opacity: 0, height: eyeSize, x: "-50%", y: "-50%" }}
                animate={{
                  opacity: 1,
                  height: blinking ? `${eyePositions.radius * 0.25}%` : eyeSize,
                  x: `calc(-50% + ${offset.x}px)`,
                  y: `calc(-50% + ${offset.y}px)`,
                }}
                transition={{
                  opacity: { duration: 0.3, delay: 0.1 },
                  height:  { duration: 0.08 },
                  x:       { duration: 0.06 },
                  y:       { duration: 0.06 },
                }}
              />
            ))}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
