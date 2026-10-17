export type ProjectFile={name:string;source:string};
export const sampleProject:ProjectFile[]=[{name:'main.js',source:"const {quote} = require('./pricing.js');\nmodule.exports = {normal: quote(3), invalid: quote(-1)};"},{name:'pricing.js',source:"exports.quote = count => count > 0 ? {total:count*150,accepted:true} : {total:0,accepted:false};"}];
/** All modules still execute inside QuickJS. This never loads files or Node modules. */
export function bundleProject(files:ProjectFile[],entry:string){
 if(files.length<1||files.length>6||files.some(f=>!/^([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.js$/.test(f.name))||new Set(files.map(f=>f.name)).size!==files.length)throw new Error('Use 1–6 uniquely named .js files.');
 if(!files.some(f=>f.name===entry))throw new Error('Select an existing entry file.');
 if(files.reduce((n,f)=>n+f.source.length,0)>8000)throw new Error('Project source limit is 8,000 characters.');
 const source=JSON.stringify(Object.fromEntries(files.map(f=>[f.name,f.source])));
 return `// Local multi-file project. Isolated execution; no external modules.\n(function(){\n const files=${source}, cache=Object.create(null);\n function load(id){\n  if(!Object.prototype.hasOwnProperty.call(files,id))throw new Error('Local module missing: '+id);\n  if(Object.prototype.hasOwnProperty.call(cache,id))return cache[id].exports;\n  const module={exports:{}}; cache[id]=module;\n  const require=function(name){\n   if(typeof name!=='string'||!name.startsWith('./'))throw new Error('Only ./ local imports are supported');\n   const base=id.split('/');base.pop();\n   for(const part of name.slice(2).split('/')){if(part==='..')throw new Error('Parent paths are not supported');if(part&&part!=='.')base.push(part);}\n   let target=base.join('/');if(!target.endsWith('.js'))target+='.js';return load(target);\n  };\n  new Function('module','exports','require',files[id])(module,module.exports,require);\n  return module.exports;\n }\n return load(${JSON.stringify(entry)});\n})()`;
}
