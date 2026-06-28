我做了什么
使用 Antigravity + 百炼 CLI 搭建了一个具有顶级视觉品味的“静默极简”电商内容智能策展工坊。用户只需上传一张商品参考照或草图并输入简短说明：
1. 后端调用 Qwen-VL (`bl vision describe`) 提取商品高保真的器形、材质、色彩和标签特征。
2. 将主体特征融入三个专业电商镜头 Prompt（全景意境、宏观特写、生活日常），通过百炼 `bl image generate` 并行生成多角度的三帧主图分镜。
3. 将第一张分镜大片传入 HappyHorse (`bl video generate`) 烘焙出 5 秒的光影微移运镜视频。
4. 使用 CosyVoice 闪播模型 (`bl speech synthesize`) 朗读由 Qwen3.7 策划的优雅杂志解说文案。
5. 前端利用 React + Tailwind CSS v4 + Framer Motion 编排成 Bento Grid 展示面板，带有 3D 深度随动、发光打字机、分镜切换视差以及沉浸式有声视频剧院弹窗。

完整流程：
参考图上传 → Qwen-VL 特征识别对齐 → 3路并行多角度主图分镜渲染 → 首帧分镜 HappyHorse 动态化 → CosyVoice 语音旁白合成 → Qwen3.7 杂志广告文案策划 → Bento 画廊流光呈现 (带提示词抽屉与剧院模式)

使用的工具
- 百炼 CLI: 
  - `bl vision describe`（多模态主体特征提取）
  - `bl image generate`（多视角主图分镜渲染）
  - `bl video generate`（氛围感图像变视频）
  - `bl speech synthesize`（CosyVoice 旁白配音合成）
  - `bl text chat`（Qwen 广告解说词撰写）
- 其他：React SPA、Tailwind CSS v4、Framer Motion (物理跟手感阻尼动效)、Node.js Express 后端服务器（借助 `child_process.execFile` 数组传参进行沙箱安全调用）

效果展示
- 静态预烘焙 Demo 资源成功存储于 `/public/assets/minimalist-vase/` 下，包含了多角度分镜图 `hero_1/2/3.png`，配音 `narration.mp3` 以及视频 `ambient.mp4`，配有完美契合的配置文件。
- 整体前端工程经 `npm run build` 成功进行了 100% 编译（零 Warning，零 Error），界面在 Studio 表单、步骤进度监控和 Bento 画廊之间切换时动效丝滑，交互自然。

最终产出

1. Qwen-VL 主体特征提取
bl vision describe \
  --image ./public/assets/generated/curation-123/input.png \
  --prompt "Describe the main product in this image in detail: shape, color, material, texture, labels, and text. Format the response as a single concise English paragraph, without any explanation." \
  --output text

2. 3路并行多视角意境大片渲染（Establishing / Macro / Lifestyle）
# 镜头 1：全景意境
bl image generate \
  --prompt "A medium eye-level product shot of [主体特征描述], quiet minimalist room, wabi-sabi concrete wall, warm evening light casting elegant leaf shadows, 35mm film photography" \
  --size 4:3 --watermark false --out-dir ./out --out-prefix hero_1
# 镜头 2：细节特写
bl image generate \
  --prompt "An extreme close-up macro shot of [主体特征描述], focusing on its intricate surface texture, material grains and craftsmanship details, clean neutral background, shallow depth of field" \
  --size 4:3 --watermark false --out-dir ./out --out-prefix hero_2
# 镜头 3：场景日常
bl image generate \
  --prompt "A beautiful lifestyle shot of [主体特征描述] resting on a rustic wooden table, warm and cozy aesthetic, natural daylight, soft focus background" \
  --size 4:3 --watermark false --out-dir ./out --out-prefix hero_3

3. 氛围运镜视频烘焙
bl video generate \
  --image ./public/assets/generated/curation-123/hero_1.png \
  --prompt "The sunlight gently shifts across the surface of the product, camera panning micro-movement, photorealistic cinematic" \
  --resolution 720P --duration 5 --watermark false --download ./out/ambient.mp4

4. CosyVoice 旁白解说合成
bl speech synthesize \
  --text "让产品不再是单纯的货架，而是一个空间的注脚..." \
  --voice longwan_v3 --language zh --out ./out/narration.mp3

踩坑记录

1. **命令行特殊字符转义语法错误**：Qwen-VL 返回的英文视觉描述中往往包含双引号（`"`）和圆括号（`()`）。当使用 Node.js 的 `exec` 进行 shell 命令拼接时，这些字符会直接截断并破坏外层命令行。
   * **解决方法**：后端全面废弃 `exec` 拼接，改用 Node 原生安全的 `execFile("bl", ["text", "chat", "--message", textPrompt])` 数组传参模式，不经由 Shell 解析，完美根治了任何符号导致运行中断的问题，并强制开启 `--output text` 纯文本接收模式。
2. **Qwen-Image 多种子高度重合问题**：直接调用 `bl image generate --n 3` 产生的 3 张图只有微小光斑变动，视角完全没有变化。
   * **解决方法**：设计了专业电商镜头 Prompt 矩阵（远景Establishing、微距Macro、场景Lifestyle），进行多路并行并发调用，不仅完美拉开了视角与拍摄构图的丰富度，同时保证了生图效率。
3. **CosyVoice-v3-flash 声音命名限制**：新版声音名称必须带有 `_v3` 后缀（如 `longwan_v3`），如果填入老版音色名会直接报 418 请求错误。
   * **解决方法**：使用 `bl speech synthesize --list-voices --model cosyvoice-v3-flash` 查询并更新音色 ID 后解决。
4. **视频由于 Object-Cover 产生画幅截断**：由于 Bento 布局中视频卡片尺寸固定，`object-cover` 填充模式会导致长画幅视频的边缘被裁剪，且默认循环播放时处于静音状态。
   * **解决方法**：在卡片边缘新增了网格内“Fit / Fill”自适应画幅切换开关，并集成了沉浸式 Fullscreen Lightbox 剧院模式，点击可唤醒解除静音、带全套原装控制器的无损大片播放弹窗。
