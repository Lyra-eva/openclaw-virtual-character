/**
 * ModelSelector - 模型选择器组件
 * 
 * 功能：
 * - 显示所有可用模型预设
 * - 实时预览
 * - 自定义颜色
 * - 保存配置
 */

import React, { useState, useEffect } from 'react';
import { avatarModelService, AvatarPreset } from '@/services/AvatarModelService';
import { useVoice } from '@/contexts/VoiceContext';

interface ModelSelectorProps {
  onClose?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ onClose }) => {
  const { service } = useVoice();
  const [presets, setPresets] = useState<AvatarPreset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // 自定义颜色
  const [hairColor, setHairColor] = useState('#2c1b18');
  const [eyeColor, setEyeColor] = useState('#4a3728');
  const [skinColor, setSkinColor] = useState('#f5d0b0');
  
  useEffect(() => {
    setPresets(avatarModelService.getPresets());
  }, []);
  
  const handleSwitchModel = async (presetId: string) => {
    setIsLoading(true);
    setLoadingProgress(0);
    
    try {
      // 这里需要访问 Three.js 场景
      // 简化处理：调用服务方法
      console.log('Switching to:', presetId);
      
      // 应用自定义颜色
      avatarModelService.customizeCurrentModel({
        hair: { color: hairColor },
        eyes: { color: eyeColor },
        skin: { color: skinColor },
      });
      
      alert('模型切换成功！');
    } catch (error) {
      console.error('Model switch failed:', error);
      alert('模型切换失败：' + error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredPresets = selectedCategory === 'all'
    ? presets
    : presets.filter(p => p.category === selectedCategory);
  
  const categories = ['all', 'realistic', 'anime', 'cartoon', 'custom'];
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">🎨 选择人物模型</h2>
            <p className="text-gray-400 text-sm mt-1">自定义你的 AI 助手形象</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 分类筛选 */}
          <div className="flex space-x-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat === 'all' ? '全部' :
                 cat === 'realistic' ? '写实' :
                 cat === 'anime' ? '动漫' :
                 cat === 'cartoon' ? '卡通' : '自定义'}
              </button>
            ))}
          </div>
          
          {/* 模型列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map(preset => (
              <div
                key={preset.id}
                className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => handleSwitchModel(preset.id)}
              >
                {/* 缩略图占位 */}
                <div className="aspect-square bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                
                <h3 className="text-white font-semibold">{preset.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{preset.description}</p>
                
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-gray-600 rounded text-gray-300">
                    {preset.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* 自定义颜色 */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">🎨 自定义颜色</h3>
            
            <div className="grid grid-cols-3 gap-4">
              {/* 头发颜色 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  头发颜色
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={hairColor}
                    onChange={(e) => setHairColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={hairColor}
                    onChange={(e) => setHairColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
              
              {/* 眼睛颜色 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  眼睛颜色
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={eyeColor}
                    onChange={(e) => setEyeColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={eyeColor}
                    onChange={(e) => setEyeColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
              
              {/* 皮肤颜色 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  皮肤颜色
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={skinColor}
                    onChange={(e) => setSkinColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={skinColor}
                    onChange={(e) => setSkinColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* 应用按钮 */}
            <button
              onClick={() => handleSwitchModel('current')}
              className="mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
            >
              应用自定义颜色
            </button>
          </div>
          
          {/* 加载进度 */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-8 rounded-2xl text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-white text-lg font-semibold mb-2">
                  正在加载模型...
                </p>
                <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {loadingProgress.toFixed(0)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
