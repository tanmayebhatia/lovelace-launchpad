"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EyePositions {
  left:  { x: number; y: number };
  right: { x: number; y: number };
  radius: number;
}

interface AnimatedEyesProps {
  size?: number;
  showEyes?: boolean;
}

export function AnimatedEyes({ size = 160, showEyes = false }: AnimatedEyesProps) {
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 });
  const [blinking, setBlinking]       = useState(false);
  const [eyePositions, setEyePositions] = useState<EyePositions | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect the two eye-dot positions from the logomark via canvas pixel scan
  const detectEyes = useCallback(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Scan the central band where the eye dots live
      const scanTop    = Math.floor(img.height * 0.20);
      const scanBottom = Math.floor(img.height * 0.55);
      const scanLeft   = Math.floor(img.width  * 0.15);
      const scanRight  = Math.floor(img.width  * 0.85);
      const w = scanRight - scanLeft;
      const h = scanBottom - scanTop;

      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(scanLeft, scanTop, w, h);
      } catch { return; }

      // Collect dark pixels (the eye dots)
      const dark: { x: number; y: number }[] = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (
            imageData.data[i]     < 40 &&
            imageData.data[i + 1] < 40 &&
            imageData.data[i + 2] < 40 &&
            imageData.data[i + 3] > 200
          ) {
            dark.push({ x: x + scanLeft, y: y + scanTop });
          }
        }
      }
      if (!dark.length) return;

      // Split into left/right clusters by x midpoint
      const midX = img.width / 2;
      const left  = dark.filter(p => p.x < midX);
      const right = dark.filter(p => p.x >= midX);
      if (!left.length || !right.length) return;

      const avg = (pts: { x: number; y: number }[]) => ({
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      });
      const maxR = (pts: { x: number; y: number }[], c: { x: number; y: number }) =>
        Math.max(...pts.map(p => Math.hypot(p.x - c.x, p.y - c.y)));

      const lc = avg(left);
      const rc = avg(right);
      const radius = Math.max(maxR(left, lc), maxR(right, rc));

      setEyePositions({
        left:  { x: (lc.x / img.width) * 100, y: (lc.y / img.height) * 100 },
        right: { x: (rc.x / img.width) * 100, y: (rc.y / img.height) * 100 },
        radius: (radius / img.width) * 100,
      });
    };
    img.src = "/logomark.png";
  }, []);

  useEffect(() => { detectEyes(); }, [detectEyes]);

  // Mouse tracking
  useEffect(() => {
    if (!showEyes) return;
    const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [showEyes]);

  // Random blinking
  useEffect(() => {
    if (!showEyes) return;
    const id = setInterval(() => {
      if (Math.random() > 0.5) {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 130);
      }
    }, 2800);
    return () => clearInterval(id);
  }, [showEyes]);

  // Opening blink on reveal
  useEffect(() => {
    if (!showEyes) return;
    const t1 = setTimeout(() => setBlinking(true),  60);
    const t2 = setTimeout(() => setBlinking(false), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showEyes]);

  const getPupilOffset = () => {
    if (!showEyes || !containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height * 0.38;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const dist  = Math.hypot(dx, dy);
    const max   = size * 0.022;
    const factor = Math.min(max, dist * 0.012) / (dist || 1);
    return { x: dx * factor, y: dy * factor };
  };

  const offset    = getPupilOffset();
  const pupilSize = eyePositions ? `${eyePositions.radius * 1.6}%` : "0";

  return (
    <div ref={containerRef} className="relative" style={{ width: size, height: size }}>
      {/* Logomark — always rendered, never hidden */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logomark.png"
        alt="Lovelace logomark"
        className="w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
        crossOrigin="anonymous"
      />

      {/* Pupils — only appear after rotation completes */}
      <AnimatePresence>
        {showEyes && eyePositions && (
          <>
            {[eyePositions.left, eyePositions.right].map((eye, i) => (
              <motion.div
                key={`pupil-${i}`}
                className="absolute rounded-full bg-foreground"
                style={{
                  width:  pupilSize,
                  left:   `${eye.x}%`,
                  top:    `${eye.y}%`,
                  transformOrigin: "center center",
                }}
                initial={{ opacity: 0, height: pupilSize, x: "-50%", y: "-50%" }}
                animate={{
                  opacity: 1,
                  height:  blinking ? `${eyePositions.radius * 0.2}%` : pupilSize,
                  x:       `calc(-50% + ${offset.x}px)`,
                  y:       `calc(-50% + ${offset.y}px)`,
                }}
                transition={{
                  opacity: { duration: 0.3, delay: i * 0.05 },
                  height:  { duration: 0.07 },
                  x:       { duration: 0.05 },
                  y:       { duration: 0.05 },
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
