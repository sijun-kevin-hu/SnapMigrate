import { test } from 'node:test';
import assert from 'node:assert/strict';
import piexif from 'piexifjs';
import { parseExportDate, metadataIndex, writeJpegTimestamp, writeMp4Timestamp, repairAsset } from '../src/timestamps.js';
const date = new Date('2020-02-29T23:45:12Z');
const box = (name, data) => { const b=Buffer.alloc(8+data.length);b.writeUInt32BE(b.length);b.write(name,4);data.copy(b,8);return b; };
function movie(version=0) {
 const header = () => {const b=Buffer.alloc(100);b[0]=version;return b;};
 return Buffer.concat([box('ftyp',Buffer.from('isom0000')),box('moov',Buffer.concat([box('mvhd',header()),box('trak',Buffer.concat([box('tkhd',header()),box('mdia',box('mdhd',header()))]))])),box('mdat',Buffer.from([1,2,3,4,5]))]);
}
test('export dates require timezones and reject impossible dates',()=>{
 assert.equal(parseExportDate('2020-02-29 23:45:12 UTC').toISOString(),date.toISOString());
 assert.equal(parseExportDate('2020-03-01T01:45:12+02:00').toISOString(),date.toISOString());
 for(const value of ['2023-02-29 12:00:00 UTC','2020-01-01','2020-01-01 12:00:00','invalid']) assert.equal(parseExportDate(value),null);
});
test('duplicate names are ambiguous, repeated fields on one entry are not',()=>{
 const entry={Filename:'a.jpg','Download Link':'https://example.com/a.jpg'};
 assert.equal(metadataIndex([entry]).get('a.jpg'),entry);
 assert.equal(metadataIndex([entry,{Filename:'a.jpg'}]).get('a.jpg'),null);
});
test('JPEG timestamps round-trip, orientation and encoded scan bytes survive',()=>{
 // Minimal JPEG marker fixture: EXIF operations must leave scan bytes untouched.
 const scan=Buffer.from([255,218,0,2,17,34,51,255,217]);
 const original=Buffer.concat([Buffer.from([255,216]),scan]).toString('binary');
 const tagged=piexif.insert(piexif.dump({'0th':{274:6,271:'Test camera'},Exif:{},GPS:{},'1st':{},thumbnail:null}),original);
 const input=Uint8Array.from(tagged,c=>c.charCodeAt(0)), before=input.slice();
 const output=writeJpegTimestamp(input,date), read=piexif.load(Buffer.from(output).toString('binary'));
 assert.equal(read.Exif[36867],'2020:02:29 23:45:12');assert.equal(read.Exif[36868],'2020:02:29 23:45:12');assert.equal(read.Exif[36881],'+00:00');assert.equal(read['0th'][274],6);assert.equal(read['0th'][271],'Test camera');
 assert.deepEqual(Buffer.from(output).subarray(-scan.length),scan);assert.deepEqual(input,before);
});
for(const version of [0,1]) test(`MP4 v${version} changes only all six date fields`,()=>{
 const original=movie(version), before=Buffer.from(original), result=writeMp4Timestamp(original,date);
 const expected=Buffer.from(original), seconds=BigInt(date.getTime()/1000)+2082844800n;
 for(const name of ['mvhd','tkhd','mdhd']) {
  const start=expected.indexOf(name)+8;
  for(const offset of [start,start+(version?8:4)]) version?expected.writeBigUInt64BE(seconds,offset):expected.writeUInt32BE(Number(seconds),offset);
 }
 assert.deepEqual(Buffer.from(result),expected);assert.deepEqual(original,before);
});
test('malformed and out-of-range MP4s fail without changing original',()=>{
 const original=movie(), before=Buffer.from(original);
 assert.throws(()=>writeMp4Timestamp(original,new Date('2041-01-01Z')),/2040/);
 assert.deepEqual(original,before);
 assert.throws(()=>writeMp4Timestamp(original.subarray(0,-2),date),/size/);
 assert.throws(()=>writeMp4Timestamp(new Uint8Array([1,2,3]),date),/Truncated/);
});
test('unverified filename dates and unsupported formats are never written',()=>{
 assert.throws(()=>repairAsset({name:'a.jpg',source:'Filename (unverified)',date}),/timestamp/);
 assert.throws(()=>repairAsset({name:'a.png',source:'Export metadata',date}),/JPG and MP4/);
});

test('ZIP UTC dates require explicit field and filename day agreement',async()=>{
 const {zipUtcTimestamp}=await import('../src/timestamps.js');
 const data=new Uint8Array(5);data[0]=1;new DataView(data.buffer).setUint32(1,date.getTime()/1000,true);
 const entry={extraField:new Map([[0x5455,{data}]])};
 assert.equal(zipUtcTimestamp(entry,'2020-02-29_id-main.jpg').toISOString(),date.toISOString());
 assert.equal(zipUtcTimestamp(entry,'2020-03-01_id.jpg'),null);
 assert.equal(zipUtcTimestamp({lastModDate:date},'2020-02-29_id.jpg'),null);
 assert.equal(zipUtcTimestamp({extraField:new Map([[0x5455,{data:new Uint8Array(2)}]])},'2020-02-29_id.jpg'),null);
 const result=repairAsset({name:'test.mp4',date,source:'ZIP UTC timestamp',data:movie()});
 assert.equal(result.length,movie().length);
});
