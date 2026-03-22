/**
 * ContextAwareService - 环境感知服务
 * 让 AI 具备"察言观色"的能力
 * 
 * 功能：
 * - 时间感知 (早晚/日期)
 * - 用户状态检测
 * - 环境声音分析
 * - 对话上下文管理
 * - 自适应行为调整
 */



/**
 * 时间上下文
 */
export interface TimeContext {
  hour: number;
  dayOfWeek: number;
  isMorning: boolean;
  isAfternoon: boolean;
  isEvening: boolean;
  isNight: boolean;
  isWeekend: boolean;
  greeting: string;
}

/**
 * 用户状态
 */
export interface UserState {
  isBusy: boolean;
  mood: 'happy' | 'neutral' | 'sad' | 'stressed';
  attentionLevel: number; // 0-1
  energyLevel: number;    // 0-1
}

/**
 * 环境声音状态
 */
export interface AmbientSoundState {
  noiseLevel: number;     // 0-1
  isQuiet: boolean;
  isNoisy: boolean;
  dominantFrequency: number;
}

/**
 * 对话上下文
 */
export interface ConversationContext {
  recentTopics: string[];
  userPreferences: Record<string, any>;
  ongoingTasks: Array<{
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  lastInteraction: number;
  interactionCount: number;
}

/**
 * 自适应配置
 */
export interface AdaptiveConfig {
  autoAdjustVolume: boolean;
  autoAdjustRate: boolean;
  autoAdjustResponseStyle: boolean;
  quietHours: { start: number; end: number };
}

export type ResponseStyle = 'concise' | 'normal' | 'detailed';

export class ContextAwareService {
  private timeContext: TimeContext;
  private userState: UserState = {
    isBusy: false,
    mood: 'neutral',
    attentionLevel: 0.8,
    energyLevel: 0.7,
  };
  private ambientSound: AmbientSoundState = {
    noiseLevel: 0.3,
    isQuiet: true,
    isNoisy: false,
    dominantFrequency: 500,
  };
  private conversationContext: ConversationContext = {
    recentTopics: [],
    userPreferences: {},
    ongoingTasks: [],
    lastInteraction: Date.now(),
    interactionCount: 0,
  };
  private adaptiveConfig: AdaptiveConfig = {
    autoAdjustVolume: true,
    autoAdjustRate: true,
    autoAdjustResponseStyle: true,
    quietHours: { start: 22, end: 8 },
  };
  
  constructor() {
    this.timeContext = this.updateTimeContext();
    this.startTimeContextUpdates();
  }
  
  /**
   * 更新时间上下文
   */
  private updateTimeContext(): TimeContext {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    return {
      hour,
      dayOfWeek,
      isMorning: hour >= 5 && hour < 12,
      isAfternoon: hour >= 12 && hour < 18,
      isEvening: hour >= 18 && hour < 22,
      isNight: hour >= 22 || hour < 5,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      greeting: this.getGreetingByHour(hour),
    };
  }
  
  /**
   * 根据小时获取问候语
   */
  private getGreetingByHour(hour: number): string {
    if (hour >= 5 && hour < 12) return '早上好';
    if (hour >= 12 && hour < 18) return '下午好';
    if (hour >= 18 && hour < 22) return '晚上好';
    return '夜深了';
  }
  
  /**
   * 启动时间上下文更新
   */
  private startTimeContextUpdates(): void {
    setInterval(() => {
      this.timeContext = this.updateTimeContext();
    }, 60000); // 每分钟更新
  }
  
  /**
   * 分析环境声音
   */
  analyzeAmbientSound(audioData: Float32Array): AmbientSoundState {
    // 计算 RMS
    const rms = Math.sqrt(
      audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length
    );
    
    // 简单频谱分析
    let dominantFreq = 500;
    // 实际应该使用 FFT 分析
    
    const noiseLevel = Math.min(1, rms * 10);
    
    this.ambientSound = {
      noiseLevel,
      isQuiet: noiseLevel < 0.3,
      isNoisy: noiseLevel > 0.7,
      dominantFrequency: dominantFreq,
    };
    
    return this.ambientSound;
  }
  
