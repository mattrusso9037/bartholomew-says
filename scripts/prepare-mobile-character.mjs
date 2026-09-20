/** Keep the complete rig and animations, with 1K PBR maps for phone-sized rendering.
 * Run after prepare-character.mjs: node scripts/prepare-mobile-character.mjs
 * sharp is already supplied by Next.js.
 */
import fs from 'node:fs/promises';
import sharp from 'sharp';

const dir = new URL('../public/models/', import.meta.url);
const input = await fs.readFile(new URL('bartholomew-animated.glb', dir));
const jsonLength = input.readUInt32LE(12);
const json = JSON.parse(input.subarray(20, 20 + jsonLength));
const bin = input.subarray(28 + jsonLength);
const chunks = [];
let offset = 0;
for (const [index, view] of json.bufferViews.entries()) {
  let bytes = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  const image = json.images?.find(image => image.bufferView === index);
  if (image) {
    bytes = await sharp(bytes).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toBuffer();
    image.mimeType = 'image/jpeg';
  }
  view.byteOffset = offset;
  view.byteLength = bytes.length;
  const padding = Buffer.alloc((4 - bytes.length % 4) % 4);
  chunks.push(bytes, padding);
  offset += bytes.length + padding.length;
}
json.buffers[0].byteLength = offset;
const text = Buffer.from(JSON.stringify(json));
const jsonBytes = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 0x20)]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + jsonBytes.length + offset, 8);
header.writeUInt32LE(jsonBytes.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(offset, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
const output = Buffer.concat([header, jsonBytes, binHeader, ...chunks]);
await fs.writeFile(new URL('bartholomew-mobile.glb', dir), output);
console.log(`Mobile character: ${(input.length / 1048576).toFixed(2)} -> ${(output.length / 1048576).toFixed(2)} MiB`);
