# Whisper.cpp 离线语音识别集成指南

## 概述

本项目集成了 Whisper.cpp 的 WebAssembly 版本，实现**完全离线**的语音识别功能。

### 优势

- ✅ **完全离线** - 无需联网，保护隐私
- ✅ **高精度** - 中文识别准确率 >95%
- ✅ **多语言** - 支持 99 种语言
- ✅ **本地运行** - 无服务器依赖
- ✅ **双引擎** - 可在 Web Speech API 和 Whisper 之间切换

### 劣势

- ⚠️ **模型体积** - Base 模型 142MB
- ⚠️ **首次加载** - 模型加载需要几秒钟
- ⚠️ **性能要求** - 需要一定的 CPU 性能

---

## 模型选择

| 模型 | 大小 | 速度 | 精度 | 推荐场景 |
|------|------|------|------|----------|
| **Tiny** | 75MB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 快速测试，低配设备 |
| **Base** | 142MB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **日常使用 (推荐)** |
| **Small** | 466MB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 高精度需求 |
| **Medium** | 1.5GB | ⭐⭐ | ⭐⭐⭐⭐⭐ | 专业场景 |
| **Large** | 3GB | ⭐ | ⭐⭐⭐⭐⭐ | 极致精度 |

---

## 快速开始

### 1. 下载模型

```bash
# 下载推荐的 Base 模型
npm run download-whisper base

# 或选择其他模型
npm run download-whisper tiny
npm run download-whisper small
npm run download-whisper medium
```

模型会下载到：`public/whisper/ggml-base.bin`

### 2. 在应用中选择引擎

1. 启动应用
2. 点击 ⚙️ 配置按钮
3. 在"语音识别引擎"中选择 **🧠 Whisper 离线**
4. 首次使用会自动加载模型

### 3. 使用语音识别

1. 点击 🎙️ 麦克风按钮
2. 说话
3. 点击停止 (或自动检测静音)
4. 识别结果自动发送

---

## 技术实现

### 架构

```
┌─────────────────────────────────────┐
│         VoiceService                │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Web Speech  │  │  Whisper     │  │
│  │ API         │  │  Service     │  │
│  └─────────────┘  └──────────────┘  │
│         ↓                ↓           │
│  ┌────────────────────────────────┐ │
│  │   统一接口 (start/stop)        │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 核心文件

```
src/services/
├── VoiceService.ts      # 统一语音服务接口
├── WhisperService.ts    # Whisper 专用服务
└── GatewayService.ts    # OpenClaw 通信
```

### 代码示例

```typescript
import { voiceService } from '@/services/VoiceService';

// 切换到 Whisper 引擎
voiceService.setEngine('whisper');

// 初始化 (加载模型)
await voiceService.initialize();

// 开始录音
voiceService.startListening();

// 停止录音
voiceService.stopListening();
```

---

## 模型文件管理

### 文件位置

```
public/whisper/
├── ggml-tiny.bin
├── ggml-base.bin
├── ggml-small.bin
└── ggml-medium.bin
```

### Tauri 应用中的持久化

在 Tauri 桌面应用中，模型文件可以保存到应用数据目录：

```rust
// src-tauri/src/main.rs
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            println!("App data dir: {:?}", app_data_dir);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 性能优化

### 1. 模型预加载

在应用启动时预加载模型：

```typescript
// App.tsx
useEffect(() => {
  if (voiceEngine === 'whisper') {
    voiceService.initialize();
  }
}, [voiceEngine]);
```

### 2. 音频优化

- 采样率：16kHz (Whisper 要求)
- 位深度：16-bit PCM
- 声道：单声道

### 3. 内存管理

```typescript
// 不使用时释放资源
whisperService.dispose();

// 重新使用时重新初始化
await whisperService.initialize();
```

---

## 常见问题

### Q: 模型下载失败

**A:** 检查网络连接，HuggingFace 可能需要代理：

```bash
# 使用镜像站
export HF_ENDPOINT=https://hf-mirror.com
npm run download-whisper base
```

### Q: 识别速度慢

**A:** 
- 切换到 Tiny 或 Base 模型
- 关闭其他占用 CPU 的程序
- 考虑使用 Web Speech API (在线)

### Q: 识别不准确

**A:**
- 使用更大的模型 (Small/Medium)
- 确保发音清晰
- 减少背景噪音
- 检查麦克风质量

### Q: 内存占用高

**A:**
- 模型会占用 200-500MB 内存
- 不使用时调用 `dispose()` 释放
- 考虑使用 Tiny 模型

---

## 进阶使用

### 自定义参数

```typescript
whisperService.params = {
  model: 'ggml-base.bin',
  language: 'zh',      // 中文
  translate: false,    // 不翻译
  print_progress: true,
};
```

### 实时识别

Whisper 目前支持**录音后识别**模式。如需实时流式识别，需要：

1. 分片录音 (每 5 秒一段)
2. 逐段识别
3. 拼接结果

### 多语言支持

```typescript
// 切换到英文
whisperService.params.language = 'en';

// 切换到日文
whisperService.params.language = 'ja';

// 自动检测
whisperService.params.language = 'auto';
```

---

## 参考资源

- [Whisper.cpp 官方仓库](https://github.com/ggerganov/whisper.cpp)
- [Whisper WASM 示例](https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.wasm)
- [HuggingFace 模型下载](https://huggingface.co/ggerganov/whisper.cpp)
- [Web Speech API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

## 下一步

- [ ] 支持流式识别
- [ ] 添加 VAD (语音活动检测)
- [ ] 支持自定义热词
- [ ] 优化模型加载速度
- [ ] 支持本地微调模型
