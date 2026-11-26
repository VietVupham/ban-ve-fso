/* Trợ lý hỏi đáp – Bản vẽ & BPTC FSO
   Tầng 1 (luôn miễn phí, chạy trong app): tìm các trang liên quan + trả lời số liệu tiến độ từ dữ liệu có sẵn.
   Tầng 2 (miễn phí nếu còn hạn mức): gửi câu hỏi + vài trang liên quan lên hàm "chat" trên Supabase, hàm gọi AI gói miễn phí. */
(function(){
"use strict";
const EP='https://ppdxqcrckbwckqzumlwy.supabase.co/functions/v1/chat',KEY='sb_publishable_obBOmHzVr55kpb2eG2BwAQ_wcNW7tkg';
const $=s=>document.querySelector(s),E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STOP=new Set('la cua va cho cac co khong bao nhieu the nao gi khi o trong theo duoc can may hay biet ve tai den tu mot nhung nay do voi de thi se da dang ra vao len xuong sao tren duoi hoac nhu neu thay hoi minh toi em anh ban oi vay a nhe nhi giup cho'.split(' '));
const SUG=['Zone nào đang chậm tiến độ?','Khi nào đổ bê tông Z3.2?','Hôm nay quân kế hoạch và thực tế bao nhiêu?','Biện pháp cốp pha đất dùng xà gồ bước bao nhiêu?','Thép về công trường khi nào?'];
let IDX=null,MSG=[],busy=false,HIST=[],aiOff=false,WHO='';
try{WHO=localStorage.getItem('bv_who')||''}catch(e){}
const isQ=q=>/\?|bao nhieu|khi nao|o dau|\bnao\b|\bsao\b|\bgi\b|khong|the nao|bao lau|\bmay\b|cho toi|\btim\b|\bmo\b|\bxem\b/.test(normQ(q));
const wantSrc=q=>/tim|ban ve nao|o dau|trang|mo |lien quan|tai lieu|xem |danh muc|dau muc|ban ve|bptc|shop/.test(normQ(q));
let tdp=null;const loadTD=()=>window.TD&&window.TD.facts?Promise.resolve():(tdp=tdp||new Promise(r=>{const e=document.createElement('script');e.src='tiendo.js?v=12';e.onload=r;e.onerror=r;document.head.appendChild(e);}));
const dev=()=>{try{return localStorage.getItem('bv_vid')||localStorage.getItem('td_dev')||'anon'}catch(e){return'anon'}};

function css(){if($('#cbcss'))return;const s=document.createElement('style');s.id='cbcss';s.textContent=`
#cb{position:fixed;left:calc(100vw - 68px);top:calc(100vh - 150px);z-index:30;width:54px;height:54px;border-radius:50%;border:0;background:var(--acc2);color:#fff;font-size:28px;line-height:1;box-shadow:0 3px 12px rgba(0,0,0,.35);touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}
#cb.dr{cursor:grabbing;opacity:.85}
.dots{display:inline-flex;gap:4px;align-items:center;height:18px}.dots i{width:7px;height:7px;border-radius:50%;background:var(--mute);animation:cbd 1.2s infinite ease-in-out}.dots i:nth-child(2){animation-delay:.2s}.dots i:nth-child(3){animation-delay:.4s}
@keyframes cbd{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}
body:has(#v.on) #cb,body:has(#dr.on) #cb{display:none}
#cp{position:fixed;inset:0;z-index:70;background:var(--bg);color:var(--ink);display:none;flex-direction:column}
#cp.on{display:flex}
.ch{background:var(--acc);color:#fff;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;display:flex;align-items:center;gap:10px}
.ch b{flex:1;font-size:16px}.ch button{border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:8px;padding:6px 12px;font-size:14px}
#cm{flex:1;overflow-y:auto;padding:10px 12px;-webkit-overflow-scrolling:touch}
.cu{background:var(--acc);color:#fff;border-radius:14px 14px 4px 14px;padding:8px 12px;margin:8px 0 8px auto;max-width:86%;width:fit-content;overflow-wrap:anywhere}
.cbot{background:var(--card);border:1px solid var(--line);border-radius:14px 14px 14px 4px;padding:9px 12px;margin:8px 0;max-width:96%;overflow-wrap:anywhere;font-size:14.5px}
.cbot .f{background:var(--accbg);border-radius:8px;padding:7px 9px;margin:6px 0;font-size:13.5px}
.cbot .n{font-size:12px;color:var(--mute);margin-top:6px}
.csrc{display:block;width:100%;text-align:left;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px;padding:7px 9px;margin:5px 0;font:inherit;font-size:13px}
.csrc b{display:block;font-size:13px}.csrc small{display:block;color:var(--mute);font-size:12px}
.csrc .sn{font-size:12.5px;color:var(--mute);margin-top:2px;max-height:3.6em;overflow:hidden}
.csrc mark{background:var(--hl);color:inherit}
.cref{display:inline-block;border:0;background:var(--acc2);color:#fff;border-radius:6px;padding:0 6px;margin:0 1px;font-size:12px;font-weight:700}
.csg{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.csg button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 12px;font-size:13.5px}
#cf{display:flex;gap:8px;padding:8px 12px calc(8px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:var(--card)}
#cf input{flex:1;border:1px solid var(--line);border-radius:999px;padding:11px 14px;font:inherit;background:var(--bg);color:var(--ink)}
#cf button{border:0;border-radius:999px;background:var(--acc2);color:#fff;font-weight:700;padding:0 18px}
#cf button:disabled{opacity:.5}
`;document.head.appendChild(s);}

/* ---- tìm trang liên quan (BM25 đơn giản trên văn bản đã bỏ dấu) ---- */
function build(){
  if(IDX)return IDX;
  if(typeof SHOP==='undefined'||!SHOP.length||!BP.pages.length||!BP.byKey)return null;
  const a=[];
  SHOP.forEach(p=>a.push({src:'s',p:Object.assign({src:'s'},p),n:p.n,nt:p.nt,raw:p.title+' | '+p.txt,k:'s'+p.doc}));
  BP.pages.forEach(p=>{const d=BP.byKey[p.k];a.push({src:'b',p:Object.assign({src:'b'},p),n:p.n+' '+d.nn,nt:d.nn,raw:p.t||'',d,k:'b'+p.k});});
  DS.pages.forEach(p=>a.push({src:'d',p,n:p.n,nt:p.nt,raw:p.t+' | '+p.x,k:'d'+p.k,w:p.lt?1:.85}));
  a.forEach(r=>{r.len=r.n.length||1});
  IDX={a,avg:a.reduce((s,r)=>s+r.len,0)/a.length};return IDX;
}
function toks(q){const n=normQ(q);return(n.match(/[a-zø0-9]+(?:[.\-\/][a-zø0-9]+)*/g)||[]).filter(t=>!STOP.has(t)&&(t.length>=2||/\d/.test(t)));}
function cnt(n,t){let c=0,i=-1;while((i=n.indexOf(t,i+1))>=0&&c<12)c++;return c;}
function retrieve(q,k){
  const I=build();if(!I)return{t:[],res:[]};const T=toks(q);if(!T.length)return{t:[],res:[]};
  const N=I.a.length,df={};T.forEach(t=>{let c=0;I.a.forEach(r=>{if(r.n.indexOf(t)>=0)c++});df[t]=c;});
  const bi=[];for(let i=0;i+1<T.length;i++)bi.push(T[i]+' '+T[i+1]);
  const res=[];
  I.a.forEach(r=>{let s=0,hit=0;T.forEach(t=>{if(!df[t])return;const f=cnt(r.n,t);if(!f)return;hit++;const idf=Math.log(1+(N-df[t]+.5)/(df[t]+.5));s+=idf*(f*2.2)/(f+1.2*(.25+.75*r.len/I.avg));if(r.nt&&r.nt.indexOf(t)>=0)s+=idf*1.2;});
    if(!hit)return;s*=(1+hit/T.length);bi.forEach(b=>{if(r.n.indexOf(b)>=0)s*=1.25;});if(r.w)s*=r.w;res.push({r,s});});
  res.sort((x,y)=>y.s-x.s);
  const per={},out=[];for(const x of res){per[x.r.k]=(per[x.r.k]||0)+1;if(per[x.r.k]>2)continue;out.push(x.r);if(out.length>=6)break;}
  return{t:T,res:out};
}
function describe(r){
  if(r.src==='s')return{t:r.p.title,w:`SHOP · ${r.p.cum} · STR.${r.p.dn} · tr.${r.p.page}`};
  if(r.src==='d'){const d=DS.byKey[r.p.k];return{t:`${d.no} · ${(r.p.dw?r.p.dw+' – ':'')+r.p.t}`,w:`THIẾT KẾ · ${d.title} · tr.${r.p.p}${r.p.lt?'':' · có bản mới hơn'}`};}
  return{t:`MOS.${r.d.no} – ${r.d.title}`,w:`BPTC · ${r.d.cat} · ${r.d.date.split('-').reverse().join('/')} · tr.${r.p.p}`};
}
function plain(r,T){const nr=norm(r.raw);let i=-1;T.forEach(t=>{const j=nr.indexOf(t);if(j>=0&&(i<0||j<i))i=j;});const s=Math.max(0,(i<0?0:i)-250);return r.raw.slice(s,s+900).replace(/\s+/g,' ').trim();}

/* ---- giao diện ---- */
function ui(){
  if($('#cb'))return;css();
  const b=document.createElement('button');b.id='cb';b.type='button';b.setAttribute('aria-label','Hỏi trợ lý');b.textContent='🤖';
  const p=document.createElement('div');p.id='cp';p.innerHTML=`<div class="ch"><b>🤖 Trợ lý công trường</b><button id="cx" type="button">Đóng</button></div><div id="cm"></div><form id="cf"><input id="ci" autocomplete="off" placeholder="Hỏi về bản vẽ, BPTC, tiến độ…" enterkeyhint="send"><button id="cs">Gửi</button></form>`;
  document.body.append(b,p);
  const clamp=(x,y)=>[Math.min(Math.max(4,x),innerWidth-58),Math.min(Math.max(4,y),innerHeight-58)];
  try{const sp=JSON.parse(localStorage.getItem('bv_cbpos')||'null');if(sp){const[x,y]=clamp(sp[0]*innerWidth,sp[1]*innerHeight);b.style.left=x+'px';b.style.top=y+'px';}}catch(e){}
  let dg=null,moved=false;
  b.addEventListener('pointerdown',e=>{dg={x:e.clientX,y:e.clientY,l:b.offsetLeft,t:b.offsetTop};moved=false;try{b.setPointerCapture(e.pointerId)}catch(_){}});
  b.addEventListener('pointermove',e=>{if(!dg)return;const dx=e.clientX-dg.x,dy=e.clientY-dg.y;if(!moved&&Math.hypot(dx,dy)<8)return;moved=true;b.classList.add('dr');const[x,y]=clamp(dg.l+dx,dg.t+dy);b.style.left=x+'px';b.style.top=y+'px';});
  const end=()=>{if(!dg)return;dg=null;b.classList.remove('dr');if(moved){try{localStorage.setItem('bv_cbpos',JSON.stringify([b.offsetLeft/innerWidth,b.offsetTop/innerHeight]))}catch(e){}}};
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
  addEventListener('resize',()=>{const[x,y]=clamp(b.offsetLeft,b.offsetTop);b.style.left=x+'px';b.style.top=y+'px';});
  b.onclick=()=>{if(moved){moved=false;return;}p.classList.add('on');if(!MSG.length)welcome();render();setTimeout(()=>$('#ci').focus(),80);};
  $('#cx').onclick=()=>p.classList.remove('on');
  $('#cf').onsubmit=e=>{e.preventDefault();const i=$('#ci'),q=i.value.trim();if(q&&!busy){i.value='';ask(q);}};
  $('#cm').addEventListener('click',e=>{
    const sg=e.target.closest('[data-sg]');if(sg){ask(SUG[+sg.dataset.sg]);return;}
    const o=e.target.closest('[data-o]');if(o){const[m,i]=o.dataset.o.split('.').map(Number),x=MSG[m]&&MSG[m].src&&MSG[m].src[i];if(x){p.classList.remove('on');openViewer([x.p],0,(MSG[m].q||''));}}
  });
}
function welcome(){MSG.push({r:'b',h:WHO?`<div>Xin chào <b>${E(WHO)}</b>! Bạn cần hỏi gì về bản vẽ, BPTC hay tiến độ?</div>`:`<div>Xin chào! Tôi là trợ lý công trường, sẽ có nhiệm vụ trả lời các câu hỏi thắc mắc của bạn liên quan tới các thông tin có trong ứng dụng của dự án.</div><div style="margin-top:6px">Hãy giới thiệu <b>tên và bộ phận phụ trách</b> của bạn để tôi biết và có thể trả lời các câu hỏi chuẩn hơn nhé.</div>`});}
function render(){const m=$('#cm');if(!m)return;
  m.innerHTML=MSG.map((x,i)=>x.r==='u'?`<div class="cu">${E(x.t)}</div>`:`<div class="cbot">${x.h}${x.src&&x.src.length&&x.show?`<div class="n" style="margin-top:8px"><b>Trang liên quan</b> (bấm để mở)</div>`+x.src.map((r,j)=>{const d=describe(r);return`<button type="button" class="csrc" data-o="${i}.${j}"><b>${x.ai?`<span class="cref">${j+1}</span> `:''}${E(d.t)}</b><small>${E(d.w)}</small><div class="sn">${snippet(r.raw,x.T||[])}</div></button>`}).join(''):''}</div>`).join('')+(busy?'<div class="cbot"><span class="dots"><i></i><i></i><i></i></span></div>':'');
  m.scrollTop=m.scrollHeight;}
function fmt(t,i){return E(t).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/[\[【](\d)[\]】]/g,(m,n)=>`<button type="button" class="cref" data-o="${i}.${n-1}">${n}</button>`).replace(/\n/g,'<br>');}

async function ask(q){
  MSG.push({r:'u',t:q});
  if(!WHO&&!isQ(q)&&q.length<=120){WHO=q.slice(0,120);try{localStorage.setItem('bv_who',WHO)}catch(e){}MSG.push({r:'b',h:`<div>Cảm ơn <b>${E(WHO)}</b>! Bạn cần hỏi gì về bản vẽ, BPTC hay tiến độ?</div>`});render();return;}
  busy=true;render();
  let T=toks(q),q2=q;
  if(T.length<2&&HIST.length){q2=HIST[HIST.length-1].q+' '+q;}
  const rt=retrieve(q2,6);
  let facts=null,sum='';
  try{await loadTD();if(window.TD&&window.TD.answer){facts=await window.TD.answer(q);}}catch(e){}
  let ai=null,note='';
  if(!aiOff){
    try{
      if(window.TD)sum=await window.TD.facts();
      const pass=rt.res.map((r,i)=>{const d=describe(r);return{n:i+1,title:d.t,where:d.w,text:plain(r,rt.t)};});
      const ac=new AbortController(),to=setTimeout(()=>ac.abort(),16000);
      const resp=await fetch(EP,{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+KEY},body:JSON.stringify({q,pass,facts:sum,hist:HIST.slice(-2),who:WHO,dev:dev()})});clearTimeout(to);
      const j=await resp.json().catch(()=>({}));
      if(resp.ok&&j.ok&&j.answer){ai=j.answer;if(j.left!=null&&j.left<=20)note=`Còn ${j.left} câu hỏi AI hôm nay (dùng chung cho cả đội).`;}
      else if(j.err==='quota'||j.err==='limit'){note='Cả đội đã dùng hết lượt hỏi AI hôm nay, dưới đây là kết quả tìm kiếm. Mai sẽ hỏi AI được lại.';}
      else if(j.err==='no_key'||resp.status===404){aiOff=true;note='Chưa bật AI, dưới đây là kết quả tìm kiếm trong tài liệu.';}
      else note='AI đang bận, dưới đây là kết quả tìm kiếm trong tài liệu.';
    }catch(e){note=navigator.onLine?'AI đang bận, dưới đây là kết quả tìm kiếm trong tài liệu.':'Đang mất mạng, dưới đây là kết quả tìm kiếm trong dữ liệu đã lưu.';}
  }else note='Dưới đây là kết quả tìm kiếm trong tài liệu.';
  const m=MSG.length;let h='';
  if(ai)h+=`<div>${fmt(ai,m)}</div>`;
  if(facts&&!ai)h+=`<div class="f"><b>Số liệu tiến độ</b><br>${facts.map(E).join('<br>')}</div>`;
  if(!ai&&!facts&&!rt.res.length)h+='<div>Tôi chưa tìm thấy nội dung phù hợp. Thử hỏi bằng từ khóa cụ thể hơn (số hiệu bản vẽ, tên cấu kiện, tên zone).</div>';
  if(!ai&&rt.res.length&&!facts)h+=`<div class="n" style="margin-top:0">${note||''}</div>`;else if(note&&!(facts&&!ai&&0))h+=`<div class="n">${note}</div>`;
  MSG.push({r:'b',h,src:(facts&&!ai)?[]:rt.res,show:!ai||wantSrc(q),T:rt.t,q,ai:!!ai});
  HIST.push({q,a:ai||(facts?facts.join(' '):'')});if(HIST.length>4)HIST.shift();
  busy=false;render();
}
const go=()=>{if(document.body)ui();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
