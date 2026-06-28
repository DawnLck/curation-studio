import React from "react";
import { ArrowLeft, Cpu, BookOpen, Layers, Zap, Sparkles } from "lucide-react";

export const ConceptGuide = ({ onBack }) => {
  return (
    <div className="w-full min-h-screen bg-sand-200 py-16 px-6 grid-bg">
      <div className="max-w-4xl mx-auto bg-white border border-sand-300 rounded-lg p-8 md:p-10 shadow-xs hover:shadow-md transition-shadow relative animate-fade-in">
        
        {/* Floating Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-8 flex items-center gap-1.5 text-xs text-gray-500 hover:text-charcoal transition-colors cursor-pointer z-10 font-sans"
        >
          <ArrowLeft size={14} /> 返回策展工坊
        </button>

        {/* Header */}
        <div className="text-center border-b border-sand-400 pb-8 mb-10 pt-4">
          <span className="text-[10px] font-sans tracking-[0.3em] text-gray-500 uppercase">Methodology & Visual Flow</span>
          <h1 className="font-serif text-3xl font-light text-charcoal mt-3 mb-2">
            策展工坊方案与核心理念
          </h1>
          <p className="text-xs text-gray-400 font-sans">
            图形化展现从单品输入到多模态大片烘焙的完整协作脉络
          </p>
        </div>

        {/* Core Sections */}
        <div className="space-y-10">
          
          {/* Section 1: Flowchart Diagram */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <Layers size={18} className="text-amber-800" />
              1. 策展烘焙管道流程图 (Curation Generation Pipeline)
            </h2>
            
            {/* SVG Flowchart Container */}
            <div className="w-full bg-sand-50 rounded-lg border border-sand-300 p-4 overflow-x-auto shadow-inner">
              <div className="min-w-[800px] w-full aspect-[800/360]">
                <svg viewBox="0 0 800 360" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    {/* Shadow Filter */}
                    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#8c7e6e" floodOpacity="0.1" />
                    </filter>
                    {/* Arrow Marker */}
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8c7e6e" />
                    </marker>
                    {/* Active Arrow Marker */}
                    <marker id="arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#78350f" />
                    </marker>
                  </defs>

                  {/* Flow Background Grid Lines */}
                  <line x1="180" y1="20" x2="180" y2="340" stroke="#e5ded4" strokeDasharray="4 4" />
                  <line x1="360" y1="20" x2="360" y2="340" stroke="#e5ded4" strokeDasharray="4 4" />
                  <line x1="700" y1="20" x2="700" y2="340" stroke="#e5ded4" strokeDasharray="4 4" />

                  {/* Step Labels at Top */}
                  <text x="90" y="20" textAnchor="middle" className="text-[10px] font-sans font-bold fill-gray-400 tracking-wider">INPUT 输入</text>
                  <text x="270" y="20" textAnchor="middle" className="text-[10px] font-sans font-bold fill-gray-400 tracking-wider">STAGE 1 视觉与脑暴</text>
                  <text x="530" y="20" textAnchor="middle" className="text-[10px] font-sans font-bold fill-gray-400 tracking-wider">STAGE 2 媒体烘焙</text>
                  <text x="750" y="20" textAnchor="middle" className="text-[10px] font-sans font-bold fill-gray-400 tracking-wider">OUTPUT 呈现</text>

                  {/* COLUMN 1: User Input */}
                  <g filter="url(#shadow)">
                    <rect x="20" y="145" width="130" height="60" rx="6" fill="#2d2d2d" stroke="#1c1c1c" strokeWidth="1" />
                    <text x="85" y="172" textAnchor="middle" className="text-[11px] font-sans fill-sand-100 font-semibold">用户上传单品图片</text>
                    <text x="85" y="190" textAnchor="middle" className="text-[9px] font-sans fill-sand-300">(&amp; 脑暴搭配意愿)</text>
                  </g>

                  {/* Arrow from Column 1 to Column 2 */}
                  <path d="M 150 175 L 185 175" fill="none" stroke="#78350f" strokeWidth="1.5" marker-end="url(#arrow-active)" />

                  {/* COLUMN 2: Visual Scan & Brainstorm */}
                  {/* Node 2A: Qwen-VL-Plus */}
                  <g filter="url(#shadow)">
                    <rect x="190" y="70" width="150" height="70" rx="6" fill="#ffffff" stroke="#cbbfae" strokeWidth="1" />
                    <rect x="190" y="70" width="150" height="20" rx="6" fill="#e5ded4" clipPath="inset(0 0 50 0)" />
                    <text x="265" y="84" textAnchor="middle" className="text-[9px] font-sans font-bold fill-amber-900 tracking-wider">① 视觉特征扫描</text>
                    <text x="265" y="108" textAnchor="middle" className="text-[11px] font-serif fill-charcoal font-semibold">Qwen-VL-Plus</text>
                    <text x="265" y="125" textAnchor="middle" className="text-[9px] font-sans fill-gray-400">分析主单品材质、形状与色调</text>
                  </g>

                  {/* Node 2B: Qwen3.7-Max */}
                  <g filter="url(#shadow)">
                    <rect x="190" y="190" width="150" height="70" rx="6" fill="#ffffff" stroke="#cbbfae" strokeWidth="1" />
                    <rect x="190" y="190" width="150" height="20" rx="6" fill="#e5ded4" clipPath="inset(0 0 50 0)" />
                    <text x="265" y="204" textAnchor="middle" className="text-[9px] font-sans font-bold fill-amber-900 tracking-wider">② 智能创意脑暴</text>
                    <text x="265" y="228" textAnchor="middle" className="text-[11px] font-serif fill-charcoal font-semibold">Qwen3.7-Max</text>
                    <text x="265" y="245" textAnchor="middle" className="text-[9px] font-sans fill-gray-400">自适应匹配两件互补陈列单品</text>
                  </g>

                  {/* Lines mapping logic between Stage 1 & Stage 2 */}
                  {/* From VL & Max to Text Branch */}
                  <path d="M 340 105 L 365 105 L 365 75 L 390 75" fill="none" stroke="#8c7e6e" strokeWidth="1" marker-end="url(#arrow)" />
                  <path d="M 340 225 L 365 225 L 365 75 L 390 75" fill="none" stroke="#8c7e6e" strokeWidth="1" />

                  {/* From VL & Max to Image Branch */}
                  <path d="M 340 105 L 365 105 L 365 185 L 390 185" fill="none" stroke="#8c7e6e" strokeWidth="1" marker-end="url(#arrow)" />
                  <path d="M 340 225 L 365 225 L 365 185 L 390 185" fill="none" stroke="#8c7e6e" strokeWidth="1" />

                  {/* COLUMN 3: Parallel Generation Branches */}
                  {/* Branch A: Text & Voice */}
                  <g filter="url(#shadow)">
                    <rect x="400" y="45" width="130" height="60" rx="6" fill="#ffffff" stroke="#cbbfae" strokeWidth="1" />
                    <text x="465" y="65" textAnchor="middle" className="text-[10px] font-sans font-bold fill-amber-800">③ 极简杂志社论</text>
                    <text x="465" y="80" textAnchor="middle" className="text-[11px] font-serif fill-charcoal font-semibold">Qwen3.7-Max</text>
                    <text x="465" y="93" textAnchor="middle" className="text-[8px] font-sans fill-gray-400">输出中英感性解说词</text>
                  </g>
                  
                  <path d="M 530 75 L 550 75" fill="none" stroke="#8c7e6e" strokeWidth="1" marker-end="url(#arrow)" />

                  <g filter="url(#shadow)">
                    <rect x="560" y="45" width="120" height="60" rx="6" fill="#ffffff" stroke="#cbbfae" strokeWidth="1" />
                    <text x="620" y="65" textAnchor="middle" className="text-[10px] font-sans font-bold fill-amber-800">④ 语音旁白合成</text>
                    <text x="620" y="80" textAnchor="middle" className="text-[11px] font-serif fill-charcoal font-semibold">CosyVoice-3</text>
                    <text x="620" y="93" textAnchor="middle" className="text-[8px] font-sans fill-gray-400">烘焙温润人声讲解音频</text>
                  </g>

                  {/* Branch B: Visuals & Motion */}
                  <g filter="url(#shadow)">
                    <rect x="400" y="150" width="130" height="70" rx="6" fill="#ffffff" stroke="#cbbfae" strokeWidth="1" />
                    <text x="465" y="170" textAnchor="middle" className="text-[10px] font-sans font-bold fill-amber-800">③ 摄影意境大片</text>
                    <text x="465" y="186" textAnchor="middle" className="text-[11px] font-serif fill-charcoal font-semibold">Qwen-Image-2.0</text>
                    <text x="465" y="200" textAnchor="middle" className="text-[8px] font-sans fill-gray-400">绘制 3视角主图 + 2特写</text>
                    <text x="465" y="211" textAnchor="middle" className="text-[8px] font-sans fill-gray-400">+ 1 Lookbook 桌面合影</text>
                  </g>

                  <path d="M 530 185 L 550 185" fill="none" stroke="#8c7e6e" strokeWidth="1" marker-end="url(#arrow)" />

                  <g filter="url(#shadow)">
                    <rect x="560" y="150" width="120" height="70" rx="6" fill="#ffffff" stroke="#cbbfae" strokeWidth="1" />
                    <text x="620" y="170" textAnchor="middle" className="text-[10px] font-sans font-bold fill-amber-800">④ 5s 运镜氛围片</text>
                    <text x="620" y="186" textAnchor="middle" className="text-[11px] font-serif fill-charcoal font-semibold">HappyHorse-1.1</text>
                    <text x="620" y="200" textAnchor="middle" className="text-[8px] font-sans fill-gray-400">参考分镜一作为首帧</text>
                    <text x="620" y="211" textAnchor="middle" className="text-[8px] font-sans fill-gray-400">生成光影徐徐平移短片</text>
                  </g>

                  {/* Merging to Bento output */}
                  <path d="M 680 75 L 705 75 L 705 180 L 715 180" fill="none" stroke="#78350f" strokeWidth="1.5" marker-end="url(#arrow-active)" />
                  <path d="M 680 185 L 705 185 L 705 180 L 715 180" fill="none" stroke="#78350f" strokeWidth="1.5" />

                  {/* COLUMN 4: Bento Output */}
                  <g filter="url(#shadow)">
                    <rect x="725" y="145" width="55" height="70" rx="6" fill="#2d2d2d" stroke="#1c1c1c" strokeWidth="1" />
                    <text x="752" y="172" textAnchor="middle" className="text-[10px] font-sans fill-sand-100 font-bold">⑤</text>
                    <text x="752" y="186" textAnchor="middle" className="text-[9px] font-sans fill-sand-100 font-bold">Bento</text>
                    <text x="752" y="200" textAnchor="middle" className="text-[8px] font-sans fill-sand-300">画廊呈现</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Section 2: Core Concept Summary */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <BookOpen size={18} className="text-amber-800" />
              2. 核心理念与设计思路
            </h2>
            <p className="text-xs leading-relaxed text-gray-600">
              传统的商品陈列往往只是干瘪的图片堆砌，缺乏空间感与情感叙事。<strong>百炼策展工坊</strong>的思路是：<strong>“以空间叙事取代商品货架”</strong>。
              通过上面流程图所示，AI 协作的各层节点被无缝整合在一起：
            </p>
            <ul className="list-disc pl-5 text-[11px] leading-relaxed text-gray-500 space-y-1.5">
              <li>
                <strong>多模态流水线 (Multi-modal Pipeline)</strong>：商品被精准识别后，脑暴文本直接指引摄影师模型进行多角度创作。
              </li>
              <li>
                <strong>跨媒体资产依赖</strong>：动态视频不是凭空生成的，而是把生图得到的“分镜一大片”作为物理起始帧输入，实现从静态到动态的顺滑过渡。
              </li>
            </ul>
          </div>

          {/* Section 3: The Role of Bailian CLI */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <Cpu size={18} className="text-amber-800" />
              3. 阿里云百炼 CLI 在流程中的核心角色
            </h2>
            <p className="text-xs leading-relaxed text-gray-600">
              您可以将 <strong>阿里云百炼 CLI</strong> 想象成连接前台界面与后台人工智能大脑的<strong>“万能遥控器与直连管道”</strong>。
              平时要调用上述 Qwen-VL、Qwen-Image、HappyHorse、CosyVoice 等不同的模型，需要分别编写极其冗长的代码。
              而通过百炼 CLI，我们只需在服务器后台发射一条简单的短指令（如：<code className="bg-sand-300/40 px-1 py-0.5 rounded font-mono font-bold text-amber-900 text-[10px]">bl image ...</code>），百炼就能在瞬间帮我们调用云端模型，将生成结果写回本地。极大地加速了生产速度，做到了免去繁琐配置的轻量化开发。
            </p>
          </div>

          {/* Section 4: Models Matrix */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2 border-b border-sand-200 pb-2">
              <Sparkles size={18} className="text-amber-800" />
              4. 调用的模型矩阵一览
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                {
                  role: "视觉观察员",
                  model: "Qwen-VL-Plus",
                  effect: "负责“看懂”主展品照片，提炼材质纹理，确保生成的搭配物件比例合理。"
                },
                {
                  role: "创意策划 & 诗人",
                  model: "Qwen3.7-Max",
                  effect: "负责两款副单品的脑暴搭配，并策划充满诗意的杂志社论标题与解说词。"
                },
                {
                  role: "商业摄影大师",
                  model: "Qwen-Image-2.0 (Pro/Standard)",
                  effect: "绘制多角度意境图、小单品特写图，以及主副商品在桌面上的全景大合照。"
                },
                {
                  role: "电影级摄像师",
                  model: "HappyHorse-1.1",
                  effect: "利用第一张主图作为参考帧，制作平滑运镜、树影斑驳的 5 秒动态氛围短视频。"
                },
                {
                  role: "电台艺术播音员",
                  model: "CosyVoice-3",
                  effect: "将文字转变成温柔知性、极具感染力的展厅语音讲解旁白。"
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
              5. 底层设计与工程实践
            </h2>
            <p className="text-xs leading-relaxed text-gray-600">
              为了确保大批多模态生成任务能快速、稳定地完成，我们在底层引入了两个聪明设计：
            </p>
            <ul className="list-disc pl-5 text-[11px] leading-relaxed text-gray-500 space-y-1.5">
              <li>
                <strong>混合并发计费 (Hybrid Billing)</strong>：将多图生图任务划分为“1张Pro免费模型 + 5张高并发Paid模型”，兼顾了免费额度省钱与Paid多线程秒速出图的优势，生图用时由 2 分钟缩短至 20 秒。
              </li>
              <li>
                <strong>自适应拥塞退避重试 (Jitter Backoff)</strong>：在并发请求触发百炼的限速阈值（429 报错）时，自动调整降级为串行任务，并在重试时随机退避数秒（防共振），大幅提升了高并发成功率。
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
