/**
 * PredictiveLipSyncService - 预测式唇形同步服务
 * 提前 100ms 预测嘴型，实现零延迟同步
 * 
 * 功能：
 * - 文本转音素
 * - 音素持续时间预测
 * - 整句嘴型预计算
 * - 平滑过渡处理
 * - 实时校正
 */

import { Viseme } from './LipSyncService';

/**
 * 音素定义
 */
export interface Phoneme {
  symbol: string;        // 音素符号
  duration: number;      // 持续时间 (秒)
  visemeId: number;      // 对应的嘴型 ID
  intensity: number;     // 强度 (0-1)
}

/**
 * 预测的嘴型序列
 */
export interface PredictedVisemeSequence {
  visemes: Viseme[];
  totalTime: number;
  text: string;
}

/**
 * 中文音素到嘴型映射
 */
const PHONEME_TO_VISEME: Record<string, number> = {
  // 闭口音
  'm': 1, 'n': 1, 'ng': 1, 'b': 1, 'p': 1,
  // 唇齿音
  'f': 2, 'v': 2,
  // 舌尖音
  'th': 3, 'dh': 3,
  't': 4, 'd': 4, 'n': 4, 'l': 4,
  // 卷舌音
  'r': 5, 'zh': 5, 'ch': 5, 'sh': 5, 'z': 5,
  // 齿龈音
  's': 6, 'z': 6,
  // 中性音
  'schwa': 7, 'ə': 7, '': 7,
  // 扁嘴音
  'ee': 8, 'i': 8, 'ih': 8,
  // 咧嘴音
  'ei': 9, 'ai': 9,
  // 圆嘴音
  'o': 10, 'ou': 10, 'au': 10,
  'u': 11, 'oo': 11, 'wu': 11,
  // 大嘴音
  'ae': 12, 'a': 12, 'eh': 12,
  'ah': 13, 'aa': 13,
  // 宽嘴音
  'wide': 14,
};

/**
 * 中文拼音到音素映射
 */
const PINYIN_TO_PHONEME: Record<string, string[]> = {
  'a': ['aa'],
  'o': ['o'],
  'e': ['eh'],
  'i': ['i'],
  'u': ['u'],
  'v': ['u'],
  'ai': ['ai'],
  'ei': ['ei'],
  'ui': ['ui'],
  'ao': ['au'],
  'ou': ['ou'],
  'iu': ['iu'],
  'ie': ['ie'],
  'ue': ['ue'],
  'er': ['er'],
  'an': ['aa', 'n'],
  'en': ['eh', 'n'],
  'in': ['i', 'n'],
  'un': ['u', 'n'],
  'vn': ['u', 'n'],
  'ang': ['aa', 'ng'],
  'eng': ['eh', 'ng'],
  'ing': ['i', 'ng'],
  'ong': ['o', 'ng'],
  'b': ['b'],
  'p': ['p'],
  'm': ['m'],
  'f': ['f'],
  'd': ['d'],
  't': ['t'],
  'n': ['n'],
  'l': ['l'],
  'g': ['g'],
  'k': ['k'],
  'h': ['h'],
  'j': ['j'],
  'q': ['q'],
  'x': ['x'],
  'zh': ['zh'],
  'ch': ['ch'],
  'sh': ['sh'],
  'r': ['r'],
  'z': ['z'],
  'c': ['c'],
  's': ['s'],
  'y': ['y'],
  'w': ['w'],
};

export class PredictiveLipSyncService {
  private phonemeDurations: Record<string, number> = {
    // 元音持续时间较长
    'aa': 0.15, 'ae': 0.12, 'eh': 0.1, 'i': 0.1,
    'u': 0.12, 'o': 0.12, 'er': 0.15,
    // 辅音持续时间较短
    'b': 0.05, 'p': 0.05, 'm': 0.08, 'f': 0.06,
    'd': 0.05, 't': 0.05, 'n': 0.08, 'l': 0.08,
    'g': 0.05, 'k': 0.05, 'h': 0.06,
    'j': 0.06, 'q': 0.06, 'x': 0.06,
    'zh': 0.08, 'ch': 0.08, 'sh': 0.08, 'r': 0.08,
    'z': 0.06, 'c': 0.06, 's': 0.06,
    'ng': 0.1, 'y': 0.05, 'w': 0.05,
  };
  
  private visemeTransitionSpeed = 0.1; // 嘴型切换速度
  private lookaheadTime = 0.1; // 提前 100ms 预测
  
