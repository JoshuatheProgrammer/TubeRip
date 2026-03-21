const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { registerHandlers } = require('./ipc-handlers');
const { DownloadManager } = require('./download-manager');
const { YtdlpService } = require('./ytdlp-service');
const { YtdlpUpdater, FfmpegUpdater } = require('./updater-service');
const { checkBinaries } = require('./binary-manager');
const settingsManager = require('./settings-manager');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 750,
    minHeight: 550,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    backgroundColor: '#1a1a2e',
    show: false,
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.ico')
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  // Check binaries
  const binCheck = checkBinaries();
  if (!binCheck.ok) {
    dialog.showErrorBox(
      'Missing Dependencies',
      'Required binaries not found:\n\n' +
      binCheck.missing.join('\n') +
      '\n\nPlease download yt-dlp.exe and ffmpeg.exe into the bin/win/ folder.'
    );
  }

  // Load settings
  const settings = settingsManager.loadSettings();

  const ytdlpService = new YtdlpService();
  const downloadManager = new DownloadManager(ytdlpService, null);
  const updater = new YtdlpUpdater(ytdlpService);
  const ffmpegUpdater = new FfmpegUpdater();

  // Apply saved settings
  downloadManager.setSpeedLimit(settings.speedLimit);
  downloadManager.setMaxConcurrent(settings.maxConcurrent || 2);

  createWindow();
  downloadManager.setWindow(mainWindow);
  registerHandlers(mainWindow, downloadManager, ytdlpService, updater, ffmpegUpdater);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
