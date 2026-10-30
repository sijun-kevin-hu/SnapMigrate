import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ZipWriter, BlobWriter, TextReader } from '@zip.js/zip.js';
import { openArchive, readEntry, MAX_ARCHIVE_BYTES } from '../src/archive.js';
test('archive indexing is lazy and extraction enforces per-file limits', async()=>{
 const writer = new ZipWriter(new BlobWriter());
 await writer.add('memories_history.json',new TextReader('{"Saved Media":[]}'));
 await writer.add('large.txt',new TextReader('a'.repeat(1024 * 1024)), {level:0});
 const blob = await writer.close();
 // Reject eager full-file reads; BlobReader must use slices.
 blob.arrayBuffer = () => {throw Error('Whole archive was read');};
 const archive = await openArchive(blob);
 assert.equal(archive.entries.length,2);
 assert.equal(new TextDecoder().decode(await readEntry(archive.entries[0])), '{"Saved Media":[]}');
 await assert.rejects(readEntry(archive.entries[1],100), /limit/);
 await archive.reader.close();
 await assert.rejects(openArchive({size:MAX_ARCHIVE_BYTES+1}), /2.5/);
});
