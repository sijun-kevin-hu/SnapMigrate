import { ZipReader, BlobReader } from '@zip.js/zip.js';
export const MAX_ARCHIVE_BYTES = 2.5 * 1024 ** 3;
export const MAX_ENTRY_BYTES = 128 * 1024 ** 2;
export async function openArchive(file) {
 if (file.size > MAX_ARCHIVE_BYTES) throw Error('Choose a ZIP no larger than 2.5 GB (2.5 GiB).');
 const reader = new ZipReader(new BlobReader(file));
 try {
  const entries = [];
  for await (const entry of reader.getEntriesGenerator()) {
   if (entries.length >= 100000) throw Error('This archive has too many entries (100,000 maximum).');
   if (!entry.directory && !entry.filename.includes('__MACOSX')) entries.push(entry);
  }
  return {reader, entries};
 } catch(error) {await reader.close(); throw error;}
}
export async function readEntry(entry, limit = MAX_ENTRY_BYTES) {
 if (entry.uncompressedSize > limit) throw Error(`File exceeds the ${Math.round(limit / 1024 ** 2)} MB per-file processing limit.`);
 let length = 0;
 const parts = [];
 await entry.getData(new WritableStream({write(chunk) {
  length += chunk.length;
  if (length > limit) throw Error('Expanded file exceeds the processing limit.');
  parts.push(chunk);
 }}), {checkSignature:true});
 const data = new Uint8Array(length); let offset = 0;
 for (const part of parts) {data.set(part,offset); offset+=part.length;}
 return data;
}
