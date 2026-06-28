# 顶级策展美学电商内容生成平台 - MVP 实战案例

## A. 真实案例
**我做了什么**：
构建了一个具有杂志级策展品味的自适应电商内容生成页。用户只需上传一张商品参考图/草图并输入简短说明，系统自动结合 Qwen 智能体与百炼 CLI 多模态链路，一键生成契合“静默极简”视觉调性的 Bento Grid 杂志面。

在开发中，我使用了 `bailian-cli` 的以下多模态生成链路：
1. **意境渲染图生成**：调用 `bl image generate` 依靠 Qwen-Image 2.0 根据商品草图提示词生成超写实、具有 35mm 胶片大片色彩的高精细节图。
2. **氛围视频生成**：调用 `bl video generate` 依赖 HappyHorse 1.1 图像变视频能力，生成了日光自然位移、微尘浮动的 5s 动态呼吸感视频。
3. **旁白音频生成**：调用 `bl speech synthesize` 依靠 CosyVoice 闪播模型，合成了语气从容、沉静舒缓的策展人中文解说音频。

**使用的工具**：
- 阿里云百炼 CLI (`bailian-cli`)
- Qwen-Image-2.0 / HappyHorse-1.1 / CosyVoice-v3-flash
- 前端技术栈：React SPA + Tailwind CSS v4 + Framer Motion + Aceternity UI 概念（3D 悬浮视差、发光打字机、Tracing Beam 引导线）

**效果展示**：
- 资源成功生成并存储在本地项目目录的 `/public/assets/minimalist-vase/` 下，包含了 `hero.png`、`ambient.mp4`、`narration.mp3`。
- 页面基于 React 组装完成，能够平滑进行“Studio 输入编辑”与“Bento 画廊呈现”的双向视图切换，所有组件拥有丝滑的物理阻尼动效。

**踩坑记录**：
1. **CosyVoice 引擎 418 报错**：在脚本生成语音时，指定 voice 为 `longxiaochun` 时报错 418。经使用 `bl speech synthesize --list-voices --model cosyvoice-v3-flash` 确认，百炼 cosyvoice-v3-flash 模型的系统声音 ID 命名在 v3 版本后有变化（增加了 `_v3` 后缀），如 `longxiaochun_v3` 或 `longwan_v3`。通过更新参数为 `longwan_v3` 后解决，成功生成音质细腻的策展人解说。
2. **HappyHorse 运镜形变问题**：生成视频时如果 Prompt 太宽泛，主体的几何轮廓容易产生漂移和扭曲。解决方法是：输入干净的 Qwen-Image 生成图作为首帧，并在 Prompt 显式锁定运镜限制为微小变动（`camera panning micro-movement`），可确保主体陶罐没有形变，仅背景的光影和阳光轨迹发生自然拟真位移。
