const FX=(()=>{const rnd=(a,b)=>a+Math.random()*(b-a);
 const parts=(n,cols)=>Array.from({length:n},()=>{const a=rnd(0,6.28),d=rnd(160,460);return `<i class="p" style="--c:${cols[Math.random()*cols.length|0]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-80}px;--r:${rnd(-540,540)}deg"></i>`}).join('');
 function textFor(b,v,w){
   if(w&&w.type){
     const map={bowled:'BOWLED!',caught:'CAUGHT!',stumped:'STUMPED!',lbw:'LBW!',"run out":'RUN OUT!'};
     return map[w.type]||'OUT!';
   }
   if(b.t==='wd') return 'WIDE!';
   if(b.t==='nb') return 'NO BALL!';
   if(b.t==='b') return 'BYE!';
   if(b.t==='lb') return 'LEG-BYE!';
   if(v===6) return 'SIX!';
   if(v===4) return 'FOUR!';
   if(v===0) return 'DOT!';
   if(v>0) return `${v}`;
   return 'PLAY!';
 }
 function ball(b){
   const v=Number.isFinite(b.bat)?b.bat:(b.t?0:CK.runs(b));
   const w=b.w && b.w.type ? b.w : false;
   const k=w ? 'out' : b.t==='wd' ? 'wd' : b.t==='nb' ? 'nb' : b.t==='b'||b.t==='lb' ? 'extra' : v===6 ? 'six' : v===4 ? 'four' : v===0 ? 'dot' : v>0 ? 'run' : null;
   if(!k)return;
   document.querySelector('.fx')?.remove();
   const who=b.striker||'Batter';
   const extraLabel={wd:'Wide',nb:'No ball',b:'Bye',lb:'Leg-bye'}[b.t]||'';
   const detail = w ? `${who} is out!${w.catcher ? ' Catcher: '+w.catcher : ''}${w.runOutBy ? ' Run-out by: '+w.runOutBy : ''}${w.wicketkeeper ? ' Keeper: '+w.wicketkeeper : ''}` : extraLabel ? `${who} gets ${extraLabel.toLowerCase()}${b.bowler ? ' off '+b.bowler : ''}` : `${who} runs ${v}${b.bowler ? ' off '+b.bowler : ''}`;
   let h='';
   if(k==='four')h='<i class="ring"></i>'+parts(30,['#1F9D55','#38C172','#fff','#F6C945']);
   if(k==='six')h='<i class="rays"></i><img class="flyball" src="img/ball.svg" alt="">'+parts(54,['#F6C945','#2B6CB0','#D7263D','#fff','#38C172']);
   if(k==='out'){h='<i class="flash"></i>'+[18,46,74].map((x,i)=>`<img class="stump" src="img/stumps.svg" alt="" style="left:${x}%;--r:${(i-1)*140}deg;animation-delay:${i*.12}s">`).join('');document.body.classList.add('shake');setTimeout(()=>document.body.classList.remove('shake'),600)}
   if(k==='wd'||k==='nb'||k==='extra'){h='<i class="ring"></i>'+parts(18,['#F6C945','#D7263D','#fff']);}
   if(k==='dot'){h='<i class="ring"></i>'+parts(12,['#0F2A43','#526579','#fff']);}
   if(k==='run'){h='<i class="ring"></i>'+parts(16,['#2B6CB0','#38C172','#fff']);}
   const d=document.createElement('div');d.className='fx '+k;d.setAttribute('aria-hidden','true');d.innerHTML=h+`<div><div class="t">${textFor(b,v,w)}</div><div class="s">${esc(detail)}</div></div>`;document.body.append(d);setTimeout(()=>d.remove(),2400)
 }
 return{ball}})();