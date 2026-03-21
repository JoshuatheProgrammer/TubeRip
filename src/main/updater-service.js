const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getYtdlpPath, getFfmpegPath } = require('./binary-manager');

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

class FfmpegUpdater {
  async checkForUpdate() {
    try {
      const current = await this._getCurrentVersion();
      const latest = await this._getLatestVersion();
      // Compare major.minor (e.g., "7.1" vs "7.2")
      const currentShort = current.split('.').slice(0, 2).join('.');
      const latestShort = latest.split('.').slice(0, 2).join('.');
      return {
        updateAvailable: currentShort !== latestShort,
        currentVersion: current,
        latestVersion: latest
      };
    } catch {
      return { updateAvailable: false, currentVersion: 'unknown', latestVersion: 'unknown' };
    }
  }

  _getCurrentVersion() {
    return new Promise((resolve, reject) => {
      const proc = spawn(getFfmpegPath(), ['-version']);
      let stdout = '';
      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.on('close', (code) => {
        if (code !== 0) return reject(new Error('Failed to get ffmpeg version'));
        const match = stdout.match(/ffmpeg version (\S+)/);
        resolve(match ? match[1] : 'unknown');
      });
      proc.on('error', reject);
    });
  }

  _getLatestVersion() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/BtbN/FFmpeg-Builds/releases/latest',
        headers: { 'User-Agent': 'TubeRip-App' }
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            // Extract version from tag like "autobuild-2024-01-01-12-00"
            // or from asset names containing version numbers
            const tag = release.tag_name || 'unknown';
            resolve(tag);
          } catch {
            reject(new Error('Failed to parse GitHub response'));
          }
        });
      }).on('error', reject);
    });
  }

  performUpdate(onProgress) {
    return new Promise((resolve, reject) => {
      const ffmpegPath = getFfmpegPath();
      const ffmpegDir = path.dirname(ffmpegPath);
      const zipPath = path.join(ffmpegDir, 'ffmpeg-update.zip');
      const downloadUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip';

      onProgress({ status: 'downloading', percent: 0 });

      this._followRedirects(downloadUrl, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Download failed with status ${res.statusCode}`));
        }

        const totalSize = parseInt(res.headers['content-length'], 10) || 0;
        let downloaded = 0;
        const file = fs.createWriteStream(zipPath);

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
          file.end(async () => {
            try {
              onProgress({ status: 'extracting', percent: 95 });
              await this._extractFfmpeg(zipPath, ffmpegDir);
              onProgress({ status: 'complete', percent: 100 });
              resolve({ success: true });
            } catch (err) {
              reject(new Error(`Failed to extract ffmpeg: ${err.message}`));
            } finally {
              try { fs.unlinkSync(zipPath); } catch {}
            }
          });
        });

        res.on('error', (err) => {
          file.end();
          try { fs.unlinkSync(zipPath); } catch {}
          reject(err);
        });
      });
    });
  }

  _extractFfmpeg(zipPath, destDir) {
    return new Promise((resolve, reject) => {
      // Use PowerShell to extract the zip and find ffmpeg.exe
      const psScript = `
        $zip = '${zipPath.replace(/'/g, "''")}';
        $dest = '${destDir.replace(/'/g, "''")}';
        $tempDir = Join-Path $dest 'ffmpeg-temp';
        if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
        Expand-Archive -Path $zip -DestinationPath $tempDir -Force;
        $ffmpeg = Get-ChildItem -Path $tempDir -Recurse -Filter 'ffmpeg.exe' | Select-Object -First 1;
        if ($ffmpeg) {
          $destFile = Join-Path $dest 'ffmpeg.exe';
          if (Test-Path $destFile) { Remove-Item $destFile -Force }
          Copy-Item $ffmpeg.FullName $destFile -Force;
        }
        Remove-Item $tempDir -Recurse -Force;
        if ($ffmpeg) { Write-Output 'OK' } else { Write-Output 'NOTFOUND' }
      `;

      const proc = spawn('powershell', ['-NoProfile', '-Command', psScript]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.stderr.on('data', (chunk) => { stderr += chunk; });

      proc.on('close', (code) => {
        if (stdout.trim().includes('OK')) {
          resolve();
        } else {
          reject(new Error(stderr || 'ffmpeg.exe not found in archive'));
        }
      });
      proc.on('error', reject);
    });
  }

  _followRedirects(url, callback, maxRedirects = 5) {
    if (maxRedirects <= 0) return callback({ statusCode: 500 });

    const mod = url.startsWith('https') ? https : require('http');
    mod.get(url, { headers: { 'User-Agent': 'TubeRip-App' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        this._followRedirects(res.headers.location, callback, maxRedirects - 1);
      } else {
        callback(res);
      }
    }).on('error', () => {
      callback({ statusCode: 500, on: () => {} });
    });
  }
}

module.exports = { YtdlpUpdater, FfmpegUpdater };
