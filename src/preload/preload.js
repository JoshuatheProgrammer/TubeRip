const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getVideoInfo: (url) => ipcRenderer.invoke('video:getInfo', url),

  startDownload: (config) => ipcRenderer.invoke('download:start', config),
  cancelDownload: (id) => ipcRenderer.invoke('download:cancel', id),

  onDownloadProgress: (callback) => {
    ipcRenderer.on('download:progress', (_event, data) => callback(data));
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download:complete', (_event, data) => callback(data));
  },
  onDownloadError: (callback) => {
    ipcRenderer.on('download:error', (_event, data) => callback(data));
  },

  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  getDownloadsPath: () => ipcRenderer.invoke('app:getDownloadsPath'),
  openFolder: (folderPath) => ipcRenderer.invoke('shell:openFolder', folderPath),

  // History
  loadHistory: () => ipcRenderer.invoke('history:load'),
  saveHistory: (history) => ipcRenderer.invoke('history:save', history),

  // Context menu
  showContextMenu: (options) => ipcRenderer.invoke('context-menu:show', options),

  // Clipboard
  readClipboard: () => clipboard.readText(),
  writeClipboard: (text) => clipboard.writeText(text),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChanged: (callback) => {
    ipcRenderer.on('window:maximized-changed', (_event, isMaximized) => callback(isMaximized));
  },

  // Settings
  getSpeedLimit: () => ipcRenderer.invoke('settings:getSpeedLimit'),
  setSpeedLimit: (limit) => ipcRenderer.invoke('settings:setSpeedLimit', limit),
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // Download retry/reorder
  retryDownload: (id) => ipcRenderer.invoke('download:retry', id),
  reorderDownload: (draggedId, beforeId) => ipcRenderer.invoke('download:reorder', draggedId, beforeId),

  // Playlist
  getPlaylistInfo: (url) => ipcRenderer.invoke('playlist:getInfo', url),

  // Search
  searchYouTube: (query, count) => ipcRenderer.invoke('search:youtube', query, count),

  // Audio Preview
  getAudioPreviewUrl: (url) => ipcRenderer.invoke('audio:getPreviewUrl', url),

  // Updater
  checkForUpdate: () => ipcRenderer.invoke('updater:check'),
  performUpdate: () => ipcRenderer.invoke('updater:update'),
  onUpdateProgress: (callback) => {
    ipcRenderer.on('updater:progress', (_event, data) => callback(data));
  },

  // FFmpeg updater
  checkFfmpegUpdate: () => ipcRenderer.invoke('ffmpeg:checkUpdate'),
  performFfmpegUpdate: () => ipcRenderer.invoke('ffmpeg:update'),
  onFfmpegProgress: (callback) => {
    ipcRenderer.on('ffmpeg:progress', (_event, data) => callback(data));
  },

  // Thumbnail saver
  saveThumbnail: (thumbnailUrl, outputPath, title) => ipcRenderer.invoke('thumbnail:save', thumbnailUrl, outputPath, title),

  // File size estimate
  getFileSizeEstimate: (url, format, quality) => ipcRenderer.invoke('filesize:estimate', url, format, quality),

  // URL expand (shortener support)
  expandUrl: (url) => ipcRenderer.invoke('url:expand', url),

  // Smart rename
  smartRename: (title) => ipcRenderer.invoke('util:smartRename', title),

  // Media tools
  convertMedia: (inputPath, outputFormat) => ipcRenderer.invoke('media:convert', inputPath, outputFormat),
  compressMedia: (inputPath, crf) => ipcRenderer.invoke('media:compress', inputPath, crf),
  audioBoost: (inputPath, volumeDb) => ipcRenderer.invoke('media:audioBoost', inputPath, volumeDb),
  changeAspectRatio: (inputPath, ratio) => ipcRenderer.invoke('media:aspectRatio', inputPath, ratio),
  stabilizeVideo: (inputPath) => ipcRenderer.invoke('media:stabilize', inputPath),
  onMediaProgress: (callback) => {
    ipcRenderer.on('media:progress', (_event, data) => callback(data));
  },

  // File picker
  selectFile: (filters) => ipcRenderer.invoke('dialog:selectFile', filters),
});
