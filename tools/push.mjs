import webpush from 'web-push';
import fs from 'fs';
let fileMsg='';try{fileMsg=fs.readFileSync('tools/notify.txt','utf8').trim()}catch(e){}
const U='https://ppdxqcrckbwckqzumlwy.supabase.co/rest/v1/rpc/',K='sb_publishable_obBOmHzVr55kpb2eG2BwAQ_wcNW7tkg';
const H={'Content-Type':'application/json',apikey:K,Authorization:'Bearer '+K};
const tok=process.env.PUSH_TOKEN;
webpush.setVapidDetails('mailto:vu.pham@solenc.vn',process.env.VAPID_PUBLIC,process.env.VAPID_PRIVATE);
const subs=await (await fetch(U+'push_list',{method:'POST',headers:H,body:JSON.stringify({p_token:tok})})).json();
if(!Array.isArray(subs)){console.log('list error',subs);process.exit(1)}
console.log('subs',subs.length);let ok=0,gone=0;
const body=JSON.stringify({title:'Bản vẽ & BPTC – FSO',body:process.env.MSG||fileMsg||'Có bản vẽ / biện pháp thi công mới. Mở app để xem.',url:'./'});
for(const s of subs){try{await webpush.sendNotification(s,body);ok++}catch(e){if(e.statusCode===404||e.statusCode===410){gone++;await fetch(U+'push_del',{method:'POST',headers:H,body:JSON.stringify({p_token:tok,p_endpoint:s.endpoint})})}else console.log('err',e.statusCode)}}
console.log('sent',ok,'removed',gone);
