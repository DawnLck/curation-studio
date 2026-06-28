import React from "react";
import { ThreeDCard } from "./ThreeDCard";
import { TypeWriter } from "./TypeWriter";
import { AudioNarration } from "./AudioNarration";

export const CurationGallery = ({ data, onReset }) => {
  return (
    <div className="w-full min-h-screen py-16 bg-sand-200">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center border-b border-sand-400 pb-8 mb-12 animate-fade-in">
          <span className="text-[10px] font-sans tracking-[0.3em] text-gray-500 uppercase">The Art of Curation</span>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-charcoal mt-3 mb-1">
            {data.productName}
          </h1>
          <p className="text-sm font-sans italic text-gray-600">{data.subtitle}</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]">
          
          {/* Box 1: Hero Image (3D Card) */}
          <div className="md:col-span-2 md:row-span-2 rounded-lg border border-sand-300 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow relative">
            <ThreeDCard>
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                <img
                  src={data.imagePath}
                  alt={data.productName}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-xs border border-sand-300 px-3 py-1 text-[9px] uppercase tracking-wider text-gray-600 rounded">
                  Qwen-Image 2.0 意境渲染
                </div>
              </div>
            </ThreeDCard>
          </div>

          {/* Box 2: Editorial Text */}
          <div className="bg-white border border-sand-300 rounded-lg p-8 md:row-span-2 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
            <div>
              <span className="text-[9px] font-sans tracking-[0.2em] text-amber-800 font-semibold uppercase">社论推荐 / Editorial</span>
              <h3 className="font-serif text-2xl font-normal text-charcoal mt-4 mb-4 leading-snug">
                {data.editorial?.headline || data.editorial?.Headline || data.editorial?.title || "静默新品"}
              </h3>
              <div className="text-xs leading-relaxed text-gray-600">
                <TypeWriter text={data.editorial?.body || data.editorial?.Body || data.editorial?.content || ""} speed={40} />
              </div>
            </div>
            <div className="border-t border-sand-200 pt-4 text-[9px] text-gray-400 font-sans">
              💡 由 Qwen3.7-max 润色呈现
            </div>
          </div>

          {/* Box 3: Ambient Video (HappyHorse) */}
          <div className="bg-white border border-sand-300 rounded-lg overflow-hidden md:col-span-2 md:row-span-1 shadow-xs hover:shadow-md transition-shadow relative flex items-center justify-center">
            <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-xs border border-sand-300 px-2 py-0.5 text-[8px] uppercase tracking-wider text-gray-600 rounded z-10">
              HappyHorse 动态氛围 (5s)
            </div>
            <video
              src={data.videoPath}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Box 4: Audio Player (CosyVoice) */}
          <div className="md:col-span-1 md:row-span-1">
            <AudioNarration audioSrc={data.voicePath} />
          </div>

          {/* Box 5: Features Detail */}
          <div className="md:col-span-3 bg-white border border-sand-300 rounded-lg p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row gap-8 justify-around items-start">
            {data.features.map((feature, i) => (
              <div key={i} className="flex-1">
                <span className="text-[10px] font-sans tracking-wider text-amber-800 font-semibold uppercase">0{i+1} · 特征</span>
                <h4 className="font-serif text-lg font-medium text-charcoal mt-2 mb-1">{feature.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Reset button */}
        <div className="text-center mt-12">
          <button
            onClick={onReset}
            className="px-6 py-2.5 rounded bg-charcoal text-sand-100 hover:bg-amber-900 transition-colors text-xs font-sans tracking-widest uppercase cursor-pointer"
          >
            重新策展产品
          </button>
        </div>

      </div>
    </div>
  );
};
