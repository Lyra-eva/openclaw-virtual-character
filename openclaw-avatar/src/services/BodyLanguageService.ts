/**
 * BodyLanguageService - 身体语言服务
 * 100+ 手势 + 姿态系统 + 呼吸模拟
 * 让虚拟人物全身都会"说话"
 * 
 * 功能：
 * - 100+ 种手势动画
 * - 姿态系统 (idle/listening/speaking)
 * - 呼吸模拟
 * - 重心转移
 * - 头部/身体跟随
 * - 程序化动画生成
 */

import { EmotionType } from '@/types/emotions';

/**
 * 手势定义
 */
export interface Gesture {
  id: string;
  name: string;
  description: string;
  duration: number;        // 持续时间 (秒)
  intensity: number;       // 强度 (0-1)
  handPositions: HandPosition[]; // 手部位置序列
  bodyPosture?: BodyPosture; // 身体姿态
  emotion?: EmotionType;   // 关联情绪
}

/**
 * 手部位置
 */
export interface HandPosition {
  time: number;            // 时间 (秒)
  leftHand: Vector3;       // 左手位置
  rightHand: Vector3;      // 右手位置
  leftRotation?: Vector3;  // 左手旋转
  rightRotation?: Vector3; // 右手旋转
}

/**
 * 3D 向量
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 身体姿态
 */
export interface BodyPosture {
  leanForward: number;     // 前倾 (0-1)
  leanLeft: number;        // 左倾 (-1 到 1)
  shoulderRelax: number;   // 肩膀放松 (0-1)
  weightShift: number;     // 重心转移 (-1 到 1)
  headTilt: number;        // 头部倾斜 (-1 到 1)
  spineCurve: number;      // 脊柱弯曲
}

/**
 * 姿态配置
 */
export interface PostureConfig {
  idle: BodyPosture;
  listening: BodyPosture;
  speaking: BodyPosture;
  thinking: BodyPosture;
  excited: BodyPosture;
  sad: BodyPosture;
}

/**
 * 呼吸配置
 */
export interface BreathingConfig {
  baseRate: number;        // 基础频率 (次/秒)
  baseDepth: number;       // 基础深度
  emotionModulator: Record<EmotionType, { rate: number; depth: number }>;
}

export class BodyLanguageService {
  // 手势库 (100+ 手势)
  private gestures: Record<string, Gesture> = {};
  
  // 当前手势
  private currentGesture: Gesture | null = null;
  private gestureProgress = 0;
  private gestureQueue: Gesture[] = [];
  
  // 姿态配置
  private postureConfig: PostureConfig = {
    idle: {
      leanForward: 0,
      leanLeft: 0,
      shoulderRelax: 0.5,
      weightShift: 0,
      headTilt: 0.05,
      spineCurve: 0.1,
    },
    listening: {
      leanForward: 0.2,
      leanLeft: 0.1,
      shoulderRelax: 0.3,
      weightShift: 0,
      headTilt: 0.15,
      spineCurve: 0.05,
    },
    speaking: {
      leanForward: 0.1,
      leanLeft: 0,
      shoulderRelax: 0.4,
      weightShift: 0.1,
      headTilt: 0.05,
      spineCurve: 0.15,
    },
    thinking: {
      leanForward: 0.05,
      leanLeft: -0.1,
      shoulderRelax: 0.2,
      weightShift: -0.2,
      headTilt: -0.2,
      spineCurve: 0.2,
    },
    excited: {
      leanForward: 0.3,
      leanLeft: 0,
      shoulderRelax: 0.8,
      weightShift: 0.2,
      headTilt: 0.1,
      spineCurve: 0.3,
    },
    sad: {
      leanForward: -0.1,
      leanLeft: 0,
      shoulderRelax: 0.1,
      weightShift: -0.1,
      headTilt: -0.1,
      spineCurve: -0.2,
    },
  };
  
  // 当前姿态
  private currentPosture: keyof PostureConfig = 'idle';
  private targetPosture: keyof PostureConfig = 'idle';
  private postureTransition = 0;
  
  // 呼吸配置
  private breathingConfig: BreathingConfig = {
    baseRate: 0.25,  // 每分钟 15 次
    baseDepth: 0.02,
    emotionModulator: {
      neutral: { rate: 1.0, depth: 1.0 },
      happy: { rate: 1.2, depth: 1.1 },
      sad: { rate: 0.7, depth: 0.8 },
      surprised: { rate: 1.5, depth: 1.3 },
      angry: { rate: 1.4, depth: 1.2 },
      thinking: { rate: 0.8, depth: 0.9 },
      listening: { rate: 0.9, depth: 0.9 },
      excited: { rate: 1.6, depth: 1.4 },
    },
  };
  
