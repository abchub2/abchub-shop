'use strict';
const RELEASE='20261112-ai1';
const CACHE_PREFIX='leesfarm-shell-';
const CACHE_NAME=CACHE_PREFIX+RELEASE;
const BASE=new URL('./',self.location.href);
const SHELL=[
  './index.html','./product.html','./offline.html','./manifest.webmanifest',
  `./shop.css?v=${RELEASE}`,`./catalog.js?v=${RELEASE}`,`./app.js?v=${RELEASE}`,`./pwa.js?v=${RELEASE}`,
  ...Array.from({length:6},(_,i)=>`./assets/ai/food-${i}.jpg`),
  './assets/fonts/PretendardVariable.woff2',
  'assets/soy-tofu-1.jpg','assets/shinano-gold-bag-1.jpg','assets/carrot-bag-1.jpg',
  'assets/shine-muscat-1.jpg','assets/fuji-5kg-1.jpg','assets/fuji-5kg-2.jpg','assets/fuji-5kg-3.jpg','assets/fuji-10kg-2.jpg','assets/fuji-10kg-1.jpg',
  './assets/shinano-gold-1.jpg','./assets/shinano-gold-2.jpg','./assets/shinano-gold-3.jpg',
  './assets/grape-bunch.jpg','./assets/citrus-fruit.jpg','./assets/fresh-apples.jpg','./assets/farm.svg',
  './assets/icons/app-icon.svg','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/icon-maskable-512.png','./assets/icons/apple-touch-icon.png'
].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>{
  // Install a complete version atomically; an incomplete download cannot replace the app.
  event.waitUntil((async()=>{
    try{
      const cache=await caches.open(CACHE_NAME);
      await cache.addAll(SHELL.map(url=>new Request(url,{cache:'reload'})));
    }catch(error){await caches.delete(CACHE_NAME);throw error;}
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const name of await caches.keys())if(name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME)await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  const path=url.pathname.slice(BASE.pathname.length);
  // Never serve cached prices, stock, admin pages or authentication responses.
  if(path==='products.json'||path==='order-config.json'){
    event.respondWith(fetch(new Request(request,{cache:'no-store'})).catch(()=>new Response('{"error":"catalog_unavailable"}',{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})));
    return;
  }
  if(/^admin(?:\.html|\.js|\.css)$/.test(path)){
    event.respondWith(fetch(new Request(request,{cache:'no-store'})).catch(()=>request.mode==='navigate'?caches.match(new URL('./offline.html',BASE).href):Response.error()));
    return;
  }
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{return await fetch(new Request(request,{cache:'no-cache'}));}
      catch(_){
        const home=path===''||path==='index.html';
        return (await caches.match(new URL(home?'./index.html':'./offline.html',BASE).href))||Response.error();
      }
    })());
    return;
  }
  if(SHELL.includes(url.href)){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
  }
});
