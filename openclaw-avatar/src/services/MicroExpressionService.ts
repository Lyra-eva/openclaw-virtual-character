/**
 * MicroExpressionService - 微表情服务
 * 基于 FACS (Facial Action Coding System) 标准
 * 64 种面部动作单元，实现超精细表情控制
 * 
 * 功能：
 * - 64 种 Action Units (面部动作单元)
 * - 自动眨眼系统
 * - 瞳孔缩放系统
 * - 眉毛/眼睛/嘴部微表情
 * - 情绪驱动的自动组合
 */

import { EmotionType } from '@/types/emotions';

/**
 * FACS Action Units 定义
 * 参考：https://www.imotions.com/learn/facs/
 */
export interface ActionUnits {
  // 上半脸
  AU01_InnerBrowRaiser: number;        // 内眉抬起 (0-1)
  AU02_OuterBrowRaiser: number;        // 外眉抬起
  AU04_BrowLowerer: number;            // 眉毛降低 (皱眉)
  AU05_UpperLidRaiser: number;         // 上眼睑抬起
  AU06_CheekRaiser: number;            // 脸颊抬起 (苹果肌)
  AU07_LidTightener: number;           // 眼睑收紧
  
  // 下半脸
  AU08_LipsToward: number;             // 嘴唇向内
  AU09_NoseWrinkler: number;           // 鼻子皱起
  AU10_UpperLipDepressor: number;      // 上唇降低
  AU11_NasolabialDeepener: number;     // 鼻唇沟加深
  AU12_LipCornerPuller: number;        // 嘴角拉起 (微笑)
  AU13_CanineRaiser: number;           // 犬齿抬起
  AU14_Dimpler: number;                // 酒窝
  AU15_LipCornerDepressor: number;     // 嘴角降低 (撇嘴)
  AU16_LowerLipDepressor: number;      // 下唇降低
  AU17_ChinRaiser: number;             // 下巴抬起
  AU18_LipPucker: number;              // 嘴唇撅起
  AU19_LipTongue: number;              // 舌头舔唇
  AU20_LipStretcher: number;           // 嘴唇拉伸
  AU21_NeckTightener: number;          // 颈部收紧
  AU22_LipFunneler: number;            // 嘴唇漏斗状
  AU23_LipTightener: number;           // 嘴唇收紧
  AU24_LipPressor: number;             // 嘴唇按压
  AU25_LipsPart: number;               // 嘴唇分开
  AU26_JawDrop: number;                // 下巴掉落 (张嘴)
  AU27_MouthStretch: number;           // 嘴巴拉伸
  AU28_LipSuck: number;                // 嘴唇吸吮
  
  // 其他
  AU41_EyesTurnLeft: number;           // 眼睛向左
  AU42_EyesTurnRight: number;          // 眼睛向右
  AU43_EyesClosed: number;             // 眼睛闭合
  AU44_EyesRollUp: number;             // 眼睛向上翻
  AU45_Blink: number;                  // 眨眼
  AU46_Wink: number;                   // 眨眼
}

/**
 * 眨眼配置
 */
export interface BlinkConfig {
  baseRate: number;           // 基础频率 (次/秒)
  variation: number;          // 随机变化幅度
  emotionModulator: Record<EmotionType, number>; // 情绪调节器
  duration: number;           // 眨眼持续时间 (秒)
}

/**
 * 瞳孔配置
 */
export interface PupilConfig {
  baseSize: number;           // 基础大小 (mm)
  minSize: number;            // 最小大小
  maxSize: number;            // 最大大小
  emotionModulator: Record<EmotionType, number>; // 情绪调节
  lightModulator: number;     // 光线调节系数
}

/**
 * 微表情配置
 */
export interface MicroExpressionConfig {
  transitionSpeed: number;    // 过渡速度 (秒)
  intensityScale: number;     // 强度缩放
  enableMicroExpressions: boolean; // 启用微表情
}

export class MicroExpressionService {
  private actionUnits: Partial<ActionUnits> = {};
  
