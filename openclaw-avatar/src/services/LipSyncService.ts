/**
 * LipSync - 唇形同步服务
 * 基于音频实时分析驱动嘴型动画
 * 
 * 支持：
 * - 实时音量映射 (简单模式)
 * - 音素级唇形 (高级模式)
 * - 多种嘴型插值
 */

export interface Viseme {
  id: number;           // 嘴型 ID (0-14)
  weight: number;       // 权重 (0-1)
  time: number;         // 时间戳 (秒)
  mouthOpen: number;    // 嘴型开合度 (0-1)
  tonguePosition?: number; // 舌头位置 (可选)
}

export interface LipSyncConfig {
  smoothingFactor: number;   // 平滑系数 (0-1)
  mouthOpenScale: number;    // 开合度缩放
  visemeTransitionSpeed: number; // 嘴型切换速度
}

export class LipSyncService {
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  
  private config: LipSyncConfig = {
    smoothingFactor: 0.3,
    mouthOpenScale: 2.5,
    visemeTransitionSpeed: 0.1,
  };
  
  // 状态
  private currentMouthOpen = 0;
  private targetMouthOpen = 0;
  private currentViseme: Viseme | null = null;
  private visemeQueue: Viseme[] = [];
  
  // 嘴型映射 (Viseme 标准 14 种)
  private readonly visemeShapes = [
    'sil',   // 0: 沉默/闭嘴
    'pp',    // 1: 双唇闭合 (p, b, m)
    'ff',    // 2: 上齿咬唇 (f, v)
    'th',    // 3: 舌尖伸出 (th)
    'dd',    // 4: 舌尖抵上颚 (t, d, n)
    'rr',    // 5: 卷舌 (r, l)
    'ss',    // 6: 齿龈摩擦 (s, z)
    'aa',    // 7: 嘴微张 (schwa)
    'e',     // 8: 扁嘴 (ee)
    'i',     // 9: 咧嘴 (ih)
    'o',     // 10: 圆嘴 (oh)
    'u',     // 11: 嘟嘴 (oo)
    'ae',    // 12: 嘴张大 (ae)
    'a',     // 13: 嘴最大 (ah)
    'wide',  // 14: 宽嘴
  ];
  
  /**
   * 初始化唇形同步
   */
  initialize(audioContext?: AudioContext): void {
    this.audioContext = audioContext || new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = this.config.smoothingFactor;
    
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    
    this.isInitialized = true;
    console.log('[LipSync] Initialized');
  }
  
  /**
   * 连接音频源
   */
  connectSource(source: AudioNode): void {
    if (!this.analyser) {
      this.initialize();
    }
    source.connect(this.analyser!);
    console.log('[LipSync] Audio source connected');
  }
  
  /**
   * 获取当前嘴型开合度 (实时模式)
   * @returns 开合度 (0-1)
   */
  getMouthOpen(): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }
    
    // 获取频域数据
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // 重点分析语音频段 (300Hz - 3400Hz)
    // 假设采样率 44.1kHz, fftSize 256
    // 每个 bin 约 172Hz
    const speechStartBin = 2;  // ~344Hz
    const speechEndBin = 20;   // ~3440Hz
    
    let sum = 0;
    let count = 0;
    for (let i = speechStartBin; i < speechEndBin && i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
      count++;
    }
    
    const average = count > 0 ? sum / count : 0;
    
    // 映射到 0-1
    this.targetMouthOpen = Math.min(1, (average / 255) * this.config.mouthOpenScale);
    
    // 平滑过渡
    this.currentMouthOpen += (this.targetMouthOpen - this.currentMouthOpen) * 0.3;
    
    return this.currentMouthOpen;
  }
  
  /**
   * 获取当前嘴型 (Viseme 模式)
   */
  getCurrentViseme(): Viseme | null {
    if (this.visemeQueue.length > 0) {
      return this.visemeQueue[0];
    }
    
    // 如果没有队列，基于音量生成简单 viseme
    const mouthOpen = this.getMouthOpen();
    return {
      id: this.classifyViseme(mouthOpen),
      weight: 1,
      time: performance.now() / 1000,
      mouthOpen,
    };
  }
  
  /**
   * 设置 Viseme 队列 (用于预计算的唇形)
   */
  setVisemeQueue(visemes: Viseme[]): void {
    this.visemeQueue = [...visemes];
  }
  
  /**
   * 从音频缓冲计算 Viseme 序列
   */
  async computeVisemes(audioBuffer: AudioBuffer): Promise<Viseme[]> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const visemes: Viseme[] = [];
    
    // 每 20ms 计算一个 viseme (50fps)
    const frameSize = Math.floor(sampleRate * 0.02);
    
    for (let i = 0; i < channelData.length; i += frameSize) {
      const chunk = channelData.slice(i, Math.min(i + frameSize, channelData.length));
      
      // 计算 RMS
      const rms = this.calculateRMS(chunk);
      const mouthOpen = Math.min(1, rms * this.config.mouthOpenScale);
      
      visemes.push({
        id: this.classifyViseme(mouthOpen),
        weight: 1,
        time: i / sampleRate,
        mouthOpen,
      });
    }
    
    return visemes;
  }
  
  /**
   * 根据音量分类 Viseme
   */
  private classifyViseme(mouthOpen: number): number {
    if (mouthOpen < 0.05) return 0;   // sil - 闭嘴
    if (mouthOpen < 0.15) return 7;   // aa - 微张
    if (mouthOpen < 0.3) return 10;   // o - 中等
    if (mouthOpen < 0.5) return 12;   // ae - 张大
    return 13;                         // a - 最大
  }
  
  /**
   * 计算 RMS (均方根)
   */
  private calculateRMS(samples: Float32Array): number {
    const sum = samples.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / samples.length);
  }
  
  /**
   * 插值两个嘴型
   */
  interpolateVisemes(viseme1: Viseme, viseme2: Viseme, t: number): Viseme {
    return {
      id: viseme1.id,
      weight: viseme1.weight * (1 - t) + viseme2.weight * t,
      time: viseme1.time * (1 - t) + viseme2.time * t,
      mouthOpen: viseme1.mouthOpen * (1 - t) + viseme2.mouthOpen * t,
    };
  }
  
  /**
   * 获取嘴型形状名称
   */
  getVisemeName(visemeId: number): string {
    return this.visemeShapes[visemeId] || 'unknown';
  }
  
  /**
   * 配置参数
   */
  setConfig(config: Partial<LipSyncConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.config.smoothingFactor;
    }
    console.log('[LipSync] Config updated:', this.config);
  }
  
  /**
   * 重置状态
   */
  reset(): void {
    this.currentMouthOpen = 0;
    this.targetMouthOpen = 0;
    this.currentViseme = null;
    this.visemeQueue = [];
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isInitialized = false;
    this.reset();
  }
}

export const lipSyncService = new LipSyncService();
