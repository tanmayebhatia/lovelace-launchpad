import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import lockupImg from "@/assets/lockup.png";
import logomarkImg from "@/assets/logomark.png";
import AnimatedEyes from "@/components/AnimatedEyes";
import TypewriterText from "@/components/TypewriterText";

type Phase = "lockup" | "reveal" | "grow" | "eyes-drop" | "intro" | "intro-lovelace-wait" | "intro-lovelace";

const TARGET_SIZE = 160;
// Match CSS: h-20 = 80px, md:h-28 = 112px
const LOCKUP_HEIGHT = window.innerWidth >= 768 ? 112 : 80;

const Index = () => {
  const [phase, setPhase] = useState<Phase>("lockup");
  const [logoOffset, setLogoOffset] = useState<{ x: number; y: number; scale: number } | null>(null);

  // Preload both images and compute perfect overlay alignment
  useEffect(() => {
    let lockupResult: { cx: number; cy: number; bw: number; bh: number } | null = null;
    let logomarkResult: { cx: number; cy: number; bw: number; bh: number } | null = null;
    let lockupW = 0, lockupH = 0, logomarkW = 0, logomarkH = 0;

    const scanDarkPixels = (
      img: HTMLImageElement,
      region: { left: number; top: number; right: number; bottom: number }
    ) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const { left, top, right, bottom } = region;
      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(left, top, right - left, bottom - top);
      } catch {
        return null;
      }
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * imageData.width + x) * 4;
          if (imageData.data[i] < 50 && imageData.data[i + 1] < 50 && imageData.data[i + 2] < 50 && imageData.data[i + 3] > 200) {
            const absX = x + left;
            const absY = y + top;
            if (absX < minX) minX = absX;
            if (absX > maxX) maxX = absX;
            if (absY < minY) minY = absY;
            if (absY > maxY) maxY = absY;
          }
        }
      }
      if (minX === Infinity) return null;
      return {
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        bw: maxX - minX,
        bh: maxY - minY,
      };
    };

    const tryCompute = () => {
      if (!lockupResult || !logomarkResult) return;

      // Rendered lockup dimensions (aspect-ratio preserved via height constraint)
      const lockupAspect = lockupW / lockupH;
      const renderedW = LOCKUP_HEIGHT * lockupAspect;
      const scaleR = renderedW / lockupW;

      // Lockup icon center & dimensions in rendered pixels
      const lockupLogoCX = (lockupResult.cx - lockupW / 2) * scaleR;
      const lockupLogoCY = (lockupResult.cy - lockupH / 2) * scaleR;
      const lockupIconW = lockupResult.bw * scaleR;
      const lockupIconH = lockupResult.bh * scaleR;

      // How logomark.png renders inside the TARGET_SIZE div via object-contain
      const mAspect = logomarkW / logomarkH;
      let mRenderW: number, mRenderH: number;
      if (mAspect >= 1) {
        mRenderW = TARGET_SIZE;
        mRenderH = TARGET_SIZE / mAspect;
      } else {
        mRenderH = TARGET_SIZE;
        mRenderW = TARGET_SIZE * mAspect;
      }
      const mOffX = (TARGET_SIZE - mRenderW) / 2;
      const mOffY = (TARGET_SIZE - mRenderH) / 2;

      // Logomark content bounds within the TARGET_SIZE div
      const logoContentW = (logomarkResult.bw / logomarkW) * mRenderW;
      const logoContentH = (logomarkResult.bh / logomarkH) * mRenderH;
      const logoCenterInDivX = mOffX + (logomarkResult.cx / logomarkW) * mRenderW;
      const logoCenterInDivY = mOffY + (logomarkResult.cy / logomarkH) * mRenderH;

      // Scale to match lockup icon width to overlay content width (prevents bleeding into text)
      const scale = lockupIconW / logoContentW;

      // Offset from div center to content center
      const divToLogoCX = logoCenterInDivX - TARGET_SIZE / 2;
      const divToLogoCY = logoCenterInDivY - TARGET_SIZE / 2;

      // Position: divPos + divToLogoC * scale = lockupLogoCenter
      const x = lockupLogoCX - divToLogoCX * scale;
      const y = lockupLogoCY - divToLogoCY * scale;



      setLogoOffset({ x, y, scale });
    };

    const img1 = new Image();
    img1.onload = () => {
      lockupW = img1.width;
      lockupH = img1.height;
      lockupResult = scanDarkPixels(img1, {
        left: 0, top: 0,
        right: Math.floor(img1.width * 0.22),
        bottom: img1.height,
      });
      tryCompute();
    };
    img1.src = lockupImg;

    const img2 = new Image();
    img2.onload = () => {
      logomarkW = img2.width;
      logomarkH = img2.height;
      logomarkResult = scanDarkPixels(img2, {
        left: 0, top: 0,
        right: img2.width,
        bottom: img2.height,
      });
      tryCompute();
    };
    img2.src = logomarkImg;
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

  // Pause timer: after first line types, wait 2s before showing Lovelace
  useEffect(() => {
    if (phase === "intro-lovelace-wait") {
      const t = setTimeout(() => setPhase("intro-lovelace"), 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const showLockup = phase === "lockup";
  const isRevealed = phase !== "lockup";
  const introPhases: Phase[] = ["intro", "intro-lovelace-wait", "intro-lovelace"];
  const isGrown = phase === "grow" || phase === "eyes-drop" || introPhases.includes(phase);
  const showEyes = phase === "eyes-drop" || introPhases.includes(phase);
  const showIntro = introPhases.includes(phase);
  const showLovelace = phase === "intro-lovelace";

  return (
    <div className="flex min-h-screen items-start justify-center bg-background overflow-hidden pt-[35vh]">
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
          {logoOffset && isRevealed && (
            <motion.div
              className="absolute"
              style={{ transformOrigin: "center center" }}
              initial={{
                x: logoOffset.x,
                y: logoOffset.y,
                rotate: -90,
                scale: logoOffset.scale,
              }}
              animate={{
                x: isGrown ? 0 : logoOffset.x,
                y: isGrown ? 0 : logoOffset.y,
                rotate: isGrown ? 0 : -90,
                scale: isGrown ? 1 : logoOffset.scale,
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
                showCovers={isGrown}
                dropIn={showEyes}
              />
            </motion.div>
          )}
        </div>

        {showIntro && (
          <div className="flex flex-col items-center mt-6">
            <p className="text-sm md:text-base font-medium tracking-wide text-muted-foreground flex items-center">
              <TypewriterText
                text="Introducing the first PrimaryOS product"
                speed={35}
                showCursor={!showLovelace}
                onComplete={() => setPhase("intro-lovelace-wait")}
              />
            </p>

            {showLovelace && (
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mt-6">
                <TypewriterText
                  text="Lovelace"
                  speed={80}
                  showCursor={true}
                />
              </h1>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
