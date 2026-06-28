#!/bin/bash
set -e

OUT_DIR="/Users/echo/Desktop/MyProjects/Watcha/Bailian/public/assets/minimalist-vase"
mkdir -p "$OUT_DIR"

echo "=== 1. 渲染商业氛围图 ==="
bl image generate \
  --prompt "A wabi-sabi handcrafted ceramic vase on a simple wooden shelf, warm evening sunlight casting sharp branch shadows, soft neutral linen background, high-end design magazine photography style, 35mm film" \
  --size 4:3 --watermark false \
  --out-dir "$OUT_DIR" --out-prefix hero

# 重命名下载的图片为 hero.png
mv "$OUT_DIR"/hero_*.png "$OUT_DIR"/hero.png || mv "$OUT_DIR"/image_*.png "$OUT_DIR"/hero.png || true

echo "=== 2. 生成动态氛围视频 ==="
bl video generate \
  --image "$OUT_DIR/hero.png" \
  --prompt "The evening sunlight slowly shifts across the surface of the ceramic vase, subtle dust motes floating in the light beam, camera panning micro-movement, photorealistic cinematic" \
  --resolution 720P --duration 5 --watermark false \
  --download "$OUT_DIR/ambient.mp4"

echo "=== 3. 合成旁白语音 ==="
bl speech synthesize \
  --text "静默，是物体的呼吸。让产品不再是单纯的货架，而是一个空间的注脚。这款手工陶瓷花瓶以泥土的原始颗粒感，诉说着慢时光的故事。" \
  --voice longwan_v3 --language zh \
  --out "$OUT_DIR/narration.mp3"

echo "=== 资产烘焙完成 ==="
