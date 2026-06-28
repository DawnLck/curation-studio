import React, { useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export const AudioNarration = ({ audioSrc, theme }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const isMeme = theme === "viral-meme";
  const cardClass = isMeme 
    ? "flex items-center justify-between p-5 bg-white border-4 border-charcoal rounded-none shadow-[6px_6px_0px_0px_rgba(45,45,45,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(45,45,45,1)] transition-all duration-200 h-full"
    : "flex items-center justify-between p-5 bg-white border border-sand-300 rounded-lg shadow-xs h-full";

  return (
    <div className={cardClass}>
      <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)} />
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-sand-100 text-amber-800">
          <Volume2 size={20} />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold font-sans">Auditory Curation</span>
          <h4 className="text-sm font-medium text-charcoal font-sans mt-0.5">策展人沉浸式旁白</h4>
          <div className="flex gap-[3px] items-end h-[16px] mt-2">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: `${Math.sin(i * 0.6) * 10 + 12}px`,
                  animationDelay: `${i * 0.1}s`
                }}
                className={`w-[2px] rounded-full bg-sand-300 ${isPlaying ? 'animate-pulse bg-amber-800' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-charcoal text-white hover:bg-amber-900 transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
    </div>
  );
};
