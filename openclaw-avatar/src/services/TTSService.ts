/**
 * TTS 统一服务
 * 支持多种 TTS 引擎切换
 * 
 * - Web Speech API (浏览器原生，免费)
 * - ElevenLabs (高质量，付费)
 * - OpenClaw TTS (通过 Gateway)
 */

import { useAppStore } from '@/stores/useAppStore';
import { elevenLabsService } from './ElevenLabsService';

export type TTSEngine = 'web-speech' | 'elevenlabs' | 'openclaw';

export interface TTSConfig {
  engine: TTSEngine;
  elevenLabsApiKey?: string;
  voiceId?: string;
  rate?: number;      // Web Speech: 语速 0.1-10
  pitch?: number;     // Web Speech: 音调 0-2
  volume?: number;    // Web Speech: 音量 0-1
}

export class TTSService {
  private config: TTSConfig = {
    engine: 'web-speech',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };
  
  private isInitialized = false;
  
  /**
   * 初始化 TTS 服务
   */
  initialize(config?: Partial<TTSConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    if (this.config.engine === 'elevenlabs' && this.config.elevenLabsApiKey) {
      elevenLabsService.initialize(this.config.elevenLabsApiKey);
    }
    
    this.isInitialized = true;
    console.log('[TTS] Initialized with engine:', this.config.engine);
  }
  
  /**
   * 设置 TTS 引擎
   */
  setEngine(engine: TTSEngine): void {
    this.config.engine = engine;
    console.log('[TTS] Engine switched to:', engine);
  }
  
  /**
   * 获取当前引擎
   */
  getEngine(): TTSEngine {
    return this.config.engine;
  }
  
  /**
   * 设置 ElevenLabs API Key
   */
  setElevenLabsKey(apiKey: string): void {
    this.config.elevenLabsApiKey = apiKey;
    elevenLabsService.initialize(apiKey);
  }
  
  /**
   * 设置声音
   */
  setVoice(voiceId: string): void {
    this.config.voiceId = voiceId;
    elevenLabsService.setVoice(voiceId);
  }
  
  /**
   * 获取可用声音列表 (ElevenLabs)
   */
  getVoices() {
    return elevenLabsService.getVoices();
  }
  
  /**
   * 播放语音
   */
  async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const { setSpeaking } = useAppStore.getState();
    
    try {
      switch (this.config.engine) {
        case 'elevenlabs':
          await this.speakWithElevenLabs(text);
          break;
        case 'openclaw':
          await this.speakWithOpenClaw(text);
          break;
        case 'web-speech':
        default:
          await this.speakWithWebSpeech(text);
          break;
      }
    } catch (error) {
      console.error('[TTS] Speech failed:', error);
      // 降级到 Web Speech API
      console.log('[TTS] Fallback to Web Speech API');
      await this.speakWithWebSpeech(text);
    }
  }
  
  /**
   * Web Speech API
   */
  private async speakWithWebSpeech(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = this.config.rate || 1.0;
      utterance.pitch = this.config.pitch || 1.0;
      utterance.volume = this.config.volume || 1.0;
      
      utterance.onend = () => {
        resolve();
      };
      
      utterance.onerror = (error) => {
        reject(error);
      };
      
      speechSynthesis.speak(utterance);
    });
  }
  
  /**
   * ElevenLabs
   */
  private async speakWithElevenLabs(text: string): Promise<void> {
    if (!this.config.elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not set');
    }
    
    await elevenLabsService.speak(text, {
      voiceId: this.config.voiceId,
    });
  }
  
  /**
   * OpenClaw TTS (通过 Gateway)
   */
  private async speakWithOpenClaw(text: string): Promise<void> {
    // 这里需要调用 OpenClaw 的 tts 工具
    // 简化实现：使用 Web Speech API
    await this.speakWithWebSpeech(text);
  }
  
  /**
   * 停止当前播放
   */
  stop(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    // 如果是 ElevenLabs，需要关闭音频上下文
    // 这里简化处理，实际使用时可能需要更复杂的逻辑
  }
  
  /**
   * 测试 TTS
   */
  async test(): Promise<boolean> {
    try {
      await this.speak('测试语音');
      return true;
    } catch (error) {
      console.error('[TTS] Test failed:', error);
      return false;
    }
  }
  
  /**
   * 测试 ElevenLabs 连接
   */
  async testElevenLabs(): Promise<boolean> {
    return await elevenLabsService.testConnection();
  }
}

export const ttsService = new TTSService();
