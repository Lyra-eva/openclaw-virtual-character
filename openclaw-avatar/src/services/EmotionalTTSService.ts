/**
 * EmotionalTTSService - 情感语音合成服务
 * 在 TTS 基础上注入情感、呼吸声、语气词、自然停顿
 * 让语音更有"人味"
 * 
 * 功能：
 * - 文本情感分析
 * - 呼吸声注入
 * - 语气词添加 (嗯、啊、那个)
 * - 自然停顿
 * - 音调/语速/音量动态调整
 * - 笑声/叹气声
 */

import { EmotionType } from '@/types/emotions';
import { textEmotionDetector } from './TextEmotionDetector';

/**
 * 情感配置
 */
export interface EmotionProfile {
  happiness: number;    // 开心程度 (0-1)
  excitement: number;   // 兴奋程度 (0-1)
  warmth: number;       // 温柔程度 (0-1)
  energy: number;       // 能量级别 (0-1)
  sadness: number;      // 悲伤程度 (0-1)
  nervousness: number;  // 紧张程度 (0-1)
  thinking?: number;    // 思考程度 (0-1)
  pauseFrequency?: number; // 停顿频率 (0-1)
}

/**
 * TTS 情感参数
 */
export interface EmotionalTTSParams {
  pitch: number;        // 音调 (0.5-2.0)
  rate: number;         // 语速 (0.5-2.0)
  volume: number;       // 音量 (0-1)
  breathiness: number;  // 气息声 (0-1)
  pauseFrequency: number; // 停顿频率 (0-1)
  fillerWordChance: number; // 语气词概率 (0-1)
}

/**
 * 呼吸声配置
 */
export interface BreathConfig {
  enabled: boolean;
  volume: number;       // 呼吸声音量
  frequency: number;    // 呼吸频率
  variation: number;    // 随机变化
}

/**
 * 语气词配置
 */
export interface FillerWordConfig {
  enabled: boolean;
  chance: number;       // 出现概率
  words: string[];      // 语气词列表
  position: 'start' | 'middle' | 'end'; // 出现位置
}

export class EmotionalTTSService {
  private breathConfig: BreathConfig = {
    enabled: true,
    volume: 0.3,
    frequency: 0.5,
    variation: 0.3,
  };
  
  private fillerWordConfig: FillerWordConfig = {
    enabled: true,
    chance: 0.1,  // 10% 概率
    words: ['嗯', '啊', '那个', '就是', '怎么说呢', '让我想想'],
    position: 'middle',
  };
  
  private audioContext: AudioContext | null = null;
  private breathSounds: AudioBuffer[] = [];
  
  /**
   * 初始化情感 TTS 服务
   */
  async initialize(): Promise<void> {
    this.audioContext = new AudioContext();
    await this.loadBreathSounds();
    console.log('[EmotionalTTS] Initialized');
  }
  
  /**
   * 加载呼吸声音效
   */
  private async loadBreathSounds(): Promise<void> {
    // 生成呼吸声 (程序化合成)
    this.breathSounds = [
      await this.synthesizeBreath('inhale'),
      await this.synthesizeBreath('exhale'),
    ];
  }
  
  /**
   * 合成呼吸声
   */
  private async synthesizeBreath(type: 'inhale' | 'exhale'): Promise<AudioBuffer> {
    if (!this.audioContext) return new AudioBuffer({ sampleRate: 44100, length: 0, numberOfChannels: 1 });
    
    const duration = type === 'inhale' ? 0.3 : 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成粉红噪音 (模拟呼吸声)
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = this.createBreathEnvelope(t, duration, type);
      const noise = (Math.random() * 2 - 1) * 0.3;
      
      // 带通滤波模拟呼吸频谱
      const filtered = this.bandpassFilter(noise, 400, 1200);
      data[i] = filtered * envelope * this.breathConfig.volume;
    }
    
