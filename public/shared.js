(function(g){
const legal=b=>b.t!=='wd'&&b.t!=='nb';
const runs=b=>Number.isFinite(b.bat)||Number.isFinite(b.extra)?(Number(b.bat)||0)+(Number(b.extra)||0):Number(b.r)||0;
function summarize(m){return m.innings.map(i=>{let r=0,w=0,l=0;i.balls.forEach(b=>{r+=runs(b);if(b.w)w++;if(legal(b))l++});return{team:i.team,runs:r,wkts:w,balls:l,overs:Math.floor(l/6)+'.'+l%6}})}
function timeline(i){let l=0;return i.balls.map(b=>{const ov=Math.floor(l/6),label=ov+'.'+(l%6+1);if(legal(b))l++;return{...b,ov,label}})}
function chip(b){const r=runs(b);return b.w?'W':b.t==='wd'?(r>1?r+'wd':'Wd'):b.t==='nb'?(r>1?r+'nb':'Nb'):b.t==='b'?r+'b':r===0?'•':String(r)}
function cls(b){const r=runs(b);return b.w?'wk':b.t?'ex':r===4?'four':r===6?'six':r===0?'dot0':''}
function text(b){const p=(b.bowler||'Bowler')+' to '+(b.striker||'Batter')+', ';
 const r=runs(b);if(b.w)return p+'OUT!';if(b.t==='wd')return p+'wide'+(r>1?' + '+(r-1):'');if(b.t==='nb')return p+'no ball'+(b.bat?' + '+b.bat+' off the bat':'')+(b.extra>1?' + '+(b.extra-1)+' extra runs':'');
 if(b.t==='b')return p+r+(r>1?' byes':' bye');return p+(r===0?'no run':r===4?'FOUR':r===6?'SIX':r+(r>1?' runs':' run'))}
const api={summarize,timeline,chip,cls,text};
if(typeof module!=='undefined')module.exports=api;else g.CK=api;
})(typeof window!=='undefined'?window:globalThis);
