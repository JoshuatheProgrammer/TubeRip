// State
const state = {
  videoInfo: null,
  playlistInfo: null,
  selectedPlaylistVideos: new Set(),
  format: 'mp4',
  quality: 'best',
  outputPath: '',
  fetching: false,
  downloads: new Map(),
  history: [],
  searchMode: false,
  searchQuery: '',
  searchResults: [],
  searchCount: 5,
  audioPreviewEl: null,
  audioPreviewPlaying: false,
  activeTab: 'active',
  soundEffect: 'chime',
  filenameTemplate: '{title}',
  animatedBgEnabled: true,
  animatedBgFrame: null,
  subtitleLang: '',
  subtitleFormat: 'srt',
  embedMetadata: true,
  proxy: '',
  smartRename: false,
  duplicateDetect: true,
  downloadResume: true,
  autoCompress: false,
  videoCodec: '',
  audioCodec: '',
  bandwidthHistory: [],
  activeTool: null,
  presets: []
};

// DOM refs
const $ = (sel) => document.querySelector(sel);
const urlInput = $('#urlInput');
const fetchBtn = $('#fetchBtn');
const urlError = $('#urlError');
const skeletonSection = $('#skeletonSection');
const previewSection = $('#previewSection');
const optionsSection = $('#optionsSection');
const thumbnail = $('#thumbnail');
const videoTitle = $('#videoTitle');
const videoChannel = $('#videoChannel');
const videoViews = $('#videoViews');
const duration = $('#duration');
const formatSelect = $('#formatSelect');
const qualitySelect = $('#qualitySelect');
const outputPath = $('#outputPath');
const browseBtn = $('#browseBtn');
const downloadBtn = $('#downloadBtn');
const downloadsSection = $('#downloadsSection');
const queueActive = $('#queueActive');
const queuePending = $('#queuePending');
const queueCompleted = $('#queueCompleted');
const activeCount = $('#activeCount');
const pendingCount = $('#pendingCount');
const completedCount = $('#completedCount');
const historySection = $('#historySection');
const historyList = $('#historyList');
const clearHistoryBtn = $('#clearHistoryBtn');
const closeBtn = $('#closeBtn');
const subtitleSelect = $('#subtitleSelect');
const subtitleFormatSelect = $('#subtitleFormat');
const speedLimitSelect = $('#speedLimitSelect');
const soundSelect = $('#soundSelect');
const previewSoundBtn = $('#previewSoundBtn');
const filenameTemplateInput = $('#filenameTemplate');
const filenamePreview = $('#filenamePreview');
const dropOverlay = $('#dropOverlay');
const playlistSection = $('#playlistSection');
const playlistTitle = $('#playlistTitle');
const playlistCount = $('#playlistCount');
const playlistDuration = $('#playlistDuration');
const playlistVideos = $('#playlistVideos');
const selectAllBtn = $('#selectAllBtn');
const deselectAllBtn = $('#deselectAllBtn');
const modeUrl = $('#modeUrl');
const modeSearch = $('#modeSearch');
const searchResultsSection = $('#searchResultsSection');
const searchResults = $('#searchResults');
const loadMoreBtn = $('#loadMoreBtn');
const audioPreviewBtn = $('#audioPreviewBtn');
const audioPreviewIcon = $('#audioPreviewIcon');
const audioPreviewProgress = $('#audioPreviewProgress');
const audioPreviewBar = $('#audioPreviewBar');
const updateNotification = $('#updateNotification');
const updateMessage = $('#updateMessage');
const updateBtn = $('#updateBtn');
const dismissUpdateBtn = $('#dismissUpdateBtn');
const urlClearBtn = $('#urlClearBtn');
const settingsToggleBtn = $('#settingsToggleBtn');
const settingsPanel = $('#settingsPanel');
const settingsCloseBtn = $('#settingsCloseBtn');
const langSelect = $('#langSelect');
const proxyInput = $('#proxyInput');
const smartRenameToggle = $('#smartRenameToggle');
const duplicateDetectToggle = $('#duplicateDetectToggle');
const downloadResumeToggle = $('#downloadResumeToggle');
const autoCompressToggle = $('#autoCompressToggle');
const videoCodecSelect = $('#videoCodecSelect');
const audioCodecSelect = $('#audioCodecSelect');
const saveThumbnailBtn = $('#saveThumbnailBtn');
const fileSizeEstimate = $('#fileSizeEstimate');
const presetsSection = $('#presetsSection');
const customPresetsEl = $('#customPresets');
const bandwidthMonitor = $('#bandwidthMonitor');
const bandwidthCanvas = $('#bandwidthCanvas');
const bandwidthLabel = $('#bandwidthLabel');
const toolsToggleBtn = $('#toolsToggleBtn');
const toolsBody = $('#toolsBody');
const toolOptions = $('#toolOptions');
const toolOptionsContent = $('#toolOptionsContent');
const toolProgress = $('#toolProgress');
const toolProgressBar = $('#toolProgressBar');
const toolProgressLabel = $('#toolProgressLabel');

// Quality options
const videoQualities = [
  { value: 'best', label: 'Best Quality' },
  { value: '2160', label: '2160p (4K)' },
  { value: '1440', label: '1440p (2K)' },
  { value: '1080', label: '1080p (Full HD)' },
  { value: '720', label: '720p (HD)' },
  { value: '480', label: '480p (SD)' },
  { value: '360', label: '360p (Low)' }
];

const audioQualities = [
  { value: 'best', label: 'Best (320 kbps)' },
  { value: 'high', label: 'High (256 kbps)' },
  { value: 'standard', label: 'Standard (192 kbps)' },
  { value: 'medium', label: 'Medium (128 kbps)' },
  { value: 'low', label: 'Low (96 kbps)' }
];

const losslessQualities = [
  { value: 'best', label: 'Best (Lossless)' }
];

const videoFormats = ['mp4', 'webm', 'avi'];
const audioFormats = ['mp3', 'wav', 'flac', 'aac'];

// ===== Sound Effects Pack =====
const SOUND_PRESETS = {
  chime: (ctx) => {
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });
  },
  success: (ctx) => {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  },
  bell: (ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);
  },
  pulse: (ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  },
  ripple: (ctx) => {
    const now = ctx.currentTime;
    [783.99, 659.25, 523.25, 392].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  },
  none: () => {}
};

function playNotificationSound() {
  const preset = SOUND_PRESETS[state.soundEffect];
  if (!preset || state.soundEffect === 'none') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    preset(ctx);
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    // Audio not available
  }
}

function previewSound(name) {
  const preset = SOUND_PRESETS[name];
  if (!preset || name === 'none') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    preset(ctx);
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {}
}

// ===== Filename Templates =====
const FILENAME_TOKEN_MAP = {
  '{title}': '%(title)s',
  '{channel}': '%(uploader)s',
  '{date}': '%(upload_date>%Y-%m-%d)s',
  '{id}': '%(id)s',
  '{resolution}': '%(resolution)s'
};

function templateToYtdlp(template) {
  let result = template;
  for (const [token, ytdlpVar] of Object.entries(FILENAME_TOKEN_MAP)) {
    result = result.replaceAll(token, ytdlpVar);
  }
  return result + '.%(ext)s';
}