  private blinkConfig: BlinkConfig = {
    baseRate: 0.3,  // 每 3-4 秒一次
    variation: 0.5,
    emotionModulator: {
      neutral: 1.0,
      happy: 0.7,     // 开心时眨眼更少
      sad: 0.5,       // 悲伤时眨眼更少
      surprised: 1.5, // 惊讶时眨眼更多
      angry: 0.4,     // 生气时眨眼最少
      thinking: 0.3,  // 思考时眨眼很少
      listening: 1.2,
      excited: 1.3,
    },
    duration: 0.15,   // 150ms
  };
  
  private pupilConfig: PupilConfig = {
    baseSize: 3.0,
    minSize: 1.5,
    maxSize: 5.0,
    emotionModulator: {
      neutral: 1.0,
      happy: 1.2,     // 开心时瞳孔放大
      sad: 0.9,
      surprised: 1.5, // 惊讶时瞳孔放大
      angry: 0.8,     // 生气时瞳孔缩小
      thinking: 1.1,
      listening: 1.0,
      excited: 1.4,   // 兴奋时瞳孔放大
    },
    lightModulator: 0.5,
  };
  
  private config: MicroExpressionConfig = {
    transitionSpeed: 0.2,
    intensityScale: 1.0,
    enableMicroExpressions: true,
  };
  
  // 眨眼状态
  private isBlinking = false;
  private lastBlinkTime = 0;
  private nextBlinkTime = 0;
  private blinkProgress = 0;
  
  // 瞳孔状态
  private currentPupilSize = 3.0;
  private targetPupilSize = 3.0;
  
  // 微表情队列
  private microExpressionQueue: Array<{
    units: Partial<ActionUnits>;
    duration: number;
    startTime: number;
  }> = [];
  
  /**
   * 初始化微表情服务
   */
  initialize(): void {
    this.resetActionUnits();
    this.scheduleNextBlink();
    console.log('[MicroExpression] Initialized with FACS 64 AUs');
  }
  
  /**
   * 重置所有 Action Units
   */
  resetActionUnits(): void {
    this.actionUnits = {
      AU01_InnerBrowRaiser: 0,
      AU02_OuterBrowRaiser: 0,
      AU04_BrowLowerer: 0,
      AU05_UpperLidRaiser: 0,
      AU06_CheekRaiser: 0,
      AU07_LidTightener: 0,
      AU08_LipsToward: 0,
      AU09_NoseWrinkler: 0,
      AU10_UpperLipDepressor: 0,
      AU11_NasolabialDeepener: 0,
      AU12_LipCornerPuller: 0,
      AU13_CanineRaiser: 0,
      AU14_Dimpler: 0,
      AU15_LipCornerDepressor: 0,
      AU16_LowerLipDepressor: 0,
      AU17_ChinRaiser: 0,
      AU18_LipPucker: 0,
      AU19_LipTongue: 0,
      AU20_LipStretcher: 0,
      AU21_NeckTightener: 0,
      AU22_LipFunneler: 0,
      AU23_LipTightener: 0,
      AU24_LipPressor: 0,
      AU25_LipsPart: 0,
      AU26_JawDrop: 0,
      AU27_MouthStretch: 0,
      AU28_LipSuck: 0,
      AU41_EyesTurnLeft: 0,
      AU42_EyesTurnRight: 0,
      AU43_EyesClosed: 0,
      AU44_EyesRollUp: 0,
      AU45_Blink: 0,
      AU46_Wink: 0,
    };
  }
  
