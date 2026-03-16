const { v4: uuidv4 } = require('crypto');

class DownloadManager {
  constructor(ytdlpService, mainWindow) {
    this.ytdlpService = ytdlpService;
    this.mainWindow = mainWindow;
    this.downloads = new Map();
    this.maxConcurrent = 2;
    this.speedLimit = null;
  }

  setWindow(win) {
    this.mainWindow = win;
  }

  setSpeedLimit(limit) {
    this.speedLimit = limit || null;
  }

  setMaxConcurrent(n) {
    this.maxConcurrent = Math.max(1, Math.min(5, n));
    this._processQueue();
  }

  hasActiveDownloads() {
    return Array.from(this.downloads.values()).some(d => d.status === 'downloading');
  }

  add({ url, title, format, quality, outputPath, filenameTemplate, subtitleLang, subtitleFormat, embedMetadata, thumbnailUrl, proxy, resume, videoCodec, audioCodec }) {
    const id = this._generateId();
    const entry = {
      id, url, title, format, quality, outputPath, filenameTemplate,
      subtitleLang, subtitleFormat, embedMetadata, thumbnailUrl,
      proxy, resume, videoCodec, audioCodec,
      status: 'pending',
      progress: { percent: 0, speed: '-', eta: '-', size: '-' },
      proc: null
    };

    this.downloads.set(id, entry);
    this._processQueue();
    return id;
  }

  cancel(id) {
    const entry = this.downloads.get(id);
    if (!entry) return;

    if (entry.proc) {
      try {
        entry.proc.kill('SIGTERM');
      } catch (e) {
        // Process may have already exited
      }
    }

    entry.status = 'cancelled';
    this._send('download:progress', {
      id, status: 'cancelled', percent: entry.progress.percent
    });
    this._processQueue();
  }

  retry(id) {
    const entry = this.downloads.get(id);
    if (!entry) return;
    if (entry.status !== 'error' && entry.status !== 'cancelled') return;

    entry.status = 'pending';
    entry.progress = { percent: 0, speed: '-', eta: '-', size: '-' };
    entry.proc = null;

    this._send('download:progress', {
      id, status: 'pending', percent: 0
    });

    this._processQueue();
  }

  reorder(draggedId, beforeId) {
    const entries = Array.from(this.downloads.entries());
    const draggedIndex = entries.findIndex(([id]) => id === draggedId);
    if (draggedIndex === -1) return;

    const [draggedEntry] = entries.splice(draggedIndex, 1);
    const beforeIndex = entries.findIndex(([id]) => id === beforeId);

    if (beforeIndex === -1) {
      entries.push(draggedEntry);
    } else {
      entries.splice(beforeIndex, 0, draggedEntry);
    }

    this.downloads = new Map(entries);
  }

  getAll() {
    return Array.from(this.downloads.values()).map(d => ({
      id: d.id,
      title: d.title,
      format: d.format,
      quality: d.quality,
      status: d.status,
      progress: d.progress
    }));
  }

  _processQueue() {
    const active = Array.from(this.downloads.values())
      .filter(d => d.status === 'downloading').length;

    if (active >= this.maxConcurrent) return;

    const pending = Array.from(this.downloads.values())
      .find(d => d.status === 'pending');

    if (!pending) return;

    this._startDownload(pending);
  }

  async _startDownload(entry) {
    entry.status = 'downloading';
    const formatArgs = this.ytdlpService.getFormatArgs(entry.format, entry.quality);

    const onProgress = (progress) => {
      entry.progress = { ...entry.progress, ...progress };
      this._send('download:progress', {
        id: entry.id,
        status: progress.status || 'downloading',
        ...progress
      });
    };

    try {
      const { proc, promise } = this.ytdlpService.download(
        entry.url, formatArgs, entry.outputPath, onProgress, this.speedLimit, entry.filenameTemplate,
        { subtitleLang: entry.subtitleLang, subtitleFormat: entry.subtitleFormat, embedMetadata: entry.embedMetadata, proxy: entry.proxy, resume: entry.resume, videoCodec: entry.videoCodec, audioCodec: entry.audioCodec }
      );
      entry.proc = proc;

      await promise;
      entry.status = 'complete';
      this._send('download:complete', { id: entry.id, title: entry.title });
    } catch (err) {
      if (entry.status !== 'cancelled') {
        entry.status = 'error';
        this._send('download:error', { id: entry.id, error: err.message });
      }
    }

    this._processQueue();
  }

  _send(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}

module.exports = { DownloadManager };
