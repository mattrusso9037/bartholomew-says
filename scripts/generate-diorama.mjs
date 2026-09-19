/** Original procedural stone PBR maps and ivy artwork. No third-party art.
 * Run: node scripts/generate-diorama.mjs
 */
import sharp from 'sharp';
const out = new URL('../public/', import.meta.url);
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
const hash = (x,y,z=0) => { const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453; return n-Math.floor(n); };
function noise(x,y,z=0) {
  const a=Math.floor(x), b=Math.floor(y), c=Math.floor(z);
  const smooth=t=>t*t*(3-2*t); const u=smooth(x-a),v=smooth(y-b),w=smooth(z-c);
  const mix=(a,b,t)=>a+(b-a)*t;
  return mix(mix(mix(hash(a,b,c),hash(a+1,b,c),u),mix(hash(a,b+1,c),hash(a+1,b+1,c),u),v),mix(mix(hash(a,b,c+1),hash(a+1,b,c+1),u),mix(hash(a,b+1,c+1),hash(a+1,b+1,c+1),u),v),w);
}
function fbm(x,y,z=0) { return noise(x,y,z)*.55+noise(x*2,y*2,z*2)*.25+noise(x*4,y*4,z*4)*.13+noise(x*8,y*8,z*8)*.07; }
// Tileable surfaces, with independent roughness and height information.
const N=512;
for(const kind of ['stone']) {
 const color=Buffer.alloc(N*N*3),height=Buffer.alloc(N*N),rough=Buffer.alloc(N*N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++) {
  const i=y*N+x,u=x/N,v=y/N;
  // Periodic coordinates keep opposing texture edges continuous.
  const a=Math.cos(u*Math.PI*2),b=Math.sin(u*Math.PI*2),c=Math.cos(v*Math.PI*2),d=Math.sin(v*Math.PI*2);
  const n=fbm(a*3+c,b*3+d,c*3+a),grain=hash(x,y),fine=noise(a*55+c*23,b*55+d*23,c*40);
  let base,h,r;
  if(kind==='stone') {const pores=grain>.96?-35:0;base=120+n*75+(fine-.5)*26+pores;h=n*125+fine*65+pores;r=210+n*35;}
  else if(kind==='leather'){const cell=Math.abs(Math.sin(x*.81+noise(a*9,b*9,c*9)*6)*Math.cos(y*.83+n*8));base=91+n*65+cell*23;h=55+cell*95+n*65;r=135+n*70+cell*25;}
  else {const line=hash(0,y);base=155+line*65+(n-.5)*35;h=line*200;r=210+line*35;}
  for(let k=0;k<3;k++)color[i*3+k]=clamp((base+(kind==='stone'?[5,5,0]:kind==='pages'?[12,3,-21]:[0,0,0])[k])/255)*255;
  height[i]=clamp(h/255)*255;rough[i]=clamp(r/255)*255;
 }
 await sharp(color,{raw:{width:N,height:N,channels:3}}).webp({quality:88}).toFile(new URL(`textures/${kind}-color.webp`,out).pathname);
 await sharp(height,{raw:{width:N,height:N,channels:1}}).png().toFile(new URL(`textures/${kind}-height.png`,out).pathname);
 await sharp(rough,{raw:{width:N,height:N,channels:1}}).png().toFile(new URL(`textures/${kind}-roughness.png`,out).pathname);
}
// Original botanical and lepidopteran artwork, alpha-cut for the actual mesh silhouettes.
const leaf=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><radialGradient id="g"><stop stop-color="#89915a"/><stop offset=".5" stop-color="#455e32"/><stop offset="1" stop-color="#233d29"/></radialGradient><filter id="n"><feTurbulence baseFrequency=".13" numOctaves="3" seed="8"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="soft-light"/></filter></defs><path d="M128 232 C102 213 63 237 51 205 L70 160 Q36 163 12 151 Q42 124 47 92 L93 109 Q104 56 129 14 Q147 50 161 105 L212 82 Q207 120 246 147 Q204 161 185 165 L204 203 Q176 232 140 223 L134 244Z" fill="url(#g)" stroke="#96a16a" stroke-width="1.4" filter="url(#n)"/><g fill="none" stroke="#afad77" stroke-width="1.6" opacity=".6"><path d="M131 238 L129 32 M130 180 L29 149 M130 180 L229 148 M131 212 L sixty 208"/><path d="M129 171 L62 105 M130 172 L201 99 M130 210 L65 205 M132 212 L193 204"/></g><g stroke="#abb27e" stroke-width=".65" opacity=".35"><path d="M129 78 L115 94 M130 100 L148 114 M129 129 L107 145 M130 154 L155 138 M79 159 L74 137 M179 160 L190 133 M104 193 L92 210 M153 193 L165 213"/></g></svg>`;
await sharp(Buffer.from(leaf.replace(' L sixty 208',''))).png().toFile(new URL('textures/ivy.png',out).pathname);
console.log('Baked stone and ivy textures.');
