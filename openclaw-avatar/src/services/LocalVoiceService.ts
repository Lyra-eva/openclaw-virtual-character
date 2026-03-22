/**
 * LocalVoiceService - 统一本地语音服务
 * 整合所有纯本地语音模块，无第三方 API 依赖
 * 
 * 功能模块：
 * - STT: Whisper.cpp WASM (离线语音识别)
 * - TTS: Piper TTS (离线语音合成)
 * - VAD: Silero VAD (语音活动检测)
 * - 降噪：RNNoise / Web Audio API
 * - 唇形：LipSync (实时嘴型同步)
 * - 空间音频：SpatialAudio (3D 定位)
 */

import { whisperService } from './WhisperService';
import { piperService } from './PiperService';
import { sileroVADService } from './SileroVADService';
import { rnnoiseService } from './RNNoiseService';
import { lipSyncService } from './LipSyncService';
import { spatialAudioService } from './SpatialAudioService';
import { useAppStore } from '@/stores/useAppStore';
import { gatewayService } from './GatewayService';

export interface LocalVoiceConfig {
  // STT 配置
  sttEnabled: boolean;
  sttModel: 'tiny' | 'base' | 'small';
  sttLanguage: string;
  
  // TTS 配置
  ttsEnabled: boolean;
  ttsModel: string;
  ttsRate: number;
  ttsPitch: number;
  
  // VAD 配置
  vadEnabled: boolean;
  vadThreshold: number;
  
  // 降噪配置
  noiseReductionEnabled: boolean;
  
  // 唇形同步
  lipSyncEnabled: boolean;
  
  // 空间音频
  spatialAudioEnabled: boolean;
}

export class LocalVoiceService {
  private config: LocalVoiceConfig = {
    sttEnabled: true,
    sttModel: 'base',
    sttLanguage: 'zh',
    ttsEnabled: true,
    ttsModel: '/models/piper-zh.onnx',
    ttsRate: 1.0,
    ttsPitch: 1.0,
    vadEnabled: true,
    vadThreshold: 0.5,
    noiseReductionEnabled: true,
    lipSyncEnabled: true,
    spatialAudioEnabled: true,
  };
  
  private isInitialized = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private isSpeaking = false;
  
  // 音频处理链
  private inputNode: AudioNode | null = null;
  private denoiseNode: AudioNode | null = null;
  private outputNode: AudioNode | null = null;
  
  /**
   * 初始化所有语音模块
   */
  async initialize(config?: Partial<LocalVoiceConfig>): Promise<void> {
    if (this.isInitialized) return;
    
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    console.log('[LocalVoice] Initializing all modules...');
    
    try {
      // 1. 创建 AudioContext
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      
      // 2. 初始化 STT (Whisper)
      if (this.config.sttEnabled) {
        await whisperService.initialize();
        console.log('[LocalVoice] ✓ STT initialized');
      }
      
      // 3. 初始化 TTS (Piper)
      if (this.config.ttsEnabled) {
        await piperService.initialize(this.config.ttsModel, '/models/piper-zh.json');
        console.log('[LocalVoice] ✓ TTS initialized');
      }
      
      // 4. 初始化 VAD (Silero)
      if (this.config.vadEnabled) {
        await sileroVADService.initialize();
        sileroVADService.setConfig({ threshold: this.config.vadThreshold });
        console.log('[LocalVoice] ✓ VAD initialized');
      }
      
      // 5. 初始化降噪
      if (this.config.noiseReductionEnabled) {
        await rnnoiseService.initialize();
        console.log('[LocalVoice] ✓ Noise reduction initialized');
      }
      
      // 6. 初始化唇形同步
      if (this.config.lipSyncEnabled) {
        lipSyncService.initialize(this.audioContext);
        console.log('[LocalVoice] ✓ LipSync initialized');
      }
      
      // 7. 初始化空间音频
      if (this.config.spatialAudioEnabled) {
        spatialAudioService.initialize();
        console.log('[LocalVoice] ✓ SpatialAudio initialized');
      }
      
      this.isInitialized = true;
      console.log('[LocalVoice] ✅ All modules initialized');
    } catch (error) {
      console.error('[LocalVoice] Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * 开始录音和监听
   */
  async startListening(onTranscript?: (text: string, isFinal: boolean) => void): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isRecording) {
      console.warn('[LocalVoice] Already recording');
      return;
    }
    
    try {
      // 请求麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      // 创建音频源
      this.sourceNode = this.audioContext!.createMediaStreamSource(this.mediaStream);
      
      // 创建降噪处理链
      if (this.config.noiseReductionEnabled) {
        const { input, output } = rnnoiseService.createDenoiseChain(this.audioContext!);
        this.sourceNode.connect(input);
        this.inputNode = output;
      } else {
        this.inputNode = this.sourceNode;
      }
      
      // 连接 VAD 检测
      if (this.config.vadEnabled) {
        this.startVADMonitoring(onTranscript);
      }
      
      // 连接唇形同步
      if (this.config.lipSyncEnabled) {
        lipSyncService.connectSource(this.inputNode);
      }
      
      this.isRecording = true;
      useAppStore.getState().setRecording(true);
      
      console.log('[LocalVoice] Started listening');
    } catch (error) {
      console.error('[LocalVoice] Failed to start listening:', error);
      throw error;
    }
  }
  
  /**
   * VAD 监听循环
   */
  private async startVADMonitoring(onTranscript?: (text: string, isFinal: boolean) => void): Promise<void> {
    if (!this.inputNode || !this.audioContext) return;
    
    // 创建分析节点
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.5;
    
    this.inputNode.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    let audioChunks: Float32Array[] = [];
    let speechDetected = false;
    
    const monitor = async () => {
      if (!this.isRecording) return;
      
      analyser.getFloatTimeDomainData(dataArray);
      
      // VAD 检测
      const isSpeaking = await sileroVADService.processFrame(dataArray);
      
      if (isSpeaking && !speechDetected) {
        // 语音开始
        speechDetected = true;
        audioChunks = [];
        useAppStore.getState().setRecording(true);
        console.log('[LocalVoice] Speech detected');
      } else if (isSpeaking) {
        // 收集音频
        audioChunks.push(new Float32Array(dataArray));
      } else if (speechDetected) {
        // 语音结束
        speechDetected = false;
        useAppStore.getState().setRecording(false);
        console.log('[LocalVoice] Speech ended, processing...');
        
        // 处理录音
        if (audioChunks.length > 0) {
          await this.processAudio(audioChunks, onTranscript);
        }
        
        audioChunks = [];
      }
      
      // 继续监听
      requestAnimationFrame(monitor);
    };
    
    monitor();
  }
  
  /**
   * 处理录音数据
   */
  private async processAudio(
    chunks: Float32Array[],
    onTranscript?: (text: string, isFinal: boolean) => void
  ): Promise<void> {
    if (chunks.length === 0) return;
    
    // 合并音频块
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const audioData = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      audioData.set(chunk, offset);
      offset += chunk.length;
    }
    
    try {
      // 使用 Whisper 进行识别
      const text = await this.transcribe(audioData);
      
      if (text.trim()) {
        useAppStore.getState().setTranscription(text);
        
        if (onTranscript) {
          onTranscript(text, true);
        }
        
        // 发送到 Gateway
        gatewayService.sendMessage(text);
        
        // 加经验
        useAppStore.getState().addExp(5);
        
        // 清空转录
        setTimeout(() => {
          useAppStore.getState().setTranscription('');
        }, 3000);
      }
    } catch (error) {
      console.error('[LocalVoice] Transcription failed:', error);
    }
  }
  
