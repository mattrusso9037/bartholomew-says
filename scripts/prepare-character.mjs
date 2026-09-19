/** Consolidate the compatible supplied rigs into one web asset. Originals are untouched. */
import fs from 'node:fs/promises';
import sharp from 'sharp';

const dir = new URL('../public/models/', import.meta.url);
const sources = [
  ['Meshy_AI_Grumblethorn_Chair_Sit_Idle_M.glb', 'Seated'],
  ['Meshy_AI_Grumblethorn_Step_to_Sit_Transitio.glb', 'SitDown'],
  ['Meshy_AI_Grumblethorn_01a0ba80_86b6_76e9_9d-sleep.glb', 'CurlUp'],
  ['Meshy_AI_Grumblethorn_biped_Animation_Sleep_on_Desk_withSkin.glb', 'Drowsy'],
];
async function read(file) {
  const buffer = await fs.readFile(new URL(file, dir));
  const length = buffer.readUInt32LE(12);
  return { json: JSON.parse(buffer.subarray(20, 20 + length)), bin: buffer.subarray(28 + length) };
}
const base = await read(sources[0][0]);
const result = structuredClone(base.json);
const chunks = [];
let offset = 0;
function addView(bytes, original = {}) {
  const index = result.bufferViews.length;
  result.bufferViews.push({ ...original, buffer: 0, byteOffset: offset, byteLength: bytes.length });
  const padding = Buffer.alloc((4 - bytes.length % 4) % 4);
  chunks.push(bytes, padding);
  offset += bytes.length + padding.length;
  return index;
}
result.bufferViews = [];
for (let i = 0; i < base.json.bufferViews.length; i++) {
  const view = base.json.bufferViews[i];
  let bytes = base.bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  const image = result.images?.find(image => image.bufferView === i);
  if (image) {
    bytes = await sharp(bytes).resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toBuffer();
    image.mimeType = 'image/jpeg';
  }
  addView(bytes, view);
}
result.animations = [];
for (const [filename, name] of sources) {
  const { json, bin } = await read(filename);
  const views = new Map(), accessors = new Map();
  function copyAccessor(index) {
    if (accessors.has(index)) return accessors.get(index);
    const accessor = structuredClone(json.accessors[index]);
    const view = json.bufferViews[accessor.bufferView];
    if (!views.has(accessor.bufferView)) {
      views.set(accessor.bufferView, addView(bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength), view));
    }
    accessor.bufferView = views.get(accessor.bufferView);
    const target = result.accessors.length;
    result.accessors.push(accessor);
    accessors.set(index, target);
    return target;
  }
  const clip = structuredClone(json.animations[0]);
  clip.name = name;
  for (const sampler of clip.samplers) {
    sampler.input = copyAccessor(sampler.input);
    sampler.output = copyAccessor(sampler.output);
  }
  for (const channel of clip.channels) {
    const boneName = json.nodes[channel.target.node].name;
    const target = result.nodes.findIndex(node => node.name === boneName);
    if (target < 0) throw new Error(`Incompatible skeleton: ${boneName}`);
    channel.target.node = target;
  }
  result.animations.push(clip);
}
result.asset.generator = 'Bartholomew compatible-rig consolidation';
result.asset.extras = { sources: sources.map(([file]) => file) };
result.buffers = [{ byteLength: offset }];
let json = Buffer.from(JSON.stringify(result));
json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
const bin = Buffer.concat(chunks);
const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + json.length + bin.length, 8);
jsonHeader.writeUInt32LE(json.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
binHeader.writeUInt32LE(bin.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
const output = Buffer.concat([header, jsonHeader, json, binHeader, bin]);
await fs.writeFile(new URL('bartholomew-animated.glb', dir), output);
console.log(`One skinned model, ${result.animations.length} clips, ${(output.length / 1048576).toFixed(2)} MB`);
