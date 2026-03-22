# 🎤 本地语音模块集成示例

> 完整集成到 OpenClaw Avatar 应用

---

## ✅ 已完成集成

### 1. App.tsx - 主应用

**新增功能：**
- ✅ 本地语音模块开关
- ✅ 模型下载按钮
- ✅ 初始化控制
- ✅ TTS 语速调节
- ✅ VAD 灵敏度调节
- ✅ 状态显示

**位置：** `src/App.tsx`

**新增状态：**
```typescript
const [useLocalVoice, setUseLocalVoice] = useState(false);
const [localVoiceInitialized, setLocalVoiceInitialized] = useState(false);
const [localSTTModel, setLocalSTTModel] = useState<'tiny' | 'base' | 'small'>('base');
const [localTTSRate, setLocalTTSRate] = useState(1.0);
const [localVADThreshold, setLocalVADThreshold] = useState(0.5);
```

**新增处理方法：**
```typescript
handleInitializeLocalVoice()      // 初始化
handleToggleLocalListening()      // 开始/停止监听
handleTestLocalTTS()              // 测试 TTS
handleDownloadLocalModels()       // 下载模型
handleUpdateLocalVAD()            // 更新 VAD
handleUpdateLocalTTSRate()        // 更新语速
```

---

### 2. AvatarView.tsx - 3D 人物视图

**新增功能：**
- ✅ 实时唇形同步
- ✅ 自动切换本地/传统模式

**集成代码：**
```typescript
// 优先使用唇形同步服务
const localStatus = localVoiceService.getStatus();
if (localStatus.isInitialized && (localStatus.isSpeaking || localStatus.isRecording)) {
  currentMouthOpen = localVoiceService.getMouthOpen();
} else if (isSpeaking) {
  currentMouthOpen = (Math.sin(time * 10) + 1) * 0.3;
}
```

---

## 🚀 使用流程

### Step 1: 打开配置面板

点击底部 ⚙️ 按钮，打开配置面板。

### Step 2: 启用本地语音模块

1. 找到 **"纯本地语音模块 (新)"** 区域
2. 打开开关 **"启用本地语音模块"**

### Step 3: 下载模型

1. 选择 Whisper 模型大小：
   - **Tiny** (39MB) - 快速，精度一般
   - **Base** (74MB) - 平衡 ⭐推荐
   - **Small** (244MB) - 慢，高精度

2. 点击 **"📥 下载模型"** 按钮
3. 等待下载完成

### Step 4: 初始化

点击 **"⚡ 初始化"** 按钮

成功后会显示：**✅ 已初始化**

### Step 5: 调整参数 (可选)

- **TTS 语速**: 0.5x - 2.0x (默认 1.0x)
- **VAD 灵敏度**: 10% - 90% (默认 50%)
  - 安静环境：30-40%
  - 嘈杂环境：60-70%

### Step 6: 测试

点击 **"🔊 测试 TTS"** 按钮

会听到："你好，这是本地语音合成测试"

### Step 7: 开始使用

1. 关闭配置面板
2. 点击底部 🎙️ 按钮
3. 开始说话，查看识别结果

---

## 🎛️ 配置面板预览

```
┌─────────────────────────────────────┐
│ 🎤 纯本地语音模块 (新)               │
├─────────────────────────────────────┤
│ ☑ 启用本地语音模块                   │
│   100% 离线运行，无第三方 API 依赖     │
│                                     │
│ 状态：✅ 已初始化                     │
│                                     │
│ Whisper 模型大小：                   │
│ [Base (74MB, 平衡) ⭐       ▼]      │
│                                     │
│ [📥 下载模型] [⚡ 初始化]            │
│                                     │
│ TTS 语速：1.0x                       │
│ |──────●──────────────|             │
│ 0.5    1.0           2.0            │
│                                     │
│ VAD 灵敏度：50%                      │
│ |──────●──────────────|             │
│ 10%    50%           90%            │
│ 值越低越灵敏，嘈杂环境建议调高         │
│                                     │
│ [🔊 测试 TTS]                        │
│                                     │
│ ✅ 包含功能:                         │
│ • Whisper 离线语音识别               │
│ • Piper TTS 语音合成                 │
│ • Silero VAD 语音检测                │
│ • RNNoise 降噪                       │
│ • 唇形同步                           │
│ • 3D  空间音频                        │
└─────────────────────────────────────┘
```

