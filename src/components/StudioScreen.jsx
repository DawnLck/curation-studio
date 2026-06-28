import React, { useState } from "react";
import { Sparkles, Upload, FileText, Cpu, Eye } from "lucide-react";

export const StudioScreen = ({ onGenerate }) => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [curationMode, setCurationMode] = useState("demo"); // "demo" | "real"
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLog, setProgressLog] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    if (curationMode === "demo") {
      // Demo 模式：直接模拟 2s 并返回预烘焙数据
      setCurrentStep(1);
      setProgressLog("正在加载预烘焙极简花瓶资产...");
      setTimeout(() => {
        setIsGenerating(false);
        onGenerate("demo", null);
      }, 2000);
    } else {
      // Real 模式：真实发起上传并建立 SSE 通道
      try {
        const formData = new FormData();
        formData.append("description", text);
        if (imageFile) {
          formData.append("image", imageFile);
        }

        setProgressLog("已提交生成请求，正在初始化百炼生产管道...");
        const res = await fetch("http://localhost:3001/api/curate", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Curation request failed");
        const data = await res.json();
        const curationId = data.id;

        // 开启 SSE 监听进度
        const eventSource = new EventSource(`http://localhost:3001/api/curate/progress/${curationId}`);

        eventSource.onmessage = (event) => {
          const progress = JSON.parse(event.data);
          setCurrentStep(progress.step);
          setProgressLog(progress.message);

          if (progress.status === "completed") {
            eventSource.close();
            setIsGenerating(false);
            onGenerate("real", curationId);
          } else if (progress.status === "failed") {
            eventSource.close();
            setIsGenerating(false);
            alert(progress.message);
          }
        };

        eventSource.onerror = (err) => {
          console.error("SSE connection error", err);
          eventSource.close();
          setIsGenerating(false);
          alert("实时状态流中断，但后台生成仍将继续进行。");
        };

      } catch (err) {
        console.error(err);
        setIsGenerating(false);
        alert(`发起生成失败: ${err.message}. 请检查后台 server.js (PORT 3001) 是否启动。`);
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-sand-200 flex flex-col justify-center items-center py-12 px-6 grid-bg">
      <div className="w-full max-w-xl bg-white border border-sand-300 rounded-lg p-10 shadow-xs hover:shadow-md transition-shadow animate-fade-in">
        
        <div className="text-center mb-8">
          <span className="text-[10px] font-sans tracking-[0.3em] text-gray-500 uppercase">AI Curation Studio</span>
          <h1 className="font-serif text-3xl font-light text-charcoal mt-3 mb-1">Curation Studio.</h1>
          <p className="text-xs text-gray-500 font-sans">输入任意单品，自适应生产极简杂志感 Bento 展示页</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-4 p-1.5 bg-sand-100 rounded-lg border border-sand-300 mb-6">
          <button
            type="button"
            onClick={() => setCurationMode("demo")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-sans font-semibold transition-colors cursor-pointer ${curationMode === "demo" ? 'bg-white text-charcoal shadow-xs' : 'text-gray-500 hover:text-charcoal'}`}
          >
            <Eye size={14} /> Demo 体验 (免等)
          </button>
          <button
            type="button"
            onClick={() => setCurationMode("real")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-sans font-semibold transition-colors cursor-pointer ${curationMode === "real" ? 'bg-white text-charcoal shadow-xs' : 'text-gray-500 hover:text-charcoal'}`}
          >
            <Cpu size={14} /> Real 引擎 (百炼实时)
          </button>
        </div>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-sand-300"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-amber-800 animate-spin"></div>
            </div>
            <h3 className="font-serif text-lg text-charcoal mt-8 mb-2">
              {curationMode === "demo" ? "装载预制件中..." : `百炼实时生产中 (步骤 ${currentStep}/5)`}
            </h3>
            <p className="text-xs text-gray-500 font-sans text-center max-w-xs">{progressLog}</p>

            {/* Steps Progress Visualizer */}
            {curationMode === "real" && (
              <div className="w-full mt-8 space-y-2 border-t border-sand-300 pt-6">
                {[
                  "文案策划 (Qwen3.7)",
                  "意境渲染 (Qwen-Image)",
                  "动态视频 (HappyHorse)",
                  "声音旁白 (CosyVoice)",
                  "拼装排版 (Bento Inject)"
                ].map((stepName, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-sans">
                    <span className={currentStep > i ? 'text-amber-800 font-semibold' : 'text-gray-400'}>
                      {i + 1}. {stepName}
                    </span>
                    <span className={currentStep > i ? 'text-amber-800 font-semibold' : 'text-gray-400'}>
                      {currentStep > i + 1 ? "✓ 已完成" : currentStep === i + 1 ? "● 烘焙中" : "○ 等待中"}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-4 z-10" />
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
              <Sparkles size={14} /> {curationMode === "demo" ? "开始 Demo 展示" : "真实启动百炼生成"}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