    return buffer;
  }
  
  /**
   * 呼吸包络
   */
  private createBreathEnvelope(t: number, duration: number, type: 'inhale' | 'exhale'): number {
    const progress = t / duration;
    
    if (type === 'inhale') {
      // 吸气：快速上升，缓慢下降
      return Math.sin(progress * Math.PI) * (1 - progress * 0.3);
    } else {
      // 呼气：缓慢上升，快速下降
      return Math.sin(progress * Math.PI) * (0.7 + progress * 0.3);
    }
  }
  
  /**
   * 简单带通滤波
   */
  private bandpassFilter(sample: number, lowFreq: number, highFreq: number): number {
    // 简化实现：使用两个一阶滤波器
    const alpha = (Math.PI * lowFreq) / 44100;
    const beta = (Math.PI * highFreq) / 44100;
    
    // 高通
    const hp = sample - sample * Math.exp(-2 * alpha);
    // 低通
    const lp = hp * (1 - Math.exp(-2 * beta));
    
    return lp;
  }
  
  /**
   * 分析文本情感
   */
  analyzeTextEmotion(text: string): EmotionProfile {
    // 使用文本情感检测器
    const result = textEmotionDetector.detect(text);
    
    // 转换为情感配置
    const profile: EmotionProfile = {
      happiness: 0,
      excitement: 0,
      warmth: 0.5,
      energy: 0.5,
      sadness: 0,
      nervousness: 0,
    };
    
    switch (result.emotion) {
      case 'happy':
        profile.happiness = result.confidence;
        profile.excitement = result.confidence * 0.7;
        profile.energy = result.confidence * 0.8;
        profile.warmth = 0.7;
        break;
        
      case 'excited':
        profile.happiness = result.confidence * 0.8;
        profile.excitement = result.confidence;
        profile.energy = result.confidence;
        profile.warmth = 0.6;
        break;
        
      case 'sad':
        profile.sadness = result.confidence;
        profile.energy = 0.3;
        profile.warmth = 0.4;
        break;
        
      case 'surprised':
        profile.excitement = result.confidence;
        profile.energy = result.confidence * 0.9;
        profile.happiness = result.confidence * 0.5;
        break;
        
      case 'angry':
        profile.energy = result.confidence;
        profile.nervousness = result.confidence * 0.5;
        profile.warmth = 0.2;
        break;
        
      case 'thinking':
        profile.energy = 0.4;
        profile.nervousness = 0.2;
        profile.warmth = 0.5;
        break;
        
      case 'listening':
        profile.warmth = 0.8;
        profile.energy = 0.4;
        break;
        
      case 'neutral':
      default:
        profile.warmth = 0.5;
        profile.energy = 0.5;
        break;
    }
    
    return profile;
  }
  
  /**
   * 从情感配置生成 TTS 参数
   */
  generateTTSParams(emotion: EmotionProfile): EmotionalTTSParams {
    return {
      pitch: 1.0 + (emotion.happiness * 0.2) + (emotion.excitement * 0.15) - (emotion.sadness * 0.15),
      rate: 1.0 + (emotion.excitement * 0.3) - (emotion.sadness * 0.3) - (emotion.nervousness * 0.1),
      volume: 0.7 + (emotion.energy * 0.3),
      breathiness: emotion.warmth * 0.4 + (emotion.nervousness * 0.2),
      pauseFrequency: 0.3 + (emotion.nervousness * 0.3) + (emotion.sadness * 0.2),
      fillerWordChance: 0.05 + (emotion.nervousness * 0.15) + (emotion.thinking ? 0.2 : 0),
    };
  }
  
  /**
   * 为文本添加情感标记
   */
  addEmotionalMarkers(text: string, emotion: EmotionProfile): string {
    let processed = text;
    
    // 1. 添加停顿
    if (emotion.nervousness > 0.3 || emotion.sadness > 0.3) {
      processed = this.addPauses(processed, emotion.pauseFrequency);
    }
    
    // 2. 添加语气词
    if (this.fillerWordConfig.enabled && emotion.nervousness > 0.2) {
      processed = this.addFillerWords(processed, emotion.nervousness);
    }
    
    // 3. 添加笑声
    if (emotion.happiness > 0.7 && emotion.excitement > 0.5) {
      processed = this.addLaughter(processed);
    }
    
    // 4. 添加叹气
    if (emotion.sadness > 0.5) {
      processed = this.addSigh(processed);
    }
    
    return processed;
  }
  
  /**
   * 添加停顿
   */
  private addPauses(text: string, frequency: number): string {
    const sentences = text.split(/([,.!?。！？])/);
    const result: string[] = [];
    
    for (let i = 0; i < sentences.length; i++) {
      result.push(sentences[i]);
      
      // 在标点后添加停顿
      if (/[,.!?。！？]/.test(sentences[i]) && Math.random() < frequency) {
        const pauseLength = Math.random() < 0.7 ? '[pause:short]' : '[pause:long]';
        result.push(pauseLength);
      }
    }
    
    return result.join('');
  }
  
  /**
   * 添加语气词
   */
  private addFillerWords(text: string, chance: number): string {
    const sentences = text.split(/([,.!?。！？])/);
    const result: string[] = [];
    
    for (let i = 0; i < sentences.length; i++) {
      // 在句子开头添加语气词
      if (i > 0 && /[,.!?。！？]/.test(sentences[i-1]) && Math.random() < chance) {
        const filler = this.fillerWordConfig.words[
          Math.floor(Math.random() * this.fillerWordConfig.words.length)
        ];
        result.push(filler + ',');
      }
      result.push(sentences[i]);
    }
    
    return result.join('');
  }
  
  /**
   * 添加笑声
   */
  private addLaughter(text: string): string {
    const laughTypes = ['(轻笑)', '(笑)', '(哈哈)', '(呵呵)'];
    const laugh = laughTypes[Math.floor(Math.random() * laughTypes.length)];
    
    // 在句首或句中添加笑声
    if (Math.random() < 0.5) {
      return laugh + ' ' + text;
    } else {
      const parts = text.split(' ');
      const insertPos = Math.floor(Math.random() * parts.length);
      parts.splice(insertPos, 0, laugh);
      return parts.join(' ');
    }
  }
  
  /**
   * 添加叹气
   */
  private addSigh(text: string): string {
    const sighs = ['(叹气)', '(唉)', '(轻叹)'];
    const sigh = sighs[Math.floor(Math.random() * sighs.length)];
    
    return sigh + ' ' + text;
  }
  
  /**
   * 播放呼吸声
   */
  async playBreathSound(type: 'inhale' | 'exhale', volume: number = 1.0): Promise<void> {
    if (!this.audioContext || this.breathSounds.length === 0) return;
    
    const buffer = type === 'inhale' ? this.breathSounds[0] : this.breathSounds[1];
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.audioContext.createGain();
    gain.gain.value = volume * this.breathConfig.volume;
    
    source.connect(gain);
    gain.connect(this.audioContext.destination);
    source.start();
  }
  
  /**
   * 带情感的语音合成
   */
  async speakWithEmotion(text: string, emotion: EmotionType): Promise<void> {
    // 1. 分析文本情感
    const profile = this.analyzeTextEmotion(text);
    
    // 2. 生成 TTS 参数
    const params = this.generateTTSParams(profile);
    
    // 3. 添加情感标记
    const processedText = this.addEmotionalMarkers(text, profile);
    
    // 4. 播放呼吸声 (句首吸气)
    if (this.breathConfig.enabled && Math.random() < this.breathConfig.frequency) {
      await this.playBreathSound('inhale', 0.5 + profile.nervousness * 0.5);
      await this.wait(300);
    }
    
    // 5. 合成并播放语音
    // 这里需要集成到实际 TTS 服务
    console.log('[EmotionalTTS] Speaking with emotion:', {
      text: processedText,
      params,
      emotion,
    });
    
    // TODO: 调用实际 TTS 服务
    // await ttsService.speak(processedText, params);
    
    // 6. 播放呼气声 (句末)
    if (this.breathConfig.enabled && profile.sadness > 0.3) {
      await this.wait(200);
      await this.playBreathSound('exhale', 0.7);
    }
  }
  
  /**
   * 等待指定时间
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 设置呼吸配置
   */
  setBreathConfig(config: Partial<BreathConfig>): void {
    this.breathConfig = { ...this.breathConfig, ...config };
  }
  
  /**
   * 设置语气词配置
   */
  setFillerWordConfig(config: Partial<FillerWordConfig>): void {
    this.fillerWordConfig = { ...this.fillerWordConfig, ...config };
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): {
    breath: BreathConfig;
    fillerWords: FillerWordConfig;
  } {
    return {
      breath: this.breathConfig,
      fillerWords: this.fillerWordConfig,
    };
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.breathSounds = [];
  }
}

export const emotionalTTSService = new EmotionalTTSService();
