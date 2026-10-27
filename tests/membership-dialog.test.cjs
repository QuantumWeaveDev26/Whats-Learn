const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {pathToFileURL}=require('node:url');
const {test}=require('node:test');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const ts=require('typescript');

const testUrl=pathToFileURL(__filename);
const source=new URL('../components/whatslearn/membership.tsx',testUrl);
function compile(file,load){
 const output=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',output)(load,module,module.exports);
 return module.exports;
}
const catalogue=compile(new URL('../lib/billing/catalogue.ts',testUrl),require);
const Dialog=({children})=>children;
const container=({children})=>React.createElement('div',null,children);
const nothing=()=>null;

// Keep the real component and its event handlers. Only host hooks and external
// boundaries: no DOM/test-renderer dependency, network, checkout or animation timer.
function mount(){
 const state=[];let cursor=0;
 const hooks={useEffect(){},useRef:value=>({current:value}),useState(initial){
  const index=cursor++;
  if(!(index in state))state[index]=initial;
  return [state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value}];
 }};
 const {default:Membership}=compile(source,id=>{
  if(id==='react')return hooks;
  if(id==='@/lib/billing/catalogue')return catalogue;
  if(id==='@/lib/contact')return {whatsappChatUrl:()=> '#',whatsappLinkProps:{}};
  if(id==='@/components/ui/dialog')return {Dialog,DialogContent:container,DialogTitle:container,DialogDescription:container};
  if(id==='@/components/ui/tabs')return {Tabs:container,TabsList:container,TabsTrigger:container};
  if(id==='lucide-react')return {Check:nothing,ArrowRight:nothing,ShieldCheck:nothing};
  if(id.startsWith('./'))return {default:nothing};
  return require(id);
 });
 return ()=>{cursor=0;return Membership({presentation:'cards'})};
}
function find(element,predicate){
 if(!element||typeof element!=='object')return undefined;
 if(predicate(element))return element;
 for(const child of React.Children.toArray(element.props?.children)){
  const result=find(child,predicate);if(result)return result;
 }
}
function dialog(tree){return find(tree,node=>node.type===Dialog)}

test('closing a plan retains its title and price for the exit render, then another plan can open',()=>{
 const render=mount();
 for(const [name,price] of [['Plus','199'],['Pro','499'],['Teams','399']]){
  const tree=render();
  const card=find(tree,node=>node.type==='article'&&renderToStaticMarkup(node).includes(`<h3>${name}</h3>`));
  find(card,node=>node.type==='button').props.onClick();
  const opened=dialog(render());
  assert.equal(opened.props.open,true);
  assert.match(renderToStaticMarkup(opened.props.children),new RegExp(`${name} membership`));
  opened.props.onOpenChange(false);
  const closed=dialog(render());
  assert.equal(closed.props.open,false);
  const exitMarkup=renderToStaticMarkup(closed.props.children);
  assert.match(exitMarkup,new RegExp(`${name} membership`));
  assert.match(exitMarkup,new RegExp(`₹${price}`));
  assert.doesNotMatch(exitMarkup,/undefined membership|₹0</);
 }
});
