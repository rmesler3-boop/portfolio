const $=s=>document.querySelector(s),C=['#58a6ff','#3fb950','#d29922','#bc8cff','#f778ba','#39c5cf','#ff7b72','#8b949e'];
const usd=n=>n.toLocaleString('en-US',{style:'currency',currency:'USD'}),pc=n=>(n*100).toFixed(1)+'%';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
document.documentElement.dataset.theme=localStorage.theme||'dark';
$('#theme').onclick=()=>{const t=document.documentElement.dataset.theme=document.documentElement.dataset.theme=='dark'?'light':'dark';localStorage.theme=t;route()};

let DB=null;
function parseCSV(t){const rows=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'&&t[i+1]=='"'){f+='"';i++}else if(c=='"')q=false;else f+=c}else if(c=='"')q=true;else if(c==','){r.push(f);f=''}else if(c=='\n'){r.push(f);rows.push(r);r=[];f=''}else if(c!='\r')f+=c}if(f||r.length){r.push(f);rows.push(r)}const h=rows.shift()||[];return rows.filter(x=>x.length>1).map(x=>Object.fromEntries(h.map((k,i)=>[k||('col'+i),x[i]||''])))}
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));let KEY=null,KSALT=null;
async function dec(file,pw){const e=await (await fetch(file+'?t='+Date.now(),{cache:'no-store'})).json();
 if(!KEY||KSALT!==e.salt){const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);KEY=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:b64(e.salt),iterations:e.iter},km,{name:'AES-GCM',length:256},false,['decrypt']);KSALT=e.salt}
 let pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(e.iv)},KEY,b64(e.ct));
 if(e.gz)pt=await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();return JSON.parse(new TextDecoder().decode(pt))}
let PWD=null;
async function unlock(pw){const [l,h]=await Promise.all([dec('data.enc.json',pw),dec('hist.enc.json',pw)]);DB=l;DB.log=parseCSV(DB.logcsv);DB.prices.daily=h.daily;PWD=pw;}
setInterval(async()=>{if(!PWD||document.hidden)return;try{const l=await dec('data.enc.json',PWD);const d=DB.prices.daily;DB=l;DB.log=parseCSV(DB.logcsv);DB.prices.daily=d;route()}catch(e){}},5*60e3);
async function api(p){if(!DB){show(false);throw 'auth'}if(p.startsWith('/api/holdings'))return structuredClone(DB.holdings);if(p=='/api/prices')return DB.prices;if(p=='/api/log')return DB.log;if(p=='/api/lessons')return {md:DB.lessons};if(p=='/api/briefs')return DB.briefs;}
function show(a){$('#login').classList.toggle('hidden',a);$('#app').classList.toggle('hidden',!a)}
$('#lf').onsubmit=async e=>{e.preventDefault();$('#lerr').textContent='Unlocking…';try{await unlock($('#pw').value);$('#pw').value='';$('#lerr').textContent='';show(true);route()}catch(x){$('#lerr').textContent='Wrong password'}};
$('#logout').onclick=()=>{DB=null;PWD=null;KEY=null;$('#main').innerHTML='';show(false)};
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

// ---- pricing helpers ----
const pkey=(a,h)=>h.priceKey||(a.id=='tsp'?'TSP_'+h.ticker:h.ticker);
function curPrice(P,a,h){const k=pkey(a,h);if(k.startsWith('TSP_')){const t=P.tsp?.[h.ticker];return t?{p:t.price,est:t.estimated,t:t.time,date:t.date,off:t.officialDate}:null}
 const q=P.quotes?.[k];return q?{p:q.price,est:false,t:q.time,date:q.date}:null}