function updateFilenamePreview() {
  let preview = state.filenameTemplate || '{title}';
  const info = state.videoInfo;
  preview = preview
    .replace(/\{title\}/g, info?.title || 'My Video Title')
    .replace(/\{channel\}/g, info?.uploader || 'Channel Name')
    .replace(/\{date\}/g, '2024-01-15')
    .replace(/\{id\}/g, info?.id || 'dQw4w9WgXcQ')
    .replace(/\{resolution\}/g, state.quality === 'best' ? '1080p' : state.quality + 'p');
  filenamePreview.textContent = preview + '.' + state.format;
}

// ===== Theme =====
function initTheme() {
  document.documentElement.setAttribute('data-theme', 'dark');
}

// ===== Settings Panel =====
function toggleSettings() {
  settingsPanel.classList.toggle('hidden');
}

// ===== Toggle Button Helper =====
function setupToggle(btn, stateKey, settingKey) {
  btn.addEventListener('click', () => {
    const enabled = btn.getAttribute('data-enabled') === 'true';
    const newVal = !enabled;
    btn.setAttribute('data-enabled', String(newVal));
    btn.textContent = newVal ? t('on') : t('off');
    state[stateKey] = newVal;
    window.api.setSetting(settingKey, newVal);
  });
}

// ===== File Size Estimate =====
async function updateFileSizeEstimate() {
  const el = $('#fileSizeEstimate');
  if (!el || !state.videoInfo) { if (el) el.textContent = ''; return; }
  const url = urlInput.value.trim();
  if (!url) return;
  el.textContent = '...';
  const size = await window.api.getFileSizeEstimate(url, state.format, state.quality);
  if (size) el.textContent = size;
  else el.textContent = '';
}

// ===== Duplicate Detector =====
function checkDuplicate(title) {
  if (!state.duplicateDetect) return false;
  return state.history.some(h => h.title === title);
}

function showDuplicateWarning() {
  // Remove existing warning
  const existing = document.querySelector('.duplicate-warning');
  if (existing) existing.remove();

  const warn = document.createElement('div');
  warn.className = 'duplicate-warning';
  warn.innerHTML = '&#9888; This video was previously downloaded. Download again?';
  optionsSection.querySelector('.options-grid').after(warn);
}

function hideDuplicateWarning() {
  const existing = document.querySelector('.duplicate-warning');
  if (existing) existing.remove();
}

// ===== Bandwidth Monitor =====
function updateBandwidth(speedStr) {
  if (!speedStr || speedStr === '-') return;

  // Parse speed string like "5.23MiB/s"
  let bytesPerSec = 0;
  const match = speedStr.match(/([\d.]+)\s*(KiB|MiB|GiB|B)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'gib') bytesPerSec = val * 1073741824;
    else if (unit === 'mib') bytesPerSec = val * 1048576;
    else if (unit === 'kib') bytesPerSec = val * 1024;
    else bytesPerSec = val;
  }

  state.bandwidthHistory.push(bytesPerSec);
  if (state.bandwidthHistory.length > 60) state.bandwidthHistory.shift();

  bandwidthMonitor.classList.remove('hidden');
  bandwidthLabel.textContent = speedStr;
  drawBandwidthGraph();
}

function drawBandwidthGraph() {
  if (!bandwidthCanvas) return;
  const ctx = bandwidthCanvas.getContext('2d');
  const w = bandwidthCanvas.width;
  const h = bandwidthCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const data = state.bandwidthHistory;
  if (data.length < 2) return;

  const max = Math.max(...data) || 1;
  const step = w / (60 - 1);

  ctx.beginPath();
  ctx.strokeStyle = '#00FFC8';
  ctx.lineWidth = 1.5;

  for (let i = 0; i < data.length; i++) {
    const x = i * step;
    const y = h - (data[i] / max) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fill under the line
  ctx.lineTo((data.length - 1) * step, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 255, 200, 0.08)';
  ctx.fill();
}

// ===== Download Presets =====
function applyPreset(format, quality) {
  formatSelect.value = format;
  state.format = format;
  updateQualityOptions();
  // Set quality after options are updated
  setTimeout(() => {
    qualitySelect.value = quality;
    state.quality = quality;
    updateFilenamePreview();
    updateFileSizeEstimate();
  }, 0);
}

function renderCustomPresets() {
  if (!customPresetsEl) return;
  customPresetsEl.innerHTML = state.presets.map((p, i) => `
    <button class="preset-btn" data-custom-preset="${i}" title="${p.format.toUpperCase()} / ${p.quality}">${escapeHtml(p.name)}</button>
  `).join('');
}

// ===== Media Tools =====
function selectTool(toolName) {
  state.activeTool = toolName;
  document.querySelectorAll('.tool-card').forEach(c => c.classList.toggle('active', c.getAttribute('data-tool') === toolName));
  toolOptions.classList.remove('hidden');
  toolProgress.classList.add('hidden');

  const html = getToolOptionsHtml(toolName);
  toolOptionsContent.innerHTML = html;
}

function getToolOptionsHtml(tool) {
  const selectFileBtn = '<button class="btn btn-secondary btn-sm" id="toolSelectFile">' + t('selectFile') + '</button>';
  const fileInput = '<input type="text" id="toolFilePath" class="folder-input settings-input" readonly placeholder="No file selected">';
  const fileRow = '<div class="tool-options-row">' + fileInput + selectFileBtn + '</div>';

  switch (tool) {
    case 'convert':
      return fileRow + `
        <div class="tool-options-row">
          <label class="option-label">${t('format')}</label>
          <select id="toolFormat" class="select select-sm">
            <option value="mp4">MP4</option><option value="webm">WEBM</option><option value="avi">AVI</option>
            <option value="mp3">MP3</option><option value="wav">WAV</option><option value="flac">FLAC</option><option value="aac">AAC</option>
          </select>
          <button class="btn btn-accent btn-sm" id="toolRunBtn">${t('convert')}</button>
        </div>`;
    case 'compress':
      return fileRow + `
        <div class="tool-options-row">
          <label class="option-label">CRF (18-36)</label>
          <input type="number" id="toolCrf" class="folder-input" style="width:70px" value="28" min="18" max="36">
          <button class="btn btn-accent btn-sm" id="toolRunBtn">${t('compress')}</button>
        </div>`;
    case 'stabilize':
      return fileRow + `
        <div class="tool-options-row">
          <button class="btn btn-accent btn-sm" id="toolRunBtn">${t('stabilize')}</button>
        </div>`;
    case 'audioBoost':
      return fileRow + `
        <div class="tool-options-row">
          <label class="option-label">Volume (dB)</label>
          <input type="number" id="toolVolume" class="folder-input" style="width:70px" value="6" min="-20" max="20">
          <button class="btn btn-accent btn-sm" id="toolRunBtn">${t('audioBoost')}</button>
        </div>`;
    case 'aspectRatio':
      return fileRow + `
        <div class="tool-options-row">
          <label class="option-label">${t('aspectRatio')}</label>
          <select id="toolRatio" class="select select-sm">
            <option value="16:9">16:9</option><option value="4:3">4:3</option>
            <option value="1:1">1:1</option><option value="9:16">9:16 (Vertical)</option>
          </select>
          <button class="btn btn-accent btn-sm" id="toolRunBtn">${t('aspectRatio')}</button>
        </div>`;
    default:
      return '';
  }
}

async function runTool() {
  const filePath = $('#toolFilePath')?.value;
  if (!filePath) { showToast('Please select a file first', 'error'); return; }

  toolProgress.classList.remove('hidden');
  toolProgressBar.style.width = '0%';
  toolProgressLabel.textContent = t('processing');

  try {
    let result;
    switch (state.activeTool) {
      case 'convert':
        result = await window.api.convertMedia(filePath, $('#toolFormat').value);
        break;
      case 'compress':
        result = await window.api.compressMedia(filePath, parseInt($('#toolCrf').value) || 28);
        break;
      case 'stabilize':
        result = await window.api.stabilizeVideo(filePath);
        break;
      case 'audioBoost':
        result = await window.api.audioBoost(filePath, parseInt($('#toolVolume').value) || 6);
        break;
      case 'aspectRatio':
        result = await window.api.changeAspectRatio(filePath, $('#toolRatio').value);
        break;
    }
    toolProgressBar.style.width = '100%';
    toolProgressBar.classList.add('complete');
    toolProgressLabel.textContent = t('complete') + '!';
    showToast(`Saved: ${result.split(/[\\/]/).pop()}`, 'success');
  } catch (err) {
    toolProgressBar.classList.add('error');
    toolProgressLabel.textContent = err.message;
    showToast(err.message, 'error');
  }
}

// ===== i18n Apply =====
function applyLanguage(lang) {
  setLanguage(lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (el.tagName === 'INPUT') el.placeholder = translated;
    else el.textContent = translated;
  });
  // Re-set queue tab text (they have child spans)
  document.querySelectorAll('.queue-tab').forEach(tab => {
    const tabName = tab.getAttribute('data-tab');
    const count = tab.querySelector('.tab-count');
    const countText = count ? count.outerHTML : '';
    tab.innerHTML = t(tabName) + ' ' + countText;
  });
}

