const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const workerSource=fs.readFileSync(path.join(root,'sw.js'),'utf8');
function worker({networkFailure=false}={}){
 const events={},calls=[],cached=[];
 const context={URL,Request,Response,Uint8Array,Error,
  self:{location:{href:'https://www.abchub.kr/sw.js'},clients:{claim:async()=>{}},addEventListener:(type,handler)=>events[type]=handler,skipWaiting:()=>calls.push('skipWaiting')},
  caches:{match:async()=>new Response('cached'),open:async()=>({addAll:async requests=>cached.push(...requests.map(r=>r.url))}),keys:async()=>[],delete:async()=>true},
  fetch:async request=>{calls.push(request);if(networkFailure)throw new TypeError('offline');return new Response('{}',{headers:{'Content-Type':'application/json'}})}
 };
 vm.runInNewContext(workerSource,context);
 return {events,calls,cached};
}
test('manifest supports an installed Korean standalone app',()=>{
 assert.equal(manifest.lang,'ko');assert.equal(manifest.display,'standalone');
 const scope=new URL(manifest.scope,'https://www.abchub.kr/');
 assert(new URL(manifest.start_url,scope).href.startsWith(scope.href));
 assert(manifest.icons.some(i=>i.sizes==='192x192'));
 assert(manifest.icons.some(i=>i.sizes==='512x512'&&i.purpose==='maskable'));
});
test('all declared PNG icons exist and have the declared pixel dimensions',()=>{
 for(const icon of [...manifest.icons,{src:'assets/icons/apple-touch-icon.png',sizes:'180x180'}]){
  const data=fs.readFileSync(path.join(root,icon.src));const [width,height]=icon.sizes.split('x').map(Number);
  assert.equal(data.toString('ascii',1,4),'PNG');assert.equal(data.readUInt32BE(16),width);assert.equal(data.readUInt32BE(20),height);
 }
});
test('shell install excludes catalog, administrator files and external responses',async()=>{
 const w=worker();let install;w.events.install({waitUntil:p=>install=p});await install;
 assert(w.cached.length>=15);
 assert(w.cached.every(url=>url.startsWith('https://www.abchub.kr/')));
 assert(!w.cached.some(url=>/products\.json|admin\.|api\.github/.test(url)));
 for(const url of w.cached){const pathname=new URL(url).pathname;assert(fs.existsSync(path.join(root,pathname)));}
});
test('prices and inventory always use the network without browser cache',async()=>{
 const w=worker();let result;w.events.fetch({request:new Request('https://www.abchub.kr/products.json'),respondWith:p=>result=p});await result;
 assert.equal(w.calls[0].cache,'no-store');
});
test('authenticated cross-origin calls and writes are never intercepted',()=>{
 const w=worker();let intercepted=false;
 for(const request of [new Request('https://api.github.com/repos/abchub2/abchub-shop'),new Request('https://www.abchub.kr/products.json',{method:'PUT',body:'{}'})])w.events.fetch({request,respondWith:()=>intercepted=true});
 assert.equal(intercepted,false);
});
test('administrator pages bypass the shell cache',async()=>{
 const w=worker();let result;w.events.fetch({request:new Request('https://www.abchub.kr/admin.html'),respondWith:p=>result=p});await result;assert.equal(w.calls[0].cache,'no-store');
});
test('a new worker waits for an explicit update request',async()=>{
 const w=worker();let install;w.events.install({waitUntil:p=>install=p});await install;
 assert(!w.calls.includes('skipWaiting'));w.events.message({data:{type:'IGNORED'}});assert(!w.calls.includes('skipWaiting'));w.events.message({data:{type:'SKIP_WAITING'}});assert(w.calls.includes('skipWaiting'));
});

test('an offline catalog request fails instead of returning stale inventory',async()=>{
 const w=worker({networkFailure:true});let result;
 w.events.fetch({request:new Request('https://www.abchub.kr/products.json'),respondWith:p=>result=p});
 const response=await result;assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal((await response.json()).error,'catalog_unavailable');
});
test('the HTML and service worker refer to the same shell version',async()=>{
 const w=worker();let install;w.events.install({waitUntil:p=>install=p});await install;
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const assets=[...html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css)\?[^" ]+)"/g)].map(match=>new URL(match[1],'https://www.abchub.kr/').href);
 assert.equal(assets.length,4);for(const asset of assets)assert(w.cached.includes(asset),`uncached shell asset ${asset}`);
});
