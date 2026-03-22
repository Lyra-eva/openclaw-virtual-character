#!/bin/bash

# 完整测试脚本 - 验证所有修复

set -e

echo "======================================"
echo "🧪 OpenClaw Avatar 完整测试"
echo "======================================"
echo ""

# 1. TypeScript 编译检查
echo "📝 1. TypeScript 编译检查..."
cd /home/admin/.openclaw/workspace/openclaw-avatar

# 运行编译，捕获错误
TSC_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ TypeScript 编译通过！"
else
    echo "⚠️  发现 $ERROR_COUNT 个 TypeScript 错误："
    echo "$TSC_OUTPUT" | grep "error TS" | head -20
fi

echo ""

# 2. 检查关键文件是否存在
echo "📦 2. 检查关键文件..."
FILES=(
    "src/services/VoiceErrors.ts"
    "src/services/VoiceEvents.ts"
    "src/contexts/VoiceContext.tsx"
    "src/services/index.ts"
    "src/contexts/index.tsx"
    "src/main.tsx"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "✅ 所有关键文件存在！"
else
    echo "❌ 缺失 $MISSING 个文件"
fi

echo ""

# 3. 检查依赖
echo "📦 3. 检查依赖..."
if [ -f "package.json" ]; then
    if grep -q "onnxruntime-web" package.json; then
        echo "  ✅ onnxruntime-web 已安装"
    else
        echo "  ⚠️  onnxruntime-web 未安装"
    fi
fi

echo ""

# 4. 启动开发服务器测试
echo "🚀 4. 启动开发服务器测试..."
echo "   访问：http://localhost:1420/test-ultimate.html"
echo ""
echo "   测试项目："
echo "   - 初始化所有服务"
echo "   - 微表情测试 (6 种情绪)"
echo "   - 情感语音测试"
echo "   - 手势测试"
echo "   - 唇形同步测试"
echo "   - 环境感知测试"
echo "   - 完整情感表达测试"
echo ""

# 5. 显示文档
echo "📚 5. 相关文档："
echo "   - P0 修复完成报告.md"
echo "   - 架构修复总结.md"
echo "   - 测试指南.md"
echo "   - ULTIMATE_2.0_实现完成.md"
echo ""

echo "======================================"
echo "✅ 测试准备完成！"
echo "======================================"
echo ""
echo "下一步："
echo "1. npm run dev          # 启动开发服务器"
echo "2. 访问测试页面          # http://localhost:1420/test-ultimate.html"
echo "3. 执行所有测试用例"
echo ""
