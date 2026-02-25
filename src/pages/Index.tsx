import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import lockupImg from "@/assets/lockup.png";
import AnimatedEyes from "@/components/AnimatedEyes";

type Phase = "lockup" | "transform" | "logo" | "intro";

const Index = () => {
  const [phase, setPhase] = useState<Phase>("lockup");

  useEffect(() => {
    // Phase 1: Show lockup for 2s
    const t1 = setTimeout(() => setPhase("transform"), 2000);
    // Phase 2: Transform for 1.5s
    const t2 = setTimeout(() => setPhase("logo"), 3500);
    // Phase 3: Show logo, then intro text
    const t3 = setTimeout(() => setPhase("intro"), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <div className="relative flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Phase 1: Full lockup logo */}
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

          {/* Phase 2: Logo icon rotating/transforming */}
          {phase === "transform" && (
            <motion.div
              key="transform"
              initial={{ opacity: 0, rotate: 0, scale: 1 }}
              animate={{ opacity: 1, rotate: 360, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center"
            >
              <AnimatedEyes size={160} />
            </motion.div>
          )}

          {/* Phase 3: Logo settled */}
          {phase === "logo" && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <AnimatedEyes size={160} />
            </motion.div>
          )}

          {/* Phase 4: Intro with logo + text */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center gap-8"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0, duration: 0.6 }}
              >
                <AnimatedEyes size={120} />
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground"
              >
                Introducing the first PrimaryOS product
              </motion.p>

              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
                className="text-6xl md:text-8xl font-black tracking-tight text-foreground"
              >
                Lovelace
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="text-xl md:text-2xl font-medium text-muted-foreground"
              >
                Sourcing at scale.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
