import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { voiceService } from '@/services/VoiceService';
import { ttsService } from '@/services/TTSService';

const HUD: React.FC = () => {
  const { game, isConnected, isRecording, isSpeaking } = useAppStore();
  const voiceEngine = voiceService.getEngine();
  const ttsEngine = ttsService.getEngine();
  
  return (
    <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none">
      <div className="max-w-2xl mx-auto flex justify-between items-start">
        {/* 左侧：游戏状态 */}
        <div className="space-y-3 pointer-events-auto">
          {/* 等级 */}
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-xs text-gray-400">等级</p>
                <p className="text-lg font-bold">{game.level}</p>
              </div>
            </div>
          </div>
          
          {/* 经验条 */}
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl w-40">
            <p className="text-xs text-gray-400 mb-1">经验</p>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                style={{ width: `${(game.exp % 1000) / 10}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{game.exp % 1000} / 1000</p>
          </div>
          
          {/* 亲密度 */}
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💕</span>
              <div>
                <p className="text-xs text-gray-400">亲密度</p>
                <p className="text-sm font-semibold">{game.intimacy}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧：状态指示器 */}
        <div className="space-y-2 pointer-events-auto">
          {/* 连接状态 */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
            isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs">
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
          
          {/* 语音引擎 */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-500/20">
            <span className="text-xs">
              🎤 {voiceEngine === 'whisper' ? 'Whisper' : 'Web Speech'}
            </span>
          </div>
          
          {/* TTS 引擎 */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-pink-500/20">
            <span className="text-xs">
              🔊 {ttsEngine === 'elevenlabs' ? 'ElevenLabs' : 'Web Speech'}
            </span>
          </div>
          
          {/* 录音状态 */}
          {isRecording && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs">正在录音...</span>
            </div>
          )}
          
          {/* 说话状态 */}
          {isSpeaking && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/20">
              <span className="text-xl">🔊</span>
              <span className="text-xs">AI 说话中</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HUD;
