import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import lockupImg from "@/assets/lockup.png";
import AnimatedEyes from "@/components/AnimatedEyes";

type Phase = "lockup" | "reveal" | "grow" | "eyes-drop" | "intro";

const TARGET_SIZE = 160;
// Match CSS: h-20 = 80px, md:h-28 = 112px
const LOCKUP_HEIGHT = window.innerWidth >= 768 ? 112 : 80;

const Index = () => {
  const [phase, setPhase] = useState<Phase>("lockup");
  const [logoOffset, setLogoOffset] = useState<{ x: number; y: number; scale: number } | null>(null);

  // Preload lockup and detect logomark position
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const scanRight = Math.floor(img.width * 0.4);
      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, scanRight, img.height);
      } catch {
        return;
      }

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * imageData.width + x) * 4;
          if (imageData.data[i] < 50 && imageData.data[i + 1] < 50 && imageData.data[i + 2] < 50 && imageData.data[i + 3] > 200) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX === Infinity) return;

      // Compute rendered lockup width from aspect ratio
      const aspectRatio = img.width / img.height;
      const renderedW = LOCKUP_HEIGHT * aspectRatio;

      const scaleX = renderedW / img.width;
      const scaleY = LOCKUP_HEIGHT / img.height;

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const logomarkSize = Math.max(maxX - minX, maxY - minY) * scaleX;

      setLogoOffset({
        x: (centerX - img.width / 2) * scaleX,
        y: (centerY - img.height / 2) * scaleY,
        scale: logomarkSize / TARGET_SIZE,
      });
    };
    img.src = lockupImg;
  }, []);

  // Phase timers
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("reveal"), 2000),
      setTimeout(() => setPhase("grow"), 2800),
      setTimeout(() => setPhase("eyes-drop"), 4200),
      setTimeout(() => setPhase("intro"), 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const showLockup = phase === "lockup";
  const isRevealed = phase !== "lockup";
  const isGrown = phase === "grow" || phase === "eyes-drop" || phase === "intro";
  const showEyes = phase === "eyes-drop" || phase === "intro";
  const showIntro = phase === "intro";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center" style={{ minHeight: TARGET_SIZE + 40 }}>

          {/* Full lockup image */}
          <img
            src={lockupImg}
            alt="Primary"
            className="h-20 md:h-28"
            style={{
              opacity: showLockup ? 1 : 0,
              transition: "opacity 0.5s ease-out",
              position: isRevealed ? "absolute" : "relative",
              pointerEvents: isRevealed ? "none" : "auto",
            }}
          />

          {/* Logomark overlay */}
          {logoOffset && (
            <motion.div
              className="absolute"
              style={{ transformOrigin: "center center" }}
              initial={{
                x: logoOffset.x,
                y: logoOffset.y,
                rotate: -90,
                scale: logoOffset.scale,
                opacity: 0,
              }}
              animate={{
                x: isGrown ? 0 : logoOffset.x,
                y: isGrown ? 0 : logoOffset.y,
                rotate: isGrown ? 0 : -90,
                scale: isGrown ? 1 : logoOffset.scale,
                opacity: isRevealed ? 1 : 0,
              }}
              transition={{
                x: { type: "spring", damping: 22, stiffness: 80 },
                y: { type: "spring", damping: 22, stiffness: 80 },
                rotate: { type: "spring", damping: 14, stiffness: 70 },
                scale: { type: "spring", damping: 20, stiffness: 80 },
                opacity: { duration: 0.4 },
              }}
            >
              <AnimatedEyes
                size={TARGET_SIZE}
                animate={showEyes}
                showEyes={showEyes}
                dropIn={showEyes}
              />
            </motion.div>
          )}
        </div>

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
