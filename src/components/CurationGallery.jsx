import React, { useState } from "react";
import { ThreeDCard } from "./ThreeDCard";
import { TypeWriter } from "./TypeWriter";
import { AudioNarration } from "./AudioNarration";
import { ArrowLeft, Info } from "lucide-react";

export const CurationGallery = ({ data, onReset }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [modalContent, setModalContent] = useState(null);

  return (
    <div className="w-full min-h-screen py-16 bg-sand-200">
      <div className="max-w-5xl mx-auto px-6 relative">
        
        {/* Floating Return Button */}
        <button
          onClick={onReset}
          className="absolute -top-4 left-6 flex items-center gap-1.5 text-xs text-gray-500 hover:text-charcoal transition-colors cursor-pointer z-20 font-sans"
        >
          <ArrowLeft size={14} /> 返回策展工坊
        </button>

        {/* Header */}
        <div className="text-center border-b border-sand-400 pb-8 mb-12 animate-fade-in pt-4">
          <span className="text-[10px] font-sans tracking-[0.3em] text-gray-500 uppercase">The Art of Curation</span>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-charcoal mt-3 mb-1">
            {data.productName}
          </h1>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]">
          
          {/* Box 1: Hero Image (3D Card Carousel) */}
          <div className="md:col-span-2 md:row-span-2 rounded-lg border border-sand-300 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow relative">
            <ThreeDCard>
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                <img
                  src={data.imagePaths ? data.imagePaths[activeImageIdx] : data.imagePath}
                  alt={data.productName}
                  className="w-full h-full object-cover select-none pointer-events-none absolute inset-0 transition-all duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-xs border border-sand-300 px-3 py-1 text-[9px] uppercase tracking-wider text-gray-600 rounded z-10">
                  分镜 {activeImageIdx + 1} / 3 · Qwen-Image 2.0
                </div>
                {/* Switcher Tabs */}
                {data.imagePaths && data.imagePaths.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full z-10">
                    {data.imagePaths.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx(idx);
                        }}
                        className={`text-[8px] font-sans font-semibold px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${activeImageIdx === idx ? 'bg-white text-charcoal' : 'text-gray-300 hover:text-white'}`}
                      >
                        分镜 {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const activePrompt = data.imagePrompts ? data.imagePrompts[activeImageIdx] : (data.imagePrompt || "（未提供提示词数据）");
                    setModalContent({ title: `分镜 ${activeImageIdx + 1} 意境图提示词 (Image Prompt)`, prompt: activePrompt });
                  }}
                  className="absolute bottom-4 right-4 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 border border-sand-300 z-10 transition-colors cursor-pointer shadow-xs"
                  title="查看生图提示词"
                >
                  <Info size={12} />
                </button>
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
            {/* Info button */}
            <button
              onClick={() => setModalContent({ title: "氛围动态视频生成提示词 (Video Prompt)", prompt: data.videoPrompt || "（未提供提示词数据）" })}
              className="absolute bottom-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 border border-sand-300 z-10 transition-colors cursor-pointer shadow-xs"
              title="查看视频提示词"
            >
              <Info size={12} />
            </button>
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

      {/* Modal Popup */}
      {modalContent && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-6"
          onClick={() => setModalContent(null)}
        >
          <div 
            className="w-full max-w-md bg-white border border-sand-300 rounded-lg p-6 shadow-md relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-base font-semibold text-charcoal border-b border-sand-200 pb-3 mb-4">
              {modalContent.title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed font-mono bg-sand-50 p-4 rounded border border-sand-300 break-words max-h-[250px] overflow-y-auto">
              {modalContent.prompt}
            </p>
            <div className="text-right mt-6">
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 rounded bg-charcoal hover:bg-amber-900 text-sand-100 text-[10px] font-sans tracking-wider uppercase cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
