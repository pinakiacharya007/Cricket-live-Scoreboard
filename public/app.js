const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function api(p,o={}){const h={'Content-Type':'application/json'},t=localStorage.getItem('tok');if(t)h['x-token']=t;
 const r=await fetch(p,{method:o.method||'GET',headers:h,body:o.body?JSON.stringify(o.body):undefined}),j=await r.json();if(!r.ok)throw new Error(j.error||'Request failed');return j}
function live(cb){let ms=[];const s=io(),sync=()=>api('/api/matches').then(a=>{ms=a;cb(ms)}).catch(()=>{});
 s.on('connect',()=>{$('#conn')&&($('#conn').className='ok');sync()});s.on('disconnect',()=>$('#conn')&&($('#conn').className=''));
 s.on('match',m=>{const i=ms.findIndex(x=>x.id===m.id);i<0?ms.unshift(m):ms[i]=m;cb(ms)});s.on('removed',id=>{ms=ms.filter(x=>x.id!==id);cb(ms)})}
function card(m){const s=CK.summarize(m),row=t=>{const i=s.find(x=>x.team===t);return `<div class="tm"><span>${esc(t)}</span><b>${i?i.runs+'/'+i.wkts:'–'}</b><small>${i?i.overs+' ov':''}</small></div>`};
 return `<a class="card ${m.status}" href="match.html?id=${m.id}"><div class="meta">${m.status==='live'?'<i class="dot"></i>Live ':''}${esc(m.title)}</div>${row(m.teamA)}${row(m.teamB)}${m.result?`<p class="res">${esc(m.result)}</p>`:''}</a>`}
function crest(n){let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))%360;const i=n.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
 return `<span class="crest" style="background:linear-gradient(135deg,hsl(${h} 72% 58%),hsl(${(h+45)%360} 76% 40%))">${esc(i)}</span>`}
function pill(m){return m.status==='live'?'<span class="pill live"><i class="dot"></i>Live</span>':`<span class="pill">${m.status==='completed'?'Finished':'Upcoming'}</span>`}
function card(m){const s=CK.summarize(m),row=t=>{const i=s.find(x=>x.team===t);return `<div class="tm">${crest(t)}<span class="nm">${esc(t)}</span><b>${i?i.runs+'/'+i.wkts:'–'}</b><small>${i?i.overs+' ov':''}</small></div>`};
 return `<a class="card glass ${m.status}" href="match.html?id=${m.id}"><div class="meta">${pill(m)}<span>${esc(m.title)}</span></div>${row(m.teamA)}${row(m.teamB)}${m.result?`<p class="res">${esc(m.result)}</p>`:''}</a>`}
