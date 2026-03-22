/**
 * 语音服务 React Context
 * 
 * 提供全局状态管理和生命周期管理
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { ultimateVoiceService, UltimateState, UltimateConfig } from '../services/UltimateVoiceService';
import { VoiceError, handleVoiceError } from '../services/VoiceErrors';
import { voiceEventBus, VOICE_EVENTS } from '../services/VoiceEvents';

/**
 * Context 值接口
 */
export interface VoiceContextValue {
  // 服务实例
  service: typeof ultimateVoiceService;
  
  // 状态
  state: UltimateState | null;
  
  // 生命周期
  isInitialized: boolean;
  isReady: boolean;
  isLoading: boolean;
  
  // 错误
  error: VoiceError | null;
  
  // 方法
  initialize: (config?: Partial<UltimateConfig>) => Promise<void>;
  dispose: () => void;
  speak: (text: string, emotion?: string) => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

/**
 * 创建 Context
 */
const VoiceContext = createContext<VoiceContextValue | null>(null);

/**
 * Provider 组件属性
 */
export interface VoiceProviderProps {
  children: ReactNode;
  config?: Partial<UltimateConfig>;
  autoInitialize?: boolean;
}

/**
 * Provider 组件
 */
export function VoiceProvider({ 
  children, 
  config,
  autoInitialize = true 
}: VoiceProviderProps) {
  const [state, setState] = useState<UltimateState | null>(null);
  const [isInitialized, setInitialized] = useState(false);
  const [isReady, setReady] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  
  // 动画帧更新状态
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      
      if (isInitialized && !error) {
        try {
          const newState = ultimateVoiceService.update(deltaTime);
          setState(newState);
        } catch (err) {
          handleVoiceError(err, 'VoiceProvider', 'Update failed');
        }
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [isInitialized, error]);
  
  // 初始化服务
  const initialize = useCallback(async (initConfig?: Partial<UltimateConfig>) => {
    setLoading(true);
    setError(null);
    
    try {
      await ultimateVoiceService.initialize(initConfig || config);
      setInitialized(true);
      setReady(true);
      
      voiceEventBus.emit(VOICE_EVENTS.INITIALIZED, {
        config: initConfig || config,
      });
      
      console.log('[VoiceProvider] ✅ Service initialized');
    } catch (err) {
      const voiceError = handleVoiceError(
        err,
        'VoiceProvider',
        'Initialization failed',
        () => {
          // 降级处理
          setReady(false);
        }
      ) as VoiceError;
      
      setError(voiceError);
      throw voiceError;
    } finally {
      setLoading(false);
    }
  }, [config]);
  
  // 清理服务
  const dispose = useCallback(() => {
    try {
      ultimateVoiceService.dispose();
      setInitialized(false);
      setReady(false);
      setState(null);
      
      voiceEventBus.emit(VOICE_EVENTS.DISPOSED);
      console.log('[VoiceProvider] 🧹 Service disposed');
    } catch (err) {
      handleVoiceError(err, 'VoiceProvider', 'Dispose failed');
    }
  }, []);
  
  // 说话方法
  const speak = useCallback(async (text: string, emotion?: string) => {
    if (!isReady) {
      console.warn('[VoiceProvider] Service not ready');
      return;
    }
    
    try {
      await ultimateVoiceService.speakWithFullExpression(text, emotion as any);
    } catch (err) {
      handleVoiceError(err, 'VoiceProvider', 'Speak failed');
    }
  }, [isReady]);
  
  // 开始监听
  const startListening = useCallback(async () => {
    if (!isReady) {
      console.warn('[VoiceProvider] Service not ready');
      return;
    }
    
    try {
      await ultimateVoiceService.startListening();
    } catch (err) {
      handleVoiceError(err, 'VoiceProvider', 'Start listening failed');
    }
  }, [isReady]);
  
  // 停止监听
  const stopListening = useCallback(() => {
    ultimateVoiceService.stopListening();
  }, []);
  
  // 自动初始化
  useEffect(() => {
    if (autoInitialize) {
      initialize(config).catch(console.error);
    }
    
    return () => {
      dispose();
    };
  }, [autoInitialize]); // 只运行一次
  
  const value: VoiceContextValue = {
    service: ultimateVoiceService,
    state,
    isInitialized,
    isReady,
    isLoading,
    error,
    initialize,
    dispose,
    speak,
    startListening,
    stopListening,
  };
  
  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

/**
 * Hook 使用语音服务
 */
export function useVoice(): VoiceContextValue {
  const context = useContext(VoiceContext);
  
  if (!context) {
    throw new Error(
      'useVoice must be used within a VoiceProvider. ' +
      'Wrap your component with <VoiceProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook 检查初始化状态
 */
export function useVoiceInitialized(): boolean {
  const context = useContext(VoiceContext);
  return context?.isInitialized ?? false;
}

/**
 * Hook 获取当前状态
 */
export function useVoiceState(): UltimateState | null {
  const context = useContext(VoiceContext);
  return context?.state ?? null;
}

/**
 * Hook 获取错误
 */
export function useVoiceError(): VoiceError | null {
  const context = useContext(VoiceContext);
  return context?.error ?? null;
}
