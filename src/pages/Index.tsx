import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import lockupImg from "@/assets/lockup.png";
import logomarkImg from "@/assets/logomark.png";
import AnimatedEyes from "@/components/AnimatedEyes";

type Phase = "lockup" | "zoom" | "fall" | "eyes-drop" | "intro";

const Index = () => {
  const [phase, setPhase] = useState<Phase>("lockup");

  useEffect(() => {
    // lockup visible for 2s, then logomark zooms to center
    const t1 = setTimeout(() => setPhase("zoom"), 2000);
    // after zoom settles, tip it over
    const t2 = setTimeout(() => setPhase("fall"), 3200);
    // eyes drop in
    const t3 = setTimeout(() => setPhase("eyes-drop"), 4700);
    // intro text
    const t4 = setTimeout(() => setPhase("intro"), 5700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const showLogomark = phase !== "lockup";
  const isFallen = phase === "fall" || phase === "eyes-drop" || phase === "intro";
  const showEyes = phase === "eyes-drop" || phase === "intro";
  const showIntro = phase === "intro";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <div className="relative flex flex-col items-center justify-center">
        {/* Phase 1: Full lockup */}
        <AnimatePresence>
          {phase === "lockup" && (
            <motion.div
              key="lockup"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <img src={lockupImg} alt="Primary" className="h-20 md:h-28" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phases 2-5: Logomark zooms from left position to center, then tips over */}
        {showLogomark && (
          <div className="flex flex-col items-center gap-8">
            <motion.div
              // Start offset to the left (where it was in the lockup) and small,
              // then animate to center and full size, then rotate to fall
              initial={{ x: -80, scale: 0.5, opacity: 0, rotate: 0 }}
              animate={{
                x: 0,
                scale: 1,
                opacity: 1,
                rotate: isFallen ? 90 : 0,
              }}
              transition={{
                x: { type: "spring", damping: 20, stiffness: 120 },
                scale: { type: "spring", damping: 20, stiffness: 120 },
                opacity: { duration: 0.3 },
                rotate: isFallen
                  ? { type: "spring", damping: 12, stiffness: 100, delay: 0 }
                  : { duration: 0 },
              }}
              className="flex items-center justify-center"
              style={{ transformOrigin: "center center" }}
            >
              {showEyes ? (
                <AnimatedEyes
                  size={160}
                  animate={true}
                  showEyes={true}
                  dropIn={true}
                />
              ) : (
                <img
                  src={logomarkImg}
                  alt="Primary logomark"
                  className="object-contain"
                  style={{ width: 160, height: 160 }}
                />
              )}
            </motion.div>

            {/* Intro text */}
            {showIntro && (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