// ===== Pulse Glow Button Click =====
function setupPulseGlow() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .btn-sm, .mode-btn, .queue-tab, .token-btn');
    if (!btn) return;
    btn.classList.remove('pulse-glow');
    void btn.offsetWidth; // force reflow
    btn.classList.add('pulse-glow');
    btn.addEventListener('animationend', () => btn.classList.remove('pulse-glow'), { once: true });
  });
}

// ===== Parallax Scroll =====
let parallaxScrollY = 0;
function setupParallaxScroll() {
  window.addEventListener('scroll', () => {
    parallaxScrollY = window.scrollY;
  });
}

// ===== Animated Background =====
const bgCanvas = document.getElementById('bgCanvas');
let bgParticles = [];

function initAnimatedBackground() {
  if (!bgCanvas) return;
  const ctx = bgCanvas.getContext('2d');

  function resize() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create particles
  bgParticles = [];
  for (let i = 0; i < 25; i++) {
    bgParticles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      radius: 2 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    });
  }

  function getParticleColor() {
    const theme = document.documentElement.getAttribute('data-theme');
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim();
    // Parse accent hex to rgb
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);
    const alpha = theme === 'dark' ? 0.25 : 0.15;
    return { r, g, b, alpha };
  }

  function draw() {
    if (!state.animatedBgEnabled) return;

    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    const color = getParticleColor();

    // Parallax: each particle shifts based on its depth (radius)
    const getParallaxY = (p) => p.y - parallaxScrollY * (p.radius / 5) * 0.15;

    // Draw connecting lines
    for (let i = 0; i < bgParticles.length; i++) {
      const py1 = getParallaxY(bgParticles[i]);
      for (let j = i + 1; j < bgParticles.length; j++) {
        const py2 = getParallaxY(bgParticles[j]);
        const dx = bgParticles[i].x - bgParticles[j].x;
        const dy = py1 - py2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const lineAlpha = (1 - dist / 120) * color.alpha * 0.5;
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(bgParticles[i].x, py1);
          ctx.lineTo(bgParticles[j].x, py2);
          ctx.stroke();
        }
      }
    }

    // Draw and update particles
    for (const p of bgParticles) {
      const py = getParallaxY(p);
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, py, p.radius, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = bgCanvas.width;
      if (p.x > bgCanvas.width) p.x = 0;
      if (p.y < 0) p.y = bgCanvas.height;
      if (p.y > bgCanvas.height) p.y = 0;
    }

    state.animatedBgFrame = requestAnimationFrame(draw);
  }

  if (state.animatedBgEnabled) {
    bgCanvas.classList.remove('disabled');
    state.animatedBgFrame = requestAnimationFrame(draw);
  } else {
    bgCanvas.classList.add('disabled');
  }
}

function toggleAnimatedBackground(enabled) {
  state.animatedBgEnabled = enabled;
  window.api.setSetting('animatedBg', enabled);
  if (enabled) {
    bgCanvas.classList.remove('disabled');
    initAnimatedBackground();
  } else {
    if (state.animatedBgFrame) {
      cancelAnimationFrame(state.animatedBgFrame);
      state.animatedBgFrame = null;
    }
    bgCanvas.classList.add('disabled');
  }
}

// ===== History =====
async function loadHistory() {
  state.history = await window.api.loadHistory();
  renderHistory();
}

async function saveHistory() {
  await window.api.saveHistory(state.history);
}

function addToHistory(title, format, quality, url, outputPath) {
  state.history.unshift({
    title,
    format,
    quality,
    url: url || '',
    outputPath: outputPath || '',
    date: new Date().toISOString()
  });
  if (state.history.length > 50) state.history = state.history.slice(0, 50);
  saveHistory();
  renderHistory();
}

