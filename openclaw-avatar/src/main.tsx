import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { VoiceProvider } from './contexts/VoiceContext';
import './index.css';

/**
 * 应用入口
 * 
 * VoiceProvider 会自动初始化语音服务
 * 无需在组件中手动初始化
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <VoiceProvider 
      config={{
        enableMicroExpressions: true,
        enableEmotionalTTS: true,
        enablePredictiveLipSync: true,
        enableBodyLanguage: true,
        enableContextAware: true,
        expressionQuality: 'high',
        lipSyncAccuracy: 'balanced',
      }}
      autoInitialize={true}
    >
      <App />
    </VoiceProvider>
  </React.StrictMode>
);
