# 🌽 MasaPOS Pro v2.0

**Sistema POS Profesional para Fábricas de Masa, Molinos y Tortillerías**

> ✅ Funciona sin internet (Offline)  
> ✅ Se instala como App en celular (APK)  
> ✅ Se instala como Programa en PC (.exe)  
> ✅ Se despliega en la web (Vercel)

---

## 📦 DESCARGA DIRECTA

**[⬇️ DESCARGAR MasaPOS Pro ZIP](https://github.com/vaki89yu/masapos-pro/archive/refs/heads/main.zip)**

O clona con Git:
```bash
git clone https://github.com/vaki89yu/masapos-pro.git
cd masapos-pro
```

---

## 🪟 CÓMO GENERAR EL .EXE (Windows)

### 🔧 Requisitos (solo una vez):
1. Descarga e instala **Node.js** → https://nodejs.org (versión LTS)
2. Descarga e instala **Git** → https://git-scm.com/download/win

### ⚡ INSTALACIÓN AUTOMÁTICA (1 clic):
Haz doble clic en el archivo **`INSTALAR.bat`** que viene en el ZIP, o ejecuta esto en PowerShell:

```powershell
git clone https://github.com/vaki89yu/masapos-pro.git
cd masapos-pro
npm install
npm run build
npm run electron:build:win
```

✅ El instalador `.exe` aparecerá en la carpeta **`release/`**

---

## 📱 CÓMO GENERAR EL APK (Android)

### 🅰️ Método más fácil (sin PC):
1. Abre **https://appmaker.xyz** en tu navegador
2. Escribe: `https://masapos-pro.vercel.app`
3. Dale clic a **"Generate APK"**
4. Descarga e instala en tu celular

### 🅱️ Desde tu celular Android:
1. Abre Chrome en tu celular
2. Ve a: **`https://masapos-pro.vercel.app`**
3. Toca **3 puntitos → Instalar aplicación**
4. ✅ Se instala como app nativa

### 🅲 Desde tu PC:
1. Abre **https://pwabuilder.com**
2. Escribe: `https://masapos-pro.vercel.app`
3. **Start → Package → Android → Descargar APK**

---

## 🌐 CÓMO DESPLEGAR EN INTERNET (Vercel)

1. Ve a **https://vercel.com** e inicia sesión con GitHub
2. Dale clic a **"Add New → Project"**
3. Selecciona **`vaki89yu/masapos-pro`**
4. Dale clic a **"Deploy"**

✅ **URL permanente:** `https://masapos-pro.vercel.app`

### Para que guarde datos (recomendado):
1. Crea una BD gratis en **https://supabase.com**
2. En Supabase → **Settings → Database → Connection String**
3. Copia la URL que empieza con `postgresql://...`
4. En Vercel → **Settings → Environment Variables**
5. Agrega: **`DATABASE_URL`** = (pega la URL)
6. Redeployea
7. Abre: `https://masapos-pro.vercel.app/api/seed`

---

## 🚀 INICIO RÁPIDO (desarrollo local)

```bash
git clone https://github.com/vaki89yu/masapos-pro.git
cd masapos-pro
npm install
npm run dev
```

Abrir en navegador: **http://localhost:3000**

---

## 💻 COMANDOS DISPONIBLES

| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor producción |
| `npm run electron:build:win` | Generar instalador .exe para Windows |
| `npm run electron:build:linux` | Generar .AppImage para Linux |
| `npm run electron:build:mac` | Generar .dmg para Mac |

---

## 🧩 CARACTERÍSTICAS PRINCIPALES

| Módulo | Descripción |
|---|---|
| 🏪 **Mostrador POS** | Venta rápida con selectores 1kg al 10kg |
| 💰 **Tienda $10/kg** | Masa comprada en mostrador |
| 🏍️ **Moto $11/kg** | Masa repartida a domicilio |
| 🪙 **Calculadora de billetes** | Billetes $20, $50, $100, $200, $500, $1,000 MXN |
| 🪙 **Calculadora de monedas** | Monedas $1, $2, $5, $10 MXN |
| 📊 **Dashboard** | Estadísticas de ventas, kilos y métodos de pago |
| 🌾 **Bitácora del molino** | Registro de molienda y nixtamal |
| 💼 **Corte de caja** | Apertura/cierre de turno con arqueo |
| 🤝 **Clientes/Crédito** | Cuentas fiadas para taquerías |
| 📄 **Ticket térmico** | Comprobante imprimible |
| 🔇 **Sonido escáner** | Beep auténtico de supermercado |
| 📴 **Modo offline** | Funciona sin internet |

---

## 📂 ESTRUCTURA DEL PROYECTO

```
masapos-pro/
├── electron/
│   └── main.js              # Aplicación de escritorio (Electron)
├── public/
│   ├── images/               # Imágenes reales de masa y billetes
│   ├── manifest.json         # Configuración PWA
│   └── sw.js                 # Service Worker (modo offline)
├── src/
│   ├── app/
│   │   ├── api/              # APIs REST
│   │   ├── globals.css       # Estilos globales
│   │   ├── layout.tsx        # Layout principal
│   │   └── page.tsx          # Página principal
│   ├── components/           # Componentes React
│   ├── db/                   # Base de datos (Drizzle ORM)
│   └── lib/                  # Utilidades
├── INSTALAR.bat              # 💎 INSTALADOR 1 CLIC
└── README.md
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "npm no se reconoce"
➡️ Instala Node.js desde https://nodejs.org

### Error: "git no se reconoce"
➡️ Instala Git desde https://git-scm.com/download/win

### Error al generar .exe
➡️ Asegúrate de ejecutar `npm install` primero

### La caja aparece cerrada
➡️ Normal, la primera vez configura `DATABASE_URL` en Vercel o usa el modo demo

---

## 📄 LICENCIA

Uso libre para tu negocio de masa, molino o tortillería 🌽

---

**¿Preguntas? Abre un issue en:**  
https://github.com/vaki89yu/masapos-pro/issues
