const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const net = require("net");

// process.resourcesPath only exists once packaged; in dev (npm start) fall back
// to the staged build-resources/ folder next to this file so the same code path
// works both before and after packaging.
const RESOURCES_DIR = app.isPackaged ? process.resourcesPath : path.join(__dirname, "build-resources");

const JRE_DIR = path.join(RESOURCES_DIR, "jre");
const JAVA_EXE = path.join(JRE_DIR, "bin", "java.exe");
const BACKEND_JAR = path.join(RESOURCES_DIR, "backend", "app.jar");
const PG_BIN = path.join(RESOURCES_DIR, "pgsql", "bin");
const PG_CTL = path.join(PG_BIN, "pg_ctl.exe");
const INITDB = path.join(PG_BIN, "initdb.exe");
const CREATEDB = path.join(PG_BIN, "createdb.exe");

// Postgres data has to live somewhere writable regardless of where the app is
// installed (e.g. Program Files is read-only for normal users), so it goes in
// the per-user app-data folder rather than next to the bundled binaries.
const DATA_DIR = path.join(app.getPath("userData"), "pgdata");
const PG_LOG = path.join(app.getPath("userData"), "pg.log");
const APP_LOG_PATH = path.join(app.getPath("userData"), "app.log");
const FRONTEND_INDEX = path.join(__dirname, "..", "frontend", "dist", "index.html");
const FRONTEND_INDEX_PACKAGED = path.join(RESOURCES_DIR, "frontend", "index.html");

const appLog = fs.createWriteStream(APP_LOG_PATH, { flags: "a" });
function log(...args) {
  appLog.write(`[${new Date().toISOString()}] ${args.join(" ")}\n`);
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

function run(cmd, args) {
  // stdio: "ignore" rather than execFile's piped stdout/stderr: pg_ctl start
  // spawns postgres.exe, which spawns further child processes that inherit
  // the pipe handles, so a piped child_process callback never sees EOF and
  // hangs forever even after pg_ctl itself has exited successfully.
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "ignore" });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      log(`ran: ${cmd} ${args.join(" ")} -> exit ${code}`);
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function ensurePostgres() {
  log("checking postgres on 5433...");
  if (await isPortOpen(5433)) {
    log("postgres already running");
    return;
  }

  const firstRun = !fs.existsSync(DATA_DIR);
  if (firstRun) {
    log("no existing data dir, running initdb into", DATA_DIR);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    await run(INITDB, ["-D", DATA_DIR, "-U", "postgres", "--auth=trust", "-E", "UTF8"]);
    fs.appendFileSync(path.join(DATA_DIR, "postgresql.conf"), "\nport = 5433\n");
  }

  log("starting postgres via", PG_CTL);
  await run(PG_CTL, ["-D", DATA_DIR, "-l", PG_LOG, "start"]);
  await waitForPort(5433, 15000);
  log("postgres is up");

  if (firstRun) {
    log("creating discordclone database");
    await run(CREATEDB, ["-U", "postgres", "-h", "127.0.0.1", "-p", "5433", "discordclone"]);
  }
}

async function ensureBackend() {
  log("checking backend on 8080...");
  if (await isPortOpen(8080)) {
    log("backend already running");
    return;
  }
  log("spawning backend:", JAVA_EXE, "-jar", BACKEND_JAR);
  log("jar exists:", fs.existsSync(BACKEND_JAR), "java exists:", fs.existsSync(JAVA_EXE));

  backendProcess = spawn(JAVA_EXE, ["-jar", BACKEND_JAR], { cwd: path.dirname(BACKEND_JAR) });
  backendProcess.stdout.on("data", (d) => log("[backend]", d.toString().trim()));
  backendProcess.stderr.on("data", (d) => log("[backend:err]", d.toString().trim()));
  backendProcess.on("error", (err) => log("backend spawn error:", String(err)));
  backendProcess.on("exit", (code, signal) => log("backend exited, code:", code, "signal:", signal));

  await waitForPort(8080, 60000);
  log("backend is up");
}

function showLoadingScreen(text) {
  mainWindow.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`
      <body style="background:#313338;color:#dbdee1;font-family:sans-serif;
        display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <p>${text}</p>
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
  showLoadingScreen("Starting Discord Clone (first launch can take a minute)...");
}

app.whenReady().then(async () => {
  log("app ready, packaged:", app.isPackaged, "resourcesDir:", RESOURCES_DIR);
  createWindow();
  try {
    await ensurePostgres();
    await ensureBackend();
    const frontendPath = app.isPackaged ? FRONTEND_INDEX_PACKAGED : FRONTEND_INDEX;
    mainWindow.loadFile(frontendPath);
    log("loaded frontend from", frontendPath);
  } catch (err) {
    log("STARTUP FAILED:", String(err), err && err.stack);
    dialog.showErrorBox("Startup failed", `${err}\n\nLog: ${APP_LOG_PATH}`);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});
