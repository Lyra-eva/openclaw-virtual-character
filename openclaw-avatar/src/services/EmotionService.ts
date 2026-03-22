/**
 * 情绪检测服务
 * 根据文本内容自动检测情绪
 */

import { EmotionType, EMOTION_KEYWORDS } from '@/types/emotions';

export class EmotionService {
  private emotionHistory: EmotionType[] = [];
  private maxHistory = 5;
  
  /**
   * 从文本检测情绪
   */
  detectEmotion(text: string): EmotionType {
    if (!text || text.trim().length === 0) {
      return 'neutral';
    }
    
    const scores: Record<EmotionType, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      surprised: 0,
      angry: 0,
      thinking: 0,
      listening: 0,
      excited: 0,
    };
    
    // 关键词匹配
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          scores[emotion as EmotionType] += keyword.length;
        }
      }
    }
    
    // 标点符号分析
    const exclamationCount = (text.match(/！/g) || []).length;
    const questionCount = (text.match(/？/g) || []).length;
    const ellipsisCount = (text.match(/\.\.\.|…/g) || []).length;
    
    scores.happy += exclamationCount * 0.5;
    scores.surprised += exclamationCount * 0.3;
    scores.thinking += ellipsisCount * 0.8;
    scores.surprised += questionCount * 0.5;
    
    // 语气词分析
    const toneWords = {
      '啊': 'happy',
      '呀': 'happy',
      '哦': 'neutral',
      '呢': 'thinking',
      '吧': 'neutral',
      '嘛': 'happy',
      '啦': 'happy',
    };
    
    for (const [word, emotion] of Object.entries(toneWords)) {
      if (text.endsWith(word)) {
        scores[emotion as EmotionType] += 0.5;
      }
    }
    
    // 表情符号分析
    const emojiMap: Record<string, EmotionType> = {
      '😊': 'happy',
      '😄': 'happy',
      '😂': 'happy',
      '😢': 'sad',
      '😭': 'sad',
      '😮': 'surprised',
      '😲': 'surprised',
      '😠': 'angry',
      '😤': 'angry',
      '🤔': 'thinking',
      '😆': 'excited',
      '🎉': 'excited',
      '✨': 'excited',
    };
    
    for (const [emoji, emotion] of Object.entries(emojiMap)) {
      if (text.includes(emoji)) {
        scores[emotion] += 1.5;
      }
    }
    
    // 找到最高分的情绪
    let maxScore = 0;
    let detectedEmotion: EmotionType = 'neutral';
    
    for (const [emotion, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion as EmotionType;
      }
    }
    
    // 如果分数太低，返回中性
    if (maxScore < 0.5) {
      detectedEmotion = 'neutral';
    }
    
    // 记录历史
    this.emotionHistory.push(detectedEmotion);
    if (this.emotionHistory.length > this.maxHistory) {
      this.emotionHistory.shift();
    }
    
    return detectedEmotion;
  }
  
  /**
   * 获取平均情绪 (基于历史)
   */
  getAverageEmotion(): EmotionType {
    if (this.emotionHistory.length === 0) {
      return 'neutral';
    }
    
    const counts: Record<EmotionType, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      surprised: 0,
      angry: 0,
      thinking: 0,
      listening: 0,
      excited: 0,
    };
    
    for (const emotion of this.emotionHistory) {
      counts[emotion]++;
    }
    
    let maxCount = 0;
    let avgEmotion: EmotionType = 'neutral';
    
    for (const [emotion, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        avgEmotion = emotion as EmotionType;
      }
    }
    
    return avgEmotion;
  }
  
  /**
   * 清空历史
   */
  clearHistory() {
    this.emotionHistory = [];
  }
}

export const emotionService = new EmotionService();