function clearHistory() {
  state.history = [];
  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    historySection.classList.add('hidden');
    return;
  }

  historySection.classList.remove('hidden');
  historyList.innerHTML = state.history.map((item, i) => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-item-title">${escapeHtml(item.title)}</div>
          <div class="history-item-meta">${dateStr}</div>
        </div>
        <div class="history-item-actions">
          ${item.url ? `<button class="btn-sm btn-open" data-action="redownload" data-index="${i}" title="Re-download">&#8635;</button>` : ''}
          ${item.outputPath ? `<button class="btn-sm btn-open" data-action="open-folder" data-path="${escapeHtml(item.outputPath)}" title="Open folder">&#128194;</button>` : ''}
        </div>
        <span class="history-item-format">${item.format}</span>
      </div>
    `;
  }).join('');
}

// ===== Context Menu =====
function setupContextMenu() {
  urlInput.addEventListener('contextmenu', async (e) => {
    e.preventDefault();

    const hasSelection = urlInput.selectionStart !== urlInput.selectionEnd;
    let hasClipboard = false;
    try {
      hasClipboard = !!window.api.readClipboard();
    } catch (err) {
      // Clipboard not accessible
    }

    const action = await window.api.showContextMenu({ hasSelection, hasClipboard });

    if (action === 'cut') {
      const selected = urlInput.value.substring(urlInput.selectionStart, urlInput.selectionEnd);
      window.api.writeClipboard(selected);
      const start = urlInput.selectionStart;
      urlInput.value = urlInput.value.substring(0, start) + urlInput.value.substring(urlInput.selectionEnd);
      urlInput.setSelectionRange(start, start);
    } else if (action === 'copy') {
      const selected = urlInput.value.substring(urlInput.selectionStart, urlInput.selectionEnd);
      window.api.writeClipboard(selected);
    } else if (action === 'paste') {
      const text = window.api.readClipboard();
      if (text) {
        const start = urlInput.selectionStart;
        const end = urlInput.selectionEnd;
        urlInput.value = urlInput.value.substring(0, start) + text + urlInput.value.substring(end);
        urlInput.setSelectionRange(start + text.length, start + text.length);
        setTimeout(() => fetchVideoInfo(), 100);
      }
    } else if (action === 'selectAll') {
      urlInput.select();
    }
  });
}

// ===== Drag & Drop =====
function setupDragDrop() {
  let dragCounter = 0;

  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropOverlay.classList.remove('hidden');
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropOverlay.classList.add('hidden');
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.add('hidden');

    const text = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '';
    const url = text.trim().split('\n')[0].trim();

    if (url && isValidUrl(url)) {
      // Switch to URL mode if in search mode
      if (state.searchMode) {
        toggleSearchMode(false);
      }
      urlInput.value = url;
      fetchVideoInfo();
    }
  });
}

// ===== Search Mode =====
function toggleSearchMode(enable) {
  state.searchMode = enable;
  if (enable) {
    modeSearch.classList.add('active');
    modeUrl.classList.remove('active');
    urlInput.placeholder = 'Search YouTube...';
    fetchBtn.querySelector('.btn-text').textContent = 'Search';
    // Hide video/playlist sections
    previewSection.classList.add('hidden');
    optionsSection.classList.add('hidden');
    playlistSection.classList.add('hidden');
    stopAudioPreview();
  } else {
    modeUrl.classList.add('active');
    modeSearch.classList.remove('active');
    urlInput.placeholder = 'Paste YouTube URL here...';
    fetchBtn.querySelector('.btn-text').textContent = 'Fetch';
    searchResultsSection.classList.add('hidden');
  }
}

async function performSearch() {
  const query = urlInput.value.trim();
  if (!query) {
    showError('Please enter a search term');
    return;
  }

  if (state.fetching) return;

  hideError();
  setFetching(true);
  state.searchQuery = query;
  state.searchCount = 5;

  try {
    state.searchResults = await window.api.searchYouTube(query, state.searchCount);
    renderSearchResults();
  } catch (err) {
    showError(err.message || 'Search failed');
  } finally {
    setFetching(false);
  }
}

async function loadMoreResults() {
  if (state.fetching) return;
  setFetching(true);
  state.searchCount += 5;

  try {
    state.searchResults = await window.api.searchYouTube(state.searchQuery, state.searchCount);
    renderSearchResults();
  } catch (err) {
    showError(err.message || 'Failed to load more results');
    state.searchCount -= 5;
  } finally {
    setFetching(false);
  }
}

function renderSearchResults() {
  if (state.searchResults.length === 0) {
    searchResultsSection.classList.add('hidden');
    showError('No results found');
    return;
  }

  searchResultsSection.classList.remove('hidden');
  searchResults.innerHTML = state.searchResults.map((item, i) => `
    <div class="search-result-item" data-search-index="${i}">
      <img class="search-result-thumb" src="${escapeHtml(item.thumbnail)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2268%22><rect fill=%22%23232344%22 width=%22120%22 height=%2268%22/></svg>'">
      <div class="search-result-info">
        <div class="search-result-title">${escapeHtml(item.title)}</div>
        <div class="search-result-meta">${escapeHtml(item.uploader)} &bull; ${item.durationFormatted || ''} &bull; ${formatViews(item.viewCount)}</div>
      </div>
    </div>
  `).join('');

  // Show Load More button if we got a full page of results
  if (state.searchResults.length >= state.searchCount) {
    loadMoreBtn.classList.remove('hidden');
  } else {
    loadMoreBtn.classList.add('hidden');
  }
}

// ===== Audio Preview =====
function stopAudioPreview() {
  if (state.audioPreviewEl) {
    state.audioPreviewEl.pause();
    state.audioPreviewEl.src = '';
    state.audioPreviewEl = null;
  }
  state.audioPreviewPlaying = false;
  audioPreviewIcon.innerHTML = '<polygon points="8,5 19,12 8,19" fill="white"/>';
  audioPreviewProgress.classList.add('hidden');
  audioPreviewBar.style.width = '0%';
}

async function toggleAudioPreview() {
  if (state.audioPreviewPlaying) {
    stopAudioPreview();
    return;
  }

  const url = urlInput.value.trim();
  if (!url) return;

  // Show loading state
  audioPreviewIcon.innerHTML = '<circle cx="12" cy="12" r="3" fill="white"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle>';

  try {
    const audioUrl = await window.api.getAudioPreviewUrl(url);
    const audio = new Audio(audioUrl);
    state.audioPreviewEl = audio;
    state.audioPreviewPlaying = true;

    // Pause icon
    audioPreviewIcon.innerHTML = '<rect x="7" y="5" width="3" height="14" rx="1" fill="white"/><rect x="14" y="5" width="3" height="14" rx="1" fill="white"/>';
    audioPreviewProgress.classList.remove('hidden');

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        audioPreviewBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
      }
    });

    audio.addEventListener('ended', () => {
      stopAudioPreview();
    });

    audio.addEventListener('error', () => {
      stopAudioPreview();
      showToast('Audio preview failed', 'error');
    });

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (state.audioPreviewPlaying && state.audioPreviewEl === audio) {
        stopAudioPreview();
      }
    }, 30000);

    await audio.play();
  } catch (err) {
    stopAudioPreview();
    showToast('Could not load audio preview', 'error');
  }
}

// ===== Playlist =====
function isPlaylistUrl(url) {
  return /[?&]list=/.test(url) || /youtube\.com\/playlist\?/.test(url);
}

async function fetchPlaylistInfo() {
  const url = urlInput.value.trim();
  hideError();
  setFetching(true);

  skeletonSection.classList.remove('hidden');
  previewSection.classList.add('hidden');
  playlistSection.classList.add('hidden');
  optionsSection.classList.add('hidden');

  try {
    state.playlistInfo = await window.api.getPlaylistInfo(url);
    skeletonSection.classList.add('hidden');
    showPlaylistPreview(state.playlistInfo);
  } catch (err) {
    skeletonSection.classList.add('hidden');
    showError(err.message || 'Failed to fetch playlist info');
  } finally {
    setFetching(false);
  }
}

function showPlaylistPreview(info) {
  playlistTitle.textContent = info.title;
  playlistCount.textContent = `${info.count} videos`;
  playlistDuration.textContent = info.totalDurationFormatted;

  // Select all by default
  state.selectedPlaylistVideos = new Set(info.videos.map((_, i) => i));

  playlistVideos.innerHTML = info.videos.map((video, i) => `
    <div class="playlist-video-item">
      <input type="checkbox" class="playlist-checkbox" data-index="${i}" checked>
      <img class="playlist-thumb" src="${escapeHtml(video.thumbnail)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2245%22><rect fill=%22%23232344%22 width=%2280%22 height=%2245%22/></svg>'">
      <div class="playlist-video-info">
        <span class="playlist-video-title">${escapeHtml(video.title)}</span>
        <span class="playlist-video-duration">${video.durationFormatted || ''}</span>
      </div>
    </div>
  `).join('');

  playlistSection.classList.remove('hidden');
  optionsSection.classList.remove('hidden');
  updateDownloadBtnText();
  updateQualityOptions();
}

function updateDownloadBtnText() {
  if (state.playlistInfo) {
    const count = state.selectedPlaylistVideos.size;
    downloadBtn.textContent = `Download All (${count} selected)`;
  } else {
    downloadBtn.textContent = 'Download';
  }
}

// ===== Updater =====
async function checkForUpdates() {
  try {
    const result = await window.api.checkForUpdate();
    if (result.updateAvailable) {
      // Auto-update yt-dlp silently on startup
      updateMessage.textContent = `Updating yt-dlp: ${result.currentVersion} → ${result.latestVersion}`;
      updateNotification.classList.remove('hidden');
      updateBtn.classList.add('hidden');
      await performUpdate(true);
    }
  } catch {
    // Silently fail
  }
}

async function performUpdate(auto = false) {
  updateBtn.disabled = true;
  updateBtn.textContent = 'Updating...';

  try {
    await window.api.performUpdate();
    updateMessage.textContent = 'yt-dlp updated successfully!';
    updateBtn.classList.add('hidden');
    showToast('yt-dlp updated successfully!', 'success');
    setTimeout(() => updateNotification.classList.add('hidden'), 3000);
  } catch (err) {
    updateMessage.textContent = `Auto-update failed: ${err.message}`;
    updateBtn.disabled = false;
    updateBtn.textContent = 'Retry';
    updateBtn.classList.remove('hidden');
  }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  state.outputPath = await window.api.getDownloadsPath();
  outputPath.value = state.outputPath;

  // Load saved settings
  const savedSpeedLimit = await window.api.getSpeedLimit();
  if (savedSpeedLimit) speedLimitSelect.value = savedSpeedLimit;

  // Load sound effect setting
  const savedSound = await window.api.getSetting('soundEffect');
  if (savedSound) {
    state.soundEffect = savedSound;
    soundSelect.value = savedSound;
  }

  // Load filename template setting
  const savedTemplate = await window.api.getSetting('filenameTemplate');
  if (savedTemplate) {
    state.filenameTemplate = savedTemplate;
    filenameTemplateInput.value = savedTemplate;
  }
  updateFilenamePreview();

  // Load animated background setting
  const savedAnimatedBg = await window.api.getSetting('animatedBg');
  state.animatedBgEnabled = savedAnimatedBg !== false;
  initAnimatedBackground();

  // Load new settings
  const savedProxy = await window.api.getSetting('proxy');
  if (savedProxy) { state.proxy = savedProxy; proxyInput.value = savedProxy; }

  const savedSmartRename = await window.api.getSetting('smartRename');
  state.smartRename = savedSmartRename === true;
  smartRenameToggle.setAttribute('data-enabled', String(state.smartRename));
  smartRenameToggle.textContent = state.smartRename ? 'On' : 'Off';

  const savedDupDetect = await window.api.getSetting('duplicateDetect');
  state.duplicateDetect = savedDupDetect !== false;
  duplicateDetectToggle.setAttribute('data-enabled', String(state.duplicateDetect));
  duplicateDetectToggle.textContent = state.duplicateDetect ? 'On' : 'Off';

  const savedResume = await window.api.getSetting('downloadResume');
  state.downloadResume = savedResume !== false;
  downloadResumeToggle.setAttribute('data-enabled', String(state.downloadResume));
  downloadResumeToggle.textContent = state.downloadResume ? 'On' : 'Off';

  const savedAutoCompress = await window.api.getSetting('autoCompress');
  state.autoCompress = savedAutoCompress === true;
  autoCompressToggle.setAttribute('data-enabled', String(state.autoCompress));
  autoCompressToggle.textContent = state.autoCompress ? 'On' : 'Off';

  const savedVideoCodec = await window.api.getSetting('videoCodec');
  if (savedVideoCodec) { state.videoCodec = savedVideoCodec; videoCodecSelect.value = savedVideoCodec; }

  const savedAudioCodec = await window.api.getSetting('audioCodec');
  if (savedAudioCodec) { state.audioCodec = savedAudioCodec; audioCodecSelect.value = savedAudioCodec; }

  const savedLang = await window.api.getSetting('language');
  if (savedLang) { langSelect.value = savedLang; applyLanguage(savedLang); }

  const savedPresets = await window.api.getSetting('presets');
  if (savedPresets) { state.presets = savedPresets; renderCustomPresets(); }

  setupEventListeners();
  setupDownloadListeners();
  setupContextMenu();
  setupDragDrop();
  setupDragReorder();
  setupPulseGlow();
  setupParallaxScroll();
  await loadHistory();

  // Check for yt-dlp updates in background
  checkForUpdates();
});

function setupEventListeners() {
  // Window controls
  closeBtn.addEventListener('click', () => window.api.windowClose());

  // Theme toggle

  // Fetch on button click
  fetchBtn.addEventListener('click', () => {
    if (state.searchMode) {
      performSearch();
    } else {
      fetchVideoInfo();
    }
  });

  // Fetch on Enter key
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (state.searchMode) {
        performSearch();
      } else {
        fetchVideoInfo();
      }
    }
  });

  // Auto-fetch on paste
  urlInput.addEventListener('paste', () => {
    if (!state.searchMode) {
      setTimeout(() => fetchVideoInfo(), 100);
    }
  });

  // URL clear button
  urlInput.addEventListener('input', () => {
    urlClearBtn.classList.toggle('hidden', !urlInput.value);
  });
  urlClearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlClearBtn.classList.add('hidden');
    hideError();
    hidePreview();
    playlistSection.classList.add('hidden');
    searchResultsSection.classList.add('hidden');
    state.videoInfo = null;
    state.playlistInfo = null;
    state.selectedPlaylistVideos.clear();
    stopAudioPreview();
    urlInput.focus();
  });

  // Format select
  formatSelect.addEventListener('change', (e) => {
    state.format = e.target.value;
    updateQualityOptions();
    // Clear preset active state
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  });

  // Quality change
  qualitySelect.addEventListener('change', (e) => {
    state.quality = e.target.value;
    updateFilenamePreview();
    updateFileSizeEstimate();
  });

  // Browse folder
  browseBtn.addEventListener('click', async () => {
    const folder = await window.api.selectFolder();
    if (folder) {
      state.outputPath = folder;
      outputPath.value = folder;
    }
  });

  // Download
  downloadBtn.addEventListener('click', () => startDownload());

  // Clear history
  clearHistoryBtn.addEventListener('click', () => clearHistory());

  // Subtitles
  subtitleSelect.addEventListener('change', (e) => {
    state.subtitleLang = e.target.value;
  });
  subtitleFormatSelect.addEventListener('change', (e) => {
    state.subtitleFormat = e.target.value;
  });

  // Speed limit
  speedLimitSelect.addEventListener('change', (e) => {
    window.api.setSpeedLimit(e.target.value || null);
  });

  // Sound effect
  soundSelect.addEventListener('change', (e) => {
    state.soundEffect = e.target.value;
    window.api.setSetting('soundEffect', e.target.value);
  });
  previewSoundBtn.addEventListener('click', () => previewSound(state.soundEffect));

  // Filename template
  filenameTemplateInput.addEventListener('input', (e) => {
    state.filenameTemplate = e.target.value;
    window.api.setSetting('filenameTemplate', e.target.value);
    updateFilenamePreview();
  });

  // Token button clicks
  document.querySelector('.template-tokens')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.token-btn');
    if (!btn) return;
    const token = btn.getAttribute('data-token');
    const input = filenameTemplateInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + token + input.value.substring(end);
    input.setSelectionRange(start + token.length, start + token.length);
    input.focus();
    state.filenameTemplate = input.value;
    window.api.setSetting('filenameTemplate', input.value);
    updateFilenamePreview();
  });

  // Search mode toggle
  modeUrl.addEventListener('click', () => toggleSearchMode(false));
  modeSearch.addEventListener('click', () => toggleSearchMode(true));

  // Search result click
  searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item) return;
    const index = parseInt(item.getAttribute('data-search-index'), 10);
    const result = state.searchResults[index];
    if (result) {
      toggleSearchMode(false);
      urlInput.value = result.url;
      fetchVideoInfo();
    }
  });

  // Load more
  loadMoreBtn.addEventListener('click', () => loadMoreResults());

  // Audio preview
  audioPreviewBtn.addEventListener('click', () => toggleAudioPreview());

  // Playlist select all / deselect all
  selectAllBtn.addEventListener('click', () => {
    if (!state.playlistInfo) return;
    state.selectedPlaylistVideos = new Set(state.playlistInfo.videos.map((_, i) => i));
    playlistVideos.querySelectorAll('.playlist-checkbox').forEach(cb => cb.checked = true);
    updateDownloadBtnText();
  });

  deselectAllBtn.addEventListener('click', () => {
    state.selectedPlaylistVideos.clear();
    playlistVideos.querySelectorAll('.playlist-checkbox').forEach(cb => cb.checked = false);
    updateDownloadBtnText();
  });

  // Playlist checkbox delegation
  playlistVideos.addEventListener('change', (e) => {
    if (e.target.classList.contains('playlist-checkbox')) {
      const index = parseInt(e.target.getAttribute('data-index'), 10);
      if (e.target.checked) {
        state.selectedPlaylistVideos.add(index);
      } else {
        state.selectedPlaylistVideos.delete(index);
      }
      updateDownloadBtnText();
    }
  });

  // Updater
  updateBtn.addEventListener('click', () => performUpdate());
  dismissUpdateBtn.addEventListener('click', () => updateNotification.classList.add('hidden'));

  // Update progress
  window.api.onUpdateProgress((progress) => {
    if (progress.status === 'downloading') {
      updateMessage.textContent = `Downloading update... ${progress.percent}%`;
    } else if (progress.status === 'complete') {
      updateMessage.textContent = 'Update complete!';
    }
  });

  // ===== Settings Panel =====
  settingsToggleBtn.addEventListener('click', toggleSettings);
  settingsCloseBtn.addEventListener('click', () => settingsPanel.classList.add('hidden'));

  // Language
  langSelect.addEventListener('change', (e) => {
    applyLanguage(e.target.value);
    window.api.setSetting('language', e.target.value);
  });

  // Proxy
  proxyInput.addEventListener('change', (e) => {
    state.proxy = e.target.value.trim();
    window.api.setSetting('proxy', state.proxy);
  });

  // Toggles
  setupToggle(smartRenameToggle, 'smartRename', 'smartRename');
  setupToggle(duplicateDetectToggle, 'duplicateDetect', 'duplicateDetect');
  setupToggle(downloadResumeToggle, 'downloadResume', 'downloadResume');
  setupToggle(autoCompressToggle, 'autoCompress', 'autoCompress');

  // Codec
  videoCodecSelect.addEventListener('change', (e) => {
    state.videoCodec = e.target.value;
    window.api.setSetting('videoCodec', e.target.value);
  });
  audioCodecSelect.addEventListener('change', (e) => {
    state.audioCodec = e.target.value;
    window.api.setSetting('audioCodec', e.target.value);
  });

  // Save thumbnail
  saveThumbnailBtn.addEventListener('click', async () => {
    if (!state.videoInfo) return;
    try {
      const path = await window.api.saveThumbnail(state.videoInfo.thumbnail, state.outputPath, state.videoInfo.title);
      showToast('Thumbnail saved!', 'success');
    } catch (err) {
      showToast('Failed to save thumbnail', 'error');
    }
  });

  // Presets
  document.querySelector('.presets-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn[data-format]');
    if (!btn) return;
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyPreset(btn.getAttribute('data-format'), btn.getAttribute('data-quality'));
  });

  // Custom presets
  customPresetsEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-custom-preset]');
    if (!btn) return;
    const idx = parseInt(btn.getAttribute('data-custom-preset'));
    const preset = state.presets[idx];
    if (preset) applyPreset(preset.format, preset.quality);
  });

  // Tools
  toolsToggleBtn.addEventListener('click', () => {
    const hidden = toolsBody.classList.toggle('hidden');
    toolsToggleBtn.textContent = hidden ? 'Show' : 'Hide';
  });

  document.querySelector('.tools-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.tool-card');
    if (!card) return;
    selectTool(card.getAttribute('data-tool'));
  });

  // Tool file select and run button (delegated)
  document.getElementById('toolOptions')?.addEventListener('click', async (e) => {
    if (e.target.id === 'toolSelectFile') {
      const file = await window.api.selectFile();
      const fp = $('#toolFilePath');
      if (file && fp) fp.value = file;
    }
    if (e.target.id === 'toolRunBtn') {
      runTool();
    }
  });

  // Media progress
  window.api.onMediaProgress((data) => {
    if (toolProgressBar) {
      toolProgressBar.style.width = (data.percent || 0) + '%';
      if (data.pass) toolProgressLabel.textContent = data.pass;
    }
  });
}

function setupDownloadListeners() {
  window.api.onDownloadProgress((data) => {
    updateDownloadItem(data.id, {
      percent: data.percent,
      speed: data.speed,
      eta: data.eta,
      status: data.status || 'downloading'
    });
    // Feed bandwidth monitor
    if (data.speed && data.speed !== '-') {
      updateBandwidth(data.speed);
    }
  });

  window.api.onDownloadComplete((data) => {
    updateDownloadItem(data.id, {
      percent: 100,
      status: 'complete'
    });

    const dl = state.downloads.get(data.id);
    if (dl) {
      addToHistory(dl.config.title, dl.config.format, dl.config.quality, dl.config.url, dl.outputPath);
    }

    playNotificationSound();
    showToast(`${data.title} downloaded!`, 'success');
  });

  window.api.onDownloadError((data) => {
    updateDownloadItem(data.id, {
      status: 'error',
      error: data.error
    });
    showToast(`Download failed: ${data.error}`, 'error');
  });
}

// Validate URL
function isValidUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|playlist\?list=)|youtu\.be\/)[\w-]+/.test(url);
}

// Fetch video info
async function fetchVideoInfo() {
  let url = urlInput.value.trim();

  if (!url) {
    showError('Please enter a YouTube URL');
    return;
  }

  // URL shortener support - expand shortened URLs
  if (url.match(/^https?:\/\/(bit\.ly|t\.co|tinyurl\.com|goo\.gl|is\.gd|buff\.ly|ow\.ly)\//i)) {
    try {
      const expanded = await window.api.expandUrl(url);
      if (expanded !== url) {
        url = expanded;
        urlInput.value = url;
      }
    } catch {}
  }

  if (!isValidUrl(url)) {
    showError('Invalid YouTube URL. Supported: youtube.com/watch, youtu.be, youtube.com/shorts, playlists');
    return;
  }

  if (state.fetching) return;

  // Stop any audio preview
  stopAudioPreview();

  // Reset playlist state
  state.playlistInfo = null;
  state.selectedPlaylistVideos.clear();
  playlistSection.classList.add('hidden');

  // Check if it's a playlist
  if (isPlaylistUrl(url)) {
    await fetchPlaylistInfo();
    return;
  }

  hideError();
  setFetching(true);

  skeletonSection.classList.remove('hidden');
  previewSection.classList.add('hidden');
  optionsSection.classList.add('hidden');

  try {
    state.videoInfo = await window.api.getVideoInfo(url);
    skeletonSection.classList.add('hidden');
    showPreview(state.videoInfo);
  } catch (err) {
    skeletonSection.classList.add('hidden');
    showError(err.message || 'Failed to fetch video info');
    hidePreview();
  } finally {
    setFetching(false);
  }
}

function setFetching(loading) {
  state.fetching = loading;
  fetchBtn.disabled = loading;
  const btnText = fetchBtn.querySelector('.btn-text');
  const btnSpinner = fetchBtn.querySelector('.btn-spinner');
  if (loading) {
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');
  } else {
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
  }
}

function showPreview(info) {
  // Smart rename if enabled
  if (state.smartRename) {
    info.title = window.api.smartRename ? info.title : info.title; // Will be cleaned in display
    window.api.smartRename(info.title).then(cleaned => {
      if (cleaned !== info.title) {
        info.title = cleaned;
        videoTitle.textContent = cleaned;
        updateFilenamePreview();
      }
    }).catch(() => {});
  }

  thumbnail.src = info.thumbnail;
  videoTitle.textContent = info.title;
  videoChannel.textContent = info.uploader;
  videoViews.textContent = formatViews(info.viewCount);
  duration.textContent = info.durationFormatted;

  previewSection.classList.remove('hidden');
  optionsSection.classList.remove('hidden');
  presetsSection.classList.remove('hidden');
  audioPreviewBtn.classList.remove('hidden');
  downloadBtn.textContent = t('download');
  updateQualityOptions();
  updateFilenamePreview();
  updateFileSizeEstimate();

  // Duplicate check
  hideDuplicateWarning();
  if (checkDuplicate(info.title)) {
    showDuplicateWarning();
  }
}

function hidePreview() {
  previewSection.classList.add('hidden');
  optionsSection.classList.add('hidden');
  presetsSection.classList.add('hidden');
  state.videoInfo = null;
  stopAudioPreview();
  hideDuplicateWarning();
}

function updateQualityOptions() {
  let options;
  if (state.format === 'wav' || state.format === 'flac') {
    options = losslessQualities;
  } else if (audioFormats.includes(state.format)) {
    options = audioQualities;
  } else {
    options = videoQualities;
  }
  qualitySelect.innerHTML = options
    .map(o => `<option value="${o.value}">${o.label}</option>`)
    .join('');
  state.quality = options[0].value;
  updateFilenamePreview();
  updateFileSizeEstimate();
}

function showError(msg) {
  urlError.textContent = msg;
  urlError.classList.remove('hidden');
}

function hideError() {
  urlError.classList.add('hidden');
}

// Download
async function startDownload() {
  // Playlist download
  if (state.playlistInfo) {
    await startPlaylistDownload();
    return;
  }

  if (!state.videoInfo) return;

  const url = urlInput.value.trim();
  const config = {
    url,
    title: state.videoInfo.title,
    format: state.format,
    quality: state.quality,
    outputPath: state.outputPath,
    filenameTemplate: templateToYtdlp(state.filenameTemplate),
    subtitleLang: state.subtitleLang,
    subtitleFormat: state.subtitleFormat,
    embedMetadata: state.embedMetadata,
    thumbnailUrl: state.videoInfo.thumbnail,
    proxy: state.proxy || undefined,
    resume: state.downloadResume,
    videoCodec: state.videoCodec || undefined,
    audioCodec: state.audioCodec || undefined
  };

  try {
    const id = await window.api.startDownload(config);
    addDownloadItem(id, config);
  } catch (err) {
    showToast(`Failed to start download: ${err.message}`, 'error');
  }
}

async function startPlaylistDownload() {
  if (!state.playlistInfo || state.selectedPlaylistVideos.size === 0) {
    showToast('No videos selected', 'error');
    return;
  }

  const videos = state.playlistInfo.videos;
  for (const index of state.selectedPlaylistVideos) {
    const video = videos[index];
    if (!video) continue;

    const config = {
      url: video.url,
      title: video.title,
      format: state.format,
      quality: state.quality,
      outputPath: state.outputPath,
      filenameTemplate: templateToYtdlp(state.filenameTemplate),
      subtitleLang: state.subtitleLang,
      subtitleFormat: state.subtitleFormat,
      embedMetadata: state.embedMetadata,
      thumbnailUrl: video.thumbnail,
      proxy: state.proxy || undefined,
      resume: state.downloadResume,
      videoCodec: state.videoCodec || undefined,
      audioCodec: state.audioCodec || undefined
    };

    try {
      const id = await window.api.startDownload(config);
      addDownloadItem(id, config);
    } catch (err) {
      showToast(`Failed to queue: ${video.title}`, 'error');
    }
  }

  showToast(`Queued ${state.selectedPlaylistVideos.size} downloads`, 'success');
}

// ===== Queue Tabs =====
function switchQueueTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.queue-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tab);
  });
  queueActive.classList.toggle('hidden', tab !== 'active');
  queuePending.classList.toggle('hidden', tab !== 'pending');
  queueCompleted.classList.toggle('hidden', tab !== 'completed');
}

function updateQueueCounts() {
  activeCount.textContent = queueActive.children.length;
  pendingCount.textContent = queuePending.children.length;
  completedCount.textContent = queueCompleted.children.length;
}

// Download UI
function addDownloadItem(id, config) {
  const item = document.createElement('div');
  item.className = 'download-item';
  item.id = `dl-${id}`;
  item.innerHTML = `
    <div class="download-header">
      <span class="drag-handle" title="Drag to reorder">&#9776;</span>
      <span class="download-title">${escapeHtml(config.title)}</span>
      <span class="download-format">${config.format.toUpperCase()}</span>
      <div class="download-actions">
        <button class="btn-sm btn-cancel" data-action="cancel" data-id="${id}">Cancel</button>
      </div>
    </div>
    <div class="progress-wrap">
      <div class="progress-bar" id="pb-${id}"></div>
    </div>
    <div class="download-stats">
      <span class="download-status" id="status-${id}">Queued</span>
      <div class="download-speed-eta">
        <span id="speed-${id}"></span>
        <span id="eta-${id}"></span>
      </div>
    </div>
  `;

  // Items start as pending in the queue
  queuePending.prepend(item);
  setupDragItem(item, id);

  state.downloads.set(id, {
    element: item,
    config,
    outputPath: config.outputPath,
    currentPanel: 'pending'
  });

  updateQueueCounts();
}

function moveToPanel(id, targetPanel) {
  const dl = state.downloads.get(id);
  if (!dl) return;
  if (dl.currentPanel === targetPanel) return;

  const panels = { active: queueActive, pending: queuePending, completed: queueCompleted };
  const panel = panels[targetPanel];
  if (!panel) return;

  // Remove drag handle when leaving pending
  if (targetPanel !== 'pending') {
    const handle = dl.element.querySelector('.drag-handle');
    if (handle) handle.style.display = 'none';
    dl.element.draggable = false;
  }

  if (targetPanel === 'completed') {
    panel.prepend(dl.element);
  } else {
    panel.appendChild(dl.element);
  }

  dl.currentPanel = targetPanel;
  updateQueueCounts();
}

function updateDownloadItem(id, data) {
  const progressBar = $(`#pb-${id}`);
  const statusEl = $(`#status-${id}`);
  const speedEl = $(`#speed-${id}`);

  if (!progressBar) return;

  if (data.percent !== undefined) {
    progressBar.style.width = `${data.percent}%`;
  }

  const etaEl = $(`#eta-${id}`);

  if (data.status === 'downloading') {
    moveToPanel(id, 'active');
    statusEl.textContent = `${data.percent?.toFixed(1)}% of ${data.size || ''}`;
    statusEl.className = 'download-status';
    if (speedEl) speedEl.innerHTML = data.speed ? `<span class="speed-val">${data.speed}</span>` : '';
    if (etaEl) etaEl.innerHTML = data.eta ? `<span class="eta-val">ETA: ${data.eta}</span>` : '';
  } else if (data.status === 'pending') {
    moveToPanel(id, 'pending');
    const dl = state.downloads.get(id);
    if (dl) {
      const handle = dl.element.querySelector('.drag-handle');
      if (handle) handle.style.display = '';
      dl.element.draggable = true;
    }
    progressBar.style.width = '0%';
    progressBar.classList.remove('complete', 'error');
    statusEl.textContent = 'Queued';
    statusEl.className = 'download-status';
    if (speedEl) speedEl.textContent = '';
    if (etaEl) etaEl.textContent = '';
    updateActionsForPending(id);
  } else if (data.status === 'processing') {
    statusEl.textContent = 'Processing...';
    if (speedEl) speedEl.textContent = '';
    if (etaEl) etaEl.textContent = '';
  } else if (data.status === 'complete') {
    moveToPanel(id, 'completed');
    progressBar.classList.add('complete');
    statusEl.textContent = 'Complete';
    statusEl.className = 'download-status complete';
    if (speedEl) speedEl.textContent = '';
    if (etaEl) etaEl.textContent = '';
    updateActionsForComplete(id);
  } else if (data.status === 'error') {
    progressBar.classList.add('error');
    statusEl.textContent = data.error || 'Failed';
    statusEl.className = 'download-status error';
    if (speedEl) speedEl.textContent = '';
    if (etaEl) etaEl.textContent = '';
    updateActionsForError(id);
  } else if (data.status === 'cancelled') {
    moveToPanel(id, 'completed');
    statusEl.textContent = 'Cancelled';
    statusEl.className = 'download-status error';
    if (speedEl) speedEl.textContent = '';
    if (etaEl) etaEl.textContent = '';
    updateActionsForCancelled(id);
  }
}

