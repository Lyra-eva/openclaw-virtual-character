/**
 * 手势服务
 * 根据语境自动选择并播放手势动画
 */

export type GestureType =
  | 'wave'         // 挥手
  | 'point'        // 指点
  | 'thumbsUp'     // 点赞
  | 'clap'         // 鼓掌
  | 'shrug'        // 耸肩
  | 'thinking'     // 托腮思考
  | 'welcome'      // 欢迎
  | 'goodbye'      // 告别
  | 'nod'          // 点头
  | 'shake';       // 摇头

export interface GestureConfig {
  name: GestureType;
  label: string;
  duration: number; // 毫秒
  blendTime: number; // 过渡时间
}

export const GESTURE_CONFIGS: Record<GestureType, GestureConfig> = {
  wave: { name: 'wave', label: '挥手', duration: 1500, blendTime: 300 },
  point: { name: 'point', label: '指点', duration: 1000, blendTime: 200 },
  thumbsUp: { name: 'thumbsUp', label: '点赞', duration: 1200, blendTime: 300 },
  clap: { name: 'clap', label: '鼓掌', duration: 2000, blendTime: 300 },
  shrug: { name: 'shrug', label: '耸肩', duration: 1500, blendTime: 300 },
  thinking: { name: 'thinking', label: '思考', duration: 2000, blendTime: 400 },
  welcome: { name: 'welcome', label: '欢迎', duration: 1500, blendTime: 300 },
  goodbye: { name: 'goodbye', label: '告别', duration: 1500, blendTime: 300 },
  nod: { name: 'nod', label: '点头', duration: 800, blendTime: 200 },
  shake: { name: 'shake', label: '摇头', duration: 800, blendTime: 200 },
} as const;

export const NONE_GESTURE: GestureConfig = { name: null as any, label: '无', duration: 0, blendTime: 0 };

export class GestureService {
  private currentGesture: GestureType = null;
  private isPlaying = false;
  private gestureQueue: GestureType[] = [];
  
  /**
   * 根据文本选择手势
   */
  selectGesture(text: string): GestureType {
    const lowerText = text.toLowerCase();
    
    // 问候语
    if (lowerText.includes('你好') || lowerText.includes('嗨') || lowerText.includes('hello')) {
      return 'wave';
    }
    
    // 欢迎
    if (lowerText.includes('欢迎') || lowerText.includes('到来')) {
      return 'welcome';
    }
    
    // 告别
    if (lowerText.includes('再见') || lowerText.includes('拜拜') || lowerText.includes('bye')) {
      return 'goodbye';
    }
    
    // 指点
    if (lowerText.includes('这个') || lowerText.includes('那个') || lowerText.includes('这里') || lowerText.includes('那里')) {
      return 'point';
    }
    
    // 点赞/同意
    if (lowerText.includes('好的') || lowerText.includes('没问题') || lowerText.includes('棒') || lowerText.includes('赞')) {
      return 'thumbsUp';
    }
    
    // 鼓掌
    if (lowerText.includes('恭喜') || lowerText.includes('厉害') || lowerText.includes('佩服')) {
      return 'clap';
    }
    
    // 思考
    if (lowerText.includes('让我想想') || lowerText.includes('思考') || lowerText.includes('嗯...')) {
      return 'thinking';
    }
    
    // 耸肩/不确定
    if (lowerText.includes('不知道') || lowerText.includes('可能') || lowerText.includes('也许')) {
      return 'shrug';
    }
    
    // 点头 (肯定)
    if (lowerText.includes('是的') || lowerText.includes('对') || lowerText.includes('正确')) {
      return 'nod';
    }
    
    // 摇头 (否定)
    if (lowerText.includes('不是') || lowerText.includes('不对') || lowerText.includes('错误')) {
      return 'shake';
    }
    
    return null;
  }
  
  /**
   * 播放手势
   */
  async playGesture(gesture: GestureType, onComplete?: () => void): Promise<void> {
    if (!gesture || this.isPlaying) {
      // 加入队列
      if (gesture) {
        this.gestureQueue.push(gesture);
      }
      return;
    }
    
    this.isPlaying = true;
    this.currentGesture = gesture;
    
    const config = GESTURE_CONFIGS[gesture];
    console.log('[Gesture] Playing:', config.label);
    
    // 等待手势完成
    await new Promise(resolve => setTimeout(resolve, config.duration));
    
    this.isPlaying = false;
    this.currentGesture = null;
    
    // 播放队列中的下一个
    if (this.gestureQueue.length > 0) {
      const nextGesture = this.gestureQueue.shift();
      if (nextGesture) {
        this.playGesture(nextGesture, onComplete);
      }
    } else if (onComplete) {
      onComplete();
    }
  }
  
  /**
   * 立即停止当前手势
   */
  stopGesture() {
    this.gestureQueue = [];
    this.isPlaying = false;
    this.currentGesture = null;
    console.log('[Gesture] Stopped');
  }
  
  /**
   * 获取当前手势
   */
  getCurrentGesture(): GestureType {
    return this.currentGesture;
  }
  
  /**
   * 获取状态
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentGesture: this.currentGesture,
      queueLength: this.gestureQueue.length,
    };
  }
}

export const gestureService = new GestureService();