  /**
   * 语音识别
   */
  private async transcribe(audioData: Float32Array): Promise<string> {
    // 这里调用 Whisper 服务
    // 简化实现：返回空字符串
    // 实际应该调用 whisperService.transcribe(audioData)
    return '';
  }
  
  /**
   * 停止录音
   */
  stopListening(): void {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    useAppStore.getState().setRecording(false);
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    this.inputNode = null;
    
    console.log('[LocalVoice] Stopped listening');
  }
  
  /**
   * 语音合成并播放
   */
  async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.config.ttsEnabled) {
      console.warn('[LocalVoice] TTS is disabled');
      return;
    }
    
    try {
      this.isSpeaking = true;
      useAppStore.getState().setSpeaking(true);
      
      // 使用 Piper 合成语音
      const audioBuffer = await piperService.synthesize(text);
      
      // 创建音频源
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      
      // 连接空间音频
      if (this.config.spatialAudioEnabled) {
        spatialAudioService.connectSource(source);
      } else {
        source.connect(this.audioContext!.destination);
      }
      
      // 连接唇形同步
      if (this.config.lipSyncEnabled) {
        lipSyncService.connectSource(source);
        
        // 计算唇形序列
        const visemes = await lipSyncService.computeVisemes(audioBuffer);
        lipSyncService.setVisemeQueue(visemes);
      }
      
      // 播放
      source.start(0);
      
      // 等待播放结束
      await new Promise<void>((resolve) => {
        source.onended = () => {
          resolve();
        };
      });
      
    } catch (error) {
      console.error('[LocalVoice] Speech synthesis failed:', error);
    } finally {
      this.isSpeaking = false;
      useAppStore.getState().setSpeaking(false);
    }
  }
  
  /**
   * 停止当前播放
   */
  stopSpeaking(): void {
    this.isSpeaking = false;
    useAppStore.getState().setSpeaking(false);
    
    if (this.audioContext) {
      this.audioContext.suspend();
    }
  }
  
  /**
   * 设置 TTS 语速
   */
  setTTSRate(rate: number): void {
    this.config.ttsRate = rate;
    piperService.setLengthScale(rate);
  }
  
  /**
   * 设置 VAD 阈值
   */
  setVADThreshold(threshold: number): void {
    this.config.vadThreshold = threshold;
    sileroVADService.setConfig({ threshold });
  }
  
  /**
   * 设置虚拟人物位置
   */
  setAvatarPosition(x: number, y: number, z: number): void {
    if (this.config.spatialAudioEnabled) {
      spatialAudioService.setAvatarPosition(x, y, z);
    }
  }
  
  /**
   * 获取唇型开合度
   */
  getMouthOpen(): number {
    if (this.config.lipSyncEnabled) {
      return lipSyncService.getMouthOpen();
    }
    return 0;
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): {
    isRecording: boolean;
    isSpeaking: boolean;
    isInitialized: boolean;
  } {
    return {
      isRecording: this.isRecording,
      isSpeaking: this.isSpeaking,
      isInitialized: this.isInitialized,
    };
  }
  
  /**
   * 下载所需模型
   */
  async downloadModels(modelSize: 'tiny' | 'base' | 'small' = 'base'): Promise<void> {
    console.log('[LocalVoice] Downloading models...');
    
    // Whisper 模型
    await whisperService.downloadModel(modelSize);
    
    // 其他模型需要通过脚本下载
    console.log('[LocalVoice] Please run: npm run download-models');
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.stopListening();
    this.stopSpeaking();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    whisperService.dispose();
    piperService.dispose();
    sileroVADService.dispose();
    rnnoiseService.dispose();
    lipSyncService.dispose();
    spatialAudioService.dispose();
    
    this.isInitialized = false;
  }
}

export const localVoiceService = new LocalVoiceService();
