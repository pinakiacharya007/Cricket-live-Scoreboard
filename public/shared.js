(function(g){
const legal=b=>!['wd','nb','lb'].includes(b.t);
const runs=b=>Number.isFinite(b.bat)||Number.isFinite(b.extra)?(Number(b.bat)||0)+(Number(b.extra)||0):Number(b.r)||0;
function summarize(m){return m.innings.map(i=>{let r=0,w=0,l=0;i.balls.forEach(b=>{r+=runs(b);if(b.w)w++;if(legal(b))l++});return{team:i.team,runs:r,wkts:w,balls:l,overs:Math.floor(l/6)+'.'+l%6}})}
function timeline(i){let l=0;return i.balls.map(b=>{const ov=Math.floor(l/6),label=ov+'.'+(l%6+1);if(legal(b))l++;return{...b,ov,label}})}
function chip(b){const r=runs(b);if(b.w){const t=(b.w&&b.w.type)||'out';return t==='caught'?'Ct':t==='run out'?'Run out':t==='bowled'?'B':t==='stumped'?'St':t==='lbw'?'LBW':'W'}
 if(b.t==='wd')return r>1?r+'wd':'Wd';if(b.t==='nb')return r>1?r+'nb':'Nb';if(b.t==='b')return r+'b';if(b.t==='lb')return r+'lb';return r===0?'•':String(r)}
function cls(b){const r=runs(b);if(b.w)return 'wk';if(b.t)return 'ex';return r===4?'four':r===6?'six':r===0?'dot0':''}
function wicketText(w){if(!w||!w.type)return 'OUT!';const map={bowled:'bowled',caught:'caught','run out':'run out',lbw:'LBW',stumped:'stumped'};return map[w.type]||w.type}
function text(b){const p=(b.bowler||'Bowler')+' to '+(b.striker||'Batter')+', ';
 const r=runs(b);if(b.w)return p+`${wicketText(b.w)}${b.w.catcher?`; catcher ${b.w.catcher}`:''}${b.w.fielder?`; fielder ${b.w.fielder}`:''}${b.w.wicketkeeper?`; wicketkeeper ${b.w.wicketkeeper}`:''}`;if(b.t==='wd')return p+'wide'+(r>1?' + '+(r-1):'');if(b.t==='nb')return p+'no ball'+(b.bat?' + '+b.bat+' off the bat':'')+(b.extra>1?' + '+(b.extra-1)+' extra runs':'');if(b.t==='b')return p+r+(r>1?' byes':' bye');if(b.t==='lb')return p+r+(r>1?' leg-byes':' leg-bye');return p+(r===0?'no run':r===4?'FOUR':r===6?'SIX':r+(r>1?' runs':' run'))}
function complete(m,k){const s=summarize(m),x=s[k];if(!x)return false;if(x.wkts>=10||x.balls>=m.overs*6)return true;return k===1&&x.runs>s[0].runs}
function flow(m){const s=summarize(m),n=m.innings.length,done=m.status==='completed',d0=n>0&&(done||n>1||complete(m,0)),d1=n>1&&(done||complete(m,1));
 const sc=i=>s[i]?s[i].team+' '+s[i].runs+'/'+s[i].wkts:'';
 return[{label:'Scheduled',sub:'',state:!n&&!done?'active':'done'},
 {label:'1st innings',sub:sc(0),state:!n?'empty':d0?'done':'active'},
 {label:'Innings break',sub:d0&&s[0]?'Target '+(s[0].runs+1):'',state:n>1?'done':(d0&&!done?'active':'empty')},
 {label:'2nd innings',sub:sc(1),state:n<2?'empty':d1?'done':'active'},
 {label:'Result',sub:m.result||'',state:done?'done':'empty'}]}
function tossText(m){if(!m||!m.toss||!m.toss.announced) return 'Toss pending';
 const won=m.toss.wonBy || 'Team';
 const choice=m.toss.decision === 'batting' ? 'bat first' : 'bowl first';
 return `${won} won the toss and chose to ${choice}`;}
function whenParts(m){if(!m.startsAt)return null;const d=new Date(m.startsAt);if(isNaN(d))return null;
 return{day:d.toLocaleDateString('en-IN',{weekday:'long'}),date:d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),time:d.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}).toUpperCase()}}
function cumulative(i){let r=0,l=0;const p=[{x:0,y:0,w:false}];i.balls.forEach(b=>{r+=runs(b);if(legal(b))l++;p.push({x:l/6,y:r,w:!!b.w})});return p}
function overRuns(i){const o=[];let l=0;i.balls.forEach(b=>{const k=Math.floor(l/6);o[k]=o[k]||{runs:0,wkts:0};o[k].runs+=runs(b);if(b.w)o[k].wkts++;if(legal(b))l++});for(let k=0;k<o.length;k++)o[k]=o[k]||{runs:0,wkts:0};return o}
const api={summarize,timeline,chip,cls,text,runs,complete,flow,tossText,whenParts,cumulative,overRuns,wicketText};
if(typeof module!=='undefined')module.exports=api;else g.CK=api;
})(typeof window!=='undefined'?window:globalThis);