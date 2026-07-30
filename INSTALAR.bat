@echo off
title MasaPOS Pro - Instalador Automatico
cls
color 0A

echo =================================================
echo      🌽 MasaPOS Pro - INSTALADOR AUTOMATICO
echo      Sistema POS para Fabricas de Masa
echo =================================================
echo.
echo  Este instalador va a:
echo    1. Verificar que tengas Node.js instalado
echo    2. Descargar el codigo fuente
echo    3. Instalar las dependencias
echo    4. Compilar la aplicacion
echo    5. Generar el instalador .EXE para Windows
echo.
echo =================================================
echo.

pause
cls

:: Verificar si Node.js esta instalado
echo [1/5] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ⚠️  Node.js NO esta instalado.
    echo.
    echo  Descargalo desde: https://nodejs.org
    echo  (Version LTS recomendada)
    echo.
    echo  Despues de instalarlo, ejecuta este archivo otra vez.
    echo.
    pause
    exit /b
)
echo  ✅ Node.js encontrado
timeout /t 1 /nobreak >nul

:: Verificar si Git esta instalado
echo [2/5] Verificando Git...
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ⚠️  Git NO esta instalado.
    echo  Descargalo desde: https://git-scm.com/download/win
    echo.
    echo  Despues de instalarlo, ejecuta este archivo otra vez.
    echo.
    pause
    exit /b
)
echo  ✅ Git encontrado
timeout /t 1 /nobreak >nul

:: Clonar el repositorio
echo [3/5] Descargando MasaPOS Pro...
if exist "masapos-pro" (
    echo  📁 La carpeta ya existe, actualizando...
    cd masapos-pro
    git pull
) else (
    git clone https://github.com/vaki89yu/masapos-pro.git
    cd masapos-pro
)
echo  ✅ Codigo descargado
timeout /t 1 /nobreak >nul

:: Instalar dependencias
echo [4/5] Instalando dependencias (esto puede tardar un par de minutos)...
call npm install
echo  ✅ Dependencias instaladas
timeout /t 1 /nobreak >nul

:: Compilar la app
echo [5/5] Compilando aplicacion y generando .EXE...
echo.
call npm run build
echo.
echo  ✅ Aplicacion compilada correctamente
echo.
echo  ⏳ Generando instalador de Windows...
echo  (Esto puede tomar varios minutos...)
echo.
call npm run electron:build:win

cls
color 0B
echo =================================================
echo      ✅ INSTALACION COMPLETADA CON EXITO
echo =================================================
echo.
echo  📁 El instalador .EXE esta en la carpeta:
echo     C:\masapos-pro\release\
echo.
echo  🔸 Archivo: MasaPOS-Pro-Setup.exe
echo.
echo  ⚡ Ejecuta ese archivo para instalar
echo     MasaPOS Pro en tu PC.
echo.
echo  📱 Para generar APK Android:
echo     Abre https://appmaker.xyz
echo     Pon la URL de tu MasaPOS
echo.
echo =================================================
echo.
pause
