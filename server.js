import express from "express";
import cors from "cors";
import multer from "multer";
import { exec, execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));

// 配置 Multer 文件上传
const upload = multer({ dest: "uploads/" });

// 内存中保存各任务 of the SSE state streaming pipe
const activeClients = {};

const sendProgress = (curationId, step, status, message = "", extra = null) => {
  const clients = activeClients[curationId] || [];
  const data = JSON.stringify({ step, status, message, extra });
  clients.forEach((res) => res.write(`data: ${data}\n\n`));
};

// 带有重试机制的安全 CLI 执行器 (防止 DashScope 429 并发节流限流)
const runWithRetry = async (args, retries = 4, delayMs = 3000) => {
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
        // 引入 1s ~ 4s 随机抖动 (Jitter) 避免并发请求重试时发生时间共振碰撞，并逐步增加重试时间
        const jitter = Math.floor(Math.random() * 3000) + 1000;
        const totalDelay = delayMs + jitter;
        console.warn(`[Rate Limit] 触发百炼速率限制，正在进行第 ${i + 1}/${retries} 次重试，等待 ${totalDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        continue;
      }
      throw err;
    }
  }
};

// SSE 状态监听端点
app.get("/api/curate/progress/:id", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const id = req.params.id;
  if (!activeClients[id]) activeClients[id] = [];
  activeClients[id].push(res);

  req.on("close", () => {
    activeClients[id] = activeClients[id].filter((c) => c !== res);
  });
});

// 核心百炼生成流程
app.post("/api/curate", upload.single("image"), async (req, res) => {
  const description = req.body.description || "";
  const subProduct1Raw = req.body.subProduct1 || "";
  const subProduct2Raw = req.body.subProduct2 || "";
  const curationId = `curation-${Date.now()}`;
  const targetDir = path.join(__dirname, "public", "assets", "generated", curationId);
  fs.mkdirSync(targetDir, { recursive: true });

  // 立即返回 ID
  res.json({ id: curationId });

  try {
    // 拷贝上传的源图到目标目录
    let sourceImagePath = "";
    if (req.file) {
      sourceImagePath = path.join(targetDir, "input.png");
      fs.renameSync(req.file.path, sourceImagePath);
    }

    // 提取参考图特征以保证主体一致性 (Qwen-VL)
    let productVisualDetails = "";
    if (sourceImagePath) {
      sendProgress(curationId, 1, "processing", "Qwen-VL 正在分析参考图视觉属性...");
      const describePrompt = "Describe the main product in this image in detail: shape, color, material, texture, labels, and text. Format the response as a single concise English paragraph, without any explanation.";
      try {
        const describeResult = await runWithRetry([
          "vision", "describe",
          "--image", sourceImagePath,
          "--prompt", describePrompt,
          "--output", "text"
        ]);
        productVisualDetails = describeResult.stdout.trim();
      } catch (err) {
        console.error("Vision describe failed", err);
      }
    }

    // Step 0.5: AI 创意搭配脑暴与提示词丰富化
    let subProduct1Desc = "";
    let subProduct2Desc = "";
    let subProduct1Name = "";
    let subProduct2Name = "";
    
    sendProgress(curationId, 1, "processing", "AI 创意搭配师脑暴搭配建议中...");
    const brainPrompt = `你是一个顶级空间美学与电商摄影陈列大师。主单品是“${description}${productVisualDetails ? ` (外观细节: ${productVisualDetails})` : ''}”。
我们想为其搭配两个小单品，放置在同一个极简、wabi-sabi风格的场景中。
副商品一建议描述为：${subProduct1Raw || '由你自动脑暴一个最搭配且能够呼应材质色彩的单品'}。
副商品二建议描述为：${subProduct2Raw || '由你自动脑暴第二个搭配单品'}。

请为这两个副单品分别设计用于 AI 生图的英文视觉描述（包含器形、材质、色彩，以便送入图像生成器）。
直接输出 JSON 格式（不要包含 markdown 标记），包含以下字段：
{
  "sub1Name": "副商品一中文简短名称",
  "sub1Desc": "副商品一的英文视觉描述，用于生图 prompt",
  "sub2Name": "副商品二中文简短名称",
  "sub2Desc": "副商品二的英文视觉描述，用于生图 prompt"
}`;

    try {
      const brainResult = await runWithRetry([
        "text", "chat",
        "--message", brainPrompt,
        "--output", "text"
      ]);
      const rawBrainStdout = brainResult.stdout.trim();
      const cleanedBrainJsonStr = rawBrainStdout.replace(/```json|```/g, "").trim();
      const rawBrainJson = JSON.parse(cleanedBrainJsonStr);
      subProduct1Name = rawBrainJson.sub1Name || "搭配单品一";
      subProduct1Desc = rawBrainJson.sub1Desc || "a minimalist home accessory, wabi-sabi style";
      subProduct2Name = rawBrainJson.sub2Name || "搭配单品二";
      subProduct2Desc = rawBrainJson.sub2Desc || "a styled lifestyle item, elegant minimalist style";
    } catch (err) {
      console.error("AI Stylist brainstorm failed, using fallbacks", err);
      subProduct1Name = subProduct1Raw || "置物盘";
      subProduct1Desc = "a styled ceramic tray, minimalist and warm lighting";
      subProduct2Name = subProduct2Raw || "香薰摆件";
      subProduct2Desc = "linen fabric textile, warm neutral shades";
    }

    // Step 1: 文案策划 (Qwen3.7-max)
    sendProgress(curationId, 1, "processing", "大语言模型策划商品文案中...");
    const textPrompt = `写一篇关于商品展示套系“主商品为：${description}${productVisualDetails ? `（视觉特征：${productVisualDetails}）` : ''}，搭配商品包括：${subProduct1Name}（${subProduct1Desc}）与${subProduct2Name}（${subProduct2Desc}）”的极简杂志广告短文。输出JSON格式，含有两个字段：headline（字数在10字以内的情感标题）, body（80字左右的情感解说正文）。直接输出JSON字符串，不要包含markdown标记。`;
    
    const textResult = await runWithRetry([
      "text", "chat",
      "--message", textPrompt,
      "--output", "text"
    ]);
    const rawStdout = textResult.stdout.trim();
    const cleanedJsonStr = rawStdout.replace(/```json|```/g, "").trim();
    const rawJson = JSON.parse(cleanedJsonStr);
    const curationText = {
      headline: rawJson.headline || rawJson.Headline || rawJson.title || "静默新品",
      body: rawJson.body || rawJson.Body || rawJson.content || ""
    };
    sendProgress(curationId, 1, "processing", "大语言模型文案策划完成！", { editorial: curationText });

    // Step 2: 意境商业图渲染 (Qwen-Image 2.0 顺序调用以防 Qps 限流)
    sendProgress(curationId, 2, "processing", "Qwen-Image 2.0 正在绘制主分镜与副单品大片...");
    const imgOutDir = targetDir;
    
    // 主展品分镜提示词
    const imgPrompt1 = `A medium eye-level product shot of ${productVisualDetails || description}, quiet minimalist room, wabi-sabi concrete wall, warm evening light casting elegant leaf shadows, 35mm film photography, commercial product shot`;
    const imgPrompt2 = `An extreme close-up macro shot of ${productVisualDetails || description}, focusing on its intricate surface texture, material grains and craftsmanship details, clean neutral background, shallow depth of field, studio lighting`;
    const imgPrompt3 = `A beautiful lifestyle shot of ${productVisualDetails || description} resting on a rustic wooden table, warm and cozy aesthetic, natural daylight, soft focus background, candid lifestyle photography`;
    
    // 副单品及搭配合照提示词
    const imgPromptSub1 = `A beautiful eye-level product shot of ${subProduct1Desc}, quiet minimalist wabi-sabi background, warm evening shadows, 35mm film photography`;
    const imgPromptSub2 = `A beautiful eye-level product shot of ${subProduct2Desc}, quiet minimalist wabi-sabi background, warm evening shadows, 35mm film photography`;
    const imgPromptEnsemble = `A professional styled lookbook shot showing the main product ${productVisualDetails || description} styled harmoniously together with ${subProduct1Desc} and ${subProduct2Desc} on a concrete table, soft afternoon sunlight casting shadows, 35mm film photography, minimalist wabi-sabi setup`;

    // 辅助命名重构函数
    const renameFile = (prefix, targetName) => {
      try {
        const files = fs.readdirSync(targetDir);
        const file = files.find(f => f.startsWith(`${prefix}_`));
        if (file) {
          fs.renameSync(path.join(targetDir, file), path.join(targetDir, targetName));
          return true;
        }
      } catch (err) {
        console.error(`Rename ${prefix} failed`, err);
      }
      return false;
    };

    const hero1Url = `http://localhost:3001/assets/generated/${curationId}/hero_1.png`;
    const hero2Url = `http://localhost:3001/assets/generated/${curationId}/hero_2.png`;
    const hero3Url = `http://localhost:3001/assets/generated/${curationId}/hero_3.png`;
    const sub1Url = `http://localhost:3001/assets/generated/${curationId}/sub_1.png`;
    const sub2Url = `http://localhost:3001/assets/generated/${curationId}/sub_2.png`;
    const ensembleUrl = `http://localhost:3001/assets/generated/${curationId}/ensemble.png`;

    // 声明分镜渲染任务队列 (混合并发：仅 task 1 使用免费 Pro 模型，其余 5 张使用常规 paid 高并发模型)
    const tasks = [
      async () => {
        sendProgress(curationId, 2, "processing", "正在绘制主商品分镜一 (全景意境图)...");
        await runWithRetry(["image", "generate", "--prompt", imgPrompt1, "--model", "qwen-image-2.0-pro-2026-06-22", "--size", "4:3", "--watermark", "false", "--out-dir", imgOutDir, "--out-prefix", "hero_1"]);
        renameFile("hero_1", "hero_1.png");
        sendProgress(curationId, 2, "processing", "主商品分镜一已就绪", { imagePaths: [hero1Url] });
      },
      async () => {
        sendProgress(curationId, 2, "processing", "正在绘制主商品分镜二 (细节特写图)...");
        await runWithRetry(["image", "generate", "--prompt", imgPrompt2, "--size", "4:3", "--watermark", "false", "--out-dir", imgOutDir, "--out-prefix", "hero_2"]);
        renameFile("hero_2", "hero_2.png");
        sendProgress(curationId, 2, "processing", "主商品分镜二已就绪", { imagePaths: [hero1Url, hero2Url] });
      },
      async () => {
        sendProgress(curationId, 2, "processing", "正在绘制主商品分镜三 (场景展示图)...");
        await runWithRetry(["image", "generate", "--prompt", imgPrompt3, "--size", "4:3", "--watermark", "false", "--out-dir", imgOutDir, "--out-prefix", "hero_3"]);
        renameFile("hero_3", "hero_3.png");
        sendProgress(curationId, 2, "processing", "主商品分镜三已就绪", { imagePaths: [hero1Url, hero2Url, hero3Url] });
      },
      async () => {
        sendProgress(curationId, 2, "processing", `正在绘制搭配单品一 [${subProduct1Name}] 特写图...`);
        await runWithRetry(["image", "generate", "--prompt", imgPromptSub1, "--size", "4:3", "--watermark", "false", "--out-dir", imgOutDir, "--out-prefix", "sub_1"]);
        renameFile("sub_1", "sub_1.png");
        sendProgress(curationId, 2, "processing", `搭配小件一 [${subProduct1Name}] 已就绪`, {
          imagePaths: [hero1Url, hero2Url, hero3Url],
          sub1Path: sub1Url
        });
      },
      async () => {
        sendProgress(curationId, 2, "processing", `正在绘制搭配单品二 [${subProduct2Name}] 特写图...`);
        await runWithRetry(["image", "generate", "--prompt", imgPromptSub2, "--size", "4:3", "--watermark", "false", "--out-dir", imgOutDir, "--out-prefix", "sub_2"]);
        renameFile("sub_2", "sub_2.png");
        sendProgress(curationId, 2, "processing", `搭配小件二 [${subProduct2Name}] 已就绪`, {
          imagePaths: [hero1Url, hero2Url, hero3Url],
          sub1Path: sub1Url,
          sub2Path: sub2Url
        });
      },
      async () => {
        sendProgress(curationId, 2, "processing", "正在绘制全景搭配合影 Lookbook...");
        await runWithRetry(["image", "generate", "--prompt", imgPromptEnsemble, "--size", "4:3", "--watermark", "false", "--out-dir", imgOutDir, "--out-prefix", "ensemble"]);
        renameFile("ensemble", "ensemble.png");
        sendProgress(curationId, 2, "processing", "全景合照大片已就绪", {
          imagePaths: [hero1Url, hero2Url, hero3Url],
          sub1Path: sub1Url,
          sub2Path: sub2Url,
          ensemblePath: ensembleUrl
        });
      }
    ];

    // 乐观并发调度器：初始以 batchSize=3 并行运行；一旦捕获 429 速率限制，永久退降至串行 (batchSize=1) 且自动触发等待重试
    let batchSize = 3;
    let taskIdx = 0;
    while (taskIdx < tasks.length) {
      const currentBatch = tasks.slice(taskIdx, taskIdx + batchSize);
      try {
        await Promise.all(currentBatch.map(fn => fn()));
        taskIdx += batchSize; // 成功则步进
      } catch (err) {
        const errMsg = err.message || "";
        const errStderr = err.stderr || "";
        const isRateLimit = errMsg.includes("429") || errMsg.includes("Throttling") || errStderr.includes("429") || errStderr.includes("RateQuota") || errMsg.includes("rate limit exceeded");
        
        if (isRateLimit && batchSize > 1) {
          console.warn("[Concurrency Limiter] 并发请求触发 429 节流。动态将并发阈值限制调整为 1 (串行)，并重新执行本批任务...");
          batchSize = 1; // 永久降级为串行
        } else {
          // 其它网络错误或已在串行模式仍然重试失败，则中断报错
          throw err;
        }
      }
    }

    const generatedImagePaths = [hero1Url, hero2Url, hero3Url];
    const generatedSub1Path = sub1Url;
    const generatedSub2Path = sub2Url;
    const generatedEnsemblePath = ensembleUrl;

    sendProgress(curationId, 2, "processing", "全套搭配分镜意境图全部绘制完成！", { 
      imagePaths: generatedImagePaths,
      sub1Path: generatedSub1Path,
      sub2Path: generatedSub2Path,
      ensemblePath: generatedEnsemblePath
    });

    // Step 3: 动态氛围视频生成 (HappyHorse 1.1)
    sendProgress(curationId, 3, "processing", "HappyHorse 1.1 正在生成 5 秒动态呼吸运镜视频...");
    const videoPrompt = `The sunlight gently shifts across the surface of the product, camera panning micro-movement, photorealistic cinematic`;
    
    // 传入主商品第一张分镜作为视频的起始帧
    await runWithRetry([
      "video", "generate",
      "--image", path.join(targetDir, "hero_1.png"),
      "--prompt", videoPrompt,
      "--resolution", "720P",
      "--duration", "5",
      "--watermark", "false",
      "--download", path.join(targetDir, "ambient.mp4")
    ]);
    sendProgress(curationId, 3, "processing", "氛围动态视频烘焙完成！", { videoPath: `http://localhost:3001/assets/generated/${curationId}/ambient.mp4` });

    // Step 4: 旁白配音合成 (CosyVoice)
    sendProgress(curationId, 4, "processing", "CosyVoice 正在合成策展人配音旁白...");
    await runWithRetry([
      "speech", "synthesize",
      "--text", curationText.body,
      "--voice", "longwan_v3",
      "--language", "zh",
      "--out", path.join(targetDir, "narration.mp3")
    ]);
    sendProgress(curationId, 4, "processing", "声音旁白录音合成完成！", { voicePath: `http://localhost:3001/assets/generated/${curationId}/narration.mp3` });

    // Step 5: 写入静态配置文件 (初始化历史版本追踪数据模型)
    sendProgress(curationId, 5, "processing", "正在完成数据拼装与排版注入...");
    
    const finalJSON = {
      productName: description.substring(0, 10) || "主商品首发",
      subtitle: "自适应智能策展单品",
      theme: "quiet-minimal",
      activeVersions: {
        editorial: 0,
        hero_1: 0,
        hero_2: 0,
        hero_3: 0,
        subProduct1: 0,
        subProduct2: 0,
        ensemble: 0,
        video: 0
      },
      history: {
        editorial: [
          {
            headline: curationText.headline,
            body: curationText.body,
            voicePath: `http://localhost:3001/assets/generated/${curationId}/narration.mp3`
          }
        ],
        hero_1: [
          {
            imagePath: hero1Url,
            prompt: imgPrompt1
          }
        ],
        hero_2: [
          {
            imagePath: hero2Url,
            prompt: imgPrompt2
          }
        ],
        hero_3: [
          {
            imagePath: hero3Url,
            prompt: imgPrompt3
          }
        ],
        subProduct1: [
          {
            name: subProduct1Name,
            desc: subProduct1Desc,
            imagePath: sub1Url,
            prompt: imgPromptSub1
          }
        ],
        subProduct2: [
          {
            name: subProduct2Name,
            desc: subProduct2Desc,
            imagePath: sub2Url,
            prompt: imgPromptSub2
          }
        ],
        ensemble: [
          {
            imagePath: ensembleUrl,
            prompt: imgPromptEnsemble
          }
        ],
        video: [
          {
            videoPath: `http://localhost:3001/assets/generated/${curationId}/ambient.mp4`,
            prompt: videoPrompt
          }
        ]
      },
      features: [
        { title: "套系搭配", desc: `${subProduct1Name} 与 ${subProduct2Name} 空间连结` },
        { title: "自适应对齐", desc: "基于主商品视觉特征自动或手动智能适配辅展品" }
      ]
    };
    fs.writeFileSync(path.join(targetDir, "curation-data.json"), JSON.stringify(finalJSON, null, 2));

    sendProgress(curationId, 6, "completed", "生成成功！");
  } catch (err) {
    console.error(err);
    sendProgress(curationId, 6, "failed", `策展失败: ${err.message}`);
  }
});

