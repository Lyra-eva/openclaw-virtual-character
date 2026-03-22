/**
 * 语音唤醒服务
 * 支持关键词检测，无需点击即可唤醒 AI
 */

export type WakeUpCallback = () => void;

export class VoiceWakeUpService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private wakeWords = ['bella', '你好', '在吗', '嗨', 'hey'];
  private callback: WakeUpCallback | null = null;
  private isEnabled = false;
  private cooldownTime = 3000; // 冷却时间 3 秒
  private lastWakeTime = 0;
  
  // 抗干扰优化
  private consecutiveMatches = 0;
  private readonly REQUIRED_MATCHES = 2; // 连续 2 次检测到才触发
  private confidenceThreshold = 0.7; // 置信度阈值
  private backgroundNoiseLevel = 0; // 背景噪音水平
  
  /**
   * 设置唤醒词
   */
  setWakeWords(words: string[]) {
    this.wakeWords = words;
    console.log('[WakeUp] Wake words set:', words);
  }
  
  /**
   * 启用/禁用唤醒
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.startListening();
    } else {
      this.stopListening();
    }
  }
  
  /**
   * 设置唤醒回调
   */
  onWakeUp(callback: WakeUpCallback) {
    this.callback = callback;
  }
  
  /**
   * 开始监听
   */
  private startListening() {
    if (this.isListening) return;
    
    // @ts-ignore - Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('[WakeUp] Speech Recognition not supported');
      return;
    }
    
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'zh-CN';
      
      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')
          .toLowerCase();
        
        this.checkWakeWord(transcript);
      };
      
      this.recognition.onerror = (event) => {
        console.warn('[WakeUp] Recognition error:', event.error);
        // 自动重启
        if (this.isEnabled) {
          setTimeout(() => this.startListening(), 1000);
        }
      };
      
      this.recognition.onend = () => {
        console.log('[WakeUp] Recognition ended, restarting...');
        if (this.isEnabled) {
          setTimeout(() => this.startListening(), 500);
        }
      };
      
      this.recognition.start();
      this.isListening = true;
      console.log('[WakeUp] Started listening for wake words');
    } catch (error) {
      console.error('[WakeUp] Failed to start:', error);
    }
  }
  
  /**
   * 停止监听
   */
  private stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isListening = false;
    console.log('[WakeUp] Stopped listening');
  }
  
  /**
   * 学习背景噪音水平
   */
  learnBackgroundNoise() {
    console.log('[WakeUp] Learning background noise...');
    // 简单实现：记录当前环境音水平
    // 可以在未来扩展为更复杂的噪音学习
    this.backgroundNoiseLevel = 0.3; // 默认值
  }
  
  /**
   * 计算置信度
   */
  private calculateConfidence(transcript: string, wakeWord: string): number {
    const lowerTranscript = transcript.toLowerCase();
    const lowerWakeWord = wakeWord.toLowerCase();
    
    // 完全匹配
    if (lowerTranscript === lowerWakeWord) {
      return 1.0;
    }
    
    // 包含匹配
    if (lowerTranscript.includes(lowerWakeWord)) {
      // 根据位置计算置信度 (越靠前越高)
      const index = lowerTranscript.indexOf(lowerWakeWord);
      return 0.9 - (index / lowerTranscript.length) * 0.3;
    }
    
    // 模糊匹配 (编辑距离)
    const distance = this.levenshteinDistance(lowerTranscript, lowerWakeWord);
    const maxLength = Math.max(lowerTranscript.length, lowerWakeWord.length);
    
    if (distance <= 2 && maxLength <= 6) {
      return 0.7 - (distance / maxLength) * 0.3;
    }
    
    return 0;
  }
  
  /**
   * 计算编辑距离 (Levenshtein Distance)
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // 删除
            dp[i][j - 1] + 1,    // 插入
            dp[i - 1][j - 1] + 1 // 替换
          );
        }
      }
    }
    
    return dp[m][n];
  }
  
  /**
   * 检测唤醒词 (抗干扰优化版)
   */
  private checkWakeWord(transcript: string) {
    // 检查冷却时间
    const now = Date.now();
    if (now - this.lastWakeTime < this.cooldownTime) {
      return;
    }
    
    // 检测唤醒词并计算置信度
    let maxConfidence = 0;
    let detectedWord = '';
    
    for (const wakeWord of this.wakeWords) {
      const confidence = this.calculateConfidence(transcript, wakeWord);
      
      if (confidence > maxConfidence && confidence >= this.confidenceThreshold) {
        maxConfidence = confidence;
        detectedWord = wakeWord;
      }
    }
    
    // 置信度足够高，计数 +1
    if (maxConfidence > 0) {
      this.consecutiveMatches++;
      
      console.log(`[WakeUp] Detected "${detectedWord}" (confidence: ${maxConfidence.toFixed(2)}, matches: ${this.consecutiveMatches})`);
      
      // 连续检测到 REQUIRED_MATCHES 次才触发
      if (this.consecutiveMatches >= this.REQUIRED_MATCHES) {
        console.log(`[WakeUp] Wake word confirmed: ${detectedWord}`);
        this.triggerWakeUp();
        this.consecutiveMatches = 0;
      }
    } else {
      // 重置计数
      this.consecutiveMatches = 0;
    }
  }
  
  /**
   * 触发唤醒
   */
  private triggerWakeUp() {
    this.lastWakeTime = Date.now();
    console.log('[WakeUp] Wake word detected!');
    
    // 播放唤醒音效
    this.playWakeSound();
    
    // 调用回调
    if (this.callback) {
      this.callback();
    }
  }
  
  /**
   * 播放唤醒音效
   */
  private playWakeSound() {
    // 创建简单的提示音
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880; // A5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    console.log('[WakeUp] Wake sound played');
  }
  
  /**
   * 检查是否支持
   */
  isSupported(): boolean {
    // @ts-ignore
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  
  /**
   * 获取状态
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isListening: this.isListening,
      wakeWords: this.wakeWords,
      isSupported: this.isSupported(),
    };
  }
}

export const voiceWakeUpService = new VoiceWakeUpService();
