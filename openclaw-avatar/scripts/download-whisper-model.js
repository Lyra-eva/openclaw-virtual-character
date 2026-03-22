#!/usr/bin/env node

/**
 * Whisper.cpp 模型下载脚本
 * 用于在构建时下载模型文件到 public 目录
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public', 'whisper');

const MODELS = {
  tiny: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    size: '75 MB',
  },
  base: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    size: '142 MB',
  },
  small: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    size: '466 MB',
  },
  medium: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    size: '1.5 GB',
  },
};

function downloadFile(url, dest, callback) {
  const file = fs.createWriteStream(dest);
  
  https.get(url, (response) => {
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;
    
    response.on('data', (chunk) => {
      downloadedSize += chunk.length;
      const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
      process.stdout.write(`\r下载进度：${progress}%`);
    });
    
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log('\n下载完成!');
      callback();
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('下载失败:', err.message);
    callback(err);
  });
}

async function main() {
  const modelName = process.argv[2] || 'base';
  
  if (!MODELS[modelName]) {
    console.error('未知的模型名称');
    console.error('可用模型:', Object.keys(MODELS).join(', '));
    process.exit(1);
  }
  
  const model = MODELS[modelName];
  const filename = `ggml-${modelName}.bin`;
  
  // 创建目录
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const destPath = path.join(publicDir, filename);
  
  // 检查是否已存在
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`模型已存在：${filename} (${sizeMB} MB)`);
    console.log('如需重新下载，请先删除该文件');
    return;
  }
  
  console.log(`开始下载 ${modelName} 模型 (${model.size})`);
  console.log(`来源：${model.url}`);
  console.log(`目标：${destPath}`);
  
  downloadFile(model.url, destPath, (err) => {
    if (err) {
      process.exit(1);
    }
    console.log(`\n✅ 模型下载完成：${filename}`);
  });
}

main();
