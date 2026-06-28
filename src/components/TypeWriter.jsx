import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const TypeWriter = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed]);

  const handleSkip = () => {
    setDisplayedText(text);
    setIndex(text.length);
    if (onComplete) onComplete();
  };

  return (
    <div className="relative cursor-pointer select-none font-sans text-xs leading-relaxed text-gray-600" onClick={handleSkip}>
      <span>{displayedText}</span>
      {index < text.length && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-1.5 h-4 ml-1 bg-amber-800 align-middle"
        />
      )}
    </div>
  );
};
