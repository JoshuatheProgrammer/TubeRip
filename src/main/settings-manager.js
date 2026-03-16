const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULTS = {
  maxConcurrent: 2,
  speedLimit: null,
  theme: 'dark',
  soundEffect: 'chime',
  filenameTemplate: '{title}',
  animatedBg: true,
  proxy: '',
  smartRename: false,
  duplicateDetect: true,
  downloadResume: true,
  autoCompress: false,
  compressCrf: 28,
  language: 'en',
  presets: [],
  stats: {
    totalDownloads: 0,
    totalSize: 0,
    formatCounts: {},
    channelCounts: {},
    firstDownload: null,
    lastDownload: null
  }
};

let settings = null;
let settingsPath = null;

function getSettingsPath() {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }
  return settingsPath;
}

function loadSettings() {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8');
    settings = { ...DEFAULTS, ...JSON.parse(data) };
  } catch {
    settings = { ...DEFAULTS };
  }
  return settings;
}

function saveSettings() {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
  } catch {
    // ignore write errors
  }
}

function getSetting(key) {
  if (!settings) loadSettings();
  return settings[key];
}

function setSetting(key, value) {
  if (!settings) loadSettings();
  settings[key] = value;
  saveSettings();
}

module.exports = { loadSettings, saveSettings, getSetting, setSetting };
