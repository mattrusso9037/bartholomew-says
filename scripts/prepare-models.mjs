/** Bake web-sized copies of the supplied Meshy models. The source files stay untouched.
 * Uses meshoptimizer (already supplied by drei) and sharp (already supplied by Next).
 * Usage: node scripts/prepare-models.mjs /path/to/source/models
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MeshoptSimplifier } from 'meshoptimizer/simplifier';
await MeshoptSimplifier.ready;
const source = process.argv[2];
if (!source) throw new Error('Pass the directory containing the three original Meshy GLBs.');
const specs = [
 ['Meshy_AI_Grumblethorn_0919143429_texture.glb', 'bartholomew', 65000, 2048],
 ['Meshy_AI_Leather_Bound_Book_0919143421_texture.glb', 'leather-book', 12000, 1024],
 ['Meshy_AI_Moonlit_Silk_Moth_0919143413_texture.glb', 'silk-moth', 6000, 512],
];
for (const [file,name,target,size] of specs) {
 const input=await fs.readFile(path.join(source,file)); const jsonLength=input.readUInt32LE(12);
 const j=JSON.parse(input.subarray(20,20+jsonLength)); const binStart=20+jsonLength+8;
 function accessor(index){const a=j.accessors[index],v=j.bufferViews[a.bufferView];const stride={VEC2:2,VEC3:3,SCALAR:1}[a.type];const C=a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:Uint16Array;const b=input.subarray(binStart+(v.byteOffset||0)+(a.byteOffset||0),binStart+(v.byteOffset||0)+(a.byteOffset||0)+a.count*stride*C.BYTES_PER_ELEMENT);return new C(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
 const p=j.meshes[0].primitives[0], positions=accessor(p.attributes.POSITION),normals=accessor(p.attributes.NORMAL),uvs=accessor(p.attributes.TEXCOORD_0),indices=new Uint32Array(accessor(p.indices));
 const attributes=new Float32Array(positions.length/3*5);
 for(let i=0;i<positions.length/3;i++)attributes.set([...normals.subarray(i*3,i*3+3),...uvs.subarray(i*2,i*2+2)],i*5);
 const [simple,error]=MeshoptSimplifier.simplifyWithAttributes(indices,positions,3,attributes,5,[.03,.03,.03,.1,.1],null,target*3,.02,['Permissive']);
 const [remap,count]=MeshoptSimplifier.compactMesh(simple);
 const compact=(array,stride)=>{const dest=new Float32Array(count*stride);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff)dest.set(array.subarray(i*stride,i*stride+stride),remap[i]*stride);return dest;};
 const pos=compact(positions,3),norm=compact(normals,3),uv=compact(uvs,2);
 const chunks=[],views=[],accessors=[];let offset=0;
 function add(data,target){const b=Buffer.from(data.buffer,data.byteOffset,data.byteLength);const v={buffer:0,byteOffset:offset,byteLength:b.length,...(target?{target}:{})};views.push(v);const pad=Buffer.alloc((4-b.length%4)%4);chunks.push(b,pad);offset+=b.length+pad.length;return views.length-1;}
 function attr(data,type,componentType,stride,bounds=false){const view=add(data,type==='SCALAR'?34963:34962);const a={bufferView:view,componentType,count:data.length/stride,type};if(bounds){a.min=Array(stride).fill(Infinity);a.max=Array(stride).fill(-Infinity);for(let i=0;i<data.length;i++){a.min[i%stride]=Math.min(a.min[i%stride],data[i]);a.max[i%stride]=Math.max(a.max[i%stride],data[i]);}}accessors.push(a);return accessors.length-1;}
 const attrs={POSITION:attr(pos,'VEC3',5126,3,true),NORMAL:attr(norm,'VEC3',5126,3),TEXCOORD_0:attr(uv,'VEC2',5126,2)};
 const index=attr(count<65536?new Uint16Array(simple):simple,'SCALAR',count<65536?5123:5125,1);
 const images=[];
 for(let i=0;i<j.images.length;i++){const view=j.bufferViews[j.images[i].bufferView];const original=input.subarray(binStart+(view.byteOffset||0),binStart+(view.byteOffset||0)+view.byteLength);const resized=await sharp(original).resize(size,size,{fit:'inside',withoutEnlargement:true}).jpeg({quality:i===0?88:92,chromaSubsampling:'4:4:4'}).toBuffer();images.push({mimeType:'image/jpeg',bufferView:add(resized)});}
 const result={asset:{version:'2.0',generator:'Bartholomew web asset preparation',extras:{source:file}},scene:0,scenes:[{nodes:[0]}],nodes:[{name,mesh:0}],meshes:[{name,primitives:[{attributes:attrs,indices:index,material:0}]}],materials:j.materials,textures:j.textures,samplers:j.samplers,images,accessors,bufferViews:views,buffers:[{byteLength:offset}]};
 let json=Buffer.from(JSON.stringify(result));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(chunks);const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+8+bin.length,8);const jhead=Buffer.alloc(8);jhead.writeUInt32LE(json.length,0);jhead.writeUInt32LE(0x4e4f534a,4);const bhead=Buffer.alloc(8);bhead.writeUInt32LE(bin.length,0);bhead.writeUInt32LE(0x004e4942,4);
 const output=Buffer.concat([header,jhead,json,bhead,bin]);await fs.writeFile(new URL(`../public/models/${name}.glb`,import.meta.url),output);
 console.log(`${name}: ${indices.length/3} -> ${simple.length/3} triangles; ${(input.length/1048576).toFixed(1)} -> ${(output.length/1048576).toFixed(2)} MB; error ${error.toFixed(5)}`);
}
