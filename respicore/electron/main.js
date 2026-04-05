const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

let nextProcess = null;
let mainWindow = null;

const PORT = process.env.PORT || 3000;

function findExecutablePath() {
  if (process.platform === 'win32') {
    return path.join(process.resourcesPath, 'app', '.next', 'standalone');
  }
  return path.join(process.resourcesPath, '.next', 'standalone');
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close();
      resolve(true);
    });
    server.on('error', () => resolve(false));
  });
}

async function waitForServer(port, retries = 60) {
  for (let i = 0; i < retries; i++) {
    const available = await isPortAvailable(port);
    if (!available) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function startNextServer() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    nextProcess = spawn('npx', ['next', 'dev', '--port', PORT], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });
  } else {
    const baseDir = app.isPackaged ? findExecutablePath() : path.join(__dirname, '..');
    nextProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      shell: true,
      cwd: baseDir,
      env: { ...process.env, PORT: String(PORT) }
    });
  }

  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js server:', err);
  });

  const ready = await waitForServer(PORT);
  if (!ready) {
    console.error('Next.js server failed to start within timeout');
    app.quit();
    return;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#050d14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startNextServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill('SIGTERM');
  }
});

// Kill next process if main process is killed
process.on('exit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});
