#!/usr/bin/env node

/**
 * mcp-server.js
 *
 * 百炼策展工坊 MCP Server (Model Context Protocol)
 *
 * 运行方式：node mcp-server.js
 * 通信方式：stdio (JSON-RPC over stdin/stdout)
 *
 * 暴露 6 个 Tool 供 Agent 调用：
 *   1. analyze_product_image  — 视觉理解
 *   2. brainstorm_sub_products — 搭配脑暴
 *   3. generate_product_images — 批量生图
 *   4. generate_ambient_video  — 氛围视频
 *   5. synthesize_voiceover    — 语音合成
 *   6. curate_full_pipeline    — 一键全流程
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  analyzeProductImage,
  brainstormSubProducts,
  generateEditorial,
  generateImage,
  generateVideo,
  synthesizeVoiceover,
  buildImagePrompts,
} from "./lib/bailian.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Tool Definitions ────────────────────────────────────────────────

const TOOLS = [
  {
    name: "analyze_product_image",
    description:
      "使用 Qwen-VL 视觉模型分析商品参考图，提取器形、材质、色彩、标签等高保真特征描述。这是策展管道的第一步。",
    inputSchema: {
      type: "object",
      properties: {
        image_path: {
          type: "string",
          description: "商品参考图的绝对路径",
        },
      },
      required: ["image_path"],
    },
  },
  {
    name: "brainstorm_sub_products",
    description:
      "使用 Qwen3.7 AI 创意搭配师，基于主商品特征脑暴两个搭配副商品的名称和视觉描述。Agent 可以审阅结果后决定是否采纳或重新脑暴。",
    inputSchema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "主商品简短描述",
        },
        visual_details: {
          type: "string",
          description: "Qwen-VL 提取的视觉特征（来自 analyze_product_image 的输出）",
        },
        theme: {
          type: "string",
          enum: ["quiet-minimal", "viral-meme"],
          description: "策展风格：quiet-minimal（侘寂极简）或 viral-meme（搞笑梗图）",
        },
        sub1_hint: {
          type: "string",
          description: "（可选）对副商品一的建议或约束",
        },
        sub2_hint: {
          type: "string",
          description: "（可选）对副商品二的建议或约束",
        },
      },
      required: ["description", "visual_details", "theme"],
    },
  },
  {
    name: "generate_product_images",
    description:
      "使用 Qwen-Image 2.0 批量生成商品分镜图（3 张主图 + 2 张副品图 + 1 张全景合影），共 6 张。需要先完成 analyze_product_image 和 brainstorm_sub_products。",
    inputSchema: {
      type: "object",
      properties: {
        description: { type: "string", description: "主商品描述" },
        visual_details: { type: "string", description: "VL 视觉特征" },
        theme: { type: "string", enum: ["quiet-minimal", "viral-meme"] },
        sub1_desc: { type: "string", description: "副商品一的英文视觉描述" },
        sub2_desc: { type: "string", description: "副商品二的英文视觉描述" },
        output_dir: {
          type: "string",
          description: "（可选）输出目录的绝对路径。默认自动创建 public/assets/generated/curation-{timestamp}/",
        },
      },
      required: ["description", "visual_details", "theme", "sub1_desc", "sub2_desc"],
    },
  },
  {
    name: "generate_ambient_video",
    description:
      "使用 HappyHorse 1.1 将一张主图转化为 5 秒光影运镜动态氛围视频。",
    inputSchema: {
      type: "object",
      properties: {
        hero_image_path: {
          type: "string",
          description: "主图（hero_1.png）的绝对路径",
        },
        output_path: {
          type: "string",
          description: "输出视频的绝对路径（含文件名，如 /path/to/ambient.mp4）",
        },
        theme: { type: "string", enum: ["quiet-minimal", "viral-meme"] },
      },
      required: ["hero_image_path", "output_path", "theme"],
    },
  },
  {
    name: "synthesize_voiceover",
    description:
      "使用 CosyVoice-3 将文本合成为温暖人声旁白音频。",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "要朗读的文案正文" },
        output_path: {
          type: "string",
          description: "输出音频的绝对路径（如 /path/to/narration.mp3）",
        },
        voice: {
          type: "string",
          description: "（可选）CosyVoice 音色 ID，默认 longwan_v3",
        },
      },
      required: ["text", "output_path"],
    },
  },
  {
    name: "curate_full_pipeline",
    description:
      "一键执行完整的多模态策展管道：视觉分析 → 搭配脑暴 → 6 张生图 → 视频 → 文案 → 配音。适用于不需要中途干预的场景。",
    inputSchema: {
      type: "object",
      properties: {
        image_path: {
          type: "string",
          description: "商品参考图的绝对路径",
        },
        description: {
          type: "string",
          description: "（可选）商品简短描述",
        },
        theme: {
          type: "string",
          enum: ["quiet-minimal", "viral-meme"],
          description: "（可选）策展风格，默认 quiet-minimal",
        },
        sub1_hint: { type: "string", description: "（可选）副商品一建议" },
        sub2_hint: { type: "string", description: "（可选）副商品二建议" },
      },
      required: ["image_path"],
    },
  },
];

// ─── Tool Handlers ────────────────────────────────────────────────

async function handleAnalyzeProductImage({ image_path }) {
  if (!fs.existsSync(image_path)) {
    throw new Error(`找不到图片文件: ${image_path}`);
  }
  const details = await analyzeProductImage(image_path);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ visual_details: details }, null, 2),
      },
    ],
  };
}

async function handleBrainstormSubProducts(args) {
  const result = await brainstormSubProducts({
    description: args.description,
    visualDetails: args.visual_details,
    theme: args.theme,
    sub1Hint: args.sub1_hint,
    sub2Hint: args.sub2_hint,
  });
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleGenerateProductImages(args) {
  const outDir = args.output_dir || path.join(__dirname, "public", "assets", "generated", `curation-${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });

  const prompts = buildImagePrompts({
    visualDetails: args.visual_details,
    description: args.description,
    sub1Desc: args.sub1_desc,
    sub2Desc: args.sub2_desc,
    theme: args.theme,
  });

  // 顺序执行以避免并发限流（MCP 场景下稳定性优先）
  const results = {};
  const jobs = [
    { key: "hero_1", prompt: prompts.hero1, usePro: true },
    { key: "hero_2", prompt: prompts.hero2, usePro: false },
    { key: "hero_3", prompt: prompts.hero3, usePro: false },
    { key: "sub_1", prompt: prompts.sub1, usePro: false },
    { key: "sub_2", prompt: prompts.sub2, usePro: false },
    { key: "ensemble", prompt: prompts.ensemble, usePro: false },
  ];

  for (const job of jobs) {
    const filePath = await generateImage({
      prompt: job.prompt,
      outDir,
      prefix: job.key,
      usePro: job.usePro,
    });
    results[job.key] = filePath;
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ output_dir: outDir, images: results }, null, 2),
      },
    ],
  };
}

async function handleGenerateAmbientVideo(args) {
  if (!fs.existsSync(args.hero_image_path)) {
    throw new Error(`找不到主图文件: ${args.hero_image_path}`);
  }
  const result = await generateVideo({
    heroImagePath: args.hero_image_path,
    outPath: args.output_path,
    theme: args.theme,
  });
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ video_path: result.path, prompt_used: result.prompt }, null, 2),
      },
    ],
  };
}

async function handleSynthesizeVoiceover(args) {
  const outPath = await synthesizeVoiceover({
    text: args.text,
    outPath: args.output_path,
    voice: args.voice || "longwan_v3",
  });
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ audio_path: outPath }, null, 2),
      },
    ],
  };
}

async function handleCurateFullPipeline(args) {
  const imagePath = args.image_path;
  const description = args.description || "商品";
  const theme = args.theme || "quiet-minimal";

  if (!fs.existsSync(imagePath)) {
    throw new Error(`找不到图片文件: ${imagePath}`);
  }

  const curationId = `curation-${Date.now()}`;
  const outDir = path.join(__dirname, "public", "assets", "generated", curationId);
  fs.mkdirSync(outDir, { recursive: true });

  // 拷贝源图
  const inputCopy = path.join(outDir, "input.png");
  fs.copyFileSync(imagePath, inputCopy);

  // Step 1: 视觉分析
  const visualDetails = await analyzeProductImage(inputCopy);

  // Step 2: 搭配脑暴
  let brainstorm;
  try {
    brainstorm = await brainstormSubProducts({
      description,
      visualDetails,
      theme,
      sub1Hint: args.sub1_hint,
      sub2Hint: args.sub2_hint,
    });
  } catch {
    brainstorm = {
      sub1Name: "搭配单品一",
      sub1Desc: "a minimalist home accessory",
      sub2Name: "搭配单品二",
      sub2Desc: "a styled lifestyle item",
    };
  }

  // Step 3: 文案
  let editorial;
  try {
    editorial = await generateEditorial({
      description,
      visualDetails,
      theme,
      sub1Name: brainstorm.sub1Name,
      sub1Desc: brainstorm.sub1Desc,
      sub2Name: brainstorm.sub2Name,
      sub2Desc: brainstorm.sub2Desc,
    });
  } catch {
    editorial = { headline: "新品首发", body: "一场关于美的静默对话。" };
  }

  // Step 4: 生图
  const prompts = buildImagePrompts({
    visualDetails,
    description,
    sub1Desc: brainstorm.sub1Desc,
    sub2Desc: brainstorm.sub2Desc,
    theme,
  });

  const imageJobs = [
    { key: "hero_1", prompt: prompts.hero1, usePro: true },
    { key: "hero_2", prompt: prompts.hero2, usePro: false },
    { key: "hero_3", prompt: prompts.hero3, usePro: false },
    { key: "sub_1", prompt: prompts.sub1, usePro: false },
    { key: "sub_2", prompt: prompts.sub2, usePro: false },
    { key: "ensemble", prompt: prompts.ensemble, usePro: false },
  ];

  const imagePaths = {};
  for (const job of imageJobs) {
    imagePaths[job.key] = await generateImage({ prompt: job.prompt, outDir, prefix: job.key, usePro: job.usePro });
  }

  // Step 5: 视频
  const videoPath = path.join(outDir, "ambient.mp4");
  const videoResult = await generateVideo({ heroImagePath: imagePaths.hero_1, outPath: videoPath, theme });

  // Step 6: 配音
  const audioPath = path.join(outDir, "narration.mp3");
  await synthesizeVoiceover({ text: editorial.body, outPath: audioPath });

  // Step 7: 写入 JSON
  const finalJSON = {
    productName: description.substring(0, 10) || "主商品首发",
    subtitle: theme === "viral-meme" ? "搞笑高能Meme梗图" : "自适应智能策展单品",
    theme,
    activeVersions: { editorial: 0, hero_1: 0, hero_2: 0, hero_3: 0, subProduct1: 0, subProduct2: 0, ensemble: 0, video: 0 },
    history: {
      editorial: [{ headline: editorial.headline, body: editorial.body, voicePath: audioPath }],
      hero_1: [{ imagePath: imagePaths.hero_1, prompt: prompts.hero1 }],
      hero_2: [{ imagePath: imagePaths.hero_2, prompt: prompts.hero2 }],
      hero_3: [{ imagePath: imagePaths.hero_3, prompt: prompts.hero3 }],
      subProduct1: [{ name: brainstorm.sub1Name, desc: brainstorm.sub1Desc, imagePath: imagePaths.sub_1, prompt: prompts.sub1 }],
      subProduct2: [{ name: brainstorm.sub2Name, desc: brainstorm.sub2Desc, imagePath: imagePaths.sub_2, prompt: prompts.sub2 }],
      ensemble: [{ imagePath: imagePaths.ensemble, prompt: prompts.ensemble }],
      video: [{ videoPath, prompt: videoResult.prompt }],
    },
    features: [
      { title: "套系搭配", desc: `${brainstorm.sub1Name} 与 ${brainstorm.sub2Name} 空间连结` },
      { title: "自适应对齐", desc: "基于主商品视觉特征自动智能适配辅展品" },
    ],
  };

  const jsonPath = path.join(outDir, "curation-data.json");
  fs.writeFileSync(jsonPath, JSON.stringify(finalJSON, null, 2));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            curation_id: curationId,
            output_dir: outDir,
            curation_data: jsonPath,
            assets: {
              images: imagePaths,
              video: videoPath,
              audio: audioPath,
            },
            editorial,
            brainstorm,
          },
          null,
          2
        ),
      },
    ],
  };
}

// ─── MCP Server Bootstrap ────────────────────────────────────────────

const server = new Server(
  {
    name: "bailian-curator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "analyze_product_image":
        return await handleAnalyzeProductImage(args);
      case "brainstorm_sub_products":
        return await handleBrainstormSubProducts(args);
      case "generate_product_images":
        return await handleGenerateProductImages(args);
      case "generate_ambient_video":
        return await handleGenerateAmbientVideo(args);
      case "synthesize_voiceover":
        return await handleSynthesizeVoiceover(args);
      case "curate_full_pipeline":
        return await handleCurateFullPipeline(args);
      default:
        return {
          content: [{ type: "text", text: `未知工具: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `执行失败: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🏛️ 百炼策展 MCP Server 已启动 (stdio 模式)");
}

main().catch((err) => {
  console.error("MCP Server 启动失败:", err);
  process.exit(1);
});
