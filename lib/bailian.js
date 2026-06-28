/**
 * lib/bailian.js
 * 百炼 CLI (bl) 的共享调用层。
 * 被 server.js、mcp-server.js、以及 Agent Skill CLI 脚本共同使用。
 */

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

/**
 * 带有指数退避 + 随机抖动重试机制的安全 `bl` CLI 执行器。
 * 自动识别 DashScope 429 速率限制并静默重试。
 */
export async function runWithRetry(args, retries = 4, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await execFileAsync("bl", args);
    } catch (err) {
      const errMsg = err.message || "";
      const errStderr = err.stderr || "";
      const isRateLimit =
        errMsg.includes("Throttling") ||
        errMsg.includes("429") ||
        errMsg.includes("rate limit exceeded") ||
        errStderr.includes("429") ||
        errStderr.includes("RateQuota") ||
        errStderr.includes("rate limit exceeded");

      if (isRateLimit && i < retries - 1) {
        const jitter = Math.floor(Math.random() * 3000) + 1000;
        const totalDelay = delayMs + jitter;
        console.error(`[Rate Limit] 触发百炼速率限制，正在进行第 ${i + 1}/${retries} 次重试，等待 ${totalDelay}ms...`);
        await new Promise((r) => setTimeout(r, totalDelay));
        delayMs = Math.min(delayMs * 2, 15000);
        continue;
      }
      throw err;
    }
  }
}

/**
 * 分析商品参考图 (Qwen-VL)
 * @param {string} imagePath - 参考图的绝对路径
 * @returns {Promise<string>} 商品视觉特征的英文描述
 */
export async function analyzeProductImage(imagePath) {
  const describePrompt =
    "Describe the main product in this image in detail: shape, color, material, texture, labels, and text. Format the response as a single concise English paragraph, without any explanation.";

  const result = await runWithRetry([
    "vision", "describe",
    "--image", imagePath,
    "--prompt", describePrompt,
    "--output", "text",
  ]);
  return result.stdout.trim();
}

/**
 * AI 创意搭配脑暴 (Qwen3.7)
 * @param {object} opts
 * @param {string} opts.description - 商品描述
 * @param {string} opts.visualDetails - Qwen-VL 提取的视觉特征
 * @param {string} opts.theme - "quiet-minimal" | "viral-meme"
 * @param {string} [opts.sub1Hint] - 副商品一建议
 * @param {string} [opts.sub2Hint] - 副商品二建议
 * @returns {Promise<{sub1Name, sub1Desc, sub2Name, sub2Desc}>}
 */
export async function brainstormSubProducts({ description, visualDetails, theme, sub1Hint, sub2Hint }) {
  const isMeme = theme === "viral-meme";
  const productLabel = `${description}${visualDetails ? ` (外观细节: ${visualDetails})` : ""}`;

  const prompt = isMeme
    ? `你是一个搞怪、幽默、充满网络流行梗和表情包卖点的沙雕宣发搭配大师。主单品是"${productLabel}"。
我们想为其搭配两个具有搞笑、反差萌或幽默互动感的配件单品。
副商品一建议描述为：${sub1Hint || "由你自动脑暴一个最具有搞怪趣味的配件"}。
副商品二建议描述为：${sub2Hint || "由你自动脑暴第二个恶搞配件"}。
请为这两个副单品分别设计用于 AI 生图的英文视觉描述。
直接输出 JSON 格式（不要包含 markdown 标记），包含以下字段：
{ "sub1Name": "副商品一中文名称", "sub1Desc": "英文视觉描述", "sub2Name": "副商品二中文名称", "sub2Desc": "英文视觉描述" }`
    : `你是一个顶级空间美学与电商摄影陈列大师。主单品是"${productLabel}"。
我们想为其搭配两个小单品，放置在同一个极简、wabi-sabi风格的场景中。
副商品一建议描述为：${sub1Hint || "由你自动脑暴一个最搭配的单品"}。
副商品二建议描述为：${sub2Hint || "由你自动脑暴第二个搭配单品"}。
请为这两个副单品分别设计用于 AI 生图的英文视觉描述。
直接输出 JSON 格式（不要包含 markdown 标记），包含以下字段：
{ "sub1Name": "副商品一中文简短名称", "sub1Desc": "英文视觉描述", "sub2Name": "副商品二中文简短名称", "sub2Desc": "英文视觉描述" }`;

  const result = await runWithRetry(["text", "chat", "--message", prompt, "--output", "text"]);
  const cleaned = result.stdout.trim().replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

/**
 * 生成社论文案 (Qwen3.7)
 */
export async function generateEditorial({ description, visualDetails, theme, sub1Name, sub1Desc, sub2Name, sub2Desc }) {
  const isMeme = theme === "viral-meme";
  const prompt = isMeme
    ? `写一篇关于商品展示套系"主商品为：${description}${visualDetails ? `（视觉特征：${visualDetails}）` : ''}，搭配商品包括：${sub1Name}（${sub1Desc}）与${sub2Name}（${sub2Desc}）"的极其搞笑幽默的情感宣发小段子。输出JSON格式，含有两个字段：headline（字数在10字以内的搞笑标语）, body（80字左右高能幽默正文）。直接输出JSON字符串，不要包含markdown标记。`
    : `写一篇关于商品展示套系"主商品为：${description}${visualDetails ? `（视觉特征：${visualDetails}）` : ''}，搭配商品包括：${sub1Name}（${sub1Desc}）与${sub2Name}（${sub2Desc}）"的极简杂志广告短文。输出JSON格式，含有两个字段：headline（字数在10字以内的情感标题）, body（80字左右的情感解说正文）。直接输出JSON字符串，不要包含markdown标记。`;

  const result = await runWithRetry(["text", "chat", "--message", prompt, "--output", "text"]);
  const cleaned = result.stdout.trim().replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    headline: parsed.headline || parsed.Headline || parsed.title || "静默新品",
    body: parsed.body || parsed.Body || parsed.content || "",
  };
}

