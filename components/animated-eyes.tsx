"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EyePos {
  x: number; // % from left of image
  y: number; // % from top of image
}

interface EyeData {
  left: EyePos;
  right: EyePos;
  radiusPct: number; // eye radius as % of image width
}

interface AnimatedEyesProps {
  showEyes?: boolean;
}

export function AnimatedEyes({ showEyes = false }: AnimatedEyesProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [blinking,  setBlinking]  = useState(false);
  const [eyeData,   setEyeData]   = useState<EyeData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect eye socket positions: scan for LIGHT pixels surrounded by dark context
  // (the white ellipses inside the logomark)
  const detectEyes = useCallback(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const W = img.width;
      const H = img.height;
      const canvas = document.createElement("canvas");
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      // Scan the upper-centre region where the eye sockets live
      const sL = Math.floor(W * 0.10);
      const sR = Math.floor(W * 0.90);
      const sT = Math.floor(H * 0.15);
      const sB = Math.floor(H * 0.60);
      const sw = sR - sL;
      const sh = sB - sT;

      let data: ImageData;
      try { data = ctx.getImageData(sL, sT, sw, sh); }
      catch { return; }

      // Collect bright (white) pixels inside the scan region
      const bright: { x: number; y: number }[] = [];
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const i = (y * sw + x) * 4;
          const r = data.data[i], g = data.data[i+1], b = data.data[i+2], a = data.data[i+3];
          if (r > 220 && g > 220 && b > 220 && a > 200) {
            bright.push({ x: x + sL, y: y + sT });
          }
        }
      }
      if (bright.length < 20) return;

      // Split by x midpoint
      const midX = W / 2;
      const leftPts  = bright.filter(p => p.x < midX);
      const rightPts = bright.filter(p => p.x >= midX);
      if (!leftPts.length || !rightPts.length) return;

      const avg = (pts: { x: number; y: number }[]) => ({
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      });

      const lc = avg(leftPts);
      const rc = avg(rightPts);

      // Radius = half the spread of each cluster
      const lRadius = (Math.max(...leftPts.map(p => p.x))  - Math.min(...leftPts.map(p => p.x)))  / 2;
      const rRadius = (Math.max(...rightPts.map(p => p.x)) - Math.min(...rightPts.map(p => p.x))) / 2;
      const radius  = (lRadius + rRadius) / 2;

      setEyeData({
        left:  { x: (lc.x / W) * 100, y: (lc.y / H) * 100 },
        right: { x: (rc.x / W) * 100, y: (rc.y / H) * 100 },
        radiusPct: (radius / W) * 100,
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
      if (Math.random() > 0.55) {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 120);
      }
    }, 2600);
    return () => clearInterval(id);
  }, [showEyes]);

  // Opening blink on reveal
  useEffect(() => {
    if (!showEyes) return;
    const t1 = setTimeout(() => setBlinking(true),  50);
    const t2 = setTimeout(() => setBlinking(false), 180);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showEyes]);

  const getPupilOffset = () => {
    if (!showEyes || !containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const dist   = Math.hypot(dx, dy);
    const maxPx  = rect.width * 0.025;
    const factor = dist > 0 ? Math.min(maxPx, dist * 0.015) / dist : 0;
    return { x: dx * factor, y: dy * factor };
  };

  const offset      = getPupilOffset();
  // Pupil size: slightly smaller than the eye socket radius so it fits neatly inside
  const pupilPct    = eyeData ? `${eyeData.radiusPct * 1.1}%` : "0%";
  const pupilHPct   = eyeData
    ? blinking
      ? `${eyeData.radiusPct * 0.18}%`
      : `${eyeData.radiusPct * 1.1}%`
    : "0%";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
    >
      {/* Logomark image — always rendered, fills parent */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logomark.png"
        alt="Lovelace logomark"
        className="w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
        crossOrigin="anonymous"
      />

      {/* Pupils — only after rotation completes */}
      <AnimatePresence>
        {showEyes && eyeData && (
          <>
            {([eyeData.left, eyeData.right] as EyePos[]).map((eye, i) => (
              <motion.div
                key={`pupil-${i}`}
                className="absolute rounded-full bg-foreground"
                style={{
                  width:           pupilPct,
                  left:            `${eye.x}%`,
                  top:             `${eye.y}%`,
                  transformOrigin: "center center",
                }}
                initial={{ opacity: 0, height: pupilPct, x: "-50%", y: "-50%" }}
                animate={{
                  opacity: 1,
                  height:  pupilHPct,
                  x:       `calc(-50% + ${offset.x}px)`,
                  y:       `calc(-50% + ${offset.y}px)`,
                }}
                transition={{
                  opacity: { duration: 0.25, delay: i * 0.06 },
                  height:  { duration: 0.08 },
                  x:       { duration: 0.06 },
                  y:       { duration: 0.06 },
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
