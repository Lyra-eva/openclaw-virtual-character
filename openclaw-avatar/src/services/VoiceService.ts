import { useAppStore } from '@/stores/useAppStore';
import { gatewayService } from './GatewayService';
import { whisperService } from './WhisperService';

export type VoiceEngine = 'web-speech' | 'whisper';

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private isInitialized = false;
  private engine: VoiceEngine = 'web-speech'; // 默认使用 Web Speech API
  
  /**
   * 设置语音识别引擎
   */
  setEngine(engine: VoiceEngine) {
    this.engine = engine;
    console.log('[Voice] Engine set to:', engine);
  }
  
  /**
   * 获取当前引擎
   */
  getEngine(): VoiceEngine {
    return this.engine;
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    if (this.engine === 'whisper') {
      // 初始化 Whisper
      try {
        await whisperService.initialize();
        console.log('[Voice] Whisper initialized');
      } catch (error) {
        console.error('[Voice] Whisper init failed, fallback to Web Speech API');
        this.engine = 'web-speech';
      }
    }
    
    if (this.engine === 'web-speech') {
      // @ts-ignore - Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'zh-CN';
        
        this.recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');
          
          useAppStore.getState().setTranscription(transcript);
          
          if (event.results[0].isFinal) {
            this.handleFinalTranscript(transcript);
          }
        };
        
        this.recognition.onstart = () => {
          useAppStore.getState().setRecording(true);
        };
        
        this.recognition.onend = () => {
          useAppStore.getState().setRecording(false);
        };
        
        this.recognition.onerror = (event) => {
          console.error('[Voice] Recognition error:', event.error);
          useAppStore.getState().setRecording(false);
        };
        
        this.isInitialized = true;
        console.log('[Voice] Web Speech API initialized');
      } else {
        console.warn('[Voice] Speech Recognition not supported');
      }
    }
  }
  
  startListening() {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (this.engine === 'whisper') {
      whisperService.startListening((text, isFinal) => {
        if (isFinal) {
          this.handleFinalTranscript(text);
        }
      });
    } else {
      if (this.recognition && !useAppStore.getState().isRecording) {
        try {
          this.recognition.start();
        } catch (e) {
          console.error('[Voice] Start failed:', e);
        }
      }
    }
  }
  
  stopListening() {
    if (this.engine === 'whisper') {
      whisperService.stopListening();
    } else {
      if (this.recognition) {
        this.recognition.stop();
      }
    }
  }
  
  private handleFinalTranscript(text: string) {
    if (text.trim()) {
      useAppStore.getState().setTranscription('');
      gatewayService.sendMessage(text);
    }
  }
  
  isSupported(): boolean {
    if (this.engine === 'whisper') {
      return whisperService.isSupported();
    }
    // @ts-ignore
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  
  /**
   * 下载 Whisper 模型 (离线使用)
   */
  async downloadWhisperModel(modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large' = 'base') {
    await whisperService.downloadModel(modelSize);
  }
}

export const voiceService = new VoiceService();
