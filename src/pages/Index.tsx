import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import lockupImg from "@/assets/lockup.png";
import AnimatedEyes from "@/components/AnimatedEyes";

type Phase = "lockup" | "reveal" | "grow" | "eyes-drop" | "intro";

const Index = () => {
  const [phase, setPhase] = useState<Phase>("lockup");
  const [lockupSize, setLockupSize] = useState<{ w: number; h: number } | null>(null);
  const lockupRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("reveal"), 2000),    // fade out lockup, logomark stays
      setTimeout(() => setPhase("grow"), 2800),       // logomark grows + rotates to face
      setTimeout(() => setPhase("eyes-drop"), 4200),  // eyes drop in
      setTimeout(() => setPhase("intro"), 5200),      // intro text
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Measure lockup image to position the overlay precisely
  useEffect(() => {
    const measure = () => {
      if (lockupRef.current) {
        const rect = lockupRef.current.getBoundingClientRect();
        setLockupSize({ w: rect.width, h: rect.height });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const isRevealed = phase !== "lockup";
  const isGrown = phase === "grow" || phase === "eyes-drop" || phase === "intro";
  const showEyes = phase === "eyes-drop" || phase === "intro";
  const showIntro = phase === "intro";

  // The logomark in the lockup sits on the left side, roughly:
  // - Its center is at ~12% from left, ~50% from top of the lockup
  // - Its size is roughly equal to the lockup height
  // These values position the overlay logomark to match the lockup perfectly
  const logomarkInLockup = lockupSize
    ? {
        size: lockupSize.h * 0.95,
        // Offset from center of lockup to where logomark center is
        offsetX: -(lockupSize.w / 2) + lockupSize.h * 0.52,
        offsetY: 0,
      }
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* Base lockup image - fades out during reveal */}
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
          />

          {/* Logomark overlay - positioned exactly on top of the lockup's logomark */}
          {logomarkInLockup && (
            <motion.div
              className="absolute"
              style={{ transformOrigin: "center center" }}
              initial={{
                x: logomarkInLockup.offsetX,
                y: logomarkInLockup.offsetY,
                rotate: -90,
                scale: 1,
              }}
              animate={{
                x: isGrown ? 0 : logomarkInLockup.offsetX,
                y: isGrown ? 0 : logomarkInLockup.offsetY,
                rotate: isGrown ? 0 : -90,
                scale: isGrown ? 160 / logomarkInLockup.size : 1,
              }}
              transition={{
                x: { type: "spring", damping: 22, stiffness: 80 },
                y: { type: "spring", damping: 22, stiffness: 80 },
                rotate: { type: "spring", damping: 14, stiffness: 70 },
                scale: { type: "spring", damping: 22, stiffness: 80 },
              }}
            >
              <AnimatedEyes
                size={logomarkInLockup.size}
                animate={showEyes}
                showEyes={showEyes}
                dropIn={showEyes}
              />
            </motion.div>
          )}
        </div>

        {/* Intro text */}
        {showIntro && (
          <div className="flex flex-col items-center gap-8 mt-8">
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
