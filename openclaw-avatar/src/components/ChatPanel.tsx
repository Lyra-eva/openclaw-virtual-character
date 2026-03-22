import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import ChatBubble from './ChatBubble';

const ChatPanel: React.FC = () => {
  const { messages, isTyping, transcription, isRecording } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, transcription]);
  
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent p-6">
      <div className="max-w-2xl mx-auto">
        {/* 对话历史 */}
        <div className="h-48 overflow-y-auto mb-4 space-y-2">
          <AnimatePresence>
            {messages.slice(-5).map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
          
          {/* 正在输入 */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* 实时语音转录 */}
        <AnimatePresence>
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-500/80 text-white px-4 py-2 rounded-xl mb-4"
            >
              <span className="text-sm">{transcription}</span>
              {isRecording && (
                <span className="ml-2 inline-block w-2 h-4 bg-white animate-pulse" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatPanel;
