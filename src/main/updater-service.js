const https = require('https');
const fs = require('fs');
const path = require('path');
const { getYtdlpPath } = require('./binary-manager');

class YtdlpUpdater {
  constructor(ytdlpService) {
    this.ytdlpService = ytdlpService;
  }

  async checkForUpdate() {
    try {
      const current = await this.ytdlpService.getCurrentVersion();
      const latest = await this._getLatestVersion();
      return {
        updateAvailable: current !== latest,
        currentVersion: current,
        latestVersion: latest
      };
    } catch {
      return { updateAvailable: false, currentVersion: 'unknown', latestVersion: 'unknown' };
    }
  }

  _getLatestVersion() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/yt-dlp/yt-dlp/releases/latest',
        headers: { 'User-Agent': 'YT-Converter-App' }
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            resolve(release.tag_name || 'unknown');
          } catch {
            reject(new Error('Failed to parse GitHub response'));
          }
        });
      }).on('error', reject);
    });
  }

  performUpdate(onProgress) {
    return new Promise((resolve, reject) => {
      const ytdlpPath = getYtdlpPath();
      const tempPath = ytdlpPath + '.tmp';
      const downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

      onProgress({ status: 'downloading', percent: 0 });

      this._followRedirects(downloadUrl, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Download failed with status ${res.statusCode}`));
        }

        const totalSize = parseInt(res.headers['content-length'], 10) || 0;
        let downloaded = 0;
        const file = fs.createWriteStream(tempPath);

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          file.write(chunk);
          if (totalSize > 0) {
            onProgress({
              status: 'downloading',
              percent: Math.round((downloaded / totalSize) * 100)
            });
          }
        });

        res.on('end', () => {
          file.end(() => {
            try {
              // Atomic replace
              if (fs.existsSync(ytdlpPath)) {
                fs.unlinkSync(ytdlpPath);
              }
              fs.renameSync(tempPath, ytdlpPath);
              onProgress({ status: 'complete', percent: 100 });
              resolve({ success: true });
            } catch (err) {
              reject(new Error(`Failed to replace binary: ${err.message}`));
            }
          });
        });

        res.on('error', (err) => {
          file.end();
          try { fs.unlinkSync(tempPath); } catch {}
          reject(err);
        });
      });
    });
  }

  _followRedirects(url, callback, maxRedirects = 5) {
    if (maxRedirects <= 0) return callback({ statusCode: 500 });

    const mod = url.startsWith('https') ? https : require('http');
    mod.get(url, { headers: { 'User-Agent': 'YT-Converter-App' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        this._followRedirects(res.headers.location, callback, maxRedirects - 1);
      } else {
        callback(res);
      }
    }).on('error', (err) => {
      callback({ statusCode: 500, on: () => {} });
    });
  }
}

module.exports = { YtdlpUpdater };
