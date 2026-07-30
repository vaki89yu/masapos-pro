const { app, BrowserWindow, Menu, screen, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let mainWindow = null;
let serverProcess = null;
const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

// ============================================================
//  INICIAR SERVIDOR NEXT.JS
// ============================================================
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, "..");

    serverProcess = spawn("node", [
      "node_modules/next/dist/bin/next",
      "start",
      "-p",
      String(PORT),
    ], {
      cwd: serverPath,
      env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let started = false;

    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      console.log(`[Next.js] ${msg.trim()}`);
      if (!started && (msg.includes("Ready") || msg.includes("localhost") || msg.includes("started"))) {
        started = true;
        resolve(true);
      }
    });

    serverProcess.stderr.on("data", (data) => {
      console.log(`[Next.js] ${data.toString().trim()}`);
    });

    serverProcess.on("error", (err) => {
      if (!started) reject(err);
    });

    serverProcess.on("exit", (code) => {
      console.log(`[Next.js] Servidor terminado con código ${code}`);
      if (!started) reject(new Error(`Servidor terminó con código ${code}`));
    });

    // Health check: esperar a que el servidor responda
    let attempts = 0;
    const maxAttempts = 60;
    const checkInterval = setInterval(() => {
      attempts++;
      const req = http.get(`${BASE_URL}/api/health`, (res) => {
        if (res.statusCode === 200 && !started) {
          started = true;
          clearInterval(checkInterval);
          resolve(true);
        }
      });
      req.on("error", () => {});
      req.end();

      if (attempts >= maxAttempts && !started) {
        clearInterval(checkInterval);
        // Aun si no responde, intentamos abrir la ventana
        started = true;
        resolve(true);
      }
    }, 1000);
  });
}

// ============================================================
//  MENU DE LA APLICACION
// ============================================================
function createMenu() {
  const template = [
    {
      label: "MasaPOS Pro",
      submenu: [
        { label: "Acerca de MasaPOS Pro", role: "about" },
        { type: "separator" },
        {
          label: "Cerrar ventana",
          accelerator: "CmdOrCtrl+W",
          role: "close",
        },
        {
          label: "Salir",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Editar",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        {
          label: "Pantalla completa",
          accelerator: "F11",
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          },
        },
        { type: "separator" },
        {
          label: "Abrir herramientas de desarrollador",
          accelerator: "F12",
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: "Ventana",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
      ],
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Guía rápida",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "MasaPOS Pro - Guía rápida",
              message: "🌽 MasaPOS Pro v2.0",
              detail: [
                "1. Selecciona el tipo de venta: Tienda ($10/kg) o Moto ($11/kg)",
                "2. Toca los botones de kilos (1kg al 10kg) para agregar al ticket",
                "3. Presiona 'Cobrar Masa' para abrir la calculadora de billetes",
                "4. Selecciona los billetes y monedas que recibiste",
                "5. Confirma el cobro y se imprimirá el ticket",
                "",
                "Atajos:",
                "  F9 / Enter = Cobrar ticket",
                "  F11 = Pantalla completa",
                "  F12 = Consola de desarrollador",
              ].join("\n"),
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================
//  CREAR VENTANA PRINCIPAL
// ============================================================
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(width, 1400),
    height: Math.min(height, 900),
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, "..", "public", "icon.png"),
    backgroundColor: "#0f172a",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
    },
  });

  mainWindow.loadURL(BASE_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setFullScreen(false);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Prevenir que se cierre la app cuando se cierra la ventana (en macOS)
  mainWindow.on("close", (event) => {
    if (process.platform === "darwin") {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// ============================================================
//  EVENTOS DE LA APLICACION
// ============================================================
app.whenReady().then(async () => {
  createMenu();
  
  try {
    console.log("🚀 Iniciando MasaPOS Pro...");
    await startServer();
    console.log("✅ Servidor listo en", BASE_URL);
    createWindow();
  } catch (err) {
    console.error("❌ Error al iniciar:", err);
    dialog.showErrorBox(
      "Error al iniciar MasaPOS Pro",
      `No se pudo iniciar el servidor.\n\n${err.message}\n\nAsegúrate de haber ejecutado "npm run build" primero.`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else if (process.platform === "darwin") {
    mainWindow.show();
  }
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  app.exit(0);
});
