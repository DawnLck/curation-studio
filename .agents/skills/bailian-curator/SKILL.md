---
name: bailian-curator
description: 百炼策展工坊的 Agent Skill。提供 MCP Server（推荐）和 CLI 两种调用方式，将商品参考图一键转化为多模态电商宣发素材（文生图 × 6、图生视频、AI 文案、语音合成）。
---

# 百炼策展工坊 · Agent Skill

将"上传一张商品图 → 全自动生成多模态电商宣发素材"的完整管道，封装为可被 AI Agent 标准化调用的 Skill。

## 能力概览

| Tool | 模型 | 作用 |
|------|------|------|
| `analyze_product_image` | Qwen-VL-Plus | 提取商品器形、材质、色彩、标签特征 |
| `brainstorm_sub_products` | Qwen3.7-Max | 脑暴 2 个搭配副商品的名称与描述 |
| `generate_product_images` | Qwen-Image 2.0 | 渲染 3 张主图分镜 + 2 张副品图 + 1 张合影 |
| `generate_ambient_video` | HappyHorse 1.1 | 主图变 5 秒光影运镜视频 |
| `synthesize_voiceover` | CosyVoice-3 | 文案合成人声旁白 |
| `curate_full_pipeline` | 全部 | 一键执行完整管道（适合不需要中途干预的场景） |

## 前置条件

1. **百炼 CLI** (`bl`) 已安装并完成 `bl configure` 鉴权
2. **Node.js** ≥ 18
3. 已在项目根目录执行 `npm install`（安装 `@modelcontextprotocol/sdk` 依赖）

---

## 方式一：MCP Server（推荐）

### 适用 Agent

Claude Desktop、Cursor、Windsurf、Antigravity 等所有支持 MCP 协议的 Agent。

### 配置方法

在 Agent 的 MCP 配置中注册本 Server：

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`)：

```json
{
  "mcpServers": {
    "bailian-curator": {
      "command": "node",
      "args": ["/absolute/path/to/Bailian/mcp-server.js"]
    }
  }
}
```

**Cursor** (Settings → MCP → Add server)：

```json
{
  "mcpServers": {
    "bailian-curator": {
      "command": "node",
      "args": ["/absolute/path/to/Bailian/mcp-server.js"]
    }
  }
}
```

**Antigravity** (`.agents/mcp.json` 或全局 `~/.gemini/config/mcp.json`)：

```json
{
  "mcpServers": {
    "bailian-curator": {
      "command": "node",
      "args": ["./mcp-server.js"]
    }
  }
}
```

### 使用示例

配置完成后，Agent 即可直接使用这些 Tool。以下是一个典型的 Agent 对话流程：

#### 场景 A：全流程一键策展

> **用户**：帮我为这个花瓶做一套电商宣发素材
> **Agent**：我来调用百炼策展管道。
> → 调用 `curate_full_pipeline(image_path="/path/to/vase.png", description="手工陶瓷花瓶", theme="quiet-minimal")`
> **Agent**：策展完成！生成了 3 张主图分镜、2 张搭配单品图、全景合影、5 秒氛围视频和人声旁白。

#### 场景 B：分步策展（Agent 充当创意导演）

> **Agent** → `analyze_product_image(image_path="vase.png")`
> 返回：`{ "visual_details": "A handcrafted ceramic vase with warm beige glaze..." }`
>
> **Agent** → `brainstorm_sub_products(description="花瓶", visual_details="...", theme="quiet-minimal")`
> 返回：`{ "sub1Name": "藤编置物盘", "sub1Desc": "...", "sub2Name": "线香架", ... }`
>
> **Agent**：脑暴结果是"藤编置物盘"和"线香架"，你觉得合适吗？
> **用户**：把线香架换成一本旧书吧。
> **Agent** → `brainstorm_sub_products(... sub2_hint="一本泛黄的精装旧书")`
>
> **Agent** → `generate_product_images(...)` → `generate_ambient_video(...)` → `synthesize_voiceover(...)`

---

## 方式二：CLI 脚本（通用降级）

### 适用 Agent

所有能执行 Shell 命令的 Agent（OpenAI Codex、GitHub Copilot 等）。

### 命令

```bash
node .agents/skills/bailian-curator/scripts/curate.js \
  --image <图片路径> \
  --desc "商品描述" \
  --theme quiet-minimal
```

### 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--image` | ✅ | 商品参考图路径 |
| `--desc` | | 商品简短描述 |
| `--theme` | | `quiet-minimal`（默认）或 `viral-meme` |
| `--sub1` | | 副商品一建议 |
| `--sub2` | | 副商品二建议 |

### 注意事项

CLI 模式**依赖后端 Express 服务器**（`node server.js` 在 3001 端口运行）。MCP 模式则不依赖，直接调用 `bl` CLI。

---

## 输出产物

无论使用哪种方式，最终都会在 `public/assets/generated/curation-{timestamp}/` 目录下生成：

```
curation-{timestamp}/
├── input.png           # 原始参考图
├── hero_1.png          # 主图分镜一（全景意境）
├── hero_2.png          # 主图分镜二（微距特写）
├── hero_3.png          # 主图分镜三（场景展示）
├── sub_1.png           # 搭配单品一
├── sub_2.png           # 搭配单品二
├── ensemble.png        # 全景搭配合影
├── ambient.mp4         # 5 秒氛围视频
├── narration.mp3       # 人声旁白
└── curation-data.json  # 完整配置（含 prompts、版本历史等）
```
