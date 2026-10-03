const CH={c1:'#1F9D55',c2:'#2B6CB0'},tcol=k=>k?CH.c2:CH.c1;
const nice=(v,min)=>Math.ceil(Math.max(v,min)/4)*4;
function frame(L,T,pw,ph,maxY){let g='';for(let k=0;k<=4;k++){const y=T+ph*k/4;g+=`<line x1="${L}" x2="${L+pw}" y1="${y}" y2="${y}" class="gl"/><text x="${L-8}" y="${y+4}" class="tx" text-anchor="end">${Math.round(maxY*(1-k/4))}</text>`}return g}
function defs(id){return `<defs>${[0,1].map(k=>`<linearGradient id="a${k}-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tcol(k)}" stop-opacity=".38"/><stop offset="1" stop-color="${tcol(k)}" stop-opacity="0"/></linearGradient><linearGradient id="b${k}-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k?'#4C8DD6':'#38C172'}"/><stop offset="1" stop-color="${tcol(k)}"/></linearGradient>`).join('')}</defs>`}
const empty=(m,L,pw,T,ph)=>m.innings.some(i=>i.balls.length)?'':`<text x="${L+pw/2}" y="${T+ph/2}" class="tx" text-anchor="middle">Chart fills in as the match starts</text>`;
function worm(m){const W=600,H=260,L=40,R=14,T=14,B=30,pw=W-L-R,ph=H-T-B,ser=m.innings.map(CK.cumulative);
 const maxY=nice(Math.max(0,...ser.flat().map(p=>p.y)),12),X=x=>L+pw*Math.min(x/m.overs,1),Y=y=>T+ph*(1-y/maxY);
 let g=defs(m.id)+frame(L,T,pw,ph,maxY);const st=Math.max(1,Math.ceil(m.overs/10));
 for(let o=0;o<=m.overs;o+=st)g+=`<text x="${X(o)}" y="${H-8}" class="tx" text-anchor="middle">${o}</text>`;
 ser.forEach((s,k)=>{if(s.length<2)return;const pts=s.map(p=>X(p.x).toFixed(1)+','+Y(p.y).toFixed(1));
  g+=`<path d="M${X(0)},${Y(0)} L${pts.join(' L')} L${X(s[s.length-1].x)},${Y(0)}Z" fill="url(#a${k}-${m.id})"/><polyline points="${pts.join(' ')}" fill="none" stroke="${tcol(k)}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  s.filter(p=>p.w).forEach(p=>g+=`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5.5" class="wd"/>`);const e=s[s.length-1];g+=`<circle cx="${X(e.x)}" cy="${Y(e.y)}" r="5" fill="#fff" stroke="${tcol(k)}" stroke-width="3"/>`});
 return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Run progression by over">${g}${empty(m,L,pw,T,ph)}</svg>`}
function bars(m){const W=600,H=260,L=40,R=14,T=22,B=30,pw=W-L-R,ph=H-T-B,ov=m.innings.map(CK.overRuns),played=Math.max(0,...ov.map(o=>o.length));
 const N=m.overs<=20?m.overs:Math.max(played,1),maxY=nice(Math.max(0,...ov.flat().map(o=>o.runs)),12),gw=pw/N,bw=Math.min(22,gw*.36);
 let g=defs(m.id)+frame(L,T,pw,ph,maxY);
 for(let j=0;j<N;j++){const cx=L+gw*(j+.5);ov.forEach((o,k)=>{const d=o[j];if(!d)return;const h=Math.max(ph*d.runs/maxY,3),x=k?cx+1:cx-bw-1,y=T+ph-h;
  g+=`<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="4" fill="url(#b${k}-${m.id})"/>`;if(d.wkts)g+=`<circle cx="${x+bw/2}" cy="${y-9}" r="5" class="wd"/>`});
  if(N<=20||j%Math.ceil(N/10)===0)g+=`<text x="${cx}" y="${H-8}" class="tx" text-anchor="middle">${j+1}</text>`}
 return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Runs per over">${g}${empty(m,L,pw,T,ph)}</svg>`}
function flowHTML(m){const st=CK.flow(m),w=CK.whenParts(m);st[0].sub=w?w.day.slice(0,3)+', '+w.date:'';
 return '<ol class="flow">'+st.map(s=>`<li class="${s.state}"><span class="node">${s.state==='done'?'✓':''}</span><b>${s.label}</b><small>${esc(s.sub||'')}</small></li>`).join('')+'</ol>'}
function charts(m){const lg=m.innings.length?`<div class="legend">${m.innings.map((i,k)=>`<span><i style="background:${tcol(k)}"></i>${esc(i.team)}</span>`).join('')}<span><i style="background:#D7263D"></i>Wicket</span></div>`:'';
 return `<div class="chartbox"><h3>Match flow</h3>${flowHTML(m)}</div><div class="chartbox"><h3>Run progression</h3>${lg}${worm(m)}</div><div class="chartbox"><h3>Runs per over</h3>${lg}${bars(m)}</div>`}