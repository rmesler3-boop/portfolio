const $=s=>document.querySelector(s),C=['#58a6ff','#3fb950','#d29922','#bc8cff','#f778ba','#39c5cf','#ff7b72','#8b949e'];
const usd=n=>n.toLocaleString('en-US',{style:'currency',currency:'USD'}),pc=n=>(n*100).toFixed(1)+'%';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
document.documentElement.dataset.theme=localStorage.theme||'dark';
$('#theme').onclick=()=>{const t=document.documentElement.dataset.theme=document.documentElement.dataset.theme=='dark'?'light':'dark';localStorage.theme=t;route()};

let DB=null;
function parseCSV(t){const rows=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'&&t[i+1]=='"'){f+='"';i++}else if(c=='"')q=false;else f+=c}else if(c=='"')q=true;else if(c==','){r.push(f);f=''}else if(c=='\n'){r.push(f);rows.push(r);r=[];f=''}else if(c!='\r')f+=c}if(f||r.length){r.push(f);rows.push(r)}const h=rows.shift()||[];return rows.filter(x=>x.length>1).map(x=>Object.fromEntries(h.map((k,i)=>[k||('col'+i),x[i]||''])))}
async function unlock(pw){const e=await (await fetch('data.enc.json',{cache:'no-store'})).json(),b=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
 const k=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:b(e.salt),iterations:e.iter},km,{name:'AESGCM'.replace('GCM','-GCM'),length:256},false,['decrypt']);
 const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b(e.iv)},k,b(e.ct));DB=JSON.parse(new TextDecoder().decode(pt));DB.log=parseCSV(DB.logcsv);}
async function api(p){if(!DB){show(false);throw 'auth'}if(p.startsWith('/api/holdings'))return structuredClone(DB.holdings);if(p=='/api/log')return DB.log;if(p=='/api/lessons')return {md:DB.lessons};if(p=='/api/briefs')return DB.briefs;}
function show(a){$('#login').classList.toggle('hidden',a);$('#app').classList.toggle('hidden',!a)}
$('#lf').onsubmit=async e=>{e.preventDefault();$('#lerr').textContent='Unlocking…';try{await unlock($('#pw').value);$('#pw').value='';$('#lerr').textContent='';show(true);route()}catch(x){$('#lerr').textContent='Wrong password'}};
$('#logout').onclick=()=>{DB=null;$('#main').innerHTML='';show(false)};
function md(t){const L=t.split('\n');let o='',i=0;const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>').replace(/`(.+?)`/g,'<code>$1</code>').replace(/\[(.+?)\]\((https?:[^)]+)\)/g,'<a href="$2" rel="noreferrer noopener" target="_blank">$1</a>');
 while(i<L.length){let l=L[i];if(/^#{1,4} /.test(l)){const n=l.match(/^#+/)[0].length;o+=`<h${n}>${inl(l.slice(n+1))}</h${n}>`;i++}
 else if(/^\s*\|/.test(l)){const rows=[];while(i<L.length&&/^\s*\|/.test(L[i]))rows.push(L[i++]);const c=r=>r.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
  o+='<table><tr>'+c(rows[0]).map(x=>`<th>${inl(x)}</th>`).join('')+'</tr>'+rows.slice(2).map(r=>'<tr>'+c(r).map(x=>`<td>${inl(x)}</td>`).join('')+'</tr>').join('')+'</table>'}
 else if(/^\s*([-*]|\d+\.) /.test(l)){o+='<ul>';while(i<L.length&&/^\s*([-*]|\d+\.) /.test(L[i]))o+=`<li>${inl(L[i++].replace(/^\s*([-*]|\d+\.) /,''))}</li>`;o+='</ul>'}
 else if(l.trim()){o+=`<p>${inl(l)}</p>`;i++}else i++}return o}
function donut(items){const tot=items.reduce((a,b)=>a+b.v,0);let a=-Math.PI/2,s='';items.forEach((it,k)=>{const f=it.v/tot,b=a+f*2*Math.PI*0.9999,R=70,r=46,x=Math.cos,y=Math.sin,lg=f>.5?1:0;
 s+=`<path fill="${C[k%8]}" d="M${80+R*x(a)} ${80+R*y(a)}A${R} ${R} 0 ${lg} 1 ${80+R*x(b)} ${80+R*y(b)}L${80+r*x(b)} ${80+r*y(b)}A${r} ${r} 0 ${lg} 0 ${80+r*x(a)} ${80+r*y(a)}Z"><title>${esc(it.l)} ${pc(f)}</title></path>`;a=b});
 return `<div class="donut"><svg width="160" height="160">${s}</svg><div class="leg">${items.map((it,k)=>`<div><span class="sw" style="background:${C[k%8]}"></span>${esc(it.l)} <span class="muted">${pc(it.v/tot)} · ${usd(it.v)}</span></div>`).join('')}</div></div>`}
const P={};
P.overview=async()=>{const d=await api('/api/holdings'),tot=a=>a.holdings.reduce((s,h)=>s+h.value,0),all=d.accounts.reduce((s,a)=>s+tot(a),0);
 const cls={};d.accounts.forEach(a=>a.holdings.forEach(h=>cls[h.class]=(cls[h.class]||0)+h.value));const ce=Object.entries(cls).sort((a,b)=>b[1]-a[1]);
 return `<h1>Overview</h1><p class="muted">Combined across all accounts</p><div class="grid"><div class="card kpi"><div class="lbl">Total net worth (invested)</div><div class="big">${usd(all)}</div></div>
 ${d.accounts.map(a=>`<div class="card kpi"><div class="lbl">${esc(a.name)}</div><div class="big">${usd(tot(a))}</div><div class="muted small">${pc(tot(a)/all)} of total · as of ${esc(a.asOf)}</div></div>`).join('')}</div>
 <div class="grid">${d.accounts.map(a=>`<div class="card"><h2>${esc(a.name)} allocation</h2>${donut(a.holdings.map(h=>({l:h.ticker+' — '+h.name,v:h.value})))}</div>`).join('')}</div>
 <div class="card"><h2>Combined asset-class breakdown</h2>${donut(ce.map(([l,v])=>({l,v})))}<div style="margin-top:16px">${ce.map(([l,v],k)=>`<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(l)}</span><span class="muted">${pc(v/all)}</span></div><div class="bar"><i style="width:${v/all*100}%;background:${C[k%8]}"></i></div></div>`).join('')}</div></div>`};
