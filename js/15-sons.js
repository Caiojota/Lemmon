/* =====================================================================
   SONS — avisos sonoros (Web Audio API, sem arquivos externos)
   Liga/desliga em "Sons" no menu do avatar. Preferência salva por usuário.
   ===================================================================== */
const SOM = (function(){
  let ctx = null, destravado = false;
  const chave = ()=> "lemmon_sons_"+((typeof currentUser!=="undefined" && currentUser && currentUser.id) || "x");
  function ligado(){ try{ return localStorage.getItem(chave())!=="0"; }catch(e){ return true; } }
  function definir(v){ try{ localStorage.setItem(chave(), v?"1":"0"); }catch(e){} atualizarRotulo(); }
  function obterCtx(){
    if(!ctx){ const AC = window.AudioContext||window.webkitAudioContext; if(!AC) return null; try{ ctx = new AC(); }catch(e){ return null; } }
    if(ctx.state==="suspended"){ try{ ctx.resume(); }catch(e){} }
    return ctx;
  }
  // o navegador só libera áudio depois de um toque/clique do usuário
  ["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev, ()=>{ if(!destravado){ destravado = true; obterCtx(); } }, {passive:true}));
  // notas: [frequência Hz, início s, duração s, volume]
  function tocar(notas, tipo){
    if(!ligado()) return;
    const c = obterCtx(); if(!c || c.state!=="running") return;
    const t0 = c.currentTime + 0.02;
    notas.forEach(([f,ini,dur,vol])=>{
      const o = c.createOscillator(), g = c.createGain();
      o.type = tipo||"sine"; o.frequency.value = f;
      const v = vol||0.18;
      g.gain.setValueAtTime(0.0001, t0+ini);
      g.gain.exponentialRampToValueAtTime(v, t0+ini+0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+ini+dur);
      o.connect(g); g.connect(c.destination);
      o.start(t0+ini); o.stop(t0+ini+dur+0.05);
    });
  }
  const SONS = {
    notificacao: ()=>tocar([[988,0,.22],[1319,.16,.38]]),               // sino
    iniciar:     ()=>tocar([[523,0,.14],[659,.11,.14],[784,.22,.3]]),   // sobe
    pausar:      ()=>tocar([[784,0,.14],[523,.12,.3]]),                 // desce
    checkin:     ()=>tocar([[659,0,.14],[880,.12,.34]]),
    checkout:    ()=>tocar([[880,0,.14],[587,.12,.34]]),
    lembrete:    ()=>tocar([[880,0,.18],[880,.28,.18],[1175,.56,.4]]),
    alerta:      ()=>tocar([[330,0,.22,.2],[262,.24,.22,.2],[330,.48,.22,.2],[262,.72,.3,.2]],"triangle"),
    teste:       ()=>tocar([[784,0,.15],[988,.14,.15],[1319,.28,.34]])
  };
  function atualizarRotulo(){
    const el = document.getElementById("ud-sons-chk"); if(el) el.checked = ligado();
  }
  return {tocar:(n)=>{ try{ SONS[n] && SONS[n](); }catch(e){} }, ligado, definir, atualizarRotulo};
})();

// item "Sons" no menu do avatar (interruptor iOS)
(function(){
  const dd = document.getElementById("user-dropdown"); if(!dd || document.getElementById("ud-sons")) return;
  const d = document.createElement("div");
  d.className = "ud-item ud-sons"; d.id = "ud-sons"; d.setAttribute("role","menuitem");
  d.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg><span style="flex:1;">Sons</span><input type="checkbox" class="ios-toggle" id="ud-sons-chk" aria-label="Sons">';
  dd.insertBefore(d, dd.firstChild);
  const chk = d.querySelector("input");
  chk.addEventListener("click", e=>e.stopPropagation());
  chk.addEventListener("change", ()=>{ SOM.definir(chk.checked); if(chk.checked) SOM.tocar("teste"); });
  d.addEventListener("click", e=>{ if(e.target!==chk){ chk.checked = !chk.checked; chk.dispatchEvent(new Event("change")); } e.stopPropagation(); });
  SOM.atualizarRotulo();
})();

// som automático conforme o aviso mostrado na tela
(function(){
  const orig = window.mostrarToast;
  if(typeof orig!=="function") return;
  window.mostrarToast = function(msg){
    try{
      const m = String(msg||"");
      if(/^Você tem \d+ notificaç/.test(m)) SOM.tocar("notificacao");
      else if(/^Cronômetro iniciado/.test(m)) SOM.tocar("iniciar");
      else if(/^Cronômetro pausado/.test(m)) SOM.tocar("pausar");
      else if(/^Check-in registrado/.test(m)) SOM.tocar("checkin");
      else if(/^Check-out registrado/.test(m)) SOM.tocar("checkout");
    }catch(e){}
    return orig.apply(this, arguments);
  };
  try{ mostrarToast = window.mostrarToast; }catch(e){}
})();

// lembretes: eventos/reuniões em até 10 min e demandas vencendo
const LEMBRETES = (function(){
  const avisados = new Set();
  const pad = n=>String(n).padStart(2,"0");
  const isoHoje = d=> d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  function minutosAte(dataIso, hhmm){
    if(!dataIso || !hhmm) return null;
    const [h,mi] = hhmm.split(":").map(Number);
    const [a,me,di] = dataIso.split("-").map(Number);
    return (new Date(a,me-1,di,h,mi,0).getTime() - Date.now())/60000;
  }
  function verificar(){
    if(typeof currentUser==="undefined" || !currentUser) return;
    const hoje = isoHoje(new Date());
    const msgs = [];
    try{
      (CAL_EVENTOS||[]).forEach(e=>{
        if(e.diaInteiro || !e.horaInicio || e.dataInicio!==hoje || e.usuarioId!==currentUser.id) return;
        if(e.tipo==="Bloqueio") return;
        const m = minutosAte(e.dataInicio, e.horaInicio);
        const k = "ev"+e.id+hoje+e.horaInicio;
        if(m!==null && m>0 && m<=10 && !avisados.has(k)){ avisados.add(k); msgs.push("Em "+Math.ceil(m)+" min: "+(e.titulo||"Evento")+" ("+e.horaInicio+")"); }
      });
      (REUNIOES||[]).forEach(r=>{
        if(r.status==="Cancelada" || r.data!==hoje || !r.horaInicio || !(r.participantes||[]).includes(currentUser.id)) return;
        const m = minutosAte(r.data, r.horaInicio);
        const k = "re"+r.id+hoje+r.horaInicio;
        if(m!==null && m>0 && m<=10 && !avisados.has(k)){ avisados.add(k); msgs.push("Reunião em "+Math.ceil(m)+" min: "+(r.titulo||"Reunião")+" ("+r.horaInicio+")"); }
      });
    }catch(e){ console.error("[lembretes]", e); }
    if(msgs.length){ SOM.tocar("lembrete"); mostrarToast(msgs[0]+(msgs.length>1?" (+"+(msgs.length-1)+")":"")); }
  }
  // demandas minhas, não entregues, vencendo hoje/amanhã ou atrasadas — 1 aviso por demanda por dia
  function verificarDemandas(){
    if(typeof currentUser==="undefined" || !currentUser) return;
    try{
      const hoje = isoHoje(new Date()), am = new Date(); am.setDate(am.getDate()+1);
      const amanha = isoHoje(am);
      let ch = "lemmon_dem_aviso_"+currentUser.id+"_"+hoje, ja = [];
      try{ ja = JSON.parse(localStorage.getItem(ch)||"[]"); }catch(e){}
      const novas = (DEMANDAS||[]).filter(d=>d.responsavelUsuarioId===currentUser.id && !d.entregueEm && d.dataLimite && d.dataLimite<=amanha && !ja.includes(d.id));
      if(!novas.length) return;
      const atrasadas = novas.filter(d=>d.dataLimite<hoje).length;
      try{ localStorage.setItem(ch, JSON.stringify(ja.concat(novas.map(d=>d.id)))); }catch(e){}
      SOM.tocar("alerta");
      mostrarToast(novas.length+" demanda"+(novas.length>1?"s":"")+" "+(atrasadas?"vencendo ou atrasada"+(novas.length>1?"s":"")+" ("+atrasadas+" já vencida"+(atrasadas>1?"s":"")+")":"vencendo até amanhã")+".");
    }catch(e){ console.error("[lembretes demandas]", e); }
  }
  setInterval(verificar, 30000);
  setInterval(verificarDemandas, 300000);
  setTimeout(verificarDemandas, 8000);
  return {verificar, verificarDemandas};
})();
