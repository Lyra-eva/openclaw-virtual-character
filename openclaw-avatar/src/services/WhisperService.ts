/**
 * Whisper.cpp WebAssembly 语音识别服务
 * 完全离线，支持中文，高精度
 * 
 * 使用库：https://github.com/ggerganov/whisper.cpp
 * WebAssembly 版本：https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.wasm
 */

import { useAppStore } from '@/stores/useAppStore';
import { gatewayService } from './GatewayService';

export class WhisperService {
  private ctx: any = null;
  private isInitialized = false;
  private isProcessing = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private whisperModule: any = null;
  
  // Whisper.cpp WASM 参数
  private params = {
    model: 'ggml-base.bin',  // 模型文件
    language: 'zh',          // 中文
    translate: false,        // 不翻译
    print_progress: false,
  };
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // 加载 Whisper.cpp WASM 模块
      // 需要从 whisper.cpp 构建或下载预编译版本
      const modulePath = '/whisper/whisper.js';
      
      // @ts-ignore - WASM 模块加载
      const whisper = await import(modulePath);
      this.whisperModule = whisper;
      
      // 初始化 Whisper 上下文
      this.ctx = await whisper.init({
        model: this.params.model,
        language: this.params.language,
      });
      
      this.isInitialized = true;
      console.log('[Whisper] Initialized with model:', this.params.model);
    } catch (error) {
      console.error('[Whisper] Initialization failed:', error);
      throw new Error('Whisper 初始化失败，请确保模型文件已下载');
    }
  }
  
  /**
   * 开始录音并识别
   */
  startListening(onTranscript?: (text: string, isFinal: boolean) => void): void {
    if (!this.isInitialized) {
      console.warn('[Whisper] Not initialized, call initialize() first');
      return;
    }
    
    if (this.isProcessing) {
      console.warn('[Whisper] Already processing');
      return;
    }
    
    // 请求麦克风权限
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        
        this.mediaRecorder.onstop = async () => {
          // 录音停止，处理音频
          await this.processAudio(onTranscript);
        };
        
        // 开始录音
        this.mediaRecorder.start(1000); // 每秒一个 chunk
        useAppStore.getState().setRecording(true);
        
        console.log('[Whisper] Recording started');
      })
      .catch((error) => {
        console.error('[Whisper] Microphone access denied:', error);
        alert('需要麦克风权限才能进行语音识别');
      });
  }
  
  /**
   * 停止录音
   */
  stopListening(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      useAppStore.getState().setRecording(false);
      
      // 停止所有音轨
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      console.log('[Whisper] Recording stopped');
    }
  }
  
  /**
   * 处理录音数据并进行语音识别
   */
  private async processAudio(onTranscript?: (text: string, isFinal: boolean) => void): Promise<void> {
    if (this.audioChunks.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      // 合并音频块
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
      
      // 转换为 ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // 使用 Whisper 进行识别
      const result = await this.transcribe(arrayBuffer);
      
      if (result.text.trim()) {
        // 实时更新转录文本
        useAppStore.getState().setTranscription(result.text);
        
        if (onTranscript) {
          onTranscript(result.text, true);
        }
        
        // 发送到 Gateway
        gatewayService.sendMessage(result.text);
        
        // 加经验
        useAppStore.getState().addExp(5);
      }
      
      // 清空转录
      setTimeout(() => {
        useAppStore.getState().setTranscription('');
      }, 3000);
      
    } catch (error) {
      console.error('[Whisper] Transcription failed:', error);
    } finally {
      this.isProcessing = false;
      this.audioChunks = [];
    }
  }
  
  /**
   * 核心转录方法
   */
  private async transcribe(audioBuffer: ArrayBuffer): Promise<{ text: string }> {
    if (!this.ctx) {
      throw new Error('Whisper context not initialized');
    }
    
    // 将音频转换为 16kHz 单声道 PCM
    const audioData = await this.convertAudio(audioBuffer);
    
    // 调用 Whisper.cpp 进行识别
    const result = await this.ctx.transcribe(audioData, {
      language: this.params.language,
      translate: this.params.translate,
      print_progress: this.params.print_progress,
    });
    
    return {
      text: result.text || '',
    };
  }
  
  /**
   * 音频格式转换 (转为 16kHz 单声道 PCM)
   */
  private async convertAudio(audioBuffer: ArrayBuffer): Promise<Float32Array> {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const decoded = await audioContext.decodeAudioData(audioBuffer);
    
    // 转为单声道
    const channel = decoded.getChannelData(0);
    
    // 重采样到 16kHz (如果必要)
    if (decoded.sampleRate !== 16000) {
      const offlineContext = new OfflineAudioContext(1, channel.length, 16000);
      const source = offlineContext.createBufferSource();
      source.buffer = decoded;
      source.connect(offlineContext.destination);
      source.start();
      const resampled = await offlineContext.startRendering();
      return resampled.getChannelData(0);
    }
    
    return channel;
  }
  
  /**
   * 下载 Whisper 模型
   */
  async downloadModel(modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large' = 'base'): Promise<void> {
    const modelUrls = {
      tiny: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
      base: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
      small: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
      medium: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
      large: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    };
    
    const url = modelUrls[modelSize];
    const filename = `ggml-${modelSize}.bin`;
    
    console.log('[Whisper] Downloading model:', url);
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 保存到本地存储 (Tauri 应用)
      if ('__TAURI__' in window) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeBinaryFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        
        const filePath = await save({
          defaultPath: filename,
          filters: [{
            name: 'Whisper Model',
            extensions: ['bin'],
          }],
        });
        
        if (filePath) {
          const arrayBuffer = await blob.arrayBuffer();
          await writeBinaryFile(filePath, new Uint8Array(arrayBuffer), {
            baseDir: BaseDirectory.AppData,
          });
          console.log('[Whisper] Model saved to:', filePath);
        }
      }
    } catch (error) {
      console.error('[Whisper] Model download failed:', error);
      throw error;
    }
  }
  
  /**
   * 检查是否支持
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.stopListening();
    if (this.ctx) {
      this.ctx.free();
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}

export const whisperService = new WhisperService();
