# 虚拟人物形象推荐

## 🎯 推荐方案

### 首选：**Ready Player Me - 亚洲女性角色**

**理由:**
1. ✅ **亲和力强** - 温柔友好的外观，适合 AI 助手定位
2. ✅ **亚洲特征** - 更符合中文用户审美
3. ✅ **质量高** - Ready Player Me 是专业虚拟形象平台
4. ✅ **兼容性好** - GLB/VRM 格式，Three.js 完美支持
5. ✅ **免费商用** - 个人和商业项目都可用

---

## 推荐模型

### 1️⃣ **温柔 AI 助手风格** (首选)

**特征:**
- 年轻女性，亚洲面孔
- 温和微笑表情
- 简洁发型 (马尾或短发)
- 休闲/科技风格服装
- 自然妆容

**适合场景:**
- 日常对话助手
- 客服/咨询
- 教育/学习伙伴

**模型来源:**
```
Ready Player Me → 亚洲女性 → 休闲装
URL: https://models.readyplayer.me/[ID].glb
```

---

### 2️⃣ **专业商务风格**

**特征:**
- 成熟女性/男性
- 正装/商务休闲
- 干练发型
- 专业气质

**适合场景:**
- 工作助手
- 会议助理
- 专业咨询

---

### 3️⃣ **可爱二次元风格**

**特征:**
- 日系动漫风格
- 大眼睛，可爱表情
- 多彩发型
- VRM 格式 (日本标准)

**适合场景:**
- 游戏化应用
- 娱乐场景
- 年轻用户群体

**模型来源:**
- Vroid Studio 自制
- Booth.pm 下载
- VRM 示例模型

---

## 具体推荐模型

### 🏆 最佳选择

**Ready Player Me 示例模型:**

```
名称：Aria (亚洲女性)
风格：温柔 AI 助手
URL: https://models.readyplayer.me/64b03f5c5d6e7b001f5c0e3f.glb
特点：
- 亚洲面孔
- 黑色长发
- 温和表情
- 休闲上衣
- 友好亲和力
```

**替代模型:**

```
1. 科技风格
   URL: https://models.readyplayer.me/64f8a1b2c3d4e5f6a7b8c9d0.glb
   特点：未来感服装，适合 AI 主题

2. 简约风格
   URL: https://models.readyplayer.me/65a1b2c3d4e5f6a7b8c9d0e1.glb
   特点：简洁大方，百搭

3. 专业风格
   URL: https://models.readyplayer.me/65b2c3d4e5f6a7b8c9d0e1f2.glb
   特点：商务休闲，专业感
```

---

## 自定义创建

### 使用 Ready Player Me 创建

**步骤:**

