/**
 * SpatialAudio - 3D 空间音频服务
 * 使用 Web Audio API 实现 HRTF 空间定位
 * 
 * 功能：
 * - 3D 声源定位
 * - 距离衰减模拟
 * - 环境混响
 * - 多声道输出
 */

export interface SpatialConfig {
  listenerPosition: Vector3;
  avatarPosition: Vector3;
  roomSize: Vector3;
  reverbEnabled: boolean;
  hrtfEnabled: boolean;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export class SpatialAudioService {
  private context: AudioContext | null = null;
  private listener: AudioListener | null = null;
  private panner: PannerNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  
  private config: SpatialConfig = {
    listenerPosition: { x: 0, y: 0, z: 0 },
    avatarPosition: { x: 0, y: 0, z: -2 }, // 默认在屏幕前方 2 米
    roomSize: { x: 5, y: 3, z: 4 },
    reverbEnabled: true,
    hrtfEnabled: true,
  };
  
  /**
   * 初始化空间音频
   */
  initialize(): void {
    if (this.isInitialized) return;
    
    this.context = new AudioContext();
    this.listener = this.context.listener;
    
    // 创建 PannerNode (3D 定位)
    this.panner = this.context.createPanner();
    this.panner.panningModel = this.config.hrtfEnabled ? 'HRTF' : 'equalpower';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;      // 参考距离 1 米
    this.panner.maxDistance = 100;    // 最大距离 100 米
    this.panner.rolloffFactor = 1;    // 衰减系数
    this.panner.coneInnerAngle = 360; // 内角 360 度 (全向)
    this.panner.coneOuterAngle = 360;
    this.panner.coneOuterGain = 0;
    
    // 设置初始位置
    this.updatePositions();
    
    // 创建混响效果
    if (this.config.reverbEnabled) {
      this.createReverb();
    }
    
    // 主音量控制
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1.0;
    
    // 连接节点链
    this.panner.connect(this.reverbNode || this.masterGain);
    if (this.reverbNode) {
      this.reverbNode.connect(this.masterGain);
    }
    this.masterGain.connect(this.context.destination);
    
    this.isInitialized = true;
    console.log('[SpatialAudio] Initialized with HRTF:', this.config.hrtfEnabled);
  }
  
  /**
   * 创建房间混响
   */
  private createReverb(): void {
    if (!this.context) return;
    
    this.reverbNode = this.context.createConvolver();
    
    // 生成脉冲响应 (模拟房间混响)
    const impulse = this.createRoomImpulseResponse();
    this.reverbNode.buffer = impulse;
  }
  
  /**
   * 生成房间脉冲响应
   */
  private createRoomImpulseResponse(): AudioBuffer {
    if (!this.context) {
      throw new Error('AudioContext not initialized');
    }
    
    const sampleRate = this.context.sampleRate;
    const duration = 2.0; // 混响持续时间 2 秒
    const length = sampleRate * duration;
    
    const impulse = this.context.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    // 生成指数衰减的噪音
    const decay = 2.0; // 衰减时间
    for (let i = 0; i < length; i++) {
      const n = length - i;
      const envelope = Math.pow(n / length, decay);
      
      // 添加一些随机反射
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }
    
    return impulse;
  }
  
  /**
   * 更新声源和听者位置
   */
  updatePositions(): void {
    if (!this.panner || !this.listener) return;
    
    // 设置声源位置 (虚拟人物)
    this.panner.positionX.value = this.config.avatarPosition.x;
    this.panner.positionY.value = this.config.avatarPosition.y;
    this.panner.positionZ.value = this.config.avatarPosition.z;
    
    // 设置听者位置 (用户)
    this.listener.positionX.value = this.config.listenerPosition.x;
    this.listener.positionY.value = this.config.listenerPosition.y;
    this.listener.positionZ.value = this.config.listenerPosition.z;
    
    // 设置听者朝向 (面向屏幕)
    this.listener.forwardX.value = 0;
    this.listener.forwardY.value = 0;
    this.listener.forwardZ.value = -1;
    
    // 设置听者向上方向
    this.listener.upX.value = 0;
    this.listener.upY.value = 1;
    this.listener.upZ.value = 0;
  }
  
  /**
   * 设置虚拟人物位置
   */
  setAvatarPosition(x: number, y: number, z: number): void {
    this.config.avatarPosition = { x, y, z };
    this.updatePositions();
  }
  
  /**
   * 设置用户位置
   */
  setListenerPosition(x: number, y: number, z: number): void {
    this.config.listenerPosition = { x, y, z };
    this.updatePositions();
  }
  
  /**
   * 连接音频源
   */
  connectSource(source: AudioNode): AudioNode {
    if (!this.isInitialized) {
      this.initialize();
    }
    source.connect(this.panner!);
    return this.panner!;
  }
  
  /**
   * 设置主音量
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  /**
   * 启用/禁用混响
   */
  setReverbEnabled(enabled: boolean): void {
    if (!this.context || !this.panner || !this.masterGain) return;
    
    if (enabled && !this.reverbNode) {
      this.createReverb();
      if (this.reverbNode) {
        this.panner.disconnect();
        this.panner.connect(this.reverbNode);
        this.reverbNode.connect(this.masterGain);
      }
    } else if (!enabled && this.reverbNode) {
      this.panner.disconnect();
      this.panner.connect(this.masterGain);
    }
    
    this.config.reverbEnabled = enabled;
    console.log('[SpatialAudio] Reverb:', enabled ? 'enabled' : 'disabled');
  }
  
  /**
   * 启用/禁用 HRTF
   */
  setHRTFEnabled(enabled: boolean): void {
    if (!this.panner) return;
    
    this.panner.panningModel = enabled ? 'HRTF' : 'equalpower';
    this.config.hrtfEnabled = enabled;
    console.log('[SpatialAudio] HRTF:', enabled ? 'enabled' : 'disabled');
  }
  
  /**
   * 设置房间大小
   */
  setRoomSize(width: number, height: number, depth: number): void {
    this.config.roomSize = { x: width, y: height, z: depth };
    // 重新生成混响
    if (this.config.reverbEnabled) {
      this.createReverb();
      if (this.reverbNode && this.panner && this.masterGain) {
        this.reverbNode.buffer = this.createRoomImpulseResponse();
      }
    }
  }
  
  /**
   * 获取 AudioContext
   */
  getContext(): AudioContext | null {
    return this.context;
  }
  
  /**
   * 计算声源距离
   */
  getDistance(): number {
    const dx = this.config.avatarPosition.x - this.config.listenerPosition.x;
    const dy = this.config.avatarPosition.y - this.config.listenerPosition.y;
    const dz = this.config.avatarPosition.z - this.config.listenerPosition.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    if (this.panner) {
      this.panner.disconnect();
      this.panner = null;
    }
    if (this.reverbNode) {
      this.reverbNode.disconnect();
      this.reverbNode = null;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
    }
    this.isInitialized = false;
  }
}

export const spatialAudioService = new SpatialAudioService();
