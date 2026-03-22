/**
 * AvatarModelService - 人物模型服务
 * 
 * 功能：
 * - 多模型切换
 * - 模型加载/卸载
 * - 模型自定义 (颜色/材质/配饰)
 * - 模型预设保存
 */

import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * 模型预设接口
 */
export interface AvatarPreset {
  id: string;
  name: string;
  modelUrl: string;
  thumbnail?: string;
  category: 'anime' | 'realistic' | 'cartoon' | 'custom';
  description?: string;
  
  // 自定义选项
  customizations?: {
    hairColor?: string;
    eyeColor?: string;
    skinColor?: string;
    clothingColor?: string;
    accessories?: string[];
  };
}

/**
 * 模型加载配置
 */
export interface ModelLoadConfig {
  url: string;
  scale?: number;
  position?: THREE.Vector3;
  rotation?: THREE.Vector3;
  onProgress?: (progress: number) => void;
  onComplete?: (gltf: GLTF) => void;
  onError?: (error: Error) => void;
}

/**
 * 材质自定义配置
 */
export interface MaterialCustomization {
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
}

export class AvatarModelService {
  private loader: GLTFLoader;
  private currentModel: GLTF | null = null;
  private loadedModels: Map<string, GLTF> = new Map();
  private presets: AvatarPreset[] = [];
  
  // 当前自定义配置
  private currentCustomizations: Record<string, MaterialCustomization> = {};
  
  constructor() {
    this.loader = new GLTFLoader();
    this.loadPresets();
  }
  
  /**
   * 加载预设列表
   */
  private loadPresets(): void {
    // 内置预设
    this.presets = [
      {
        id: 'default-female',
        name: '温柔女助手',
        modelUrl: 'https://models.readyplayer.me/65a8f2b1c9d4e5f6a7b8c9d0.glb',
        category: 'realistic',
        description: '温柔专业的亚洲女性 AI 助手',
        customizations: {
          hairColor: '#2c1b18',
          eyeColor: '#4a3728',
          skinColor: '#f5d0b0',
        },
      },
      {
        id: 'default-male',
        name: '专业男助手',
        modelUrl: 'https://models.readyplayer.me/64b03f5c5d6e7b001f5c0e3f.glb',
        category: 'realistic',
        description: '专业可靠的男性 AI 助手',
        customizations: {
          hairColor: '#1a1a1a',
          eyeColor: '#3d2817',
          skinColor: '#e8c4a0',
        },
      },
      {
        id: 'anime-female',
        name: '动漫少女',
        modelUrl: 'https://models.readyplayer.me/anime-girl-001.glb',
        category: 'anime',
        description: '可爱的动漫风格少女',
        customizations: {
          hairColor: '#ff69b4',
          eyeColor: '#00bfff',
          skinColor: '#ffe4e1',
        },
      },
      {
        id: 'cartoon-robot',
        name: '卡通机器人',
        modelUrl: 'https://models.readyplayer.me/robot-001.glb',
        category: 'cartoon',
        description: '可爱的卡通机器人',
        customizations: {
          color: '#c0c0c0',
        },
      },
    ];
  }
  
  /**
   * 获取所有预设
   */
  getPresets(): AvatarPreset[] {
    return [...this.presets];
  }
  
  /**
   * 根据分类筛选预设
   */
  getPresetsByCategory(category: string): AvatarPreset[] {
    return this.presets.filter(p => p.category === category);
  }
  
  /**
   * 加载模型
   */
  async loadModel(config: ModelLoadConfig): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      // 检查缓存
      if (this.loadedModels.has(config.url)) {
        console.log('[AvatarModel] Loading from cache:', config.url);
        this.currentModel = this.loadedModels.get(config.url)!;
        resolve(this.currentModel);
        return;
      }
      
      console.log('[AvatarModel] Loading model:', config.url);
      
      this.loader.load(
        config.url,
        (gltf) => {
          // 应用自定义配置
          if (config.url in this.currentCustomizations) {
            this.applyMaterialCustomizations(gltf, this.currentCustomizations[config.url]);
          }
          
          // 设置默认变换
          gltf.scene.scale.setScalar(config.scale || 1);
          if (config.position) gltf.scene.position.copy(config.position);
          if (config.rotation) gltf.scene.rotation.copy(config.rotation);
          
          // 缓存模型
          this.loadedModels.set(config.url, gltf);
          this.currentModel = gltf;
          
          console.log('[AvatarModel] Model loaded successfully');
          config.onComplete?.(gltf);
          resolve(gltf);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            config.onProgress?.(percent);
          }
        },
        (error) => {
          console.error('[AvatarModel] Load error:', error);
          config.onError?.(error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * 应用材质自定义
   */
  applyMaterialCustomizations(gltf: GLTF, customizations: Record<string, MaterialCustomization>): void {
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        
        // 根据材质名称应用自定义
        const materialName = material.name.toLowerCase();
        
        // 头发颜色
        if (materialName.includes('hair') && customizations.hairColor) {
          material.color.set(customizations.hairColor);
        }
        
        // 眼睛颜色
        if (materialName.includes('eye') && customizations.eyeColor) {
          material.color.set(customizations.eyeColor);
          material.emissive?.set(customizations.eyeColor);
          material.emissiveIntensity = 0.3;
        }
        
        // 皮肤颜色
        if (materialName.includes('skin') && customizations.skinColor) {
          material.color.set(customizations.skinColor);
          material.roughness = customizations.roughness || 0.5;
        }
        
        // 衣服颜色
        if (materialName.includes('cloth') && customizations.clothingColor) {
          material.color.set(customizations.clothingColor);
        }
        
        material.needsUpdate = true;
      }
    });
  }
  
  /**
   * 自定义当前模型
   */
  customizeCurrentModel(customizations: Record<string, MaterialCustomization>): void {
    if (!this.currentModel) {
      throw new Error('No model loaded');
    }
    
    // 保存自定义配置
    const currentUrl = 'current'; // 简化处理
    this.currentCustomizations[currentUrl] = customizations;
    
    // 应用自定义
    this.applyMaterialCustomizations(this.currentModel, customizations);
  }
  
  /**
   * 切换模型
   */
  async switchToPreset(presetId: string, scene: THREE.Scene, onProgress?: (progress: number) => void): Promise<void> {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }
    
    console.log('[AvatarModel] Switching to preset:', preset.name);
    
    // 移除当前模型
    if (this.currentModel) {
      scene.remove(this.currentModel.scene);
    }
    
    // 加载新模型
    try {
      const gltf = await this.loadModel({
        url: preset.modelUrl,
        scale: 1,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(0, Math.PI, 0),
        onProgress,
      });
      
      // 应用预设自定义
      if (preset.customizations) {
        this.applyMaterialCustomizations(gltf, preset.customizations);
      }
      
      scene.add(gltf.scene);
      console.log('[AvatarModel] Switched to:', preset.name);
    } catch (error) {
      console.error('[AvatarModel] Switch failed:', error);
      throw error;
    }
  }
  
  /**
   * 导出当前模型配置
   */
  exportConfiguration(): object {
    return {
      currentModel: this.currentModel ? 'loaded' : 'none',
      customizations: this.currentCustomizations,
      presets: this.presets.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
    };
  }
  
  /**
   * 添加自定义预设
   */
  addCustomPreset(preset: AvatarPreset): void {
    this.presets.push(preset);
    console.log('[AvatarModel] Added custom preset:', preset.name);
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.loadedModels.forEach((gltf) => {
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    });
    
    this.loadedModels.clear();
    this.currentModel = null;
  }
}

export const avatarModelService = new AvatarModelService();
