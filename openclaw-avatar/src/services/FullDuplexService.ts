/**
 * 全双工对话服务
 * 支持 AI 说话时用户打断
 */

import { useAppStore } from '@/stores/useAppStore';
import { ttsService } from './TTSService';

export type InterruptionCallback = (interruptTime: number) => void;

export class FullDuplexService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isAISpeaking = false;
  private interruptionCallback: InterruptionCallback | null = null;
  private vadThreshold = 30; // VAD 阈值
  private animationFrame: number | null = null;
  private isMonitoring = false;
  
  // 打断优化
  private aiSpeechStartTime = 0;
  private interruptionCount = 0;
  private lastInterruptionTime = 0;
  
  /**
   * 初始化音频上下文
   */
  async initialize(): Promise<void> {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      
      console.log('[FullDuplex] Audio context initialized');
    } catch (error) {
      console.error('[FullDuplex] Failed to initialize:', error);
    }
  }
  
  /**
   * 开始麦克风监听
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      if (!this.audioContext || !this.analyser) {
        await this.initialize();
      }
      
      if (this.audioContext && this.analyser) {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
        
        this.isMonitoring = true;
        this.monitorAudioLevel();
        
        console.log('[FullDuplex] Started monitoring');
      }
    } catch (error) {
      console.error('[FullDuplex] Failed to start monitoring:', error);
    }
  }
  
  /**
   * 停止麦克风监听
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    // 关闭所有音轨
    if (this.microphone) {
      const stream = this.microphone.mediaStream as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    
    console.log('[FullDuplex] Stopped monitoring');
  }
  
  /**
   * 监控音频电平
   */
  private monitorAudioLevel() {
    if (!this.isMonitoring || !this.analyser) return;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const detect = () => {
      if (!this.isMonitoring || !this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // 计算平均音量
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // 检测语音活动
      if (average > this.vadThreshold && this.isAISpeaking) {
        console.log('[FullDuplex] User speech detected, interrupting AI');
        this.triggerInterruption();
      }
      
      this.animationFrame = requestAnimationFrame(detect);
    };
    
    detect();
  }
  
  /**
   * AI 开始说话
   */
  aiStartSpeaking() {
    this.isAISpeaking = true;
    this.aiSpeechStartTime = Date.now();
    useAppStore.getState().setSpeaking(true);
    console.log('[FullDuplex] AI started speaking');
  }
  
  /**
   * AI 停止说话
   */
  aiStopSpeaking() {
    this.isAISpeaking = false;
    useAppStore.getState().setSpeaking(false);
    console.log('[FullDuplex] AI stopped speaking');
  }
  
  /**
   * 设置打断回调
   */
  onInterruption(callback: InterruptionCallback) {
    this.interruptionCallback = callback;
  }
  
  /**
   * 播放打断确认音
   */
  private playAckSound() {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 短促的"滴"声
    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }
  
  /**
   * 触发打断 (优化版)
   */
  private triggerInterruption() {
    const interruptTime = Date.now() - this.aiSpeechStartTime;
    const now = Date.now();
    
    // 防止频繁打断 (0.5 秒内只允许一次)
    if (now - this.lastInterruptionTime < 500) {
      return;
    }
    
    this.lastInterruptionTime = now;
    this.interruptionCount++;
    
    console.log(`[FullDuplex] User interrupted AI (at ${interruptTime}ms, total interruptions: ${this.interruptionCount})`);
    
    // 1. 立即停止 AI 语音
    try {
      ttsService.stop();
    } catch (e) {
      console.warn('[FullDuplex] TTS stop failed:', e);
    }
    
    // 2. 播放确认音 (可选)
    this.playAckSound();
    
    // 3. 调用回调 (传入打断时间)
    if (this.interruptionCallback) {
      this.interruptionCallback(interruptTime);
    }
    
    // 4. 重置状态
    this.aiStopSpeaking();
  }
  
  /**
   * 设置 VAD 阈值
   */
  setVADThreshold(threshold: number) {
    this.vadThreshold = threshold;
    console.log('[FullDuplex] VAD threshold set to:', threshold);
  }
  
  /**
   * 获取状态
   */
  getStatus() {
    return {
      isAISpeaking: this.isAISpeaking,
      isMonitoring: this.isMonitoring,
      vadThreshold: this.vadThreshold,
    };
  }
  
  /**
   * 清理资源
   */
  dispose() {
    this.stopMonitoring();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
  }
}

export const fullDuplexService = new FullDuplexService();
