import React from "react";
import { ArrowLeft, Cpu, BookOpen, Layers, Zap, Sparkles } from "lucide-react";

export const ConceptGuide = ({ onBack }) => {
  return (
    <div className="w-full min-h-screen bg-sand-200 py-16 px-6 grid-bg">
      <div className="max-w-3xl mx-auto bg-white border border-sand-300 rounded-lg p-10 md:p-12 shadow-xs hover:shadow-md transition-shadow relative animate-fade-in">
        
        {/* Floating Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-8 flex items-center gap-1.5 text-xs text-gray-500 hover:text-charcoal transition-colors cursor-pointer z-10 font-sans"
        >
          <ArrowLeft size={14} /> 返回策展工坊
        </button>

        {/* Header */}
        <div className="text-center border-b border-sand-400 pb-8 mb-10 pt-4">
          <span className="text-[10px] font-sans tracking-[0.3em] text-gray-500 uppercase">Methodology & Concepts</span>
          <h1 className="font-serif text-3xl font-light text-charcoal mt-3 mb-2">
            策展工坊方案与核心理念
          </h1>
          <p className="text-xs text-gray-400 font-sans">
            带您轻松读懂 AI 空间美学策划背后的黑科技与设计思路
          </p>
        </div>

        {/* Core Sections */}
        <div className="space-y-10">
          
          {/* Section 1: Core Concept */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <BookOpen size={18} className="text-amber-800" />
              1. 核心理念与方案思路
            </h2>
            <p className="text-xs leading-relaxed text-gray-600">
              传统的商品陈列往往只是干瘪的图片堆砌，缺乏空间感与情感叙事。<strong>百炼策展工坊</strong>的思路是：<strong>“以空间叙事取代商品货架”</strong>。
              用户只需上传一张商品照片并输入简单的名字，AI 就会以专业视觉设计师的眼光，去<strong>读懂商品特征</strong>，为其<strong>脑暴最契合的陈列辅件</strong>，并最终在黄昏光影交织的极简美学空间中，创作出一整套精美的杂志风“Lookbook 套系大片”。
            </p>
          </div>

          {/* Section 2: Core Steps */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <Layers size={18} className="text-amber-800" />
              2. 策展流程：AI 协作的五个步骤
            </h2>
            <div className="space-y-4 text-xs">
              {[
                {
                  title: "视觉识别 ( understand )",
                  desc: "当您上传主展品后，AI 的眼睛（视觉模型）会首先扫描照片，识别出商品的精准物理细节：例如“带有磨砂粗砂质感的灰陶花瓶”。"
                },
                {
                  title: "创意搭配脑暴 ( Brainstorm )",
                  desc: "AI 创意总监会根据主展品，脑暴出两个最搭的衬托单品（比如为粗陶花瓶搭配“有机粗麻桌布”与“黄铜香座”），并在后台自动丰富生成两者的英文细节描述。"
                },
                {
                  title: "文案与声音策划 ( Plan & Speak )",
                  desc: "大语言模型撰写出富有诗意的极简社论版头条及介绍文案，配音合成引擎将这些文案转化为自然温润的艺术解说语音旁白。"
                },
                {
                  title: "多视角大片绘制 ( Render )",
                  desc: "摄影师模型开工，并行生成主展品的多视角意境照（全景、细节特写、桌面摆放照），并绘制搭配单品的特写图，以及主副单品在同一个桌面上的全景合影 Lookbook。"
                },
                {
                  title: "运镜视频烘焙 ( Cam Movement )",
                  desc: "摄像师模型接过第一张分镜大片作为首帧起点，烘焙出一部 5 秒长的光影徐徐移动、树影斑驳的电影级氛围感视频。"
                }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start pl-2">
                  <div className="w-5 h-5 rounded-full bg-sand-300 text-[10px] font-sans font-bold flex items-center justify-center text-charcoal flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-serif text-xs font-semibold text-charcoal">{step.title}</h4>
                    <p className="text-[11px] leading-relaxed text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: The Role of Bailian CLI */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <Cpu size={18} className="text-amber-800" />
              3. 阿里云百炼 CLI 的角色与妙用
            </h2>
            <p className="text-xs leading-relaxed text-gray-600">
              您可以将 <strong>阿里云百炼 CLI</strong> 想象成连接前台界面与后台人工智能大脑的<strong>“万能直连管道”</strong>。
              平时调用不同的 AI 模型需要编写极为复杂的代码，而通过百炼 CLI，我们就像使用命令行遥控器一样，只需要向服务器发射简单的指令（如“画一张照片”、“读一段文字”），百炼就能在毫秒级自动帮我们调用最强大的一流云端模型，省去了极繁琐的配置过程。
            </p>
          </div>

          {/* Section 4: Models Matrix */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <Sparkles size={18} className="text-amber-800" />
              4. 策展工坊的“顶级大师”模型阵列
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                {
                  role: "视觉观察员",
                  model: "Qwen-VL-Plus",
                  effect: "负责“看懂”您上传的商品细节，保证生图不偏色、不走样。"
                },
                {
                  role: "创意总监 & 诗人",
                  model: "Qwen3.7-Max",
                  effect: "脑暴搭配方案，撰写充满空间诗意的社论广告词。"
                },
                {
                  role: "商业摄影大师",
                  model: "Qwen-Image-2.0 / Pro",
                  effect: "负责拍摄意境极强的 4:3 极简商业陈列静物照。"
                },
                {
                  role: "电影级摄像师",
                  model: "HappyHorse-1.1",
                  effect: "将静态的图片衍生为运镜自然、光影浮动的 5 秒质感视频。"
                },
                {
                  role: "电台艺术播音员",
                  model: "CosyVoice-3",
                  effect: "将文字转变成温柔知性、极具感染力的展厅语音讲解。"
                }
              ].map((m, idx) => (
                <div key={idx} className="border border-sand-300 rounded p-3 bg-sand-50/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-sans tracking-wider text-amber-800 font-bold uppercase">{m.role}</span>
                    <h4 className="font-serif text-xs font-semibold text-charcoal mt-0.5">{m.model}</h4>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-1.5">{m.effect}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Engineering Underneath */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <Zap size={18} className="text-amber-800" />
              5. 外部框架与聪明设计
            </h2>
            <p className="text-xs leading-relaxed text-gray-600">
              为了让整个策展过程极速而稳健，我们使用了一些聪明的“系统设计”：
            </p>
            <ul className="list-disc pl-5 text-[11px] leading-relaxed text-gray-500 space-y-1.5">
              <li>
                <strong>并发与退避调度</strong>：为了解决服务器人多拥挤时可能返回限流的问题，程序内置了<strong>拥塞控制调度</strong>。起步以最快速度并行跑 3 张图，万一报错会自动降低车速（变单张执行）并随机等待重试，保障 100% 成功。
              </li>
              <li>
                <strong>Server-Sent Events 渐进式流推送</strong>：让图片生成一张，前台就亮起一张，而不是等到 6 张图全部画完才展现，完全消除了等待的焦虑。
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-12 border-t border-sand-200 pt-8">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded bg-charcoal text-sand-100 hover:bg-amber-900 transition-colors text-xs font-sans tracking-widest uppercase cursor-pointer"
          >
            返回工坊，立即制作
          </button>
        </div>

      </div>
    </div>
  );
};
