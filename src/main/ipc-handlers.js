const { ipcMain, dialog, shell, app, Menu, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const settingsManager = require('./settings-manager');
const { MediaTools } = require('./media-tools');

const mediaTools = new MediaTools();

function registerHandlers(mainWindow, downloadManager, ytdlpService, updater) {
  ipcMain.handle('video:getInfo', async (_event, url) => {
    if (!isValidYoutubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }
    return await ytdlpService.getVideoInfo(url);
  });

  ipcMain.handle('download:start', async (_event, config) => {
    const { url, title, format, quality, outputPath, filenameTemplate, subtitleLang, subtitleFormat, embedMetadata, thumbnailUrl } = config;
    if (!isValidYoutubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }
    return downloadManager.add({ url, title, format, quality, outputPath, filenameTemplate, subtitleLang, subtitleFormat, embedMetadata, thumbnailUrl });
  });

  ipcMain.handle('download:cancel', async (_event, downloadId) => {
    downloadManager.cancel(downloadId);
  });

  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Download Folder'
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('app:getDownloadsPath', async () => {
    return app.getPath('downloads');
  });

  ipcMain.handle('shell:openFolder', async (_event, folderPath) => {
    if (folderPath && typeof folderPath === 'string') {
      const normalized = path.normalize(folderPath);
      shell.openPath(normalized);
    }
  });

  // ===== History =====
  const historyFile = path.join(app.getPath('userData'), 'download-history.json');

  ipcMain.handle('history:load', async () => {
    try {
      if (fs.existsSync(historyFile)) {
        const data = fs.readFileSync(historyFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      // Corrupted file, return empty
    }
    return [];
  });

  ipcMain.handle('history:save', async (_event, history) => {
    try {
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf-8');
    } catch (e) {
      // Silently fail
    }
  });

  // ===== Settings =====
  ipcMain.handle('settings:getSpeedLimit', () => {
    return settingsManager.getSetting('speedLimit');
  });

  ipcMain.handle('settings:setSpeedLimit', (_event, limit) => {
    downloadManager.setSpeedLimit(limit);
    settingsManager.setSetting('speedLimit', limit);
  });

  // ===== Generic Settings =====
  ipcMain.handle('settings:get', (_event, key) => {
    return settingsManager.getSetting(key);
  });

  ipcMain.handle('settings:set', (_event, key, value) => {
    settingsManager.setSetting(key, value);
  });

  // ===== Download retry/reorder =====
  ipcMain.handle('download:retry', async (_event, id) => {
    downloadManager.retry(id);
  });

  ipcMain.handle('download:reorder', async (_event, draggedId, beforeId) => {
    downloadManager.reorder(draggedId, beforeId);
  });

  // ===== Playlist =====
  ipcMain.handle('playlist:getInfo', async (_event, url) => {
    if (!isValidYoutubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }
    return await ytdlpService.getPlaylistInfo(url);
  });

  // ===== Search =====
  ipcMain.handle('search:youtube', async (_event, query, count) => {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Search query is empty');
    }
    return await ytdlpService.searchYouTube(query.trim(), count || 5);
  });

  // ===== Audio Preview =====
  ipcMain.handle('audio:getPreviewUrl', async (_event, url) => {
    if (!isValidYoutubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }
    return await ytdlpService.getAudioPreviewUrl(url);
  });

  // ===== Updater =====
  ipcMain.handle('updater:check', async () => {
    return await updater.checkForUpdate();
  });

  ipcMain.handle('updater:update', async () => {
    if (downloadManager.hasActiveDownloads()) {
      throw new Error('Cannot update while downloads are active');
    }
    return await updater.performUpdate((progress) => {
      mainWindow.webContents.send('updater:progress', progress);
    });
  });

  // ===== Window controls =====
  ipcMain.handle('window:minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow.isMaximized();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-changed', false);
  });

  // ===== Thumbnail Saver =====
  ipcMain.handle('thumbnail:save', async (_event, thumbnailUrl, outputPath, title) => {
    return await ytdlpService.saveThumbnail(thumbnailUrl, outputPath, title);
  });

  // ===== File Size Estimate =====
  ipcMain.handle('filesize:estimate', async (_event, url, format, quality) => {
    return await ytdlpService.getFileSizeEstimate(url, format, quality);
  });

  // ===== URL Expand =====
  ipcMain.handle('url:expand', async (_event, url) => {
    return await ytdlpService.expandUrl(url);
  });

  // ===== Smart Rename =====
  ipcMain.handle('util:smartRename', async (_event, title) => {
    return ytdlpService.smartRename(title);
  });

  // ===== Media Tools =====
  ipcMain.handle('media:convert', async (_event, inputPath, outputFormat) => {
    return await mediaTools.convert(inputPath, outputFormat, (progress) => {
      mainWindow.webContents.send('media:progress', { type: 'convert', ...progress });
    });
  });

  ipcMain.handle('media:compress', async (_event, inputPath, crf) => {
    return await mediaTools.compress(inputPath, crf, (progress) => {
      mainWindow.webContents.send('media:progress', { type: 'compress', ...progress });
    });
  });

  ipcMain.handle('media:audioBoost', async (_event, inputPath, volumeDb) => {
    return await mediaTools.audioBoost(inputPath, volumeDb, (progress) => {
      mainWindow.webContents.send('media:progress', { type: 'audioBoost', ...progress });
    });
  });

  ipcMain.handle('media:aspectRatio', async (_event, inputPath, ratio) => {
    return await mediaTools.changeAspectRatio(inputPath, ratio, (progress) => {
      mainWindow.webContents.send('media:progress', { type: 'aspectRatio', ...progress });
    });
  });

  ipcMain.handle('media:stabilize', async (_event, inputPath) => {
    return await mediaTools.stabilize(inputPath, (progress) => {
      mainWindow.webContents.send('media:progress', { type: 'stabilize', ...progress });
    });
  });

  // ===== File picker for media tools =====
  ipcMain.handle('dialog:selectFile', async (_event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      title: 'Select Media File',
      filters: filters || [
        { name: 'Media Files', extensions: ['mp4', 'webm', 'avi', 'mp3', 'wav', 'flac', 'aac', 'mkv', 'mov'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // ===== Context menu =====
  ipcMain.handle('context-menu:show', async (_event, options) => {
    return new Promise((resolve) => {
      const template = [];

      template.push({
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        enabled: options.hasSelection,
        click: () => resolve('cut')
      });
      template.push({
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        enabled: options.hasSelection,
        click: () => resolve('copy')
      });
      template.push({
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        enabled: options.hasClipboard,
        click: () => resolve('paste')
      });
      template.push({ type: 'separator' });
      template.push({
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        click: () => resolve('selectAll')
      });

      const menu = Menu.buildFromTemplate(template);
      menu.popup({
        window: BrowserWindow.fromWebContents(_event.sender),
        callback: () => resolve(null)
      });
    });
  });
}

function isValidYoutubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|playlist\?list=)|youtu\.be\/)[\w-]+/.test(url);
}

module.exports = { registerHandlers };
