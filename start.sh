#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
echo "正在启动龙吟写作服务器…"
node server/server.js
