/* Kế hoạch & Tiến độ – FSO (bản xem thử v2). Kế hoạch: data/kehoach.json (Excel bố trí quân B1–T1, REV49).
   Thực tế: số quân ghi tay 19–26/11 (bảng giấy) + báo cáo nhập trên app. Báo cáo hiện lưu trên máy này; bước sau đồng bộ chung. */
(function(){
const $=s=>document.querySelector(s);
const DM={cf:24.76/100,th:5.0},HE=1.375,PER={cf:HE/DM.cf,th:HE/DM.th};
const WK=['CN','T2','T3','T4','T5','T6','T7'],ST=['Chưa đặt','Đã đặt','Đang về','Đã về'];
const NTPS=['VGC','GDcons','Trọng'];
let K=null,tab='ov',fl=(function(){try{return localStorage.getItem('td_fl')||'all'}catch(e){return'all'}})(),zsel=null,RK='td_rep',MK='td_mat',RF={fl:'B1',ntp:'VGC'};
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const f1=(x,n=1)=>(+x).toLocaleString('vi-VN',{maximumFractionDigits:n,minimumFractionDigits:0});
const dm=d=>d.slice(8)+'/'+d.slice(5,7);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dow=d=>WK[new Date(d+'T00:00:00').getDay()];
const diff=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const todayS=()=>iso(new Date());
const N=()=>K.dates.length;
function ix(d){const i=K.dates.indexOf(d);return i>=0?i:(d<K.dates[0]?-1:N());}
const clampI=d=>Math.min(Math.max(ix(d),0),N()-1);
const reps=()=>ld(RK,[]).sort((a,b)=>(a.date+a.ses+a.ts).localeCompare(b.date+b.ses+b.ts));
const wgt=it=>it.total*DM[it.kind];
const sum=a=>a.reduce((x,y)=>x+(+y||0),0);
const itemsF=()=>K.items.filter(it=>fl==='all'||it.floor===fl);
/* ---- thực tế ---- */
function apl(it,j){ // quân thực tế của đầu việc ngày j (null = chưa có số)
  let v=null;const s=K.act&&K.act[it.id];if(s&&s[j]!=null)v=s[j];
  const d=K.dates[j];reps().forEach(r=>{if(r.date===d&&r.ppl&&r.ppl[it.id]!=null&&r.ppl[it.id]!=='')v=+r.ppl[it.id];});return v;}
function lastPct(it,d){const r=reps();for(let i=r.length-1;i>=0;i--){if(r[i].pct&&r[i].pct[it.id]!=null&&r[i].pct[it.id]!==''&&(!d||r[i].date<=d))return{v:+r[i].pct[it.id],date:r[i].date};}return null;}
function planPct(it,i){let s=0;for(let j=0;j<i&&j<it.plan_qty.length;j++)s+=it.plan_qty[j];return Math.min(100,s/it.total*100);}
function info(it,d){
  const t=ix(d),i=Math.min(Math.max(t,0),N()-1),a=lastPct(it,d),pp=planPct(it,Math.max(t,0));
  // huy động quân: quân thực tế ÷ quân kế hoạch trong các ngày đã qua (có số thực tế)
  let pa=0,pk=0;for(let j=0;j<Math.min(t,N());j++){const v=apl(it,j);if(it.plan_ppl[j]>0||v>0){if(v!=null){pa+=v;pk+=it.plan_ppl[j]||0;}}}
  const hd=pk>0?pa/pk*100:null;
  const act=a?a.v:null,cur=act==null?pp:act,rem=it.total*(1-cur/100);
  const dl=Math.max(1,diff(t<0?K.dates[0]:d,it.pour)+1),need=rem/dl,pplNeed=need/PER[it.kind],pplPlan=it.plan_ppl[i]||0,pplAct=apl(it,i);
  let st='na';
  if(act!=null){const g=act-pp;st=g>=-3?'ok':g>=-10?'wn':'bd';}
  else if(hd!=null&&pp>0){st=hd>=90?'ok':hd>=70?'wn':'bd';}
  return{pp,act,cur,rem,dl,need,pplNeed,pplPlan,pplAct,cong:rem*DM[it.kind],st,done:cur>=99.5,hd,pa,pk};
}
function zones(){const m={};K.items.forEach(it=>{const k=it.floor+' '+it.zone;(m[k]=m[k]||{k,floor:it.floor,zone:it.zone,ntp:it.ntp,pour:it.pour,items:[]}).items.push(it);});return Object.values(m).sort((a,b)=>a.pour.localeCompare(b.pour)||a.k.localeCompare(b.k));}
const zonesF=()=>zones().filter(z=>fl==='all'||z.floor===fl);
const RANK={na:0,ok:1,wn:2,bd:3};
function zInfo(z,d){let w=0,pp=0,ac=0,has=false,cong=0,st='na',pa=0,pk=0,ppl=0,pat=0,pah=false;
  z.items.forEach(it=>{const x=info(it,d),ww=wgt(it);w+=ww;pp+=x.pp*ww;ac+=x.cur*ww;cong+=x.cong;if(x.act!=null)has=true;if(RANK[x.st]>RANK[st])st=x.st;pa+=x.pa;pk+=x.pk;ppl+=x.pplPlan;if(x.pplAct!=null){pat+=x.pplAct;pah=true;}});
  if(st==='na'&&z.pour<d&&ac/w>=99)st='ok';
  return{pp:pp/w,act:has?ac/w:null,cur:ac/w,cong,has,st,hd:pk>0?pa/pk*100:null,ppl,pat:pah?pat:null};}
const COL={ok:'#2e8b57',wn:'#e0a100',bd:'#c0392b',na:'#7b8a91'};
const LAB={ok:'Đạt kế hoạch',wn:'Chậm nhẹ',bd:'Chậm nhiều',na:'Chưa có số thực tế'};
const FC={B1:'#6a4c93',T1:'#1d7a8c'};
const chip=st=>`<span class="tdc" style="background:${COL[st]}">${LAB[st]}</span>`;
const bar=(pp,act,col)=>`<div class="tdb"><i style="width:${Math.min(100,act==null?0:act)}%;background:${col}"></i><u style="left:${Math.min(100,pp)}%"></u></div>`;
function css(){if($('#tdcss'))return;const s=document.createElement('style');s.id='tdcss';s.textContent=`
#tdr{max-width:980px;margin:0 auto;padding:10px 12px calc(40px + env(safe-area-inset-bottom))}
#tdr h3{font-size:15px;margin:18px 0 6px}
.tdfl{position:sticky;top:0;z-index:3;background:var(--bg);padding:6px 0;display:flex;gap:6px}
.tdfl button{flex:1;border:2px solid var(--line);background:var(--card);border-radius:10px;padding:9px 6px;font-weight:700;font-size:14px}
.tdfl button[aria-pressed=true]{color:#fff;border-color:transparent}
.tdt{display:flex;gap:6px;overflow-x:auto;margin:6px 0 10px;scrollbar-width:none}.tdt::-webkit-scrollbar{display:none}
.tdt button{flex:1 0 auto;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:8px 14px;font-weight:600;white-space:nowrap}
.tdt button[aria-pressed=true]{background:var(--acc);border-color:var(--acc);color:#fff}
.tdcols{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}
.tdcol{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:8px 10px}
.tdcol.kh{border-top:4px solid #3b6fb6}.tdcol.tt{border-top:4px solid var(--acc2)}
.tdcol h4{margin:0 0 4px;font-size:12px;letter-spacing:.3px;text-transform:uppercase;color:var(--mute)}
.tdcol .v{font-size:19px;font-weight:700;line-height:1.25}.tdcol .s{font-size:12px;color:var(--mute)}
.tdcard{background:var(--card);border:1px solid var(--line);border-left:6px solid var(--mute);border-radius:var(--r);padding:10px 12px;margin:8px 0}
.tdh{display:flex;justify-content:space-between;gap:8px;align-items:center}.tdh b{font-size:15px}
.tds{font-size:12.5px;color:var(--mute)}
.tdb{position:relative;height:12px;border-radius:6px;background:var(--line);margin:7px 0 3px}
.tdb i{position:absolute;left:0;top:0;bottom:0;border-radius:6px}.tdb u{position:absolute;top:-3px;bottom:-3px;width:3px;background:#3b6fb6;text-decoration:none;border-radius:2px}
.tdc{color:#fff;border-radius:999px;font-size:11.5px;padding:2px 9px;white-space:nowrap}
.tdn{font-size:12.5px;background:var(--accbg);border-radius:var(--r);padding:8px 10px;margin:8px 0}
.tdw{overflow-x:auto;-webkit-overflow-scrolling:touch}
table.tdtb{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}
.tdtb th,.tdtb td{border-bottom:1px solid var(--line);padding:6px 5px;text-align:right;white-space:nowrap}.tdtb th:first-child,.tdtb td:first-child{text-align:left;white-space:normal}
.tdtb th{font-size:11.5px;color:var(--mute);font-weight:600}.tdtb .k{background:rgba(59,111,182,.10)}.tdtb .t{background:rgba(227,100,20,.10)}
.tdtb tr.dz td:first-child{border-left:5px solid var(--c)}
.tdtb td.today,.tdtb th.today{outline:2px solid var(--acc2);outline-offset:-2px}
.tdmap{position:relative;max-width:430px;margin:8px auto;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;background:#fff}
.tdmap img{display:block;width:100%}
.tdpin{position:absolute;transform:translate(-50%,-50%);border:2px solid #fff;border-radius:10px;padding:3px 7px;color:#fff;font-size:11.5px;font-weight:700;line-height:1.2;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.45);white-space:nowrap}
.tdpin small{display:block;font-weight:500;font-size:10px}.tdpin.sel{outline:3px solid #000}
.tdmt{font-size:12px;font-weight:700;color:#fff;padding:4px 10px;display:inline-block;border-radius:0 0 8px 0;position:absolute;left:0;top:0;z-index:2}
.tdlg{display:flex;flex-wrap:wrap;gap:8px;font-size:11.5px;color:var(--mute);margin:4px 0}.tdlg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}
.tdz{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
.tdz button{border:1px solid var(--line);background:var(--card);border-radius:8px;padding:7px 10px;font-size:13px;border-left:5px solid var(--c)}
.tdz button[aria-pressed=true]{background:var(--acc);color:#fff}
.tdf label{display:block;font-size:13px;color:var(--mute);margin:8px 0 3px}
.tdf input,.tdf select,.tdf textarea{width:100%;border:1px solid var(--line);border-radius:8px;padding:9px;font:inherit;background:var(--card);color:var(--ink)}
.tdrow{display:grid;grid-template-columns:1fr 78px 78px;gap:6px;align-items:center;margin:5px 0}
.tdrow.h{font-size:11.5px;color:var(--mute)}
.tdbtn{border:0;border-radius:var(--r);background:var(--acc2);color:#fff;font-weight:700;padding:12px 16px;width:100%;margin-top:12px}
.tdbtn.s{background:var(--accbg);color:var(--ink);width:auto;padding:6px 10px;margin:0;font-weight:600;font-size:12px}
.late{color:#c0392b;font-weight:700}
.tdsvg{width:100%;height:auto;min-width:640px}
`;document.head.appendChild(s);}
const head=()=>{const d=todayS();return`<div class="tds">Kết cấu vành khăn Hầm B1 và Tầng 1 · hôm nay ${dow(d)} ${dm(d)}</div>`};
function flbar(){return`<div class="tdfl">`+[['all','Tất cả','#3d4a50'],['B1','Hầm B1',FC.B1],['T1','Tầng 1',FC.T1]].map(o=>`<button data-fl="${o[0]}" aria-pressed="${fl===o[0]}" ${fl===o[0]?`style="background:${o[2]}"`:''}>${o[1]}</button>`).join('')+'</div>';}
const legend=()=>`<div class="tdlg">${['ok','wn','bd','na'].map(k=>`<span><i style="background:${COL[k]}"></i>${LAB[k]}</span>`).join('')}</div>`;
function maps(sel,mode){ // mode 'go' = bấm pin mở tab Zone; 'f' = lọc
  const d=todayS(),fls=fl==='all'?['B1','T1']:[fl];let h='';
  fls.forEach(f=>{const M=K.maps[f];h+=`<div class="tdmap"><span class="tdmt" style="background:${FC[f]}">${f==='B1'?'Mặt bằng hầm B1':'Mặt bằng tầng 1'}</span><img src="${M.img}" alt="">`;
    zones().filter(z=>z.floor===f).forEach(z=>{const p=M.pins[z.zone],x=zInfo(z,d);if(!p)return;
      h+=`<button class="tdpin${sel===z.k?' sel':''}" data-pin="${esc(z.k)}" data-mode="${mode}" style="left:${p[0]*100}%;top:${p[1]*100}%;background:${COL[x.st]}">${z.zone}<small>đổ ${dm(z.pour)}</small></button>`;});
    h+='</div>';});
  return h+legend();}
/* ---- biểu đồ nhân lực + tiến độ + mốc ---- */
function chart(items,flAll){
  const d=todayS(),n=N(),W=Math.max(760,n*26),H=270,L=34,R=34,T=92,B=26,pw=(W-L-R)/n,ph=H-T-B;
  const kh=K.dates.map((_,j)=>sum(items.map(it=>it.plan_ppl[j])));
  const tt=K.dates.map((x,j)=>{let any=false,s=0;items.forEach(it=>{const v=apl(it,j);if(v!=null){any=true;s+=v}});return any?s:null});
  const mx=Math.max(10,...kh,...tt.map(v=>v||0))*1.1;
  const X=j=>L+j*pw,Y=v=>T+ph-v/mx*ph,Yp=p=>T+ph-p/100*ph;
  const tw=sum(items.map(wgt))||1;
  let cum=0;const khp=K.dates.map((_,j)=>{items.forEach(it=>{cum+=(it.plan_qty[j]||0)*DM[it.kind]});return cum/tw*100});
  let s=`<svg class="tdsvg" viewBox="0 0 ${W} ${H}" font-family="system-ui,sans-serif">`;
  for(let g=0;g<=4;g++){const v=mx/1.1*g/4;s+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#8884" /><text x="${L-4}" y="${Y(v)+3}" font-size="9" text-anchor="end" fill="#888">${Math.round(v)}</text>`;s+=`<text x="${W-R+4}" y="${Yp(g*25)+3}" font-size="9" fill="#888">${g*25}%</text>`;}
  K.dates.forEach((x,j)=>{const bw=pw*0.38;s+=`<rect x="${X(j)+pw*0.08}" y="${Y(kh[j])}" width="${bw}" height="${T+ph-Y(kh[j])}" fill="#3b6fb6" opacity=".4"/>`;
    if(tt[j]!=null)s+=`<rect x="${X(j)+pw*0.08+bw}" y="${Y(tt[j])}" width="${bw}" height="${T+ph-Y(tt[j])}" fill="#e36414"/>`;
    s+=`<text x="${X(j)+pw/2}" y="${H-12}" font-size="8" text-anchor="middle" fill="#888">${x.slice(8)}</text>`;if(x.slice(8)==='01'||j===0)s+=`<text x="${X(j)+pw/2}" y="${H-2}" font-size="8" text-anchor="middle" fill="#888">/${x.slice(5,7)}</text>`;});
  if(flAll&&K.act_total)K.act_total.forEach((v,j)=>{s+=`<circle cx="${X(j)+pw/2}" cy="${Y(v)}" r="2.6" fill="none" stroke="#888" stroke-width="1.4"/>`;});
  s+=`<polyline fill="none" stroke="#3b6fb6" stroke-width="2.4" points="${khp.map((p,j)=>`${X(j)+pw/2},${Yp(p)}`).join(' ')}"/>`;
  const pts=[];K.dates.forEach((x,j)=>{if(x>d)return;if(!reps().some(r=>r.date===x&&r.pct&&Object.keys(r.pct).length))return;let w=0,a=0;items.forEach(it=>{const l=lastPct(it,x);const cur=l?l.v:planPct(it,j+1);a+=cur*wgt(it);w+=wgt(it)});pts.push([X(j)+pw/2,Yp(a/w)]);});
  if(pts.length){s+=`<polyline fill="none" stroke="#e36414" stroke-width="2.6" points="${pts.map(p=>p.join(',')).join(' ')}"/>`+pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#e36414"/>`).join('');}
  const ti=ix(d);if(ti>=0&&ti<n)s+=`<line x1="${X(ti)+pw/2}" x2="${X(ti)+pw/2}" y1="${T-8}" y2="${T+ph}" stroke="#e36414" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${X(ti)+pw/2}" y="${T-12}" font-size="9" font-weight="700" fill="#e36414" text-anchor="middle">hôm nay</text>`;
  const seen={};items.forEach(it=>{const k=it.floor+' '+it.zone;if(seen[k])return;seen[k]=1;const j=ix(it.pour);if(j<0||j>=n)return;const x=X(j)+pw/2;
    s+=`<line x1="${x}" x2="${x}" y1="${T-4}" y2="${T+ph}" stroke="${FC[it.floor]}" stroke-width="1.4" stroke-dasharray="2 2"/><polygon points="${x},${T-6} ${x-5},${T-14} ${x+5},${T-14}" fill="${FC[it.floor]}"/><text transform="translate(${x+3},${T-17}) rotate(-62)" font-size="9" font-weight="700" fill="${FC[it.floor]}">Đổ ${k}</text>`;});
  Object.keys(K.thep_ve||{}).forEach(k=>{if(!items.some(it=>it.floor+' '+it.zone===k))return;const j=ix(K.thep_ve[k]);if(j<0||j>=n)return;const x=X(j)+pw/2;s+=`<rect x="${x-4}" y="${T+ph-8}" width="8" height="8" transform="rotate(45 ${x} ${T+ph-4})" fill="#1f9d55"><title>Thép về ${k}</title></rect>`;});
  s+='</svg>';
  return`<div class="tdw">${s}</div><div class="tdlg"><span><i style="background:#3b6fb6;opacity:.5"></i>Quân kế hoạch/ngày</span><span><i style="background:#e36414"></i>Quân thực tế/ngày</span><span><i style="background:#3b6fb6"></i>% tiến độ kế hoạch (trục phải)</span><span><i style="background:#e36414"></i>% tiến độ thực tế (khi có nhập %)</span><span>▼ đổ bê tông</span><span><i style="background:#1f9d55;transform:rotate(45deg)"></i>thép về</span>${flAll?'<span>◯ tổng quân ghi tay trong bảng giấy</span>':''}</div>`;
}
/* ---- màn hình ---- */
function vOv(){
  const d=todayS(),Z=zonesF(),it=itemsF(),i=clampI(d);
  let W=0,P=0,A=0,hasA=false,kq=0,tq=0,tqh=false;
  it.forEach(x=>{const f=info(x,d),w=wgt(x);W+=w;P+=f.pp*w;A+=f.cur*w;if(f.act!=null)hasA=true;kq+=x.plan_ppl[i]||0;if(f.pplAct!=null){tq+=f.pplAct;tqh=true;}});
  const nxt=Z.filter(z=>z.pour>=d)[0];
  const cnt={ok:0,wn:0,bd:0,na:0};Z.filter(z=>z.pour>=d).forEach(z=>cnt[zInfo(z,d).st]++);
  let h=head()+`<div class="tdcols"><div class="tdcol kh"><h4>Kế hoạch</h4><div class="v">${f1(P/W,0)}%</div><div class="s">tiến độ đến đầu ngày hôm nay</div><div class="v" style="margin-top:6px">${kq} người</div><div class="s">quân bố trí hôm nay</div><div class="v" style="margin-top:6px">${nxt?dm(nxt.pour):'—'}</div><div class="s">đổ BT tiếp theo${nxt?': '+esc(nxt.k):''}</div></div>
  <div class="tdcol tt"><h4>Thực tế (từ input)</h4><div class="v">${hasA?f1(A/W,0)+'%':'chưa có'}</div><div class="s">${hasA?'% hoàn thành theo báo cáo':'chưa nhập % hoàn thành'}</div><div class="v" style="margin-top:6px">${tqh?tq+' người':'chưa có'}</div><div class="s">quân thực tế hôm nay</div><div class="v" style="margin-top:6px"><span style="color:${COL.bd}">${cnt.bd}</span> · <span style="color:${COL.wn}">${cnt.wn}</span> · <span style="color:${COL.ok}">${cnt.ok}</span></div><div class="s">zone chậm nhiều · chậm nhẹ · đạt</div></div></div>`;
  h+='<h3>Biểu đồ nhân lực, tiến độ và các mốc</h3>'+chart(it,fl==='all');
  h+='<h3>Mặt bằng chia zone (màu theo mức độ)</h3>'+maps(null,'go');
  h+=`<h3>Bảng zone: kế hoạch và thực tế</h3><div class="tdw"><table class="tdtb"><tr><th rowspan=2>Zone</th><th rowspan=2>Đổ BT</th><th colspan=2>% hoàn thành</th><th colspan=2>Quân hôm nay</th></tr><tr><th class="k">Kế hoạch</th><th class="t">Thực tế</th><th class="k">Kế hoạch</th><th class="t">Thực tế</th></tr>`;
  Z.forEach(z=>{const x=zInfo(z,d),n=diff(d,z.pour);h+=`<tr class="dz" data-z="${esc(z.k)}" style="--c:${COL[x.st]};cursor:pointer"><td><b>${esc(z.k)}</b><br><small class="tds">${esc(z.ntp)}</small></td><td>${dm(z.pour)}<br><small class="tds">${n>0?'còn '+n+' ngày':n===0?'hôm nay':'đã đổ'}</small></td><td class="k">${f1(x.pp,0)}%</td><td class="t">${x.has?f1(x.act,0)+'%':'—'}${!x.has&&x.hd!=null?'<br><small class="tds">huy động '+f1(x.hd,0)+'%</small>':''}</td><td class="k">${x.ppl}</td><td class="t">${x.pat==null?'—':x.pat}</td></tr>`;});
  h+='</table></div><div class="tds">Bấm vào dòng hoặc mặt bằng để xem chi tiết zone. Màu vạch bên trái = mức độ. "Huy động" = quân thực tế ÷ quân kế hoạch của các ngày đã qua.</div>';
  h+=`<h3>Việc hôm nay</h3><div class="tdw"><table class="tdtb"><tr><th>Zone · việc</th><th class="k">KH quân</th><th class="t">TT quân</th><th class="k">KL kế hoạch</th></tr>`;let any=false;
  it.forEach(x=>{const q=x.plan_qty[i]||0,p=x.plan_ppl[i]||0,a=apl(x,i);if(q>0||p>0){any=true;h+=`<tr><td>${esc(x.floor+' '+x.zone)} · ${esc(x.task)}${d===x.pour?' <b>(ngày đổ)</b>':''}</td><td class="k">${p}</td><td class="t">${a==null?'—':a}</td><td class="k">${q?f1(q,1)+' '+x.unit:'—'}</td></tr>`;}});
  if(!any)h+='<tr><td colspan=4>Không có việc trong kế hoạch ngày này.</td></tr>';
  return h+'</table></div><div class="tdn">Kế hoạch = tính từ file bố trí quân REV49 (19/11). Thực tế = số quân ghi tay trong bảng giấy 19–26/11 và báo cáo nhập trên app. Hầm B1 tính trên khối lượng còn lại tại 19/11.</div>';
}
function zoneChips(){const d=todayS();return`<div class="tdz">${zonesF().map(z=>`<button data-zs="${esc(z.k)}" aria-pressed="${z.k===zsel}" style="--c:${COL[zInfo(z,d).st]}">${esc(z.k)}</button>`).join('')}</div>`;}
function dayGrid(it,d){
  const a=Math.max(0,it.plan_ppl.findIndex(v=>v>0)-1),b=Math.min(N()-1,Math.max(clampI(d)+2,a+6)),t=ix(d);
  let h='<div class="tdw"><table class="tdtb"><tr><th></th>'+K.dates.slice(a,b+1).map((x,j)=>`<th class="${a+j===t?'today':''}">${dow(x)}<br>${dm(x)}</th>`).join('')+'</tr>';
  const row=(lab,fn,cls)=>{h+=`<tr><td>${lab}</td>`+K.dates.slice(a,b+1).map((x,j)=>`<td class="${cls}${a+j===t?' today':''}">${fn(a+j)}</td>`).join('')+'</tr>'};
  row('Quân KH',j=>it.plan_ppl[j]||'·','k');row('Quân TT',j=>{const v=apl(it,j);return v==null?'·':v},'t');row(`KL KH (${it.unit})`,j=>it.plan_qty[j]?f1(it.plan_qty[j],1):'·','k');
  return h+'</table></div>';}
function vZone(){
  const d=todayS(),Z=zonesF();if(zsel&&!Z.find(z=>z.k===zsel))zsel=null;
  let h=head()+maps(zsel,'f')+zoneChips();
  const list=zsel?Z.filter(z=>z.k===zsel):Z;
  if(!zsel)h+='<div class="tdn">Đang xem tất cả zone của '+(fl==='all'?'cả hai tầng':fl==='B1'?'hầm B1':'tầng 1')+'. Bấm một zone trên mặt bằng để chỉ xem zone đó.</div>';
  list.forEach(z=>{const zi=zInfo(z,d),m=K.kl[z.k];
    h+=`<div class="tdcard" style="border-left-color:${COL[zi.st]}"><div class="tdh"><b>${esc(z.k)} · ${esc(z.ntp)}</b>${chip(zi.st)}</div><div class="tds">${f1(m.area,0)} m² · BT ${f1(m.bt,0)} m³ · đổ ${dm(z.pour)} (${dow(z.pour)})</div>${bar(zi.pp,zi.has?zi.cur:null,COL[zi.st])}</div>`;
    z.items.forEach(it=>{const x=info(it,d),first=it.plan_ppl.findIndex(v=>v>0),last=it.plan_ppl.length-1-[...it.plan_ppl].reverse().findIndex(v=>v>0);
      const need=x.pplNeed>x.pplPlan+0.5;
      h+=`<div class="tdcard" style="border-left-color:${COL[x.st]};margin-left:10px"><div class="tdh"><b>${esc(it.task)}</b>${chip(x.st)}</div><div class="tds">KL ${f1(it.total,1)} ${it.unit} · làm ${first>=0?dm(K.dates[first])+' → '+dm(K.dates[last]):'—'}</div>
      <div class="tdw"><table class="tdtb"><tr><th>Chỉ tiêu</th><th class="k">Kế hoạch</th><th class="t">Thực tế</th></tr>
      <tr><td>% hoàn thành (đầu ngày)</td><td class="k">${f1(x.pp,0)}%</td><td class="t">${x.act==null?'—':f1(x.act,0)+'%'}</td></tr>
      <tr><td>KL còn lại (${it.unit})</td><td class="k">${f1(it.total*(1-x.pp/100),1)}</td><td class="t">${x.act==null?'—':f1(x.rem,1)}</td></tr>
      <tr><td>Quân hôm nay</td><td class="k">${x.pplPlan}</td><td class="t">${x.pplAct==null?'—':x.pplAct}</td></tr>
      <tr><td>Huy động quân các ngày qua</td><td class="k">100%</td><td class="t">${x.hd==null?'—':f1(x.hd,0)+'%'}</td></tr>
      <tr><td>Số ngày còn đến ngày đổ</td><td class="k">${x.dl}</td><td class="t">${x.dl}</td></tr>
      <tr><td>Quân cần mỗi ngày để kịp</td><td class="k">${x.pplPlan}</td><td class="t ${need?'late':''}">${f1(x.pplNeed,0)}${need?' (thiếu '+f1(x.pplNeed-x.pplPlan,0)+')':''}</td></tr>
      <tr><td>Công còn lại theo định mức</td><td class="k">${f1(it.total*(1-x.pp/100)*DM[it.kind],0)}</td><td class="t">${f1(x.cong,0)}</td></tr></table></div>${dayGrid(it,d)}</div>`;});});
  return h+`<div class="tdn">"Quân cần" tính theo % thực tế nếu đã nhập, chưa nhập thì lấy % kế hoạch. Năng suất 1 người/ngày (11h): ${f1(PER.cf,2)} m² cốp pha, ${f1(PER.th,3)} tấn thép.</div>`;
}
function vMan(){
  const d=todayS(),i=clampI(d),Z=zonesF();if(zsel&&!Z.find(z=>z.k===zsel))zsel=null;
  const its=itemsF().filter(it=>!zsel||(it.floor+' '+it.zone)===zsel);
  let h=head()+maps(zsel,'f')+zoneChips()+'<h3>Quân theo ngày: kế hoạch và thực tế</h3>'+chart(its,fl==='all'&&!zsel);
  h+='<h3>Tổ đội: cần bao nhiêu quân để kịp tiến độ</h3><div class="tdw"><table class="tdtb"><tr><th rowspan=2>Tổ</th><th rowspan=2>Cam kết</th><th class="k">Kế hoạch</th><th class="t">Thực tế</th><th rowspan=2>Cần</th></tr><tr><th class="k">hôm nay</th><th class="t">hôm nay</th></tr>';
  const CM={VGC:'VGC cộng',GDcons:'GDcons – ban ngày','Trọng':'Tổ Trọng'};
  NTPS.forEach(n=>{let pl=0,tt=0,th=false,nd=0;its.filter(it=>it.ntp===n&&it.pour>=d).forEach(it=>{const x=info(it,d);if(x.done)return;if((it.plan_ppl[i]||0)>0||(x.pp>0&&x.cur<x.pp)){pl+=it.plan_ppl[i]||0;nd+=x.pplNeed;}});
    its.filter(it=>it.ntp===n).forEach(it=>{const v=apl(it,i);if(v!=null){tt+=v;th=true;}});const cm=K.commit[CM[n]][i];
    h+=`<tr><td><b>${n}</b></td><td>${cm}</td><td class="k">${pl}</td><td class="t">${th?tt:'—'}</td><td class="${nd>cm+0.5?'late':''}">${f1(nd,0)}</td></tr>`;});
  h+='</table></div>';
  h+='<h3>Chi tiết theo ngày (Kế hoạch | Thực tế)</h3><div class="tdw"><table class="tdtb"><tr><th rowspan=2>Ngày</th>'+NTPS.map(n=>`<th colspan=2>${n}</th>`).join('')+'<th colspan=2>Tổng</th></tr><tr>'+[...NTPS,'Tổng'].map(()=>'<th class="k">KH</th><th class="t">TT</th>').join('')+'</tr>';
  K.dates.forEach((x,j)=>{if(j<Math.max(0,i-5)||j>i+7)return;let cells='',tk=0,tt=0,ta=false;
    NTPS.forEach(n=>{const l=its.filter(it=>it.ntp===n);const k=sum(l.map(it=>it.plan_ppl[j]));let t=0,a=false;l.forEach(it=>{const v=apl(it,j);if(v!=null){t+=v;a=true}});tk+=k;if(a){tt+=t;ta=true}cells+=`<td class="k">${k||'·'}</td><td class="t">${a?t:'·'}</td>`;});
    h+=`<tr><td class="${j===i?'today':''}">${dow(x)} ${dm(x)}</td>${cells}<td class="k"><b>${tk}</b></td><td class="t"><b>${ta?tt:'·'}</b></td></tr>`;});
  return h+'</table></div><div class="tds">Ô "·" = chưa có số. Thực tế ghi tay trong bảng giấy chỉ có từ 19/11.</div>';
}
function vPrep(){
  const d=todayS(),M=ld(MK,{}),Z=zonesF();if(zsel&&!Z.find(z=>z.k===zsel))zsel=null;let rows=[];
  Z.filter(z=>z.pour>=d&&(!zsel||z.k===zsel)).forEach(z=>{const m=K.kl[z.k],cf=z.items.find(i=>i.kind==='cf'),th=z.items.find(i=>i.kind==='th');
    const fd=it=>{const j=it.plan_ppl.findIndex(v=>v>0);return j>=0?K.dates[j]:null};
    if(th)rows.push({id:z.k+'|th',z,g:'Thép',n:'thép gia công (Povina)',q:f1(th.total,1)+' tấn',need:z.floor==='T1'?(K.thep_ve[z.k]||fd(th)):fd(th)});
    if(cf&&z.floor==='T1')rows.push({id:z.k+'|cf',z,g:'Cốp pha',n:'ván khuôn, giàn chống sàn',q:f1(cf.total,0)+' m²',need:fd(cf)});
    rows.push({id:z.k+'|bt',z,g:'Bê tông & thiết bị',n:'bê tông + bơm + đội đổ (7 người)',q:f1(m.bt,0)+' m³',need:z.pour});});
  rows=rows.filter(r=>r.need).sort((a,b)=>a.need.localeCompare(b.need));
  let h=head()+maps(zsel,'f')+zoneChips()+`<div class="tdn">Danh mục sơ bộ theo khối lượng kế hoạch (chưa rà biện pháp thi công). Cột Kế hoạch: số lượng và ngày cần. Cột Thực tế: anh cập nhật trạng thái và ngày đã đặt/về. Dòng sắp đến hạn hoặc quá hạn mà chưa về hiện màu đỏ.</div>`;
  ['Thép','Cốp pha','Bê tông & thiết bị'].forEach(g=>{const R=rows.filter(r=>r.g===g);if(!R.length)return;
    h+=`<h3>${g}</h3><div class="tdw"><table class="tdtb"><tr><th rowspan=2>Hạng mục</th><th colspan=2>Kế hoạch</th><th colspan=2>Thực tế</th></tr><tr><th class="k">SL</th><th class="k">Cần</th><th class="t">Trạng thái</th><th class="t">Ngày</th></tr>`;
    R.forEach(r=>{const mm=M[r.id]||{},s=mm.s||'Chưa đặt',n=diff(d,r.need),lt=n<=3&&s!=='Đã về';
      h+=`<tr class="dz" style="--c:${FC[r.z.floor]}"><td><b>${esc(r.z.k)}</b><br><small class="tds">${r.n}</small></td><td class="k">${r.q}</td><td class="k ${lt?'late':''}">${dm(r.need)}<br><small>${n>0?'còn '+n+' ngày':n===0?'hôm nay':'quá '+(-n)+' ngày'}</small></td><td class="t"><select data-m="${esc(r.id)}" style="width:92px;padding:5px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)">${ST.map(o=>`<option${o===s?' selected':''}>${o}</option>`).join('')}</select></td><td class="t"><input type="date" data-md="${esc(r.id)}" value="${mm.d||''}" style="width:118px;padding:4px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)"></td></tr>`;});
    h+='</table></div>';});
  if(!rows.length)h+='<div class="tdn">Không có hạng mục cần chuẩn bị cho lựa chọn này (zone đã đổ).</div>';
  return h;
}
function vRep(){
  const d=todayS(),i=clampI(d),hr=new Date().getHours(),ses=hr>=15?'pm':'am';
  const fls=fl==='all'?RF.fl:fl;RF.fl=fls;
  const Z=zones().filter(z=>z.floor===fls&&(RF.ntp==='all'||z.ntp===RF.ntp)&&z.pour>=d);
  const its=Z.flatMap(z=>z.items).filter(it=>{const x=info(it,d);return !x.done});
  let h=head()+`<div class="tdn">Báo cáo theo tầng, tổ đội và giám sát phụ trách: mỗi giám sát chỉ thấy các zone và đầu việc của tổ mình. Bản xem thử: lưu trên máy này; sau khi anh duyệt sẽ nối cơ sở dữ liệu chung.</div><div class="tdf">
  <label>Tầng</label><select id="rfl"><option value="B1"${fls==='B1'?' selected':''}>Hầm B1</option><option value="T1"${fls==='T1'?' selected':''}>Tầng 1</option></select>
  <label>Tổ đội / giám sát phụ trách</label><select id="rnt">${NTPS.map(n=>`<option${RF.ntp===n?' selected':''}>${n}</option>`).join('')}<option value="all"${RF.ntp==='all'?' selected':''}>Tất cả tổ (trưởng nhóm)</option></select>
  <label>Ngày báo cáo</label><input type="date" id="rd" value="${d}">
  <label>Phiên báo cáo</label><select id="rs"><option value="am"${ses==='am'?' selected':''}>Đầu ngày (7h–8h): quân số, việc dự kiến</option><option value="pm"${ses==='pm'?' selected':''}>Cuối ngày (17h30–19h): khối lượng xong, tăng ca</option></select>
  <label>Họ tên người báo cáo</label><input id="rwho" placeholder="Giám sát" value="${esc((ld('td_who','')||''))}">`;
  if(!its.length)h+='<div class="tdn">Không có đầu việc đang thi công của tổ này ở tầng đã chọn.</div>';
  Z.forEach(z=>{const l=z.items.filter(it=>its.includes(it));if(!l.length)return;
    h+=`<h3 style="border-left:5px solid ${COL[zInfo(z,d).st]};padding-left:8px">${esc(z.k)} · ${esc(z.ntp)} <small class="tds">đổ ${dm(z.pour)}</small></h3><div class="tdrow h"><span>Đầu việc</span><span>Công nhân</span><span>% tích lũy</span></div>`;
    l.forEach(it=>{const a=lastPct(it),x=info(it,d),cur=apl(it,i);h+=`<div class="tdrow"><span>${esc(it.task)}<br><small class="tds">KH hôm nay: ${it.plan_ppl[i]||0} người · KH đầu ngày ${f1(x.pp,0)}%${a?' · gần nhất '+f1(a.v,0)+'%':''}</small></span><input type="number" inputmode="numeric" min="0" data-p="${esc(it.id)}" placeholder="${it.plan_ppl[i]||0}" value="${cur==null?'':cur}"><input type="number" inputmode="decimal" min="0" max="100" data-i="${esc(it.id)}" placeholder="%" value="${a?a.v:''}"></div>`;});});
  h+=`<label>Quân tăng ca sau 17h30 (tổng của tổ)</label><input type="number" inputmode="numeric" min="0" id="rot" value="0"><label>Ghi chú (vật tư, vướng mắc, thiếu quân…)</label><textarea id="rn" rows="3"></textarea><button class="tdbtn" id="rsv">Lưu báo cáo</button></div>`;
  const R=reps().slice(-6).reverse();
  if(R.length){h+='<h3>Báo cáo gần đây (máy này)</h3>';R.forEach(r=>{h+=`<div class="tdcard"><div class="tdh"><b>${dow(r.date)} ${dm(r.date)} · ${r.ses==='am'?'Đầu ngày':'Cuối ngày'} · ${esc(r.fl||'')} ${esc(r.ntp||'')}</b><button class="tdbtn s" data-del="${r.ts}">Xóa</button></div><div class="tds">${esc(r.who||'')} · ${Object.keys(r.ppl||{}).length} đầu việc có quân · ${Object.keys(r.pct||{}).length} có %${r.ot?' · tăng ca '+r.ot:''}${r.note?' · '+esc(r.note):''}</div></div>`;});}
  return h;
}
const V={ov:vOv,zn:vZone,mn:vMan,pr:vPrep,rp:vRep};
const TB=[['ov','Tổng quan'],['zn','Zone'],['mn','Nhân lực'],['pr','Chuẩn bị'],['rp','Báo cáo']];
function draw(){
  const r=$('#tdr');if(!r)return;const y=window.scrollY;
  r.innerHTML=flbar()+`<div class="tdt">${TB.map(t=>`<button data-tb="${t[0]}" aria-pressed="${t[0]===tab}">${t[1]}</button>`).join('')}</div>`+V[tab]();
  r.querySelectorAll('[data-fl]').forEach(b=>b.onclick=()=>{fl=b.dataset.fl;try{localStorage.setItem('td_fl',fl)}catch(e){}if(fl!=='all'&&zsel&&!zsel.startsWith(fl))zsel=null;if(fl!=='all')RF.fl=fl;draw();});
  r.querySelectorAll('[data-tb]').forEach(b=>b.onclick=()=>{tab=b.dataset.tb;draw();window.scrollTo(0,0);});
  r.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{zsel=b.dataset.z;tab='zn';draw();window.scrollTo(0,0);});
  r.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>{const k=b.dataset.pin;if(b.dataset.mode==='go'){zsel=k;tab='zn';draw();window.scrollTo(0,0);}else{zsel=zsel===k?null:k;draw();window.scrollTo(0,y);}});
  r.querySelectorAll('[data-zs]').forEach(b=>b.onclick=()=>{zsel=zsel===b.dataset.zs?null:b.dataset.zs;draw();window.scrollTo(0,y);});
  r.querySelectorAll('[data-m]').forEach(s=>s.onchange=()=>{const M=ld(MK,{});(M[s.dataset.m]=M[s.dataset.m]||{}).s=s.value;sv(MK,M);draw();window.scrollTo(0,y);});
  r.querySelectorAll('[data-md]').forEach(s=>s.onchange=()=>{const M=ld(MK,{});(M[s.dataset.md]=M[s.dataset.md]||{}).d=s.value;sv(MK,M);});
  r.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(!confirm('Xóa báo cáo này?'))return;sv(RK,ld(RK,[]).filter(x=>String(x.ts)!==b.dataset.del));draw();});
  const rf=$('#rfl');if(rf){rf.onchange=()=>{RF.fl=rf.value;if(fl!=='all'){fl=rf.value;try{localStorage.setItem('td_fl',fl)}catch(e){}}draw();};$('#rnt').onchange=e=>{RF.ntp=e.target.value;draw();};}
  const sb=$('#rsv');if(sb)sb.onclick=()=>{
    const who=$('#rwho').value.trim();sv('td_who',who);
    const rec={date:$('#rd').value,ses:$('#rs').value,fl:RF.fl,ntp:RF.ntp,who,ppl:{},pct:{},ot:+$('#rot').value||0,note:$('#rn').value.trim(),ts:Date.now()};
    r.querySelectorAll('[data-p]').forEach(e=>{if(e.value!=='')rec.ppl[e.dataset.p]=+e.value;});
    let bad=false;r.querySelectorAll('[data-i]').forEach(e=>{if(e.value==='')return;const v=+e.value;if(!(v>=0&&v<=100))bad=true;rec.pct[e.dataset.i]=v;});
    if(bad){alert('% phải nằm trong khoảng 0–100');return;}
    if(!rec.date){alert('Chọn ngày báo cáo');return;}
    if(!Object.keys(rec.ppl).length&&!Object.keys(rec.pct).length){alert('Nhập ít nhất số công nhân hoặc % của một đầu việc');return;}
    const a=ld(RK,[]);a.push(rec);sv(RK,a);tab='ov';draw();window.scrollTo(0,0);
  };
}
window.TD={open:async function(el){
  css();el.innerHTML='<div id="tdr"><div class="tdn">Đang tải kế hoạch…</div></div>';
  try{if(!K){const r=await fetch('data/kehoach.json',{cache:'no-cache'});K=await r.json();}}
  catch(e){el.innerHTML='<div id="tdr"><div class="tdn">Chưa tải được dữ liệu kế hoạch. Kiểm tra mạng rồi mở lại.</div></div>';return;}
  draw();
}};
})();