P.holdings=async()=>{const d=await api('/api/holdings');window._h=d;
 return `<h1>Holdings</h1><p class="muted">Read-only copy. Edit on the private box app; changes publish daily.</p>${d.accounts.map((a,ai)=>`<div class="card" style="margin:16px 0"><h2>${esc(a.name)}</h2>
 <label class="muted small">As of <input data-a="${ai}" data-f="asOf" type="date" value="${esc(a.asOf)}" style="width:auto"></label><table><tr><th>Ticker</th><th>Name</th><th>Asset class</th><th class="n">Value ($)</th></tr>
 ${a.holdings.map((h,hi)=>`<tr><td><b>${esc(h.ticker)}</b></td><td>${esc(h.name)}</td><td class="muted">${esc(h.class)}</td><td class="n"><input data-a="${ai}" data-h="${hi}" type="number" step="0.01" min="0" value="${h.value}" style="width:140px;text-align:right"></td></tr>`).join('')}</table></div>`).join('')}
 `};
document.addEventListener('click',async e=>{if(e.target.id!='save')return;const d=window._h;document.querySelectorAll('input[data-a]').forEach(i=>{const a=d.accounts[i.dataset.a];if(i.dataset.f)a.asOf=i.value;else a.holdings[i.dataset.h].value=+i.value});
 const r=await api('/api/holdings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});$('#sv').textContent=r.ok?'✓ Saved':'Error: '+r.error});
const num=s=>{const v=parseFloat(String(s).replace(/[^\d.+-]/g,''));return isFinite(v)?v:null};
P.scorecard=async()=>{const log=await api('/api/log'),sc=log.filter(r=>r.direction_correct&&num(r.actual_pct)!==null);
 const hits=sc.filter(r=>r.direction_correct.toLowerCase().startsWith('y')).length,by={};sc.forEach(r=>{(by[r.instrument]=by[r.instrument]||[]).push(r)});
 const ch=chart(sc);
 return `<h1>Prediction scorecard</h1><p class="muted">${log.length} predictions logged · ${sc.length} scored</p><div class="grid">
 <div class="card kpi"><div class="lbl">Direction hit rate</div><div class="big">${sc.length?pc(hits/sc.length):'—'}</div><div class="muted small">${hits} of ${sc.length}</div></div>
 <div class="card kpi"><div class="lbl">Mean abs error</div><div class="big">${sc.length?(sc.reduce((s,r)=>s+Math.abs(num(r.actual_pct)-num(r.predicted_pct)),0)/sc.length).toFixed(2)+' pts':'—'}</div></div>
 <div class="card kpi"><div class="lbl">Pending</div><div class="big">${log.length-sc.length}</div><div class="muted small">awaiting close</div></div></div>
 <div class="card"><h2>Per instrument</h2><table><tr><th>Instrument</th><th class="n">Scored</th><th class="n">Hit rate</th><th class="n">Avg abs error</th><th class="n">Avg bias (pred−act)</th></tr>
 ${Object.entries(by).map(([k,v])=>{const h=v.filter(r=>r.direction_correct.toLowerCase().startsWith('y')).length,e=v.map(r=>num(r.predicted_pct)-num(r.actual_pct));return `<tr><td><b>${esc(k)}</b></td><td class="n">${v.length}</td><td class="n">${pc(h/v.length)}</td><td class="n">${(e.reduce((s,x)=>s+Math.abs(x),0)/v.length).toFixed(2)}</td><td class="n ${e.reduce((a,b)=>a+b,0)>0?'up':'dn'}">${(e.reduce((a,b)=>a+b,0)/v.length).toFixed(2)}</td></tr>`}).join('')}</table></div>
 <div class="card" style="margin:16px 0"><h2>Predicted vs actual (%)</h2>${ch}</div>
 <div class="card"><h2>All predictions</h2><div style="overflow-x:auto"><table><tr><th>Date</th><th>Instrument</th><th>Call</th><th class="n">Pred %</th><th>Conf.</th><th class="n">Actual %</th><th class="n">Error</th><th>Hit</th><th>Drivers</th></tr>
 ${log.slice().reverse().map(r=>{const a=num(r.actual_pct);return `<tr><td>${esc(r.date)}</td><td><b>${esc(r.instrument)}</b></td><td>${esc(r.predicted_direction)}</td><td class="n">${esc(r.predicted_pct)}</td><td class="muted">${esc(r.confidence)}</td><td class="n ${a>0?'up':a<0?'dn':''}">${a===null?'<span class="muted">pending</span>':esc(r.actual_pct)}</td><td class="n">${esc(r.error_pct)}</td><td>${r.direction_correct?`<span class="pill ${r.direction_correct.toLowerCase().startsWith('y')?'yes':'no'}">${esc(r.direction_correct)}</span>`:''}</td><td class="muted small">${esc(r.key_drivers)}</td></tr>`}).join('')}</table></div></div>`};
function chart(rows){if(!rows.length)return '<p class="muted">No scored predictions yet.</p>';const W=Math.max(500,rows.length*70),H=240,pad=34,vals=rows.flatMap(r=>[num(r.predicted_pct),num(r.actual_pct)]),m=Math.max(.5,...vals.map(Math.abs))*1.15,
 y=v=>H/2-v/m*(H/2-pad),bw=(W-pad)/rows.length;let s=`<line x1="${pad}" x2="${W}" y1="${H/2}" y2="${H/2}" stroke="var(--line)"/><text x="2" y="${y(m*.8)}">+${(m*.8).toFixed(1)}</text><text x="2" y="${y(-m*.8)}">${(-m*.8).toFixed(1)}</text>`;
 rows.forEach((r,i)=>{const x=pad+i*bw+bw*.15,w=bw*.33,p=num(r.predicted_pct),a=num(r.actual_pct);[[p,C[0],0],[a,C[1],w+2]].forEach(([v,c,o])=>s+=`<rect x="${x+o}" y="${Math.min(y(v),H/2)}" width="${w}" height="${Math.max(1,Math.abs(y(v)-H/2))}" fill="${c}" rx="2"><title>${v}%</title></rect>`);
 s+=`<text x="${x}" y="${H-4}">${esc(r.instrument.slice(0,7))} ${esc(r.date.slice(5))}</text>`});
 return `<div style="overflow-x:auto"><svg width="${W}" height="${H}">${s}</svg></div><div class="leg" style="display:flex;gap:16px"><div><span class="sw" style="background:${C[0]}"></span>Predicted</div><div><span class="sw" style="background:${C[1]}"></span>Actual</div></div>`}
P.briefs=async()=>{const b=await api('/api/briefs');return `<h1>Daily briefs</h1><p class="muted">From /workspace/market-predictions/briefs/</p>`+(b.length?b.map((x,i)=>`<details class="card brief" ${i?'':'open'}><summary>${esc(x.name)}</summary><div class="md">${md(x.md)}</div></details>`).join(''):'<div class="card muted">No briefs saved yet.</div>')};
P.lessons=async()=>{const l=await api('/api/lessons');return `<h1>Lessons learned</h1><p class="muted">How the scorecard is refining predictions</p><div class="card md">${l.md?md(l.md):'<p class="muted">No lessons yet.</p>'}</div>`};
async function route(){const p=(location.hash.slice(1)||'overview');document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.p==p));try{$('#main').innerHTML=await (P[p]||P.overview)()}catch(e){}}
window.onhashchange=route;show(false);
