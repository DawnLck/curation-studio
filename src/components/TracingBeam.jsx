import React, { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export const TracingBeam = ({ children }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={ref} className="relative w-full max-w-5xl mx-auto px-4 md:px-10">
      <div className="absolute -left-2 md:-left-6 top-0 h-full w-[2px] bg-sand-300">
        <motion.div
          style={{ scaleY, transformOrigin: "top" }}
          className="absolute top-0 left-0 w-full h-full bg-amber-800"
        />
      </div>
      {children}
    </div>
  );
};
