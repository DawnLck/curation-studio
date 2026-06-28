# 🏛️ 百炼策展工坊 · Bailian Curation Studio

**用一张参考图，全自动生成电商多模态宣发素材**

文生图 · 图生视频 · 语音合成 · AI 文案 · Bento 画廊 — 一键烘焙

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![百炼 CLI](https://img.shields.io/badge/百炼_CLI-bl-FF6A00)](https://bailian.console.aliyun.com)

</div>

---

## 它能做什么？

上传一张商品照片（甚至一张草图），写一句话描述，点击"开始策展" —— 后台会自动：

1. **看懂你的商品** — Qwen-VL 视觉模型提取器形、材质、色彩、标签
2. **脑暴搭配创意** — Qwen3.7 生成 2 件搭配副品的名称与描述
3. **渲染 3 组分镜大片** — Qwen-Image 2.0 按远景 / 微距 / 场景三种电商镜头并行出图
4. **生成搭配单品图 + 全景合影** — 一共 6 张高质量生图
5. **烘焙 5 秒运镜视频** — HappyHorse 把首帧大片变成光影流转的动态素材
6. **撰写杂志级文案** — Qwen3.7 输出带情绪张力的社论推荐短文
7. **合成人声旁白** — CosyVoice-3 把文案朗读成温暖声线的配音

最终产物通过一个精心设计的 **Bento Grid 画廊** 呈现，支持 3D 视差卡片、分镜切换、剧院模式视频灯箱、在线文案编辑（编辑后自动重录配音）、局部重新生成、多版本切换对比等交互能力。

---

## 快速开始

### 前置条件

- **Node.js** ≥ 18
- **百炼 CLI** (`bl`) — 已安装并完成 `bl configure` 鉴权

```bash
# 安装百炼 CLI（如尚未安装）
# 参见：https://bailian.console.aliyun.com
```

### 安装与启动

```bash
# 1. 克隆项目
git clone <repo-url> && cd Bailian

# 2. 安装依赖
npm install

# 3. 启动后端服务（端口 3001）
node server.js

# 4. 启动前端开发服务器（新终端窗口）
npm run dev
```

浏览器访问 `http://localhost:5173`，即可进入策展工坊。

---

## 项目结构

```
Bailian/
├── server.js                  # Express 后端 · 策展管道编排 · 百炼 CLI 调度
├── src/
│   ├── App.jsx                # 路由入口 · 视图状态机
│   └── components/
│       ├── StudioScreen.jsx   # 策展工坊表单 · 进度监控 · 历史列表
│       ├── CurationGallery.jsx# Bento 画廊 · 在线编辑 · 版本切换
│       ├── ConceptGuide.jsx   # 概念科普页 · SVG 流程图
│       ├── AudioNarration.jsx # 音频播放器 · 主题自适应
│       ├── ThreeDCard.jsx     # 3D 视差跟手卡片
│       ├── TypeWriter.jsx     # 打字机文字动效
│       └── TracingBeam.jsx    # 滚动追踪光束
├── public/assets/
│   └── minimalist-vase/       # 预烘焙 Demo 资源
├── scripts/
│   └── bake-assets.sh         # 静态资源预生成脚本
├── .agents/skills/
│   └── bailian-curator/       # Agent Skill（可被 Claude/Codex 等调用）
│       └── scripts/curate.js  # CLI 入口脚本
└── package.json
```

---

## 调用的模型

| 能力 | 百炼 CLI 命令 | 模型 | 用途 |
|------|-------------|------|------|
| 👁️ 视觉理解 | `bl vision describe` | Qwen-VL-Plus | 从参考图提取商品特征 |
| 🧠 文本推理 | `bl text chat` | Qwen3.7-Max | 搭配脑暴 · 文案策划 |
| 🎨 文生图 | `bl image generate` | Qwen-Image 2.0 / Pro | 多视角分镜 · 搭配图 · 合影 |
| 🎬 图生视频 | `bl video generate` | HappyHorse 1.1 | 光影运镜 5s 动态素材 |
| 🎙️ 语音合成 | `bl speech synthesize` | CosyVoice-3 Flash | 人声旁白朗读 |

---

## 核心 API

### `POST /api/curate`

上传商品图并触发完整策展管道。

```bash
curl -X POST http://localhost:3001/api/curate \
  -F "image=@product.png" \
  -F "description=手工陶瓷花瓶" \
  -F "theme=quiet-minimal"
# 返回 { "id": "curation-1719556800000" }
```

### `GET /api/curate/progress/:id`

SSE 事件流，实时推送 6 步管道进度。

### `POST /api/curate/regenerate-asset`

局部重新生成某个资产（图片 / 文案 / 视频），自动追加版本历史。

```json
{ "curationId": "curation-xxx", "assetType": "hero_1" }
```

### `POST /api/curate/edit-text`

在线编辑策展标题或社论文案，编辑文案时自动重新合成配音。

```json
{
  "curationId": "curation-xxx",
  "assetType": "editorial",
  "headline": "新标题",
  "body": "新正文内容..."
}
```

### `GET /api/curate/history`

返回所有历史策展记录列表。

---

## 策展风格

| 风格 | 标识 | 视觉语言 |
|------|------|---------|
| 🏛️ 静默极简 | `quiet-minimal` | Wabi-sabi 侘寂美学 · 柔沙暖色 · 圆角阴影 · 衬线字体 |
| 🔥 疯狂梗图 | `viral-meme` | Neo-brutalism 新粗野主义 · 黑粗边框 · 硬投影 · 表情包猫咪 |

---

## Agent Skill 集成

本项目提供了可被 AI Agent 调用的 Skill 脚本，位于 `.agents/skills/bailian-curator/`。

```bash
# 确保后端服务正在运行，然后：
node .agents/skills/bailian-curator/scripts/curate.js \
  --image ./product.png \
  --desc "手工陶瓷花瓶" \
  --theme quiet-minimal
```

该脚本会连接本地服务器、提交策展请求、通过 SSE 实时打印进度，最终输出生成资源的路径。

---

## 踩坑备忘

| 问题 | 解决方案 |
|------|---------|
| CLI 拼接时引号/括号截断命令 | 废弃 `exec`，改用 `execFile` 数组传参，不经 Shell 解析 |
| `bl image generate --n 3` 三张图几乎一样 | 设计远景/微距/场景三种 Prompt 矩阵，分别并行调用 |
| CosyVoice 老音色名报 418 | 音色 ID 必须带 `_v3` 后缀（如 `longwan_v3`） |
| 视频 `object-cover` 裁剪画幅 | 增加 Fit/Fill 切换 + 全屏灯箱剧院模式 |
| 百炼 429 速率限制 | 指数退避 + 随机抖动重试，免费/付费模型混合并发 |

---

## 技术栈

- **前端**：React 19 · Tailwind CSS v4 · Framer Motion
- **后端**：Node.js · Express 5 · Multer
- **构建**：Vite 8
- **AI 调度**：百炼 CLI (`bl`) · `child_process.execFile` 安全沙箱调用

---

## 许可证

本项目基于 [Apache License 2.0](./LICENSE) 开源。你可以自由使用、修改与分发，但需遵守协议第 4 条：

- 保留原始的版权、署名与 [`NOTICE`](./NOTICE) 声明；
- **任何基于本项目修改或衍生的产品，必须显著标注来源「Bailian 项目」**；
- 对修改过的文件需注明你做了改动；
- 随附一份 LICENSE 副本。
