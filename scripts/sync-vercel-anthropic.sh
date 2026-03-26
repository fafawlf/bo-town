#!/usr/bin/env bash
# 从项目根目录的 .env 或当前 shell 的 ANTHROPIC_API_KEY 同步到 Vercel（production + preview）
set -euo pipefail
cd "$(dirname "$0")/.."

VAL=""
if [[ -f .env ]]; then
  VAL=$(node -e "
    const fs = require('fs');
    const t = fs.readFileSync('.env', 'utf8');
    const m = t.match(/^ANTHROPIC_API_KEY\\s*=\\s*(.+)$/m);
    if (!m) process.exit(1);
    let v = m[1].trim();
    if ((v.startsWith('\"') && v.endsWith('\"')) || (v.startsWith(\"'\") && v.endsWith(\"'\"))) v = v.slice(1, -1);
    process.stdout.write(v);
  " 2>/dev/null) || true
fi
if [[ -z "$VAL" && -n "${ANTHROPIC_API_KEY:-}" ]]; then
  VAL="$ANTHROPIC_API_KEY"
fi

if [[ -z "$VAL" ]]; then
  echo "未找到 ANTHROPIC_API_KEY：请在项目根目录创建 .env，内容一行：ANTHROPIC_API_KEY=sk-..." >&2
  exit 1
fi

npx vercel env add ANTHROPIC_API_KEY production --value "$VAL" -y --force
npx vercel env add ANTHROPIC_API_KEY preview --value "$VAL" -y --force
echo "已写入 Vercel production + preview。请执行: npx vercel deploy --prod"
