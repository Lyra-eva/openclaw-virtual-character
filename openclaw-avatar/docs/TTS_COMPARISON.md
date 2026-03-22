# TTS 引擎对比指南

## 快速选择

| 需求 | 推荐引擎 |
|------|----------|
| **最佳体验** | 🎭 ElevenLabs |
| **免费够用** | ☁️ Web Speech |
| **离线使用** | ❌ 都不支持 (需本地 TTS) |
| **中文优先** | 🎭 ElevenLabs (Bella 声音) |
| **开发测试** | ☁️ Web Speech |
| **商用场景** | 🎭 ElevenLabs (付费版) |

---

## 详细对比

### ☁️ Web Speech API

**优点:**
- ✅ 完全免费
- ✅ 浏览器原生，无需配置
- ✅ 零延迟 (本地合成)
- ✅ 支持离线 (部分浏览器)

**缺点:**
- ❌ 声音机械，不够自然
- ❌ 中文发音一般
- ❌ 无法自定义声音
- ❌ 浏览器支持不一致

**适合场景:**
- 开发测试
- 日常对话
- 预算有限
- 离线环境

**配置:**
```typescript
ttsService.setEngine('web-speech');
// 无需额外配置
```

---

### 🎭 ElevenLabs

**优点:**
- ✅ 超自然，接近真人
- ✅ 中文支持优秀 (Bella 声音)
- ✅ 8+ 种声音可选
- ✅ 情感丰富，有起伏
- ✅ 流式合成，低延迟

**缺点:**
- ❌ 付费 (免费版 1 万字符/月)
- ❌ 需要联网
- ❌ 需要 API Key

**适合场景:**
- 正式产品
- 演示展示
- 高质量要求
- 商用场景

**配置:**
```typescript
ttsService.setEngine('elevenlabs');
ttsService.setElevenLabsKey('sk_your_api_key');
ttsService.setVoice('EXAVITQu4vr4xnSDxMaL'); // Bella
```

**价格:**
- 免费：10,000 字符/月
- Starter：$5/月 (30,000 字符)
- Creator：$22/月 (100,000 字符)
- Pro：$99/月 (500,000 字符)

---

## 实测对比

### 测试文本
```
"你好，我是你的 AI 助手。今天有什么可以帮你的吗？"
```

### 自然度评分 (1-5 星)

| 引擎 | 自然度 | 中文 | 情感 | 总体 |
|------|--------|------|------|------|
| Web Speech | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| ElevenLabs | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### 延迟对比

| 引擎 | 首字延迟 | 合成速度 |
|------|----------|----------|
| Web Speech | ~50ms | 实时 |
| ElevenLabs | ~300ms | 流式 |

### 成本对比 (每月 10 万字)

| 引擎 | 月成本 | 年成本 |
|------|--------|--------|
| Web Speech | ¥0 | ¥0 |
| ElevenLabs | ¥160 ($22) | ¥1920 |

---

## 使用建议

### 开发阶段

```typescript
// 使用 Web Speech，节省 ElevenLabs 额度
ttsService.setEngine('web-speech');
```

### 生产环境

```typescript
// 默认 ElevenLabs，提供最佳体验
ttsService.setEngine('elevenlabs');

// 降级策略
try {
  await ttsService.speak(text);
} catch (error) {
  // ElevenLabs 失败，降级到 Web Speech
  ttsService.setEngine('web-speech');
  await ttsService.speak(text);
}
```

### 混合使用

```typescript
// 根据场景选择
if (isImportantMessage) {
  ttsService.setEngine('elevenlabs');
} else {
  ttsService.setEngine('web-speech');
}
await ttsService.speak(text);
```

---

## 声音示例

### Web Speech API

- 中文：系统默认声音 (Siri 或类似)
- 英文：系统默认声音
- 特点：机械，平调，无情感

### ElevenLabs

**推荐声音:**

1. **Bella** (默认)
   - 温柔女声
   - 中文支持最好
   - 适合：日常对话、助手

2. **Antoni**
   - 沉稳男声
   - 专业感强
   - 适合：正式场合、新闻

3. **Elli**
   - 年轻女声
   - 活泼可爱
   - 适合：游戏、娱乐

4. **Josh**
   - 低沉男声
   - 磁性有魅力
   - 适合：讲故事、旁白

---

## 优化技巧

### Web Speech API

```typescript
// 调整语速
utterance.rate = 0.9; // 稍慢，更清晰

// 调整音调
utterance.pitch = 1.0; // 正常

// 调整音量
utterance.volume = 1.0; // 最大
```

### ElevenLabs

```typescript
// 优化中文发音
await ttsService.speak(text, {
  stability: 0.5,        // 中等稳定性
  similarityBoost: 0.75, // 增强相似度
  style: 0.3,           // 少量风格化
  useSpeakerBoost: true, // 增强说话人特征
});

// 添加停顿 (在文本中)
text = "你好，[停顿 0.5s] 我是 AI 助手"
```

---

## 故障排查

### Web Speech API 不工作

1. 检查浏览器支持 (Chrome/Edge 最佳)
2. 检查系统音量
3. 尝试其他浏览器

### ElevenLabs 不工作

1. 检查 API Key 是否正确
2. 检查网络连接
3. 检查剩余额度
4. 查看控制台错误信息

### 声音太小

- Web Speech: 调整 `volume` 参数
- ElevenLabs: 调整系统音量或音频增益

### 语速不合适

- Web Speech: 调整 `rate` 参数 (0.1-10)
- ElevenLabs: 在文本中添加停顿标记

---

## 总结

| 维度 | Web Speech | ElevenLabs | 胜者 |
|------|------------|------------|------|
| 自然度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ElevenLabs |
| 成本 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Web Speech |
| 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Web Speech |
| 中文支持 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ElevenLabs |
| 可定制性 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ElevenLabs |

**最终推荐:**

- **预算充足** → ElevenLabs (最佳体验)
- **预算有限** → Web Speech (免费够用)
- **混合方案** → 重要场景用 ElevenLabs，日常用 Web Speech

---

## 参考链接

- [ElevenLabs 官网](https://elevenlabs.io)
- [Web Speech API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [ElevenLabs 定价](https://elevenlabs.io/pricing)
- [声音演示](https://elevenlabs.io/text-to-speech)