const valNow=(P,a,h)=>{const c=curPrice(P,a,h);return h.shares!=null&&c?h.shares*c.p:h.value};
const fmtT=t=>t?new Date(t*1000).toLocaleString('en-US',{timeZone:'America/Denver',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' MT':'—';
function asOfLine(P){const anyEst=Object.values(P.tsp||{}).some(t=>t.estimated),off=Object.values(P.tsp||{})[0]?.officialDate;
 return `<p class="muted small">Prices as of <b>${fmtT(P.asOf)}</b> · TSP official through ${esc(off||'—')}${anyEst?' · <span class="pill est">TSP today = estimated</span>':''}</p>`}
P.overview=async()=>{const [d,Pr]=await Promise.all([api('/api/holdings'),api('/api/prices')]);const tot=a=>a.holdings.reduce((s,h)=>s+valNow(Pr,a,h),0),all=d.accounts.reduce((s,a)=>s+tot(a),0);
 const day=a=>a.holdings.reduce((s,h)=>{const k=pkey(a,h),ser=dailyWithToday(Pr,a,h);if(ser.length<2||h.shares==null)return s;return s+h.shares*(ser.at(-1)[1]-ser.at(-2)[1])},0);
 const cls={};d.accounts.forEach(a=>a.holdings.forEach(h=>cls[h.class]=(cls[h.class]||0)+valNow(Pr,a,h)));const ce=Object.entries(cls).sort((a,b)=>b[1]-a[1]);
 const dAll=d.accounts.reduce((s,a)=>s+day(a),0),chg=v=>`<span class="${v>=0?'up':'dn'}">${v>=0?'+':''}${usd(v)}</span>`;
 return `<h1>Overview</h1>${asOfLine(Pr)}<div class="grid"><div class="card kpi"><div class="lbl">Total invested</div><div class="big">${usd(all)}</div><div class="small">${chg(dAll)} latest day</div></div>
 ${d.accounts.map(a=>`<div class="card kpi"><div class="lbl">${esc(a.name)}</div><div class="big">${usd(tot(a))}</div><div class="small">${chg(day(a))} latest day · <span class="muted">${pc(tot(a)/all)} of total</span></div></div>`).join('')}</div>
 <div class="card" style="margin-bottom:16px"><h2>Holdings now</h2><table><tr><th>Account</th><th>Holding</th><th class="n">Shares</th><th class="n">Price</th><th class="n">Value</th></tr>
 ${d.accounts.map(a=>a.holdings.map(h=>{const c=curPrice(Pr,a,h);return `<tr><td class="muted">${esc(a.name)}</td><td><b>${esc(h.ticker)}</b> <span class="muted small">${esc(h.name)}</span></td><td class="n">${h.shares!=null?h.shares.toLocaleString('en-US',{maximumFractionDigits:4}):'—'}${h.sharesEstimated?' <span class="pill est" title="Estimated from balance">est</span>':''}</td><td class="n">${c?'$'+c.p.toFixed(c.p<50?4:2):'—'}${c?.est?' <span class="pill est" title="Estimated from proxy since last official TSP price">est</span>':''}</td><td class="n">${usd(valNow(Pr,a,h))}</td></tr>`}).join('')).join('')}</table></div>
 <div class="grid">${d.accounts.map(a=>`<div class="card"><h2>${esc(a.name)} allocation</h2>${donut(a.holdings.map(h=>({l:h.ticker+' — '+h.name,v:valNow(Pr,a,h)})))}</div>`).join('')}</div>
 <div class="card"><h2>Combined asset-class breakdown</h2>${donut(ce.map(([l,v])=>({l,v})))}<div style="margin-top:16px">${ce.map(([l,v],k)=>`<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(l)}</span><span class="muted">${pc(v/all)}</span></div><div class="bar"><i style="width:${v/all*100}%;background:${C[k%8]}"></i></div></div>`).join('')}</div></div>`};
P.holdings=async()=>{const d=await api('/api/holdings');window._h=d;
 return `<h1>Holdings</h1><p class="muted">Read-only copy. Edit on the private box app; changes publish automatically.</p>${d.accounts.map((a,ai)=>`<div class="card" style="margin:16px 0"><h2>${esc(a.name)}</h2>
 <label class="muted small">Balance as of <input data-a="${ai}" data-f="asOf" type="date" value="${esc(a.asOf)}" style="width:auto"></label><table><tr><th>Ticker</th><th>Name</th><th>Asset class</th><th class="n">Balance ($)</th><th class="n">Shares</th></tr>
 ${a.holdings.map((h,hi)=>`<tr><td><b>${esc(h.ticker)}</b></td><td>${esc(h.name)}</td><td class="muted">${esc(h.class)}</td><td class="n"><input data-a="${ai}" data-h="${hi}" type="number" step="0.01" min="0" value="${h.value}" style="width:130px;text-align:right"></td>
 <td class="n"><input data-a="${ai}" data-h="${hi}" data-s="1" type="number" step="0.0001" min="0" value="${h.shares??''}" style="width:130px;text-align:right">${h.sharesEstimated?`<div class="muted small">est. @ $${h.sharesPrice} on ${esc(h.sharesPriceDate)}</div>`:''}</td></tr>`).join('')}</table></div>`).join('')}
 `};
// ---- performance ----
const DAYMS=864e5,dms=d=>Date.parse(d+'T20:00:00Z');
function dailyWithToday(P,a,h){const k=pkey(a,h);let s=(P.daily?.[k]||[]).map(([d,v])=>[d,v]);if(k.startsWith('TSP_')){const t=P.tsp?.[h.ticker];if(t?.estimated&&(!s.length||t.date>s.at(-1)[0]))s.push([t.date,t.price])}else{const q=P.quotes?.[k];if(q){if(s.length&&s.at(-1)[0]===q.date)s[s.length-1]=[q.date,q.price];else if(!s.length||q.date>s.at(-1)[0])s.push([q.date,q.price])}}return s}
function intraday(P,a,h){const k=pkey(a,h),dl=dailyWithToday(P,a,h);let pts=k.startsWith('TSP_')?(P.tsp?.[h.ticker]?.intraday||[]):(P.intraday?.[k]||[]);
 const last=dl.at(-1);if(!pts.length){return dl.slice(-2).map(([d,v])=>[dms(d),v])}
 const today=new Date(pts.at(-1)[0]*1000).toLocaleDateString('en-CA',{timeZone:'America/New_York'}),prev=dl.filter(x=>x[0]<today).at(-1);
 const o=pts.map(([t,v])=>[t*1000,v]);if(prev)o.unshift([o[0][0]-60e3,prev[1]]);return o}
function holdingSeries(P,a,h,range){if(range=='1D')return intraday(P,a,h);const s=dailyWithToday(P,a,h).map(([d,v])=>[dms(d),v]);if(!s.length)return s;
 const end=s.at(-1)[0],y=new Date(end).getUTCFullYear(),cut={'1W':end-7*DAYMS,'1M':end-31*DAYMS,'3M':end-92*DAYMS,'YTD':Date.UTC(y,0,1),'1Y':end-366*DAYMS,'Max':-Infinity}[range];
 const i=s.findIndex(x=>x[0]>=cut);return s.slice(Math.max(0,i-(range=='Max'?0:1)))}
function combine(parts){// parts: [{s:[[t,price]],sh}] -> value series, forward-filled, starting where all exist
 parts=parts.filter(p=>p.s.length);if(!parts.length)return [];const start=Math.max(...parts.map(p=>p.s[0][0])),ts=[...new Set(parts.flatMap(p=>p.s.map(x=>x[0])))].filter(t=>t>=start).sort((a,b)=>a-b);
 const idx=parts.map(()=>0);return ts.map(t=>[t,parts.reduce((sum,p,k)=>{while(idx[k]+1<p.s.length&&p.s[idx[k]+1][0]<=t)idx[k]++;return sum+p.s[idx[k]][1]*p.sh},0)])}
let PERF={sel:'total',range:'1M',mode:'$'};
P.performance=async()=>{const [d,Pr]=await Promise.all([api('/api/holdings'),api('/api/prices')]);window._perf={d,Pr};
 const opts=[['total','Total (all accounts)'],...d.accounts.map((a,i)=>['a'+i,a.name]),...d.accounts.flatMap((a,i)=>a.holdings.map((h,j)=>['h'+i+'.'+j,`${a.name} · ${h.ticker}`]))];
 return `<h1>Performance</h1>${asOfLine(Pr)}<div class="card"><div class="toolbar"><select id="psel">${opts.map(([v,l])=>`<option value="${v}" ${v==PERF.sel?'selected':''}>${esc(l)}</option>`).join('')}</select>
 <div class="seg">${['1D','1W','1M','3M','YTD','1Y','Max'].map(r=>`<button class="${r==PERF.range?'on':''}" data-range="${r}">${r}</button>`).join('')}</div><div class="seg">${['$','%'].map(m=>`<button class="${m==PERF.mode?'on':''}" data-mode="${m}">${m}</button>`).join('')}</div></div>
 <div id="pchart"></div><p class="muted small">Values use current share counts applied to historical prices (contributions and trades are not modeled). Daily closes are not dividend-adjusted. TSP intraday points are estimates from proxy ETFs until tsp.gov posts the official price.</p></div>
 <div class="card" style="margin-top:16px"><h2>Returns by holding</h2><div id="ptable"></div></div>`};
function drawPerf(){const x=window._perf;if(!x||!$('#pchart'))return;const {d,Pr}=x,R=PERF.range;let parts=[],title='';
 const add=(a,h)=>parts.push({s:holdingSeries(Pr,a,h,R),sh:h.shares??0});
 if(PERF.sel=='total')d.accounts.forEach(a=>a.holdings.forEach(h=>add(a,h)));else if(PERF.sel[0]=='a'){const a=d.accounts[+PERF.sel.slice(1)];a.holdings.forEach(h=>add(a,h))}
 else{const [i,j]=PERF.sel.slice(1).split('.').map(Number);const a=d.accounts[i],h=a.holdings[j];parts.push({s:holdingSeries(Pr,a,h,R),sh:PERF.mode=='$'?(h.shares??0):1})}
 const s=combine(parts);$('#pchart').innerHTML=lineChart(s,PERF.mode,R=='1D');
 $('#ptable').innerHTML='<table><tr><th>Holding</th>'+['1D','1W','1M','3M','YTD','1Y','Max'].map(r=>`<th class="n">${r}</th>`).join('')+'</tr>'+d.accounts.flatMap(a=>a.holdings.map(h=>'<tr><td><b>'+esc(h.ticker)+'</b> <span class="muted small">'+esc(a.name)+'</span></td>'+['1D','1W','1M','3M','YTD','1Y','Max'].map(r=>{const q=holdingSeries(Pr,a,h,r);if(q.length<2)return '<td class="n muted">—</td>';const v=q.at(-1)[1]/q[0][1]-1;return `<td class="n ${v>=0?'up':'dn'}">${v>=0?'+':''}${(v*100).toFixed(2)}%</td>`}).join('')+'</tr>')).join('')+'</table>'}
function lineChart(s,mode,intra){if(s.length<2)return '<p class="muted">Not enough data for this range.</p>';if(s.length>500){const k=Math.ceil(s.length/500);s=s.filter((_,i)=>i%k==0||i==s.length-1)}
 const base=s[0][1],vals=s.map(p=>mode=='%'?(p[1]/base-1)*100:p[1]),W=900,H=300,pl=70,pr=12,pt=14,pb=28,mn=Math.min(...vals),mx=Math.max(...vals),sp=(mx-mn)||1,t0=s[0][0],t1=s.at(-1)[0];
 const X=t=>pl+(t-t0)/((t1-t0)||1)*(W-pl-pr),Y=v=>pt+(mx-v)/sp*(H-pt-pb),up=vals.at(-1)>=vals[0],col=up?'var(--up)':'var(--dn)';
 const fmtV=v=>mode=='%'?(v>=0?'+':'')+v.toFixed(2)+'%':(Math.abs(v)>=1e4?'$'+(v/1e3).toFixed(1)+'k':usd(v));
 const fd=t=>new Date(t).toLocaleString('en-US',intra?{timeZone:'America/Denver',hour:'numeric',minute:'2-digit'}:{month:'short',day:'numeric',year:'2-digit',timeZone:'UTC'});
 const path=s.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(vals[i]).toFixed(1)).join('');let g='';for(let i=0;i<=4;i++){const v=mn+sp*i/4;g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end">${fmtV(v)}</text>`}
 const chg=vals.at(-1)-vals[0],pct=(s.at(-1)[1]/base-1)*100;window._lc={s,vals,X,Y,fmtV,fd};
 return `<div class="perfhead"><span class="big">${mode=='%'?fmtV(vals.at(-1)):usd(vals.at(-1))}</span> <span class="${up?'up':'dn'}">${mode=='$'?(chg>=0?'+':'')+usd(chg)+' · ':''}${pct>=0?'+':''}${pct.toFixed(2)}%</span></div>
 <svg id="lc" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto"><defs><linearGradient id="gf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${up?'#3fb950':'#f85149'}" stop-opacity=".25"/><stop offset="1" stop-color="${up?'#3fb950':'#f85149'}" stop-opacity="0"/></linearGradient></defs>${g}
 <path d="${path}L${X(t1)} ${H-pb}L${X(t0)} ${H-pb}Z" fill="url(#gf)"/><path d="${path}" fill="none" stroke="${col}" stroke-width="2"/><text x="${pl}" y="${H-8}">${fd(t0)}</text><text x="${W-pr}" y="${H-8}" text-anchor="end">${fd(t1)}</text>
 <line id="hl" y1="${pt}" y2="${H-pb}" stroke="var(--mu)" stroke-dasharray="3" visibility="hidden"/><circle id="hc" r="4" fill="${col}" visibility="hidden"/><text id="ht" y="${pt+10}" visibility="hidden" style="fill:var(--tx);font-size:12px"></text></svg>`}
document.addEventListener('mousemove',e=>{const svg=e.target.closest&&e.target.closest('#lc');const L=window._lc;if(!svg||!L)return;const r=svg.getBoundingClientRect(),vx=(e.clientX-r.left)/r.width*900;
 let i=0,b=1e9;L.s.forEach((p,k)=>{const dd=Math.abs(L.X(p[0])-vx);if(dd<b){b=dd;i=k}});const x=L.X(L.s[i][0]),y=L.Y(L.vals[i]);
 const hl=svg.querySelector('#hl'),hc=svg.querySelector('#hc'),ht=svg.querySelector('#ht');[hl,hc,ht].forEach(n=>n.setAttribute('visibility','visible'));hl.setAttribute('x1',x);hl.setAttribute('x2',x);hc.setAttribute('cx',x);hc.setAttribute('cy',y);
 ht.setAttribute('x',Math.min(x+8,760));ht.textContent=L.fd(L.s[i][0])+'  '+L.fmtV(L.vals[i])});
document.addEventListener('change',e=>{if(e.target.id=='psel'){PERF.sel=e.target.value;drawPerf()}});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-range],[data-mode]');if(!b)return;if(b.dataset.range)PERF.range=b.dataset.range;if(b.dataset.mode)PERF.mode=b.dataset.mode;
 document.querySelectorAll('[data-range]').forEach(x=>x.classList.toggle('on',x.dataset.range==PERF.range));document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('on',x.dataset.mode==PERF.mode));drawPerf()});
document.addEventListener('click',async e=>{if(e.target.id!='save')return;const d=window._h;document.querySelectorAll('input[data-a]').forEach(i=>{const a=d.accounts[i.dataset.a];if(i.dataset.f)a.asOf=i.value;else if(i.dataset.s){const h=a.holdings[i.dataset.h],v=i.value===''?null:+i.value;if(v!==h.shares){h.shares=v;h.sharesEstimated=false}}else a.holdings[i.dataset.h].value=+i.value});
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
async function route(){const p=(location.hash.slice(1)||'overview');document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.p==p));try{$('#main').innerHTML=await (P[p]||P.overview)();if(p=='performance')drawPerf()}catch(e){console.error(e)}}
window.onhashchange=route;show(false);
