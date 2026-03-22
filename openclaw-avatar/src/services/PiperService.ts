/**
 * Piper TTS - 本地语音合成服务
 * 基于 Mozilla TTS 的 ONNX 推理
 * 
 * 完全离线运行，高质量中文语音
 * 项目：https://github.com/rhasspy/piper
 * 模型：https://huggingface.co/rhasspy/piper-voices
 */

import * as ort from 'onnxruntime-web';

export interface PiperConfig {
  modelPath: string;
  configPath: string;
  sampleRate: number;
  speakerId?: number;
  lengthScale?: number;      // 语速 (0.5-2.0)
  noiseScale?: number;       // 噪音 (0.0-1.0)
  noiseW?: number;           // 噪音宽度 (0.0-1.0)
}

export interface Phoneme {
  text: string;
  duration: number;
}

export class PiperService {
  private session: ort.InferenceSession | null = null;
  private config: PiperConfig | null = null;
  private isInitialized = false;
  
  // 语音合成参数
  private defaultLengthScale = 1.0;
  private defaultNoiseScale = 0.667;
  private defaultNoiseW = 0.8;
  
  /**
   * 初始化 Piper TTS
   */
  async initialize(modelPath?: string, configPath?: string): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const model = modelPath || '/models/piper-zh.onnx';
      const config = configPath || '/models/piper-zh.json';
      
      console.log('[Piper] Loading model from:', model);
      console.log('[Piper] Loading config from:', config);
      
      // 加载配置
      const configResponse = await fetch(config);
      this.config = await configResponse.json() as PiperConfig;
      this.config.modelPath = model;
      this.config.configPath = config;
      
      // 加载 ONNX 模型
      this.session = await ort.InferenceSession.create(model);
      
      this.isInitialized = true;
      console.log('[Piper] Initialized with model:', model);
    } catch (error) {
      console.error('[Piper] Initialization failed:', error);
      throw new Error('Piper TTS 初始化失败，请确保模型文件存在');
    }
  }
  
  /**
   * 文本转语音
   * @param text - 输入文本
   * @returns 音频缓冲
   */
  async synthesize(text: string): Promise<AudioBuffer> {
    if (!this.session || !this.config) {
      throw new Error('Piper not initialized');
    }
    
    try {
      // 1. 文本转音素
      const phonemes = this.textToPhonemes(text);
      
      // 2. 音素转音频
      const audioData = await this.synthesizeFromPhonemes(phonemes);
      
      // 3. 创建 AudioBuffer
      return this.createAudioBuffer(audioData, this.config.sampleRate);
    } catch (error) {
      console.error('[Piper] Synthesis failed:', error);
      throw error;
    }
  }
  
  /**
   * 文本转音素 (简化实现)
   * 实际应该使用 g2p 库进行精确转换
   */
  private textToPhonemes(text: string): string {
    // 简化处理：直接使用文本
    // 实际应该使用：https://github.com/mozilla/TTS 或类似库
    
    // 中文文本处理
    const processed = text
      .replace(/([,.!?])/g, ' $1 ')  // 标点符号前后加空格
      .replace(/\s+/g, ' ')          // 多余空格合并
      .trim();
    
    return processed;
  }
  
  /**
   * 从音素合成音频
   */
  private async synthesizeFromPhonemes(phonemes: string): Promise<Float32Array> {
    if (!this.session) {
      throw new Error('Piper session not initialized');
    }
    
    // 准备输入
    // 注意：Piper 的输入格式需要根据具体模型调整
    const phonemeIds = this.phonemesToIds(phonemes);
    const phonemeLengths = new Int64Array([phonemeIds.length]);
    const phonemeIdsArray = new Int64Array(phonemeIds);
    
    const inputTensor = new ort.Tensor('int64', phonemeIdsArray, [1, phonemeIds.length]);
    const inputLengths = new ort.Tensor('int64', phonemeLengths, [1]);
    
    // 运行推理
    const feeds: Record<string, ort.Tensor> = {
      input: inputTensor,
      input_lengths: inputLengths,
    };
    
    const results = await this.session.run(feeds);
    
    // 获取输出音频
    const output = results.output.data as Float32Array;
    return output;
  }
  
  /**
   * 音素转 ID (简化实现)
   */
  private phonemesToIds(phonemes: string): number[] {
    // 简化处理：使用字符编码
    // 实际应该使用模型的音素表
    const ids: number[] = [];
    for (const char of phonemes) {
      if (char !== ' ') {
        ids.push(char.charCodeAt(0));
      }
    }
    return ids;
  }
  
  /**
   * 创建 AudioBuffer
   */
  private createAudioBuffer(audioData: Float32Array, sampleRate: number): AudioBuffer {
    const audioContext = new AudioContext({ sampleRate });
    const buffer = audioContext.createBuffer(1, audioData.length, sampleRate);
    buffer.getChannelData(0).set(audioData);
    return buffer;
  }
  
  /**
   * 流式合成 (返回 AsyncIterable)
   */
  async *synthesizeStream(text: string): AsyncGenerator<AudioBuffer> {
    if (!this.session || !this.config) {
      throw new Error('Piper not initialized');
    }
    
    // 分句处理
    const sentences = text.split(/([.!?。！？])/).filter(s => s.trim());
    
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] + (sentences[i + 1] || '');
      if (sentence.trim()) {
        const buffer = await this.synthesize(sentence);
        yield buffer;
      }
    }
  }
  
  /**
   * 设置语速
   */
  setLengthScale(scale: number): void {
    this.defaultLengthScale = Math.max(0.5, Math.min(2.0, scale));
    console.log('[Piper] Length scale set to:', this.defaultLengthScale);
  }
  
  /**
   * 获取配置
   */
  getConfig(): PiperConfig | null {
    return this.config;
  }
  
  /**
   * 检查是否支持
   */
  isSupported(): boolean {
    return typeof ort !== 'undefined';
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    if (this.session) {
      this.session.release();
      this.session = null;
    }
    this.isInitialized = false;
  }
}

export const piperService = new PiperService();
