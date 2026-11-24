import manifest from './manifest.json';

export function GET(){
 return Response.json(manifest,{headers:{
  'Content-Type':'application/manifest+json; charset=utf-8',
  'Cache-Control':'no-cache',
 }});
}