function updateActionsForComplete(id) {
  const dl = state.downloads.get(id);
  if (!dl) return;
  const actions = dl.element.querySelector('.download-actions');
  actions.innerHTML = `
    <button class="btn-sm btn-open" data-action="open-folder" data-path="${escapeHtml(dl.outputPath)}">Open Folder</button>
  `;
}

function updateActionsForError(id) {
  const dl = state.downloads.get(id);
  if (!dl) return;
  const actions = dl.element.querySelector('.download-actions');
  actions.innerHTML = `
    <button class="btn-sm btn-retry" data-action="retry" data-id="${id}">Retry</button>
  `;
}

function updateActionsForCancelled(id) {
  const dl = state.downloads.get(id);
  if (!dl) return;
  const actions = dl.element.querySelector('.download-actions');
  actions.innerHTML = `
    <button class="btn-sm btn-retry" data-action="retry" data-id="${id}">Retry</button>
  `;
}

function updateActionsForPending(id) {
  const dl = state.downloads.get(id);
  if (!dl) return;
  const actions = dl.element.querySelector('.download-actions');
  actions.innerHTML = `
    <button class="btn-sm btn-cancel" data-action="cancel" data-id="${id}">Cancel</button>
  `;
}

// ===== Drag to Reorder =====
function setupDragItem(item, id) {
  item.draggable = true;
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', id);
    item.classList.add('dragging');
  });
  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  });
}

