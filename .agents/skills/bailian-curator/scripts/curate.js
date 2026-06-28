#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// 简易命令行参数解析器
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) {
    const key = process.argv[i].slice(2);
    const val = process.argv[i + 1];
    args[key] = val;
    i++;
  }
}

const imagePath = args.image;
const desc = args.desc || "";
const sub1 = args.sub1 || "";
const sub2 = args.sub2 || "";
const theme = args.theme || "quiet-minimal";

if (!imagePath) {
  console.error("错误: 缺少必填参数 --image <图片路径>");
  process.exit(1);
}

const absoluteImagePath = path.resolve(imagePath);
if (!fs.existsSync(absoluteImagePath)) {
  console.error(`错误: 找不到指定的单品参考图: ${absoluteImagePath}`);
  process.exit(1);
}

async function run() {
  try {
    console.log(`[Agent Skill] 正在连接到本地策展服务器 http://localhost:3001...`);
    
    // 读取二进制图片文件并封装为 Blob
    const fileBuffer = fs.readFileSync(absoluteImagePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
    
    // 构建 FormData 报文
    const formData = new FormData();
    formData.append('image', fileBlob, path.basename(absoluteImagePath));
    formData.append('description', desc);
    formData.append('subProduct1', sub1);
    formData.append('subProduct2', sub2);
    formData.append('theme', theme);

    // 触发策展管道
    const response = await fetch('http://localhost:3001/api/curate', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }

    const { id } = await response.json();
    console.log(`[Agent Skill] 策展生产管道初始化成功。策展ID: ${id}`);
    console.log(`[Agent Skill] 正在建立 SSE 进度事件流监听器...`);

    // 监听进度状态流
    const sseResponse = await fetch(`http://localhost:3001/api/curate/progress/${id}`);
    const reader = sseResponse.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const progress = JSON.parse(line.slice(6));
          console.log(`[进度步骤 ${progress.step}/6] ${progress.message}`);
          
          if (progress.status === 'completed') {
            console.log(`\n🎉 [Agent Skill] 多模态策展烘焙成功！`);
            console.log(`资源目录: public/assets/generated/${id}`);
            console.log(`策展配置文件: public/assets/generated/${id}/curation-data.json`);
            process.exit(0);
          } else if (progress.status === 'failed') {
            console.error(`\n❌ [Agent Skill] 策展管道执行失败: ${progress.message}`);
            process.exit(1);
          }
        }
      }
    }
  } catch (err) {
    console.error(`[Agent Skill] 管道执行崩溃: ${err.message}`);
    console.error("请确保后台 Node.js 服务器已启动 (运行 'node server.js' 监听端口 3001)。");
    process.exit(1);
  }
}

run();
