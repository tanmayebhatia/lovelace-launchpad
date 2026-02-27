"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedEyes } from "@/components/animated-eyes";
import { TypewriterText } from "@/components/typewriter-text";

type Phase =
  | "lockup"       // Show lockup image only; logomark overlaid at -90deg, no eyes
  | "fade"         // Lockup fades out, logomark starts rotating upright
  | "rotate"       // Logomark rotating and growing to center
  | "eyes"         // Rotation done, eyes appear
  | "intro"        // Typewriter: "Introducing..."
  | "intro-wait"   // Pause between lines
  | "lovelace";    // Typewriter: "Lovelace"

const LOGO_SIZE = 160;

export function LaunchAnimation() {
  const [phase, setPhase] = useState<Phase>("lockup");
  // Overlay position: where the logomark div should sit so it perfectly covers the lockup icon
  const [overlay, setOverlay] = useState<{ x: number; y: number; scale: number } | null>(null);
  const [lockupHeight, setLockupHeight] = useState(80);
  const rotationDoneRef = useRef(false);

  // Responsive lockup height
  useEffect(() => {
    const update = () => setLockupHeight(window.innerWidth >= 768 ? 112 : 80);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Compute the overlay position by scanning pixel data of both images
  useEffect(() => {
    let lockupResult: { cx: number; cy: number; bw: number; bh: number } | null = null;
    let logomarkResult: { cx: number; cy: number; bw: number; bh: number } | null = null;
    let lockupNatW = 0, lockupNatH = 0, logomarkNatW = 0, logomarkNatH = 0;

    const scanBounds = (img: HTMLImageElement, scanRegion?: { left: number; right: number }) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const left = scanRegion?.left ?? 0;
      const right = scanRegion?.right ?? img.width;
      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(left, 0, right - left, img.height);
      } catch {
        return null;
      }
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * imageData.width + x) * 4;
          if (
            imageData.data[i] < 50 &&
            imageData.data[i + 1] < 50 &&
            imageData.data[i + 2] < 50 &&
            imageData.data[i + 3] > 200
          ) {
            const absX = x + left;
            if (absX < minX) minX = absX;
            if (absX > maxX) maxX = absX;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (minX === Infinity) return null;
      return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, bw: maxX - minX, bh: maxY - minY };
    };

    const tryCompute = () => {
      if (!lockupResult || !logomarkResult) return;

      // Rendered lockup dimensions (height fixed, width proportional)
      const lockupAspect = lockupNatW / lockupNatH;
      const renderedLockupW = lockupHeight * lockupAspect;
      const scaleR = renderedLockupW / lockupNatW;

      // Lockup icon center relative to the lockup div center
      const lockupIconCX = (lockupResult.cx - lockupNatW / 2) * scaleR;
      const lockupIconCY = (lockupResult.cy - lockupNatH / 2) * scaleR;
      const lockupIconW = lockupResult.bw * scaleR;

      // How logomark renders inside LOGO_SIZE div via object-contain
      const mAspect = logomarkNatW / logomarkNatH;
      let mRenderW: number, mRenderH: number;
      if (mAspect >= 1) {
        mRenderW = LOGO_SIZE;
        mRenderH = LOGO_SIZE / mAspect;
      } else {
        mRenderH = LOGO_SIZE;
        mRenderW = LOGO_SIZE * mAspect;
      }
      const mOffX = (LOGO_SIZE - mRenderW) / 2;
      const mOffY = (LOGO_SIZE - mRenderH) / 2;

      // Logomark content bounds in the LOGO_SIZE div coordinate space
      const logoContentW = (logomarkResult.bw / logomarkNatW) * mRenderW;
      const logoCenterInDivX = mOffX + (logomarkResult.cx / logomarkNatW) * mRenderW;
      const logoCenterInDivY = mOffY + (logomarkResult.cy / logomarkNatH) * mRenderH;

      // Scale so content width matches lockup icon width
      const scale = lockupIconW / logoContentW;

      // Offset from div center to content center (scaled)
      const divCenterX = logoCenterInDivX - LOGO_SIZE / 2;
      const divCenterY = logoCenterInDivY - LOGO_SIZE / 2;

      const x = lockupIconCX - divCenterX * scale;
      const y = lockupIconCY - divCenterY * scale;

      setOverlay({ x, y, scale });
    };

    const img1 = new Image();
    img1.crossOrigin = "anonymous";
    img1.onload = () => {
      lockupNatW = img1.width;
      lockupNatH = img1.height;
      // Only scan the leftmost ~20% of the lockup (where the icon lives)
      lockupResult = scanBounds(img1, { left: 0, right: Math.floor(img1.width * 0.22) });
      tryCompute();
    };
    img1.src = "/lockup.png";

    const img2 = new Image();
    img2.crossOrigin = "anonymous";
    img2.onload = () => {
      logomarkNatW = img2.width;
      logomarkNatH = img2.height;
      logomarkResult = scanBounds(img2);
      tryCompute();
    };
    img2.src = "/logomark.png";
  }, [lockupHeight]);

  // Phase timeline
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("fade"),   1800), // start fading lockup
      setTimeout(() => setPhase("rotate"), 2400), // start rotation
      // "eyes" phase is triggered by onRotationComplete via rotationDoneRef
      setTimeout(() => setPhase("intro"),  5800), // show typewriter text
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "intro-wait") {
      const t = setTimeout(() => setPhase("lovelace"), 1800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleIntroComplete = useCallback(() => {
    setPhase("intro-wait");
  }, []);

  const handleRotationComplete = useCallback(() => {
    // Only fire once, and only during rotate phase (framer fires onAnimationComplete on every re-render)
    if (!rotationDoneRef.current && phase === "rotate") {
      rotationDoneRef.current = true;
      setPhase("eyes");
    }
  }, [phase]);

  const isLockupVisible = phase === "lockup" || phase === "fade";
  const isGrown = phase !== "lockup" && phase !== "fade";
  // We only show eyes AFTER rotation
  const showEyes = phase === "eyes" || phase === "intro" || phase === "intro-wait" || phase === "lovelace";
  const showIntro = phase === "intro" || phase === "intro-wait" || phase === "lovelace";
  const showLovelace = phase === "lovelace";

  return (
    <div className="flex min-h-screen items-start justify-center bg-background overflow-hidden pt-[35vh]">
      <div className="relative flex flex-col items-center">
        {/* Container that holds both the lockup and the logomark overlay */}
        <div
          className="relative flex items-center justify-center"
          style={{ height: LOGO_SIZE, width: "100%" }}
        >
          {/* Lockup image — fades out during "fade" phase */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lockup.png"
            alt="Primary"
            style={{
              height: lockupHeight,
              width: "auto",
              opacity: isLockupVisible ? 1 : 0,
              transition: phase === "fade" ? "opacity 0.6s ease-out" : "none",
              // Keep in flow while visible, collapse to absolute once gone so it doesn't push content
              position: "relative",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />

          {/* Logomark — absolutely centered, animates from overlay position to center */}
          {overlay && (
            <motion.div
              className="absolute"
              style={{ width: LOGO_SIZE, height: LOGO_SIZE, transformOrigin: "center center" }}
              initial={{
                x: overlay.x,
                y: overlay.y,
                rotate: -90,
                scale: overlay.scale,
              }}
              animate={
                isGrown
                  ? { x: 0, y: 0, rotate: 0, scale: 1 }
                  : { x: overlay.x, y: overlay.y, rotate: -90, scale: overlay.scale }
              }
              transition={{
                x:      { type: "spring", damping: 24, stiffness: 90 },
                y:      { type: "spring", damping: 24, stiffness: 90 },
                rotate: { type: "spring", damping: 16, stiffness: 75 },
                scale:  { type: "spring", damping: 20, stiffness: 85 },
              }}
              onAnimationComplete={handleRotationComplete}
            >
              <AnimatedEyes
                size={LOGO_SIZE}
                showEyes={showEyes}
                dropIn={showEyes}
              />
            </motion.div>
          )}
        </div>

        {/* Typewriter text below */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              className="flex flex-col items-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm md:text-base font-medium tracking-wide text-muted-foreground">
                <TypewriterText
                  text="Introducing the first PrimaryOS product"
                  speed={35}
                  showCursor={!showLovelace}
                  onComplete={handleIntroComplete}
                />
              </p>

              {showLovelace && (
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mt-6">
                  <TypewriterText
                    text="Lovelace"
                    speed={80}
                    showCursor
                  />
                </h1>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
