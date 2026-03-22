import React, { useEffect, useState } from 'react';
import AvatarView from './components/AvatarView';
import ChatPanel from './components/ChatPanel';
import HUD from './components/HUD';
import ModelSelector from './components/ModelSelector';
import { gatewayService } from './services/GatewayService';
import { voiceService, VoiceEngine } from './services/VoiceService';
import { ttsService, TTSEngine } from './services/TTSService';
import { elevenLabsService } from './services/ElevenLabsService';
import { voiceWakeUpService } from './services/VoiceWakeUpService';
import { fullDuplexService } from './services/FullDuplexService';
import { localVoiceService } from './services/LocalVoiceService';
import { useAppStore } from './stores/useAppStore';

const App: React.FC = () => {
  const { isConnected } = useAppStore();
  const [showConfig, setShowConfig] = useState(!isConnected);
  const [gatewayUrl, setGatewayUrl] = useState('ws://localhost:18789');
  const [gatewayToken, setGatewayToken] = useState('');
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>('web-speech');
  const [ttsEngine, setTtsEngine] = useState<TTSEngine>('web-speech');
  const [isDownloadingModel, setIsDownloadingModel] = useState(false);
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('EXAVITQu4vr4xnSDxMaL');
  
  // 高级设置
  const [enableWakeWord, setEnableWakeWord] = useState(true);
  const [wakeWords, setWakeWords] = useState('Bella，你好，在吗');
  const [enableFullDuplex, setEnableFullDuplex] = useState(true);
  const [vadThreshold, setVadThreshold] = useState(30);
  
  // 本地语音模块设置
  const [useLocalVoice, setUseLocalVoice] = useState(false);
  const [localVoiceInitialized, setLocalVoiceInitialized] = useState(false);
  const [localSTTModel, setLocalSTTModel] = useState<'tiny' | 'base' | 'small'>('base');
  const [localTTSRate, setLocalTTSRate] = useState(1.0);
  const [localVADThreshold, setLocalVADThreshold] = useState(0.5);
  
  // 模型选择器
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  // 初始化服务
  useEffect(() => {
    voiceService.initialize();
    ttsService.initialize();
    
    // 配置语音唤醒
    voiceWakeUpService.setWakeWords(['bella', '你好', '在吗', '嗨']);
    voiceWakeUpService.onWakeUp(() => {
      console.log('[App] Wake word detected!');
      // 可以在这里添加视觉反馈
    });
    
    return () => {
      voiceWakeUpService.setEnabled(false);
      fullDuplexService.dispose();
      localVoiceService.dispose();
    };
  }, []);
  
  // 切换语音识别引擎
  const handleSwitchVoiceEngine = async (engine: VoiceEngine) => {
    setVoiceEngine(engine);
    voiceService.setEngine(engine);
    if (engine === 'whisper') {
      await voiceService.initialize();
    }
  };
  
  // 切换 TTS 引擎
  const handleSwitchTtsEngine = (engine: TTSEngine) => {
    setTtsEngine(engine);
    ttsService.setEngine(engine);
    if (engine === 'elevenlabs' && elevenLabsKey) {
      ttsService.setElevenLabsKey(elevenLabsKey);
    }
  };
  
  // 设置 ElevenLabs API Key
  const handleSetElevenLabsKey = () => {
    if (elevenLabsKey.trim()) {
      ttsService.setElevenLabsKey(elevenLabsKey);
      ttsService.setVoice(selectedVoice);
      alert('ElevenLabs 已配置！');
    }
  };
  
  // 测试 TTS
  const handleTestTTS = async () => {
    try {
      await ttsService.test();
      alert('TTS 测试成功！');
    } catch (error) {
      alert('TTS 测试失败：' + error);
    }
  };
  
  // 下载 Whisper 模型
  const handleDownloadModel = async () => {
    setIsDownloadingModel(true);
    try {
      await voiceService.downloadWhisperModel('base');
      alert('Whisper 模型下载完成！');
    } catch (error) {
      alert('模型下载失败：' + error);
    } finally {
      setIsDownloadingModel(false);
    }
  };
  
  // 保存高级设置
  const handleSaveAdvancedSettings = () => {
    // 更新唤醒词
    const words = wakeWords.split(/[,,]/).map(w => w.trim().toLowerCase()).filter(w => w);
    voiceWakeUpService.setWakeWords(words);
    
    // 更新 VAD 阈值
    fullDuplexService.setVADThreshold(vadThreshold);
    
    // 启用/禁用功能
    voiceWakeUpService.setEnabled(enableWakeWord);
    
    if (enableFullDuplex) {
      fullDuplexService.initialize();
      fullDuplexService.startMonitoring();
    } else {
      fullDuplexService.stopMonitoring();
    }
    
    alert('高级设置已保存！');
  };
  
  // ========== 本地语音模块处理方法 ==========
  
  // 初始化本地语音模块
  const handleInitializeLocalVoice = async () => {
    setIsDownloadingModel(true);
    try {
      await localVoiceService.initialize({
        sttEnabled: true,
        sttModel: localSTTModel,
        ttsEnabled: true,
        vadEnabled: true,
        noiseReductionEnabled: true,
        lipSyncEnabled: true,
        spatialAudioEnabled: true,
      });
      setLocalVoiceInitialized(true);
      alert('✅ 本地语音模块初始化成功！');
    } catch (error) {
      console.error('本地语音模块初始化失败:', error);
      alert('❌ 初始化失败：' + error);
    } finally {
      setIsDownloadingModel(false);
    }
  };
  
  // 开始/停止本地语音监听
  const handleToggleLocalListening = async () => {
    const status = localVoiceService.getStatus();
    if (status.isRecording) {
      localVoiceService.stopListening();
    } else {
      await localVoiceService.startListening((text, isFinal) => {
        console.log('[LocalVoice] 识别结果:', text, isFinal);
        if (isFinal && text.trim()) {
          gatewayService.sendMessage(text);
          useAppStore.getState().addExp(5);
        }
      });
    }
  };
  
  // 测试本地 TTS
  const handleTestLocalTTS = async () => {
    try {
      await localVoiceService.speak('你好，这是本地语音合成测试');
      alert('✅ TTS 测试成功！');
    } catch (error) {
      alert('❌ TTS 测试失败：' + error);
    }
  };
  
  // 下载本地模型
  const handleDownloadLocalModels = async () => {
    setIsDownloadingModel(true);
    try {
      await localVoiceService.downloadModels(localSTTModel);
      alert('✅ 模型下载完成！请刷新页面后初始化。');
    } catch (error) {
      alert('❌ 下载失败：' + error);
    } finally {
      setIsDownloadingModel(false);
    }
  };
  
  // 更新本地 VAD 阈值
  const handleUpdateLocalVAD = (value: number) => {
    setLocalVADThreshold(value);
    localVoiceService.setVADThreshold(value);
  };
  
  // 更新本地 TTS 语速
  const handleUpdateLocalTTSRate = (value: number) => {
    setLocalTTSRate(value);
    localVoiceService.setTTSRate(value);
  };
  
  // 连接 Gateway
  const handleConnect = async () => {
    try {
      await gatewayService.connect(gatewayUrl, gatewayToken);
      setShowConfig(false);
    } catch (error) {
      console.error('连接失败:', error);
      alert('连接失败，请检查 Gateway 地址和 Token');
    }
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D 人物视图 */}
      <AvatarView />
      
      {/* HUD 状态显示 */}
      <HUD />
      
      {/* 对话面板 */}
      <ChatPanel />
      
      {/* 底部控制栏 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4">
        {/* 语音按钮 - 根据模式切换 */}
        <button
          onClick={() => {
            if (useLocalVoice && localVoiceInitialized) {
              handleToggleLocalListening();
            } else {
              if (useAppStore.getState().isRecording) {
                voiceService.stopListening();
              } else {
                voiceService.startListening();
              }
            }
          }}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            (useLocalVoice && localVoiceInitialized ? localVoiceService.getStatus().isRecording : useAppStore.getState().isRecording)
              ? 'bg-red-500 scale-110 animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          <span className="text-3xl">
            {(useLocalVoice && localVoiceInitialized ? localVoiceService.getStatus().isRecording : useAppStore.getState().isRecording) ? '🎤' : '🎙️'}
          </span>
        </button>
        
        {/* 配置按钮 */}
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
        >
          <span className="text-xl">⚙️</span>
        </button>
        
        {/* 模型选择按钮 */}
        <button
          onClick={() => setShowModelSelector(true)}
          className="w-12 h-12 rounded-full bg-purple-700 hover:bg-purple-600 flex items-center justify-center"
        >
          <span className="text-xl">🎨</span>
        </button>
      </div>
      
      {/* 配置面板 */}
      {showConfig && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-3xl space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-center mb-6">🔧 连接设置</h2>
            
            {/* Gateway 配置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-300">📡 OpenClaw Gateway</h3>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Gateway WebSocket 地址
                </label>
                <input
                  type="text"
                  value={gatewayUrl}
                  onChange={(e) => setGatewayUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ws://localhost:18789"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Gateway Token
                </label>
                <input
                  type="password"
                  value={gatewayToken}
                  onChange={(e) => setGatewayToken(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入 Token"
                />
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-3 text-purple-300">🎤 语音识别 (STT)</h3>
              
              {/* 引擎选择 */}
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={() => handleSwitchVoiceEngine('web-speech')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    voiceEngine === 'web-speech'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ☁️ Web Speech
                </button>
                <button
                  onClick={() => handleSwitchVoiceEngine('whisper')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    voiceEngine === 'whisper'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🧠 Whisper 离线
                </button>
              </div>
              
              {/* Whisper 模型下载 */}
              {voiceEngine === 'whisper' && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 space-y-2">
                  <button
                    onClick={handleDownloadModel}
                    disabled={isDownloadingModel}
                    className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                  >
                    {isDownloadingModel ? '下载中...' : '下载 Base 模型 (142MB)'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-3 text-pink-300">🔊 语音合成 (TTS)</h3>
              
              {/* TTS 引擎选择 */}
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={() => handleSwitchTtsEngine('web-speech')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ttsEngine === 'web-speech'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ☁️ Web Speech
                </button>
                <button
                  onClick={() => handleSwitchTtsEngine('elevenlabs')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ttsEngine === 'elevenlabs'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🎭 ElevenLabs
                </button>
              </div>
              
              {/* ElevenLabs 配置 */}
              {ttsEngine === 'elevenlabs' && (
                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 space-y-3">
                  <div>
                    <label className="block text-xs text-pink-300 mb-1">
                      ElevenLabs API Key
                    </label>
                    <input
                      type="password"
                      value={elevenLabsKey}
                      onChange={(e) => setElevenLabsKey(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="sk_..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-pink-300 mb-1">
                      选择声音
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {elevenLabsService.getVoices().map((voice) => (
                        <option key={voice.voice_id} value={voice.voice_id}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSetElevenLabsKey}
                      className="flex-1 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      保存配置
                    </button>
                    <button
                      onClick={handleTestTTS}
                      className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      测试
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-3 text-green-300">⚡ 高级交互设置</h3>
              
              <div className="space-y-4">
                {/* 语音唤醒 */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-green-300">
                      🎯 语音唤醒 (无需点击)
                    </label>
                    <input
                      type="checkbox"
                      checked={enableWakeWord}
                      onChange={(e) => setEnableWakeWord(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                  </div>
                  <input
                    type="text"
                    value={wakeWords}
                    onChange={(e) => setWakeWords(e.target.value)}
                    disabled={!enableWakeWord}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    placeholder="唤醒词，用逗号分隔"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    说出这些词即可唤醒 AI，无需点击按钮
                  </p>
                </div>
                
                {/* 全双工对话 */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-green-300">
                      💬 全双工对话 (可打断 AI)
                    </label>
                    <input
                      type="checkbox"
                      checked={enableFullDuplex}
                      onChange={(e) => setEnableFullDuplex(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">灵敏度:</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={vadThreshold}
                      onChange={(e) => setVadThreshold(Number(e.target.value))}
                      disabled={!enableFullDuplex}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400 w-8">{vadThreshold}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    AI 说话时可以直接打断，值越低越灵敏
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSaveAdvancedSettings}
                className="w-full mt-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
              >
                保存高级设置
              </button>
            </div>
            
            {/* 本地语音模块配置 */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-3 text-cyan-300">🎤 纯本地语音模块 (新)</h3>
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-cyan-300">
                      启用本地语音模块
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      100% 离线运行，无第三方 API 依赖
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useLocalVoice}
                    onChange={(e) => setUseLocalVoice(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </div>
                
                {useLocalVoice && (
                  <>
                    {/* 初始化状态 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">状态:</span>
                      <span className={`text-xs font-medium ${
                        localVoiceInitialized ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {localVoiceInitialized ? '✅ 已初始化' : '⏳ 未初始化'}
                      </span>
                    </div>
                    
                    {/* 模型选择 */}
                    <div>
                      <label className="block text-xs text-cyan-300 mb-1">
                        Whisper 模型大小
                      </label>
                      <select
                        value={localSTTModel}
                        onChange={(e) => setLocalSTTModel(e.target.value as 'tiny' | 'base' | 'small')}
                        className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="tiny">Tiny (39MB, 快速)</option>
                        <option value="base">Base (74MB, 平衡) ⭐</option>
                        <option value="small">Small (244MB, 高精度)</option>
                      </select>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDownloadLocalModels}
                        disabled={isDownloadingModel}
                        className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                      >
                        📥 下载模型
                      </button>
                      <button
                        onClick={handleInitializeLocalVoice}
                        disabled={isDownloadingModel || !localSTTModel}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                      >
                        ⚡ 初始化
                      </button>
                    </div>
                    
                    {/* TTS 语速 */}
                    <div>
                      <label className="block text-xs text-cyan-300 mb-1">
                        TTS 语速：{localTTSRate.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={localTTSRate}
                        onChange={(e) => handleUpdateLocalTTSRate(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    {/* VAD 阈值 */}
                    <div>
                      <label className="block text-xs text-cyan-300 mb-1">
                        VAD 灵敏度：{Math.round(localVADThreshold * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.1"
                        value={localVADThreshold}
                        onChange={(e) => handleUpdateLocalVAD(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        值越低越灵敏，嘈杂环境建议调高
                      </p>
                    </div>
                    
                    {/* 测试按钮 */}
                    <button
                      onClick={handleTestLocalTTS}
                      disabled={!localVoiceInitialized}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                    >
                      🔊 测试 TTS
                    </button>
                    
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-300">
                        ✅ 包含功能:
                      </p>
                      <ul className="text-xs text-gray-400 mt-1 space-y-1">
                        <li>• Whisper 离线语音识别</li>
                        <li>• Piper TTS 语音合成</li>
                        <li>• Silero VAD 语音检测</li>
                        <li>• RNNoise 降噪</li>
                        <li>• 唇形同步</li>
                        <li>• 3D 空间音频</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <button
              onClick={handleConnect}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
            >
              连接
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              💡 提示：在 OpenClaw 配置中启用 Gateway 并获取 Token
            </p>
          </div>
        </div>
      )}
      
      {/* 模型选择器 */}
      {showModelSelector && (
        <ModelSelector onClose={() => setShowModelSelector(false)} />
      )}
    </div>
  );
};

export default App;
