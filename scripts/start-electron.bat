@echo off
title MasaPOS Pro - Escritorio
echo ====================================
echo    MasaPOS Pro - Inicio Rapido
echo ====================================
echo.
echo Instalando dependencias...
call npm install
echo.
echo Compilando la aplicacion...
call npm run build
echo.
echo Iniciando MasaPOS Pro en modo escritorio...
call npx concurrently "npx next start -p 3456" "npx wait-on http://localhost:3456 && npx electron electron/main.js"
pause
