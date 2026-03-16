const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getFfmpegPath } = require('./binary-manager');

class MediaTools {
  // Convert a file to a different format
  convert(inputPath, outputFormat, onProgress) {
    return new Promise((resolve, reject) => {
      const ext = '.' + outputFormat;
      const base = path.basename(inputPath, path.extname(inputPath));
      const dir = path.dirname(inputPath);
      let outputPath = path.join(dir, base + ext);

      // Avoid overwriting
      let counter = 1;
      while (fs.existsSync(outputPath)) {
        outputPath = path.join(dir, `${base} (${counter})${ext}`);
        counter++;
      }

      const args = ['-i', inputPath, '-y'];

      // Format-specific encoding
      if (['mp3', 'aac'].includes(outputFormat)) {
        args.push('-vn'); // no video
        if (outputFormat === 'mp3') args.push('-codec:a', 'libmp3lame', '-q:a', '2');
        else args.push('-codec:a', 'aac', '-b:a', '192k');
      } else if (outputFormat === 'wav') {
        args.push('-vn');
      } else if (outputFormat === 'flac') {
        args.push('-vn', '-codec:a', 'flac');
      } else if (outputFormat === 'mp4') {
        args.push('-codec:v', 'libx264', '-codec:a', 'aac', '-preset', 'medium');
      } else if (outputFormat === 'webm') {
        args.push('-codec:v', 'libvpx-vp9', '-codec:a', 'libopus', '-b:v', '2M');
      } else if (outputFormat === 'avi') {
        args.push('-codec:v', 'mpeg4', '-codec:a', 'mp3');
      }

      args.push('-progress', 'pipe:1', outputPath);

      const proc = spawn(getFfmpegPath(), args);
      let duration = 0;

      proc.stderr.on('data', (chunk) => {
        const str = chunk.toString();
        const durMatch = str.match(/Duration:\s+(\d+):(\d+):(\d+)/);
        if (durMatch) {
          duration = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseInt(durMatch[3]);
        }
      });

      proc.stdout.on('data', (chunk) => {
        const str = chunk.toString();
        const timeMatch = str.match(/out_time_ms=(\d+)/);
        if (timeMatch && duration > 0) {
          const currentSec = parseInt(timeMatch[1]) / 1000000;
          const percent = Math.min(100, (currentSec / duration) * 100);
          if (onProgress) onProgress({ percent: Math.round(percent) });
        }
      });

      proc.on('close', (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`Conversion failed (code ${code})`));
      });
      proc.on('error', (err) => reject(err));
    });
  }

  // Compress video (re-encode at lower bitrate)
  compress(inputPath, crf = 28, onProgress) {
    return new Promise((resolve, reject) => {
      const ext = path.extname(inputPath);
      const base = path.basename(inputPath, ext);
      const dir = path.dirname(inputPath);
      const outputPath = path.join(dir, `${base}_compressed${ext}`);

      const args = [
        '-i', inputPath,
        '-codec:v', 'libx264',
        '-crf', String(crf),
        '-preset', 'medium',
        '-codec:a', 'aac', '-b:a', '128k',
        '-progress', 'pipe:1',
        '-y', outputPath
      ];

      const proc = spawn(getFfmpegPath(), args);
      let duration = 0;

      proc.stderr.on('data', (chunk) => {
        const str = chunk.toString();
        const durMatch = str.match(/Duration:\s+(\d+):(\d+):(\d+)/);
        if (durMatch) {
          duration = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseInt(durMatch[3]);
        }
      });

      proc.stdout.on('data', (chunk) => {
        const str = chunk.toString();
        const timeMatch = str.match(/out_time_ms=(\d+)/);
        if (timeMatch && duration > 0) {
          const currentSec = parseInt(timeMatch[1]) / 1000000;
          const percent = Math.min(100, (currentSec / duration) * 100);
          if (onProgress) onProgress({ percent: Math.round(percent) });
        }
      });

      proc.on('close', (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`Compression failed (code ${code})`));
      });
      proc.on('error', (err) => reject(err));
    });
  }

  // Adjust audio volume
  audioBoost(inputPath, volumeDb = 6, onProgress) {
    return new Promise((resolve, reject) => {
      const ext = path.extname(inputPath);
      const base = path.basename(inputPath, ext);
      const dir = path.dirname(inputPath);
      const outputPath = path.join(dir, `${base}_boosted${ext}`);

      const filter = `volume=${volumeDb}dB`;
      const args = [
        '-i', inputPath,
        '-af', filter,
        '-codec:v', 'copy',
        '-progress', 'pipe:1',
        '-y', outputPath
      ];

      const proc = spawn(getFfmpegPath(), args);
      let duration = 0;

      proc.stderr.on('data', (chunk) => {
        const str = chunk.toString();
        const durMatch = str.match(/Duration:\s+(\d+):(\d+):(\d+)/);
        if (durMatch) {
          duration = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseInt(durMatch[3]);
        }
      });

      proc.stdout.on('data', (chunk) => {
        const str = chunk.toString();
        const timeMatch = str.match(/out_time_ms=(\d+)/);
        if (timeMatch && duration > 0) {
          const currentSec = parseInt(timeMatch[1]) / 1000000;
          const percent = Math.min(100, (currentSec / duration) * 100);
          if (onProgress) onProgress({ percent: Math.round(percent) });
        }
      });

      proc.on('close', (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`Audio boost failed (code ${code})`));
      });
      proc.on('error', (err) => reject(err));
    });
  }

  // Change aspect ratio
  changeAspectRatio(inputPath, ratio = '16:9', onProgress) {
    return new Promise((resolve, reject) => {
      const ext = path.extname(inputPath);
      const base = path.basename(inputPath, ext);
      const dir = path.dirname(inputPath);
      const outputPath = path.join(dir, `${base}_${ratio.replace(':', 'x')}${ext}`);

      // Use pad filter to add letterbox/pillarbox
      const ratioMap = {
        '16:9': 'iw:iw*9/16',
        '4:3': 'iw:iw*3/4',
        '1:1': 'iw:iw',
        '9:16': 'ih*9/16:ih'
      };
      const scale = ratioMap[ratio] || ratioMap['16:9'];
      const filter = `scale=${scale}:force_original_aspect_ratio=decrease,pad=${scale}:(ow-iw)/2:(oh-ih)/2:black`;

      const args = [
        '-i', inputPath,
        '-vf', filter,
        '-codec:a', 'copy',
        '-progress', 'pipe:1',
        '-y', outputPath
      ];

      const proc = spawn(getFfmpegPath(), args);
      let duration = 0;

      proc.stderr.on('data', (chunk) => {
        const str = chunk.toString();
        const durMatch = str.match(/Duration:\s+(\d+):(\d+):(\d+)/);
        if (durMatch) {
          duration = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseInt(durMatch[3]);
        }
      });

      proc.stdout.on('data', (chunk) => {
        const str = chunk.toString();
        const timeMatch = str.match(/out_time_ms=(\d+)/);
        if (timeMatch && duration > 0) {
          const currentSec = parseInt(timeMatch[1]) / 1000000;
          const percent = Math.min(100, (currentSec / duration) * 100);
          if (onProgress) onProgress({ percent: Math.round(percent) });
        }
      });

      proc.on('close', (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`Aspect ratio change failed (code ${code})`));
      });
      proc.on('error', (err) => reject(err));
    });
  }

  // Stabilize video using vidstabdetect + vidstabtransform (two-pass)
  stabilize(inputPath, onProgress) {
    return new Promise((resolve, reject) => {
      const ext = path.extname(inputPath);
      const base = path.basename(inputPath, ext);
      const dir = path.dirname(inputPath);
      const outputPath = path.join(dir, `${base}_stabilized${ext}`);
      const transformsFile = path.join(dir, `${base}_transforms.trf`);

      // Pass 1: detect
      if (onProgress) onProgress({ percent: 0, pass: 'Analyzing...' });
      const pass1 = spawn(getFfmpegPath(), [
        '-i', inputPath,
        '-vf', `vidstabdetect=result='${transformsFile.replace(/\\/g, '/')}'`,
        '-f', 'null', '-'
      ]);

      pass1.on('close', (code1) => {
        if (code1 !== 0) {
          return reject(new Error('Stabilization analysis failed'));
        }

        if (onProgress) onProgress({ percent: 50, pass: 'Stabilizing...' });

        // Pass 2: transform
        const pass2 = spawn(getFfmpegPath(), [
          '-i', inputPath,
          '-vf', `vidstabtransform=input='${transformsFile.replace(/\\/g, '/')}':smoothing=10,unsharp`,
          '-codec:a', 'copy',
          '-y', outputPath
        ]);

        pass2.on('close', (code2) => {
          // Clean up transforms file
          try { fs.unlinkSync(transformsFile); } catch {}

          if (code2 === 0) {
            if (onProgress) onProgress({ percent: 100, pass: 'Done' });
            resolve(outputPath);
          } else {
            reject(new Error('Stabilization failed'));
          }
        });
        pass2.on('error', (err) => reject(err));
      });
      pass1.on('error', (err) => reject(err));
    });
  }
}

module.exports = { MediaTools };
