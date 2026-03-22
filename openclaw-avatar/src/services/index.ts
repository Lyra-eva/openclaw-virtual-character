/**
 * 语音服务统一导出
 * 
 * 方便外部引用，避免循环依赖
 */

// 核心服务
export { ultimateVoiceService, UltimateVoiceService } from './UltimateVoiceService';
export type { UltimateConfig, UltimateState } from './UltimateVoiceService';

// 基础语音
export { localVoiceService, LocalVoiceService } from './LocalVoiceService';
export type { LocalVoiceConfig } from './LocalVoiceService';

// 微表情
export { microExpressionService, MicroExpressionService } from './MicroExpressionService';
export type { ActionUnits, BlinkConfig, PupilConfig, MicroExpressionConfig } from './MicroExpressionService';

// 情感 TTS
export { emotionalTTSService, EmotionalTTSService } from './EmotionalTTSService';
export type { EmotionProfile, EmotionalTTSParams, BreathConfig, FillerWordConfig } from './EmotionalTTSService';

// 身体语言
export { bodyLanguageService, BodyLanguageService } from './BodyLanguageService';
export type { Gesture, BodyPosture, Vector3, BreathingConfig } from './BodyLanguageService';

// 预测唇形
export { predictiveLipSyncService, PredictiveLipSyncService } from './PredictiveLipSyncService';
export type { Phoneme, PredictedVisemeSequence } from './PredictiveLipSyncService';

// 环境感知
export { contextAwareService, ContextAwareService } from './ContextAwareService';
export type { TimeContext, UserState, AmbientSoundState, ConversationContext, AdaptiveConfig } from './ContextAwareService';

// 错误处理
export { 
  VoiceError, 
  VoiceErrorHandler, 
  VoiceErrorCode,
  handleVoiceError,
  throwInitFailed,
  throwModelNotFound,
  throwPermissionDenied,
  throwNotInitialized,
} from './VoiceErrors';

// 事件总线
export { 
  voiceEventBus, 
  VoiceEventBus,
  VOICE_EVENTS,
  onVoiceEvent,
  offVoiceEvent,
  emitVoiceEvent,
} from './VoiceEvents';
export type { VoiceEventType, VoiceEventHandler, VoiceEventData } from './VoiceEvents';

// 已有服务（保持兼容）
export { whisperService } from './WhisperService';
export { piperService } from './PiperService';
export { sileroVADService } from './SileroVADService';
export { rnnoiseService } from './RNNoiseService';
export { lipSyncService } from './LipSyncService';
export { spatialAudioService } from './SpatialAudioService';
export { ttsService } from './TTSService';
export { voiceService } from './VoiceService';
export { gatewayService } from './GatewayService';
