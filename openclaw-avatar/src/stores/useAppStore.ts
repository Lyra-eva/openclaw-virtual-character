import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface GameState {
  level: number;
  exp: number;
  intimacy: number;
  dailyStreak: number;
}

interface AppState {
  // 连接状态
  isConnected: boolean;
  gatewayUrl: string;
  gatewayToken: string;
  
  // 对话状态
  messages: ChatMessage[];
  isTyping: boolean;
  
  // 语音状态
  isRecording: boolean;
  isSpeaking: boolean;
  transcription: string;
  
  // 游戏状态
  game: GameState;
  
  // Actions
  setConnection: (url: string, token: string) => void;
  addMessage: (message: ChatMessage) => void;
  setTyping: (typing: boolean) => void;
  setRecording: (recording: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setTranscription: (text: string) => void;
  addExp: (amount: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  isConnected: false,
  gatewayUrl: '',
  gatewayToken: '',
  
  messages: [],
  isTyping: false,
  
  isRecording: false,
  isSpeaking: false,
  transcription: '',
  
  game: {
    level: 1,
    exp: 0,
    intimacy: 0,
    dailyStreak: 1,
  },
  
  // Actions
  setConnection: (url, token) => set({ gatewayUrl: url, gatewayToken: token, isConnected: true }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setTyping: (typing) => set({ isTyping: typing }),
  
  setRecording: (recording) => set({ isRecording: recording }),
  
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  
  setTranscription: (text) => set({ transcription: text }),
  
  addExp: (amount) => set((state) => {
    const newExp = state.game.exp + amount;
    const newLevel = Math.floor(newExp / 1000) + 1;
    return {
      game: {
        ...state.game,
        exp: newExp,
        level: newLevel,
      }
    };
  }),
}));
