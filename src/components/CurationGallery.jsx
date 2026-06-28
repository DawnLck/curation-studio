import React, { useState } from "react";
import { ThreeDCard } from "./ThreeDCard";
import { TypeWriter } from "./TypeWriter";
import { AudioNarration } from "./AudioNarration";
import { 
  ArrowLeft, 
  Info, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

export const CurationGallery = ({ data, onReset, loadPath, onUpdateCurationData }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [modalContent, setModalContent] = useState(null);
  const [videoFit, setVideoFit] = useState("cover");
  const [isVideoLightboxOpen, setIsVideoLightboxOpen] = useState(false);
  const [regenerating, setRegenerating] = useState({});

  // 历史版本追踪与安全兜底读取
  const history = data.history || {};
  const activeVersions = data.activeVersions || {};

  const getActiveAsset = (type, fallback) => {
    if (history[type] && history[type][activeVersions[type] !== undefined ? activeVersions[type] : 0]) {
      return history[type][activeVersions[type] !== undefined ? activeVersions[type] : 0];
    }
    return fallback;
  };

  // 获取各个单元的活跃版本数据
  const activeEditorial = getActiveAsset("editorial", data.editorial || { headline: "", body: "", voicePath: "" });
  const activeHero1 = getActiveAsset("hero_1", { imagePath: data.imagePaths ? data.imagePaths[0] : (data.imagePath || ""), prompt: data.imagePrompts ? data.imagePrompts[0] : "" });
  const activeHero2 = getActiveAsset("hero_2", { imagePath: data.imagePaths ? data.imagePaths[1] : "", prompt: data.imagePrompts ? data.imagePrompts[1] : "" });
  const activeHero3 = getActiveAsset("hero_3", { imagePath: data.imagePaths ? data.imagePaths[2] : "", prompt: data.imagePrompts ? data.imagePrompts[2] : "" });
  
  const activeSub1 = getActiveAsset("subProduct1", data.subProducts ? data.subProducts[0] : null);
  const activeSub2 = getActiveAsset("subProduct2", data.subProducts ? data.subProducts[1] : null);
  const activeEnsemble = getActiveAsset("ensemble", data.ensemble || null);
  const activeVideo = getActiveAsset("video", { videoPath: data.videoPath || "", prompt: data.videoPrompt || "" });

  // 局部重新生成处理函数
  const handleRegenerate = async (type) => {
    if (regenerating[type]) return;

    const curationId = loadPath && loadPath.includes("/generated/") 
      ? loadPath.split("/generated/")[1].split("/")[0] 
      : "minimalist-vase";

    setRegenerating(prev => ({ ...prev, [type]: true }));
    try {
      const response = await fetch("http://localhost:3001/api/curate/regenerate-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curationId, assetType: type })
      });
      if (!response.ok) throw new Error("局部重算请求失败，请检查后端状态。");
      const newData = await response.json();
      onUpdateCurationData(newData);
    } catch (err) {
      console.error(err);
      alert(`重新生成失败: ${err.message}`);
    } finally {
      setRegenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  // 版本手动切换器
  const handleSwitchVersion = (type, index) => {
    const updatedData = { ...data };
    if (!updatedData.activeVersions) {
      updatedData.activeVersions = {};
    }
    updatedData.activeVersions[type] = index;
    onUpdateCurationData(updatedData);
  };

  // 渲染局部骨架遮罩屏，避免组件闪烁与假死
  const renderRegeneratingOverlay = (type) => {
    if (!regenerating[type]) return null;
    return (
      <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center z-35 animate-fade-in">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-sand-300 border-t-amber-800 animate-spin"></div>
          <span className="text-[8px] tracking-wider text-amber-800 uppercase font-sans font-bold">正在重新渲染...</span>
        </div>
      </div>
    );
  };

  // 渲染微控制条组件
  const renderControlPanel = (type) => {
    const versions = history[type] || [];
    const activeIdx = activeVersions[type] || 0;
    const total = versions.length;
    const isRegen = regenerating[type];

    return (
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-sand-300 px-2 py-1 rounded shadow-xs z-25">
        {total > 1 && (
          <div className="flex items-center gap-1 border-r border-sand-200 pr-1.5 mr-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleSwitchVersion(type, Math.max(0, activeIdx - 1)); }}
              disabled={activeIdx === 0}
              className="p-0.5 rounded hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size={10} />
            </button>
            <span className="text-[8px] font-sans font-semibold text-gray-500 min-w-[28px] text-center select-none">
              v{activeIdx + 1}/{total}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); handleSwitchVersion(type, Math.min(total - 1, activeIdx + 1)); }}
              disabled={activeIdx === total - 1}
              className="p-0.5 rounded hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size={10} />
            </button>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleRegenerate(type); }}
          disabled={isRegen}
          className={`p-0.5 rounded hover:bg-sand-100 text-gray-600 transition-all cursor-pointer ${isRegen ? 'animate-spin text-amber-800' : ''}`}
          title="重新生成此资产"
        >
          <RotateCw size={10} />
        </button>
      </div>
    );
  };

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
          
          {/* Box 1: Hero Image (3D Card Carousel with live versions) */}
          <div className="md:col-span-2 md:row-span-2 rounded-lg border border-sand-300 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow relative">
            {renderRegeneratingOverlay(activeImageIdx === 0 ? "hero_1" : activeImageIdx === 1 ? "hero_2" : "hero_3")}
            {renderControlPanel(activeImageIdx === 0 ? "hero_1" : activeImageIdx === 1 ? "hero_2" : "hero_3")}
            <ThreeDCard>
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                <img
                  src={activeImageIdx === 0 ? activeHero1.imagePath : activeImageIdx === 1 ? activeHero2.imagePath : activeHero3.imagePath}
                  alt={data.productName}
                  className="w-full h-full object-cover select-none pointer-events-none absolute inset-0 transition-all duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-xs border border-sand-300 px-3 py-1 text-[9px] uppercase tracking-wider text-gray-600 rounded z-10 font-bold">
                  分镜 {activeImageIdx + 1} / 3 · Qwen-Image 2.0
                </div>
                {/* Switcher Tabs */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full z-10">
                  {[0, 1, 2].map((idx) => (
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const activePrompt = activeImageIdx === 0 ? activeHero1.prompt : activeImageIdx === 1 ? activeHero2.prompt : activeHero3.prompt;
                    setModalContent({ title: `分镜 ${activeImageIdx + 1} 意境图提示词 (Image Prompt)`, prompt: activePrompt || "（未提供提示词数据）" });
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
          <div className="bg-white border border-sand-300 rounded-lg p-8 md:row-span-2 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            {renderRegeneratingOverlay("editorial")}
            {renderControlPanel("editorial")}
            <div>
              <span className="text-[9px] font-sans tracking-[0.2em] text-amber-800 font-semibold uppercase">社论推荐 / Editorial</span>
              <h3 className="font-serif text-2xl font-normal text-charcoal mt-4 mb-4 leading-snug">
                {activeEditorial.headline}
              </h3>
              <div className="text-xs leading-relaxed text-gray-600">
                <TypeWriter text={activeEditorial.body} speed={45} />
              </div>
            </div>
            <div className="border-t border-sand-200 pt-4 text-[9px] text-gray-400 font-sans flex items-center justify-between">
              <span>💡 由 Qwen3.7-max 润色</span>
              <button 
                onClick={() => setModalContent({ title: "社论广告文案策划提示词", prompt: "基于主商品细节和搭配商品细节，撰写符合 wabi-sabi 美学的极简杂志广告短文。" })}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <Info size={10} />
              </button>
            </div>
          </div>

          {/* Box 3: Ambient Video (HappyHorse) */}
          <div className="bg-white border border-sand-300 rounded-lg overflow-hidden md:col-span-2 md:row-span-1 shadow-xs hover:shadow-md transition-shadow relative flex items-center justify-center">
            {renderRegeneratingOverlay("video")}
            {renderControlPanel("video")}
            <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-xs border border-sand-300 px-2 py-0.5 text-[8px] uppercase tracking-wider text-gray-600 rounded z-10 font-bold">
              HappyHorse 动态氛围 (5s)
            </div>
             <video
              src={activeVideo.videoPath}
              autoPlay
              loop
              muted
              playsInline
              key={activeVideo.videoPath} // 强制视频组件在 URL 改变时重新装载
              className={`w-full h-full transition-all duration-300 ${videoFit === "cover" ? "object-cover" : "object-contain bg-charcoal/5"}`}
            />
            {/* Control buttons group */}
            <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
              <button
                onClick={() => setVideoFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 border border-sand-300 transition-colors cursor-pointer shadow-xs"
                title={videoFit === 'cover' ? "适应视图 (Fit)" : "填满视图 (Fill)"}
              >
                {videoFit === 'cover' ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </button>
              <button
                onClick={() => setIsVideoLightboxOpen(true)}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 border border-sand-300 transition-colors cursor-pointer shadow-xs"
                title="剧院模式 (Theater Mode)"
              >
                <ZoomIn size={12} />
              </button>
              <button
                onClick={() => setModalContent({ title: "氛围动态视频生成提示词 (Video Prompt)", prompt: activeVideo.prompt || "（未提供提示词数据）" })}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 border border-sand-300 transition-colors cursor-pointer shadow-xs"
                title="查看视频提示词"
              >
                <Info size={12} />
              </button>
            </div>
          </div>

          {/* Box 4: Audio Player (CosyVoice) */}
          <div className="md:col-span-1 md:row-span-1 relative overflow-hidden">
            {renderRegeneratingOverlay("editorial")}
            <AudioNarration audioSrc={activeEditorial.voicePath || data.voicePath} key={activeEditorial.voicePath} />
          </div>

          {/* Box 5: Sub-product 1 Card */}
          {activeSub1 && (
            <div className="bg-white border border-sand-300 rounded-lg overflow-hidden md:col-span-1 md:row-span-1 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between p-4 group">
              {renderRegeneratingOverlay("subProduct1")}
              {renderControlPanel("subProduct1")}
              <div className="w-full h-[120px] rounded overflow-hidden border border-sand-200 relative">
                <img
                  src={activeSub1.imagePath}
                  alt={activeSub1.name}
                  className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => setModalContent({ title: `辅单品 [${activeSub1.name}] 生成提示词`, prompt: activeSub1.prompt || "（未提供提示词）" })}
                  className="absolute bottom-2 right-2 p-1 rounded-full bg-white/90 hover:bg-white text-gray-600 border border-sand-300 transition-colors cursor-pointer z-10"
                >
                  <Info size={10} />
                </button>
              </div>
              <div className="mt-2.5">
                <span className="text-[7px] font-sans tracking-wider text-amber-800 font-bold uppercase">搭配单品一</span>
                <h4 className="font-serif text-xs font-semibold text-charcoal truncate mt-0.5">{activeSub1.name}</h4>
                <p className="text-[9px] text-gray-500 font-sans truncate leading-relaxed mt-0.5">{activeSub1.desc}</p>
              </div>
            </div>
          )}

          {/* Box 6: Sub-product 2 Card */}
          {activeSub2 && (
            <div className="bg-white border border-sand-300 rounded-lg overflow-hidden md:col-span-1 md:row-span-1 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between p-4 group">
              {renderRegeneratingOverlay("subProduct2")}
              {renderControlPanel("subProduct2")}
              <div className="w-full h-[120px] rounded overflow-hidden border border-sand-200 relative">
                <img
                  src={activeSub2.imagePath}
                  alt={activeSub2.name}
                  className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => setModalContent({ title: `辅单品 [${activeSub2.name}] 生成提示词`, prompt: activeSub2.prompt || "（未提供提示词）" })}
                  className="absolute bottom-2 right-2 p-1 rounded-full bg-white/90 hover:bg-white text-gray-600 border border-sand-300 transition-colors cursor-pointer z-10"
                >
                  <Info size={10} />
                </button>
              </div>
              <div className="mt-2.5">
                <span className="text-[7px] font-sans tracking-wider text-amber-800 font-bold uppercase">搭配单品二</span>
                <h4 className="font-serif text-xs font-semibold text-charcoal truncate mt-0.5">{activeSub2.name}</h4>
                <p className="text-[9px] text-gray-500 font-sans truncate leading-relaxed mt-0.5">{activeSub2.desc}</p>
              </div>
            </div>
          )}

          {/* Box 7: Curation Feature Description */}
          <div className="bg-white border border-sand-300 rounded-lg p-6 md:col-span-1 md:row-span-1 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-sans tracking-wider text-amber-800 font-bold uppercase">04 · 空间陈列特征</span>
              <div className="space-y-3.5 mt-3">
                {data.features.map((feature, i) => (
                  <div key={i} className="border-l-2 border-sand-400 pl-3">
                    <h5 className="font-serif text-xs font-semibold text-charcoal">{feature.title}</h5>
                    <p className="text-[9px] text-gray-500 leading-relaxed mt-0.5">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[8px] text-gray-400 font-sans italic border-t border-sand-200 pt-2 mt-2">
              💡 基于空间色彩呼应算法陈列
            </div>
          </div>

          {/* Box 8: Ensemble Group Curation Banner */}
          {activeEnsemble && (
            <div className="bg-white border border-sand-300 rounded-lg overflow-hidden md:col-span-3 min-h-[280px] shadow-xs hover:shadow-md transition-shadow relative flex items-center justify-center group">
              {renderRegeneratingOverlay("ensemble")}
              {renderControlPanel("ensemble")}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs border border-sand-300 px-3 py-1.5 text-[8px] uppercase tracking-wider text-gray-600 rounded z-10 font-sans font-semibold">
                套系全景合影 / Ensemble Lookbook
              </div>
              <img
                src={activeEnsemble.imagePath}
                alt="Ensemble Lookbook"
                className="w-full h-full object-cover select-none pointer-events-none absolute inset-0 group-hover:scale-[1.02] transition-transform duration-700"
              />
              <button
                onClick={() => setModalContent({ title: "套系搭配大片生成提示词 (Ensemble Prompt)", prompt: activeEnsemble.prompt || "（未提供提示词）" })}
                className="absolute bottom-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-gray-600 border border-sand-300 transition-colors cursor-pointer z-10 shadow-xs"
                title="查看套系提示词"
              >
                <Info size={14} />
              </button>
            </div>
          )}

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

      {/* Video Lightbox Modal */}
      {isVideoLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6"
          onClick={() => setIsVideoLightboxOpen(false)}
        >
          <div 
            className="w-full max-w-4xl bg-charcoal/90 border border-white/10 rounded-lg overflow-hidden shadow-2xl relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setIsVideoLightboxOpen(false)}
                className="text-white/60 hover:text-white bg-black/40 hover:bg-black/60 p-2 rounded-full transition-colors cursor-pointer font-sans text-xs"
              >
                ✕ 关闭
              </button>
            </div>
            
            <div className="w-full aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideo.videoPath}
                autoPlay
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="p-4 bg-charcoal border-t border-white/10 text-left">
              <span className="text-[9px] font-sans tracking-wider text-amber-500 font-bold uppercase">HappyHorse 1.1 剧院预览</span>
              <h4 className="font-serif text-sm text-sand-100 mt-1">{data.productName} · 动态氛围大片</h4>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