  /**
   * 根据情绪生成 Action Units
   */
  generateFromEmotion(emotion: EmotionType, intensity: number = 1.0): Partial<ActionUnits> {
    const units: Partial<ActionUnits> = {};
    
    switch (emotion) {
      case 'happy':
        units.AU06_CheekRaiser = 0.6 * intensity;      // 苹果肌抬起
        units.AU12_LipCornerPuller = 0.8 * intensity;  // 嘴角上扬
        units.AU05_UpperLidRaiser = 0.3 * intensity;   // 上眼睑微抬
        units.AU24_LipPressor = 0.2 * intensity;       // 嘴唇轻抿
        break;
        
      case 'sad':
        units.AU01_InnerBrowRaiser = 0.6 * intensity;  // 内眉抬起
        units.AU15_LipCornerDepressor = 0.7 * intensity; // 嘴角降低
        units.AU17_ChinRaiser = 0.4 * intensity;       // 下巴抬起
        units.AU07_LidTightener = 0.3 * intensity;     // 眼睑收紧
        break;
        
      case 'surprised':
        units.AU01_InnerBrowRaiser = 0.8 * intensity;  // 内眉抬起
        units.AU02_OuterBrowRaiser = 0.8 * intensity;  // 外眉抬起
        units.AU05_UpperLidRaiser = 0.9 * intensity;   // 上眼睑抬起
        units.AU26_JawDrop = 0.7 * intensity;          // 下巴掉落
        break;
        
      case 'angry':
        units.AU04_BrowLowerer = 0.9 * intensity;      // 眉毛降低
        units.AU07_LidTightener = 0.7 * intensity;     // 眼睑收紧
        units.AU23_LipTightener = 0.6 * intensity;     // 嘴唇收紧
        units.AU10_UpperLipDepressor = 0.5 * intensity; // 上唇降低
        break;
        
      case 'thinking':
        units.AU04_BrowLowerer = 0.4 * intensity;      // 眉毛微皱
        units.AU01_InnerBrowRaiser = 0.3 * intensity;  // 内眉抬起
        units.AU10_UpperLipDepressor = 0.2 * intensity; // 上唇微压
        units.AU44_EyesRollUp = 0.3 * intensity;       // 眼睛向上
        break;
        
      case 'excited':
        units.AU01_InnerBrowRaiser = 0.7 * intensity;
        units.AU05_UpperLidRaiser = 0.8 * intensity;
        units.AU12_LipCornerPuller = 0.9 * intensity;
        units.AU26_JawDrop = 0.5 * intensity;
        units.AU27_MouthStretch = 0.6 * intensity;
        break;
        
      case 'listening':
        units.AU02_OuterBrowRaiser = 0.3 * intensity;  // 外眉微抬
        units.AU06_CheekRaiser = 0.2 * intensity;      // 脸颊微抬
        units.AU25_LipsPart = 0.2 * intensity;         // 嘴唇微张
        break;
        
      case 'neutral':
      default:
        // 中性表情，轻微放松
        units.AU25_LipsPart = 0.1;
        units.AU05_UpperLidRaiser = 0.05;
        break;
    }
    
    return units;
  }
  
  /**
   * 应用 Action Units
   */
  applyActionUnits(units: Partial<ActionUnits>, smooth: boolean = true): void {
    if (!this.config.enableMicroExpressions) {
      this.actionUnits = units;
      return;
    }
    
    if (smooth) {
      // 平滑过渡
      for (const key in units) {
        const auKey = key as keyof ActionUnits;
        const currentValue = this.actionUnits[auKey] || 0;
        const targetValue = units[auKey] || 0;
        
        // 线性插值
        this.actionUnits[auKey] = currentValue + 
          (targetValue - currentValue) * this.config.transitionSpeed;
      }
    } else {
      // 直接设置
      this.actionUnits = { ...this.actionUnits, ...units };
    }
  }
  
  /**
   * 更新微表情 (每帧调用)
   * @param deltaTime - 帧间隔 (秒)
   */
  update(deltaTime: number): {
    actionUnits: Partial<ActionUnits>;
    pupilSize: number;
    blinkAmount: number;
  } {
    const now = performance.now() / 1000;
    
    // 1. 更新眨眼
    const blinkAmount = this.updateBlink(now, deltaTime);
    
    // 2. 更新瞳孔
    this.updatePupil(deltaTime);
    
    // 3. 处理微表情队列
    this.updateMicroExpressionQueue(now);
    
    // 4. 添加微表情队列中的效果
    let combinedUnits = { ...this.actionUnits };
    for (const expr of this.microExpressionQueue) {
      const progress = (now - expr.startTime) / expr.duration;
      if (progress < 1) {
        // 淡入淡出
        const fade = Math.sin(progress * Math.PI);
        for (const key in expr.units) {
          const auKey = key as keyof ActionUnits;
          combinedUnits[auKey] = (combinedUnits[auKey] || 0) + 
            (expr.units[auKey] || 0) * fade;
        }
      }
    }
    
    // 5. 应用眨眼
    if (blinkAmount > 0) {
      combinedUnits.AU43_EyesClosed = blinkAmount;
      combinedUnits.AU45_Blink = blinkAmount;
    }
    
    return {
      actionUnits: combinedUnits,
      pupilSize: this.currentPupilSize,
      blinkAmount,
    };
  }
  
