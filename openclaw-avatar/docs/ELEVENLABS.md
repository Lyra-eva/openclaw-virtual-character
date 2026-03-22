# ElevenLabs TTS 集成指南

## 概述

[ElevenLabs](https://elevenlabs.io) 是目前最先进、最自然的 AI 语音合成服务，支持多语言（包括中文），声音情感丰富。

### 优势

- ✅ **超自然** - 接近真人发音，有情感起伏
- ✅ **多语言** - 支持中文、英文、日文等 29 种语言
- ✅ **多声音** - 8+ 预设声音，可自定义
- ✅ **低延迟** - 流式合成，快速响应
- ✅ **API 简单** - RESTful API，易于集成

### 劣势

- ⚠️ **付费** - 免费版每月 1 万字符，需订阅获取更多
- ⚠️ **需联网** - 云端服务，无法离线使用
- ⚠️ **API Key** - 需要注册获取

---

## 快速开始

### 1. 注册 ElevenLabs

1. 访问 [elevenlabs.io](https://elevenlabs.io)
2. 点击 "Sign Up" 注册账号
3. 验证邮箱

### 2. 获取 API Key

1. 登录后点击右上角头像
2. 选择 "Profile" → "API Key"
3. 复制 API Key (格式：`sk_...`)

### 3. 在应用中配置

1. 启动应用
2. 点击 ⚙️ 配置按钮
3. 在 "🔊 语音合成 (TTS)" 部分
4. 选择 **🎭 ElevenLabs**
5. 粘贴 API Key
6. 选择喜欢的声音
7. 点击 "保存配置"
8. 点击 "测试" 试听

---

## 声音选择

### 预设声音列表

| 声音 | ID | 描述 | 适合场景 |
|------|------|------|----------|
| **Bella** | `EXAVITQu4vr4xnSDxMaL` | 温柔女声，中文好 | **推荐 (默认)** |
| Domi | `AZnzlk1XvdvUeBnXmlld` | 活力女声 | 活泼对话 |
| Antoni | `ErXwobaYiN019PkySvjV` | 沉稳男声 | 专业场景 |
| Elli | `MF3mGyEYCl7XYWbV9V6O` | 年轻女声 | 轻松对话 |
| Josh | `TxGEqnHWrfWFTfGW9XjX` | 低沉男声 | 讲故事 |
| Arnold | `VR6AewLTigWG4xSOukaG` | 磁性男声 | 旁白 |
| Adam | `pNInz6obpgDQGcFmaJgB` | 专业男声 | 正式场合 |
| Sam | `yoZ06aMxZJJ28mfd3POQ` | 温暖男声 | 日常对话 |

### 如何选择

- **中文对话** → 推荐 **Bella** (中文支持最好)
- **英文对话** → 任意声音都支持
- **游戏角色** → 根据角色性格选择
- **旁白配音** → Arnold 或 Adam

---

## 定价方案

### 免费版 (Free)

- ✅ 每月 10,000 字符
- ✅ 3 个自定义声音
- ✅ 商用许可
- ❌ 无法使用高级功能

### 入门版 (Starter) - $5/月

- ✅ 每月 30,000 字符
- ✅ 10 个自定义声音
- ✅ 商用许可

### 创作者版 (Creator) - $22/月

- ✅ 每月 100,000 字符
- ✅ 30 个自定义声音
- ✅ 高级声音模型

### 专业版 (Pro) - $99/月

- ✅ 每月 500,000 字符
- ✅ 160 个自定义声音
- ✅ 最高优先级

### 用量估算

```
中文字符：每个汉字 = 1 字符
英文字符：每个单词 ≈ 1.3 字符

示例：
- 短句："你好，我是 AI 助手" = 9 字符
- 长句："今天天气真好，我们一起去公园玩吧" = 17 字符
- 段落：100 字中文 ≈ 100 字符

免费版每月可合成：
- 约 1000 句短句
- 或 约 600 句长句
- 或 约 10 万字中文
```

---

## 技术实现

### 架构

```
┌─────────────────────────────────────┐
│         TTSService                  │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Web Speech  │  │  ElevenLabs  │  │
│  │ API         │  │  Service     │  │
│  └─────────────┘  └──────────────┘  │
│         ↓                ↓           │
│  ┌────────────────────────────────┐ │
│  │   统一接口 speak(text)         │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 核心文件

```
src/services/
├── TTSService.ts           # 统一 TTS 接口 ⭐
├── ElevenLabsService.ts    # ElevenLabs 专用 ⭐
└── GatewayService.ts       # 使用 TTS 服务
```

### 代码示例

```typescript
import { ttsService } from '@/services/TTSService';

// 初始化
ttsService.initialize({
  engine: 'elevenlabs',
  elevenLabsApiKey: 'sk_your_api_key',
});

// 切换引擎
ttsService.setEngine('elevenlabs');

// 播放语音
await ttsService.speak('你好，我是 AI 助手');

// 选择声音
ttsService.setVoice('EXAVITQu4vr4xnSDxMaL'); // Bella

// 测试
const success = await ttsService.test();
```

### 高级参数

```typescript
await ttsService.speak('你好', {
  stability: 0.5,        // 稳定性 0-1，越高越稳定
  similarityBoost: 0.75, // 相似度增强 0-1
  style: 0.0,           // 风格化 0-1
  useSpeakerBoost: true, // 说话人增强
});
```

---

## 最佳实践

### 1. 中文优化

```typescript
// 使用 multilingual_v2 模型
model_id: 'eleven_multilingual_v2'

// 调整语速 (通过文本停顿)
text: '你好，[停顿 0.5s] 我是 AI 助手'
```

### 2. 性能优化

```typescript
// 预合成常用语句
const commonPhrases = [
  '你好',
  '有什么可以帮你的吗？',
  '请稍等',
];

// 提前合成并缓存
await Promise.all(
  commonPhrases.map(text => elevenLabsService.generateSpeech(text))
);
```

### 3. 错误处理

```typescript
try {
  await ttsService.speak(text);
} catch (error) {
  console.error('TTS failed:', error);
  // 降级到 Web Speech API
  ttsService.setEngine('web-speech');
  await ttsService.speak(text);
}
```

### 4. 用量监控

```typescript
// 定期检查剩余额度
const subscription = await elevenLabsService.getSubscription();
console.log('本月剩余字符:', subscription.character_limit - subscription.character_count);
```

---

## 常见问题

### Q: API Key 无效？

**A:** 
- 检查是否复制完整 (包含 `sk_` 前缀)
- 确认账号已验证邮箱
- 在官网测试 API Key 是否有效

### Q: 中文发音不标准？

**A:**
- 确保使用 `eleven_multilingual_v2` 模型
- 选择 Bella 声音 (中文支持最好)
- 调整 stability 参数 (0.4-0.6 较自然)

### Q: 延迟太高？

**A:**
- 使用流式合成 (已默认启用)
- 检查网络连接
- 考虑降级到 Web Speech API

### Q: 额度用完了？

**A:**
- 等待下月重置
- 升级到付费套餐
- 临时切换到 Web Speech API

### Q: 声音太机械？

**A:**
- 增加 style 参数 (0.3-0.5)
- 调整 stability (降低到 0.4)
- 使用更长的文本 (短句效果差)

---

## 对比测试

### Web Speech API vs ElevenLabs

| 维度 | Web Speech | ElevenLabs |
|------|------------|------------|
| 自然度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 中文支持 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 延迟 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 成本 | 免费 | 付费 |
| 离线 | ❌ | ❌ |
| 情感 | ⭐⭐ | ⭐⭐⭐⭐⭐ |

### 推荐场景

- **日常对话** → Web Speech (免费够用)
- **重要场景** → ElevenLabs (最佳体验)
- **演示展示** → ElevenLabs ( impress 用户)
- **开发测试** → Web Speech (节省额度)

---

## 参考资源

- [ElevenLabs 官网](https://elevenlabs.io)
- [API 文档](https://elevenlabs.io/docs/api-reference)
- [声音列表](https://elevenlabs.io/docs/speech-synthesis/voices)
- [定价页面](https://elevenlabs.io/pricing)
- [中文支持说明](https://elevenlabs.io/docs/speech-synthesis/languages)

---

## 下一步

- [ ] 支持声音克隆 (自定义声音)
- [ ] 支持情感控制 (开心/悲伤/愤怒)
- [ ] 支持语速调节
- [ ] 支持批量合成
- [ ] 本地缓存合成结果