function setupDragReorder() {
  queuePending.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = queuePending.querySelector('.dragging');
    if (!dragging) return;

    const siblings = [...queuePending.querySelectorAll('.download-item:not(.dragging)')];
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    const closest = siblings.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = e.clientY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY });

    if (closest.element) {
      closest.element.classList.add('drag-over');
    }
  });

  queuePending.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const dragging = $(`#dl-${draggedId}`);
    if (!dragging) return;

    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    const siblings = [...queuePending.querySelectorAll('.download-item:not(.dragging)')];
    const closest = siblings.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = e.clientY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY });

    if (closest.element) {
      queuePending.insertBefore(dragging, closest.element);
      const beforeId = closest.element.id.replace('dl-', '');
      window.api.reorderDownload(draggedId, beforeId);
    } else {
      queuePending.appendChild(dragging);
      window.api.reorderDownload(draggedId, null);
    }
  });
}

// Event delegation for download action buttons
document.addEventListener('click', async (e) => {
  // Queue tab clicks
  const tab = e.target.closest('.queue-tab');
  if (tab) {
    switchQueueTab(tab.getAttribute('data-tab'));
    return;
  }

  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.getAttribute('data-action');
  if (action === 'cancel') {
    const id = btn.getAttribute('data-id');
    await window.api.cancelDownload(id);
  } else if (action === 'open-folder') {
    const folderPath = btn.getAttribute('data-path');
    await window.api.openFolder(folderPath);
  } else if (action === 'retry') {
    const id = btn.getAttribute('data-id');
    await window.api.retryDownload(id);
  } else if (action === 'redownload') {
    const index = parseInt(btn.getAttribute('data-index'), 10);
    const item = state.history[index];
    if (item && item.url) {
      if (state.searchMode) toggleSearchMode(false);
      urlInput.value = item.url;
      urlClearBtn.classList.remove('hidden');
      fetchVideoInfo();
    }
  }
});

// Utilities
function formatViews(count) {
  if (!count) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  // Ensure toast container exists
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
