/**
 * 语音服务统一错误处理
 * 
 * 提供统一的错误类型和处理机制
 */

/**
 * 错误代码枚举
 */
export enum VoiceErrorCode {
  // 初始化相关
  INIT_FAILED = 'INIT_FAILED',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  ALREADY_INITIALIZED = 'ALREADY_INITIALIZED',
  
  // 模型相关
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
  
  // 权限相关
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  MEDIA_DEVICES_NOT_FOUND = 'MEDIA_DEVICES_NOT_FOUND',
  
  // 音频相关
  AUDIO_CONTEXT_FAILED = 'AUDIO_CONTEXT_FAILED',
  AUDIO_PLAYBACK_FAILED = 'AUDIO_PLAYBACK_FAILED',
  AUDIO_RECORDING_FAILED = 'AUDIO_RECORDING_FAILED',
  
  // 服务相关
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TTS_FAILED = 'TTS_FAILED',
  STT_FAILED = 'STT_FAILED',
  VAD_FAILED = 'VAD_FAILED',
  
  // 运行时
  INVALID_STATE = 'INVALID_STATE',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  TIMEOUT = 'TIMEOUT',
  
  // 未知
  UNKNOWN = 'UNKNOWN',
}

/**
 * 统一错误类
 */
export class VoiceError extends Error {
  public readonly code: VoiceErrorCode;
  public readonly service: string;
  public readonly originalError?: Error;
  public readonly timestamp: number;
  
  constructor(
    code: VoiceErrorCode,
    service: string,
    message: string,
    originalError?: Error
  ) {
    super(`[${service}] ${code}: ${message}`);
    this.name = 'VoiceError';
    this.code = code;
    this.service = service;
    this.originalError = originalError;
    this.timestamp = Date.now();
    
    // 保持正确的原型链
    Object.setPrototypeOf(this, VoiceError.prototype);
  }
  
  /**
   * 转换为 JSON
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      service: this.service,
      message: this.message,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
  
  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    switch (this.code) {
      case VoiceErrorCode.MODEL_NOT_FOUND:
        return '模型文件不存在，请运行：npm run download-models';
      case VoiceErrorCode.PERMISSION_DENIED:
        return '权限被拒绝，请检查浏览器设置';
      case VoiceErrorCode.MEDIA_DEVICES_NOT_FOUND:
        return '未找到麦克风设备';
      case VoiceErrorCode.AUDIO_CONTEXT_FAILED:
        return '音频系统初始化失败';
      case VoiceErrorCode.NOT_INITIALIZED:
        return '服务未初始化，请先调用 initialize()';
      default:
        return this.message;
    }
  }
}

/**
 * 错误处理工具
 */
export class VoiceErrorHandler {
  private static errorHandlers: Map<VoiceErrorCode, (error: VoiceError) => void> = new Map();
  
  /**
   * 注册错误处理器
   */
  static registerHandler(
    code: VoiceErrorCode,
    handler: (error: VoiceError) => void
  ): void {
    this.errorHandlers.set(code, handler);
  }
  
  /**
   * 处理错误
   */
  static handle(
    error: unknown,
    service: string,
    context: string,
    fallback?: () => void
  ): VoiceError | null {
    if (error instanceof VoiceError) {
      console.error(`[Voice] ${context}:`, error);
      
      // 调用注册的处理器
      const handler = this.errorHandlers.get(error.code);
      handler?.(error);
      
      fallback?.();
      return error;
    }
    
    // 未知错误转换为 VoiceError
    const voiceError = new VoiceError(
      VoiceErrorCode.UNKNOWN,
      service,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error : undefined
    );
    
    console.error(`[Voice] ${context}: 未知错误`, voiceError);
    fallback?.();
    return voiceError;
  }
  
  /**
   * 抛出初始化错误
   */
  static throwInitFailed(service: string, error?: Error): never {
    throw new VoiceError(
      VoiceErrorCode.INIT_FAILED,
      service,
      '服务初始化失败',
      error
    );
  }
  
  /**
   * 抛出模型错误
   */
  static throwModelNotFound(modelPath: string): never {
    throw new VoiceError(
      VoiceErrorCode.MODEL_NOT_FOUND,
      'ModelLoader',
      `模型文件不存在：${modelPath}`
    );
  }
  
  /**
   * 抛出权限错误
   */
  static throwPermissionDenied(feature: string): never {
    throw new VoiceError(
      VoiceErrorCode.PERMISSION_DENIED,
      'Permissions',
      `${feature} 权限被拒绝`
    );
  }
  
  /**
   * 抛出未初始化错误
   */
  static throwNotInitialized(service: string): never {
    throw new VoiceError(
      VoiceErrorCode.NOT_INITIALIZED,
      service,
      '服务未初始化'
    );
  }
}

/**
 * 默认错误处理器
 */
VoiceErrorHandler.registerHandler(
  VoiceErrorCode.MODEL_NOT_FOUND,
  (error) => {
    console.warn('💡 解决方案：运行 npm run download-models 下载模型文件');
  }
);

VoiceErrorHandler.registerHandler(
  VoiceErrorCode.PERMISSION_DENIED,
  (error) => {
    console.warn('💡 解决方案：在浏览器设置中授予麦克风权限');
  }
);

// 导出快捷方法
export const handleVoiceError = VoiceErrorHandler.handle;
export const throwInitFailed = VoiceErrorHandler.throwInitFailed;
export const throwModelNotFound = VoiceErrorHandler.throwModelNotFound;
export const throwPermissionDenied = VoiceErrorHandler.throwPermissionDenied;
export const throwNotInitialized = VoiceErrorHandler.throwNotInitialized;
