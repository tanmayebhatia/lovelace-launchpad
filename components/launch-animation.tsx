"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { AnimatedEyes } from "@/components/animated-eyes";
import { TypewriterText } from "@/components/typewriter-text";

type Phase =
  | "lockup"
  | "swap"
  | "fly"
  | "eyes"
  | "intro"
  | "intro-wait"
  | "lovelace";

export function LaunchAnimation() {
  const [phase, setPhase] = useState<Phase>("lockup");
  const [startTransform, setStartTransform] = useState<{
    x: number; y: number; scale: number;
  } | null>(null);

  const lockupRef   = useRef<HTMLImageElement>(null);
  const flyControls = useAnimation();
  const firedRef    = useRef(false);

  // The final rendered size of the logomark (px). We resolve this from CSS at runtime.
  const [logoSizePx, setLogoSizePx] = useState(200);
  const logoWrapRef = useRef<HTMLDivElement>(null);

  // Measure the lockup image and locate the icon within it via pixel scan
  const measure = useCallback(() => {
    const imgEl = lockupRef.current;
    if (!imgEl || !imgEl.complete || imgEl.naturalWidth === 0) return;

    const rW = imgEl.offsetWidth;
    const rH = imgEl.offsetHeight;
    if (!rW || !rH) return;

    // Resolve logo target size from the wrapper div
    if (logoWrapRef.current) {
      const s = logoWrapRef.current.offsetWidth;
      if (s > 0) setLogoSizePx(s);
    }

    const canvas = document.createElement("canvas");
    canvas.width  = rW;
    canvas.height = rH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgEl, 0, 0, rW, rH);

    // Scan leftmost 28% for the icon
    const scanRight = Math.floor(rW * 0.28);
    let data: ImageData;
    try { data = ctx.getImageData(0, 0, scanRight, rH); }
    catch { return; }

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let y = 0; y < rH; y++) {
      for (let x = 0; x < scanRight; x++) {
        const i = (y * scanRight + x) * 4;
        if (data.data[i] < 60 && data.data[i+1] < 60 && data.data[i+2] < 60 && data.data[i+3] > 180) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x0 === Infinity) return;

    const iconCX   = (x0 + x1) / 2;
    const iconCY   = (y0 + y1) / 2;
    const iconSize = Math.max(x1 - x0, y1 - y0);

    // The lockup image is centered in the viewport.
    // Icon center relative to viewport center:
    const lockupLeft = imgEl.getBoundingClientRect().left;
    const lockupTop  = imgEl.getBoundingClientRect().top;
    const vpCX = window.innerWidth  / 2;
    const vpCY = window.innerHeight / 2;

    const absIconCX = lockupLeft + iconCX;
    const absIconCY = lockupTop  + iconCY;

    const targetSize = logoWrapRef.current?.offsetWidth ?? 200;

    setStartTransform({
      x:     absIconCX - vpCX,
      y:     absIconCY - vpCY,
      scale: iconSize / targetSize,
    });
  }, []);

  useEffect(() => {
    const img = lockupRef.current;
    if (!img) return;
    if (img.complete) measure();
    img.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    return () => {
      img.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

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

  // Fly animation: spring from icon position to center
  useEffect(() => {
    if (phase !== "fly" || !startTransform) return;
    firedRef.current = false;
    flyControls.start({
      x:      0,
      y:      0,
      rotate: 0,
      scale:  1,
      transition: {
        x:      { type: "spring", damping: 24, stiffness: 85 },
        y:      { type: "spring", damping: 24, stiffness: 85 },
        rotate: { type: "spring", damping: 16, stiffness: 55 },
        scale:  { type: "spring", damping: 22, stiffness: 80 },
      },
    }).then(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        setPhase("eyes");
        setTimeout(() => setPhase("intro"), 800);
      }
    });
  }, [phase, flyControls, startTransform]);

  const isAfterLockup  = phase !== "lockup";
  const showEyes       = ["eyes", "intro", "intro-wait", "lovelace"].includes(phase);
  const showIntro      = ["intro", "intro-wait", "lovelace"].includes(phase);
  const showLovelace   = phase === "lovelace";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background overflow-hidden">

      {/* Lockup image */}
      <AnimatePresence>
        {(phase === "lockup" || phase === "swap") && (
          <motion.img
            ref={lockupRef}
            key="lockup"
            src="/lockup.png"
            alt="Primary"
            className="select-none pointer-events-none"
            style={{ height: "clamp(48px, 7vw, 88px)", width: "auto", maxWidth: "80vw" }}
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "swap" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            draggable={false}
            crossOrigin="anonymous"
          />
        )}
      </AnimatePresence>

      {/* Invisible sizing reference — used to compute logo target size before it appears */}
      <div
        ref={logoWrapRef}
        className="fixed pointer-events-none opacity-0"
        style={{ width: "clamp(140px, 18vw, 240px)", height: "clamp(140px, 18vw, 240px)" }}
        aria-hidden
      />

      {/* Logomark */}
      {isAfterLockup && startTransform && (
        <motion.div
          className="fixed"
          style={{
            width:  "clamp(140px, 18vw, 240px)",
            height: "clamp(140px, 18vw, 240px)",
            left: "50%",
            top:  "50%",
            marginLeft: "-clamp(70px, 9vw, 120px)",
            marginTop:  "-clamp(70px, 9vw, 120px)",
          }}
          initial={{
            x:      startTransform.x,
            y:      startTransform.y,
            rotate: -90,
            scale:  startTransform.scale,
          }}
          animate={flyControls}
        >
          <AnimatedEyes showEyes={showEyes} />
        </motion.div>
      )}

      {/* Text */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="text"
            className="fixed bottom-[28%] left-0 right-0 flex flex-col items-center px-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
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
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mt-6 text-balance">
                <TypewriterText text="Lovelace" speed={80} showCursor />
              </h1>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
