/**
 * Silero VAD - 语音活动检测服务
 * 基于深度学习的语音检测，完全离线运行
 * 
 * 模型：https://github.com/snakers4/silero-vad
 * 使用 ONNX Runtime Web 进行本地推理
 */

import * as ort from 'onnxruntime-web';

export interface VADConfig {
  sampleRate: number;
  threshold: number;
  minSpeechDurationMs: number;
  minSilenceDurationMs: number;
}

export class SileroVADService {
  private session: ort.InferenceSession | null = null;
  private isInitialized = false;
  private config: VADConfig = {
    sampleRate: 16000,
    threshold: 0.5,
    minSpeechDurationMs: 250,
    minSilenceDurationMs: 200,
  };
  
  // 内部状态
  private isSpeaking = false;
  private speechStartTime: number = 0;
  private silenceStartTime: number = 0;
  private h: ort.Tensor | null = null;
  private c: ort.Tensor | null = null;
  
  /**
   * 初始化 VAD 服务
   */
  async initialize(modelPath?: string): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const path = modelPath || '/models/silero_vad.onnx';
      console.log('[SileroVAD] Loading model from:', path);
      
      this.session = await ort.InferenceSession.create(path);
      
      // 初始化 LSTM 状态
      this.h = new ort.Tensor('float32', new Float32Array(64).fill(0), [2, 1, 64]);
      this.c = new ort.Tensor('float32', new Float32Array(64).fill(0), [2, 1, 64]);
      
      this.isInitialized = true;
      console.log('[SileroVAD] Initialized');
    } catch (error) {
      console.error('[SileroVAD] Initialization failed:', error);
      throw new Error('Silero VAD 初始化失败，请确保模型文件存在');
    }
  }
  
  /**
   * 检测音频帧是否包含语音
   * @param audioFrame - 音频帧 (Float32Array, 16kHz, 单声道)
   * @returns 语音概率 (0-1)
   */
  async detectSpeech(audioFrame: Float32Array): Promise<number> {
    if (!this.session || !this.isInitialized) {
      throw new Error('SileroVAD not initialized');
    }
    
    // 确保帧长度正确 (Silero VAD 需要 512 或 1536 采样点)
    const frameLength = audioFrame.length;
    if (frameLength !== 512 && frameLength !== 1536) {
      // 重采样或填充
      console.warn('[SileroVAD] Unexpected frame length:', frameLength);
    }
    
    try {
      // 准备输入
      const inputTensor = new ort.Tensor('float32', audioFrame, [1, audioFrame.length]);
      const srTensor = new ort.Tensor('int64', BigInt64Array.from([BigInt(this.config.sampleRate)]), [1]);
      
      // 运行推理
      const feeds: Record<string, ort.Tensor> = {
        input: inputTensor,
        sr: srTensor,
      };
      
      if (this.h && this.c) {
        feeds.h = this.h;
        feeds.c = this.c;
      }
      
      const results = await this.session.run(feeds);
      
      // 更新 LSTM 状态
      this.h = results.hn;
      this.c = results.cn;
      
      // 获取语音概率
      const output = results.output.data as Float32Array;
      const probability = output[0];
      
      return probability;
    } catch (error) {
      console.error('[SileroVAD] Detection failed:', error);
      return 0;
    }
  }
  
  /**
   * 检测语音活动状态 (带状态机)
   * @param audioFrame - 音频帧
   * @returns 是否正在说话
   */
  async processFrame(audioFrame: Float32Array): Promise<boolean> {
    const probability = await this.detectSpeech(audioFrame);
    const now = Date.now();
    
    if (probability >= this.config.threshold) {
      // 检测到语音
      if (!this.isSpeaking) {
        // 从沉默转为说话
        if (this.speechStartTime === 0) {
          this.speechStartTime = now;
        }
        
        // 检查是否达到最小说话持续时间
        if (now - this.speechStartTime >= this.config.minSpeechDurationMs) {
          this.isSpeaking = true;
          this.silenceStartTime = 0;
          console.log('[SileroVAD] Speech started');
        }
      } else {
        // 保持说话状态
        this.silenceStartTime = 0;
      }
    } else {
      // 检测到沉默
      if (this.isSpeaking) {
        // 从说话转为沉默
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = now;
        }
        
        // 检查是否达到最小沉默持续时间
        if (now - this.silenceStartTime >= this.config.minSilenceDurationMs) {
          this.isSpeaking = false;
          this.speechStartTime = 0;
          console.log('[SileroVAD] Speech ended');
        }
      }
    }
    
    return this.isSpeaking;
  }
  
  /**
   * 配置 VAD 参数
   */
  setConfig(config: Partial<VADConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[SileroVAD] Config updated:', this.config);
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): { isSpeaking: boolean; threshold: number } {
    return {
      isSpeaking: this.isSpeaking,
      threshold: this.config.threshold,
    };
  }
  
  /**
   * 重置状态
   */
  reset(): void {
    this.isSpeaking = false;
    this.speechStartTime = 0;
    this.silenceStartTime = 0;
    this.h = null;
    this.c = null;
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
    this.reset();
  }
}

export const sileroVADService = new SileroVADService();
