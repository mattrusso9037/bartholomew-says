import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('mobile character preserves every geometry, skin, and animation buffer', async () => {
  const read = async name => {
    const bytes = await readFile(new URL(`../public/models/${name}.glb`, import.meta.url));
    const length = bytes.readUInt32LE(12);
    return { json: JSON.parse(bytes.subarray(20, 20 + length)), bin: bytes.subarray(28 + length), bytes };
  };
  const desktop = await read('bartholomew-animated');
  const mobile = await read('bartholomew-mobile');
  for (const key of ['meshes', 'skins', 'nodes', 'animations', 'accessors']) {
    assert.deepEqual(mobile.json[key], desktop.json[key], key);
  }
  const imageViews = new Set(desktop.json.images.map(image => image.bufferView));
  for (const [index, view] of desktop.json.bufferViews.entries()) {
    if (imageViews.has(index)) continue;
    const other = mobile.json.bufferViews[index];
    assert.deepEqual(mobile.bin.subarray(other.byteOffset, other.byteOffset + other.byteLength),
      desktop.bin.subarray(view.byteOffset, view.byteOffset + view.byteLength), `buffer ${index}`);
  }
  assert.ok(mobile.bytes.length < desktop.bytes.length * 0.7);
});
