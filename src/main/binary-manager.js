const path = require('path');
const fs = require('fs');
const { app } = require('electron');

function getBinaryDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin');
  }
  const platform = process.platform === 'win32' ? 'win'
    : process.platform === 'darwin' ? 'mac'
    : 'linux';
  return path.join(__dirname, '..', '..', 'bin', platform);
}

function getBinaryPath(name) {
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(getBinaryDir(), name + ext);
}

function getYtdlpPath() {
  return getBinaryPath('yt-dlp');
}

function getFfmpegPath() {
  return getBinaryPath('ffmpeg');
}

function checkBinaries() {
  const missing = [];
  const ytdlp = getYtdlpPath();
  const ffmpeg = getFfmpegPath();

  if (!fs.existsSync(ytdlp)) missing.push(`yt-dlp not found at: ${ytdlp}`);
  if (!fs.existsSync(ffmpeg)) missing.push(`ffmpeg not found at: ${ffmpeg}`);

  return { ok: missing.length === 0, missing };
}

module.exports = { getYtdlpPath, getFfmpegPath, checkBinaries, getBinaryDir };