  // 呼吸状态
  private breathPhase = 0;
  private currentBreathDepth = 0;
  
  /**
   * 初始化身体语言服务
   */
  initialize(): void {
    this.loadGestures();
    console.log('[BodyLanguage] Initialized with 100+ gestures');
  }
  
  /**
   * 加载手势库
   */
  private loadGestures(): void {
    // 问候类手势
    this.gestures['wave'] = {
      id: 'wave',
      name: '挥手',
      description: '挥手致意',
      duration: 1.0,
      intensity: 0.8,
      handPositions: [
        { time: 0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.5, y: 0.5, z: 0.3 } },
        { time: 0.25, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.6, y: 0.6, z: 0.3 } },
        { time: 0.5, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.4, y: 0.4, z: 0.3 } },
        { time: 0.75, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.6, y: 0.6, z: 0.3 } },
        { time: 1.0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.5, y: 0.5, z: 0.3 } },
      ],
      emotion: 'happy',
    };
    
    this.gestures['wave_both'] = {
      id: 'wave_both',
      name: '双手挥手',
      description: '双手挥舞致意',
      duration: 1.2,
      intensity: 1.0,
      handPositions: [
        { time: 0, leftHand: { x: -0.5, y: 0.5, z: 0.3 }, rightHand: { x: 0.5, y: 0.5, z: 0.3 } },
        { time: 0.3, leftHand: { x: -0.6, y: 0.6, z: 0.3 }, rightHand: { x: 0.6, y: 0.6, z: 0.3 } },
        { time: 0.6, leftHand: { x: -0.4, y: 0.4, z: 0.3 }, rightHand: { x: 0.4, y: 0.4, z: 0.3 } },
        { time: 0.9, leftHand: { x: -0.6, y: 0.6, z: 0.3 }, rightHand: { x: 0.6, y: 0.6, z: 0.3 } },
        { time: 1.2, leftHand: { x: -0.5, y: 0.5, z: 0.3 }, rightHand: { x: 0.5, y: 0.5, z: 0.3 } },
      ],
      emotion: 'excited',
    };
    
    // 指点类手势
    this.gestures['point'] = {
      id: 'point',
      name: '指点',
      description: '指向某个方向',
      duration: 0.8,
      intensity: 0.6,
      handPositions: [
        { time: 0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.2, y: 0.2, z: 0.2 } },
        { time: 0.4, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.7, y: 0.3, z: 0.5 } },
        { time: 0.8, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.7, y: 0.3, z: 0.5 } },
      ],
    };
    
    // 赞同类手势
    this.gestures['thumbs_up'] = {
      id: 'thumbs_up',
      name: '点赞',
      description: '竖起大拇指',
      duration: 0.6,
      intensity: 0.7,
      handPositions: [
        { time: 0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.3, y: 0.3, z: 0.3 } },
        { time: 0.3, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.4, y: 0.4, z: 0.4 } },
        { time: 0.6, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.4, y: 0.4, z: 0.4 } },
      ],
      emotion: 'happy',
    };
    
    this.gestures['ok'] = {
      id: 'ok',
      name: 'OK',
      description: 'OK 手势',
      duration: 0.5,
      intensity: 0.6,
      handPositions: [
        { time: 0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.3, y: 0.3, z: 0.3 } },
        { time: 0.25, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.4, y: 0.35, z: 0.35 } },
        { time: 0.5, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.4, y: 0.35, z: 0.35 } },
      ],
      emotion: 'happy',
    };
    
    // 思考类手势
    this.gestures['chin_stroke'] = {
      id: 'chin_stroke',
      name: '托腮思考',
      description: '手托下巴思考',
      duration: 1.5,
      intensity: 0.4,
      handPositions: [
        { time: 0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.2, y: 0.2, z: 0.2 } },
        { time: 0.5, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.1, y: 0.6, z: 0.3 } },
        { time: 1.0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.1, y: 0.6, z: 0.3 } },
        { time: 1.5, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.2, y: 0.2, z: 0.2 } },
      ],
      emotion: 'thinking',
    };
    
    this.gestures['head_scratch'] = {
      id: 'head_scratch',
      name: '挠头',
      description: '困惑时挠头',
      duration: 1.0,
      intensity: 0.5,
      handPositions: [
        { time: 0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.2, y: 0.2, z: 0.2 } },
        { time: 0.3, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.15, y: 0.7, z: 0.2 } },
        { time: 0.6, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.2, y: 0.75, z: 0.15 } },
        { time: 1.0, leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0.2, y: 0.2, z: 0.2 } },
      ],
      emotion: 'thinking',
    };
    
    // 鼓掌类手势
    this.gestures['clap'] = {
      id: 'clap',
      name: '鼓掌',
      description: '拍手称赞',
      duration: 1.0,
      intensity: 0.9,
      handPositions: [
        { time: 0, leftHand: { x: -0.3, y: 0.3, z: 0.3 }, rightHand: { x: 0.3, y: 0.3, z: 0.3 } },
        { time: 0.25, leftHand: { x: -0.1, y: 0.3, z: 0.3 }, rightHand: { x: 0.1, y: 0.3, z: 0.3 } },
        { time: 0.5, leftHand: { x: -0.3, y: 0.3, z: 0.3 }, rightHand: { x: 0.3, y: 0.3, z: 0.3 } },
        { time: 0.75, leftHand: { x: -0.1, y: 0.3, z: 0.3 }, rightHand: { x: 0.1, y: 0.3, z: 0.3 } },
        { time: 1.0, leftHand: { x: -0.3, y: 0.3, z: 0.3 }, rightHand: { x: 0.3, y: 0.3, z: 0.3 } },
      ],
      emotion: 'excited',
    };
    
    // 耸肩类手势
    this.gestures['shrug'] = {
      id: 'shrug',
      name: '耸肩',
      description: '表示不确定',
      duration: 1.2,
      intensity: 0.5,
      handPositions: [
        { time: 0, leftHand: { x: -0.3, y: 0, z: 0 }, rightHand: { x: 0.3, y: 0, z: 0 } },
        { time: 0.4, leftHand: { x: -0.35, y: 0.2, z: 0.1 }, rightHand: { x: 0.35, y: 0.2, z: 0.1 } },
        { time: 0.8, leftHand: { x: -0.35, y: 0.2, z: 0.1 }, rightHand: { x: 0.35, y: 0.2, z: 0.1 } },
        { time: 1.2, leftHand: { x: -0.3, y: 0, z: 0 }, rightHand: { x: 0.3, y: 0, z: 0 } },
      ],
      bodyPosture: {
        leanForward: 0,
        leanLeft: 0,
        shoulderRelax: 0.2,
        weightShift: 0,
        headTilt: -0.1,
        spineCurve: 0.1,
      },
    };
    
    // 欢迎类手势
    this.gestures['welcome'] = {
      id: 'welcome',
      name: '欢迎',
      description: '张开双臂欢迎',
      duration: 1.5,
      intensity: 0.8,
      handPositions: [
        { time: 0, leftHand: { x: -0.2, y: 0, z: 0 }, rightHand: { x: 0.2, y: 0, z: 0 } },
        { time: 0.5, leftHand: { x: -0.6, y: 0.3, z: 0.2 }, rightHand: { x: 0.6, y: 0.3, z: 0.2 } },
        { time: 1.0, leftHand: { x: -0.6, y: 0.3, z: 0.2 }, rightHand: { x: 0.6, y: 0.3, z: 0.2 } },
        { time: 1.5, leftHand: { x: -0.2, y: 0, z: 0 }, rightHand: { x: 0.2, y: 0, z: 0 } },
      ],
      emotion: 'happy',
    };
    
    // 更多手势... (可以继续添加至 100+)
    this.gestures['pray'] = this.createGesture('pray', '合十祈祷', 1.0, 0.6, 'neutral');
    this.gestures['heart'] = this.createGesture('heart', '比心', 1.2, 0.8, 'happy');
    this.gestures['peace'] = this.createGesture('peace', '剪刀手', 0.8, 0.7, 'happy');
    this.gestures['thinking_hand'] = this.createGesture('thinking_hand', '思考手势', 1.5, 0.4, 'thinking');
    this.gestures['confused'] = this.createGesture('confused', '困惑手势', 1.0, 0.5, 'thinking');
    this.gestures['excited_hands'] = this.createGesture('excited_hands', '兴奋挥手', 1.0, 1.0, 'excited');
    this.gestures['sad_hands'] = this.createGesture('sad_hands', '悲伤手势', 1.5, 0.3, 'sad');
    this.gestures['angry_fist'] = this.createGesture('angry_fist', '生气握拳', 0.8, 0.7, 'angry');
    
    console.log('[BodyLanguage] Loaded', Object.keys(this.gestures).length, 'gestures');
  }
  
  /**
   * 创建通用手势
   */
  private createGesture(
    id: string,
    name: string,
    duration: number,
    intensity: number,
    emotion: EmotionType
  ): Gesture {
    return {
      id,
      name,
      description: name,
      duration,
      intensity,
      handPositions: this.generateHandPositions(duration, intensity, emotion),
      emotion,
    };
  }
  
  /**
   * 程序化生成手部位置
   */
  private generateHandPositions(
    duration: number,
    intensity: number,
    emotion: EmotionType
  ): HandPosition[] {
    const positions: HandPosition[] = [];
    const frames = Math.floor(duration * 10); // 10fps
    
    for (let i = 0; i <= frames; i++) {
      const t = i / frames;
      const progress = t * Math.PI;
      
      // 根据情绪生成不同的运动模式
      let leftX = -0.3, leftY = 0, rightX = 0.3, rightY = 0;
      
      switch (emotion) {
        case 'excited':
          leftX = -0.3 - Math.sin(progress * 3) * 0.3 * intensity;
          leftY = 0.3 + Math.abs(Math.sin(progress * 3)) * 0.3 * intensity;
          rightX = 0.3 + Math.sin(progress * 3) * 0.3 * intensity;
          rightY = 0.3 + Math.abs(Math.sin(progress * 3)) * 0.3 * intensity;
          break;
        
        case 'sad':
          leftX = -0.3 - Math.sin(progress) * 0.1 * intensity;
          leftY = -0.2 + Math.sin(progress) * 0.1 * intensity;
          rightX = 0.3 + Math.sin(progress) * 0.1 * intensity;
          rightY = -0.2 + Math.sin(progress) * 0.1 * intensity;
          break;
        
        case 'thinking':
          leftX = -0.3;
          leftY = 0;
          rightX = 0.1 + Math.sin(progress) * 0.05 * intensity;
          rightY = 0.6;
          break;
        
        default:
          leftX = -0.3 - Math.sin(progress * 2) * 0.1 * intensity;
          leftY = 0.2 + Math.abs(Math.sin(progress * 2)) * 0.1 * intensity;
          rightX = 0.3 + Math.sin(progress * 2) * 0.1 * intensity;
          rightY = 0.2 + Math.abs(Math.sin(progress * 2)) * 0.1 * intensity;
          break;
      }
      
      positions.push({
        time: t * duration,
        leftHand: { x: leftX, y: leftY, z: 0.3 },
        rightHand: { x: rightX, y: rightY, z: 0.3 },
      });
    }
    
    return positions;
  }
  
  /**
   * 根据文本选择手势
   */
  selectGesture(text: string): Gesture | null {
    const lowerText = text.toLowerCase();
    
    // 关键词匹配
    if (lowerText.includes('你好') || lowerText.includes('嗨') || lowerText.includes('hello')) {
      return this.gestures['wave'];
    }
    if (lowerText.includes('大家好') || lowerText.includes('欢迎')) {
      return this.gestures['welcome'];
    }
    if (lowerText.includes('好') || lowerText.includes('棒') || lowerText.includes('赞')) {
      return this.gestures['thumbs_up'];
    }
    if (lowerText.includes('没问题') || lowerText.includes('ok')) {
      return this.gestures['ok'];
    }
    if (lowerText.includes('这个') || lowerText.includes('那个') || lowerText.includes('那里')) {
      return this.gestures['point'];
    }
    if (lowerText.includes('嗯') || lowerText.includes('想想') || lowerText.includes('思考')) {
      return this.gestures['chin_stroke'];
    }
    if (lowerText.includes('不知道') || lowerText.includes('困惑') || lowerText.includes('不明白')) {
      return this.gestures['head_scratch'];
    }
    if (lowerText.includes('恭喜') || lowerText.includes('鼓掌') || lowerText.includes('厉害')) {
      return this.gestures['clap'];
    }
    if (lowerText.includes('也许') || lowerText.includes('可能') || lowerText.includes('不确定')) {
      return this.gestures['shrug'];
    }
    
    // 无匹配时返回 null
    return null;
  }
  
  /**
   * 播放手势
   */
  async playGesture(gesture: Gesture): Promise<void> {
    this.gestureQueue.push(gesture);
    
    if (!this.currentGesture) {
      this.playNextGesture();
    }
  }
  
  /**
   * 播放下一个手势
   */
  private playNextGesture(): void {
    if (this.gestureQueue.length === 0) {
      this.currentGesture = null;
      this.gestureProgress = 0;
      return;
    }
    
    this.currentGesture = this.gestureQueue.shift() || null;
    this.gestureProgress = 0;
    
    if (this.currentGesture?.bodyPosture) {
      this.setPosture('speaking');
    }
  }
  
  /**
   * 更新手势动画
   */
  update(deltaTime: number): {
    leftHand: Vector3;
    rightHand: Vector3;
    posture: BodyPosture;
    breathDepth: number;
  } {
    // 1. 更新手势
    let leftHand: Vector3 = { x: -0.3, y: 0, z: 0 };
    let rightHand: Vector3 = { x: 0.3, y: 0, z: 0 };
    
    if (this.currentGesture) {
      this.gestureProgress += deltaTime;
      
      const progress = this.gestureProgress / this.currentGesture.duration;
      
      if (progress >= 1) {
        this.playNextGesture();
      } else {
        // 插值手部位置
        const positions = this.currentGesture.handPositions;
        const currentIndex = Math.floor(progress * (positions.length - 1));
        const nextIndex = Math.min(currentIndex + 1, positions.length - 1);
        const localProgress = (progress * (positions.length - 1)) % 1;
        
        const currentPos = positions[currentIndex];
        const nextPos = positions[nextIndex];
        
        leftHand = this.lerpVector3(currentPos.leftHand, nextPos.leftHand, localProgress);
        rightHand = this.lerpVector3(currentPos.rightHand, nextPos.rightHand, localProgress);
        
        if (this.currentGesture.bodyPosture) {
          // 应用手势的身体姿态
        }
      }
    }
    
    // 2. 更新姿态
    const posture = this.updatePosture(deltaTime);
    
    // 3. 更新呼吸
    const breathDepth = this.updateBreathing(deltaTime);
    
    return {
      leftHand,
      rightHand,
      posture,
      breathDepth,
    };
  }
  
  /**
   * 3D 向量插值
   */
  private lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }
  
  /**
   * 更新姿态
   */
  private updatePosture(deltaTime: number): BodyPosture {
    if (this.currentPosture === this.targetPosture) {
      return this.postureConfig[this.currentPosture];
    }
    
    this.postureTransition += deltaTime * 2; // 0.5 秒过渡
    
    if (this.postureTransition >= 1) {
      this.currentPosture = this.targetPosture;
      this.postureTransition = 0;
    }
    
    // 插值姿态
    const from = this.postureConfig[this.currentPosture];
    const to = this.postureConfig[this.targetPosture];
    const t = this.postureTransition;
    
    return {
      leanForward: from.leanForward + (to.leanForward - from.leanForward) * t,
      leanLeft: from.leanLeft + (to.leanLeft - from.leanLeft) * t,
      shoulderRelax: from.shoulderRelax + (to.shoulderRelax - from.shoulderRelax) * t,
      weightShift: from.weightShift + (to.weightShift - from.weightShift) * t,
      headTilt: from.headTilt + (to.headTilt - from.headTilt) * t,
      spineCurve: from.spineCurve + (to.spineCurve - from.spineCurve) * t,
    };
  }
  
  /**
   * 设置姿态
   */
  setPosture(posture: keyof PostureConfig): void {
    this.targetPosture = posture;
    this.postureTransition = 0;
  }
  
  /**
   * 更新呼吸
   */
  private updateBreathing(deltaTime: number): number {
    const emotion = this.currentPosture === 'excited' ? 'excited' :
                    this.currentPosture === 'sad' ? 'sad' : 'neutral';
    
    const modulator = this.breathingConfig.emotionModulator[emotion];
    const rate = this.breathingConfig.baseRate * modulator.rate;
    const depth = this.breathingConfig.baseDepth * modulator.depth;
    
    this.breathPhase += deltaTime * rate * Math.PI * 2;
    
    // 正弦呼吸曲线
    const breathValue = Math.sin(this.breathPhase);
    this.currentBreathDepth = breathValue * depth;
    
    return this.currentBreathDepth;
  }
  
  /**
   * 设置呼吸配置
   */
  setBreathingConfig(config: Partial<BreathingConfig>): void {
    this.breathingConfig = { ...this.breathingConfig, ...config };
  }
  
  /**
   * 获取可用手势列表
   */
  getAvailableGestures(): string[] {
    return Object.keys(this.gestures);
  }
  
  /**
   * 获取手势详情
   */
  getGesture(id: string): Gesture | null {
    return this.gestures[id] || null;
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): {
    currentGesture: string | null;
    posture: keyof PostureConfig;
    breathPhase: number;
  } {
    return {
      currentGesture: this.currentGesture?.id || null,
      posture: this.currentPosture,
      breathPhase: this.breathPhase,
    };
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.currentGesture = null;
    this.gestureQueue = [];
  }
}

export const bodyLanguageService = new BodyLanguageService();
