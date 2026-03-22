# OpenClaw Avatar 🎮

OpenClaw 游戏化前端 - 虚拟人物 + 语音交互桌面应用

## 技术栈

- **前端框架**: React 18 + Vite + TypeScript
- **3D 渲染**: Three.js + @pixiv/three-vrm
- **桌面框架**: Tauri v2 (Mac/Windows/Linux)
- **状态管理**: Zustand
- **动画**: Framer Motion
- **样式**: TailwindCSS
- **语音识别**: 
  - Web Speech API (在线，免费)
  - **Whisper.cpp WASM (离线，高精度)** ⭐
- **语音合成**: 
  - Web Speech API (在线，免费)
  - **ElevenLabs (超自然，付费)** ⭐
  - OpenClaw TTS

## 功能

### 🎭 3D 虚拟人物
- ✅ **温柔 AI 助手形象** (亚洲女性) ⭐
- ✅ Ready Player Me 专业模型
- ✅ **表情系统** (8 种情绪自动检测) ⭐
- ✅ **手势系统** (10+ 种语境手势) ⭐
- ✅ 呼吸/嘴型/倾听动画
- ✅ 视线跟踪模拟

### 🎤 语音交互
- ✅ **语音唤醒** (无需点击，说"Bella"即可) ⭐
- ✅ **全双工对话** (AI 说话时可直接打断) ⭐
- ✅ 语音识别 (STT)
  - Web Speech API (在线)
  - **Whisper.cpp 离线识别** ⭐
- ✅ 语音合成 (TTS)
  - Web Speech API (免费)
  - **ElevenLabs 超自然语音** ⭐
- ✅ 口型精确同步 (实时音频分析)

### 💬 界面系统
- ✅ 对话气泡 UI (打字机效果)
- ✅ 实时语音转录
- ✅ 游戏化 HUD (等级/经验/亲密度)
- ✅ WebSocket 连接 OpenClaw Gateway
- ✅ 双引擎切换 (STT/TTS)
- ✅ 高级交互设置 (VAD 灵敏度/唤醒词)

## 快速开始

### 1. 环境要求

- Node.js 18+
- Rust (Tauri 需要)
- macOS 10.15+ (或其他支持 Tauri 的系统)

安装 Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. 安装依赖

```bash
cd openclaw-avatar
npm install
```

### 3. 下载 Whisper 模型 (离线语音)

```bash
# 下载 Base 模型 (142MB，推荐)
npm run download-whisper base

# 其他模型选项
npm run download-whisper tiny    # 75MB，最快，精度一般
npm run download-whisper small   # 466MB，高精度
npm run download-whisper medium  # 1.5GB，极高精度
```

模型会下载到 `public/whisper/` 目录。

### 4. 开发模式

```bash
# 网页版开发
npm run dev

# Tauri 桌面应用开发 (Mac)
npm run tauri:dev
```

### 4. 构建发布

```bash
# 构建 Mac 应用
npm run tauri:build
```

构建产物在 `src-tauri/target/release/bundle/`

## 配置

### OpenClaw Gateway 配置

确保 OpenClaw Gateway 已启动并配置了 WebSocket 访问：

```json5
{
  gateway: {
    bind: "loopback",  // 或 "tailnet" 远程访问
    port: 18789,
    auth: { 
      mode: "token", 
      token: "your-token" 
    }
  }
}
```

### 应用设置

首次运行会弹出配置面板：

- **Gateway WebSocket 地址**: `ws://localhost:18789` (本地) 或远程地址
- **Gateway Token**: 从 OpenClaw 配置获取

## 项目结构

```
openclaw-avatar/
├── src/
│   ├── components/       # React 组件
│   │   ├── AvatarView    # 3D 人物
│   │   ├── ChatPanel     # 对话面板
│   │   ├── ChatBubble    # 气泡组件
│   │   └── HUD           # 游戏化状态
│   ├── services/         # 服务层
│   │   ├── GatewayService # WebSocket 通信
│   │   └── VoiceService   # 语音识别
│   ├── stores/           # 状态管理
│   │   └── useAppStore.ts
│   ├── types/            # TypeScript 类型
│   └── assets/           # 静态资源
├── src-tauri/            # Tauri 后端 (Rust)
│   ├── src/
│   ├── icons/
│   └── tauri.conf.json
└── package.json
```

## 下一步开发

### Phase 1 (已完成) ✅
- [x] 项目脚手架
- [x] 3D 人物基础展示
- [x] WebSocket 连接
- [x] 语音识别
- [x] 对话气泡 UI

### Phase 2 (待开发)
- [ ] 自定义 VRM 模型加载
- [ ] 嘴型同步优化
- [ ] Whisper.cpp 集成 (离线 STT)
- [ ] ElevenLabs TTS 集成
- [ ] 更多表情和动作

### Phase 3 (游戏化)
- [ ] 成就系统
- [ ] 多场景切换
- [ ] 服装/道具系统
- [ ] 日常任务

## 自定义人物

### 使用 Ready Player Me

1. 访问 [Ready Player Me](https://readyplayer.me/)
2. 创建你的虚拟形象
3. 导出为 GLB/VRM 格式
4. 替换 `AvatarView.tsx` 中的 `modelUrl`

### 使用 Vroid Studio

1. 下载 [Vroid Studio](https://vroid.com/)
2. 创建 3D 角色
3. 导出为 VRM 格式
4. 将模型文件放入 `src/assets/` 目录
5. 修改加载路径

## 故障排查

### 语音识别不工作

**Web Speech API:**
- 确保使用 Chrome/Edge 浏览器 (Web Speech API 支持)
- 检查浏览器权限设置，允许麦克风访问
- macOS 需要在 系统设置 → 隐私 → 麦克风 中授权

**Whisper 离线识别:**
- 确保已下载模型文件：`npm run download-whisper base`
- 检查 `public/whisper/` 目录是否有模型文件
- 首次加载可能需要几秒钟初始化模型

### 连接 Gateway 失败

- 确认 Gateway 已启动：`openclaw gateway status`
- 检查防火墙是否开放 18789 端口
- 远程访问需要使用 Tailscale 或配置公网 IP

### 3D 模型加载失败

- 检查网络连接 (示例模型来自 readyplayer.me)
- 本地模型需要放在 public 目录或使用正确路径
- 查看浏览器控制台错误信息

## 许可证

MIT

---

🦞 Built with OpenClaw
