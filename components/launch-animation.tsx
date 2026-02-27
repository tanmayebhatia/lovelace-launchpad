"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { AnimatedEyes } from "@/components/animated-eyes";
import { TypewriterText } from "@/components/typewriter-text";

type Phase =
  | "lockup"      // Show lockup image only, no overlay
  | "swap"        // Lockup fades out, logomark crossfades in at matching position/rotation
  | "fly"         // Logomark flies to center and rotates upright
  | "eyes"        // Eyes appear
  | "intro"       // Typewriter line 1
  | "intro-wait"  // Pause
  | "lovelace";   // Typewriter line 2

export function LaunchAnimation() {
  const [phase, setPhase] = useState<Phase>("lockup");
  // Measurements of the lockup image as rendered on screen
  const [lockupRect, setLockupRect] = useState<{
    imgW: number; imgH: number;        // rendered lockup size
    iconCX: number; iconCY: number;    // icon center relative to lockup center
    iconSize: number;                  // icon square side length
  } | null>(null);

  const lockupRef = useRef<HTMLImageElement>(null);
  const flyControls = useAnimation();
  const hasFiredFlyRef = useRef(false);

  // Measure lockup image and compute icon position via pixel scan
  const measureLockup = useCallback(() => {
    const imgEl = lockupRef.current;
    if (!imgEl || !imgEl.complete || imgEl.naturalWidth === 0) return;

    const renderedW = imgEl.offsetWidth;
    const renderedH = imgEl.offsetHeight;
    if (!renderedW || !renderedH) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scan at the rendered size for accuracy
    canvas.width = renderedW;
    canvas.height = renderedH;
    ctx.drawImage(imgEl, 0, 0, renderedW, renderedH);

    // Scan only the leftmost 25% (where the icon lives)
    const scanRight = Math.floor(renderedW * 0.25);
    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, scanRight, renderedH);
    } catch {
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const i = (y * imageData.width + x) * 4;
        if (
          imageData.data[i] < 60 &&
          imageData.data[i + 1] < 60 &&
          imageData.data[i + 2] < 60 &&
          imageData.data[i + 3] > 180
        ) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (minX === Infinity) return;

    const iconCX = (minX + maxX) / 2 - renderedW / 2;
    const iconCY = (minY + maxY) / 2 - renderedH / 2;
    const iconSize = Math.max(maxX - minX, maxY - minY);

    setLockupRect({ imgW: renderedW, imgH: renderedH, iconCX, iconCY, iconSize });
  }, []);

  // Run measure after image loads and on resize
  useEffect(() => {
    const img = lockupRef.current;
    if (!img) return;
    if (img.complete) measureLockup();
    img.addEventListener("load", measureLockup);
    window.addEventListener("resize", measureLockup);
    return () => {
      img.removeEventListener("load", measureLockup);
      window.removeEventListener("resize", measureLockup);
    };
  }, [measureLockup]);

  // Phase timeline
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("swap"), 1800);
    const t2 = setTimeout(() => setPhase("fly"),  2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase === "intro-wait") {
      const t = setTimeout(() => setPhase("lovelace"), 1600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // When fly phase starts, animate the logomark to center
  useEffect(() => {
    if (phase === "fly" && lockupRect) {
      hasFiredFlyRef.current = false;
      flyControls.start({
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        transition: {
          x:      { type: "spring", damping: 22, stiffness: 80, duration: 0.9 },
          y:      { type: "spring", damping: 22, stiffness: 80, duration: 0.9 },
          rotate: { type: "spring", damping: 14, stiffness: 60, duration: 1.1 },
          scale:  { type: "spring", damping: 20, stiffness: 75, duration: 1.0 },
        },
      }).then(() => {
        if (!hasFiredFlyRef.current) {
          hasFiredFlyRef.current = true;
          setPhase("eyes");
          setTimeout(() => setPhase("intro"), 900);
        }
      });
    }
  }, [phase, flyControls, lockupRect]);

  const showLogomark  = phase !== "lockup";
  const showEyes      = phase === "eyes" || phase === "intro" || phase === "intro-wait" || phase === "lovelace";
  const showIntro     = phase === "intro" || phase === "intro-wait" || phase === "lovelace";
  const showLovelace  = phase === "lovelace";
  const logoSize      = 160;

  // Starting transform for the logomark (matches the icon in the lockup)
  const startX    = lockupRect ? lockupRect.iconCX : 0;
  const startY    = lockupRect ? lockupRect.iconCY : 0;
  const startScale = lockupRect ? lockupRect.iconSize / logoSize : 1;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <div className="relative flex flex-col items-center justify-center">

        {/* Lockup image — shown in "lockup" phase, fades out in "swap" */}
        <AnimatePresence>
          {(phase === "lockup" || phase === "swap") && (
            <motion.img
              ref={lockupRef}
              key="lockup"
              src="/lockup.png"
              alt="Primary"
              className="select-none pointer-events-none"
              style={{ height: "clamp(60px, 8vw, 100px)", width: "auto" }}
              initial={{ opacity: 1 }}
              animate={{ opacity: phase === "swap" ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              draggable={false}
              crossOrigin="anonymous"
            />
          )}
        </AnimatePresence>

        {/* Logomark — crossfades in during "swap", then flies to center */}
        {showLogomark && lockupRect && (
          <motion.div
            className="absolute"
            style={{ width: logoSize, height: logoSize }}
            initial={{
              x: startX,
              y: startY,
              rotate: -90,
              scale: startScale,
            }}
            animate={flyControls}
          >
            <AnimatedEyes size={logoSize} showEyes={showEyes} />
          </motion.div>
        )}

        {/* Typewriter text */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro-text"
              className="absolute flex flex-col items-center"
              style={{ top: "calc(50% + 110px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm md:text-base font-medium tracking-wide text-muted-foreground whitespace-nowrap">
                <TypewriterText
                  text="Introducing the first PrimaryOS product"
                  speed={35}
                  showCursor={!showLovelace}
                  onComplete={() => setPhase("intro-wait")}
                />
              </p>

              {showLovelace && (
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mt-6">
                  <TypewriterText text="Lovelace" speed={80} showCursor />
                </h1>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
