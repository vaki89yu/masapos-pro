const { app, BrowserWindow, Menu, screen } = require("electron");
const path = require("path");
const { exec } = require("child_process");

let mainWindow;
let serverProcess;

// Arrancar el servidor Next.js
function startServer() {
  return new Promise((resolve, reject) => {
    // Usar el servidor de producción de Next.js
    serverProcess = exec("npx next start -p 3456", {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, PORT: "3456" },
    });

    serverProcess.stdout.on("data", (data) => {
      console.log(`[Next.js] ${data}`);
      if (data.includes("Ready") || data.includes("started") || data.includes("localhost")) {
        resolve(true);
      }
    });

    serverProcess.stderr.on("data", (data) => {
      console.log(`[Next.js] ${data}`);
    });

    serverProcess.on("error", (err) => {
      reject(err);
    });

    // Timeout de 30 segundos
    setTimeout(() => resolve(true), 30000);
  });
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(width, 1400),
    height: Math.min(height, 900),
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, "..", "public", "images", "masa-hero.jpg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0f172a",
    show: false,
  });

  // Barra de título personalizada
  const menuTemplate = [
    {
      label: "MasaPOS Pro",
      submenu: [
        { label: "Acerca de", role: "about" },
        { type: "separator" },
        {
          label: "Cerrar ventana",
          accelerator: "CmdOrCtrl+W",
          role: "close",
        },
        {
          label: "Salir",
          accelerator: "CmdOrCtrl+Q",
          role: "quit",
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
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        {
          label: "Pantalla completa",
          accelerator: "F11",
          role: "togglefullscreen",
        },
      ],
    },
    {
      label: "Ventana",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Cargar la app
  mainWindow.loadURL("http://localhost:3456");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    console.log("🚀 Iniciando MasaPOS Pro en modo escritorio...");
    await startServer();
    console.log("✅ Servidor Next.js iniciado, abriendo ventana...");
    createWindow();
  } catch (err) {
    console.error("Error al iniciar:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