  /**
   * 检测用户状态
   */
  detectUserState(inputText: string): UserState {
    // 从输入文本推断用户状态
    const lowerText = inputText.toLowerCase();
    
    // 检测忙碌程度
    const busyKeywords = ['忙', '赶时间', '快点', '急', '等一下'];
    const isBusy = busyKeywords.some(kw => lowerText.includes(kw));
    
    // 检测情绪
    let mood: UserState['mood'] = 'neutral';
    if (/[!！]/.test(inputText) || /[哈哈|呵呵|嘻]/.test(inputText)) {
      mood = 'happy';
    } else if (/[...。]|唉|哎|嗯/.test(inputText)) {
      mood = 'sad';
    } else if (/[?!？!]/.test(inputText) || /[靠|擦|晕]/.test(inputText)) {
      mood = 'stressed';
    }
    
    // 检测注意力
    const attentionLevel = isBusy ? 0.5 : 0.8;
    
    this.userState = {
      isBusy,
      mood,
      attentionLevel,
      energyLevel: this.timeContext.isNight ? 0.5 : 0.7,
    };
    
    return this.userState;
  }
  
  /**
   * 记录对话内容
   */
  recordConversation(text: string, role: 'user' | 'assistant'): void {
    // 添加到话题列表
    this.conversationContext.recentTopics.push(text);
    
    // 保持最近 10 条
    if (this.conversationContext.recentTopics.length > 10) {
      this.conversationContext.recentTopics.shift();
    }
    
    // 更新交互时间
    this.conversationContext.lastInteraction = Date.now();
    this.conversationContext.interactionCount++;
  }
  
  /**
   * 记住用户偏好
   */
  rememberPreference(key: string, value: any): void {
    this.conversationContext.userPreferences[key] = value;
  }
  
  /**
   * 获取用户偏好
   */
  getPreference<T>(key: string, defaultValue: T): T {
    return this.conversationContext.userPreferences[key] ?? defaultValue;
  }
  
  /**
   * 添加任务
   */
  addTask(id: string, name: string): void {
    this.conversationContext.ongoingTasks.push({
      id,
      name,
      status: 'pending',
    });
  }
  
  /**
   * 更新任务状态
   */
  updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed'): void {
    const task = this.conversationContext.ongoingTasks.find(t => t.id === id);
    if (task) {
      task.status = status;
    }
  }
  
  /**
   * 获取自适应语音参数
   */
  getAdaptiveVoiceParams(): {
    volume: number;
    rate: number;
    responseStyle: ResponseStyle;
  } {
    const params = {
      volume: 1.0,
      rate: 1.0,
      responseStyle: 'normal' as const,
    };
    
    // 根据环境噪音调整音量
    if (this.adaptiveConfig.autoAdjustVolume) {
      if (this.ambientSound.isNoisy) {
        params.volume = 1.3;
      } else if (this.ambientSound.isQuiet || this.timeContext.isNight) {
        params.volume = 0.7;
      }
    }
    
    // 根据用户状态调整语速
    if (this.adaptiveConfig.autoAdjustRate) {
      if (this.userState.isBusy) {
        params.rate = 1.2;
      } else if (this.timeContext.isNight) {
        params.rate = 0.9;
      }
    }
    
    // 根据用户状态调整回复风格
    if (this.adaptiveConfig.autoAdjustResponseStyle) {
      if (this.userState.isBusy) {
        params.responseStyle = 'concise';
      } else if (this.userState.mood === 'happy') {
        params.responseStyle = 'detailed';
      }
    }
    
    return params;
  }
  
  /**
   * 获取合适的问候语
   */
  getGreeting(): string {
    const greeting = this.timeContext.greeting;
    
    // 添加个性化
    const userName = this.getPreference('userName', '');
    if (userName) {
      return `${greeting}，${userName}`;
    }
    
    return greeting;
  }
  
  /**
   * 检测是否在安静时间
   */
  isQuietHours(): boolean {
    const { start, end } = this.adaptiveConfig.quietHours;
    const hour = this.timeContext.hour;
    
    if (start > end) {
      // 跨天 (如 22:00 - 08:00)
      return hour >= start || hour < end;
    } else {
      return hour >= start && hour < end;
    }
  }
  
  /**
   * 获取完整上下文
   */
  getFullContext(): {
    time: TimeContext;
    user: UserState;
    ambient: AmbientSoundState;
    conversation: ConversationContext;
  } {
    return {
      time: this.timeContext,
      user: this.userState,
      ambient: this.ambientSound,
      conversation: this.conversationContext,
    };
  }
  
  /**
   * 设置自适应配置
   */
  setAdaptiveConfig(config: Partial<AdaptiveConfig>): void {
    this.adaptiveConfig = { ...this.adaptiveConfig, ...config };
  }
  
  /**
   * 重置用户状态
   */
  resetUserState(): void {
    this.userState = {
      isBusy: false,
      mood: 'neutral',
      attentionLevel: 0.8,
      energyLevel: 0.7,
    };
  }
  
  /**
   * 获取对话摘要
   */
  getConversationSummary(): string {
    const topics = this.conversationContext.recentTopics.slice(-3);
    return topics.join(' → ');
  }
}

export const contextAwareService = new ContextAwareService();
