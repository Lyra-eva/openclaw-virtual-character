import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useAppStore } from '@/stores/useAppStore';
import { emotionService } from '@/services/EmotionService';
import { gestureService } from '@/services/GestureService';
import { fullDuplexService } from '@/services/FullDuplexService';
import { voiceWakeUpService } from '@/services/VoiceWakeUpService';
import { textEmotionDetector } from '@/services/TextEmotionDetector';
import { localVoiceService } from '@/services/LocalVoiceService';
import { useVoice, UltimateState } from '@/contexts/VoiceContext';
import { MultiInterpolator } from '@/utils/interpolate';
import { EMOTION_CONFIGS, EmotionType } from '@/types/emotions';

const AvatarView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  
  // 从 Context 获取语音服务状态
  const { state: ultimateState, isReady: ultimateEnabled, error: voiceError } = useVoice();
  
  const { isSpeaking, isRecording, messages } = useAppStore();
  
  // 模型和动画引用
  const modelRef = useRef<THREE.Object3D | null>(null);
  const morphTargetsRef = useRef<Record<string, number>>({});
  const headRef = useRef<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // 表情插值器 (平滑过渡)
  const emotionInterpolator = useRef<MultiInterpolator>(new MultiInterpolator());
  

  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // 初始化 Three.js
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    
    // 场景
    const scene = new THREE.Scene();
    
    // 相机 - 优化为半身像视角
    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      20
    );
    camera.position.set(0, 1.5, 2.0);
    camera.lookAt(0, 1.3, 0);
    
    // 灯光 - 柔和的三点光
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(1, 2, 2);
    scene.add(mainLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-1, 1, 1);
    scene.add(fillLight);
    
    const rimLight = new THREE.DirectionalLight(0x6699ff, 0.8);
    rimLight.position.set(0, 1, -1);
    scene.add(rimLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.crossOrigin = 'anonymous';
    
    const modelUrl = 'https://models.readyplayer.me/65a8f2b1c9d4e5f6a7b8c9d0.glb';
    
    loader.load(
      modelUrl,
      (gltf: GLTF) => {
        const model = gltf.scene;
        
        // 查找头部用于视线跟踪
        model.traverse((child) => {
          if (child.name.toLowerCase().includes('head')) {
            headRef.current = child;
          }
          
          // 优化材质
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              mesh.material.needsUpdate = true;
            }
          }
        });
        
        // 缩放到合适大小
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        model.rotation.set(0, Math.PI, 0);
        
        modelRef.current = model;
        scene.add(model);
        setModelLoaded(true);
        
        console.log('[Avatar] Model loaded');
        
        // 初始化全双工服务
        fullDuplexService.initialize();
        fullDuplexService.startMonitoring();
        
        // 初始化语音唤醒
        voiceWakeUpService.setEnabled(true);
        voiceWakeUpService.onWakeUp(() => {
          console.log('[Avatar] Wake word detected!');
          setEmotion('listening');
        });
        
        // 设置打断回调
        fullDuplexService.onInterruption(() => {
          console.log('[Avatar] User interrupted AI');
          fullDuplexService.aiStopSpeaking();
          setEmotion('listening');
        });
        
        // 添加 idle 动画
        const idleAnimation = createIdleAnimation(model);
        idleAnimation.start();
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        setLoadingProgress(percent);
      },
      (error) => {
        console.error('[Avatar] Load error:', error);
        loadFallbackModel(scene, camera);
      }
    );
    
    // 动画循环
    const clock = new THREE.Clock();
    let mouthOpen = 0;
    let lookUpAmount = 0;
    let blinkTime = 0;
    let blinkState = 0;
    
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      
      // 极致化服务更新
      if (ultimateEnabled) {
        const state = ultimateVoiceService.update(delta);
        setUltimateState(state);
        
        // 使用极致化服务的嘴型数据
        mouthOpen = state.mouthOpen;
      } else {
        // 说话时嘴型动画 - 降级到基础模式
        let currentMouthOpen = 0;
        
        const localStatus = localVoiceService.getStatus();
        if (localStatus.isInitialized && (localStatus.isSpeaking || localStatus.isRecording)) {
          currentMouthOpen = localVoiceService.getMouthOpen();
        } else if (isSpeaking) {
          currentMouthOpen = (Math.sin(time * 10) + 1) * 0.3;
          fullDuplexService.aiStartSpeaking();
        } else {
          currentMouthOpen *= 0.9;
          if (currentMouthOpen < 0.01) currentMouthOpen = 0;
          fullDuplexService.aiStopSpeaking();
        }
        
        mouthOpen = currentMouthOpen;
      }
      
      // 录音时向上看 (思考状)
      const targetLookUp = isRecording ? 0.5 : 0;
      lookUpAmount += (targetLookUp - lookUpAmount) * 0.1;
      
      // 自动眨眼 (每 3-6 秒一次)
      blinkTime += delta;
      const blinkInterval = 3 + Math.random() * 3;
      if (blinkTime > blinkInterval) {
        blinkState = 1;
        blinkTime = 0;
      }
      const blinkAmount = blinkState > 0 ? Math.max(0, 1 - blinkState * 5) : 0;
      blinkState += delta * 10;
      if (blinkState > 1) blinkState = 0;
      
      // 应用表情 - 极致化模式优先
      if (ultimateEnabled && ultimateState) {
        applyUltimateExpression(ultimateState);
      } else {
        // 降级到基础表情
        const emotionConfig = EMOTION_CONFIGS[currentEmotion];
        if (emotionConfig) {
          applyExpression({
            mouth: mouthOpen + emotionConfig.mouthOpen * 0.3,
            smile: emotionConfig.smile,
            eyes: emotionConfig.eyes.blink + blinkAmount * 0.5,
            brows: emotionConfig.brows,
            lookUp: lookUpAmount,
          });
        }
      }
      
      // 头部轻微跟随 (模拟视线跟踪)
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;
        headRef.current.rotation.x = Math.sin(time * 0.3) * 0.03;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // 窗口大小变化
    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // 清理
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
      fullDuplexService.dispose();
      voiceWakeUpService.setEnabled(false);
      // 不清理 ultimateVoiceService，因为它是全局单例
    };
  }, []);
  
  // 监听最新消息，自动检测情绪和手势
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      // 使用新的文本情绪检测器
      const result = textEmotionDetector.detect(lastMessage.content);
      const detectedEmotion = result.emotion as EmotionType;
      
      console.log('[Avatar] Detected emotion:', detectedEmotion, '(confidence:', result.confidence.toFixed(2) + ')');
      
      // 设置情绪 (带平滑过渡)
      setEmotion(detectedEmotion);
      
      // 选择并播放手势
      const gesture = gestureService.selectGesture(lastMessage.content);
      if (gesture) {
        gestureService.playGesture(gesture);
      }
    }
  }, [messages]);
  
  // 设置表情 (带平滑过渡)
  const setEmotion = (emotion: EmotionType) => {
    setCurrentEmotion(emotion);
    
    // 更新插值器目标值
    const config = EMOTION_CONFIGS[emotion];
    if (config) {
      emotionInterpolator.current.setTarget('mouth', config.mouthOpen, config.transition ? config.transition / 1000 : 0.15);
      emotionInterpolator.current.setTarget('smile', config.smile, 0.15);
      emotionInterpolator.current.setTarget('eyes', config.eyes.blink, 0.1);
      emotionInterpolator.current.setTarget('brows', config.brows, 0.15);
    }
  };
  
  // 应用极致化表情到模型
  const applyUltimateExpression = (state: UltimateState) => {
    if (!modelRef.current) return;
    
    // 应用微表情 (Action Units)
    const aus = state.actionUnits;
    
    modelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          const influences = mesh.morphTargetInfluences;
          
          // 嘴型 (来自预测唇形)
          if (influences.length > 0) {
            influences[0] = state.mouthOpen;
          }
          
          // 微笑 (来自微表情 AU12)
          if (influences.length > 1) {
            influences[1] = (aus.AU12_LipCornerPuller || 0) * 0.8;
          }
          
          // 眨眼 (来自微表情 AU43/AU45)
          if (influences.length > 2) {
            influences[2] = state.blinkAmount;
          }
          
          // 眉毛 (来自微表情 AU01/AU02/AU04)
          if (influences.length > 3) {
            const browValue = (
              (aus.AU01_InnerBrowRaiser || 0) +
              (aus.AU02_OuterBrowRaiser || 0) -
              (aus.AU04_BrowLowerer || 0)
            ) * 0.5;
            influences[3] = browValue;
          }
          
          // 脸颊 (来自微表情 AU06)
          if (influences.length > 4) {
            influences[4] = (aus.AU06_CheekRaiser || 0) * 0.6;
          }
          
          // 下巴张开 (来自微表情 AU26)
          if (influences.length > 5) {
            influences[5] = (aus.AU26_JawDrop || 0) * 0.7;
          }
        }
      }
    });
  };
  
  // 应用表情到模型 (使用插值)
  const applyExpression = (config: {
    mouth: number;
    smile: number;
    eyes: number;
    brows: number;
    lookUp: number;
  }) => {
    if (!modelRef.current) return;
    
    // 更新插值器
    const values = emotionInterpolator.current.update();
    
    modelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          // 使用插值后的平滑值
          if (mesh.morphTargetInfluences.length > 0) {
            mesh.morphTargetInfluences[0] = values.mouth || 0; // mouthOpen
          }
          if (mesh.morphTargetInfluences.length > 1) {
            mesh.morphTargetInfluences[1] = values.smile || 0; // smile
          }
          if (mesh.morphTargetInfluences.length > 2) {
            mesh.morphTargetInfluences[2] = values.eyes || 0; // blink
          }
          if (mesh.morphTargetInfluences.length > 3) {
            mesh.morphTargetInfluences[3] = values.brows || 0; // brow
          }
        }
      }
    });
  };
  
  return (
    <div 
      ref={mountRef} 
      className="w-full h-full relative"
      style={{ background: 'transparent' }}
    >
      {/* 加载进度 */}
      {!modelLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-4xl mb-4">🎭</div>
            <p className="text-white text-lg font-semibold mb-2">
              正在加载人物...
            </p>
            <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
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
      
      {/* 状态指示器 */}
      {modelLoaded && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-sm flex items-center space-x-4">
          <div>
            <span className="text-purple-300">表情:</span>
            <span className="text-white ml-2">{currentEmotion}</span>
          </div>
          {voiceError && (
            <div>
              <span className="text-red-400">●</span>
              <span className="text-red-300 ml-1">错误：{voiceError.code}</span>
            </div>
          )}
          {ultimateEnabled && !voiceError && (
            <div>
              <span className="text-green-400">●</span>
              <span className="text-green-300 ml-1">极致模式</span>
            </div>
          )}
          {!ultimateEnabled && !voiceError && (
            <div>
              <span className="text-yellow-400">●</span>
              <span className="text-yellow-300 ml-1">初始化中...</span>
            </div>
          )}
        </div>
      )}
      
      {/* 极致化状态调试面板 */}
      {modelLoaded && ultimateEnabled && ultimateState && (
        <div className="absolute top-20 left-4 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-gray-300 space-y-1">
          <div>嘴型：{ultimateState.mouthOpen.toFixed(2)}</div>
          <div>瞳孔：{ultimateState.pupilSize.toFixed(2)}mm</div>
          <div>眨眼：{ultimateState.blinkAmount.toFixed(2)}</div>
          <div>呼吸：{ultimateState.breathDepth.toFixed(3)}</div>
          <div>时间：{ultimateState.timeContext}</div>
          <div>用户情绪：{ultimateState.userMood}</div>
        </div>
      )}
    </div>
  );
};

/**
 * 创建简单的 idle 动画 (呼吸效果)
 */
function createIdleAnimation(model: THREE.Object3D) {
  let time = 0;
  
  return {
    start: () => {
      const animate = () => {
        time += 0.02;
        // 轻微上下浮动 (呼吸)
        model.position.y = Math.sin(time) * 0.02;
        // 轻微左右摇摆
        model.rotation.y = Math.sin(time * 0.5) * 0.05;
        requestAnimationFrame(animate);
      };
      animate();
    },
  };
}

/**
 * 加载备用模型
 */
function loadFallbackModel(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const loader = new GLTFLoader();
  const fallbackUrl = 'https://models.readyplayer.me/64b03f5c5d6e7b001f5c0e3f.glb';
  
  console.log('[Avatar] Loading fallback model:', fallbackUrl);
  
  loader.load(
    fallbackUrl,
    (gltf: GLTF) => {
      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      model.position.set(0, 0, 0);
      model.rotation.set(0, Math.PI, 0);
      scene.add(model);
      console.log('[Avatar] Fallback model loaded');
    },
    undefined,
    (error) => {
      console.error('[Avatar] Fallback model also failed:', error);
    }
  );
}

export default AvatarView;
