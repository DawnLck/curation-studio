import express from "express";
import cors from "cors";
import multer from "multer";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// 配置 Multer 文件上传
const upload = multer({ dest: "uploads/" });

// 内存中保存各任务的 SSE 状态推送管道
const activeClients = {};

const sendProgress = (curationId, step, status, message = "", extra = null) => {
  const clients = activeClients[curationId] || [];
  const data = JSON.stringify({ step, status, message, extra });
  clients.forEach((res) => res.write(`data: ${data}\n\n`));
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

    // Step 1: 文案策划 (Qwen3.7-max)
    sendProgress(curationId, 1, "processing", "大语言模型策划商品文案中...");
    const textPrompt = `写一篇关于商品描述“${description}”的极简杂志广告短文。输出JSON格式，含有两个字段：headline（字数在10字以内的情感标题）, body（80字左右的情感解说正文）。直接输出JSON字符串，不要包含markdown标记。`;
    
    const textResult = await execAsync(`bl text chat --message "${textPrompt}"`);
    const rawStdout = textResult.stdout.trim();
    const cleanedJsonStr = rawStdout.replace(/```json|```/g, "").trim();
    const rawJson = JSON.parse(cleanedJsonStr);
    const curationText = {
      headline: rawJson.headline || rawJson.Headline || rawJson.title || "静默新品",
      body: rawJson.body || rawJson.Body || rawJson.content || ""
    };
    sendProgress(curationId, 1, "completed", "大语言模型文案策划完成！", { editorial: curationText });

    // Step 2: 意境商业图渲染 (Qwen-Image 2.0)
    sendProgress(curationId, 2, "processing", "Qwen-Image 2.0 绘制产品商业大片中...");
    const imgPrompt = `${description}, elegant minimalism, wabi-sabi background, warm evening sunlight, shot on 35mm film, award-winning photography style`;
    const imgOutDir = targetDir;
    
    await execAsync(`bl image generate --prompt "${imgPrompt}" --size 4:3 --watermark false --out-dir "${imgOutDir}" --out-prefix hero`);
    
    // 重命名下载的图片为 hero.png
    try {
      const files = fs.readdirSync(targetDir);
      const heroFile = files.find(f => f.startsWith("hero_") || f.startsWith("image_"));
      if (heroFile) fs.renameSync(path.join(targetDir, heroFile), path.join(targetDir, "hero.png"));
    } catch (err) {
      console.error("Rename image failed", err);
    }
    sendProgress(curationId, 2, "completed", "意境渲染图绘制完成！", { imagePath: `/assets/generated/${curationId}/hero.png` });

    // Step 3: 动态氛围视频生成 (HappyHorse 1.1)
    sendProgress(curationId, 3, "processing", "HappyHorse 1.1 正在生成 5 秒动态呼吸运镜视频...");
    const videoPrompt = `The sunlight gently shifts across the surface of the product, camera panning micro-movement, photorealistic cinematic`;
    
    await execAsync(`bl video generate --image "${path.join(targetDir, "hero.png")}" --prompt "${videoPrompt}" --resolution 720P --duration 5 --watermark false --download "${path.join(targetDir, "ambient.mp4")}"`);
    sendProgress(curationId, 3, "completed", "氛围动态视频烘焙完成！", { videoPath: `/assets/generated/${curationId}/ambient.mp4` });

    // Step 4: 旁白配音合成 (CosyVoice)
    sendProgress(curationId, 4, "processing", "CosyVoice 正在合成策展人配音旁白...");
    await execAsync(`bl speech synthesize --text "${curationText.body}" --voice longwan_v3 --language zh --out "${path.join(targetDir, "narration.mp3")}"`);
    sendProgress(curationId, 4, "completed", "声音旁白录音合成完成！", { voicePath: `/assets/generated/${curationId}/narration.mp3` });

    // Step 5: 写入静态配置文件
    sendProgress(curationId, 5, "processing", "正在完成数据拼装与排版注入...");
    const finalJSON = {
      productName: description.substring(0, 10) || "新品首发",
      subtitle: "自适应智能策展单品",
      theme: "quiet-minimal",
      editorial: curationText,
      imagePath: `/assets/generated/${curationId}/hero.png`,
      videoPath: `/assets/generated/${curationId}/ambient.mp4`,
      voicePath: `/assets/generated/${curationId}/narration.mp3`,
      features: [
        { title: "自适应匹配", desc: "基于上传图片与百炼理解的视觉美学智能呈现" },
        { title: "多模态覆盖", desc: "Qwen文案、Qwen-Image大片、HappyHorse视频与CosyVoice旁白完整生产" }
      ]
    };
    fs.writeFileSync(path.join(targetDir, "curation-data.json"), JSON.stringify(finalJSON, null, 2));

    sendProgress(curationId, 6, "completed", "生成成功！");
  } catch (err) {
    console.error(err);
    sendProgress(curationId, 6, "failed", `策展失败: ${err.message}`);
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
