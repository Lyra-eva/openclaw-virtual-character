/**
 * 表情系统类型定义
 */

export type EmotionType = 
  | 'neutral'    // 中性
  | 'happy'      // 开心
  | 'sad'        // 悲伤
  | 'surprised'  // 惊讶
  | 'angry'      // 生气
  | 'thinking'   // 思考
  | 'listening'  // 倾听
  | 'excited';   // 兴奋

export interface EmotionConfig {
  // 嘴型 (aa: 张嘴 0-1)
  mouthOpen: number;
  // 微笑 (smile: 0-1)
  smile: number;
  // 眼睛 (blink: 眨眼，wide: 睁大)
  eyes: {
    blink: number;
    wide: number;
  };
  // 眉毛 (brow: 上扬/下垂 -1 到 1)
  brows: number;
  // 脸颊 (puff: 鼓腮 0-1)
  cheek: number;
  // 持续时间 (毫秒)
  duration?: number;
  // 过渡时间 (毫秒)
  transition?: number;
}

/**
 * 表情配置库
 */
export const EMOTION_CONFIGS: Record<EmotionType, EmotionConfig> = {
  neutral: {
    mouthOpen: 0,
    smile: 0.2,
    eyes: { blink: 0.3, wide: 0 },
    brows: 0,
    cheek: 0,
    duration: undefined,
    transition: 300,
  },
  
  happy: {
    mouthOpen: 0.4,
    smile: 0.9,
    eyes: { blink: 0.2, wide: 0.3 },
    brows: 0.2,
    cheek: 0.6,
    duration: undefined,
    transition: 300,
  },
  
  sad: {
    mouthOpen: 0,
    smile: 0,
    eyes: { blink: 0.4, wide: 0 },
    brows: -0.5,
    cheek: 0,
    duration: undefined,
    transition: 400,
  },
  
  surprised: {
    mouthOpen: 0.8,
    smile: 0,
    eyes: { blink: 0, wide: 0.9 },
    brows: 0.7,
    cheek: 0,
    duration: 2000,
    transition: 200,
  },
  
  angry: {
    mouthOpen: 0.3,
    smile: 0,
    eyes: { blink: 0.1, wide: 0.4 },
    brows: -0.7,
    cheek: 0.3,
    duration: undefined,
    transition: 250,
  },
  
  thinking: {
    mouthOpen: 0,
    smile: 0.1,
    eyes: { blink: 0.2, wide: 0 },
    brows: -0.2,
    cheek: 0,
    duration: undefined,
    transition: 300,
  },
  
  listening: {
    mouthOpen: 0,
    smile: 0.3,
    eyes: { blink: 0.3, wide: 0.2 },
    brows: 0.1,
    cheek: 0.2,
    duration: undefined,
    transition: 200,
  },
  
  excited: {
    mouthOpen: 0.7,
    smile: 1.0,
    eyes: { blink: 0, wide: 0.7 },
    brows: 0.5,
    cheek: 0.8,
    duration: undefined,
    transition: 250,
  },
};

/**
 * 情绪关键词映射 (用于文本情绪检测)
 */
export const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  neutral: ['好的', '收到', '明白', '可以', '嗯'],
  happy: ['哈哈', '嘻嘻', '太好了', '开心', '棒', '好耶', '！', '！'],
  sad: ['难过', '伤心', '遗憾', '抱歉', '对不起', '可惜', '唉'],
  surprised: ['哇', '天啊', '真的吗', '没想到', '居然', '竟然'],
  angry: ['生气', '讨厌', '烦', '可恶', '混蛋'],
  thinking: ['嗯...', '让我想想', '思考', '可能', '也许', '大概', '...'],
  listening: [],
  excited: ['太棒了', '超级', '非常', '极其', '特别', '哇塞', '！！！'],
};
