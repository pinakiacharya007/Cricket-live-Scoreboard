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
  if(b.t==='dead') return 'DEAD BALL!';
   if(v===6) return 'SIX!';
   if(v===4) return 'FOUR!';
   if(v===0) return 'DOT!';
   if(v>0) return `${v}`;
   return 'PLAY!';
 }
 function ball(b){
   const v=Number.isFinite(b.bat)?b.bat:(b.t?0:CK.runs(b));
   const w=b.w && b.w.type ? b.w : false;
   const outKind=w?({caught:'caught','run out':'runout',bowled:'bowled',stumped:'stumped',lbw:'lbw'}[w.type]||'bowled'):'';
  const k=w ? 'out' : b.t==='dead' ? 'dead' : b.t==='wd' ? 'wd' : b.t==='nb' ? 'nb' : b.t==='b'||b.t==='lb' ? 'extra' : v===6 ? 'six' : v===4 ? 'four' : v===0 ? 'dot' : v>0 ? 'run' : null;
   if(!k)return;
   document.querySelector('.fx')?.remove();
   const who=b.striker||'Batter';
  const extraLabel={wd:'Wide',nb:'No ball',b:'Bye',lb:'Leg-bye',dead:'Dead ball'}[b.t]||'';
   const caughtBy=w&&(w.catcher||w.fielder);
   const detail = w ? outKind==='caught' ? `Caught by ${caughtBy||'the fielder'}` : outKind==='runout' ? `Run out${w.runOutBy?' by '+w.runOutBy:''}` : outKind==='stumped' ? `Stumped${w.wicketkeeper?' by '+w.wicketkeeper:''}` : outKind==='lbw' ? 'Leg before wicket' : 'Bowled' : extraLabel ? `${who} gets ${extraLabel.toLowerCase()}${b.bowler ? ' off '+b.bowler : ''}` : `${who} runs ${v}${b.bowler ? ' off '+b.bowler : ''}`;
   let h='';
   const stumps=[18,46,74].map((x,i)=>`<img class="stump" src="img/stumps.svg" alt="" style="left:${x}%;--r:${(i-1)*140}deg;animation-delay:${i*.12}s">`).join('');
   if(k==='four')h='<i class="ring"></i>'+parts(30,['#1F9D55','#38C172','#fff','#F6C945']);
   if(k==='six')h='<i class="rays"></i><img class="flyball" src="img/ball.svg" alt="">'+parts(54,['#F6C945','#2B6CB0','#D7263D','#fff','#38C172']);
   if(k==='out'){
     if(outKind==='caught')h='<img class="catch-ball" src="img/ball.svg" alt=""><i class="catch-target"></i>';
     else if(outKind==='runout')h='<i class="runout-line"></i>'+stumps;
     else if(outKind==='stumped')h='<i class="keeper-mark"></i><img class="keeper-ball" src="img/ball.svg" alt="">'+stumps;
     else if(outKind==='lbw')h='<i class="lbw-impact"></i><img class="lbw-ball" src="img/ball.svg" alt="">';
     else h='<i class="flash"></i>'+stumps;
     if(outKind==='bowled'||outKind==='runout'){document.body.classList.add('shake');setTimeout(()=>document.body.classList.remove('shake'),600)}
   }
  if(k==='wd'||k==='nb'||k==='extra'){h='<i class="ring"></i>'+parts(18,['#F6C945','#D7263D','#fff']);}
  if(k==='dead'){h='<i class="ring"></i>'+parts(10,['#526579','#fff','#CBE3FF']);}
   if(k==='dot'){h='<i class="ring"></i>'+parts(12,['#0F2A43','#526579','#fff']);}
  if(k==='run'){h='<i class="runner runner-a"></i><i class="runner runner-b"></i><i class="ring"></i>'+parts(16,['#2B6CB0','#38C172','#fff']);}
  const d=document.createElement('div');d.className='fx '+k+(outKind?' out-'+outKind:'');d.setAttribute('aria-hidden','true');d.innerHTML=h+`<div><div class="t">${textFor(b,v,w)}</div><div class="s">${esc(detail)}</div></div>`;document.body.append(d);setTimeout(()=>d.remove(),w?5600:2400)
 }
 function tossing(){if(document.querySelector('.fx.toss-live'))return;document.querySelector('.fx')?.remove();const d=document.createElement('div');d.className='fx toss toss-live';d.setAttribute('aria-hidden','true');d.innerHTML='<span class="toss-coin toss-result" aria-hidden="true">TOSS</span><div><div class="t">TOSS IN PROGRESS</div><div class="s">Waiting for the scorer to announce the result</div></div>';document.body.append(d)}
 function stopTossing(){document.querySelector('.fx.toss-live')?.remove()}
 function toss(m){stopTossing();document.querySelector('.fx')?.remove();const d=document.createElement('div');d.className='fx toss';d.setAttribute('aria-hidden','true');d.innerHTML='<span class="toss-coin toss-result" aria-hidden="true">TOSS</span><div><div class="t">TOSS!</div><div class="s">'+esc(CK.tossText(m))+'</div></div>';document.body.append(d);setTimeout(()=>d.remove(),5600)}
 function finish(m){document.querySelector('.fx')?.remove();const winner=m.winner?m.winner+' won':m.result||'Match finished',d=document.createElement('div');d.className='fx finish';d.setAttribute('aria-hidden','true');d.innerHTML=parts(110,['#F6C945','#38C172','#2B6CB0','#D7263D','#fff'])+'<div><div class="t">CHAMPIONS!</div><div class="s">'+esc(winner)+'</div></div>';document.body.append(d);setTimeout(()=>d.remove(),6200)}
 return{ball,toss,tossing,stopTossing,finish}})();