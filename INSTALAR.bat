@echo off
title MasaPOS Pro v2.0 - Instalador Automatico
cls
color 0F

echo ╔══════════════════════════════════════════════════════════╗
echo ║        🌽 MasaPOS Pro v2.0 - INSTALADOR AUTOMATICO      ║
echo ║   Sistema POS para Fabricas de Masa, Molinos y Mas      ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo  Este programa va a instalar MasaPOS Pro en tu PC.
echo.
echo  ✅ Pasos:
echo    1. Verificar Node.js y Git
echo    2. Descargar el codigo fuente
echo    3. Instalar dependencias
echo    4. Compilar la aplicacion
echo    5. Generar el instalador .EXE
echo.
echo  ⏱️  Tiempo estimado: 2-5 minutos
echo.
echo ============================================================
echo.
pause
cls

:: ==================== 1. VERIFICAR NODE.JS ====================
echo [1/5] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ⚠️  Node.js NO esta instalado.
    echo.
    echo  Descargalo desde: https://nodejs.org
    echo  (Descarga la version LTS recomendada)
    echo.
    echo  Despues de instalarlo, CIERRA esta ventana y
    echo  ejecuta este instalador de NUEVO.
    echo.
    pause
    exit /b
)
node -v
echo  ✅ Node.js instalado correctamente
echo.
timeout /t 1 /nobreak >nul

:: ==================== 2. VERIFICAR GIT ====================
echo [2/5] Verificando Git...
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ⚠️  Git NO esta instalado.
    echo  Descargalo desde: https://git-scm.com/download/win
    echo.
    echo  Despues de instalarlo, CIERRA esta ventana y
    echo  ejecuta este instalador de NUEVO.
    echo.
    pause
    exit /b
)
git --version
echo  ✅ Git instalado correctamente
echo.
timeout /t 1 /nobreak >nul

:: ==================== 3. DESCARGAR CODIGO ====================
echo [3/5] Descargando MasaPOS Pro...
echo.
if exist "masapos-pro" (
    echo  📁 La carpeta ya existe, actualizando...
    echo.
    cd masapos-pro
    git pull
) else (
    git clone https://github.com/vaki89yu/masapos-pro.git
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  ❌ Error al descargar. Revisa tu conexion a internet.
        pause
        exit /b
    )
    cd masapos-pro
)
echo.
echo  ✅ Codigo descargado correctamente
echo.
timeout /t 1 /nobreak >nul

:: ==================== 4. INSTALAR DEPENDENCIAS ====================
echo [4/5] Instalando dependencias...
echo.
echo  ⏳ Esto puede tardar 1-2 minutos, por favor espera...
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Error al instalar dependencias.
    echo  Intenta ejecutar: npm install --force
    pause
    exit /b
)
echo.
echo  ✅ Dependencias instaladas correctamente
echo.
timeout /t 1 /nobreak >nul

:: ==================== 5. COMPILAR Y GENERAR .EXE ====================
echo [5/5] Compilando MasaPOS Pro y generando instalador...
echo.
echo  ⏳ Esto puede tardar 2-3 minutos...
echo.
echo  ============================================================
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Error en la compilacion.
    pause
    exit /b
)
echo.
echo  ✅ App compilada correctamente
echo.
echo  ⏳ Generando instalador de Windows (.exe)...
echo  ============================================================
call npm run electron:build:win
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ⚠️  El instalador .exe no se pudo generar automaticamente.
    echo  Pero la app ya esta compilada. Puedes ejecutarla con:
    echo.
    echo     npm run electron:dev
    echo.
    pause
    exit /b
)

cls
color 0A
echo ╔══════════════════════════════════════════════════════════╗
echo ║         ✅  INSTALACION COMPLETADA CON EXITO           ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo  📁 El instalador .EXE se encuentra en:
echo.
echo     C:\masapos-pro\release\
echo.
echo  🔸 Archivo: MasaPOS-Pro-2.0.0-Setup.exe
echo.
echo  ⚡ EJECUTA ESE ARCHIVO para instalar
echo     MasaPOS Pro en tu PC como programa.
echo.
echo  ============================================================
echo.
echo  📱 Para generar APK para tu celular Android:
echo     Abre https://appmaker.xyz
echo     Pon la URL: https://masapos-pro.vercel.app
echo     Dale clic a "Generate APK"
echo.
echo  ============================================================
echo.
pause
