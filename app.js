(function(){
  const STATUSES = [
    {k:"new",    label:"חדש",        color:"var(--s-new)"},
    {k:"like",   label:"מעניין",     color:"var(--s-like)"},
    {k:"called", label:"התקשרנו",    color:"var(--s-called)"},
    {k:"tour",   label:"קבענו סיור", color:"var(--s-tour)"},
    {k:"no",     label:"פסול",       color:"var(--s-no)"},
  ];
  const ST = Object.fromEntries(STATUSES.map(s=>[s.k,s]));
  const TYPE_LABEL = {house:"בית פרטי", cottage:"קוטג׳", semi:"דו־משפחתי", farm:"משק / נחלה", farmunit:"יחידה במשק"};
  const SRC_LABEL = {yad2:"יד2", madlan:"מדלן"};

  // Fallback coordinates for when a listing has none
  const PLACES = {
    "נתניה":[32.321,34.853],"רעננה":[32.184,34.871],"כפר סבא":[32.178,34.907],"הרצליה":[32.166,34.843],"חדרה":[32.437,34.919],
    "כפר יונה":[32.316,34.935],"אבן יהודה":[32.270,34.888],"קדימה צורן":[32.279,34.915],"קדימה-צורן":[32.279,34.915],"תל מונד":[32.250,34.917],"פרדסיה":[32.306,34.909],
    "בת חפר":[32.338,35.013],"כפר ויתקין":[32.383,34.877],"מכמורת":[32.406,34.873],"חופית":[32.384,34.864],"בית ינאי":[32.389,34.864],
    "אביחיל":[32.345,34.873],"בית יצחק":[32.333,34.888],"בית יצחק-שער חפר":[32.333,34.888],"חרב לאת":[32.359,34.893],"גבעת שפירא":[32.345,34.899],
    "כפר חיים":[32.355,34.900],"עין ורד":[32.268,34.931],"בית יהושע":[32.258,34.861],"אחיטוב":[32.394,34.980],"בורגתה":[32.369,34.950],
    "חגור":[32.135,34.963],"צור משה":[32.293,34.913],"שער אפרים":[32.255,34.966],"נורדיה":[32.313,34.889],"תנובות":[32.304,34.960],
    "בני דרור":[32.258,34.900],"משמר השרון":[32.358,34.917],"גאולי תימן":[32.371,34.944],"עולש":[32.337,34.959],"חניאל":[32.354,34.940],
    "כפר הס":[32.244,34.946],"כפר יעבץ":[32.229,34.965],"ניצני עוז":[32.312,35.003],"כפר מונש":[32.355,34.966],"עין החורש":[32.380,34.940],
    "גן יאשיה":[32.324,34.983],"אומץ":[32.342,34.986],"בחן":[32.363,35.001],"יכון":[32.360,35.020],"עמק חפר":[32.36,34.93],
    "כפר מל״ל":[32.163,34.898],"כפר מלל":[32.163,34.898],"צופית":[32.198,34.902],"שדה ורבורג":[32.199,34.888],"גן חיים":[32.193,34.917],
    "רמות השבים":[32.169,34.882],"נווה ירק":[32.145,34.932],"כפר הדר":[32.226,34.940],"ינוב":[32.296,34.943],"גבעת חיים":[32.395,34.932],
    "בצרה":[32.212,34.869],"שער חפר":[32.333,34.888],"חיבת ציון":[32.384,34.914],"כפר הרא״ה":[32.391,34.911],"כפר הרא\"ה":[32.391,34.911],
    "קלנסווה":[32.285,34.983],
    "הוד השרון":[32.150,34.890],"אלישמע":[32.165,34.919],"גבעת חן":[32.168,34.876],"גני עם":[32.160,34.913],"עדנים":[32.165,34.930],
    "ירקונה":[32.144,34.925],"נווה ימין":[32.169,34.938],"כפר סבא":[32.178,34.907]
  };
  const MAPC = (window.HOUSES_CONFIG||{}).map || null;
  const BOX = (MAPC&&MAPC.box) || {latN:32.47, latS:32.12, lngW:34.78, lngE:35.06, w:300, h:470};

  let canWrite=true;
  let listings=[], marks={}, scanMeta=null;
  let gotListings=false, gotMarks=false;
  let state = {tab:"list", filter:"active", sort:"new", mapSel:null};
  try{ const s=JSON.parse(localStorage.getItem("hm_state")||"{}"); Object.assign(state,s); state.mapSel=null; }catch(e){}
  const save=()=>{ try{ localStorage.setItem("hm_state",JSON.stringify({tab:state.tab,filter:state.filter,sort:state.sort})); }catch(e){} };

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt=n=>Number(n).toLocaleString("he-IL");
  const dayMs=864e5;
  function ago(iso){
    if(!iso) return "";
    const d=new Date(iso); if(isNaN(d)) return "";
    const days=Math.floor((Date.now()-d)/dayMs);
    if(days<=0) return "היום"; if(days===1) return "אתמול"; if(days<7) return `לפני ${days} ימים`;
    return d.toLocaleDateString("he-IL",{day:"numeric",month:"numeric"});
  }
  function toast(t){ const el=$("toast"); el.textContent=t; el.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove("show"),2200); }

  const statusOf=l=> (marks[l.id]&&marks[l.id].status)||"new";
  const GREEN=(window.HOUSES_CONFIG||{}).greenMax||10000, ORANGE=(window.HOUSES_CONFIG||{}).orangeMax||10500;
  const PRIO=new Set(((window.HOUSES_CONFIG||{}).priority||{}).settlements||[]), PRIO_LABEL=((window.HOUSES_CONFIG||{}).priority||{}).label||"";
  const isPrio=l=> PRIO.size>0 && PRIO.has((l.settlement||"").trim());
  const tier=l=> (l.price==null||l.price===""||!(l.price>0))?"gray": (l.price<=GREEN?"green":(l.price<=ORANGE?"orange":"over"));
  const isGone=l=> l.lastSeen && (Date.now()-new Date(l.lastSeen))>7*dayMs;
  const isFresh=l=> !marks[l.id] && l.firstSeen && (Date.now()-new Date(l.firstSeen))<3*dayMs;

  function visible(){
    let a=listings.filter(l=>tier(l)!=="over");
    const f=state.filter;
    if(f==="active") a=a.filter(l=>statusOf(l)!=="no");
    else a=a.filter(l=>statusOf(l)===f);
    const s=state.sort;
    a.sort((x,y)=>{
      if(PRIO.size){ const d=(isPrio(y)?1:0)-(isPrio(x)?1:0); if(d) return d; }
      if(s==="price"){ const px=x.price>0?x.price:1e9, py=y.price>0?y.price:1e9; return px-py; }
      if(s==="rooms"){ return (y.rooms||0)-(x.rooms||0); }
      return String(y.firstSeen||"").localeCompare(String(x.firstSeen||""));
    });
    return a;
  }

  function renderScan(){
    const el=$("scan");
    if(!scanMeta){ el.innerHTML=`<span class="pill">עדיין לא בוצעה סריקה · הסריקה היומית רצה בסביבות 21:00</span>`; return; }
    const last=scanMeta.lastSuccess?new Date(scanMeta.lastSuccess):null;
    const stale= last && (Date.now()-last)>36*36e5;
    let h=`<span class="pill ${stale?"warn":""}">סריקה אחרונה: <b>${last?last.toLocaleString("he-IL",{weekday:"short",day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}</b></span>`;
    if(typeof scanMeta.lastNew==="number") h+=`<span class="pill">חדשות בסריקה: <b>${scanMeta.lastNew}</b></span>`;
    if(stale) h+=`<span class="pill warn">לא הייתה סריקה מעל יום וחצי — כנראה שהמחשב היה כבוי</span>`;
    el.innerHTML=h;
  }

  function renderFilters(){
    const base=listings.filter(l=>tier(l)!=="over");
    const cnt=k=> k==="active"? base.filter(l=>statusOf(l)!=="no").length : base.filter(l=>statusOf(l)===k).length;
    const opts=[{k:"active",label:"כל הפעילות"},...STATUSES.map(s=>({k:s.k,label:s.k==="no"?"פסולות":s.label}))];
    $("filters").innerHTML=opts.map(o=>`<button class="chip" data-f="${o.k}" aria-pressed="${state.filter===o.k}">${o.label}<span class="n">${cnt(o.k)}</span></button>`).join("");
  }

  function cardHTML(l){
    const st=statusOf(l), t=tier(l), m=marks[l.id]||{};
    const priceH = t==="gray" ? `<span class="price p-gray">לא צוין מחיר</span>` : `<span class="price p-${t}">${fmt(l.price)} ₪</span>`;
    const facts=[];
    if(l.rooms) facts.push(`<span>🛏️ ${l.rooms} חדרים</span>`);
    if(l.sqm) facts.push(`<span>📐 ${l.sqm} מ״ר</span>`);
    if(l.lot) facts.push(`<span>🌳 מגרש ${fmt(l.lot)} מ״ר</span>`);
    if(l.entry) facts.push(`<span>📅 כניסה: ${esc(l.entry)}</span>`);
    const tags=[];
    if(isFresh(l)) tags.push(`<span class="tag new">חדש</span>`);
    if(isPrio(l)) tags.push(`<span class="tag prio">${esc(PRIO_LABEL)}</span>`);
    tags.push(`<span class="tag">${esc(TYPE_LABEL[l.type]||l.typeText||"בית")}</span>`);
    (l.sources||[l.source]).filter(Boolean).forEach(s=>tags.push(`<span class="tag src">${esc(SRC_LABEL[s]||s)}</span>`));
    if(l.broker===false) tags.push(`<span class="tag">פרטי</span>`); else if(l.broker===true) tags.push(`<span class="tag">תיווך</span>`);
    if(l.price>0 && l.price<4000) tags.push(`<span class="tag gone">מחיר נמוך חשוד — אולי חדר בשותפות</span>`);
    if(t==="orange") tags.push(`<span class="tag" style="background:var(--orange-bg);color:var(--orange)">מעל המועדף</span>`);
    if(isGone(l)) tags.push(`<span class="tag gone">לא נראתה בשבוע האחרון — ייתכן שהוסרה</span>`);
    const btns=STATUSES.map(s=>`<button class="st" data-id="${esc(l.id)}" data-s="${s.k}" aria-pressed="${st===s.k}" ${st===s.k?`style="background:${s.color}"`:""} ${canWrite?"":"disabled"}>${s.label}</button>`).join("");
    const by = m.at ? `<span>נמצאה ${ago(l.firstSeen)} · עודכן ${ago(m.at)}</span>` : `<span>נמצאה ${ago(l.firstSeen)}</span>`;
    const url = (l.urls && l.urls[0]) || l.url;
    return `<article class="card" data-card="${esc(l.id)}">
      <div class="stripe" style="background:${ST[st].color}"></div>
      <div class="body">
        <div class="top">
          <div><div class="place">${esc(l.settlement||"")}</div><div class="addr">${esc(l.address||l.title||"")}</div></div>
          ${priceH}
        </div>
        <div class="facts">${facts.join("")}</div>
        <div class="tags">${tags.join("")}</div>
        <div class="actions">
          <div class="statuses">${btns}</div>
          <textarea class="note" data-note="${esc(l.id)}" placeholder="הערה (טלפון, מה אמרו, מתי סיור…)" ${canWrite?"":"disabled"}>${esc(m.note||"")}</textarea>
          <div class="meta">${by}${url?`<a class="open" href="${esc(url)}" target="_blank" rel="noopener">לפתיחת המודעה ←</a>`:""}</div>
        </div>
      </div></article>`;
  }

  function renderList(){
    const a=visible();
    $("count").textContent = `${a.length} מודעות`;
    if(!listings.length){
      $("list").innerHTML=`<div class="empty"><b>עדיין אין מודעות בלוח</b>הסריקה רצה כל ערב בסביבות 21:00 ומוסיפה לכאן כל בית שעומד בקריטריונים.</div>`;
      return;
    }
    $("list").innerHTML = a.length ? a.map(cardHTML).join("") : `<div class="empty">אין מודעות בסינון הזה.</div>`;
    resolveNames();
  }

  function coordOf(l){
    if(typeof l.lat==="number" && typeof l.lng==="number") return [l.lat,l.lng];
    const key=(l.settlement||"").replace(/\s+/g," ").trim();
    return PLACES[key]||PLACES[key.replace(/[״"]/g,"")]||null;
  }

  function renderMap(){
    const svg=$("map");
    const coast=[[32.47,34.888],[32.43,34.878],[32.40,34.870],[32.36,34.858],[32.33,34.845],[32.30,34.834],[32.26,34.822],[32.22,34.810],[32.18,34.800],[32.12,34.783]];
    // geographic orientation: west (sea) on the left
    const P=(lat,lng)=>{ const x=(lng-BOX.lngW)/(BOX.lngE-BOX.lngW)*BOX.w, y=(BOX.latN-lat)/(BOX.latN-BOX.latS)*BOX.h; return [x,y]; };
    const cp2=coast.map(c=>P(c[0],c[1]));
    const seaPath=`M0,0 L${cp2.map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" L")} L0,${BOX.h} Z`;
    const towns=[["נתניה",32.321,34.853],["רעננה",32.184,34.871],["כפר סבא",32.178,34.907],["חדרה",32.437,34.919],["כפר יונה",32.316,34.935],["אבן יהודה",32.270,34.888],["קדימה צורן",32.279,34.915],["תל מונד",32.250,34.917],["פרדסיה",32.306,34.909],["הרצליה",32.166,34.843],["הוד השרון",32.150,34.890]];
    let h=`<rect x="0" y="0" width="${BOX.w}" height="${BOX.h}" fill="#eef3e6"/>`;
    if(MAPC){
      if(MAPC.polygon){ const pp=MAPC.polygon.map(c=>P(c[0],c[1]).map(v=>v.toFixed(1)).join(",")).join(" "); h+=`<polygon points="${pp}" fill="#dcefd9" stroke="#3aa655" stroke-width="2.5" stroke-linejoin="round"/>`; }
      (MAPC.lines||[]).forEach(l=>{ const pts=l.points.map(c=>P(c[0],c[1]).map(v=>v.toFixed(1)).join(",")).join(" "); h+=`<polyline points="${pts}" fill="none" stroke="#b9bfba" stroke-width="5" stroke-linecap="round"/>`; if(l.label){ const [lx,ly]=P(l.label[1],l.label[2]); h+=`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="10" fill="#7d857f" text-anchor="middle">${l.label[0]}</text>`; } });
      (MAPC.landmarks||[]).forEach(([n,la,ln])=>{ const [x,y]=P(la,ln); h+=`<rect x="${(x-3).toFixed(1)}" y="${(y-3).toFixed(1)}" width="6" height="6" fill="#9aa39e"/><text x="${x.toFixed(1)}" y="${(y+15).toFixed(1)}" font-size="10.5" fill="#5f6964" text-anchor="middle">${n}</text>`; });
    } else {
    h+=`<path d="${seaPath}" fill="#cfe3ef"/>`;
    h+=`<text x="14" y="${BOX.h/2}" fill="#7aa3bd" font-size="12" font-weight="700" transform="rotate(-78 14 ${BOX.h/2})">הים התיכון</text>`;
    towns.forEach(([n,la,ln])=>{ const [x,y]=P(la,ln); h+=`<rect x="${(x-3).toFixed(1)}" y="${(y-3).toFixed(1)}" width="6" height="6" fill="#9aa39e"/><text x="${x.toFixed(1)}" y="${(y+15).toFixed(1)}" font-size="10.5" fill="#5f6964" text-anchor="middle">${n}</text>`; });
    }
    const a=visible().map(l=>({l,c:coordOf(l)})).filter(o=>o.c);
    // spread dots that share a spot
    const seen={};
    a.forEach(({l,c})=>{
      let [x,y]=P(c[0],c[1]); const k=Math.round(x/4)+":"+Math.round(y/4); const i=seen[k]=(seen[k]||0)+1;
      if(i>1){ const ang=i*2.1, r=5+i*1.2; x+=Math.cos(ang)*r; y+=Math.sin(ang)*r; }
      const t=tier(l), col=t==="green"?"#2e7d4f":t==="orange"?"#c46a12":"#7b817d";
      const sel=state.mapSel===l.id;
      h+=`<circle data-pin="${esc(l.id)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${sel?8.5:6.5}" fill="${col}" stroke="#fff" stroke-width="${sel?3:2}" style="cursor:pointer"/>`;
    });
    svg.innerHTML=h;
    const sel=listings.find(l=>l.id===state.mapSel);
    $("mapPick").innerHTML = sel ? cardHTML(sel) : (a.length?`<div class="empty">הקישו על נקודה כדי לראות את המודעה.</div>`:"");
    resolveNames();
  }

  function resolveNames(){}

  function render(){
    renderScan(); renderFilters();
    $("tabList").setAttribute("aria-selected",state.tab==="list"); $("tabMap").setAttribute("aria-selected",state.tab==="map");
    $("viewList").classList.toggle("hidden",state.tab!=="list"); $("viewMap").classList.toggle("hidden",state.tab!=="map");
    $("sort").value=state.sort;
    if(state.tab==="list") renderList(); else { $("count").textContent=`${visible().length} מודעות`; renderMap(); }
  }

  // events
  $("tabList").onclick=()=>{state.tab="list";save();render();};
  $("tabMap").onclick=()=>{state.tab="map";save();render();};
  $("sort").onchange=e=>{state.sort=e.target.value;save();render();};
  $("filters").onclick=e=>{const b=e.target.closest("[data-f]"); if(!b) return; state.filter=b.dataset.f; save(); render();};
  $("map").addEventListener("click",e=>{const c=e.target.closest("[data-pin]"); if(!c) return; state.mapSel=c.dataset.pin; renderMap();});

  // Firebase REST (no SDK)
  const FB = (window.HOUSES_CONFIG && window.HOUSES_CONFIG.firebaseUrl || "").replace(/\/+$/,"");
  const C = window.HOUSES_CONFIG || {};
  const ROOT = C.root || "/houses";
  async function fb(path, opts={}){
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),8000);
    try{
      const r=await fetch(`${FB}${ROOT}${path}.json`,{...opts,signal:ctrl.signal,headers:opts.body?{"Content-Type":"application/json"}:undefined});
      if(!r.ok) throw new Error("HTTP_"+r.status);
      return opts.method ? null : r.json();
    } finally { clearTimeout(t); }
  }
  async function writeMark(id, patch){
    if(!FB){ toast("הלוח עוד לא מחובר למסד הנתונים"); return; }
    try{
      // PUT at leaf paths so two people editing different fields never overwrite each other
      for(const [k,v] of Object.entries(patch)) await fb(`/marks/${id}/${k}`,{method:"PUT",body:JSON.stringify(v)});
      await fb(`/marks/${id}/at`,{method:"PUT",body:JSON.stringify(new Date().toISOString())});
      toast("נשמר");
    }catch(e){ toast("השמירה נכשלה — בדקו חיבור ונסו שוב"); }
  }
  document.addEventListener("click",e=>{
    const b=e.target.closest(".st"); if(!b||b.disabled) return;
    const id=b.dataset.id, s=b.dataset.s;
    if(statusOf({id})===s) return;
    marks[id]={...(marks[id]||{}),status:s}; render();
    writeMark(id,{status:s});
  });
  document.addEventListener("focusout",e=>{
    const t=e.target; if(!t.matches||!t.matches("textarea[data-note]")) return;
    const id=t.dataset.note, v=t.value.trim();
    if((marks[id]&&marks[id].note||"")===v) return;
    marks[id]={...(marks[id]||{}),note:v};
    writeMark(id,{note:v});
  });

  render();

  // data: poll every 20 seconds
  let failures=0;
  async function load(){
    if(!FB){ $("scan").innerHTML=`<span class="pill warn">הלוח עוד לא מחובר למסד הנתונים</span>`; return; }
    try{
      const d=await fb("")||{};
      listings=Object.entries(d.listings||{}).map(([id,v])=>({id,...v}));
      const a=document.activeElement, typing=a&&a.matches&&a.matches("textarea[data-note]");
      marks=d.marks||{}; scanMeta=(d.meta&&d.meta.scan)||null; gotListings=true; failures=0;
      if(typing) { renderScan(); return; }
      render();
    }catch(e){
      failures++;
      if(!gotListings||failures>2) $("scan").innerHTML=`<span class="pill warn">לא מצליח להגיע לנתונים כרגע — מנסה שוב…</span>`;
    }
  }
  load(); setInterval(()=>{ if(!document.hidden) load(); },20000);
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) load(); });
})();