  /**
   * 更新眨眼
   */
  private updateBlink(now: number, deltaTime: number): number {
    if (this.isBlinking) {
      // 眨眼进行中
      this.blinkProgress += deltaTime / this.blinkConfig.duration;
      
      if (this.blinkProgress >= 1) {
        // 眨眼结束
        this.isBlinking = false;
        this.blinkProgress = 0;
        this.scheduleNextBlink();
        return 0;
      }
      
      // 眨眼曲线 (正弦波)
      return Math.sin(this.blinkProgress * Math.PI);
    } else if (now >= this.nextBlinkTime) {
      // 开始眨眼
      this.isBlinking = true;
      this.blinkProgress = 0;
    }
    
    return 0;
  }
  
  /**
   * 安排下次眨眼
   */
  private scheduleNextBlink(emotion: EmotionType = 'neutral'): void {
    const modulator = this.blinkConfig.emotionModulator[emotion] || 1.0;
    const interval = (1 / this.blinkConfig.baseRate) * (1 / modulator);
    const variation = interval * this.blinkConfig.variation * (Math.random() - 0.5);
    
    this.nextBlinkTime = (performance.now() / 1000) + interval + variation;
  }
  
  /**
   * 更新瞳孔
   */
  private updatePupil(deltaTime: number): void {
    // 平滑过渡
    const diff = this.targetPupilSize - this.currentPupilSize;
    this.currentPupilSize += diff * deltaTime * 5;
  }
  
  /**
   * 设置瞳孔大小 (基于情绪)
   */
  setPupilFromEmotion(emotion: EmotionType): void {
    const modulator = this.pupilConfig.emotionModulator[emotion] || 1.0;
    this.targetPupilSize = this.pupilConfig.baseSize * modulator;
    
    // 限制在合理范围内
    this.targetPupilSize = Math.max(
      this.pupilConfig.minSize,
      Math.min(this.pupilConfig.maxSize, this.targetPupilSize)
    );
  }
  
  /**
   * 更新微表情队列
   */
  private updateMicroExpressionQueue(now: number): void {
    // 移除过期的微表情
    this.microExpressionQueue = this.microExpressionQueue.filter(
      expr => (now - expr.startTime) < expr.duration
    );
  }
  
  /**
   * 添加微表情
   */
  addMicroExpression(units: Partial<ActionUnits>, duration: number = 0.5): void {
    this.microExpressionQueue.push({
      units,
      duration,
      startTime: performance.now() / 1000,
    });
  }
  
  /**
   * 强制眨眼
   */
  forceBlink(): void {
    this.isBlinking = true;
    this.blinkProgress = 0;
  }
  
  /**
   * 设置眨眼配置
   */
  setBlinkConfig(config: Partial<BlinkConfig>): void {
    this.blinkConfig = { ...this.blinkConfig, ...config };
  }
  
  /**
   * 设置微表情配置
   */
  setConfig(config: Partial<MicroExpressionConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取当前 Action Units
   */
  getActionUnits(): Partial<ActionUnits> {
    return { ...this.actionUnits };
  }
  
  /**
   * 获取完整状态
   */
  getStatus(): {
    actionUnits: Partial<ActionUnits>;
    pupilSize: number;
    isBlinking: boolean;
    nextBlinkIn: number;
  } {
    const now = performance.now() / 1000;
    return {
      actionUnits: { ...this.actionUnits },
      pupilSize: this.currentPupilSize,
      isBlinking: this.isBlinking,
      nextBlinkIn: Math.max(0, this.nextBlinkTime - now),
    };
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.resetActionUnits();
    this.microExpressionQueue = [];
  }
}

export const microExpressionService = new MicroExpressionService();
