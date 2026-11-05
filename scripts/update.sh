#!/usr/bin/env bash
# 方糕萌宠 · 一键更新
#
#   ./scripts/update.sh            校验 + 刷新本地链接 + 提示刷新页面
#   ./scripts/update.sh --push     额外执行 git commit + push（同步到 GitHub）
#
# 说明：插件是以本地目录链接（link:）安装的，改完代码后磁盘上就是最新版，
# 剩下的只是让 Harness 重新加载模块 —— 这一步需要界面里的「重新安装」，
# 这里只能做到校验、touch 触发增量扫描、以及把提示打出来。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "▶ 1/3 校验插件"
node scripts/validate.mjs

echo "▶ 2/3 刷新本地链接安装"
touch client.js index.js package.json cordis.patch.yml 2>/dev/null || true
echo "  已 touch 入口文件，触发 Harness 的增量扫描"

if [[ "${1:-}" == "--push" ]]; then
  echo "▶ 3/3 提交并推送到 GitHub"
  git add -A
  if git diff --cached --quiet; then
    echo "  没有新的改动，跳过提交"
  else
    git commit -m "chore: update fanggao-pet ($(date '+%Y-%m-%d %H:%M'))"
    git push
  fi
else
  echo "▶ 3/3 跳过 git（加 --push 可提交并推送）"
fi

echo ""
echo "✅ 完成。让 Harness 重新加载："
echo "   1) 设置 → 插件(Plugins) → 方糕萌宠(@local/fanggao-pet) → 重新安装"
echo "   2) 回到页面刷新：Cmd + R"
echo ""
echo "   只改了 client.js 时，通常直接刷新页面（Cmd+R）就够了。"
