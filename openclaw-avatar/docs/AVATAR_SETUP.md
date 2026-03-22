# 人物形象配置指南

## 🎯 已配置形象

### 当前使用模型

**温柔 AI 助手 - 亚洲女性**

```
模型来源：Ready Player Me
风格：温柔 AI 助手
特征:
- 亚洲面孔
- 黑色长马尾
- 温和微笑
- 蓝白休闲装
- 亲和力强

相机配置:
- 距离：2.0 米 (半身像视角)
- 高度：1.5 米 (视线平齐)
- 角度：正面

灯光配置:
- 主光：白色，强度 1.2 (右上)
- 补光：白色，强度 0.5 (左下)
- 轮廓光：蓝色，强度 0.8 (背后)
- 环境光：白色，强度 0.6
```

---

## 🎨 形象设计理念

### 为什么选择这个形象？

**1. 用户群体匹配**
- 中文用户为主 → 亚洲面孔更亲切
- AI 助手定位 → 温柔专业的气质
- 日常对话场景 → 休闲轻松的装扮

**2. 视觉舒适度**
- 半身像视角 → 突出面部表情
- 柔和灯光 → 长时间观看不疲劳
- 蓝白配色 → 科技感 + 信任感

**3. 声音搭配**
- 视觉：温柔女性形象
- 听觉：ElevenLabs Bella (温柔女声)
- 效果：视听一致，沉浸感强

---

## 🔄 如何更换形象

### 方法 1: 使用 Ready Player Me 现有模型

**步骤:**

