/* Kế hoạch & Tiến độ – FSO (bản xem thử). Dữ liệu kế hoạch: data/kehoach.json (từ file Excel bố trí quân B1–T1, REV49).
   Báo cáo thực tế hiện lưu trên máy này (localStorage); bước sau sẽ đồng bộ chung cho mọi máy. */
(function(){
const $=s=>document.querySelector(s);
const DM={cf:24.76/100,th:5.0};            // công / m² ; công / tấn
const HE=1.375;                            // công / người / ngày (11h)
const PER={cf:HE/DM.cf,th:HE/DM.th};       // sản lượng 1 người/ngày: 5,55 m² ; 0,275 tấn
const WK=['CN','T2','T3','T4','T5','T6','T7'];
const ST=['Chưa đặt','Đã đặt','Đang về','Đã về'];
let K=null,tab='ov',zsel=null,RK='td_rep',MK='td_mat';
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const f1=(x,n=1)=>(+x).toLocaleString('vi-VN',{maximumFractionDigits:n,minimumFractionDigits:0});
const dm=d=>d.slice(8)+'/'+d.slice(5,7);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dow=d=>WK[new Date(d+'T00:00:00').getDay()];
const diff=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const todayS=()=>iso(new Date());
function ix(d){const n=K.dates.length;const i=K.dates.indexOf(d);if(i>=0)return i;return d<K.dates[0]?-1:n;} // -1: chưa bắt đầu, n: quá kế hoạch
const clampI=d=>Math.min(Math.max(ix(d),0),K.dates.length-1);
const reps=()=>ld(RK,[]).sort((a,b)=>(a.date+a.ses).localeCompare(b.date+b.ses));
function lastPct(id){const r=reps();for(let i=r.length-1;i>=0;i--){if(r[i].pct&&r[i].pct[id]!=null)return{v:+r[i].pct[id],date:r[i].date};}return null;}
const wgt=it=>it.total*DM[it.kind];
function planPct(it,d){const i=ix(d)-1;if(i<0)return 0;let s=0;for(let j=0;j<=Math.min(i,it.plan_qty.length-1);j++)s+=it.plan_qty[j];return Math.min(100,s/it.total*100);}
function info(it,d){
  const i=clampI(d),a=lastPct(it.id),pp=planPct(it,d),act=a?a.v:null;
  const pour=it.pour,dl=Math.max(1,diff(d<K.dates[0]?K.dates[0]:d,pour)+1); // số ngày còn (tính cả hôm nay & ngày đổ)
  const cur=act==null?pp:act,rem=it.total*(1-cur/100);
  const need=rem/dl,pplNeed=need/PER[it.kind],pplPlan=it.plan_ppl[i]||0;
  const cong=rem*DM[it.kind];
  let st='na';if(act!=null){const g=act-pp;st=g>=-3?'ok':g>=-10?'wn':'bd';}
  const daysKeep=pplPlan>0?rem/(pplPlan*PER[it.kind]):null;
  return{pp,act,cur,rem,dl,need,pplNeed,pplPlan,cong,st,daysKeep,done:cur>=99.5};
}
function zones(){const m={};K.items.forEach(it=>{const k=it.floor+' '+it.zone;(m[k]=m[k]||{k,floor:it.floor,zone:it.zone,ntp:it.ntp,pour:it.pour,items:[]}).items.push(it);});return Object.values(m).sort((a,b)=>a.pour.localeCompare(b.pour)||a.k.localeCompare(b.k));}
function zInfo(z,d){let w=0,pp=0,ac=0,has=false,cong=0;z.items.forEach(it=>{const x=info(it,d),ww=wgt(it);w+=ww;pp+=x.pp*ww;ac+=x.cur*ww;cong+=x.cong;if(x.act!=null)has=true;});return{pp:pp/w,act:has?ac/w:null,cur:ac/w,cong,has,st:!has?'na':(ac/w-pp/w>=-3?'ok':ac/w-pp/w>=-10?'wn':'bd')};}
const COL={ok:'#2e8b57',wn:'#d98e04',bd:'#c0392b',na:'#7b8a91'};
const LAB={ok:'Đúng/vượt kế hoạch',wn:'Chậm nhẹ',bd:'Chậm nhiều',na:'Chưa có báo cáo'};
const bar=(pp,act,col)=>`<div class="tdb"><i style="width:${Math.min(100,act==null?0:act)}%;background:${col}"></i><u style="left:${Math.min(100,pp)}%"></u></div>`;
const chip=st=>`<span class="tdc" style="background:${COL[st]}">${LAB[st]}</span>`;

function css(){if($('#tdcss'))return;const s=document.createElement('style');s.id='tdcss';s.textContent=`
#tdr{max-width:980px;margin:0 auto;padding:12px 12px calc(40px + env(safe-area-inset-bottom))}
#tdr h2{font-size:18px;margin:2px 0 4px}#tdr h3{font-size:15px;margin:16px 0 6px}
.tdt{display:flex;gap:6px;overflow-x:auto;margin:8px 0 12px;scrollbar-width:none}.tdt::-webkit-scrollbar{display:none}
.tdt button{flex:1 0 auto;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:8px 14px;font-weight:600;white-space:nowrap}
.tdt button[aria-pressed=true]{background:var(--acc);border-color:var(--acc);color:#fff}
.tdk{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:8px 0}
@media(min-width:640px){.tdk{grid-template-columns:repeat(4,1fr)}}
.tdk>div,.tdcard{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:10px 12px}
.tdk b{display:block;font-size:20px}.tdk span{font-size:12px;color:var(--mute)}
.tdcard{margin:8px 0}.tdcard.hot{border-left:4px solid var(--acc2)}
.tdh{display:flex;justify-content:space-between;gap:8px;align-items:center}.tdh b{font-size:15px}
.tds{font-size:12.5px;color:var(--mute)}
.tdb{position:relative;height:12px;border-radius:6px;background:var(--line);margin:7px 0 3px;overflow:visible}
.tdb i{position:absolute;left:0;top:0;bottom:0;border-radius:6px}
.tdb u{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--ink);text-decoration:none}
.tdc{color:#fff;border-radius:999px;font-size:11.5px;padding:2px 8px;white-space:nowrap}
.tdn{font-size:12.5px;background:var(--accbg);border-radius:var(--r);padding:8px 10px;margin:8px 0;color:var(--ink)}
table.tdtb{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}
.tdtb th,.tdtb td{border-bottom:1px solid var(--line);padding:6px 4px;text-align:right}.tdtb th:first-child,.tdtb td:first-child{text-align:left}
.tdtb th{font-size:12px;color:var(--mute);font-weight:600}
.tdw{overflow-x:auto}
.tdg{display:flex;align-items:flex-end;gap:2px;height:130px;margin:8px 0 2px;overflow-x:auto;padding-bottom:2px}
.tdg div{flex:1 0 16px;position:relative;background:var(--accbg);border-radius:3px 3px 0 0}
.tdg div i{position:absolute;left:0;right:0;bottom:0;background:var(--acc);border-radius:3px 3px 0 0}
.tdg div.t{outline:2px solid var(--acc2)}.tdg div em{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:9px;font-style:normal;color:var(--acc2);font-weight:700}
.tdx{display:flex;gap:2px;font-size:9px;color:var(--mute);overflow-x:auto}.tdx span{flex:1 0 16px;text-align:center}
.tdf label{display:block;font-size:13px;color:var(--mute);margin:8px 0 3px}
.tdf input,.tdf select,.tdf textarea{width:100%;border:1px solid var(--line);border-radius:8px;padding:9px;font:inherit;background:var(--card);color:var(--ink)}
.tdrow{display:grid;grid-template-columns:1fr 92px;gap:8px;align-items:center;margin:5px 0}
.tdbtn{border:0;border-radius:var(--r);background:var(--acc2);color:#fff;font-weight:700;padding:12px 16px;width:100%;margin-top:12px}
.tdbtn.s{background:var(--accbg);color:var(--ink);width:auto;padding:6px 10px;margin:0;font-weight:600;font-size:12px}
.tdz{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
.tdz button{border:1px solid var(--line);background:var(--card);border-radius:8px;padding:7px 10px;font-size:13px}
.tdz button[aria-pressed=true]{background:var(--acc);color:#fff;border-color:var(--acc)}
.late{color:#c0392b;font-weight:700}
`;document.head.appendChild(s);}

function head(){const d=todayS(),i=ix(d);return`<h2>Kế hoạch &amp; Tiến độ</h2><div class="tds">Kết cấu vành khăn Hầm B1 và Tầng 1 · hôm nay ${WK[new Date(d+'T00:00:00').getDay()]} ${dm(d)}${i<0?' (chưa đến ngày bắt đầu kế hoạch)':i>=K.dates.length?' (đã qua hết kế hoạch)':''}</div>`;}

function vOv(){
  const d=todayS(),Z=zones(),i=clampI(d);
  let W=0,P=0,A=0,hasA=false;Z.forEach(z=>z.items.forEach(it=>{const x=info(it,d),w=wgt(it);W+=w;P+=x.pp*w;A+=x.cur*w;if(x.act!=null)hasA=true;}));
  const nxt=Z.filter(z=>z.pour>=d)[0];
  const commit=K.commit['Tổng quân cam kết'][i];
  const act=reps().filter(r=>r.date===d);
  const late=Z.filter(z=>z.pour>=d).map(z=>({z,x:zInfo(z,d)})).filter(o=>o.x.st==='bd'||o.x.st==='wn');
  let h=head();
  h+=`<div class="tdk"><div><b>${f1(P/W,0)}%</b><span>Kế hoạch tính đến đầu ngày hôm nay</span></div><div><b>${hasA?f1(A/W,0)+'%':'—'}</b><span>Thực tế (báo cáo gần nhất)</span></div><div><b>${nxt?dm(nxt.pour):'—'}</b><span>Đổ BT tiếp theo${nxt?': '+esc(nxt.k):''}</span></div><div><b>${commit}</b><span>Quân cam kết hôm nay</span></div></div>`;
  if(!reps().length)h+=`<div class="tdn">Chưa có báo cáo thực tế nên các chỉ số "Thực tế" đang để trống. Vào tab <b>Báo cáo</b> để nhập % hoàn thành và quân số đầu ngày (7h–8h) hoặc cuối ngày (17h30–19h).</div>`;
  else if(!act.length)h+=`<div class="tdn">Hôm nay chưa có báo cáo. Nhắc giám sát nhập quân số lúc 7h–8h và khối lượng lúc 17h30–19h.</div>`;
  h+='<h3>Các zone theo ngày đổ bê tông</h3>';
  Z.forEach(z=>{const x=zInfo(z,d),n=diff(d,z.pour),done=n<0&&x.cur>=99;
    h+=`<div class="tdcard${nxt&&nxt.k===z.k?' hot':''}" data-z="${esc(z.k)}"><div class="tdh"><b>${esc(z.k)} · ${esc(z.ntp)}</b>${chip(x.st)}</div>${bar(x.pp,x.cur>0||x.has?x.cur:null,COL[x.st])}<div class="tds">Kế hoạch ${f1(x.pp,0)}% · Thực tế ${x.has?f1(x.act,0)+'%':'chưa báo cáo'} · Đổ ${dm(z.pour)} (${n>0?'còn '+n+' ngày':n===0?'hôm nay':'đã qua '+(-n)+' ngày'})</div></div>`;});
  h+=`<h3>Việc hôm nay theo kế hoạch</h3><div class="tdw"><table class="tdtb"><tr><th>Zone · việc</th><th>Quân</th><th>KL ngày</th></tr>`;
  let any=false;K.items.forEach(it=>{const q=it.plan_qty[i]||0,p=it.plan_ppl[i]||0;if(q>0||p>0){any=true;h+=`<tr><td>${esc(it.floor+' '+it.zone)} · ${esc(it.task)}${d===it.pour?' <b>(ngày đổ)</b>':''}</td><td>${p}</td><td>${q?f1(q,1)+' '+it.unit:'—'}</td></tr>`;}});
  if(!any)h+='<tr><td colspan=3>Không có việc trong kế hoạch ngày này.</td></tr>';
  h+='</table></div>';
  h+=`<div class="tdn">Số liệu kế hoạch theo file bố trí quân REV49 (19/11). Hầm B1 tính trên khối lượng còn lại tại 19/11. Vạch đen trên thanh tiến độ là mức kế hoạch cần đạt tính đến đầu ngày hôm nay.</div>`;
  return h;
}
function vZone(){
  const d=todayS(),Z=zones();if(!zsel)zsel=(Z.filter(z=>z.pour>=d)[0]||Z[0]).k;
  const z=Z.find(x=>x.k===zsel),zi=zInfo(z,d),m=K.kl[z.k];
  let h=head()+`<div class="tdz">${Z.map(o=>`<button data-zs="${esc(o.k)}" aria-pressed="${o.k===zsel}">${esc(o.k)}</button>`).join('')}</div>`;
  h+=`<div class="tdcard"><div class="tdh"><b>${esc(z.k)} · ${esc(z.ntp)}</b>${chip(zi.st)}</div><div class="tds">Diện tích ${f1(m.area,0)} m² · BT dầm sàn ${f1(m.bt,0)} m³ · Đổ ${dm(z.pour)} (${WK[new Date(z.pour+'T00:00:00').getDay()]})</div>${bar(zi.pp,zi.has?zi.cur:null,COL[zi.st])}<div class="tds">Kế hoạch ${f1(zi.pp,0)}% · Thực tế ${zi.has?f1(zi.act,0)+'%':'chưa báo cáo'} · Còn ${f1(zi.cong,0)} công theo định mức</div></div>`;
  z.items.forEach(it=>{const x=info(it,d),first=it.plan_ppl.findIndex(v=>v>0),last=it.plan_ppl.length-1-[...it.plan_ppl].reverse().findIndex(v=>v>0);
    h+=`<div class="tdcard"><div class="tdh"><b>${esc(it.task)}</b>${chip(x.st)}</div><div class="tds">KL ${f1(it.total,1)} ${it.unit} · kế hoạch làm ${first>=0?dm(K.dates[first])+' → '+dm(K.dates[last]):'—'} · ${esc(it.note.split('·')[0])}</div>${bar(x.pp,x.act,COL[x.st])}
    <div class="tdw"><table class="tdtb"><tr><th>Chỉ tiêu</th><th>Kế hoạch</th><th>Thực tế / cần</th></tr>
    <tr><td>% hoàn thành đầu ngày hôm nay</td><td>${f1(x.pp,0)}%</td><td>${x.act==null?'—':f1(x.act,0)+'%'}</td></tr>
    <tr><td>KL còn lại (${it.unit})</td><td>${f1(it.total*(1-x.pp/100),1)}</td><td>${f1(x.rem,1)}</td></tr>
    <tr><td>Số ngày còn đến ngày đổ</td><td colspan=2>${x.dl} ngày</td></tr>
    <tr><td>KL cần làm mỗi ngày (${it.unit})</td><td>${f1(it.plan_qty[clampI(d)]||0,1)}</td><td>${f1(x.need,1)}</td></tr>
    <tr><td>Số người cần mỗi ngày (11h)</td><td>${x.pplPlan}</td><td class="${x.pplNeed>x.pplPlan+0.5?'late':''}">${f1(x.pplNeed,0)}${x.pplNeed>x.pplPlan+0.5?' (thiếu '+f1(x.pplNeed-x.pplPlan,0)+')':''}</td></tr>
    <tr><td>Công còn lại theo định mức</td><td>${f1(it.total*(1-x.pp/100)*DM[it.kind],0)}</td><td>${f1(x.cong,0)}</td></tr></table></div></div>`;});
  h+=`<div class="tdn">"Số người cần" = KL còn lại ÷ số ngày còn ÷ năng suất 1 người/ngày (${f1(PER.cf,2)} m² cốp pha, ${f1(PER.th,3)} tấn thép, làm 11h).</div>`;
  return h;
}
function vMan(){
  const d=todayS(),i=clampI(d);
  const tot=K.commit['Tổng quân cam kết'],plan=K.dates.map((_,j)=>K.items.reduce((s,it)=>s+(it.plan_ppl[j]||0),0));
  const mx=Math.max(...tot,...plan,1);
  let h=head()+'<h3>Quân cam kết theo ngày</h3><div class="tds">Cột nhạt: quân cam kết · cột đậm: quân bố trí vào việc theo kế hoạch</div><div class="tdg">'+K.dates.map((x,j)=>`<div class="${j===i?'t':''}" style="height:${tot[j]/mx*100}%">${j===i?'<em>nay</em>':''}<i style="height:${Math.min(100,plan[j]/Math.max(tot[j],1)*100)}%"></i></div>`).join('')+'</div><div class="tdx">'+K.dates.map(x=>`<span>${x.slice(8)}</span>`).join('')+'</div>';
  h+='<h3>Cần bao nhiêu quân để kịp tiến độ (tính từ hôm nay)</h3><div class="tdw"><table class="tdtb"><tr><th>Tổ</th><th>Cam kết</th><th>Kế hoạch</th><th>Cần</th></tr>';
  const T={VGC:['VGC cộng'],GDcons:['GDcons – ban ngày'],'Trọng':['Tổ Trọng']};
  Object.keys(T).forEach(n=>{let pl=0,nd=0;K.items.filter(it=>it.ntp===n&&it.pour>=d).forEach(it=>{const x=info(it,d);if(x.done)return;if((it.plan_ppl[i]||0)>0||(x.pp>0&&x.cur<x.pp)){pl+=it.plan_ppl[i]||0;nd+=x.pplNeed;}});
    const cm=K.commit[T[n][0]][i];
    h+=`<tr><td>${n}</td><td>${cm}</td><td>${pl}</td><td class="${nd>cm+0.5?'late':''}">${f1(nd,0)}</td></tr>`;});
  h+='</table></div><div class="tds">"Cần" chỉ tính các đầu việc đang làm hôm nay, dựa trên % thực tế nếu đã có báo cáo (chưa có thì lấy theo kế hoạch).</div>';
  h+='<h3>Quân từng tổ theo ngày (cam kết)</h3><div class="tdw"><table class="tdtb"><tr><th>Ngày</th>'+['Đà','Quốc','Trung','CN','GDcons','Tối','Trọng','Tổng'].map(x=>`<th>${x}</th>`).join('')+'</tr>';
  const C=K.commit,ks=['VGC – Mr Đà','VGC – Mr Quốc','VGC – Mr Trung','VGC – Công nhật','GDcons – ban ngày','GDcons – ca tối','Tổ Trọng','Tổng quân cam kết'];
  K.dates.forEach((x,j)=>{if(j<Math.max(0,i-1)||j>i+9)return;h+=`<tr${j===i?' style="background:var(--accbg)"':''}><td>${dow(x)} ${dm(x)}</td>${ks.map(k=>`<td>${C[k][j]}</td>`).join('')}</tr>`;});
  return h+'</table></div>';
}
function vPrep(){
  const d=todayS(),M=ld(MK,{}),Z=zones();let rows=[];
  const need={'Z1.2':'2026-11-25','Z2.1':'2026-12-02','Z2.2':'2026-12-02','Z3.1':'2026-12-04','Z1.1':'2026-12-05','Z3.2':'2026-12-10','Z1.3':'2026-12-12'};
  Z.forEach(z=>{const m=K.kl[z.k];const cf=z.items.find(i=>i.kind==='cf'),th=z.items.find(i=>i.kind==='th');
    const fd=it=>{const j=it.plan_ppl.findIndex(v=>v>0);return j>=0?K.dates[j]:null;};
    if(th){const dd=z.floor==='T1'?(need[z.zone]||fd(th)):fd(th);rows.push({id:z.k+'|th',g:'Thép',n:`${z.k}: thép gia công (Povina)`,q:f1(th.total,1)+' tấn',need:dd});}
    if(cf&&z.floor==='T1')rows.push({id:z.k+'|cf',g:'Cốp pha',n:`${z.k}: ván khuôn, giàn chống sàn`,q:f1(cf.total,0)+' m²',need:fd(cf)});
    rows.push({id:z.k+'|bt',g:'Bê tông & thiết bị',n:`${z.k}: bê tông dầm sàn + bơm + đội đổ (7 người)`,q:f1(m.bt,0)+' m³',need:z.pour});});
  const live={};Z.forEach(z=>live[z.k]=z.pour>=d);rows=rows.filter(r=>r.need&&live[r.id.split('|')[0]]).sort((a,b)=>a.need.localeCompare(b.need));
  let h=head()+`<div class="tdn">Danh mục sơ bộ lấy từ khối lượng kế hoạch. Ngày cần: thép T1 theo thứ tự Povina giao (file Excel), cốp pha theo ngày vào việc, bê tông theo ngày đổ. Cập nhật trạng thái từng dòng; dòng quá hạn hiện màu đỏ. Danh mục chi tiết (phụ kiện, thiết bị) sẽ rà theo biện pháp thi công khi anh duyệt.</div>`;
  ['Thép','Cốp pha','Bê tông & thiết bị'].forEach(g=>{h+=`<h3>${g}</h3><div class="tdw"><table class="tdtb"><tr><th>Hạng mục</th><th>SL</th><th>Cần</th><th>Trạng thái</th></tr>`;
    rows.filter(r=>r.g===g).forEach(r=>{const s=M[r.id]||'Chưa đặt',n=diff(d,r.need),lt=n<=3&&s!=='Đã về';
      h+=`<tr><td>${esc(r.n)}</td><td>${r.q}</td><td class="${lt?'late':''}">${dm(r.need)}<br><small>${n>0?'còn '+n+' ngày':n===0?'hôm nay':'quá '+(-n)+' ngày'}</small></td><td><select data-m="${esc(r.id)}" style="width:96px;padding:5px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)">${ST.map(o=>`<option${o===s?' selected':''}>${o}</option>`).join('')}</select></td></tr>`;});
    h+='</table></div>';});
  return h;
}
function vRep(){
  const d=todayS(),i=clampI(d),hr=new Date().getHours();
  const ses=(hr>=15)?'pm':'am';
  const P=[['VGC – Mr Đà','VGC – Mr Đà'],['VGC – Mr Quốc','VGC – Mr Quốc'],['VGC – Mr Trung','VGC – Mr Trung'],['VGC – Công nhật','VGC – Công nhật'],['GDcons – ban ngày','GDcons – ban ngày'],['GDcons – ca tối','GDcons – ca tối'],['Tổ Trọng','Tổ Trọng']];
  const act=K.items.filter(it=>{const x=info(it,d);return !x.done&&(it.plan_ppl[i]>0||(x.act!=null&&x.act<100)||it.plan_ppl.slice(Math.max(0,i-3),i+4).some(v=>v>0));});
  let h=head()+`<div class="tdn">Bản xem thử: báo cáo lưu trên máy này. Khi anh duyệt, sẽ nối với cơ sở dữ liệu chung để mọi người cùng thấy.</div><div class="tdf">
  <label>Ngày báo cáo</label><input type="date" id="rd" value="${d}">
  <label>Phiên báo cáo</label><select id="rs"><option value="am"${ses==='am'?' selected':''}>Đầu ngày (7h–8h): quân số và việc dự kiến</option><option value="pm"${ses==='pm'?' selected':''}>Cuối ngày (17h30–19h): khối lượng xong, tăng ca</option></select>
  <h3>Quân số có mặt</h3>${P.map(p=>`<div class="tdrow"><span>${p[0]} <small class="tds">(KH ${K.commit[p[1]][i]})</small></span><input type="number" inputmode="numeric" min="0" data-p="${esc(p[0])}" value="${K.commit[p[1]][i]}"></div>`).join('')}
  <div class="tdrow"><span>Quân tăng ca sau 17h30 (tổng)</span><input type="number" inputmode="numeric" min="0" id="rot" value="0"></div>
  <h3>% hoàn thành tích lũy từng hạng mục</h3><div class="tds">Nhập % đã xong so với tổng khối lượng của hạng mục (0–100). Để trống nếu không đổi.</div>
  ${act.map(it=>{const l=lastPct(it.id),x=info(it,d);return`<div class="tdrow"><span>${esc(it.floor+' '+it.zone)} · ${esc(it.task)}<br><small class="tds">KH đầu ngày ${f1(x.pp,0)}%${l?' · gần nhất '+f1(l.v,0)+'%':''}</small></span><input type="number" inputmode="decimal" min="0" max="100" data-i="${esc(it.id)}" placeholder="%" value="${l?l.v:''}"></div>`;}).join('')}
  <label>Ghi chú (vật tư, vướng mắc, thiếu quân…)</label><textarea id="rn" rows="3"></textarea>
  <button class="tdbtn" id="rsv">Lưu báo cáo</button></div>`;
  const R=reps().slice(-6).reverse();
  if(R.length){h+='<h3>Báo cáo gần đây (máy này)</h3>';R.forEach(r=>{h+=`<div class="tdcard"><div class="tdh"><b>${dow(r.date)} ${dm(r.date)} · ${r.ses==='am'?'Đầu ngày':'Cuối ngày'}</b><button class="tdbtn s" data-del="${r.ts}">Xóa</button></div><div class="tds">${Object.keys(r.pct||{}).length} hạng mục có % · tổng quân ${Object.values(r.ppl||{}).reduce((a,b)=>a+(+b||0),0)}${r.ot?' · tăng ca '+r.ot:''}${r.note?' · '+esc(r.note):''}</div></div>`;});}
  return h;
}
const V={ov:vOv,zn:vZone,mn:vMan,pr:vPrep,rp:vRep};
const TB=[['ov','Tổng quan'],['zn','Zone'],['mn','Nhân lực'],['pr','Chuẩn bị'],['rp','Báo cáo']];
function draw(){
  const r=$('#tdr');if(!r)return;
  r.innerHTML=`<div class="tdt">${TB.map(t=>`<button data-tb="${t[0]}" aria-pressed="${t[0]===tab}">${t[1]}</button>`).join('')}</div>`+V[tab]();
  r.querySelectorAll('[data-tb]').forEach(b=>b.onclick=()=>{tab=b.dataset.tb;draw();window.scrollTo(0,0);});
  r.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{zsel=b.dataset.z;tab='zn';draw();window.scrollTo(0,0);});
  r.querySelectorAll('[data-zs]').forEach(b=>b.onclick=()=>{zsel=b.dataset.zs;draw();});
  r.querySelectorAll('[data-m]').forEach(s=>s.onchange=()=>{const M=ld(MK,{});M[s.dataset.m]=s.value;sv(MK,M);draw();});
  r.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(!confirm('Xóa báo cáo này?'))return;sv(RK,ld(RK,[]).filter(x=>String(x.ts)!==b.dataset.del));draw();});
  const sb=$('#rsv');if(sb)sb.onclick=()=>{
    const rec={date:$('#rd').value,ses:$('#rs').value,ppl:{},pct:{},ot:+$('#rot').value||0,note:$('#rn').value.trim(),ts:Date.now()};
    r.querySelectorAll('[data-p]').forEach(e=>{if(e.value!=='')rec.ppl[e.dataset.p]=+e.value;});
    let bad=false;r.querySelectorAll('[data-i]').forEach(e=>{if(e.value==='')return;const v=+e.value;if(!(v>=0&&v<=100))bad=true;rec.pct[e.dataset.i]=v;});
    if(bad){alert('% phải nằm trong khoảng 0–100');return;}
    if(!rec.date){alert('Chọn ngày báo cáo');return;}
    const a=ld(RK,[]);a.push(rec);sv(RK,a);tab='ov';draw();window.scrollTo(0,0);
  };
}
window.TD={open:async function(el){
  css();el.innerHTML='<div id="tdr"><div class="empty">Đang tải kế hoạch…</div></div>';
  try{if(!K){const r=await fetch('data/kehoach.json',{cache:'no-cache'});K=await r.json();}}
  catch(e){el.innerHTML='<div id="tdr"><div class="tdn">Chưa tải được dữ liệu kế hoạch. Kiểm tra mạng rồi mở lại.</div></div>';return;}
  draw();
}};
})();
