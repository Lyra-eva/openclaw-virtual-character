# 🚀 快速启动指南

## 5 分钟上手

### 第一步：安装依赖 (2 分钟)

```bash
cd /home/admin/.openclaw/workspace/openclaw-avatar

# 安装 Node.js 依赖
npm install

# 确保 Rust 已安装 (Tauri 需要)
rustc --version
# 如果没有，运行：
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 第二步：下载 Whisper 模型 (1 分钟)

```bash
# 下载 Base 模型 (推荐)
npm run download-whisper base

# 或下载 Tiny 模型 (更快)
npm run download-whisper tiny
```

### 第三步：配置 ElevenLabs (可选，1 分钟)

1. 访问 [elevenlabs.io](https://elevenlabs.io) 注册
2. 获取 API Key (Profile → API Key)
3. 在应用配置中粘贴

### 第四步：启动 OpenClaw Gateway (1 分钟)

```bash
# 检查 Gateway 状态
openclaw gateway status

# 如果没启动
openclaw gateway start
```

### 第五步：运行应用 (1 分钟)

```bash
# 网页版开发
npm run dev
# 访问 http://localhost:1420

# 或 Tauri Mac 应用
npm run tauri:dev
```

---

## 首次使用

### 1. 配置连接

应用启动后会弹出配置面板：

- **Gateway 地址**: `ws://localhost:18789`
- **Token**: 从 `~/.openclaw/config.json` 获取

### 2. 选择语音引擎

- **☁️ Web Speech** - 在线，免费，需要网络
- **🧠 Whisper 离线** - 离线，高精度，已下载模型

### 3. 开始对话

1. 点击 🎙️ 麦克风按钮
2. 说话
3. 点击停止
4. AI 自动回复 + TTS 播放

---

## 常用命令

```bash
# 开发
npm run dev          # 网页版
npm run tauri:dev    # Mac 应用

# 构建
npm run build        # 网页构建
npm run tauri:build  # Mac 应用打包

# 模型下载
npm run download-whisper tiny
npm run download-whisper base
npm run download-whisper small
```

---

## 文件位置

```
openclaw-avatar/
├── public/whisper/        # Whisper 模型文件
├── src/
│   ├── components/        # UI 组件
│   ├── services/          # 服务层
│   └── stores/            # 状态管理
├── src-tauri/             # Tauri 后端
└── docs/
    └── WHISPER.md         # 详细文档
```

---

## 遇到问题？

### 连接失败
```bash
openclaw gateway status
openclaw gateway restart
```

### 模型下载慢
```bash
# 使用镜像
export HF_ENDPOINT=https://hf-mirror.com
npm run download-whisper base
```

### 语音识别不工作
- 检查麦克风权限
- 切换语音引擎试试
- 查看浏览器控制台

---

## 下一步

- 📖 阅读完整文档：`README.md`
- 🧠 了解 Whisper：`docs/WHISPER.md`
- 🎨 自定义人物：修改 `src/components/AvatarView.tsx`
- ⚙️ 调整配置：`src-tauri/tauri.conf.json`

---

🎉 Have fun!