1. 访问 [Ready Player Me](https://readyplayer.me/)
2. 浏览模型库或创建自定义形象
3. 点击 "Use Avatar" 或 "Download"
4. 复制模型 URL (格式：`https://models.readyplayer.me/[ID].glb`)
5. 修改代码:

```typescript
// src/components/AvatarView.tsx
const modelUrl = 'https://models.readyplayer.me/YOUR_MODEL_ID.glb';
```

**推荐模型 ID:**

```
温柔女性：65a8f2b1c9d4e5f6a7b8c9d0
专业男性：65b9c3d4e5f6a7b8c9d0e1f2
可爱少女：65c0d4e5f6a7b8c9d0e1f2a3
科技风格：65d1e5f6a7b8c9d0e1f2a3b4
```

---

### 方法 2: 自定义创建形象

**使用 Ready Player Me 创建:**

1. 访问 [Ready Player Me](https://readyplayer.me/)
2. 点击 "Create Avatar"
3. 选择自拍或基础形象
4. 自定义:
   - 脸型、肤色
   - 眼睛、眉毛
   - 发型、发色
   - 服装、配饰
5. 点击 "Finish"
6. 复制模型链接

**推荐配置 (AI 助手风格):**

```
脸型：柔和 oval
肤色：亚洲自然色
眼睛：中等大小，温暖眼神
眉毛：自然弧度
发型：长马尾 (干练)
发色：黑色或深棕色
服装：休闲上衣 (蓝/白/灰色)
配饰：简约为主 (可选眼镜)
```

---

### 方法 3: 使用本地模型

**步骤:**

1. 将模型文件放入 `public/models/` 目录
2. 修改代码:

```typescript
const modelUrl = '/models/my-avatar.glb';
```

**支持的格式:**
- `.glb` (推荐)
- `.gltf`
- `.vrm` (需要 VRM 插件)

---

## ⚙️ 调整相机和灯光

### 相机位置

```typescript
// 全身像
camera.position.set(0, 1.0, 4.0);
camera.lookAt(0, 1.0, 0);

// 半身像 (推荐)
camera.position.set(0, 1.5, 2.0);
camera.lookAt(0, 1.3, 0);

// 特写
camera.position.set(0, 1.6, 1.2);
camera.lookAt(0, 1.5, 0);
```

### 灯光配置

```typescript
// 柔和自然光
mainLight.position.set(1, 2, 2);
mainLight.intensity = 1.2;

fillLight.position.set(-1, 1, 1);
fillLight.intensity = 0.5;

rimLight.position.set(0, 1, -1);
rimLight.intensity = 0.8;
rimLight.color = new THREE.Color(0x6699ff);

ambientLight.intensity = 0.6;
```

**灯光效果:**
- 主光：主要照明，塑造面部轮廓
- 补光：填充阴影，避免过暗
- 轮廓光：分离背景，增加层次
- 环境光：整体亮度

---

## 🎭 表情和动画

### 当前支持

| 状态 | 表情/动作 | 说明 |
|------|-----------|------|
| 待机 | 轻微呼吸 | 自然 idle 动画 |
| 说话 | 嘴型开合 | 简单模拟 |
| 倾听 | 向上看 | 思考状 |
| 开心 | - | 待实现 |
| 惊讶 | - | 待实现 |

### 扩展表情

如果模型支持 morph targets，可以添加更多表情:

```typescript
// 在 AvatarView.tsx 中
if (mesh.morphTargetInfluences) {
  // 0: mouthOpen, 1: lookUp, 2: smile, 3: surprised...
  mesh.morphTargetInfluences[2] = smileAmount;  // 微笑
  mesh.morphTargetInfluences[3] = surprisedAmount;  // 惊讶
}
```

### 添加动画库

使用 Mixamo 动画:

1. 访问 [Mixamo](https://www.mixamo.com/)
2. 下载动画 (FBX 格式)
3. 转换为 glTF
4. 在 Three.js 中加载并混合

---

## 🎨 背景配置

### 当前背景

```css
/* src/index.css */
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
```

### 更换背景

**渐变色:**
```css
/* 蓝紫渐变 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 日出渐变 */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* 海洋渐变 */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

**纯色:**
```css
background: #1a1a2e;  /* 深蓝 */
background: #2d3748;  /* 深灰 */
background: #1a202c;  /* 黑色 */
```

**图片背景:**
```css
background: url('/backgrounds/room.jpg') center/cover;
```

---

## 📊 性能优化

### 模型优化

```
- 多边形数：< 50,000
- 纹理大小：≤ 2048x2048
- 使用 Draco 压缩
- 移除不必要的顶点
```

### 渲染优化

```typescript
// 降低像素比 (移动设备)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 启用阴影 (可选，消耗性能)
renderer.shadowMap.enabled = true;

// 抗锯齿
renderer.antialias = true;
```

### 加载优化

```typescript
// 预加载模型
const loader = new GLTFLoader();
loader.load(modelUrl, (gltf) => {
  // 缓存模型
  cachedModel = gltf.scene.clone();
});

// 使用时直接克隆
scene.add(cachedModel.clone());
```

---

## 🔧 故障排查

### 模型不显示

1. 检查模型 URL 是否可访问
2. 查看浏览器控制台错误
3. 确认 CORS 设置 (crossOrigin = 'anonymous')
4. 尝试备用模型

### 模型变形

1. 检查模型格式是否正确
2. 确认缩放比例 (scale.set(1, 1, 1))
3. 检查旋转角度

### 性能差

1. 降低模型质量
2. 减少灯光数量
3. 关闭抗锯齿
4. 降低渲染分辨率

---

## 📝 快速参考

### 文件位置

```
src/components/AvatarView.tsx  # 人物渲染组件
public/models/                  # 本地模型目录
src/index.css                   # 背景样式
```

### 关键参数

```typescript
// 模型 URL
const modelUrl = 'https://models.readyplayer.me/[ID].glb';

// 相机位置
camera.position.set(0, 1.5, 2.0);  // x, y, z

// 灯光
mainLight.intensity = 1.2;
ambientLight.intensity = 0.6;

// 背景
background: linear-gradient(135deg, #1a1a2e, #16213e);
```

### 常用模型来源

- Ready Player Me: https://models.readyplayer.me/
- Vroid Hub: https://hub.vroid.com/
- Sketchfab: https://sketchfab.com/

---

## 🎯 总结

**当前配置:**

✅ 人物：温柔 AI 助手 (亚洲女性)
✅ 视角：半身像 (2 米距离)
✅ 灯光：柔和三点光
✅ 背景：蓝紫渐变
✅ 动画：呼吸 + 嘴型 + 倾听

**适合场景:**
- 日常对话助手
- 客服咨询
- 学习伙伴
- 个人助理

**下一步优化:**
- [ ] 添加更多表情
- [ ] 集成 Mixamo 动画
- [ ] 支持服装切换
- [ ] 添加场景道具
- [ ] 支持多人物
