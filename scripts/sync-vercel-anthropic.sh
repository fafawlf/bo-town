#!/usr/bin/env bash
# 从 .env / .env.local（或当前 shell 的 ANTHROPIC_API_KEY）同步到 Vercel（production + preview）
# 注意：密钥应放在名为 .env 的文件里；.env.example 只是模板，不会被读取。
set -euo pipefail
cd "$(dirname "$0")/.."

read_key_from_file() {
  ENV_FILE="$1" node -e "
const fs = require('fs');
const f = process.env.ENV_FILE;
const t = fs.readFileSync(f, 'utf8');
const m = t.match(/^ANTHROPIC_API_KEY\\s*=\\s*(.+)$/m);
if (!m) process.exit(1);
let v = m[1].trim();
if ((v.startsWith('\"') && v.endsWith('\"')) || (v.startsWith(\"'\") && v.endsWith(\"'\"))) v = v.slice(1, -1);
process.stdout.write(v);
" 2>/dev/null
}

VAL=""
for f in .env .env.local; do
  if [[ -f "$f" ]]; then
    if VAL_TRY=$(read_key_from_file "$f"); then
      VAL="$VAL_TRY"
      echo "已从 $f 读取 ANTHROPIC_API_KEY" >&2
      break
    fi
  fi
done
if [[ -z "$VAL" && -n "${ANTHROPIC_API_KEY:-}" ]]; then
  VAL="$ANTHROPIC_API_KEY"
  echo "已从环境变量 ANTHROPIC_API_KEY 读取" >&2
fi

if [[ -z "$VAL" ]]; then
  echo "未找到 ANTHROPIC_API_KEY。" >&2
  echo "请在本目录创建 .env（不要只用 .env.example），例如：" >&2
  echo "  cp .env.example .env   # 然后编辑 .env，把 key 填在 ANTHROPIC_API_KEY= 后面" >&2
  exit 1
fi

npx vercel env add ANTHROPIC_API_KEY production --value "$VAL" -y --force
npx vercel env add ANTHROPIC_API_KEY preview --value "$VAL" -y --force
echo "已写入 Vercel production + preview。请执行: npx vercel deploy --prod"
