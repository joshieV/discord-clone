const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn, execFile } = require("child_process");
const net = require("net");

// Hardcoded rather than derived from __dirname: once packaged, __dirname points
// inside the app's asar archive, not this machine's D:\discord-clone checkout,
// but the backend jar / frontend build / pgdata all live at this fixed path.
const PROJECT_ROOT = "D:\\discord-clone";
const PGDATA = path.join(PROJECT_ROOT, "pgdata");
const PG_LOG = path.join(PROJECT_ROOT, "pg.log");
const PG_CTL = path.join(process.env.LOCALAPPDATA, "Programs", "pgsql", "pgsql", "bin", "pg_ctl.exe");
const JAVA_EXE = "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot\\bin\\java.exe";
const BACKEND_JAR = path.join(PROJECT_ROOT, "backend", "target", "discordclone-0.0.1-SNAPSHOT.jar");
const BACKEND_DIR = path.join(PROJECT_ROOT, "backend");
const FRONTEND_INDEX = path.join(PROJECT_ROOT, "frontend", "dist", "index.html");
const APP_LOG_PATH = path.join(PROJECT_ROOT, "electron-app.log");

const appLog = fs.createWriteStream(APP_LOG_PATH, { flags: "a" });
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}`;
  appLog.write(line + "\n");
}

let backendProcess = null;
let mainWindow = null;

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function waitForPort(port, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function check() {
      isPortOpen(port).then((open) => {
        if (open) return resolve();
        if (Date.now() - start > timeoutMs) {
          return reject(new Error(`Timed out waiting for port ${port}`));
        }
        setTimeout(check, 500);
      });
    })();
  });
}

async function ensurePostgres() {
  log("checking postgres on 5433...");
  if (await isPortOpen(5433)) {
    log("postgres already running");
    return;
  }
  log("starting postgres via", PG_CTL);
  await new Promise((resolve, reject) => {
    execFile(PG_CTL, ["-D", PGDATA, "-l", PG_LOG, "start"], (error, stdout, stderr) => {
      log("pg_ctl exit:", error ? String(error) : "ok", "stdout:", stdout, "stderr:", stderr);
      if (error) return reject(error);
      resolve();
    });
  });
  await waitForPort(5433, 15000);
  log("postgres is up");
}

async function ensureBackend() {
  log("checking backend on 8080...");
  if (await isPortOpen(8080)) {
    log("backend already running");
    return;
  }
  log("spawning backend:", JAVA_EXE, "-jar", BACKEND_JAR, "cwd:", BACKEND_DIR);
  log("jar exists:", fs.existsSync(BACKEND_JAR), "java exists:", fs.existsSync(JAVA_EXE));

  backendProcess = spawn(JAVA_EXE, ["-jar", BACKEND_JAR], { cwd: BACKEND_DIR });
  log("spawned backend process, pid:", backendProcess.pid);

  backendProcess.stdout.on("data", (d) => log("[backend stdout]", d.toString().trim()));
  backendProcess.stderr.on("data", (d) => log("[backend stderr]", d.toString().trim()));
  backendProcess.on("error", (err) => log("backend spawn error:", String(err)));
  backendProcess.on("exit", (code, signal) => log("backend exited, code:", code, "signal:", signal));

  await waitForPort(8080, 60000);
  log("backend is up");
}

function showLoadingScreen() {
  mainWindow.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`
      <body style="background:#313338;color:#dbdee1;font-family:sans-serif;
        display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <p>Starting Discord Clone...</p>
      </body>
    `)
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    title: "Discord Clone",
    webPreferences: { contextIsolation: true },
  });
  showLoadingScreen();
}

app.whenReady().then(async () => {
  log("app ready, JAVA_HOME env:", process.env.JAVA_HOME, "PATH len:", (process.env.PATH || "").length);
  createWindow();
  try {
    await ensurePostgres();
    await ensureBackend();
    mainWindow.loadFile(FRONTEND_INDEX);
    log("loaded frontend");
  } catch (err) {
    log("STARTUP FAILED:", String(err), err && err.stack);
    dialog.showErrorBox("Startup failed", String(err));
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});
