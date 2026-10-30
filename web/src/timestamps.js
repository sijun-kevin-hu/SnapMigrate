import piexif from 'piexifjs';

// EXIF 2.31 timezone tags are missing from piexif's older tag table.
for (const [id, name] of [[36880, 'OffsetTime'], [36881, 'OffsetTimeOriginal'], [36882, 'OffsetTimeDigitized']]) {
  piexif.TAGS.Exif[id] = { name, type: 'Ascii' };
}

export function parseExportDate(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/ UTC$/, 'Z').replace(' ', 'T');
  // A full timestamp and explicit timezone are required for automatic repair.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(normalized)) return null;
  const [year, month, day, hour, minute, second] = normalized.match(/\d+/g).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || hour > 23 || minute > 59 || second > 59) return null;
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function metadataIndex(entries) {
  const index = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const names = new Set();
    for (const key of ['Filename', 'File Name', 'filename', 'Media URL', 'Download Link']) {
      if (typeof entry[key] !== 'string') continue;
      try { names.add(decodeURIComponent(entry[key].split('?')[0].split('/').pop())); } catch {}
    }
    for (const name of names) index.set(name, index.has(name) ? null : entry);
  }
  return index;
}

function binary(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length; i += 32768) result += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return result;
}

export function writeJpegTimestamp(bytes, date) {
  if (bytes[0] !== 255 || bytes[1] !== 216) throw Error('Invalid JPEG signature.');
  const input = binary(bytes);
  const exif = piexif.load(input); // Reject malformed EXIF rather than silently discarding it.
  const stamp = date.toISOString().slice(0, 19).replaceAll('-', ':').replace('T', ' ');
  exif['0th'][piexif.ImageIFD.DateTime] = stamp;
  exif.Exif[piexif.ExifIFD.DateTimeOriginal] = stamp;
  exif.Exif[piexif.ExifIFD.DateTimeDigitized] = stamp;
  for (const id of [36880, 36881, 36882]) exif.Exif[id] = '+00:00';
  for (const id of [37520, 37521, 37522]) delete exif.Exif[id]; // No stale subseconds.
  const output = piexif.insert(piexif.dump(exif), input);
  const readback = piexif.load(output);
  if (readback.Exif[36867] !== stamp || readback.Exif[36881] !== '+00:00') throw Error('JPEG timestamp verification failed.');
  return Uint8Array.from(output, c => c.charCodeAt(0));
}

export function writeMp4Timestamp(bytes, date) {
  const output = new Uint8Array(bytes);
  const view = new DataView(output.buffer, output.byteOffset, output.byteLength);
  const seconds = BigInt(Math.floor(date.getTime() / 1000)) + 2082844800n;
  if (seconds < 0n) throw Error('MP4 dates before 1904 are unsupported.');
  let movieHeaders = 0, trackHeaders = 0, mediaHeaders = 0, mediaData = false, fileType = false;
  function walk(start, end, parent = '') {
    for (let pos = start; pos < end;) {
      if (end - pos < 8) throw Error('Truncated MP4 box.');
      let size = view.getUint32(pos), header = 8;
      const type = String.fromCharCode(...output.subarray(pos + 4, pos + 8));
      if (size === 1) {
        if (end - pos < 16) throw Error('Truncated MP4 extended box.');
        const large = view.getBigUint64(pos + 8);
        if (large > BigInt(Number.MAX_SAFE_INTEGER)) throw Error('MP4 box is too large.');
        size = Number(large); header = 16;
      } else if (size === 0) size = end - pos;
      if (size < header || size > end - pos) throw Error('Invalid MP4 box size.');
      const data = pos + header;
      if (!parent && type === 'ftyp') fileType = true;
      if (!parent && type === 'mdat') mediaData = true;
      if ((parent === 'moov' && type === 'mvhd') || (parent === 'trak' && type === 'tkhd') || (parent === 'mdia' && type === 'mdhd')) {
        const version = output[data];
        if (version !== 0 && version !== 1) throw Error('Unsupported MP4 timestamp version.');
        const width = version === 1 ? 8 : 4;
        if (size - header < 4 + 2 * width) throw Error('Truncated MP4 timestamp.');
        if (width === 4 && seconds > 0xffffffffn) throw Error('This MP4 cannot store dates after February 2040 without rebuilding its headers.');
        for (const offset of [data + 4, data + 4 + width]) {
          if (width === 8) view.setBigUint64(offset, seconds); else view.setUint32(offset, Number(seconds));
        }
        if (type === 'mvhd') movieHeaders++;
        if (type === 'tkhd') trackHeaders++;
        if (type === 'mdhd') mediaHeaders++;
      }
      if ((!parent && type === 'moov') || (parent === 'moov' && type === 'trak') || (parent === 'trak' && type === 'mdia')) walk(data, pos + size, type);
      pos += size;
    }
  }
  walk(0, output.length);
  if (!fileType || !mediaData || movieHeaders !== 1 || !trackHeaders || trackHeaders !== mediaHeaders) throw Error('MP4 is missing expected movie, track, media, or data boxes.');
  return output;
}

export function repairAsset(asset) {
  if (!['Export metadata', 'ZIP UTC timestamp'].includes(asset.source) || !asset.date || !Number.isFinite(asset.date.getTime())) throw Error('No unambiguous, timezone-qualified export timestamp.');
  if (/\.jpe?g$/i.test(asset.name)) return writeJpegTimestamp(asset.data, asset.date);
  if (/\.mp4$/i.test(asset.name)) return writeMp4Timestamp(asset.data, asset.date);
  throw Error('Timestamp writing currently supports JPG and MP4 only.');
}

// Read only the explicit UTC Unix extra field, never the timezone-less DOS date.
export function zipUtcTimestamp(entry, name) {
  const data = entry.extraField?.get(0x5455)?.data;
  if (!data || data.length < 5 || !(data[0] & 1)) return null;
  const seconds = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(1, true);
  if (!seconds) return null;
  const date = new Date(seconds * 1000);
  const day = name.match(/^(\d{4}-\d{2}-\d{2})_/ )?.[1];
  if (!day || date.toISOString().slice(0,10) !== day) return null;
  return date;
}
