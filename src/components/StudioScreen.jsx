import React, { useState, useEffect } from "react";
import { Sparkles, Upload, FileText, Cpu, Eye } from "lucide-react";

export const StudioScreen = ({ onGenerate }) => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [curationMode, setCurationMode] = useState("demo"); // "demo" | "real"
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLog, setProgressLog] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [history, setHistory] = useState([]);

  // 实时展现生成中产物的数据状态
  const [curationProgressData, setCurationProgressData] = useState({
    editorial: null,
    imagePath: null,
    videoPath: null,
    voicePath: null
  });

  useEffect(() => {
    fetch("http://localhost:3001/api/curate/history")
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error("Failed to load history list:", err));
  }, [isGenerating]);

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
    setCurationProgressData({
      editorial: null,
      imagePath: null,
      videoPath: null,
      voicePath: null
    });

    if (curationMode === "demo") {
      // Demo 模式：模拟逐步释放生成资产
      setCurrentStep(1);
      setProgressLog("大语言模型策划商品文案中...");
      
      setTimeout(() => {
        setCurrentStep(2);
        setProgressLog("意境渲染图绘制中...");
        setCurationProgressData(prev => ({
          ...prev,
          editorial: { 
            headline: "静麦之器", 
            body: "这款器物由粗砺黏土经窑火洗礼而成，表面保留了自然的砂粒感与火劫痕迹。柔和的光晕轻轻在其釉面流转，流溢出大音希声、大象无形的东方极简美学品味。" 
          }
        }));
      }, 500);

      setTimeout(() => {
        setCurrentStep(3);
        setProgressLog("氛围动态视频烘焙中...");
        setCurationProgressData(prev => ({
          ...prev,
          imagePath: "/assets/minimalist-vase/hero.png"
        }));
      }, 1000);

      setTimeout(() => {
        setCurrentStep(4);
        setProgressLog("声音旁白录音合成中...");
        setCurationProgressData(prev => ({
          ...prev,
          videoPath: "/assets/minimalist-vase/ambient.mp4"
        }));
      }, 1500);

      setTimeout(() => {
        setCurrentStep(5);
        setProgressLog("正在完成数据拼装与排版注入...");
        setCurationProgressData(prev => ({
          ...prev,
          voicePath: "/assets/minimalist-vase/narration.mp3"
        }));
      }, 2000);

      setTimeout(() => {
        setIsGenerating(false);
        onGenerate("demo", null);
      }, 2500);

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

          if (progress.extra) {
            setCurationProgressData(prev => ({
              ...prev,
              ...progress.extra
            }));
          }

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
        alert(`发起生成失败: ${err.message}. 请检查后台 server.js 是否启动。`);
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-sand-200 flex flex-col justify-center items-center py-12 px-6 grid-bg">
      <div className={`w-full bg-white border border-sand-300 rounded-lg p-10 shadow-xs hover:shadow-md transition-all duration-500 ease-in-out ${isGenerating ? 'max-w-4xl' : 'max-w-xl'}`}>
        
        <div className="text-center mb-8">
          <span className="text-[10px] font-sans tracking-[0.3em] text-gray-500 uppercase">AI Curation Studio</span>
          <h1 className="font-serif text-3xl font-light text-charcoal mt-3 mb-1">Curation Studio.</h1>
          <p className="text-xs text-gray-500 font-sans">输入任意单品，自适应生产极简杂志感 Bento 展示页</p>
        </div>

        {/* Mode Switcher */}
        {!isGenerating && (
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
        )}

        {isGenerating ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start py-4">
            
            {/* Left Column: Curation Progress Steps */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-sand-300"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-t-amber-800 animate-spin"></div>
                </div>
                <div>
                  <h3 className="font-serif text-base text-charcoal font-medium">
                    {curationMode === "demo" ? "装载 Demo 预制件中..." : `百炼实时生产中 (步骤 ${currentStep}/5)`}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-sans">{progressLog}</p>
                </div>
              </div>

              {/* Steps Checklist */}
              <div className="space-y-2.5 border-t border-sand-300 pt-6">
                {[
                  "文案策划 (Qwen3.7)",
                  "意境渲染 (Qwen-Image)",
                  "动态视频 (HappyHorse)",
                  "声音旁白 (CosyVoice)",
                  "数据拼装 (Bento Inject)"
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
            </div>

            {/* Right Column: Emerging Bento Assets Preview */}
            <div className="border border-sand-300 rounded-lg p-6 bg-sand-50 min-h-[300px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[8px] tracking-wider text-gray-400 uppercase font-sans">
                Emerging Curation Preview
              </div>

              <div className="space-y-4">
                {/* 1. Text Preview */}
                {curationProgressData.editorial && (
                  <div className="animate-fade-in space-y-1 pb-3 border-b border-sand-200">
                    <span className="text-[8px] font-sans tracking-wider text-amber-800 font-bold uppercase">01 · 策展广告词</span>
                    <h4 className="font-serif text-sm font-semibold text-charcoal">
                      {curationProgressData.editorial.headline}
                    </h4>
                    <p className="text-[10px] leading-relaxed text-gray-500 mt-1">
                      {curationProgressData.editorial.body}
                    </p>
                  </div>
                )}

                {/* 2. Image Preview */}
                {curationProgressData.imagePath && (
                  <div className="animate-fade-in space-y-1 pb-3 border-b border-sand-200">
                    <span className="text-[8px] font-sans tracking-wider text-amber-800 font-bold uppercase">02 · 视觉大片</span>
                    <div className="w-full h-[120px] rounded overflow-hidden border border-sand-300">
                      <img src={curationProgressData.imagePath} alt="Emerging Image" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* 3. Video Preview */}
                {curationProgressData.videoPath && (
                  <div className="animate-fade-in space-y-1 pb-3 border-b border-sand-200">
                    <span className="text-[8px] font-sans tracking-wider text-amber-800 font-bold uppercase">03 · 氛围视频</span>
                    <div className="w-full h-[120px] rounded overflow-hidden border border-sand-300">
                      <video src={curationProgressData.videoPath} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* 4. Voice Preview */}
                {curationProgressData.voicePath && (
                  <div className="animate-fade-in flex items-center gap-2 bg-white border border-sand-300 p-2 rounded text-[10px] text-gray-600 font-sans">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-800 animate-ping" />
                    <span>策展人沉浸式旁白音频已就绪</span>
                  </div>
                )}
              </div>

              {!curationProgressData.editorial && (
                <div className="flex-grow flex items-center justify-center text-[10px] text-gray-400 font-sans italic py-12">
                  等待第一步文案生成完成...
                </div>
              )}
            </div>

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

      {/* 历史记录板块 */}
      {!isGenerating && history.length > 0 && (
        <div className="w-full max-w-xl mt-8 animate-fade-in">
          <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold font-sans mb-3 border-b border-sand-300 pb-2">
            历史策展记录 / Past Curations
          </h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => onGenerate("real", item.id)}
                className="flex justify-between items-center bg-white border border-sand-300 rounded p-4 shadow-2xs hover:border-amber-800 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-semibold text-charcoal font-sans group-hover:text-amber-800 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">{item.time}</p>
                </div>
                <span className="text-[10px] text-amber-800 font-sans font-medium uppercase group-hover:translate-x-1 transition-transform">
                  加载策展 →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
