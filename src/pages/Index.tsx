import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import lockupImg from "@/assets/lockup.png";

import AnimatedEyes from "@/components/AnimatedEyes";

type Phase = "lockup" | "reveal" | "grow" | "eyes-drop" | "intro";

interface LogomarkPosition {
  // Offset from lockup center to logomark center (in px, at rendered size)
  offsetX: number;
  offsetY: number;
  // Size the logomark should be to match the lockup
  size: number;
}

const Index = () => {
  const [phase, setPhase] = useState<Phase>("lockup");
  const [logoPos, setLogoPos] = useState<LogomarkPosition | null>(null);
  const lockupRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("reveal"), 2000),
      setTimeout(() => setPhase("grow"), 2800),
      setTimeout(() => setPhase("eyes-drop"), 4200),
      setTimeout(() => setPhase("intro"), 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Detect the logomark position within the lockup image using pixel analysis
  const detectLogomarkInLockup = useCallback(() => {
    if (!canvasRef.current || !lockupRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lockupEl = lockupRef.current;
    const renderedW = lockupEl.getBoundingClientRect().width;
    const renderedH = lockupEl.getBoundingClientRect().height;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Scan left 40% of lockup for dark pixels (that's where the logomark is)
      const scanRight = Math.floor(img.width * 0.4);
      const imageData = ctx.getImageData(0, 0, scanRight, img.height);
      const darkPixels: { x: number; y: number }[] = [];

      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * imageData.width + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];
          if (r < 50 && g < 50 && b < 50 && a > 200) {
            darkPixels.push({ x, y });
          }
        }
      }

      if (darkPixels.length === 0) return;

      // Find bounding box of the logomark within the lockup
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of darkPixels) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const logoWidth = maxX - minX;
      const logoHeight = maxY - minY;

      // Convert to rendered coordinates
      const scaleX = renderedW / img.width;
      const scaleY = renderedH / img.height;

      // The logomark in the lockup is rotated -90°, so its width/height are swapped
      // The logomark.png is square, so we use the larger dimension
      const logomarkSize = Math.max(logoWidth, logoHeight) * scaleX;

      setLogoPos({
        offsetX: (centerX - img.width / 2) * scaleX,
        offsetY: (centerY - img.height / 2) * scaleY,
        size: logomarkSize,
      });
    };
    img.src = lockupImg;
  }, []);

  useEffect(() => {
    // Wait for lockup image to render, then detect
    const t = setTimeout(detectLogomarkInLockup, 100);
    window.addEventListener("resize", detectLogomarkInLockup);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", detectLogomarkInLockup);
    };
  }, [detectLogomarkInLockup]);

  const isRevealed = phase !== "lockup";
  const isGrown = phase === "grow" || phase === "eyes-drop" || phase === "intro";
  const showEyes = phase === "eyes-drop" || phase === "intro";
  const showIntro = phase === "intro";

  // Target size for the final Lovelace logo
  const targetSize = 160;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center" style={{ minHeight: targetSize + 40 }}>
          {/* Full lockup image - fades out during reveal */}
          <motion.img
            ref={lockupRef}
            src={lockupImg}
            alt="Primary"
            className="h-20 md:h-28"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: isRevealed ? 0 : 1,
              scale: 1,
            }}
            transition={{
              opacity: { duration: 0.5, ease: "easeOut" },
              scale: { duration: 0.6, ease: "easeOut" },
            }}
            style={{ position: "absolute" }}
          />

          {/* Logomark overlay: starts exactly matching lockup position, then grows to center */}
          {logoPos && (
            <motion.div
              className="absolute"
              style={{ transformOrigin: "center center" }}
              initial={{
                x: logoPos.offsetX,
                y: logoPos.offsetY,
                rotate: -90,
                scale: logoPos.size / targetSize,
                opacity: 0,
              }}
              animate={{
                x: isGrown ? 0 : logoPos.offsetX,
                y: isGrown ? 0 : logoPos.offsetY,
                rotate: isGrown ? 0 : -90,
                scale: isGrown ? 1 : logoPos.size / targetSize,
                opacity: 1,
              }}
              transition={{
                x: { type: "spring", damping: 22, stiffness: 80 },
                y: { type: "spring", damping: 22, stiffness: 80 },
                rotate: { type: "spring", damping: 14, stiffness: 70 },
                scale: { type: "spring", damping: 20, stiffness: 80 },
                opacity: { duration: 0.15 },
              }}
            >
              <AnimatedEyes
                size={targetSize}
                animate={showEyes}
                showEyes={showEyes}
                dropIn={showEyes}
              />
            </motion.div>
          )}
        </div>

        {/* Intro text */}
        {showIntro && (
          <div className="flex flex-col items-center gap-8 mt-4">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground"
            >
              Introducing the first PrimaryOS product
            </motion.p>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.7, ease: "easeOut" }}
              className="text-6xl md:text-8xl font-black tracking-tight text-foreground"
            >
              Lovelace
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="text-xl md:text-2xl font-medium text-muted-foreground"
            >
              Sourcing at scale.
            </motion.p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
