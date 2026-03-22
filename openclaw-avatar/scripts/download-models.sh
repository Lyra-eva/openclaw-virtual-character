#!/bin/bash

# 下载语音模块所需的所有模型文件
# 所有模型均为开源/本地运行，无需第三方 API

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_ROOT/public/models"

echo "🎤 OpenClaw Avatar - 语音模块模型下载脚本"
echo "========================================="
echo ""

# 创建目录
mkdir -p "$PUBLIC_DIR"

# 1. Whisper.cpp 模型 (语音识别)
echo "📥 下载 Whisper 语音识别模型..."
WHISPER_MODEL="${1:-base}"  # 默认 base，可通过参数指定

case "$WHISPER_MODEL" in
  tiny)
    MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin"
    MODEL_SIZE="39MB"
    ;;
  base)
    MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
    MODEL_SIZE="74MB"
    ;;
  small)
    MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
    MODEL_SIZE="244MB"
    ;;
  *)
    echo "❌ 未知模型大小：$WHISPER_MODEL"
    echo "可用选项：tiny, base, small"
    exit 1
    ;;
esac

echo "   模型：$WHISPER_MODEL ($MODEL_SIZE)"
echo "   链接：$MODEL_URL"

if [ -f "$PUBLIC_DIR/ggml-$WHISPER_MODEL.bin" ]; then
  echo "   ✅ 模型已存在，跳过下载"
else
  curl -L -o "$PUBLIC_DIR/ggml-$WHISPER_MODEL.bin" "$MODEL_URL"
  echo "   ✅ 下载完成"
fi

# 2. Piper TTS 模型 (语音合成) - 中文女声
echo ""
echo "📥 下载 Piper TTS 模型 (中文女声)..."
PIPER_MODEL_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/Xiaoxiao/zh_CN-Xiaoxiao-medium.onnx"
PIPER_CONFIG_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/Xiaoxiao/zh_CN-Xiaoxiao-medium.json"

if [ -f "$PUBLIC_DIR/piper-zh.onnx" ]; then
  echo "   ✅ TTS 模型已存在，跳过下载"
else
  curl -L -o "$PUBLIC_DIR/piper-zh.onnx" "$PIPER_MODEL_URL"
  echo "   ✅ TTS 模型下载完成"
fi

if [ -f "$PUBLIC_DIR/piper-zh.json" ]; then
  echo "   ✅ TTS 配置已存在，跳过下载"
else
  curl -L -o "$PUBLIC_DIR/piper-zh.json" "$PIPER_CONFIG_URL"
  echo "   ✅ TTS 配置下载完成"
fi

# 3. Silero VAD 模型 (语音活动检测)
echo ""
echo "📥 下载 Silero VAD 模型..."
VAD_MODEL_URL="https://github.com/snakers4/silero-vad/raw/main/files/silero_vad.onnx"

if [ -f "$PUBLIC_DIR/silero_vad.onnx" ]; then
  echo "   ✅ VAD 模型已存在，跳过下载"
else
  curl -L -o "$PUBLIC_DIR/silero_vad.onnx" "$VAD_MODEL_URL"
  echo "   ✅ VAD 模型下载完成"
fi

# 4. RNNoise 模型 (降噪) - 可选
echo ""
echo "📥 下载 RNNoise 降噪模型..."
RNNOISE_MODEL_URL="https://raw.githubusercontent.com/xiph/rnnoise/master/src/rnnoise_data.c"

if [ -f "$PUBLIC_DIR/rnnoise_data.bin" ]; then
  echo "   ✅ RNNoise 模型已存在，跳过下载"
else
  # RNNoise 模型较小，可以直接下载
  echo "   ⚠️  RNNoise 模型需要从源码编译，跳过下载"
  echo "   如需使用，请参考：https://github.com/xiph/rnnoise"
fi

echo ""
echo "========================================="
echo "✅ 所有模型下载完成！"
echo ""
echo "模型文件位置：$PUBLIC_DIR"
ls -lh "$PUBLIC_DIR"
echo ""
echo "下一步："
echo "1. 在应用中加载模型"
echo "2. 测试语音识别和合成"
echo "3. 调整参数优化效果"
