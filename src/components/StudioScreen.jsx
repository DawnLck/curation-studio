import React, { useState } from "react";
import { Sparkles, Upload, FileText } from "lucide-react";

export const StudioScreen = ({ onGenerate }) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      onGenerate();
    }, 2000); // 模拟 2s 资产加载与分类时间
  };

  return (
    <div className="w-full min-h-screen bg-sand-200 flex flex-col justify-center items-center py-12 px-6 grid-bg">
      <div className="w-full max-w-xl bg-white border border-sand-300 rounded-lg p-10 shadow-xs hover:shadow-md transition-shadow animate-fade-in">
        
        <div className="text-center mb-8">
          <span className="text-[10px] font-sans tracking-[0.3em] text-gray-500 uppercase">AI-Driven Curation</span>
          <h1 className="font-serif text-3xl font-light text-charcoal mt-3 mb-1">Curation Studio.</h1>
          <p className="text-xs text-gray-500 font-sans">输入任意单品，自动生成极简杂志质感电商策展页</p>
        </div>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-sand-300"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-amber-800 animate-spin"></div>
            </div>
            <h3 className="font-serif text-lg text-charcoal mt-8 mb-2">百炼多模态资产生成中...</h3>
            <p className="text-xs text-gray-400 font-sans">正在加载 Qwen-Image / HappyHorse / CosyVoice 预制件</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Product Image Input */}
            <div className="space-y-2">
              <label className="text-[10px] tracking-wider font-semibold text-charcoal uppercase block">Step 1: 上传产品参考图/线稿</label>
              <div className="relative border-2 border-dashed border-sand-300 hover:border-amber-800 rounded-lg h-[150px] flex flex-col items-center justify-center bg-sand-50 transition-colors group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-contain p-4 z-10" />
                ) : (
                  <div className="text-center space-y-2 pointer-events-none">
                    <Upload size={24} className="mx-auto text-gray-400 group-hover:text-amber-800 transition-colors" />
                    <span className="text-xs text-gray-500 font-sans">拖拽或点击上传单品图片</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Text Description */}
            <div className="space-y-2">
              <label className="text-[10px] tracking-wider font-semibold text-charcoal uppercase block">Step 2: 补充描述 (Qwen-VL 图文理解)</label>
              <textarea
                required
                rows="3"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例如：一款具有东方禅意的艺术粗陶花瓶，质地粗砺，黄昏光影..."
                className="w-full rounded border border-sand-300 p-4 bg-sand-50 font-sans text-xs focus:outline-none focus:border-amber-800 text-charcoal resize-none"
              />
            </div>

            {/* Style selector (Static Minimum Curation) */}
            <div className="space-y-2">
              <label className="text-[10px] tracking-wider font-semibold text-charcoal uppercase block">Step 3: 匹配美学系统</label>
              <div className="flex items-center gap-3 p-4 bg-sand-50 border border-sand-300 rounded">
                <FileText size={16} className="text-amber-800" />
                <div>
                  <h4 className="text-xs font-semibold text-charcoal">静默极简 (Quiet Minimalist)</h4>
                  <p className="text-[10px] text-gray-500">已自动适配：白沙色调、Playfair Display 衬线体、留白排版</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-charcoal hover:bg-amber-900 transition-colors text-white py-3 rounded text-xs font-sans tracking-widest uppercase font-semibold cursor-pointer"
            >
              <Sparkles size={14} /> 开始智能生成
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
