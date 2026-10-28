import { defineConfig } from 'vite';
import { readFileSync, rmSync } from 'node:fs';
import { resolve, sep } from 'node:path';
// Marketing covers are imported alongside art but never shipped as runtime assets.
export default defineConfig({
 base:'./',
 build:{outDir:'dist-crazygames',target:'es2022'},
 server:{port:5173},
 plugins:[{
  name:'exclude-marketing-covers',
  closeBundle(){
   const out=resolve('dist-crazygames');
   const manifest=JSON.parse(readFileSync('public/art-manifest.json','utf8')) as Record<string,{runtime:boolean;path:string|null}>;
   for(const spec of Object.values(manifest))if(!spec.runtime&&spec.path){
    const path=resolve(out,spec.path);
    if(path.startsWith(out+sep))rmSync(path,{force:true});
   }
  },
 }],
});