/**
 * 生成商品图片 (Qwen-Image 2.0)
 * @param {object} opts
 * @param {string} opts.prompt - 生图提示词
 * @param {string} opts.outDir - 输出目录
 * @param {string} opts.prefix - 文件名前缀
 * @param {boolean} [opts.usePro] - 是否使用 Pro 免费模型
 * @returns {Promise<string>} 生成图片的绝对路径
 */
export async function generateImage({ prompt, outDir, prefix, usePro = false }) {
  const args = ["image", "generate", "--prompt", prompt, "--size", "4:3", "--watermark", "false", "--out-dir", outDir, "--out-prefix", prefix];
  if (usePro) {
    args.push("--model", "qwen-image-2.0-pro-2026-06-22");
  }
  await runWithRetry(args);

  // 重命名生成的文件
  const files = fs.readdirSync(outDir);
  const generated = files.find((f) => f.startsWith(`${prefix}_`));
  const targetName = `${prefix}.png`;
  if (generated) {
    fs.renameSync(path.join(outDir, generated), path.join(outDir, targetName));
  }
  return path.join(outDir, targetName);
}

/**
 * 生成氛围视频 (HappyHorse 1.1)
 */
export async function generateVideo({ heroImagePath, outPath, theme }) {
  const isMeme = theme === "viral-meme";
  const videoPrompt = isMeme
    ? "The cute cat holds the product and does a funny dance, eyes blinking, camera zoom movement, humorous comic animation"
    : "The sunlight gently shifts across the surface of the product, camera panning micro-movement, photorealistic cinematic";

  await runWithRetry([
    "video", "generate",
    "--image", heroImagePath,
    "--prompt", videoPrompt,
    "--resolution", "720P",
    "--duration", "5",
    "--watermark", "false",
    "--download", outPath,
  ]);
  return { path: outPath, prompt: videoPrompt };
}

/**
 * 合成语音旁白 (CosyVoice-3)
 */
export async function synthesizeVoiceover({ text, outPath, voice = "longwan_v3" }) {
  await runWithRetry([
    "speech", "synthesize",
    "--text", text,
    "--voice", voice,
    "--language", "zh",
    "--out", outPath,
  ]);
  return outPath;
}

/**
 * 构建生图提示词矩阵
 */
export function buildImagePrompts({ visualDetails, description, sub1Desc, sub2Desc, theme }) {
  const isMeme = theme === "viral-meme";
  const subject = visualDetails || description;

  return {
    hero1: isMeme
      ? `A hilarious meme graphic of a cute white cat wearing a brown cowboy hat, holding ${subject} with a goofy cute facial expression, clear studio light, plain clean background, meme expressions style, professional funny poster illustration`
      : `A medium eye-level product shot of ${subject}, quiet minimalist room, wabi-sabi concrete wall, warm evening light casting elegant leaf shadows, 35mm film photography, commercial product shot`,
    hero2: isMeme
      ? `A funny macro close-up shot of ${subject} being pointed at by a cute dog's fluffy paw with funny cartoon text balloon pointing at it, studio background, comedic product photo`
      : `An extreme close-up macro shot of ${subject}, focusing on its intricate surface texture, material grains and craftsmanship details, clean neutral background, shallow depth of field, studio lighting`,
    hero3: isMeme
      ? `A comedic lifestyle scene showing a cute fluffy kitten taking a selfie together with ${subject} in a cozy room, humorous selfie photography angle, warm and bright colors`
      : `A beautiful lifestyle shot of ${subject} resting on a rustic wooden table, warm and cozy aesthetic, natural daylight, soft focus background, candid lifestyle photography`,
    sub1: isMeme
      ? `A funny product shot of ${sub1Desc}, comedic presentation, bright pastel background, studio lighting`
      : `A beautiful eye-level product shot of ${sub1Desc}, quiet minimalist wabi-sabi background, warm evening shadows, 35mm film photography`,
    sub2: isMeme
      ? `A funny product shot of ${sub2Desc}, comedic presentation, bright pastel background, studio lighting`
      : `A beautiful eye-level product shot of ${sub2Desc}, quiet minimalist wabi-sabi background, warm evening shadows, 35mm film photography`,
    ensemble: isMeme
      ? `A professional styled meme lookbook photo showing a group of cute fluffy animals (cats and dogs) posing together like models with ${subject}, ${sub1Desc} and ${sub2Desc} on a table, funny faces, high-quality comedic e-commerce banner`
      : `A professional styled lookbook shot showing the main product ${subject} styled harmoniously together with ${sub1Desc} and ${sub2Desc} on a concrete table, soft afternoon sunlight casting shadows, 35mm film photography, minimalist wabi-sabi setup`,
  };
}
