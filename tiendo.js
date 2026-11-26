/* Kế hoạch & Tiến độ – FSO (bản xem thử v2). Kế hoạch: data/kehoach.json (Excel bố trí quân B1–T1, REV49).
   Thực tế: số quân ghi tay 19–26/11 (bảng giấy) + báo cáo nhập trên app. Báo cáo hiện lưu trên máy này; bước sau đồng bộ chung. */
(function(){
const $=s=>document.querySelector(s);
const DM={cf:24.76/100,th:5.0},HE=1.375,PER={cf:HE/DM.cf,th:HE/DM.th};
const WK=['CN','T2','T3','T4','T5','T6','T7'],ST=['Chưa đặt','Đã đặt','Đang về','Đã về'];
const NTPS=['VGC','GDcons','Trọng'];
let K=null,tab='ov',fl=(function(){try{return localStorage.getItem('td_fl2')||'B1'}catch(e){return'B1'}})(),zsel=null,RK='td_rep2',MK='td_mat',bdate=null,OPEN=new Set(),TIMER=null;
const SBU='https://ppdxqcrckbwckqzumlwy.supabase.co/rest/v1/rpc/',SBK='sb_publishable_obBOmHzVr55kpb2eG2BwAQ_wcNW7tkg';
let DEV='';try{DEV=localStorage.getItem('bv_vid')||localStorage.getItem('td_dev')||'';if(!DEV){DEV='d-'+Math.random().toString(36).slice(2,12);localStorage.setItem('td_dev',DEV);}}catch(e){DEV=DEV||'d-'+Math.random().toString(36).slice(2,12);}
const FLN={B1:'Hầm B1',T1:'Tầng 1'};
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
let RC=null,RS=null,SYN={t:null,err:false,busy:false};
const setRC=a=>{RC=a;RS=null;sv(RK,a);};
const reps=()=>{if(!RC)RC=ld(RK,[]);return RS||(RS=RC.concat((K&&K.sl_seed)||[]).sort((a,b)=>(a.date+a.ses+a.ts).localeCompare(b.date+b.ses+b.ts)));};
async function rpc(fn,body){const r=await fetch(SBU+fn,{method:'POST',headers:{apikey:SBK,Authorization:'Bearer '+SBK,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(r.status);const t=await r.text();return t?JSON.parse(t):null;}
async function sync(){
  if(SYN.busy)return false;SYN.busy=true;let ch=false;
  try{
    reps();
    for(const r of RC.filter(x=>!x.sy)){const o=Object.assign({},r);delete o.sy;await rpc('td_save',{p:o});r.sy=true;ch=true;}
    const L=await rpc('td_list',{p_from:iso(new Date(Date.now()-45*864e5))})||[];
    const m={};RC.forEach(r=>m[r.id]=r);const ids=new Set();
    L.forEach(o=>{ids.add(o.id);const n=Object.assign({},o.data,{sy:true});if(!m[o.id]||JSON.stringify(m[o.id])!==JSON.stringify(n))ch=true;m[o.id]=n;});
    const nr=Object.values(m).filter(r=>!r.sy||ids.has(r.id));if(nr.length!==RC.length)ch=true;
    setRC(nr);SYN={t:Date.now(),err:false,busy:false};
  }catch(e){SYN.err=true;SYN.busy=false;}
  SYN.busy=false;return ch;}
const wgt=it=>it.total*DM[it.kind];
const sum=a=>a.reduce((x,y)=>x+(+y||0),0);
const itemsF=()=>K.items.filter(it=>fl==='all'||it.floor===fl);
/* ---- thực tế ---- */
function apl(it,j){ // quân thực tế của đầu việc ngày j (null = chưa có số)
  let v=null;const s=K.act&&K.act[it.id];if(s&&s[j]!=null)v=s[j];
  const d=K.dates[j];reps().forEach(r=>{if(r.date===d&&r.ppl&&r.ppl[it.id]!=null&&r.ppl[it.id]!=='')v=+r.ppl[it.id];});return v;}
function lastPct(it,d){const r=reps(),a=it.id,b=`${it.floor}|${it.zone}|ds|${it.kind}`;for(let i=r.length-1;i>=0;i--){const p=r[i].pct;if(!p||(d&&r[i].date>d))continue;const k=p[a]!=null&&p[a]!==''?a:p[b]!=null&&p[b]!==''?b:null;if(k)return{v:+p[k],date:r[i].date};}return null;}
function planPct(it,i){let s=0;for(let j=0;j<i&&j<it.plan_qty.length;j++)s+=it.plan_qty[j];return Math.min(100,s/it.total*100);}
const RATE=it=>{const q=sum(it.plan_qty),p=sum(it.plan_ppl);return q>0&&p>0?q/p:PER[it.kind];}; // KL làm được / người-ngày theo kế hoạch của chính tổ đó
const sibTh=it=>K.items.find(x=>x.floor===it.floor&&x.zone===it.zone&&x.kind==='th');
function calc(it,t0,d){ // KL đã làm ước tính: số quân thực tế các ngày đã qua (chỉ số < t0) × năng suất; zone đã đổ BT = 100%
  const r=RATE(it);let est=0,pa=0,pk=0,miss=0;
  for(let j=0;j<t0&&j<N();j++){const v=apl(it,j),pl=it.plan_ppl[j]||0;pk+=pl;if(v!=null){est+=v*r;pa+=v;}else if(pl>0)miss++;}
  let act=Math.min(100,est/it.total*100);
  const a=lastPct(it,d);if(a&&a.v>act)act=a.v;
  if(it.kind==='cf'){const sb=sibTh(it),b=sb&&lastPct(sb,d);if(b&&b.v>=99.5)act=100;} // thép đã nghiệm thu thì cốp pha đã xong
  const pz=pouredDate(it.floor,it.zone);if(pz&&pz<=d)act=100;
  return{act,pa,pk,miss,est,r};
}
function info(it,d){
  const t=ix(d),t0=Math.min(Math.max(t,0),N()),i=Math.min(Math.max(t,0),N()-1),pi=ix(it.pour);
  const pp=planPct(it,t0),c=calc(it,t0,d),act=c.act,r=c.r;
  const done=act>=99.5,rem=done?0:it.total*(1-act/100);
  const dl=t>pi?0:Math.max(0,pi-Math.max(t,0)+1),dlc=Math.max(1,dl);
  let pn=0;for(let j=Math.max(t,0);j<=Math.min(pi,N()-1);j++)pn+=it.plan_ppl[j]||0;
  const capKH=pn*r,short=done?0:Math.max(0,rem-capKH),gap=act-pp,sev=done?0:Math.max(-gap,short/it.total*100);
  const lateF=!done&&sev>=3,xp=Math.max(0,rem/(r*dlc)-(dl>0?pn/dl:0)),st=done?'ok':(pp<0.5&&act<0.5&&!lateF)?'na':lateF?(xp>=3||gap<-10?'bd':'wn'):gap>=-3?'ok':'wn';
  let s3=0,n3=0;for(let j=t0-1;j>=0&&n3<3;j--){const v=apl(it,j);if(v!=null){s3+=v;n3++;}}
  const avg3=n3?s3/n3:null;
  return{pp,act,cur:act,rem,remPp:it.total*(1-pp/100),dl,pplNeed:done?0:rem/(r*dlc),pplPlan:dl>0?pn/dl:0,pplToday:it.plan_ppl[i]||0,pplAct:apl(it,i),
    cong:rem*DM[it.kind],congPp:it.total*(1-pp/100)*DM[it.kind],short,gap,late:!done&&sev>=3,st,done,hd:c.pk>0?c.pa/c.pk*100:null,pa:c.pa,pk:c.pk,miss:c.miss,r,avg3,eta:!done&&avg3>0?Math.ceil(rem/(avg3*r)):null,capKH};
}
function zones(){const m={};K.items.forEach(it=>{const k=it.floor+' '+it.zone;(m[k]=m[k]||{k,floor:it.floor,zone:it.zone,ntp:it.ntp,pour:it.pour,items:[]}).items.push(it);});return Object.values(m).sort((a,b)=>a.pour.localeCompare(b.pour)||a.k.localeCompare(b.k));}
const zonesF=()=>zones().filter(z=>fl==='all'||z.floor===fl);
const RANK={na:0,ok:1,wn:2,bd:3};
function zInfo(z,d){let w=0,pp=0,ac=0,cong=0,st='na',pa=0,pk=0,ppl=0,pat=0,pah=false,late=0;
  z.items.forEach(it=>{const x=info(it,d),ww=wgt(it);w+=ww;pp+=x.pp*ww;ac+=x.act*ww;cong+=x.cong;if(RANK[x.st]>RANK[st])st=x.st;pa+=x.pa;pk+=x.pk;ppl+=x.pplToday;if(x.pplAct!=null){pat+=x.pplAct;pah=true;}if(x.late)late++;});
  return{pp:pp/w,act:ac/w,cur:ac/w,cong,has:true,st,hd:pk>0?pa/pk*100:null,ppl,pat:pah?pat:null,late};}
const COL={ok:'#2e8b57',wn:'#e0a100',bd:'#c0392b',na:'#7b8a91'};
const LAB={ok:'Đạt kế hoạch',wn:'Chậm nhẹ',bd:'Chậm nhiều',na:'Chưa đến kế hoạch làm'};
const FC={B1:'#6a4c93',T1:'#1d7a8c'};
const chip=st=>`<span class="tdc" style="background:${COL[st]}">${LAB[st]}</span>`;
const bar=(pp,act,col,hd)=>`<div class="tdb" style="background:${col}33"><i style="width:${Math.min(100,act==null?0:act)}%;background:${col}"></i><u style="left:${Math.min(100,pp)}%"></u><span class="tdbt">${act==null?'TT chưa nhập %'+(hd!=null?' (huy động '+f1(hd,0)+'%)':''):'TT '+f1(act,0)+'%'} · KH ${f1(pp,0)}%</span></div>`;
function css(){if($('#tdcss'))return;const s=document.createElement('style');s.id='tdcss';s.textContent=`
#tdr{max-width:980px;margin:0 auto;padding:10px 12px calc(40px + env(safe-area-inset-bottom))}
#tdr h3{font-size:15px;margin:18px 0 6px}
.tdfl{position:sticky;top:0;z-index:3;background:var(--bg);padding:6px 0;display:flex;gap:6px}
.tdfl{align-items:center}.tdfl label{font-weight:700;font-size:14px}.tdfl select{flex:1;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:10px;font-weight:700;font-size:15px}
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
.tdb{position:relative;height:20px;border-radius:6px;background:var(--line);margin:8px 0 4px}.tdbt{position:absolute;left:8px;top:0;line-height:20px;font-size:11.5px;font-weight:700;color:#111;text-shadow:0 0 3px #fff,0 0 3px #fff}
.tdb i{position:absolute;left:0;top:0;bottom:0;border-radius:6px}.tdb u{position:absolute;top:-3px;bottom:-3px;width:3px;z-index:1;background:#3b6fb6;text-decoration:none;border-radius:2px}
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
.tdcard.lt{border:1px solid #c0392b;border-left:6px solid #c0392b;background:rgba(192,57,43,.07)}
.tdalert{background:#c0392b;color:#fff;border-radius:var(--r);padding:9px 12px;font-weight:700;font-size:13px;margin:8px 0}
.tdok2{background:#2e8b57;color:#fff;border-radius:var(--r);padding:9px 12px;font-weight:700;font-size:13px;margin:8px 0}
.tdm{font-size:13px;margin:6px 0}.tdcard .tdtb{font-size:12px}.tdcard .tdtb th,.tdcard .tdtb td{padding:5px 3px}.tdcard .tdtb td:first-child{white-space:nowrap}.tdtb tr.lrow td{background:rgba(192,57,43,.12)}
.tdfh{color:#fff;font-weight:700;padding:5px 12px;border-radius:8px;margin:14px 0 6px;font-size:14px}
.tdfb{color:#fff;border-radius:6px;padding:1px 6px;font-size:11px}
details.tdzd{background:var(--card);border:1px solid var(--line);border-radius:var(--r);margin:8px 0}
details.tdzd>summary{list-style:none;cursor:pointer;padding:10px 12px;border-radius:var(--r)}details.tdzd>summary::-webkit-details-marker{display:none}
details.tdzd[open]>summary{border-bottom:1px solid var(--line)}.tdzb{padding:6px 10px 10px}
details.tdmd>summary{cursor:pointer;font-weight:700;font-size:14px;padding:10px 12px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);margin:8px 0}
.tdsl{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}.tdsl label{font-size:12px;color:var(--mute);margin:0}.tdsl input{width:100%;margin-top:2px}
.tdbd{display:flex;gap:6px;align-items:center;margin:6px 0}
.tdpop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
.tdpb{background:var(--card);color:var(--ink);border-radius:14px;padding:22px 20px;max-width:340px;width:100%;text-align:center}
.tdok{width:56px;height:56px;border-radius:50%;background:#2e8b57;color:#fff;font-size:34px;line-height:56px;margin:0 auto 8px}
.tdsvg{width:100%;height:auto;min-width:640px}
`;document.head.appendChild(s);}
const head=()=>{const d=todayS();return`<div class="tds">Kết cấu vành khăn Hầm B1 và Tầng 1 · hôm nay ${dow(d)} ${dm(d)}</div>`};
function flbar(){return`<div class="tdfl"><label for="flsel">Tầng</label><select id="flsel" style="border-color:${fl==='all'?'#3d4a50':FC[fl]}"><option value="B1"${fl==='B1'?' selected':''}>Hầm B1</option><option value="T1"${fl==='T1'?' selected':''}>Tầng 1</option><option value="all"${fl==='all'?' selected':''}>Tất cả (chia theo tầng)</option></select></div>`;}
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
  const pts=[];K.dates.forEach((x,j)=>{if(x>=d)return;let w=0,a=0;items.forEach(it=>{a+=calc(it,j+1,x).act*wgt(it);w+=wgt(it)});if(w)pts.push([X(j)+pw/2,Yp(a/w)]);});
  if(pts.length){s+=`<polyline fill="none" stroke="#e36414" stroke-width="2.6" points="${pts.map(p=>p.join(',')).join(' ')}"/>`+pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#e36414"/>`).join('');}
  const ti=ix(d);if(ti>=0&&ti<n)s+=`<line x1="${X(ti)+pw/2}" x2="${X(ti)+pw/2}" y1="${T-8}" y2="${T+ph}" stroke="#e36414" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${X(ti)+pw/2}" y="${T-12}" font-size="9" font-weight="700" fill="#e36414" text-anchor="middle">hôm nay</text>`;
  const seen={};items.forEach(it=>{const k=it.floor+' '+it.zone;if(seen[k])return;seen[k]=1;const j=ix(it.pour);if(j<0||j>=n)return;const x=X(j)+pw/2;
    s+=`<line x1="${x}" x2="${x}" y1="${T-4}" y2="${T+ph}" stroke="${FC[it.floor]}" stroke-width="1.4" stroke-dasharray="2 2"/><polygon points="${x},${T-6} ${x-5},${T-14} ${x+5},${T-14}" fill="${FC[it.floor]}"/><text transform="translate(${x+3},${T-17}) rotate(-62)" font-size="9" font-weight="700" fill="${FC[it.floor]}">Đổ ${k}</text>`;});
  Object.keys(K.thep_ve||{}).forEach(k=>{if(!items.some(it=>it.floor+' '+it.zone===k))return;const j=ix(K.thep_ve[k]);if(j<0||j>=n)return;const x=X(j)+pw/2;s+=`<rect x="${x-4}" y="${T+ph-8}" width="8" height="8" transform="rotate(45 ${x} ${T+ph-4})" fill="#1f9d55"><title>Thép về ${k}</title></rect>`;});
  s+='</svg>';
  return`<div class="tdw">${s}</div><div class="tdlg"><span><i style="background:#3b6fb6;opacity:.5"></i>Quân kế hoạch/ngày</span><span><i style="background:#e36414"></i>Quân thực tế/ngày</span><span><i style="background:#3b6fb6"></i>% tiến độ kế hoạch (trục phải)</span><span><i style="background:#e36414"></i>% khối lượng đã làm (ước tính từ quân thực tế)</span><span>▼ đổ bê tông</span><span><i style="background:#1f9d55;transform:rotate(45deg)"></i>thép về</span>${flAll?'<span>◯ tổng quân ghi tay trong bảng giấy</span>':''}</div>`;
}
/* ---- màn hình ---- */
const fgroup=(list,fn)=>{ // chia theo tầng khi chọn Tất cả
  if(fl!=='all')return list.length?fn(list):'';
  return ['B1','T1'].map(f=>{const l=list.filter(x=>(x.floor||x.z&&x.z.floor)===f);return l.length?`<div class="tdfh" style="background:${FC[f]}">${FLN[f]}</div>`+fn(l):''}).join('');};
function mapBox(sel,mode,open){return`<details class="tdmd" data-k="map-${tab}"${open?' open':''}><summary>Mặt bằng chia zone (màu theo mức độ) · bấm để ${open?'thu gọn':'mở'}</summary>${maps(sel,mode)}</details>`;}
function vOv(){
  const d=todayS(),Z=zonesF(),it=itemsF(),i=clampI(d);
  let W=0,P=0,A=0,kq=0,tq=0,tqh=false;
  it.forEach(x=>{const f=info(x,d),w=wgt(x);W+=w;P+=f.pp*w;A+=f.act*w;kq+=x.plan_ppl[i]||0;if(f.pplAct!=null){tq+=f.pplAct;tqh=true;}});
  const open=Z.filter(z=>!poured(z)),dn=Z.filter(z=>poured(z)),nxt=open.filter(z=>z.pour>=d)[0]||open[0];
  const lateZ=open.filter(z=>zInfo(z,d).late>0);
  let h=head()+`<div class="tdcols"><div class="tdcol kh"><h4>Kế hoạch</h4><div class="v">${nxt?dm(nxt.pour):'—'}</div><div class="s">đổ BT tiếp theo${nxt?': '+esc(nxt.k):''}</div><div class="v" style="margin-top:6px">${f1(P/W,0)}%</div><div class="s">khối lượng KH đến đầu hôm nay</div><div class="v" style="margin-top:6px">${kq} người</div><div class="s">quân KH hôm nay</div></div>
  <div class="tdcol tt"><h4>Thực tế</h4><div class="v">${dn.length}/${Z.length} zone</div><div class="s">đã đổ BT (theo báo cáo ngày)</div><div class="v" style="margin-top:6px">${f1(A/W,0)}%</div><div class="s">khối lượng đã làm (ước tính)</div><div class="v" style="margin-top:6px">${tqh?tq+' người':'chưa có'}</div><div class="s">quân thực tế hôm nay</div></div></div>`;
  h+=mapBox(null,'go',true);
  h+=`<h3>Việc hôm nay</h3>`+(fgroup(it.filter(x=>(x.plan_qty[i]||0)>0||(x.plan_ppl[i]||0)>0),l=>{let t=`<div class="tdw"><table class="tdtb"><tr><th>Zone · việc</th><th class="k">KH quân</th><th class="t">TT quân</th><th class="k">KL kế hoạch</th></tr>`;
    l.forEach(x=>{const q=x.plan_qty[i]||0,p=x.plan_ppl[i]||0,a=apl(x,i);t+=`<tr><td>${esc(x.floor+' '+x.zone)} · ${esc(x.task)}${d===x.pour?' <b>(ngày đổ)</b>':''}</td><td class="k">${p}</td><td class="t">${a==null?'—':a}</td><td class="k">${q?f1(q,1)+' '+x.unit:'—'}</td></tr>`;});return t+'</table></div>';})||'<div class="tds">Không có việc theo kế hoạch hôm nay.</div>');
  h+=lateZ.length?`<div class="tdalert">⚠ ${lateZ.length} zone đang chậm so với ngày đổ BT: ${lateZ.map(z=>esc(z.k)).join(', ')}. Quân KH không đủ để kịp, xem dòng đỏ bên dưới.</div>`:`<div class="tdok2">✔ Các zone chưa đổ đang đạt kế hoạch.</div>`;
  h+='<h3>Ngày đổ bê tông · khối lượng · quân cần (zone chưa đổ)</h3>';
  h+=(open.length?fgroup(open,l=>l.map(z=>zcard(z,d,false)).join('')):'<div class="tdn">Tất cả zone của lựa chọn này đã đổ BT.</div>');
  if(dn.length)h+=`<details class="tdmd" data-k="done-ov"><summary>Zone đã đổ BT (${dn.length})</summary>${dn.map(z=>`<div class="tdcard" style="border-left-color:${COL.ok}"><b>${esc(z.k)}</b> · ${esc(z.ntp)}<div class="tdm">${pourLine(z,d)}</div></div>`).join('')}</details>`;
  h+='<h3>Biểu đồ nhân lực, tiến độ và các mốc</h3>'+chart(it,fl==='all');
  h+=stepsHtml(false);
  return h+`<div class="tdn"><b>Cách tính.</b> Kế hoạch lấy từ file bố trí quân REV49 (19/11). <b>Khối lượng đã làm</b> = số quân thực tế các ngày đã qua (bảng giấy 19–26/11 và báo cáo quân số) × năng suất theo kế hoạch của tổ đó; zone đã đổ BT tính 100%, cốp pha tính xong khi thép đã nghiệm thu. <b>Quân cần</b> = khối lượng còn lại ÷ năng suất ÷ số ngày còn đến ngày đổ. Dòng đỏ = quân KH các ngày còn lại không đủ làm hết khối lượng còn lại. Hầm B1 tính trên khối lượng còn lại tại 19/11.</div>`;
}
function zoneChips(){const d=todayS();return`<div class="tdz">${zonesF().map(z=>`<button data-zs="${esc(z.k)}" aria-pressed="${z.k===zsel}" style="--c:${COL[zInfo(z,d).st]}">${esc(z.k)}</button>`).join('')}</div>`;}
function dayGrid(it,d){
  const x=info(it,d),t=ix(d),pi=ix(it.pour),a=Math.max(0,Math.min(it.plan_ppl.findIndex(v=>v>0)-1,Math.max(t,0))),b=Math.min(N()-1,Math.max(pi,a+6,clampI(d)+2));
  let h='<div class="tdw"><table class="tdtb"><tr><th></th>'+K.dates.slice(a,b+1).map((y,j)=>`<th class="${a+j===t?'today':''}">${dow(y)}<br>${dm(y)}${a+j===pi?'<br><b>đổ BT</b>':''}</th>`).join('')+'</tr>';
  const row=(lab,fn,cls)=>{h+=`<tr><td>${lab}</td>`+K.dates.slice(a,b+1).map((y,j)=>{const o=fn(a+j);return`<td class="${cls}${a+j===t?' today':''}${o&&o[1]?' late':''}">${o?o[0]:'·'}</td>`;}).join('')+'</tr>'};
  row('Quân KH',j=>it.plan_ppl[j]?[it.plan_ppl[j]]:null,'k');
  row('Quân thực tế',j=>{const v=apl(it,j);return v==null?null:[v]},'t');
  row('Quân cần để kịp',j=>{if(x.done||j<Math.max(t,0)||j>pi)return null;return[f1(x.pplNeed,0),x.pplNeed>(it.plan_ppl[j]||0)+0.5]},'t');
  row(`KL KH (${it.unit})`,j=>it.plan_qty[j]?[f1(it.plan_qty[j],1)]:null,'k');
  return h+'</table></div>';}
const KN=(it,z)=>it.kind==='th'?'Cốt thép':z.floor==='B1'?'Cốp pha đất':'Cốp pha sàn';
const KS=(it)=>it.kind==='th'?'Thép':'Cốp pha';
const KD=it=>it.kind==='th'?1:0;
function thepVe(z){const th=z.items.find(i=>i.kind==='th');if(!th)return null;if(K.thep_ve&&K.thep_ve[z.k])return K.thep_ve[z.k];const j=th.plan_ppl.findIndex(v=>v>0);return j>=0?K.dates[j]:null;}
function pourLine(z,d){const pd=poured(z),n=diff(d,z.pour);
  if(pd){const g=diff(z.pour,pd);return`<b style="color:${COL.ok}">✔ Đã đổ BT ngày ${dm(pd)}</b> (KH ${dm(z.pour)}${g<0?' · sớm '+(-g)+' ngày':g>0?' · trễ '+g+' ngày':' · đúng KH'})`;}
  if(n>0)return`Đổ BT theo KH: <b>${dm(z.pour)}</b> · còn ${n} ngày · chưa đổ`;
  if(n===0)return`Đổ BT theo KH: <b>hôm nay ${dm(z.pour)}</b> · chưa có báo cáo đã đổ`;
  return`<b style="color:${COL.bd}">Quá hạn đổ BT ${-n} ngày (KH ${dm(z.pour)}) · chưa có báo cáo đã đổ</b>`;}
function zcard(z,d,full){
  const zi=zInfo(z,d),m=K.kl[z.k]||{},pd=poured(z),xs=z.items.map(it=>({it,x:info(it,d)})),late=xs.filter(o=>o.x.late),tv=thepVe(z);
  let h=`<div class="tdcard${late.length?' lt':''}" style="border-left-color:${COL[zi.st]}"><div class="tdh"><b><span class="tdfb" style="background:${FC[z.floor]}">${z.floor}</span> ${esc(z.zone)} · ${esc(z.ntp)}</b>${chip(zi.st)}</div>`;
  h+=`<div class="tdm">${pourLine(z,d)}</div>`;
  if(late.length)h+=`<div class="tdalert">⚠ CHẬM – quân kế hoạch còn lại không đủ để kịp ngày đổ, cần tăng quân</div>`;
  h+=`<div class="tdw"><table class="tdtb"><tr><th>Hạng mục</th><th>Tổng</th><th class="t">Đã làm</th><th>Còn lại</th><th class="k">Quân KH</th><th class="t">Quân cần</th></tr>`;
  xs.forEach(({it,x})=>{const dd=KD(it);h+=`<tr class="${x.late?'lrow':''}"><td><b>${KS(it)}</b><br><small>${it.unit}</small></td><td>${f1(it.total,dd)}</td><td class="t">${f1(it.total*x.act/100,dd)}<br><small>${f1(x.act,0)}%</small></td><td>${f1(x.rem,dd)}</td><td class="k">${x.done?'—':f1(x.pplPlan,0)}</td><td class="t ${x.late?'late':''}">${x.done?'xong':f1(x.pplNeed,0)}</td></tr>`;});
  if(m.bt)h+=`<tr><td><b>Bê tông</b><br><small>m³</small></td><td>${f1(m.bt,0)}</td><td class="t">${pd?f1(m.bt,0):0}<br><small>${pd?'100':'0'}%</small></td><td>${pd?0:f1(m.bt,0)}</td><td colspan="2" class="tds" style="text-align:center">${pd?'đã đổ':'đổ '+dm(z.pour)}</td></tr>`;
  h+='</table></div><div class="tds">Quân KH / Quân cần = người mỗi ngày, trung bình từ hôm nay đến ngày đổ BT.</div>';
  late.forEach(({it,x})=>{h+=`<div class="tdm late">⚠ ${KN(it,z)}: còn ${f1(x.rem,KD(it))} ${it.unit} ${x.dl>0?'trong '+x.dl+' ngày':'– đã quá ngày đổ'} → cần <b>${f1(x.pplNeed,0)}</b> người/ngày, KH chỉ bố trí ${f1(x.pplPlan,0)} → <b>thiếu ${f1(Math.max(0,x.pplNeed-x.pplPlan),0)} người/ngày</b>.${x.avg3!=null?' 3 ngày qua thực tế TB '+f1(x.avg3,0)+' người/ngày'+(x.eta?' – giữ mức đó cần thêm '+x.eta+' ngày':''):''}</div>`;});
  if(!late.length&&xs.some(o=>!o.x.done))h+=`<div class="tdm" style="color:${COL.ok}">✔ Kịp ngày đổ nếu giữ quân theo kế hoạch.</div>`;
  const cg=xs.reduce((a,o)=>a+o.x.cong,0),pa=xs.reduce((a,o)=>a+o.x.pa,0),pk=xs.reduce((a,o)=>a+o.x.pk,0);
  if(cg>0)h+=`<div class="tds">Công còn lại theo định mức: <b>${f1(cg,0)} công</b> (≈ ${f1(cg/HE,0)} người làm 1 ngày 11h)${pk>0?' · đã dùng từ '+dm(K.dates[0])+' đến hôm qua: '+f1(pa,0)+' người-ngày (KH '+f1(pk,0)+')':''}</div>`;
  if(tv)h+=`<div class="tds">Thép về công trường theo KH: <b>${dm(tv)}</b> (theo dõi thép về thực tế ở app QR thép)${m.area?' · sàn '+f1(m.area,0)+' m²':''}</div>`;
  if(full)xs.forEach(({it})=>{if(it.plan_ppl.some(v=>v>0))h+=`<details class="tdmd" data-k="dg-${esc(it.id)}"${OPEN.has('dg-'+it.id)?' open':''}><summary>Từng ngày: ${KN(it,z)}</summary>${dayGrid(it,d)}</details>`;});
  return h+'</div>';}
function zsum(z,d,extra){const zi=zInfo(z,d),n=diff(d,z.pour);
  return`<summary style="border-left:6px solid ${COL[zi.st]}"><div class="tdh"><b><span class="tdfb" style="background:${FC[z.floor]}">${z.floor}</span> ${esc(z.zone)} · ${esc(z.ntp)}</b>${chip(zi.st)}</div><div class="tds">KH đổ ${dm(z.pour)} · ${pourBadge(z)}${n>0&&!poured(z)?' (còn '+n+' ngày)':''}${extra?' · '+extra:''}</div>${bar(zi.pp,zi.has?zi.cur:null,COL[zi.st],zi.hd)}</summary>`;}
function zdet(z,d,key,body,extra){const ok=OPEN.has(key)||zsel===z.k;return`<details class="tdzd" data-k="${esc(key)}"${ok?' open':''}>${zsum(z,d,extra)}<div class="tdzb">${body}</div></details>`;}
function vZone(){
  const d=todayS(),Z=zonesF();if(zsel&&!Z.find(z=>z.k===zsel))zsel=null;
  let h=head()+mapBox(zsel,'f',true)+zoneChips();
  const list=(zsel?Z.filter(z=>z.k===zsel):Z).slice().sort((a,b)=>(poured(a)?1:0)-(poured(b)?1:0)||a.pour.localeCompare(b.pour));
  h+='<div class="tdn">Mỗi thẻ là một zone: ngày đổ BT, khối lượng tổng / đã làm / còn lại, quân KH và quân cần để kịp. Bấm "Từng ngày" để xem quân KH, thực tế và quân cần theo từng ngày.</div>';
  h+=fgroup(list,l=>l.map(z=>zcard(z,d,true)).join(''));
  return h+`<div class="tdn">Năng suất lấy theo kế hoạch của từng tổ (khoảng ${f1(PER.cf,1)} m² cốp pha và ${f1(PER.th,2)} tấn thép mỗi người mỗi ngày 11h theo định mức Excel).</div>`;
}
function vMan(){
  const d=todayS(),i=clampI(d),Z=zonesF();if(zsel&&!Z.find(z=>z.k===zsel))zsel=null;
  const its=itemsF().filter(it=>!zsel||(it.floor+' '+it.zone)===zsel);
  let h=head()+mapBox(zsel,'f',true)+zoneChips()+'<h3>Quân theo ngày: kế hoạch và thực tế</h3>'+chart(its,fl==='all'&&!zsel);
  h+='<h3>Tổ đội: cần bao nhiêu quân để kịp tiến độ</h3>';
  const CM={VGC:'VGC cộng',GDcons:'GDcons – ban ngày','Trọng':'Tổ Trọng'};
  const tbl=(fi)=>{const l0=its.filter(it=>!fi||it.floor===fi);let t='<div class="tdw"><table class="tdtb"><tr><th rowspan=2>Tổ</th><th rowspan=2>Cam kết</th><th class="k">Kế hoạch</th><th class="t">Thực tế</th><th rowspan=2>Cần</th></tr><tr><th class="k">hôm nay</th><th class="t">hôm nay</th></tr>';
    NTPS.forEach(n=>{let pl=0,tt=0,th=false,nd=0;l0.filter(it=>it.ntp===n&&it.pour>=d).forEach(it=>{const x=info(it,d);if(x.done)return;if((it.plan_ppl[i]||0)>0||(x.pp>0&&x.cur<x.pp)){pl+=it.plan_ppl[i]||0;nd+=x.pplNeed;}});
      l0.filter(it=>it.ntp===n).forEach(it=>{const v=apl(it,i);if(v!=null){tt+=v;th=true;}});const cm=K.commit[CM[n]][i];
      t+=`<tr><td><b>${n}</b></td><td>${fi?'—':cm}</td><td class="k">${pl}</td><td class="t">${th?tt:'—'}</td><td class="${!fi&&nd>cm+0.5?'late':''}">${f1(nd,0)}</td></tr>`;});return t+'</table></div>';};
  h+=fl==='all'?['B1','T1'].map(f=>`<div class="tdfh" style="background:${FC[f]}">${FLN[f]}</div>`+tbl(f)).join(''):tbl(fl);
  h+='<div class="tds">Cam kết là số người tổ cam kết cho cả hai tầng (chỉ hiện ở bảng một tầng khi chọn tầng cụ thể là "—").</div>';
  h+='<h3>Theo zone: quân kế hoạch và thực tế từng ngày</h3>'+fgroup(Z.filter(z=>!zsel||z.k===zsel),l=>l.map(z=>zdet(z,d,'mn-'+z.k,z.items.map(it=>`<div class="tdcard" style="border-left-color:${COL[info(it,d).st]}"><b>${esc(it.task)}</b> <span class="tds">· ${esc(z.ntp)}</span>${dayGrid(it,d)}</div>`).join(''))).join(''));
  return h+'<div class="tds">Ô "·" = chưa có số. Thực tế ghi tay trong bảng giấy chỉ có từ 19/11.</div>';
}
function vPrep(){
  const d=todayS(),M=ld(MK,{}),Z=zonesF();if(zsel&&!Z.find(z=>z.k===zsel))zsel=null;
  let h=head()+mapBox(zsel,'f',true)+zoneChips()+`<div class="tdn">Danh mục sơ bộ theo khối lượng kế hoạch (chưa rà biện pháp thi công). Cột Kế hoạch: số lượng và ngày cần. Cột Thực tế: cập nhật trạng thái và ngày đã đặt/về. Dòng sắp đến hạn hoặc quá hạn mà chưa về hiện màu đỏ. Bấm zone để mở.</div>`;
  const live=Z.filter(z=>z.pour>=d&&!poured(z)&&(!zsel||z.k===zsel));
  h+=fgroup(live,l=>l.map(z=>{const m=K.kl[z.k],cf=z.items.find(i=>i.kind==='cf'),th=z.items.find(i=>i.kind==='th'),rows=[];
    const fd=it=>{const j=it.plan_ppl.findIndex(v=>v>0);return j>=0?K.dates[j]:null};
    if(th)rows.push({id:z.k+'|th',n:'Thép gia công về công trường (Povina)',q:f1(th.total,1)+' tấn',need:z.floor==='T1'?(K.thep_ve[z.k]||fd(th)):fd(th)});
    if(cf&&z.floor==='T1')rows.push({id:z.k+'|cf',n:'Ván khuôn, giàn chống sàn',q:f1(cf.total,0)+' m²',need:fd(cf)});
    rows.push({id:z.k+'|bt',n:'Bê tông + bơm + đội đổ (7 người)',q:f1(m.bt,0)+' m³',need:z.pour});
    const R=rows.filter(r=>r.need).sort((a,b)=>a.need.localeCompare(b.need));
    let late=0;R.filter(r=>!r.id.endsWith('|th')).forEach(r=>{const mm=M[r.id]||{};if(diff(d,r.need)<=3&&(mm.s||'Chưa đặt')!=='Đã về')late++;});
    let t=`<div class="tdw"><table class="tdtb"><tr><th rowspan=2>Hạng mục</th><th colspan=2>Kế hoạch</th><th colspan=2>Thực tế</th></tr><tr><th class="k">SL</th><th class="k">Cần</th><th class="t">Trạng thái</th><th class="t">Ngày</th></tr>`;
    R.forEach(r=>{const mm=M[r.id]||{},s=mm.s||'Chưa đặt',n=diff(d,r.need),lt=n<=3&&s!=='Đã về';
      if(r.id.endsWith('|th')){t+=`<tr><td>${r.n}</td><td class="k">${r.q}</td><td class="k"><b>${dm(r.need)}</b><br><small>${n>0?'còn '+n+' ngày':n===0?'hôm nay':'quá '+(-n)+' ngày'}</small></td><td class="t" colspan="2" style="text-align:center;white-space:normal"><small>Thép về thực tế: lấy từ app QR thép khi tải tem lên</small></td></tr>`;return;}
      t+=`<tr><td>${r.n}</td><td class="k">${r.q}</td><td class="k ${lt?'late':''}">${dm(r.need)}<br><small>${n>0?'còn '+n+' ngày':n===0?'hôm nay':'quá '+(-n)+' ngày'}</small></td><td class="t"><select data-m="${esc(r.id)}" style="width:92px;padding:5px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)">${ST.map(o=>`<option${o===s?' selected':''}>${o}</option>`).join('')}</select></td><td class="t"><input type="date" data-md="${esc(r.id)}" value="${mm.d||''}" style="width:118px;padding:4px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)"></td></tr>`;});
    return zdet(z,d,'pr-'+z.k,t+'</table></div>',late?`<b class="late">${late} mục cần chú ý</b>`:'');}).join(''));
  if(!live.length)h+='<div class="tdn">Không có hạng mục cần chuẩn bị cho lựa chọn này (zone đã đổ).</div>';
  return h;
}
/* ---- báo cáo ---- */
const hhmm=ts=>{const x=new Date(ts);return String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0')};
/* ---- sản lượng theo BPTC hầm tổng thể ---- */
const LVS=[['B1','Hầm B1'],['T1','Tầng 1'],['B2','Hầm B2'],['B3','Hầm B3'],['B4','Hầm B4 (móng, sàn)'],['S','Tiến trình chung (đào đất, shoring…)']];
const LVN=Object.fromEntries(LVS);
const STEPS=[
 [1,'Thi công tường vây, kingpost, dầm capping beam','m'],
 [2,'Đào đất đến đáy sàn B1, đào cục bộ đến đáy dầm','m'],
 [3,'Cốp pha đất, cốt thép, đổ bê tông sàn vành khăn B1','L','B1'],
 [4,'Giáo chống, cốp pha, cốt thép, đổ bê tông sàn vành khăn T1','L','T1'],
 [5,'Sàn T1 đạt 100% cường độ, đào đất đến cao độ -12.250','m'],
 [6,'Cốp pha chống, cốt thép, đổ bê tông sàn vành khăn B2','L','B2'],
 [7,'Sàn B2 đạt 70% cường độ, đào đất đến cao độ -15.750','m'],
 [8,'Cốp pha chống, cốt thép, đổ bê tông sàn vành khăn B3','L','B3'],
 [9,'Thi công hệ shoring lớp 3','m'],
 [10,'Sàn B3 đạt 100%, đào đến đáy sàn B4 (-18.35), móng bè (-20.35), móng pít (-22.35)','m'],
 [11,'Đổ bê tông móng và sàn hầm B4','L','B4'],
 [12,'Fill lỗ mở biện pháp, đổ sàn lỗ mở B3','F','B3'],
 [13,'Fill lỗ mở biện pháp, đổ sàn lỗ mở B2','F','B2'],
 [14,'Fill lỗ mở biện pháp, đổ sàn lỗ mở B1','F','B1'],
 [15,'Fill lỗ mở biện pháp, đổ sàn lỗ mở T1','F','T1']];
const WP={cf:.3,th:.3,bt:.4},WL={cf:'Cốp pha',th:'Cốt thép',bt:'Bê tông'};
const lvZones=lv=>{const p=K.maps&&K.maps[lv]&&K.maps[lv].pins;return p&&(lv==='B1'||lv==='T1')?Object.keys(p).sort():[];};
// danh mục hạng mục: [mã, tên, nhãn cốp pha]
function cat(lv,zn){
  const cfn=lv==='B1'?'Cốp pha đất':'Cốp pha';
  if(lv==='S')return STEPS.filter(s=>s[2]==='m').map(s=>['S'+s[0],'Bước '+s[0]+': '+s[1],null]);
  const zs=lvZones(lv).length>0;
  if(zs&&zn!=='ALL')return [['ds','Dầm – sàn (+ mũ cột)',cfn],['cot','Cột','Cốp pha'],['vach','Vách','Cốp pha']];
  if(lv==='B1')return [['bn1','Bể nước PCCC B1 – đợt 1: chân vách (BPTC 030)','Cốp pha'],['bn2','Bể nước PCCC B1 – đợt 2: vách (BPTC 032)','Cốp pha'],['lomo','Fill lỗ mở biện pháp, sàn lỗ mở','Cốp pha']];
  if(lv==='T1')return [['lomo','Fill lỗ mở biện pháp, sàn lỗ mở','Cốp pha']];
  if(lv==='B4')return [['mong','Móng bè, sàn hầm B4, móng pít','Cốp pha'],['cot','Cột','Cốp pha'],['vach','Vách','Cốp pha']];
  return [['ds','Dầm – sàn (+ mũ cột) vành khăn','Cốp pha'],['cot','Cột','Cốp pha'],['vach','Vách','Cốp pha'],['lomo','Fill lỗ mở biện pháp, sàn lỗ mở','Cốp pha']];
}
const sid=(lv,zn,code,w)=>w?`${lv}|${zn}|${code}|${w}`:`${lv}|${zn}|${code}`;
function lastId(id,d){const r=reps();for(let i=r.length-1;i>=0;i--){const p=r[i].pct;if(p&&p[id]!=null&&p[id]!==''&&(!d||r[i].date<=d))return{v:+p[id],date:r[i].date,who:r[i].who,ts:r[i].ts};}return null;}
const slId=it=>`${it.floor}|${it.zone}|ds|${it.kind}`;
function elPct(lv,zn,code){ // % hạng mục + từng đầu việc
  const v={};['cf','th','bt'].forEach(w=>{const a=lastId(sid(lv,zn,code,w));v[w]=a?a.v:null;});
  const any=['cf','th','bt'].some(w=>v[w]!=null&&v[w]>0);
  const p=v.bt!=null&&v.bt>=99.5?100:['cf','th','bt'].reduce((s,w)=>s+(v[w]||0)*WP[w],0);
  const st=p>=99.5?'ok':any?'wn':'na';
  return{v,p,st,any};
}
function manPct(n){const a=lastId('S|'+n);return a?a.v:null;}
function pouredDate(lv,zn,code){ // ngày bê tông đạt 100% lần đầu
  const id=sid(lv,zn,code||'ds','bt');let d=null;reps().forEach(r=>{if(d)return;if(r.pct&&r.pct[id]!=null&&+r.pct[id]>=99.5)d=r.date;});return d;}
const poured=z=>pouredDate(z.floor,z.zone);
function stepInfo(s){
  const t=s[2];let p=null;
  if(t==='m'){p=manPct(s[0]);}
  else{const lv=s[3];const zs=lvZones(lv);
    const code=t==='F'?'lomo':lv==='B4'?'mong':'ds';
    const list=(t==='L'&&zs.length)?zs.map(z=>elPct(lv,z,'ds')):[elPct(lv,'ALL',code)];
    p=list.some(x=>x.any)?list.reduce((a,x)=>a+x.p,0)/list.length:null;
    s=Object.assign([],s,{pours:t==='L'&&zs.length?zs.filter(z=>pouredDate(lv,z)).length:null,nz:zs.length});}
  const st=p==null?'na':p>=99.5?'ok':'wn';
  return{p,st,pours:s.pours,nz:s.nz};
}
const SLB={ok:'Hoàn thành',wn:'Đang thi công',na:'Chưa thi công'};
const schip=(st,p)=>`<span class="tdc" style="background:${COL[st]}">${SLB[st]}${st==='wn'&&p!=null?' '+f1(p,0)+'%':''}</span>`;
const pbar=(p,st)=>`<div class="tdb" style="background:${COL[st]}33"><i style="width:${Math.min(100,p||0)}%;background:${COL[st]}"></i><span class="tdbt">${p==null?'chưa có số liệu':f1(p,0)+'%'}</span></div>`;
function stepsHtml(open){
  const I=STEPS.map(s=>({s,i:stepInfo(s)}));const cur=I.find(x=>x.i.st!=='ok');
  let h=`<details class="tdmd" data-k="steps"${open?' open':''}><summary>Tiến trình hầm theo BPTC tổng thể · ${cur?'đang ở bước '+cur.s[0]:'hoàn thành'}</summary>`;
  I.forEach(({s,i})=>{h+=`<div class="tdcard" style="border-left-color:${COL[i.st]}"><div class="tdh"><b>Bước ${s[0]}</b>${schip(i.st,i.p)}</div><div class="tds">${esc(s[1])}${i.pours!=null?' · đã đổ BT '+i.pours+'/'+i.nz+' zone':''}</div>${pbar(i.p,i.st)}</div>`;});
  return h+'<div class="tds">Nguồn: BPTC hầm tổng thể MOS.010 (15 bước). Bước đào đất, shoring do GS BCH nhập % ở mục "Tiến trình chung". Các bước còn lại tính tự động từ sản lượng từng zone (cốp pha 30%, cốt thép 30%, bê tông 40%; bê tông đổ xong tính 100%).</div></details>';
}
function pourBadge(z){const d=poured(z),t=todayS();
  if(d)return`<b style="color:${COL.ok}">✔ đã đổ BT ${dm(d)}</b>`;
  return z.pour<t?`<b style="color:${COL.bd}">chưa báo cáo đã đổ (KH ${dm(z.pour)})</b>`:'chưa đổ BT';}
function slLevels(){ // bảng tổng hợp từng tầng, từng zone
  let h='';
  ['B1','T1','B2','B3','B4'].forEach(lv=>{
    const zs=lvZones(lv),unit=zs.length?zs:['ALL'];
    let tot=0,n=0;const rows=unit.map(zn=>{
      const cs=cat(lv,zn),ds=zs.length?elPct(lv,zn,'ds'):null;
      const body=cs.map(c=>{const e=elPct(lv,zn,c[0]);
        return`<tr><td>${esc(c[1])}</td>${['cf','th','bt'].map(w=>`<td class="t">${e.v[w]==null?'·':f1(e.v[w],0)+'%'}</td>`).join('')}<td>${schip(e.st,e.p)}</td></tr>`;}).join('');
      const m=cs.map(c=>elPct(lv,zn,c[0]));const zp=m.length?m.reduce((a,x)=>a+x.p,0)/m.length:0;tot+=zp;n++;
      const zst=m.every(x=>x.st==='ok')?'ok':m.some(x=>x.any)?'wn':'na';
      const key='sl-'+lv+'-'+zn;
      const pz=zs.length?pouredDate(lv,zn):null,kz=zs.length?K.items.find(i=>i.floor===lv&&i.zone===zn):null;
      const sub=zs.length?(pz?`<b style="color:${COL.ok}">✔ đã đổ BT dầm sàn ${dm(pz)}</b>`:kz&&kz.pour<todayS()?`<b style="color:${COL.bd}">chưa báo cáo đã đổ (KH ${dm(kz.pour)})</b>`:kz?'chưa đổ BT · KH '+dm(kz.pour):'chưa đổ BT · không có trong kế hoạch REV49'):'';
      return`<details class="tdzd" data-k="${esc(key)}"${OPEN.has(key)?' open':''}><summary style="border-left:6px solid ${COL[zst]}"><div class="tdh"><b>${zn==='ALL'?'Toàn tầng':'Zone '+esc(zn.slice(1))}</b>${schip(zst,zp)}</div>${sub?`<div class="tds">${sub}</div>`:''}${pbar(m.length?zp:null,zst)}</summary><div class="tdzb"><div class="tdw"><table class="tdtb"><tr><th>Hạng mục</th><th>Cốp pha</th><th>Cốt thép</th><th>Bê tông</th><th>Trạng thái</th></tr>${body}</table></div></div></details>`;}).join('');
    h+=`<div class="tdfh" style="background:${FC[lv]||'#3d4a50'}">${LVN[lv]} · tiến độ chung ${f1(tot/n,0)}%</div>`+rows;
  });
  return h;
}

let MODE='plan';
const QF={fl:'B1',z:'',who:'',d:null,s:null};
const WHK={qn:'td_who',sl:'td_who_sl'};
const PPL={qn:[['Phan Tiến Đạt','GSHT'],['Phạm Tiến Sỹ','GSHT'],['Nguyễn Anh Tân','GSHT'],['Huỳnh Viết Minh Quân','GSTB'],['Nguyễn Minh Long','GSHT'],['Lê Đình Tú','GSHT'],['Nguyễn Thanh Trực','MEP'],['Đỗ Trường Hải','Giám sát chính']],
 sl:[['Nguyễn Khắc Vũ','QAQC'],['Lê Tuấn Anh','QAQC'],['Phạm Viết Vũ','SHOP/BPTC'],['Huỳnh Tấn Phát','SHOP/BPTC']]};
function whoField(kind,label){const L=PPL[kind],inL=L.some(x=>x[0]===QF.who),oth=QF.who&&!inL;
  return`<label>${label}</label><select id="rwho"><option value="">— Chọn tên —</option>${L.map(x=>`<option value="${esc(x[0])}"${QF.who===x[0]?' selected':''}>${esc(x[0])}</option>`).join('')}<option value="__o"${oth?' selected':''}>Khác (nhập tên)</option></select>${oth?`<input id="rwo" placeholder="Họ và tên" value="${esc(QF.who)}" autocomplete="off">`:''}`;}
const isK=(r,k)=>k==='qn'?(r.k?r.k==='qn':!!r.ppl&&Object.keys(r.ppl).length>0):(r.k?r.k==='sl':!!r.pct&&Object.keys(r.pct).length>0);
const itName=id=>{const it=K.items.find(x=>x.id===id);return it?it.task:id;};
function board(kind){
  if(kind==='sl')return boardSl();
  const d=bdate||todayS(),R=reps().filter(r=>r.date===d&&isK(r,kind)).sort((a,b)=>a.ts-b.ts);
  const T=kind==='qn'?'Bảng theo dõi báo cáo quân số':'Bảng theo dõi sản lượng đã nhập';
  let h=`<div class="tdh"><b>${T}</b><span class="tds">${SYN.err?'<span class="late">chưa kết nối được</span>':SYN.t?'cập nhật '+hhmm(SYN.t):'đang tải…'}</span></div><div class="tdbd"><button class="tdbtn s" data-bd="-1">‹</button><b>${dow(d)} ${dm(d)}${d===todayS()?' (hôm nay)':''}</b><button class="tdbtn s" data-bd="1">›</button><button class="tdbtn s" data-bd="r">Làm mới</button></div>`;
  const unsent=reps().filter(r=>!r.sy).length;if(unsent)h+=`<div class="tdn late">Có ${unsent} báo cáo chưa gửi được lên hệ thống. App sẽ tự gửi lại khi có mạng.</div>`;
  if(!R.length)return h+'<div class="tdn">Chưa có báo cáo nào trong ngày này.</div>';
  const zname=r=>r.zone||'—';
  h+=`<div class="tdw"><table class="tdtb"><tr><th>Giám sát</th><th>Tầng</th><th>Zone</th><th>${kind==='qn'?'Công nhân':'Sản lượng (% tích lũy)'}</th><th>Giờ</th></tr>`;
  R.forEach(r=>{const own=r.dev===DEV;let v;
    if(kind==='qn'){v=Object.values(r.ppl||{}).reduce((a,b)=>a+(+b||0),0)+' người<br><small class="tds">'+(r.ses==='am'?'đầu ngày':'cuối ngày')+'</small>';}
    else v=Object.keys(r.pct||{}).map(k=>esc(itName(k))+' '+f1(r.pct[k],0)+'%').join('<br>');
    h+=`<tr><td><b>${esc(r.who||'—')}</b></td><td>${esc(r.fl||'')}</td><td>${esc(zname(r))}</td><td>${v}</td><td>${hhmm(r.ts)}${own?` <button class="tdbtn s" data-rd="${esc(r.id)}" title="Xóa báo cáo này">✕</button>`:''}</td></tr>`;});
  return h+'</table></div><div class="tds">Báo cáo của mọi người trên các máy đều hiện ở đây. Chỉ người gửi mới xóa được báo cáo của mình.</div>';
}
function formHead(kind){
  const d=todayS(),Z=zones().filter(z=>z.floor===QF.fl).sort((a,b)=>(b.pour>=d)-(a.pour>=d)||a.pour.localeCompare(b.pour));
  if(!QF.z||!Z.find(z=>z.k===QF.z))QF.z=Z.length?Z[0].k:'';
  const whos=[...new Set(reps().map(r=>r.who).filter(Boolean))];
  const hr=new Date().getHours();
  if(QF.who==='')QF.who=ld(WHK[kind],'')||'';
  if(!QF.d)QF.d=d;if(!QF.s)QF.s=hr>=15?'pm':'am';
  return whoField(kind,'1. Giám sát phụ trách'+(kind==='sl'?' (người nhập)':'')+' (bắt buộc)')+`
  <label>2. Tầng</label><select id="qfl"><option value="B1"${QF.fl==='B1'?' selected':''}>Hầm B1</option><option value="T1"${QF.fl==='T1'?' selected':''}>Tầng 1</option></select>
  <label>3. Zone</label><select id="qz">${Z.map(z=>`<option value="${esc(z.k)}"${z.k===QF.z?' selected':''}>${esc(z.zone)} · ${esc(z.ntp)}${z.pour<d?' (đã đổ)':' · đổ '+dm(z.pour)}</option>`).join('')}</select>
  <label>Ngày báo cáo</label><input type="date" id="rd" value="${QF.d}">`+(kind==='qn'?`<label>Phiên báo cáo</label><select id="rs"><option value="am"${QF.s==='am'?' selected':''}>Đầu ngày (7h–8h)</option><option value="pm"${QF.s==='pm'?' selected':''}>Cuối ngày (17h30–19h)</option></select>`:'');
}
function vQn(){
  const d=todayS(),i=clampI(d),z=zones().find(x=>x.k===QF.z);
  let h=head()+`<div class="tdcard" id="tdboard" style="border-left-color:var(--acc2)">${board('qn')}</div><h3>Gửi báo cáo quân số</h3><div class="tdf">`+formHead('qn');
  const zz=zones().find(x=>x.k===QF.z);
  h+=`<label>4. Số công nhân từng đầu việc${zz?' · '+esc(zz.k)+' ('+esc(zz.ntp)+')':''}</label>`;
  if(zz){h+='<div class="tdrow h"><span>Đầu việc</span><span>Công nhân</span></div>';
    zz.items.forEach(it=>{const cur=apl(it,i);h+=`<div class="tdrow" style="grid-template-columns:1fr 96px"><span>${esc(it.task)}<br><small class="tds">KH hôm nay: ${it.plan_ppl[i]||0} người</small></span><input type="number" inputmode="numeric" min="0" data-p="${esc(it.id)}" placeholder="${it.plan_ppl[i]||0}" value="${cur==null?'':cur}"></div>`;});}
  h+=`<label>Quân tăng ca sau 17h30 (tổng)</label><input type="number" inputmode="numeric" min="0" id="rot" value="0"><label>Ghi chú (vật tư, vướng mắc, thiếu quân…)</label><textarea id="rn" rows="3"></textarea><button class="tdbtn" id="rsv">Gửi báo cáo</button></div>`;
  return h;
}
function slContent(r){
  const g={};
  Object.keys(r.pct||{}).forEach(id=>{const q=id.split('|');
    if(q[0]==='S'){g['S'+q[1]]={n:'Bước '+q[1],x:[f1(r.pct[id],0)+'%']};return;}
    const lv=q[0],zn=q[1],code=q[2],w=q[3];const c=cat(lv,zn).find(x=>x[0]===code);const k=zn+'|'+code;
    (g[k]=g[k]||{n:c?c[1]:code,x:[],o:{}}).o[w]=r.pct[id];});
  return Object.values(g).map(e=>e.o?esc(e.n)+': '+['cf','th','bt'].filter(w=>e.o[w]!=null).map(w=>WL[w]+' '+f1(e.o[w],0)+'%').join(' · '):esc(e.n)+': '+e.x.join('')).join('<br>');
}
function boardSl(){
  const d=bdate||todayS(),R=reps().filter(r=>r.date===d&&isK(r,'sl')).sort((a,b)=>b.ts-a.ts);
  let h=`<div class="tdh"><b>Nhật ký báo cáo sản lượng của GS BCH</b><span class="tds">${SYN.err?'<span class="late">chưa kết nối được</span>':SYN.t?'cập nhật '+hhmm(SYN.t):'đang tải…'}</span></div><div class="tdbd"><button class="tdbtn s" data-bd="-1">‹</button><b>${dow(d)} ${dm(d)}${d===todayS()?' (hôm nay)':''}</b><button class="tdbtn s" data-bd="1">›</button><button class="tdbtn s" data-bd="r">Làm mới</button></div>`;
  const unsent=reps().filter(r=>!r.sy).length;if(unsent)h+=`<div class="tdn late">Có ${unsent} báo cáo chưa gửi được lên hệ thống. App sẽ tự gửi lại khi có mạng.</div>`;
  if(!R.length)return h+'<div class="tdn">Chưa có báo cáo sản lượng trong ngày này.</div>';
  h+='<div class="tdw"><table class="tdtb"><tr><th>GS BCH báo cáo</th><th>Ngày · giờ</th><th>Tầng · Zone</th><th>Nội dung</th></tr>';
  R.forEach(r=>{const own=r.dev===DEV;h+=`<tr><td><b>${esc(r.who||'—')}</b></td><td>${dm(r.date)}<br><small class="tds">${hhmm(r.ts)}</small></td><td>${esc(r.fl==='S'?'Chung':r.fl)}<br><small class="tds">${esc(r.zone||'')}</small></td><td>${slContent(r)}${own?` <button class="tdbtn s" data-rd="${esc(r.id)}" title="Xóa báo cáo này">✕</button>`:''}</td></tr>`;});
  return h+'</table></div><div class="tds">Mỗi báo cáo lưu tên GS BCH, ngày và giờ gửi. Chỉ người gửi mới xóa được báo cáo của mình.</div>';
}
function formSl(){
  const d=todayS(),zs=lvZones(QF.fl);
  if(!QF.d)QF.d=d;if(QF.who==='')QF.who=ld(WHK.sl,'')||'';
  if(zs.length){if(QF.z!=='ALL'&&!zs.includes(QF.z))QF.z=zs[0];}else QF.z='ALL';
  const whos=[...new Set(reps().map(r=>r.who).filter(Boolean))];
  let h=whoField('sl','1. Tên người báo cáo – nhân sự QA/QC (bắt buộc)')+`
  <label>2. Tầng</label><select id="qfl">${LVS.map(l=>`<option value="${l[0]}"${QF.fl===l[0]?' selected':''}>${l[1]}</option>`).join('')}</select>`;
  if(zs.length)h+=`<label>3. Zone (mẻ đổ)</label><select id="qz">${zs.map(z=>`<option value="${z}"${QF.z===z?' selected':''}>Zone ${esc(z.slice(1))}</option>`).join('')}<option value="ALL"${QF.z==='ALL'?' selected':''}>Hạng mục chung của tầng (bể nước, lỗ mở…)</option></select>`;
  h+=`<label>Ngày báo cáo</label><input type="date" id="rd" value="${QF.d}">
  <label>${zs.length?'4':'3'}. % hoàn thành tích lũy từng hạng mục (để trống = không đổi)</label>`;
  cat(QF.fl,QF.z).forEach(c=>{
    if(QF.fl==='S'){const a=lastId('S|'+c[0].slice(1));h+=`<div class="tdcard"><b>${esc(c[1])}</b><div class="tds">${a?'gần nhất '+f1(a.v,0)+'% ('+dm(a.date)+')':'chưa có số liệu'}</div><input type="number" inputmode="decimal" min="0" max="100" data-i="S|${c[0].slice(1)}" data-o="${a?a.v:''}" placeholder="%" value="${a?a.v:''}"></div>`;return;}
    const e=elPct(QF.fl,QF.z,c[0]);
    h+=`<div class="tdcard" style="border-left-color:${COL[e.st]}"><div class="tdh"><b>${esc(c[1])}</b>${schip(e.st,e.p)}</div><div class="tdsl">`+['cf','th','bt'].map(w=>{const v=e.v[w];const lab=w==='cf'?c[2]:WL[w];return`<label>${lab}<input type="number" inputmode="decimal" min="0" max="100" data-i="${sid(QF.fl,QF.z,c[0],w)}" data-o="${v==null?'':v}" placeholder="%" value="${v==null?'':v}"></label>`;}).join('')+`</div></div>`;});
  return h;
}
let slTab='map',slF='B1',slZ=null;
function elTable(lv,zn){const body=cat(lv,zn).map(c=>{const e=elPct(lv,zn,c[0]);return`<tr><td>${esc(c[1])}</td>${['cf','th','bt'].map(w=>`<td class="t">${e.v[w]==null?'·':f1(e.v[w],0)+'%'}</td>`).join('')}<td>${schip(e.st,e.p)}</td></tr>`;}).join('');
  return`<div class="tdw"><table class="tdtb"><tr><th>Hạng mục</th><th>Cốp pha</th><th>Cốt thép</th><th>Bê tông</th><th>Trạng thái</th></tr>${body}</table></div>`;}
function slMapView(){
  const f=slF,M=K.maps[f];
  let h=`<div class="tdfl"><label for="slf">Tầng</label><select id="slf" style="border-color:${FC[f]}"><option value="B1"${f==='B1'?' selected':''}>Hầm B1</option><option value="T1"${f==='T1'?' selected':''}>Tầng 1</option></select></div>`;
  let np=0,nw=0;const zs=lvZones(f);
  h+=`<div class="tdmap"><span class="tdmt" style="background:${FC[f]}">Mặt bằng sản lượng ${f==='B1'?'hầm B1':'tầng 1'}</span><img src="${M.img}" alt="">`;
  zs.forEach(zn=>{const p=M.pins[zn];if(!p)return;const e=elPct(f,zn,'ds'),pd=pouredDate(f,zn);if(pd)np++;else if(e.any)nw++;
    const col=pd?COL.ok:e.any?COL.wn:COL.na;
    h+=`<button class="tdpin${slZ===zn?' sel':''}" data-slpin="${zn}" style="left:${p[0]*100}%;top:${Math.max(p[1],0.08)*100}%;background:${col}">${zn}<small>${pd?'✔ đổ '+dm(pd):e.any?f1(e.p,0)+'%':'chưa thi công'}</small></button>`;});
  h+=`</div><div class="tdlg"><span><i style="background:${COL.ok}"></i>Đã đổ BT dầm sàn</span><span><i style="background:${COL.wn}"></i>Đang thi công</span><span><i style="background:${COL.na}"></i>Chưa thi công</span></div><div class="tds">${np}/${zs.length} zone đã đổ BT · ${nw} zone đang thi công · bấm vào zone để xem cốp pha, cốt thép, bê tông từng hạng mục.</div>`;
  if(slZ&&zs.includes(slZ)){const e=elPct(f,slZ,'ds'),pd=pouredDate(f,slZ),kz=K.items.find(i=>i.floor===f&&i.zone===slZ);
    const last=['cf','th','bt'].map(w=>lastId(sid(f,slZ,'ds',w))).filter(Boolean).sort((a,b)=>(b.date+b.ts).localeCompare(a.date+a.ts))[0];
    h+=`<div class="tdcard" style="border-left-color:${pd?COL.ok:e.any?COL.wn:COL.na}"><div class="tdh"><b><span class="tdfb" style="background:${FC[f]}">${f}</span> Zone ${esc(slZ.slice(1))}</b>${schip(pd?'ok':e.st,e.p)}</div><div class="tds">${pd?'<b style="color:'+COL.ok+'">✔ đã đổ BT dầm sàn '+dm(pd)+'</b>':kz&&kz.pour<todayS()?'<b style="color:'+COL.bd+'">chưa báo cáo đã đổ (KH '+dm(kz.pour)+')</b>':'chưa đổ BT'+(kz?' · KH '+dm(kz.pour):' · không có trong kế hoạch REV49')}${last?' · cập nhật '+dm(last.date)+' bởi '+esc(last.who||'—'):''}</div>${elTable(f,slZ)}<button class="tdbtn" data-slrep="1" style="margin-top:8px">Nhập báo cáo cho zone này</button></div>`;}
  const ca=cat(f,'ALL');
  h+=`<h3>Hạng mục chung của ${f==='B1'?'hầm B1':'tầng 1'}</h3><div class="tdcard">${elTable(f,'ALL')}<button class="tdbtn" data-slrep="ALL" style="margin-top:8px">Nhập báo cáo hạng mục chung</button></div>`;
  return h;
}
function vSl(){
  const T=[['map','Mặt bằng sản lượng'],['sum','Tổng hợp'],['rep','Báo cáo']];
  let h=`<div class="tdt">${T.map(t=>`<button data-st="${t[0]}" aria-pressed="${t[0]===slTab}">${t[1]}</button>`).join('')}</div>`;
  if(slTab==='map')return h+`<div class="tdn">Tracking sản lượng do GS BCH nhập theo mẻ đổ (zone). Màu zone cập nhật theo báo cáo mới nhất; số liệu cũng đưa vào Kế hoạch & Tiến độ.</div>`+slMapView();
  if(slTab==='sum')return h+'<h3>Tổng hợp theo BPTC hầm tổng thể</h3>'+stepsHtml(false)+'<h3>Chi tiết theo tầng và zone</h3>'+slLevels();
  return h+`<h3>Nhật ký báo cáo</h3><div class="tdcard" id="tdboard" style="border-left-color:var(--acc2)">${boardSl()}</div><h3>Nhập sản lượng</h3><div class="tdf">`+formSl()+`<label>Ghi chú</label><textarea id="rn" rows="3"></textarea><button class="tdbtn" id="rsv">Gửi báo cáo sản lượng</button></div>`;
}
function popup(t,m){let p=$('#tdpop');if(p)p.remove();p=document.createElement('div');p.id='tdpop';p.className='tdpop';p.innerHTML=`<div class="tdpb"><div class="tdok">✓</div><h3>${t}</h3><p>${m}</p><button class="tdbtn" id="tdpx">Đóng</button></div>`;document.body.appendChild(p);$('#tdpx').onclick=()=>p.remove();p.onclick=e=>{if(e.target===p)p.remove();};}
const V={ov:vOv,zn:vZone,mn:vMan,pr:vPrep};
const TB=[['ov','Tổng quan'],['zn','Zone'],['mn','Nhân lực'],['pr','Chuẩn bị']];
function bindBoard(r){
  r.querySelectorAll('[data-bd]').forEach(b=>b.onclick=async()=>{const v=b.dataset.bd;if(v==='r'){await sync();const e=$('#tdboard');if(e){e.innerHTML=board(MODE);bindBoard(e);}return;}const d=new Date((bdate||todayS())+'T00:00:00');d.setDate(d.getDate()+(+v));bdate=iso(d);const e=$('#tdboard');e.innerHTML=board(MODE);bindBoard(e);});
  r.querySelectorAll('[data-rd]').forEach(b=>b.onclick=async()=>{if(!confirm('Xóa báo cáo này khỏi hệ thống?'))return;const id=b.dataset.rd;try{await rpc('td_del',{p_id:id,p_dev:DEV});}catch(e){alert('Chưa xóa được, kiểm tra mạng');return;}setRC(RC.filter(x=>x.id!==id));draw();});
}
function draw(){
  const r=$('#tdr');if(!r)return;const y=window.scrollY;
  r.innerHTML=(MODE==='plan'?flbar()+`<div class="tdt">${TB.map(t=>`<button data-tb="${t[0]}" aria-pressed="${t[0]===tab}">${t[1]}</button>`).join('')}</div>`+V[tab]():MODE==='qn'?vQn():vSl());
  const fs=$('#flsel');if(fs)fs.onchange=()=>{fl=fs.value;try{localStorage.setItem('td_fl2',fl)}catch(e){}if(fl!=='all'&&zsel&&!zsel.startsWith(fl))zsel=null;draw();};
  r.querySelectorAll('[data-tb]').forEach(b=>b.onclick=()=>{tab=b.dataset.tb;draw();window.scrollTo(0,0);});
  r.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{zsel=b.dataset.z;tab='zn';draw();window.scrollTo(0,0);});
  r.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>{const k=b.dataset.pin;if(b.dataset.mode==='go'){zsel=k;tab='zn';draw();window.scrollTo(0,0);}else{zsel=zsel===k?null:k;draw();window.scrollTo(0,y);}});
  r.querySelectorAll('[data-zs]').forEach(b=>b.onclick=()=>{zsel=zsel===b.dataset.zs?null:b.dataset.zs;draw();window.scrollTo(0,y);});
  r.querySelectorAll('details[data-k]').forEach(e=>e.ontoggle=()=>{const k=e.dataset.k;if(e.open)OPEN.add(k);else OPEN.delete(k);});
  r.querySelectorAll('[data-m]').forEach(s=>s.onchange=()=>{const M=ld(MK,{});(M[s.dataset.m]=M[s.dataset.m]||{}).s=s.value;sv(MK,M);draw();window.scrollTo(0,y);});
  r.querySelectorAll('[data-md]').forEach(s=>s.onchange=()=>{const M=ld(MK,{});(M[s.dataset.md]=M[s.dataset.md]||{}).d=s.value;sv(MK,M);});
  bindBoard(r);
  r.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{slTab=b.dataset.st;draw();window.scrollTo(0,0);});
  const sf=$('#slf');if(sf)sf.onchange=()=>{slF=sf.value;slZ=null;draw();};
  r.querySelectorAll('[data-slpin]').forEach(b=>b.onclick=()=>{slZ=slZ===b.dataset.slpin?null:b.dataset.slpin;draw();window.scrollTo(0,y);});
  r.querySelectorAll('[data-slrep]').forEach(b=>b.onclick=()=>{QF.fl=slF;QF.z=b.dataset.slrep==='ALL'?'ALL':slZ;slTab='rep';draw();window.scrollTo(0,0);});
  const cap=()=>{const w=$('#rwho');if(w){QF.who=w.value==='__o'?(($('#rwo')&&$('#rwo').value)||'__o'):w.value;}const dd=$('#rd');if(dd)QF.d=dd.value;const ss=$('#rs');if(ss)QF.s=ss.value;};
  const rw=$('#rwho');if(rw)rw.onchange=()=>{const v=rw.value;cap();if(v==='__o')QF.who=QF.who&&QF.who!=='__o'?QF.who:'__o';draw();};
  const qf=$('#qfl');if(qf)qf.onchange=()=>{cap();QF.fl=qf.value;QF.z='';draw();};
  const qz=$('#qz');if(qz)qz.onchange=()=>{cap();QF.z=qz.value;draw();};
  const sb=$('#rsv');if(sb)sb.onclick=async()=>{
    cap();const kind=MODE,who=(QF.who==='__o'?'':QF.who).trim();
    if(!who){alert('Chọn hoặc nhập tên người báo cáo trước khi gửi');$('#rwho').focus();return;}
    if(!QF.z){alert('Chọn zone');return;}
    if(!QF.d){alert('Chọn ngày báo cáo');return;}
    sv(WHK[kind],who);
    const rec={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),k:kind,date:QF.d,ses:kind==='qn'?QF.s:'sl',fl:QF.fl,zone:kind==='sl'?(QF.fl==='S'?'Chung':QF.z==='ALL'?'Toàn tầng':QF.z):QF.z,who,dev:DEV,ppl:{},pct:{},ot:kind==='qn'?(+$('#rot').value||0):0,note:$('#rn').value.trim(),ts:Date.now()};
    r.querySelectorAll('[data-p]').forEach(e=>{if(e.value!=='')rec.ppl[e.dataset.p]=+e.value;});
    let bad=false;r.querySelectorAll('[data-i]').forEach(e=>{if(e.value===''||e.value===e.dataset.o)return;const v=+e.value;if(!(v>=0&&v<=100))bad=true;rec.pct[e.dataset.i]=v;});
    if(bad){alert('% phải nằm trong khoảng 0–100');return;}
    if(kind==='qn'&&!Object.keys(rec.ppl).length){alert('Nhập số công nhân của ít nhất một đầu việc');return;}
    if(kind==='sl'&&!Object.keys(rec.pct).length){alert('Nhập hoặc sửa % của ít nhất một hạng mục');return;}
    sb.disabled=true;sb.textContent='Đang gửi…';
    reps();setRC(RC.concat([rec]));
    await sync();
    const sent=reps().find(x=>x.id===rec.id);
    bdate=rec.date;draw();window.scrollTo(0,0);
    const nm=kind==='qn'?'báo cáo quân số':'báo cáo sản lượng';
    if(sent&&sent.sy)popup('Đã gửi báo cáo','Đã gửi '+nm+' của '+esc(who)+' ('+esc(rec.fl==='S'?'chung':rec.fl+' '+rec.zone)+', '+dm(rec.date)+'). Mọi người dùng app đều thấy trong bảng theo dõi.');
    else popup('Đã lưu báo cáo','Chưa gửi được lên hệ thống (có thể mất mạng). Báo cáo được giữ trên máy và app sẽ tự gửi lại khi có mạng.');
  };
}
function tick(){
  if(!$('#tdr')){clearInterval(TIMER);TIMER=null;return;}
  sync().then(ch=>{if(!$('#tdr'))return;const a=document.activeElement;const typing=a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName);
    if(MODE!=='plan'){const e=$('#tdboard');if(e){if(!(a&&e.contains(a))){e.innerHTML=board(MODE);bindBoard(e);}}else if(ch&&!typing)draw();}
    else if(ch&&!typing)draw();});
}
window.TD={open:async function(el,mode){
  MODE=mode||'plan';QF.fl='B1';QF.z='';QF.who='';QF.d=null;
  css();el.innerHTML='<div id="tdr"><div class="tdn">Đang tải kế hoạch…</div></div>';
  try{if(!K){const r=await fetch('data/kehoach.json',{cache:'no-cache'});K=await r.json();}}
  catch(e){el.innerHTML='<div id="tdr"><div class="tdn">Chưa tải được dữ liệu kế hoạch. Kiểm tra mạng rồi mở lại.</div></div>';return;}
  RS=null;slTab='map';slF='B1';slZ=null;reps();draw();
  sync().then(ch=>{if(ch&&$('#tdr'))draw();});
  if(!TIMER)TIMER=setInterval(tick,45000);
}};
})();