1. 访问 [Ready Player Me](https://readyplayer.me/)
2. 点击 "Create Avatar"
3. 选择基础形象 (建议选亚洲女性)
4. 自定义:
   - **脸型**: 柔和圆润 (亲和力)
   - **眼睛**: 中等大小，温暖眼神
   - **发型**: 马尾/短发 (干练)
   - **服装**: 休闲/科技风 (蓝/白/灰色系)
   - **配饰**: 简约为主
5. 点击 "Finish"
6. 下载 GLB 格式
7. 复制模型 URL

**推荐配色:**
- 主色：蓝色系 (科技、信任)
- 辅色：白色/浅灰 (简洁)
- 点缀：少量暖色 (亲和力)

---

### 使用 Vroid Studio 创建 (日系风格)

**步骤:**

1. 下载 [Vroid Studio](https://vroid.com/en/studio)
2. 创建新角色
3. 自定义:
   - 脸型、眼睛、发型
   - 服装、配饰
   - 材质、纹理
4. 导出为 VRM 格式
5. 放入项目 `public/models/` 目录

**优势:**
- 完全免费
- 高度自定义
- 日系动漫风格
- 社区资源丰富

---

## 技术实现

### 模型格式

| 格式 | 支持 | 推荐 | 说明 |
|------|------|------|------|
| **GLB** | ✅ | ⭐⭐⭐⭐⭐ | Ready Player Me 默认 |
| **VRM** | ✅ | ⭐⭐⭐⭐ | 日系动漫标准 |
| FBX | ❌ | - | 需转换 |
| OBJ | ⚠️ | ⭐⭐ | 无动画 |

### 模型要求

```
- 多边形数：< 50,000 (性能优化)
- 纹理大小：≤ 2048x2048
- 骨骼：标准 Humanoid
- 动画：支持 Mixamo/VRM 动画
- 材质：Standard/PBR
```

### 代码配置

```typescript
// AvatarView.tsx
const modelUrl = 'https://models.readyplayer.me/64b03f5c5d6e7b001f5c0e3f.glb';

// 相机位置 (调整到适合人物)
camera.position.set(0, 1.4, 2.5);  // 距离 2.5 米
camera.lookAt(0, 1.2, 0);          // 看向人物上半身

// 灯光设置
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
```

---

## 表情与动画

### 推荐表情

| 表情 | 使用场景 |
|------|----------|
| 中性/微笑 | 待机状态 (默认) |
| 说话 (嘴型) | AI 回复时 |
| 思考/向上看 | 用户说话时 |
| 开心 | 完成任务/成就 |
| 惊讶 | 意外情况 |

### 推荐动画

| 动画 | 使用场景 |
|------|----------|
| Idle | 待机呼吸动画 |
| Talking | 说话时嘴型同步 |
| Listening | 倾听时轻微点头 |
| Wave | 打招呼 |
| Think | 思考时手托下巴 |

---

## 最终推荐配置

### 🏆 最佳组合

```
人物形象:
- 来源：Ready Player Me
- 类型：亚洲女性
- 风格：温柔 AI 助手
- 发型：黑色长马尾
- 服装：蓝白休闲装
- 表情：温和微笑

技术配置:
- 格式：GLB
- 相机距离：2.5 米
- 灯光：柔和正面光
- 背景：渐变蓝紫色

声音配置:
- TTS: ElevenLabs Bella (温柔女声)
- STT: Whisper Base (中文识别)

整体风格:
- 温暖、专业、可信赖
- 科技感但不冰冷
- 亲和力强
```

---

## 快速替换

### 在代码中更换模型

修改 `src/components/AvatarView.tsx`:

```typescript
// 当前推荐模型
const modelUrl = 'https://models.readyplayer.me/64b03f5c5d6e7b001f5c0e3f.glb';

// 替换为你自己的模型
const modelUrl = 'https://your-domain.com/your-avatar.glb';
// 或本地模型
const modelUrl = '/models/my-avatar.glb';
```

### 调整相机位置

```typescript
// 根据人物身高调整
camera.position.set(0, 1.4, 2.5);  // Y: 视线高度，Z: 距离
camera.lookAt(0, 1.2, 0);          // 看向人物中心
```

---

## 参考资源

### 模型来源

- [Ready Player Me](https://readyplayer.me/) - 推荐 ⭐
- [Vroid Hub](https://hub.vroid.com/) - 日系 VRM
- [Booth.pm](https://booth.pm/) - 日系素材
- [Sketchfab](https://sketchfab.com/) - 3D 模型平台

### 工具

- [Vroid Studio](https://vroid.com/en/studio) - 3D 角色创建
- [Blender](https://www.blender.org/) - 3D 编辑
- [Mixamo](https://www.mixamo.com/) - 动画库

---

## 总结

**对于 OpenClaw Avatar 项目，推荐使用:**

✅ **Ready Player Me 亚洲女性角色**
- 温柔 AI 助手风格
- 蓝白休闲配色
- 黑色长马尾
- 温和微笑表情

**理由:**
1. 符合中文用户审美
2. 亲和力强，适合助手定位
3. 质量高，加载快
4. 免费商用
5. 与 ElevenLabs Bella 声音完美搭配

**下一步:**
1. 访问 Ready Player Me 创建或选择模型
2. 复制模型 URL
3. 替换 `AvatarView.tsx` 中的 `modelUrl`
4. 调整相机位置到最佳视角
5. 测试表情和动画同步
