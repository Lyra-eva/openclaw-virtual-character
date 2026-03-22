/**
 * 轻量级文本情绪检测服务
 * 基于规则 + 词典，零依赖，快速准确
 */

export interface EmotionScores {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  thinking: number;
  excited: number;
  neutral: number;
}

export interface EmotionResult {
  emotion: string;
  confidence: number;
  scores: EmotionScores;
}

export class TextEmotionDetector {
  // 情绪词典
  private emotionLexicon: Record<string, string[]> = {
    happy: [
      '开心', '快乐', '高兴', '太好了', '棒', '哈哈', '嘻嘻', '嘿嘿',
      '好耶', '爽', '赞', '不错', '喜欢', '爱', '美好', '愉快',
      '😊', '😄', '😁', '😆', '😂', '🎉', '✨', '👍',
    ],
    sad: [
      '难过', '伤心', '遗憾', '抱歉', '唉', '悲伤', '痛苦', '失落',
      '失望', '委屈', '心疼', '可怜', '郁闷', '烦', '累',
      '😢', '😭', '😞', '😔', '😟', '💔',
    ],
    angry: [
      '生气', '讨厌', '烦', '可恶', '混蛋', '愤怒', '恼火', '不爽',
      '气死', '无语', '有病', '滚', '闭嘴', '烦人',
      '😠', '😤', '👎', '💢',
    ],
    surprised: [
      '哇', '天啊', '真的吗', '没想到', '居然', '竟然', '惊讶',
      '不可思议', '哇塞', '我的天', '什么', '怎么会',
      '😮', '😲', '😯', '😱', '❓', '❗',
    ],
    thinking: [
      '嗯...', '想想', '可能', '也许', '大概', '我觉得', '认为',
      '思考', '考虑', '不知道', '不确定', '或许', '应该',
      '🤔', '...', '。。.', '嗯嗯',
    ],
    excited: [
      '太棒了', '超级', '非常', '极其', '特别', '激动', '兴奋',
      '期待', '迫不及待', '哇塞', '牛逼', '厉害', '强',
      '🔥', '💪', '🚀', '⭐', '！！！', '！！',
    ],
  };

  // 强度词
  private intensifiers: string[] = [
    '很', '非常', '特别', '极其', '太', '超级', '无比',
    '十分', '格外', '分外', '更加', '越', '越来',
  ];

  // 否定词
  private negators: string[] = [
    '不', '没', '别', '莫', '勿', '无', '非',
  ];

  /**
   * 检测文本情绪
   */
  detect(text: string): EmotionResult {
    const scores: EmotionScores = {
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      thinking: 0,
      excited: 0,
      neutral: 0.3, // 基础分
    };

    const lowerText = text.toLowerCase();

    // 1. 关键词匹配
    for (const [emotion, keywords] of Object.entries(this.emotionLexicon)) {
      for (const keyword of keywords) {
        const index = lowerText.indexOf(keyword.toLowerCase());
        if (index !== -1) {
          let score = 1.0;

          // 2. 检查前面是否有强度词
          const beforeText = lowerText.substring(Math.max(0, index - 3), index);
          for (const intensifier of this.intensifiers) {
            if (beforeText.includes(intensifier)) {
              score *= 1.5;
            }
          }

          // 3. 检查前面是否有否定词
          for (const negator of this.negators) {
            if (beforeText.includes(negator)) {
              score *= -0.5; // 否定反转
            }
          }

          // 4. 表情符号权重更高
          if (this.isEmoji(keyword)) {
            score *= 1.3;
          }

          scores[emotion as keyof EmotionScores] += score;
        }
      }
    }

    // 5. 标点符号分析
    const exclamations = (text.match(/！/g) || []).length;
    const questions = (text.match(/？/g) || []).length;
    const ellipsis = (text.match(/\.\.\.|…/g) || []).length;

    scores.surprised += exclamations * 0.2;
    scores.thinking += ellipsis * 0.4;
    scores.surprised += questions * 0.15;

    // 6. 句子长度 (短句更情绪化)
    if (text.length < 8 && exclamations > 0) {
      scores.excited *= 1.3;
      scores.happy *= 1.2;
    }

    // 7. 重复字符 (如"太好了！！！")
    const repeatedPunctuation = text.match(/([！？])\1{2,}/);
    if (repeatedPunctuation) {
      scores.excited *= 1.5;
      scores.surprised *= 1.3;
    }

    // 8. 归一化
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total > 0) {
      (Object.keys(scores) as Array<keyof EmotionScores>).forEach((key) => {
        scores[key] = scores[key] / total;
      });
    }

    // 9. 获取主导情绪
    const emotion = this.getDominantEmotion(scores);
    const confidence = scores[emotion as keyof EmotionScores];

    return {
      emotion,
      confidence,
      scores,
    };
  }

  /**
   * 获取主导情绪
   */
  getDominantEmotion(scores: EmotionScores): string {
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * 判断是否为表情符号
   */
  private isEmoji(char: string): boolean {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
    return emojiRegex.test(char);
  }

  /**
   * 批量检测 (用于历史消息分析)
   */
  detectBatch(texts: string[]): EmotionResult[] {
    return texts.map(text => this.detect(text));
  }

  /**
   * 获取情绪统计
   */
  getEmotionStats(texts: string[]): Record<string, number> {
    const stats: Record<string, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      thinking: 0,
      excited: 0,
      neutral: 0,
    };

    for (const text of texts) {
      const result = this.detect(text);
      stats[result.emotion]++;
    }

    return stats;
  }
}

export const textEmotionDetector = new TextEmotionDetector();
