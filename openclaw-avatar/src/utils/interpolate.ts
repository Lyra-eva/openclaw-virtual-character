/**
 * 插值工具函数
 * 用于平滑过渡动画
 */

/**
 * 线性插值
 * @param start 起始值
 * @param end 目标值
 * @param factor 插值因子 (0-1)
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * 平滑插值 (ease-in-out)
 * @param start 起始值
 * @param end 目标值
 * @param factor 插值因子 (0-1)
 */
export function smoothLerp(start: number, end: number, factor: number): number {
  // Smoothstep 函数
  const smoothFactor = factor * factor * (3 - 2 * factor);
  return start + (end - start) * smoothFactor;
}

/**
 * 角度插值 (处理 360 度边界)
 */
export function lerpAngle(start: number, end: number, factor: number): number {
  let diff = end - start;
  
  // 处理 360 度边界
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  
  return start + diff * factor;
}

/**
 * 颜色插值 (RGB)
 */
export function lerpColor(
  start: [number, number, number],
  end: [number, number, number],
  factor: number
): [number, number, number] {
  return [
    Math.round(lerp(start[0], end[0], factor)),
    Math.round(lerp(start[1], end[1], factor)),
    Math.round(lerp(start[2], end[2], factor)),
  ];
}

/**
 * 插值器类 (用于连续动画)
 */
export class Interpolator {
  private currentValue: number;
  private targetValue: number;
  private speed: number;

  constructor(initial: number, speed: number = 0.15) {
    this.currentValue = initial;
    this.targetValue = initial;
    this.speed = speed;
  }

  /**
   * 设置目标值
   */
  setTarget(target: number) {
    this.targetValue = target;
  }

  /**
   * 更新并返回当前值
   */
  update(): number {
    const diff = Math.abs(this.targetValue - this.currentValue);
    
    // 差异很小，直接设置目标值
    if (diff < 0.001) {
      this.currentValue = this.targetValue;
    } else {
      this.currentValue = lerp(this.currentValue, this.targetValue, this.speed);
    }
    
    return this.currentValue;
  }

  /**
   * 获取当前值
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * 重置
   */
  reset(value: number) {
    this.currentValue = value;
    this.targetValue = value;
  }
}

/**
 * 多值插值器 (用于多个参数同时过渡)
 */
export class MultiInterpolator {
  private interpolators: Map<string, Interpolator> = new Map();

  /**
   * 设置目标值
   */
  setTarget(key: string, target: number, speed?: number) {
    if (!this.interpolators.has(key)) {
      this.interpolators.set(key, new Interpolator(target, speed));
    } else {
      const interp = this.interpolators.get(key)!;
      if (speed !== undefined) interp.speed = speed;
      interp.setTarget(target);
    }
  }

  /**
   * 更新所有插值器
   */
  update(): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const [key, interp] of this.interpolators) {
      result[key] = interp.update();
    }
    
    return result;
  }

  /**
   * 获取某个值的当前值
   */
  getValue(key: string): number {
    return this.interpolators.get(key)?.getValue() || 0;
  }

  /**
   * 重置所有
   */
  reset() {
    this.interpolators.clear();
  }
}
