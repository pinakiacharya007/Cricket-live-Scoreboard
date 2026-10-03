const say=t=>{const e=$('#msg');if(e)e.textContent=t||''};
const show=()=>{const t=!!localStorage.getItem('tok');$('#login').hidden=t;$('#panel').hidden=!t;if(!t)$('#pw').focus()};
const restore=async()=>{if(localStorage.getItem('tok')){try{await api('/api/session')}catch{localStorage.removeItem('tok')}}show()};
const run=async f=>{say();try{await f()}catch(e){if(e.message==='Login required'){localStorage.removeItem('tok');show()}if(e.message==='Wrong password')$('#pw').focus();say(e.message)}};
function adminInit(active){const L=[['handle','Handle','admin.html'],['add','Add match','add-match.html'],['viewer','View matches','index.html']];
 $('#top').innerHTML=`<a class="brand" href="admin.html"><img src="img/ball.svg" alt=""><span>Scorer</span></a><nav class="nav">${L.map(([k,t,h])=>`<a href="${h}"${k===active?' aria-current="page"':''}>${t}</a>`).join('')}</nav><span id="conn" title="Live connection"></span>`;
 $('#panel').insertAdjacentHTML('beforebegin','<p id="msg" class="err" role="alert"></p><section id="login" class="glass login"><img src="img/ball.svg" alt=""><h1>Scorer login</h1><div class="row"><input id="pw" type="password" placeholder="Scorer password" aria-label="Scorer password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false"><button id="go">Log in</button></div></section>');
 $('#go').onclick=()=>run(async()=>{const r=await api('/api/login',{method:'POST',body:{password:$('#pw').value}});localStorage.setItem('tok',r.token);show()});
 $('#pw').onkeydown=e=>e.key==='Enter'&&$('#go').click();restore()}
const post=(id,p,b)=>api('/api/matches/'+id+p,{method:'POST',body:b||{}});
function matchSelect(ms,cur){return ms.map(x=>`<option value="${x.id}" ${x.id===cur?'selected':''}>${esc(x.teamA)} v ${esc(x.teamB)} (${x.status})</option>`).join('')}