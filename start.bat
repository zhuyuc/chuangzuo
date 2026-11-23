@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动龙吟写作服务器…
node server\server.js
pause
