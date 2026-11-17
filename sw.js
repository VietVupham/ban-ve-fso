const V="bv-v5",SH=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"],CH="bv-chunks";
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SH)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==CH).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("message",e=>{const keep=e.data&&e.data.keep;if(!keep)return;const ok=new Set(keep.map(u=>new URL(u,self.registration.scope).href));e.waitUntil(caches.open(CH).then(c=>c.keys().then(ks=>Promise.all(ks.filter(r=>!ok.has(r.url)).map(r=>c.delete(r))))))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
 if(u.pathname.includes("/data/c/")){e.respondWith(caches.open(CH).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}))));return}
 if(/\/qr\/(zxing|jsQR)/.test(u.pathname)){e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}))));return}
 /* trang, dữ liệu, version: ưu tiên mạng, mất mạng thì dùng bản đã lưu */
 e.respondWith(fetch(r).then(res=>{if(res.ok&&u.origin===location.origin){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r,{ignoreSearch:true})))});
