/**
 * ElevenLabs TTS 服务
 * 提供高质量、自然的语音合成
 * 
 * API 文档：https://elevenlabs.io/docs/api-reference
 */

import { useAppStore } from '@/stores/useAppStore';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  preview_url?: string;
}

export class ElevenLabsService {
  private apiKey: string = '';
  private selectedVoiceId: string = 'EXAVITQu4vr4xnSDxMaL'; // 默认：Bella (中文支持好)
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private isInitialized = false;
  
  // 预定义声音列表
  private voices: ElevenLabsVoice[] = [
    {
      voice_id: 'EXAVITQu4vr4xnSDxMaL',
      name: 'Bella',
      category: 'premade',
      description: '温柔女声，中文支持好',
    },
    {
      voice_id: 'AZnzlk1XvdvUeBnXmlld',
      name: 'Domi',
      category: 'premade',
      description: '活力女声',
    },
    {
      voice_id: 'ErXwobaYiN019PkySvjV',
      name: 'Antoni',
      category: 'premade',
      description: '沉稳男声',
    },
    {
      voice_id: 'MF3mGyEYCl7XYWbV9V6O',
      name: 'Elli',
      category: 'premade',
      description: '年轻女声',
    },
    {
      voice_id: 'TxGEqnHWrfWFTfGW9XjX',
      name: 'Josh',
      category: 'premade',
      description: '低沉男声',
    },
    {
      voice_id: 'VR6AewLTigWG4xSOukaG',
      name: 'Arnold',
      category: 'premade',
      description: '磁性男声',
    },
    {
      voice_id: 'pNInz6obpgDQGcFmaJgB',
      name: 'Adam',
      category: 'premade',
      description: '专业男声',
    },
    {
      voice_id: 'yoZ06aMxZJJ28mfd3POQ',
      name: 'Sam',
      category: 'premade',
      description: '温暖男声',
    },
  ];
  
  /**
   * 初始化服务
   */
  initialize(apiKey: string): void {
    this.apiKey = apiKey;
    this.isInitialized = true;
    console.log('[ElevenLabs] Initialized with API key');
  }
  
  /**
   * 检查是否已初始化
   */
  checkInitialized(): boolean {
    if (!this.isInitialized || !this.apiKey) {
      console.warn('[ElevenLabs] Not initialized. Call initialize() first.');
      return false;
    }
    return true;
  }
  
  /**
   * 设置声音
   */
  setVoice(voiceId: string): void {
    this.selectedVoiceId = voiceId;
    console.log('[ElevenLabs] Voice set to:', voiceId);
  }
  
  /**
   * 获取当前声音 ID
   */
  getVoiceId(): string {
    return this.selectedVoiceId;
  }
  
  /**
   * 获取所有可用声音
   */
  getVoices(): ElevenLabsVoice[] {
    return this.voices;
  }
  
  /**
   * 获取当前声音名称
   */
  getCurrentVoiceName(): string {
    const voice = this.voices.find(v => v.voice_id === this.selectedVoiceId);
    return voice?.name || 'Unknown';
  }
  
  /**
   * 生成语音并播放
   */
  async speak(text: string, options?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  }): Promise<void> {
    if (!this.checkInitialized()) {
      throw new Error('ElevenLabs not initialized');
    }
    
    const { setSpeaking } = useAppStore.getState();
    setSpeaking(true);
    
    try {
      const audioBuffer = await this.generateSpeech(text, options);
      await this.playAudio(audioBuffer);
    } catch (error) {
      console.error('[ElevenLabs] Speech generation failed:', error);
      throw error;
    } finally {
      setSpeaking(false);
    }
  }
  
  /**
   * 生成语音 (返回 AudioBuffer)
   */
  async generateSpeech(text: string, options?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  }): Promise<ArrayBuffer> {
    const voiceId = options?.voiceId || this.selectedVoiceId;
    
    const requestBody = {
      text,
      model_id: 'eleven_multilingual_v2', // 支持多语言，包括中文
      voice_settings: {
        stability: options?.stability ?? 0.5,
        similarity_boost: options?.similarityBoost ?? 0.75,
        style: options?.style ?? 0.0,
        use_speaker_boost: options?.useSpeakerBoost ?? true,
      },
    };
    
    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs API error: ${error.detail?.message || response.statusText}`);
    }
    
    const audioBlob = await response.blob();
    return await audioBlob.arrayBuffer();
  }
  
  /**
   * 播放音频
   */
  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext();
      
      audioContext.decodeAudioData(audioBuffer, (buffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          audioContext.close();
          resolve();
        };
        
        source.start();
      }, (error) => {
        audioContext.close();
        reject(error);
      });
    });
  }
  
  /**
   * 生成语音并下载为文件
   */
  async generateAndDownload(text: string, filename: string = 'speech.mp3'): Promise<void> {
    if (!this.checkInitialized()) {
      throw new Error('ElevenLabs not initialized');
    }
    
    const audioBuffer = await this.generateSpeech(text);
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[ElevenLabs] Audio downloaded:', filename);
  }
  
  /**
   * 测试连接 (获取声音列表)
   */
  async testConnection(): Promise<boolean> {
    if (!this.checkInitialized()) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      console.log('[ElevenLabs] Connection test successful');
      return true;
    } catch (error) {
      console.error('[ElevenLabs] Connection test failed:', error);
      return false;
    }
  }
  
  /**
   * 获取账户使用额度
   */
  async getSubscription(): Promise<any> {
    if (!this.checkInitialized()) {
      return null;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/user/subscription`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('[ElevenLabs] Get subscription failed:', error);
      return null;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