  /**
   * 将文本转换为音素序列
   */
  textToPhonemes(text: string): string[] {
    const phonemes: string[] = [];
    
    // 简化实现：按字符处理
    // 实际应该使用专业的 g2p 库
    for (const char of text) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 中文字符 - 这里需要拼音转换
        // 简化处理：使用中性音
        phonemes.push('schwa');
      } else if (/[a-zA-Z]/.test(char)) {
        // 英文字符
        const lower = char.toLowerCase();
        if (this.phonemeDurations[lower]) {
          phonemes.push(lower);
        }
      } else if (/[,.!?。！？]/.test(char)) {
        // 标点符号 - 添加停顿
        phonemes.push('pause');
      }
    }
    
    return phonemes;
  }
  
  /**
   * 预测音素持续时间
   */
  predictPhonemeDurations(phonemes: string[], speechRate: number = 1.0): Phoneme[] {
    return phonemes.map(symbol => {
      const baseDuration = this.phonemeDurations[symbol] || 0.1;
      const duration = baseDuration / speechRate;
      
      return {
        symbol,
        duration,
        visemeId: PHONEME_TO_VISEME[symbol] ?? 7, // 默认为中性嘴型
        intensity: 1.0,
      };
    });
  }
  
  /**
   * 从音素生成嘴型序列
   */
  phonemesToVisemes(phonemes: Phoneme[]): Viseme[] {
    const visemes: Viseme[] = [];
    let currentTime = 0;
    
    for (const phoneme of phonemes) {
      if (phoneme.symbol === 'pause') {
        // 停顿 - 保持当前嘴型
        currentTime += phoneme.duration;
        continue;
      }
      
      visemes.push({
        id: phoneme.visemeId,
        weight: phoneme.intensity,
        time: currentTime,
        mouthOpen: this.visemeToMouthOpen(phoneme.visemeId),
      });
      
      currentTime += phoneme.duration;
    }
    
    return visemes;
  }
  
  /**
   * 嘴型 ID 转开合度
   */
  private visemeToMouthOpen(visemeId: number): number {
    const mouthOpenMap: Record<number, number> = {
      0: 0,    // sil - 闭嘴
      1: 0.1,  // pp - 微闭
      2: 0.2,  // ff
      3: 0.3,  // th
      4: 0.2,  // dd
      5: 0.3,  // rr
      6: 0.2,  // ss
      7: 0.2,  // aa - 中性
      8: 0.3,  // e
      9: 0.4,  // i
      10: 0.5, // o
      11: 0.4, // u
      12: 0.7, // ae
      13: 0.9, // a - 最大
      14: 0.6, // wide
    };
    return mouthOpenMap[visemeId] ?? 0.2;
  }
  
  /**
   * 平滑嘴型序列
   */
  smoothVisemes(visemes: Viseme[], windowSize: number = 3): Viseme[] {
    if (visemes.length <= windowSize) {
      return visemes;
    }
    
    const smoothed: Viseme[] = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < visemes.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(visemes.length, i + halfWindow + 1);
      
      // 加权平均
      let sumMouthOpen = 0;
      let sumWeight = 0;
      
      for (let j = start; j < end; j++) {
        const weight = 1 - Math.abs(j - i) / halfWindow;
        sumMouthOpen += visemes[j].mouthOpen * weight;
        sumWeight += weight;
      }
      
      smoothed.push({
        ...visemes[i],
        mouthOpen: sumWeight > 0 ? sumMouthOpen / sumWeight : visemes[i].mouthOpen,
      });
    }
    
    return smoothed;
  }
  
  /**
   * 预计算整句嘴型
   */
  async precomputeVisemes(text: string, speechRate: number = 1.0): Promise<PredictedVisemeSequence> {
    // 1. 文本转音素
    const phonemes = this.textToPhonemes(text);
    
    // 2. 预测持续时间
    const timedPhonemes = this.predictPhonemeDurations(phonemes, speechRate);
    
    // 3. 生成嘴型序列
    const visemes = this.phonemesToVisemes(timedPhonemes);
    
    // 4. 平滑处理
    const smoothedVisemes = this.smoothVisemes(visemes);
    
    // 5. 计算总时间
    const totalTime = timedPhonemes.reduce((sum, p) => sum + p.duration, 0);
    
    return {
      visemes: smoothedVisemes,
      totalTime,
      text,
    };
  }
  
  /**
   * 获取指定时间的嘴型 (带预测)
   */
  getVisemeAtTime(visemeSequence: PredictedVisemeSequence, time: number): Viseme {
    const visemes = visemeSequence.visemes;
    
    // 找到当前时间对应的嘴型
    for (let i = visemes.length - 1; i >= 0; i--) {
      if (visemes[i].time <= time) {
        return visemes[i];
      }
    }
    
    // 如果还没开始，返回第一个
    if (visemes.length > 0) {
      return visemes[0];
    }
    
    // 默认闭嘴
    return { id: 0, weight: 1, time: 0, mouthOpen: 0 };
  }
  
  /**
   * 获取预测嘴型 (提前 lookaheadTime)
   */
  getPredictedViseme(visemeSequence: PredictedVisemeSequence, currentTime: number): Viseme {
    const predictedTime = currentTime + this.lookaheadTime;
    return this.getVisemeAtTime(visemeSequence, predictedTime);
  }
  
  /**
   * 实时校正嘴型
   */
  correctViseme(predicted: Viseme, actual: Viseme, correctionFactor: number = 0.3): Viseme {
    return {
      ...predicted,
      mouthOpen: predicted.mouthOpen + (actual.mouthOpen - predicted.mouthOpen) * correctionFactor,
    };
  }
  
  /**
   * 设置预测时间
   */
  setLookaheadTime(ms: number): void {
    this.lookaheadTime = ms / 1000;
  }
  
  /**
   * 设置嘴型切换速度
   */
  setTransitionSpeed(speed: number): void {
    this.visemeTransitionSpeed = Math.max(0.05, Math.min(0.3, speed));
  }
  
  /**
   * 获取配置
   */
  getConfig(): {
    lookaheadTime: number;
    transitionSpeed: number;
  } {
    return {
      lookaheadTime: this.lookaheadTime * 1000,
      transitionSpeed: this.visemeTransitionSpeed,
    };
  }
}

export const predictiveLipSyncService = new PredictiveLipSyncService();
