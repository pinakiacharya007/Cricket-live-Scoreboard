const FX=(()=>{const rnd=(a,b)=>a+Math.random()*(b-a);
 const parts=(n,cols)=>Array.from({length:n},()=>{const a=rnd(0,6.28),d=rnd(160,460);return `<i class="p" style="--c:${cols[Math.random()*cols.length|0]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-80}px;--r:${rnd(-540,540)}deg"></i>`}).join('');
 function ball(b){const v=Number.isFinite(b.bat)?b.bat:(b.t?0:CK.runs(b)),k=b.w?'out':v===6?'six':v===4?'four':null;if(!k)return;
  document.querySelector('.fx')?.remove();const who=b.striker||'Batter',txt={four:'FOUR!',six:'SIX!',out:'OUT!'}[k];
  const sub=k==='out'?`${who} is out!${b.bowler?' Bowler: '+b.bowler:''}`:`${who} hits it${b.bowler?' off '+b.bowler:''}`;let h='';
  if(k==='four')h='<i class="ring"></i>'+parts(30,['#1F9D55','#38C172','#fff','#F6C945']);
  if(k==='six')h='<i class="rays"></i><img class="flyball" src="img/ball.svg" alt="">'+parts(54,['#F6C945','#2B6CB0','#D7263D','#fff','#38C172']);
  if(k==='out'){h='<i class="flash"></i>'+[18,46,74].map((x,i)=>`<img class="stump" src="img/stumps.svg" alt="" style="left:${x}%;--r:${(i-1)*140}deg;animation-delay:${i*.12}s">`).join('');document.body.classList.add('shake');setTimeout(()=>document.body.classList.remove('shake'),600)}
  const d=document.createElement('div');d.className='fx '+k;d.setAttribute('aria-hidden','true');d.innerHTML=h+`<div><div class="t">${txt}</div><div class="s">${esc(sub)}</div></div>`;document.body.append(d);setTimeout(()=>d.remove(),2400)}
 return{ball}})();