// 新增资产局部重新生成接口，支持快照式多版本保留与对比
app.post("/api/curate/regenerate-asset", async (req, res) => {
  const { curationId, assetType } = req.body;
  if (!curationId || !assetType) {
    return res.status(400).json({ error: "Missing curationId or assetType" });
  }

  const targetDir = path.join(__dirname, "public", "assets", "generated", curationId);
  const jsonPath = path.join(targetDir, "curation-data.json");
  if (!fs.existsSync(jsonPath)) {
    return res.status(404).json({ error: "Curation folder not found" });
  }

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const timestamp = Date.now();

    if (assetType === "editorial") {
      // 重新生成文案
      const desc = data.productName;
      // 寻找当前活跃的副单品信息
      const sub1 = data.history.subProduct1[data.activeVersions.subProduct1];
      const sub2 = data.history.subProduct2[data.activeVersions.subProduct2];

      const textPrompt = `写一篇关于商品展示套系“主商品为：${desc}，搭配商品包括：${sub1.name} 与 ${sub2.name}”的极简杂志广告短文。输出JSON格式，含有两个字段：headline（字数在10字以内的情感标题）, body（80字左右的情感解说正文）。直接输出JSON字符串，不要包含markdown标记。`;
      const textResult = await runWithRetry([
        "text", "chat",
        "--message", textPrompt,
        "--output", "text"
      ]);
      const rawStdout = textResult.stdout.trim();
      const cleanedJsonStr = rawStdout.replace(/```json|```/g, "").trim();
      const rawJson = JSON.parse(cleanedJsonStr);
      
      const headline = rawJson.headline || rawJson.Headline || rawJson.title || "静默新品";
      const body = rawJson.body || rawJson.Body || rawJson.content || "";

      // 重新合成旁白语音
      const voiceFile = `narration_${timestamp}.mp3`;
      await runWithRetry([
        "speech", "synthesize",
        "--text", body,
        "--voice", "longwan_v3",
        "--language", "zh",
        "--out", path.join(targetDir, voiceFile)
      ]);

      data.history.editorial.push({
        headline,
        body,
        voicePath: `http://localhost:3001/assets/generated/${curationId}/${voiceFile}`
      });
      data.activeVersions.editorial = data.history.editorial.length - 1;

    } else if (["hero_1", "hero_2", "hero_3", "subProduct1", "subProduct2", "ensemble"].includes(assetType)) {
      // 重新渲染单张图像 (继承原 Prompt 基础以确保指令连续性)
      const historyArr = data.history[assetType];
      const activeItem = historyArr[data.activeVersions[assetType]];
      const prompt = activeItem.prompt;
      const prefix = `${assetType}_${timestamp}`;
      const targetName = `${prefix}.png`;

      // 混合生图策略：主展品 hero_1 用 Pro 免费版，其余付费版高并发以保障极速响应
      const args = ["image", "generate", "--prompt", prompt, "--size", "4:3", "--watermark", "false", "--out-dir", targetDir, "--out-prefix", prefix];
      if (assetType === "hero_1") {
        args.push("--model", "qwen-image-2.0-pro-2026-06-22");
      }

      await runWithRetry(args);

      // 重命名下载的图
      const files = fs.readdirSync(targetDir);
      const generatedFile = files.find(f => f.startsWith(`${prefix}_`));
      if (generatedFile) {
        fs.renameSync(path.join(targetDir, generatedFile), path.join(targetDir, targetName));
      } else {
        throw new Error("Failed to locate generated image file");
      }

      const newItem = {
        imagePath: `http://localhost:3001/assets/generated/${curationId}/${targetName}`,
        prompt: prompt
      };
      
      // subProducts 特殊保留字段
      if (assetType === "subProduct1" || assetType === "subProduct2") {
        newItem.name = activeItem.name;
        newItem.desc = activeItem.desc;
      }

      data.history[assetType].push(newItem);
      data.activeVersions[assetType] = data.history[assetType].length - 1;

    } else if (assetType === "video") {
      // 重新生成 5 秒动态氛围视频：基于当前活跃选择的 hero_1 帧
      const activeHero1 = data.history.hero_1[data.activeVersions.hero_1];
      const hero1LocalPath = path.join(targetDir, path.basename(activeHero1.imagePath));
      const videoFile = `ambient_${timestamp}.mp4`;
      const videoPrompt = `The sunlight gently shifts across the surface of the product, camera panning micro-movement, photorealistic cinematic`;

      await runWithRetry([
        "video", "generate",
        "--image", hero1LocalPath,
        "--prompt", videoPrompt,
        "--resolution", "720P",
        "--duration", "5",
        "--watermark", "false",
        "--download", path.join(targetDir, videoFile)
      ]);

      data.history.video.push({
        videoPath: `http://localhost:3001/assets/generated/${curationId}/${videoFile}`,
        prompt: videoPrompt
      });
      data.activeVersions.video = data.history.video.length - 1;
    }

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (err) {
    console.error("Regenerate asset failed", err);
    res.status(500).json({ error: err.message });
  }
});

// 历史记录查询接口
app.get("/api/curate/history", (req, res) => {
  const genDir = path.join(__dirname, "public", "assets", "generated");
  if (!fs.existsSync(genDir)) {
    return res.json([]);
  }
  try {
    const dirs = fs.readdirSync(genDir).filter(f => {
      try {
        return fs.statSync(path.join(genDir, f)).isDirectory();
      } catch (e) {
        return false;
      }
    });
    const history = dirs.map(dir => {
      const jsonPath = path.join(genDir, dir, "curation-data.json");
      if (fs.existsSync(jsonPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
          const timestamp = dir.split("-")[1];
          const timeStr = timestamp ? new Date(parseInt(timestamp)).toLocaleString("zh-CN") : "未知时间";
          return { id: dir, name: data.productName, subtitle: data.subtitle, time: timeStr };
        } catch (jsonErr) {
          return null;
        }
      }
      return null;
    }).filter(Boolean);
    
    // 按时间倒序排序
    history.sort((a, b) => b.id.localeCompare(a.id));
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read history" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
