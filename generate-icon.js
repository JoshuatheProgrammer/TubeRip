// Generates a 256x256 .ico icon file
// Design: dark circle with red download arrow

const fs = require('fs');
const path = require('path');

const SIZE = 256;

function createPixels(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Inside circle - gradient background
        const gradientT = y / size;
        const bgR = Math.round(26 + gradientT * 10);  // #1a -> #24
        const bgG = Math.round(26 + gradientT * 8);
        const bgB = Math.round(46 + gradientT * 20);   // #2e -> #42

        // Edge anti-aliasing
        const edgeAlpha = Math.min(1, radius - dist);

        // Draw download arrow
        let isArrow = false;
        let isArrowColor = [233, 69, 96]; // #e94560

        const relX = (x - cx) / (size * 0.35);
        const relY = (y - cy) / (size * 0.35);

        // Arrow shaft (vertical bar)
        if (Math.abs(relX) < 0.15 && relY > -0.55 && relY < 0.25) {
          isArrow = true;
        }

        // Arrow head (triangle pointing down)
        const headTop = 0.05;
        const headBottom = 0.55;
        if (relY >= headTop && relY <= headBottom) {
          const headProgress = (relY - headTop) / (headBottom - headTop);
          const halfWidth = 0.5 * (1 - headProgress);
          if (Math.abs(relX) < halfWidth) {
            isArrow = true;
          }
        }

        // Horizontal line (base/tray)
        if (relY > 0.6 && relY < 0.75 && Math.abs(relX) < 0.55) {
          isArrow = true;
          isArrowColor = [233, 69, 96];
        }

        // Tray sides
        if (Math.abs(relX) > 0.4 && Math.abs(relX) < 0.55 && relY > 0.35 && relY < 0.75) {
          isArrow = true;
        }

        if (isArrow) {
          pixels[idx] = isArrowColor[0];
          pixels[idx + 1] = isArrowColor[1];
          pixels[idx + 2] = isArrowColor[2];
          pixels[idx + 3] = Math.round(255 * edgeAlpha);
        } else {
          pixels[idx] = bgR;
          pixels[idx + 1] = bgG;
          pixels[idx + 2] = bgB;
          pixels[idx + 3] = Math.round(255 * edgeAlpha);
        }
      } else {
        // Outside circle - transparent
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  return pixels;
}

function createICO(sizes) {
  const images = sizes.map(size => {
    const rgba = createPixels(size);
    // Convert to BGRA bottom-to-top for BMP
    const bmpPixels = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const srcIdx = (y * size + x) * 4;
        const dstY = size - 1 - y;
        const dstIdx = (dstY * size + x) * 4;
        bmpPixels[dstIdx] = rgba[srcIdx + 2];     // B
        bmpPixels[dstIdx + 1] = rgba[srcIdx + 1]; // G
        bmpPixels[dstIdx + 2] = rgba[srcIdx];     // R
        bmpPixels[dstIdx + 3] = rgba[srcIdx + 3]; // A
      }
    }

    // AND mask (1bpp, rows padded to 4 bytes)
    const andRowBytes = Math.ceil(size / 8);
    const andRowPadded = Math.ceil(andRowBytes / 4) * 4;
    const andMask = Buffer.alloc(andRowPadded * size, 0);

    // BMP info header
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);           // header size
    header.writeInt32LE(size, 4);          // width
    header.writeInt32LE(size * 2, 8);      // height (doubled for AND mask)
    header.writeUInt16LE(1, 12);           // planes
    header.writeUInt16LE(32, 14);          // bpp
    header.writeUInt32LE(0, 16);           // compression
    header.writeUInt32LE(bmpPixels.length + andMask.length, 20); // image size

    return { size, header, pixels: bmpPixels, andMask };
  });

  // ICO header
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);          // reserved
  icoHeader.writeUInt16LE(1, 2);          // type (1 = ICO)
  icoHeader.writeUInt16LE(images.length, 4); // count

  // Directory entries
  const dirEntries = Buffer.alloc(16 * images.length);
  let dataOffset = 6 + 16 * images.length;

  images.forEach((img, i) => {
    const off = i * 16;
    const dataSize = img.header.length + img.pixels.length + img.andMask.length;
    dirEntries.writeUInt8(img.size >= 256 ? 0 : img.size, off);     // width
    dirEntries.writeUInt8(img.size >= 256 ? 0 : img.size, off + 1); // height
    dirEntries.writeUInt8(0, off + 2);     // colors
    dirEntries.writeUInt8(0, off + 3);     // reserved
    dirEntries.writeUInt16LE(1, off + 4);  // planes
    dirEntries.writeUInt16LE(32, off + 6); // bpp
    dirEntries.writeUInt32LE(dataSize, off + 8);  // size
    dirEntries.writeUInt32LE(dataOffset, off + 12); // offset
    dataOffset += dataSize;
  });

  // Combine
  const buffers = [icoHeader, dirEntries];
  images.forEach(img => {
    buffers.push(img.header, img.pixels, img.andMask);
  });

  return Buffer.concat(buffers);
}

const ico = createICO([16, 32, 48, 256]);
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.ico'), ico);
console.log('icon.ico created');

// Also create a PNG for electron-builder (256x256)
// Minimal PNG encoder
function createPNG(size) {
  const rgba = createPixels(size);

  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let v = n;
      for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
      table[n] = v;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([len, typeAndData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);   // bit depth
  ihdr.writeUInt8(6, 9);   // color type RGBA
  ihdr.writeUInt8(0, 10);  // compression
  ihdr.writeUInt8(0, 11);  // filter
  ihdr.writeUInt8(0, 12);  // interlace

  // IDAT - raw pixel data with filter byte 0 per row
  const rawData = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    rawData[y * (1 + size * 4)] = 0; // filter none
    rgba.copy(rawData, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }

  // Deflate using zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const png = createPNG(256);
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), png);
console.log('icon.png created');
