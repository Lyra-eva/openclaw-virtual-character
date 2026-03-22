/**
 * UltimateVoiceService - 极致化语音服务 2.0
 * 整合所有极致化功能，提供统一的超自然语音交互体验
 * 
 * 整合功能：
 * - 微表情系统 (64 种面部动作单元)
 * - 情感语音注入 (呼吸/停顿/语气词)
 * - 预测式唇形 (零延迟同步)
 * - 身体语言 (100+ 手势 + 姿态)
 * - 环境感知 (察言观色)
 * - 性能优化 (WebGPU 加速)
 */

import { localVoiceService } from './LocalVoiceService';
import { microExpressionService, ActionUnits } from './MicroExpressionService';
import { emotionalTTSService, EmotionProfile } from './EmotionalTTSService';
import { bodyLanguageService, BodyPosture, Vector3 } from './BodyLanguageService';
import { predictiveLipSyncService, PredictedVisemeSequence } from './PredictiveLipSyncService';
import { contextAwareService } from './ContextAwareService';
import { EmotionType } from '@/types/emotions';

/**
 * 极致化配置
 */
export interface UltimateConfig {
  // 功能开关
  enableMicroExpressions: boolean;
  enableEmotionalTTS: boolean;
  enablePredictiveLipSync: boolean;
  enableBodyLanguage: boolean;
  enableContextAware: boolean;
  
  // 性能配置
  enableGPUAcceleration: boolean;
  targetFrameRate: number;
  
  // 质量配置
  expressionQuality: 'low' | 'medium' | 'high';
  lipSyncAccuracy: 'fast' | 'balanced' | 'accurate';
}

/**
 * 完整状态输出
 */
export interface UltimateState {
  // 面部
  actionUnits: Partial<ActionUnits>;
  pupilSize: number;
  blinkAmount: number;
  
  // 嘴型
  mouthOpen: number;
  visemeId: number;
  
  // 身体
  leftHand: Vector3;
  rightHand: Vector3;
  posture: BodyPosture;
  breathDepth: number;
  
  // 上下文
  timeContext: string;
  userMood: string;
  ambientNoise: number;
}

export class UltimateVoiceService {
  private config: UltimateConfig = {
    enableMicroExpressions: true,
    enableEmotionalTTS: true,
    enablePredictiveLipSync: true,
    enableBodyLanguage: true,
    enableContextAware: true,
    enableGPUAcceleration: false, // 默认关闭，需要 WebGPU 支持
    targetFrameRate: 60,
    expressionQuality: 'high',
    lipSyncAccuracy: 'balanced',
  };
  
  private isInitialized = false;
  private currentVisemeSequence: PredictedVisemeSequence | null = null;
  private animationTime = 0;
  
