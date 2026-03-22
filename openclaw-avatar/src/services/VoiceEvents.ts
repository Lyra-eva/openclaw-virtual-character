/**
 * 语音服务事件总线
 * 
 * 用于解耦服务间依赖，实现松散的通信机制
 */

/**
 * 事件类型定义
 */
export const VOICE_EVENTS = {
  // 生命周期
  INITIALIZED: 'voice:initialized',
  DISPOSED: 'voice:disposed',
  
  // 语音识别
  LISTENING_STARTED: 'voice:listening_started',
  LISTENING_STOPPED: 'voice:listening_stopped',
  TRANSCRIPT_AVAILABLE: 'voice:transcript',
  SPEECH_DETECTED: 'voice:speech_detected',
  
  // 语音合成
  SPEAKING_STARTED: 'voice:speaking_started',
  SPEAKING_STOPPED: 'voice:speaking_stopped',
  TTS_COMPLETE: 'voice:tts_complete',
  
  // 情感状态
  EMOTION_CHANGED: 'voice:emotion_changed',
  MOOD_CHANGED: 'voice:mood_changed',
  
  // 身体语言
  GESTURE_PLAYING: 'voice:gesture_playing',
  GESTURE_COMPLETE: 'voice:gesture_complete',
  POSTURE_CHANGED: 'voice:posture_changed',
  
  // 唇形同步
  LIPSYNC_UPDATE: 'voice:lipsync_update',
  VISEME_CHANGED: 'voice:viseme_changed',
  
  // 环境感知
  CONTEXT_CHANGED: 'voice:context_changed',
  TIME_CHANGED: 'voice:time_changed',
  
  // 错误
  ERROR: 'voice:error',
  WARNING: 'voice:warning',
  
  // 消息
  MESSAGE_SENT: 'voice:message_sent',
  MESSAGE_RECEIVED: 'voice:message_received',
} as const;

export type VoiceEventType = typeof VOICE_EVENTS[keyof typeof VOICE_EVENTS];

/**
 * 事件处理器类型
 */
export type VoiceEventHandler<T = any> = (data: T) => void;

/**
 * 事件数据接口
 */
export interface VoiceEventData {
  type: VoiceEventType;
  data?: any;
  timestamp: number;
  source?: string;
}

/**
 * 事件总线类
 */
export class VoiceEventBus {
  private listeners: Map<VoiceEventType, Set<VoiceEventHandler>> = new Map();
  private eventHistory: VoiceEventData[] = [];
  private maxHistory = 100; // 最多保留 100 条历史事件
  
  /**
   * 订阅事件
   */
  on<T>(event: VoiceEventType, handler: VoiceEventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as VoiceEventHandler);
  }
  
  /**
   * 取消订阅
   */
  off<T>(event: VoiceEventType, handler: VoiceEventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as VoiceEventHandler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  
  /**
   * 订阅一次
   */
  once<T>(event: VoiceEventType, handler: VoiceEventHandler<T>): void {
    const onceHandler = (data: T) => {
      handler(data);
      this.off(event, onceHandler as VoiceEventHandler<T>);
    };
    this.on(event, onceHandler);
  }
  
  /**
   * 发布事件
   */
  emit<T>(event: VoiceEventType, data?: T, source?: string): void {
    const eventData: VoiceEventData = {
      type: event,
      data,
      timestamp: Date.now(),
      source,
    };
    
    // 记录历史
    this.eventHistory.push(eventData);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
    
    // 通知监听器
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[VoiceEventBus] Error in event handler for ${event}:`, error);
        }
      });
    }
    
    // 调试日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[VoiceEventBus] ${event}`, data);
    }
  }
  
  /**
   * 获取历史事件
   */
  getHistory(limit: number = 10): VoiceEventData[] {
    return this.eventHistory.slice(-limit);
  }
  
  /**
   * 清空历史
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
  
  /**
   * 获取监听器数量
   */
  getListenerCount(event: VoiceEventType): number {
    return this.listeners.get(event)?.size || 0;
  }
  
  /**
   * 获取所有事件类型
   */
  getRegisteredEvents(): VoiceEventType[] {
    return Array.from(this.listeners.keys());
  }
  
  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: VoiceEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  
  /**
   * 销毁
   */
  dispose(): void {
    this.removeAllListeners();
    this.clearHistory();
  }
}

/**
 * 全局事件总线单例
 */
export const voiceEventBus = new VoiceEventBus();

/**
 * 快捷方法
 */
export const onVoiceEvent = voiceEventBus.on.bind(voiceEventBus);
export const offVoiceEvent = voiceEventBus.off.bind(voiceEventBus);
export const emitVoiceEvent = voiceEventBus.emit.bind(voiceEventBus);
