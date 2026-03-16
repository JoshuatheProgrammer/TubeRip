const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { getYtdlpPath, getFfmpegPath } = require('./binary-manager');

class YtdlpService {
  getVideoInfo(url) {
    return new Promise((resolve, reject) => {
      const proc = spawn(getYtdlpPath(), [
        '--dump-json',
        '--no-download',
        '--no-warnings',
        '--no-playlist',
        url
      ]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.stderr.on('data', (chunk) => { stderr += chunk; });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(this._friendlyError(stderr, code)));
        }
        try {
          const info = JSON.parse(stdout);
          resolve(this._extractPreview(info));
        } catch (e) {
          reject(new Error('Failed to parse video info'));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      });
    });
  }

  download(url, formatArgs, outputPath, onProgress, speedLimit, filenameTemplate, options = {}) {
    const outputTemplate = filenameTemplate || '%(title)s.%(ext)s';
    const args = [
      ...formatArgs,
      '--ffmpeg-location', getFfmpegPath(),
      '--newline',
      '-o', path.join(outputPath, outputTemplate),
      '--no-playlist',
      '--windows-filenames',
    ];

    if (speedLimit) {
      args.push('--limit-rate', speedLimit);
    }

    // Resume support
    if (options.resume !== false) {
      args.push('--continue');
    }

    // Proxy support
    if (options.proxy) {
      args.push('--proxy', options.proxy);
    }

    // Codec preference
    if (options.videoCodec) {
      args.push('--postprocessor-args', `ffmpeg:-c:v ${options.videoCodec}`);
    }
    if (options.audioCodec) {
      args.push('--postprocessor-args', `ffmpeg:-c:a ${options.audioCodec}`);
    }

    // Subtitles
    if (options.subtitleLang) {
      if (options.subtitleLang === 'all') {
        args.push('--write-subs', '--all-subs');
      } else {
        args.push('--write-subs', '--sub-langs', options.subtitleLang);
      }
      // Also try auto-generated subs
      args.push('--write-auto-subs');
      if (options.subtitleFormat) {
        args.push('--convert-subs', options.subtitleFormat);
      }
    }

    // Metadata embedding (auto-tag music)
    if (options.embedMetadata) {
      args.push('--embed-metadata', '--embed-thumbnail');
    }

    args.push(url);

    const proc = spawn(getYtdlpPath(), args);
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        const progress = this._parseProgress(line);
        if (progress) onProgress(progress);
      }
    });

    proc.stderr.on('data', (chunk) => { stderr += chunk; });

    const promise = new Promise((resolve, reject) => {
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(this._friendlyError(stderr, code)));
      });
      proc.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      });
    });

    return { proc, promise };
  }

  getPlaylistInfo(url) {
    return new Promise((resolve, reject) => {
      const proc = spawn(getYtdlpPath(), [
        '--dump-json',
        '--flat-playlist',
        '--no-download',
        '--no-warnings',
        url
      ]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.stderr.on('data', (chunk) => { stderr += chunk; });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(this._friendlyError(stderr, code)));
        }
        try {
          const lines = stdout.trim().split('\n').filter(l => l.trim());
          const videos = lines.map(line => {
            const info = JSON.parse(line);
            return {
              id: info.id,
              title: info.title || 'Unknown',
              thumbnail: info.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${info.id}/mqdefault.jpg`,
              duration: info.duration || 0,
              durationFormatted: info.duration_string || this._formatDuration(info.duration),
              uploader: info.uploader || info.channel || 'Unknown',
              url: info.url || info.webpage_url || `https://www.youtube.com/watch?v=${info.id}`
            };
          });

          const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
          resolve({
            isPlaylist: true,
            title: videos[0]?.uploader ? `Playlist (${videos.length} videos)` : 'Playlist',
            count: videos.length,
            totalDuration,
            totalDurationFormatted: this._formatDuration(totalDuration),
            videos
          });
        } catch (e) {
          reject(new Error('Failed to parse playlist info'));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      });
    });
  }

  searchYouTube(query, count = 5) {
    return new Promise((resolve, reject) => {
      const proc = spawn(getYtdlpPath(), [
        `ytsearch${count}:${query}`,
        '--dump-json',
        '--no-download',
        '--no-warnings',
        '--flat-playlist'
      ]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.stderr.on('data', (chunk) => { stderr += chunk; });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(this._friendlyError(stderr, code)));
        }
        try {
          const lines = stdout.trim().split('\n').filter(l => l.trim());
          const results = lines.map(line => {
            const info = JSON.parse(line);
            return {
              id: info.id,
              title: info.title || 'Unknown',
              thumbnail: info.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${info.id}/mqdefault.jpg`,
              duration: info.duration || 0,
              durationFormatted: info.duration_string || this._formatDuration(info.duration),
              uploader: info.uploader || info.channel || 'Unknown',
              viewCount: info.view_count || 0,
              url: info.url || info.webpage_url || `https://www.youtube.com/watch?v=${info.id}`
            };
          });
          resolve(results);
        } catch (e) {
          reject(new Error('Failed to parse search results'));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      });
    });
  }

  getAudioPreviewUrl(url) {
    return new Promise((resolve, reject) => {
      const proc = spawn(getYtdlpPath(), [
        '-f', 'worstaudio',
        '--get-url',
        '--no-warnings',
        '--no-playlist',
        url
      ]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.stderr.on('data', (chunk) => { stderr += chunk; });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(this._friendlyError(stderr, code)));
        }
        const audioUrl = stdout.trim();
        if (!audioUrl) {
          return reject(new Error('Could not get audio preview URL'));
        }
        resolve(audioUrl);
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      });
    });
  }

  getCurrentVersion() {
    return new Promise((resolve, reject) => {
      const proc = spawn(getYtdlpPath(), ['--version']);
      let stdout = '';

      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.on('close', (code) => {
        if (code !== 0) return reject(new Error('Failed to get yt-dlp version'));
        resolve(stdout.trim());
      });
      proc.on('error', (err) => reject(err));
    });
  }

  getFormatArgs(format, quality) {
    const audioFormats = ['mp3', 'wav', 'flac', 'aac'];

    if (audioFormats.includes(format)) {
      const qualityMap = {
        'best': '0',
        'high': '1',
        'standard': '3',
        'medium': '5',
        'low': '7'
      };

      const args = ['-x', '--audio-format', format];

      // WAV and FLAC are lossless - no quality setting needed
      if (format !== 'wav' && format !== 'flac') {
        args.push('--audio-quality', qualityMap[quality] || '0');
      }

      return args;
    }

    // Video formats
    const getFormatSelector = (fmt, height) => {
      if (fmt === 'webm') {
        const base = height
          ? `bestvideo[height<=${height}][ext=webm]+bestaudio[ext=webm]`
          : `bestvideo[ext=webm]+bestaudio[ext=webm]`;
        return `${base}/best[ext=webm]/best`;
      }
      // MP4 / AVI (AVI downloads as MP4 then recodes)
      const base = height
        ? `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]`
        : `bestvideo[ext=mp4]+bestaudio[ext=m4a]`;
      return `${base}/best[ext=mp4]/best`;
    };

    const height = quality === 'best' ? null : quality;
    const args = ['-f', getFormatSelector(format, height)];

    if (format === 'avi') {
      args.push('--recode-video', 'avi');
    } else {
      args.push('--merge-output-format', format);
    }

    return args;
  }

  // Get file size estimate for a video based on format/quality
  getFileSizeEstimate(url, format, quality) {
    return new Promise((resolve, reject) => {
      const args = ['--dump-json', '--no-download', '--no-warnings', '--no-playlist', url];
      const proc = spawn(getYtdlpPath(), args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.stderr.on('data', (chunk) => { stderr += chunk; });

      proc.on('close', (code) => {
        if (code !== 0) return resolve(null);
        try {
          const info = JSON.parse(stdout);
          const duration = info.duration || 0;
          const audioFormats = ['mp3', 'wav', 'flac', 'aac'];
          let estimatedBytes;

          if (audioFormats.includes(format)) {
            // Audio: estimate based on bitrate
            const bitrateMap = { best: 320, high: 256, standard: 192, medium: 128, low: 96 };
            const kbps = bitrateMap[quality] || 192;
            estimatedBytes = (kbps * 1000 / 8) * duration;
          } else {
            // Video: estimate based on resolution
            const resBitrateMap = { best: 8000, '2160': 16000, '1440': 10000, '1080': 5000, '720': 2500, '480': 1000, '360': 500 };
            const kbps = resBitrateMap[quality] || 5000;
            estimatedBytes = (kbps * 1000 / 8) * duration;
          }

          resolve(this._formatFileSize(estimatedBytes));
        } catch {
          resolve(null);
        }
      });
      proc.on('error', () => resolve(null));
    });
  }

  // Save thumbnail image
  saveThumbnail(thumbnailUrl, outputPath, title) {
    return new Promise((resolve, reject) => {
      const safeName = (title || 'thumbnail').replace(/[<>:"/\\|?*]/g, '_');
      const filePath = path.join(outputPath, `${safeName}_thumbnail.jpg`);
      const protocol = thumbnailUrl.startsWith('https') ? https : http;

      const file = fs.createWriteStream(filePath);
      protocol.get(thumbnailUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Follow redirect
          protocol.get(response.headers.location, (res2) => {
            res2.pipe(file);
            file.on('finish', () => { file.close(); resolve(filePath); });
          }).on('error', reject);
        } else {
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(filePath); });
        }
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    });
  }

  // Expand shortened URLs (bit.ly, t.co, etc.)
  expandUrl(url) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.get(url, { method: 'HEAD' }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(res.headers.location);
        } else {
          resolve(url);
        }
        req.destroy();
      });
      req.on('error', () => resolve(url));
      req.setTimeout(5000, () => { req.destroy(); resolve(url); });
    });
  }

  // Smart rename: clean up messy titles
  smartRename(title) {
    let clean = title;
    // Remove common YouTube clutter
    clean = clean.replace(/\s*[\[\(]\s*(official\s*(video|audio|music\s*video|lyric\s*video|visualizer)?|lyrics?|hd|hq|4k|1080p|720p|full\s*video|explicit|clean|remaster(ed)?)\s*[\]\)]/gi, '');
    // Remove leading/trailing special chars
    clean = clean.replace(/^[\s\-_|:]+|[\s\-_|:]+$/g, '');
    // Collapse multiple spaces
    clean = clean.replace(/\s+/g, ' ');
    return clean.trim() || title;
  }

  _formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return null;
    if (bytes >= 1073741824) return `~${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `~${(bytes / 1048576).toFixed(0)} MB`;
    if (bytes >= 1024) return `~${(bytes / 1024).toFixed(0)} KB`;
    return `~${bytes} B`;
  }

  _extractPreview(info) {
    return {
      title: info.title || 'Unknown Title',
      thumbnail: info.thumbnail || '',
      duration: info.duration || 0,
      durationFormatted: info.duration_string || this._formatDuration(info.duration),
      uploader: info.uploader || info.channel || 'Unknown',
      viewCount: info.view_count || 0,
      id: info.id
    };
  }

  _formatDuration(seconds) {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  _parseProgress(line) {
    // Match: [download]  45.2% of  125.30MiB at  5.23MiB/s ETA 00:14
    const match = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\S]+)\s+at\s+([\S]+)\s+ETA\s+([\S]+)/);
    if (match) {
      return {
        percent: parseFloat(match[1]),
        size: match[2],
        speed: match[3],
        eta: match[4]
      };
    }

    // Match: [download] 100% of 125.30MiB
    const doneMatch = line.match(/\[download\]\s+100%\s+of\s+([\S]+)/);
    if (doneMatch) {
      return { percent: 100, size: doneMatch[1], speed: '-', eta: '00:00' };
    }

    // Match merge/extract messages
    if (line.includes('[Merger]') || line.includes('[ExtractAudio]')) {
      return { percent: 100, size: '-', speed: '-', eta: 'Processing...', status: 'processing' };
    }

    return null;
  }

  _friendlyError(stderr, code) {
    const msg = stderr.toLowerCase();
    if (msg.includes('video unavailable') || msg.includes('is not available'))
      return 'This video is unavailable or has been removed.';
    if (msg.includes('private video'))
      return 'This video is private.';
    if (msg.includes('sign in to confirm your age'))
      return 'Age-restricted videos are not supported.';
    if (msg.includes('unable to download') || msg.includes('urlopen error'))
      return 'Connection failed. Check your internet connection.';
    if (msg.includes('not a valid url'))
      return 'Invalid URL. Please enter a valid YouTube link.';
    return stderr.trim() || `Download failed (code ${code})`;
  }
}

module.exports = { YtdlpService };
