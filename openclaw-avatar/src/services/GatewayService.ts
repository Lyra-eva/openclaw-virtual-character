import { useAppStore } from '@/stores/useAppStore';
import { ttsService } from './TTSService';

export class GatewayService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  
  connect(url: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('[Gateway] Connected');
          this.reconnectAttempts = 0;
          
          // 发送认证
          this.send('connect', {
            auth: { token }
          });
          
          useAppStore.getState().setConnection(url, token);
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleMessage(msg);
          } catch (e) {
            console.error('[Gateway] Parse error:', e);
          }
        };
        
        this.ws.onclose = () => {
          console.log('[Gateway] Disconnected');
          useAppStore.getState().setConnection('', '');
          this.attemptReconnect(url, token);
        };
        
        this.ws.onerror = (error) => {
          console.error('[Gateway] Error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private handleMessage(msg: any) {
    const { addMessage, setTyping, setSpeaking, addExp } = useAppStore.getState();
    
    switch (msg.type) {
      case 'chat.message':
        // 收到消息
        if (msg.role === 'assistant') {
          setTyping(false);
          addMessage({
            id: msg.id || Date.now().toString(),
            role: 'assistant',
            content: msg.content,
            timestamp: Date.now(),
          });
          // 触发 TTS
          this.speak(msg.content);
          // 加经验
          addExp(10);
        }
        break;
        
      case 'chat.typing':
        setTyping(msg.isTyping);
        break;
        
      default:
        console.log('[Gateway] Unknown message:', msg);
    }
  }
  
  send(type: string, data: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    } else {
      console.warn('[Gateway] Not connected');
    }
  }
  
  async sendMessage(text: string) {
    const { addMessage, addExp } = useAppStore.getState();
    
    // 添加用户消息
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });
    
    // 发送到 Gateway
    this.send('chat.send', { text });
    
    // 加经验
    addExp(5);
  }
  
  private async speak(text: string) {
    // 使用统一的 TTS 服务
    try {
      await ttsService.speak(text);
    } catch (error) {
      console.error('[Gateway] TTS failed:', error);
    }
  }
  
  private attemptReconnect(url: string, token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[Gateway] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(url, token), this.reconnectDelay);
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const gatewayService = new GatewayService();
