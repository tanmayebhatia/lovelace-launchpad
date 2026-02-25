import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import lockupImg from "@/assets/lockup.png";
import AnimatedEyes from "@/components/AnimatedEyes";

type Phase = "lockup" | "transition" | "fall" | "eyes-drop" | "intro";

const Index = () => {
  const [phase, setPhase] = useState<Phase>("lockup");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("transition"), 2000),
      setTimeout(() => setPhase("fall"), 3200),
      setTimeout(() => setPhase("eyes-drop"), 4500),
      setTimeout(() => setPhase("intro"), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const isTransitioning = phase !== "lockup";
  const isFallen = phase === "fall" || phase === "eyes-drop" || phase === "intro";
  const showEyes = phase === "eyes-drop" || phase === "intro";
  const showIntro = phase === "intro";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <div className="relative flex flex-col items-center">
        {/* Container for the logo transition area */}
        <div className="relative flex items-center justify-center" style={{ minHeight: 200 }}>
          {/* Full lockup - always rendered, fades out */}
          <motion.img
            src={lockupImg}
            alt="Primary"
            className="h-20 md:h-28"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: isTransitioning ? 0 : 1,
              scale: isTransitioning ? 0.9 : 1,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: "absolute",
              pointerEvents: isTransitioning ? "none" : "auto",
            }}
          />

          {/* Logomark - crossfades in at lockup's logomark position, then moves to center and grows */}
          <motion.div
            className="flex flex-col items-center"
            initial={false}
            animate={{
              // During lockup: positioned where the logomark sits in the lockup (left side, small, rotated)
              // During transition: moves to center and scales up
              // During fall: rotates to upright
              x: isTransitioning ? 0 : -85,
              scale: isTransitioning ? 1 : 0.42,
              opacity: isTransitioning ? 1 : 0,
              rotate: isFallen ? 0 : -90,
            }}
            transition={{
              x: { type: "spring", damping: 25, stiffness: 100, duration: 0.8 },
              scale: { type: "spring", damping: 25, stiffness: 100, duration: 0.8 },
              opacity: { duration: 0.3 },
              rotate: isFallen
                ? { type: "spring", damping: 14, stiffness: 80 }
                : { duration: 0.01 },
            }}
            style={{ transformOrigin: "center center" }}
          >
            <AnimatedEyes
              size={160}
              animate={showEyes}
              showEyes={showEyes}
              dropIn={showEyes}
            />
          </motion.div>
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