  /**
   * 初始化所有服务
   */
  async initialize(config?: Partial<UltimateConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    console.log('[UltimateVoice] Initializing all services...');
    
    try {
      // 1. 初始化基础语音服务
      await localVoiceService.initialize({
        sttEnabled: true,
        ttsEnabled: true,
        vadEnabled: true,
        noiseReductionEnabled: true,
        lipSyncEnabled: false, // 使用预测式唇形替代
        spatialAudioEnabled: true,
      });
      
      // 2. 初始化微表情服务
      if (this.config.enableMicroExpressions) {
        microExpressionService.initialize();
        console.log('[UltimateVoice] ✓ MicroExpression initialized');
      }
      
      // 3. 初始化情感 TTS
      if (this.config.enableEmotionalTTS) {
        await emotionalTTSService.initialize();
        console.log('[UltimateVoice] ✓ EmotionalTTS initialized');
      }
      
      // 4. 初始化身体语言
      if (this.config.enableBodyLanguage) {
        bodyLanguageService.initialize();
        console.log('[UltimateVoice] ✓ BodyLanguage initialized');
      }
      
      // 5. 配置预测式唇形
      if (this.config.enablePredictiveLipSync) {
        const accuracy = this.config.lipSyncAccuracy;
        const lookahead = accuracy === 'fast' ? 50 : accuracy === 'accurate' ? 150 : 100;
        predictiveLipSyncService.setLookaheadTime(lookahead);
        console.log('[UltimateVoice] ✓ PredictiveLipSync initialized');
      }
      
      // 6. 环境感知已自动初始化
      if (this.config.enableContextAware) {
        console.log('[UltimateVoice] ✓ ContextAware initialized');
      }
      
      this.isInitialized = true;
      console.log('[UltimateVoice] ✅ All services initialized');
    } catch (error) {
      console.error('[UltimateVoice] Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * 带情感的完整语音合成
   */
  async speakWithFullExpression(text: string, emotion?: EmotionType): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // 1. 分析文本情感
    const detectedEmotion = emotion || this.detectEmotionFromText(text);
    
    // 2. 应用微表情
    if (this.config.enableMicroExpressions) {
      const units = microExpressionService.generateFromEmotion(detectedEmotion);
      microExpressionService.applyActionUnits(units);
      microExpressionService.setPupilFromEmotion(detectedEmotion);
    }
    
    // 3. 设置身体姿态
    if (this.config.enableBodyLanguage) {
      const posture = this.emotionToPosture(detectedEmotion);
      bodyLanguageService.setPosture(posture);
    }
    
    // 4. 选择并播放手势
    if (this.config.enableBodyLanguage) {
      const gesture = bodyLanguageService.selectGesture(text);
      if (gesture) {
        bodyLanguageService.playGesture(gesture);
      }
    }
    
    // 5. 预计算唇形
    if (this.config.enablePredictiveLipSync) {
      this.currentVisemeSequence = await predictiveLipSyncService.precomputeVisemes(text);
    }
    
    // 6. 带情感合成语音
    if (this.config.enableEmotionalTTS) {
      await emotionalTTSService.speakWithEmotion(text, detectedEmotion);
    } else {
      await localVoiceService.speak(text);
    }
  }
  
  /**
   * 从文本检测情感
   */
  private detectEmotionFromText(text: string): EmotionType {
    // 简单关键词匹配
    const lowerText = text.toLowerCase();
    
    if (/[!！]/.test(text) || /[哈哈|呵呵|嘻|开心|好棒]/.test(text)) {
      return 'excited';
    }
    if (/[...。]|唉|哎|嗯|难过|伤心/.test(text)) {
      return 'sad';
    }
    if (/[???!？!]/.test(text) || /[惊讶|哇|啊]/.test(text)) {
      return 'surprised';
    }
    if (/[嗯...|想想|让我想]/.test(text)) {
      return 'thinking';
    }
    if (/[好|棒|赞|开心|喜欢]/.test(text)) {
      return 'happy';
    }
    
    return 'neutral';
  }
  
  /**
   * 情感转身体姿态
   */
  private emotionToPosture(emotion: EmotionType): keyof typeof bodyLanguageService['postureConfig'] {
    switch (emotion) {
      case 'excited': return 'excited';
      case 'sad': return 'sad';
      case 'thinking': return 'thinking';
      case 'listening': return 'listening';
      default: return 'speaking';
    }
  }
  
  /**
   * 更新所有动画 (每帧调用)
   */
  update(deltaTime: number): UltimateState {
    this.animationTime += deltaTime;
    
    // 1. 更新微表情
    let actionUnits: Partial<ActionUnits> = {};
    let pupilSize = 3.0;
    let blinkAmount = 0;
    
    if (this.config.enableMicroExpressions) {
      const microState = microExpressionService.update(deltaTime);
      actionUnits = microState.actionUnits;
      pupilSize = microState.pupilSize;
      blinkAmount = microState.blinkAmount;
    }
    
    // 2. 更新嘴型
    let mouthOpen = 0;
    let visemeId = 0;
    
    if (this.config.enablePredictiveLipSync && this.currentVisemeSequence) {
      const viseme = predictiveLipSyncService.getPredictedViseme(
        this.currentVisemeSequence,
        this.animationTime
      );
      mouthOpen = viseme.mouthOpen;
      visemeId = viseme.id;
    } else {
      // 降级到实时唇形
      mouthOpen = localVoiceService.getMouthOpen();
    }
    
    // 3. 更新身体语言
    let leftHand: Vector3 = { x: -0.3, y: 0, z: 0 };
    let rightHand: Vector3 = { x: 0.3, y: 0, z: 0 };
    let posture: BodyPosture = bodyLanguageService['postureConfig'].idle;
    let breathDepth = 0;
    
    if (this.config.enableBodyLanguage) {
      const bodyState = bodyLanguageService.update(deltaTime);
      leftHand = bodyState.leftHand;
      rightHand = bodyState.rightHand;
      posture = bodyState.posture;
      breathDepth = bodyState.breathDepth;
    }
    
    // 4. 获取上下文状态
    const fullContext = contextAwareService.getFullContext();
    
    return {
      actionUnits,
      pupilSize,
      blinkAmount,
      mouthOpen,
      visemeId,
      leftHand,
      rightHand,
      posture,
      breathDepth,
      timeContext: fullContext.time.greeting,
      userMood: fullContext.user.mood,
      ambientNoise: fullContext.ambient.noiseLevel,
    };
  }
  
  /**
   * 开始监听 (带环境感知)
   */
  async startListening(onTranscript?: (text: string, isFinal: boolean) => void): Promise<void> {
    // 检测环境噪音
    const ambientState = contextAwareService.getFullContext().ambient;
    
    if (ambientState.isNoisy) {
      console.log('[UltimateVoice] Noisy environment detected, adjusting VAD...');
      localVoiceService.setVADThreshold(0.7);
    }
    
    await localVoiceService.startListening((text, isFinal) => {
      // 记录对话
      if (this.config.enableContextAware) {
        contextAwareService.recordConversation(text, 'user');
      }
      
      // 检测用户状态
      if (this.config.enableContextAware) {
        contextAwareService.detectUserState(text);
      }
      
      // 回调
      if (onTranscript) {
        onTranscript(text, isFinal);
      }
    });
  }
  
  /**
   * 停止监听
   */
  stopListening(): void {
    localVoiceService.stopListening();
  }
  
  /**
   * 记住用户偏好
   */
  remember(key: string, value: any): void {
    if (this.config.enableContextAware) {
      contextAwareService.rememberPreference(key, value);
    }
  }
  
  /**
   * 获取用户偏好
   */
  getPreference<T>(key: string, defaultValue: T): T {
    if (this.config.enableContextAware) {
      return contextAwareService.getPreference(key, defaultValue);
    }
    return defaultValue;
  }
  
  /**
   * 获取自适应语音参数
   */
  getAdaptiveParams(): {
    volume: number;
    rate: number;
    responseStyle: 'concise' | 'normal' | 'detailed';
  } {
    if (this.config.enableContextAware) {
      return contextAwareService.getAdaptiveVoiceParams();
    }
    return { volume: 1.0, rate: 1.0, responseStyle: 'normal' };
  }
  
  /**
   * 设置配置
   */
  setConfig(config: Partial<UltimateConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 应用配置到各服务
    if (config.enableMicroExpressions !== undefined) {
      microExpressionService.setConfig({
        enableMicroExpressions: config.enableMicroExpressions,
      });
    }
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): UltimateConfig {
    return { ...this.config };
  }
  
  /**
   * 获取完整状态
   */
  getStatus(): {
    isInitialized: boolean;
    config: UltimateConfig;
    currentVisemeSequence: PredictedVisemeSequence | null;
  } {
    return {
      isInitialized: this.isInitialized,
      config: { ...this.config },
      currentVisemeSequence: this.currentVisemeSequence,
    };
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    localVoiceService.dispose();
    microExpressionService.dispose();
    emotionalTTSService.dispose();
    bodyLanguageService.dispose();
    this.isInitialized = false;
  }
}

// 导出单例
export const ultimateVoiceService = new UltimateVoiceService();
