# TubeRip — YouTube Media Extractor

**TubeRip** is a free, open-source desktop application for downloading and converting YouTube media. Built with Electron and powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [ffmpeg](https://ffmpeg.org/), it provides a modern, intuitive interface for extracting video and audio content in a wide range of formats and quality levels.

> **Note:** This tool is intended for downloading content you have the right to access. Please respect copyright laws and YouTube's Terms of Service.

---

## Screenshots

<!-- Add screenshots of your app here -->
<!-- ![TubeRip Main Interface](screenshots/main.png) -->

---

## Features

### Core Downloads
- **Video & Audio Downloads** — Download YouTube videos and audio tracks in your preferred format
- **Format Selection** — Choose from MP4, WebM, MP3, M4A, WAV, FLAC, and OGG
- **Quality Selection** — Pick quality from 144p up to 4K (2160p)
- **Playlist Support** — Download entire playlists with the ability to select individual videos
- **Download Resume** — Resume interrupted downloads automatically
- **URL Shortener Support** — Paste shortened URLs (youtu.be, bit.ly, etc.) and they'll be expanded automatically

### Media Tools
- **Media Converter** — Convert downloaded files between video and audio formats
- **Video Compressor** — Reduce file sizes with adjustable CRF quality settings
- **Video Stabilizer** — Smooth out shaky footage using two-pass stabilization
- **Audio Booster** — Increase audio volume by a specified dB level
- **Aspect Ratio Converter** — Change video aspect ratios (16:9, 4:3, 1:1, 9:16, 21:9)

### Smart Features
- **Download Presets** — One-click presets for common use cases:
  - Quick Audio (MP3, 128kbps)
  - HD Video (MP4, 1080p)
  - Podcast (M4A, 64kbps)
  - Music HQ (FLAC, best quality)
- **File Size Estimation** — See estimated file sizes before downloading
- **Thumbnail Saver** — Save video thumbnails as image files
- **Smart Rename** — Automatically clean up file names by removing special characters and formatting
- **Duplicate Detection** — Get warned if you've already downloaded a video
- **Bandwidth Monitor** — Real-time download speed graph

### Customization
- **Codec Selection** — Choose your preferred video codec (H.264, H.265, VP9, AV1) and audio codec (AAC, Opus, Vorbis, MP3)
- **Proxy Support** — Route downloads through a proxy server
- **Multi-Language UI** — Available in English, Spanish, French, German, and Portuguese
- **Modern Dark Theme** — Sleek, dark interface with custom titlebar

---

## Installation

### Portable (Recommended)
1. Go to the [Releases](https://github.com/JoshuatheProgrammer/TubeRip/releases) page
2. Download the latest `TubeRip.Portable.x.x.rar`
3. Extract the archive to any folder
4. Run `TubeRip.exe`

No installation required — fully portable with all dependencies bundled.

### Build from Source
```bash
# Clone the repository
git clone https://github.com/JoshuatheProgrammer/TubeRip.git
cd TubeRip

# Install dependencies
npm install

# Run in development mode
npm start

# Build portable executable
npm run build:win
```

> **Note:** When building from source, you must provide your own `yt-dlp.exe` and `ffmpeg.exe` binaries in the `bin/win/` directory.

---

## System Requirements

| Requirement | Details |
|---|---|
| **OS** | Windows 10 / 11 (64-bit) |
| **RAM** | 4 GB minimum |
| **Disk Space** | ~200 MB (app + bundled binaries) |
| **Internet** | Required for downloading content |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [Electron](https://www.electronjs.org/) | Desktop application framework |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | YouTube download backend |
| [ffmpeg](https://ffmpeg.org/) | Media processing, conversion, and post-processing |
| HTML / CSS / JavaScript | Frontend UI |

---

## Project Structure

```
TubeRip/
├── assets/
│   ├── icon.ico              # Application icon
│   └── icon.png              # Application icon (PNG)
├── src/
│   ├── main/
│   │   ├── main.js           # Electron main process
│   │   ├── ipc-handlers.js   # IPC communication handlers
│   │   ├── ytdlp-service.js  # yt-dlp wrapper service
│   │   ├── download-manager.js  # Download queue management
│   │   ├── media-tools.js    # ffmpeg media processing tools
│   │   ├── settings-manager.js  # Persistent settings storage
│   │   ├── binary-manager.js # yt-dlp/ffmpeg binary management
│   │   └── updater-service.js   # Auto-update service
│   ├── preload/
│   │   └── preload.js        # Preload script (IPC bridge)
│   └── renderer/
│       ├── index.html        # Main UI
│       ├── styles.css        # Styles (dark theme)
│       ├── app.js            # Application logic
│       └── i18n.js           # Internationalization
├── package.json
└── README.md
```

---

## Usage

### Downloading a Video
1. Paste a YouTube URL into the input field
2. Click **Fetch Info** to load video details
3. Select your desired format and quality
4. Click **Download**

### Downloading a Playlist
1. Paste a YouTube playlist URL
2. TubeRip will detect the playlist and display all videos
3. Select or deselect individual videos
4. Click **Download All** or download individually

### Using Media Tools
1. Download a video or click **Select File** on any media tool card
2. Choose a tool: Convert, Compress, Stabilize, Audio Boost, or Aspect Ratio
3. Configure options and click **Run**

### Changing Settings
Click the gear icon in the titlebar to access:
- Language preference
- Proxy configuration
- Smart rename toggle
- Duplicate detection toggle
- Download resume toggle
- Auto-compress toggle
- Video and audio codec selection

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Reporting Issues
If you encounter bugs or have feature requests, please [open an issue](https://github.com/JoshuatheProgrammer/TubeRip/issues).

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

## Disclaimer

TubeRip is an independent project and is not affiliated with, endorsed by, or associated with YouTube or Google. This tool is provided as-is for personal use. Users are responsible for ensuring their use complies with applicable laws and terms of service.

---

## Acknowledgements

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — The backbone of all download functionality
- [ffmpeg](https://ffmpeg.org/) — Powers media conversion, compression, and processing
- [Electron](https://www.electronjs.org/) — Makes cross-platform desktop apps possible
- [Rajdhani](https://fonts.google.com/specimen/Rajdhani) — UI font from Google Fonts