---

## 💡 使用场景

### 场景 1: 安静环境 (推荐配置)

```
模型：Base
TTS 语速：1.0x
VAD 灵敏度：30-40%
降噪：自动启用
```

### 场景 2: 嘈杂环境

```
模型：Small (高精度)
TTS 语速：1.1x (稍快，提高清晰度)
VAD 灵敏度：60-70%
降噪：自动启用
```

### 场景 3: 性能优先

```
模型：Tiny
TTS 语速：1.0x
VAD 灵敏度：50%
空间音频：禁用 (在设置中)
```

---

## 🎤 语音交互流程

### 完整对话示例

```
1. 用户点击 🎙️ 按钮
   ↓
2. VAD 检测到语音开始
   ↓
3. Whisper 识别语音 → 文字
   ↓
4. 发送到 OpenClaw Gateway
   ↓
5. 接收 AI 回复
   ↓
6. Piper TTS 合成语音
   ↓
7. 播放语音 + 唇形同步
   ↓
8. 用户可随时打断 (全双工)
```

---

## 🔧 故障排查

### 问题 1: 初始化失败

**症状：** 点击"初始化"后报错

**解决：**
```bash
# 1. 检查模型文件
ls -lh public/models/

# 2. 重新下载模型
npm run download-models

# 3. 查看浏览器控制台
F12 → Console → 查看错误信息
```

### 问题 2: 麦克风无法使用

**症状：** 点击录音按钮无反应

**解决：**
```
1. 检查浏览器权限
   浏览器设置 → 隐私 → 麦克风 → 允许

2. 确保使用 HTTPS 或 localhost
   (麦克风需要安全上下文)

3. 重启浏览器
```

### 问题 3: TTS 无声

**症状：** 测试 TTS 时听不到声音

**解决：**
```
1. 检查系统音量
2. 检查浏览器音量
3. 等待模型完全加载 (看状态提示)
4. 查看控制台错误
```

### 问题 4: 唇形不同步

**症状：** 嘴型动画和声音不匹配

**解决：**
```typescript
// 在 AvatarView.tsx 中检查
const localStatus = localVoiceService.getStatus();
console.log('LocalVoice Status:', localStatus);

// 应该显示：
// { isRecording: true, isSpeaking: false, isInitialized: true }
```

---

## 📊 性能监控

### 在浏览器控制台查看

```javascript
// 查看服务状态
localVoiceService.getStatus()

// 查看配置
localVoiceService.getConfig()

// 测试唇形同步
localVoiceService.getMouthOpen()

// 测试 VAD
sileroVADService.getStatus()
```

### 性能指标

打开浏览器 DevTools → Performance

录制一段对话，查看：
- CPU 占用：应该 < 20%
- 内存占用：应该 < 300MB
- 帧率：应该 > 50fps

---

## 🎨 自定义扩展

### 添加新的 TTS 声音

```typescript
// src/services/PiperService.ts
async loadVoice(voicePath: string) {
  const config = await fetch(voicePath + '.json');
  const model = await fetch(voicePath + '.onnx');
  // ... 加载逻辑
}
```

更多声音：https://huggingface.co/rhasspy/piper-voices

### 添加方言支持

```typescript
// 修改 Whisper 配置
await whisperService.initialize({
  language: 'zh-CN',  // 普通话
  // language: 'yue',  // 粤语
  // language: 'si',   // 四川话
});
```

### 添加语音命令

```typescript
// 在 startListening 回调中添加
await localVoiceService.startListening((text) => {
  if (text.includes('打开设置')) {
    setShowConfig(true);
  } else if (text.includes('关闭')) {
    localVoiceService.stopListening();
  }
});
```

---

## 📚 相关文档

- `LOCAL_VOICE_MODULE.md` - 完整 API 文档
- `VOICE_IMPLEMENTATION_SUMMARY.md` - 实现总结
- `../VOICE_IMPLEMENTATION_SUMMARY.md` - 项目总览

---

## 🎉 成功标志

当你看到以下现象时，说明集成成功：

✅ 配置面板显示"✅ 已初始化"
✅ 点击"测试 TTS"能听到声音
✅ 点击 🎙️ 按钮后说话能看到转录文字
✅ 3D 人物嘴型随声音开合
✅ CPU 占用 < 20%
✅ 无控制台错误

**恭喜！本地语音模块已完美集成！** 🎊
