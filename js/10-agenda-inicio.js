/* =====================================================================
   6B) AGENDA — VISITAS DA EQUIPE, CHECK-IN/OUT, APROVAÇÃO E EXPORTAÇÃO
   ===================================================================== */
let AGENDA = [];
let AGENDA_MOTIVOS = [];
let proxIdAgenda = 1;
let semanaAgendaOffset = 0;
let mesAgendaOffset = 0;

function podeAprovarAgenda(user){ return !!user && (user.perfil==="Administrador" || user.perfil==="Coordenador"); }

function initAgenda(){
  popularSelectUnidadeAgenda();
  popularMotivosAgenda();
  atualizarSelecaoAgenda();
  renderInicio();
  renderGradeSemanal();
  renderGradeMensal();
}
// Cada dia marcado tem uma ou mais entradas {unidade, periodo, motivos[]}: a unidade, o período e as atividades principais daquele dia
let agDiasConfig = {};
function popularMotivosAgenda(){ renderChipsDiasAgenda(); }
function agUnidadePadrao(){ const el = document.getElementById("ag-unidade"); return el ? el.value : ""; }
function agPeriodoPadrao(){ const el = document.getElementById("ag-periodo"); return (el && el.value) || "Manhã"; }
function agGarantirConfigDia(iso){
  if(agDiasConfig[iso]) return;
  const outro = Object.keys(agDiasConfig).sort()[0];
  agDiasConfig[iso] = outro ? JSON.parse(JSON.stringify(agDiasConfig[outro])) : [{unidade:agUnidadePadrao(), periodo:agPeriodoPadrao(), motivos:[]}];
}
// um único cartão de atividades vale para todos os dias marcados: edita o do 1º dia e replica nos demais
function agSincronizarDias(){
  const dias = [...agDiasSelecionados].sort(); if(dias.length<2) return;
  const modelo = JSON.stringify(agDiasConfig[dias[0]]||[]);
  dias.slice(1).forEach(iso=>{ agDiasConfig[iso] = JSON.parse(modelo); });
}
function agSetEntrada(iso, i, campo, valor){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const e = agDiasConfig[iso] && agDiasConfig[iso][i]; if(!e) return;
  e[campo] = valor;
  renderChipsDiasAgenda();
}
function agAddMotivo(iso, i, valor){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const e = agDiasConfig[iso] && agDiasConfig[iso][i]; if(!e || !valor) return;
  if(!e.motivos.includes(valor)) e.motivos.push(valor);
  renderChipsDiasAgenda();
}
function agRemoverMotivo(iso, i, k){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const e = agDiasConfig[iso] && agDiasConfig[iso][i]; if(!e) return;
  e.motivos.splice(k,1); renderChipsDiasAgenda();
}
function agNovaEntrada(iso){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const lista = agDiasConfig[iso]; if(!lista) return;
  const usados = lista.map(e=>e.periodo);
  const periodo = usados.includes("Manhã") ? (usados.includes("Tarde") ? "Manhã" : "Tarde") : "Manhã";
  lista.push({unidade:agUnidadePadrao(), periodo, motivos:[]});
  renderChipsDiasAgenda();
}
function agRemoverEntrada(iso, i){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const lista = agDiasConfig[iso]; if(!lista || lista.length<2) return;
  lista.splice(i,1); renderChipsDiasAgenda();
}
function agCopiarPrimeiroDia(){
  const dias = [...agDiasSelecionados].sort();
  if(dias.length<2) return;
  const modelo = JSON.parse(JSON.stringify(agDiasConfig[dias[0]]||[]));
  dias.slice(1).forEach(iso=>{ agDiasConfig[iso] = JSON.parse(JSON.stringify(modelo)); });
  renderChipsDiasAgenda();
  mostrarToast("Atividades do primeiro dia copiadas para os demais.");
}
/* ---- Local de trabalho / tipos principais de atividade / modal ---- */
const LOCAIS_TRABALHO = ["VILA ABRANTES","DUAL SAÚDE","CD PAVUNA","HOME OFFICE"];
const TIPOS_ATIVIDADE_PRINCIPAIS = ["ADMINISTRATIVO","REUNIÃO","VISITA","AUDITORIA","ATENDIMENTO"];
function normTxt(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
function locaisTrabalhoAgenda(){
  const nomes = UNIDADES.map(u=>u.nome);
  return LOCAIS_TRABALHO.map(l=>nomes.find(n=>normTxt(n)===normTxt(l)) || l);
}
function unidadesAgendaOpcoes(){
  const locais = locaisTrabalhoAgenda();
  return [...locais, ...UNIDADES.map(u=>u.nome).filter(n=>!locais.includes(n))];
}
function agTiposAtividade(){
  const base = TIPOS_ATIVIDADE_PRINCIPAIS.slice(), chaves = new Set(base.map(normTxt));
  AGENDA_MOTIVOS.slice().sort((a,b)=>a.ordem-b.ordem).forEach(m=>{ if(!chaves.has(normTxt(m.valor))){ chaves.add(normTxt(m.valor)); base.push(m.valor); } });
  return base;
}
function renderLocaisTrabalhoAgenda(){
  const box = document.getElementById("ag-locais"); if(!box) return;
  const atual = agUnidadePadrao();
  box.innerHTML = locaisTrabalhoAgenda().map(n=>`<button type="button" class="sw-btn ${n===atual?"ativo sw-aprovado":""}" data-l="${escHtml(n)}" onclick="agSetLocal(this.dataset.l)">${escHtml(n)}</button>`).join("");
}
function agAplicarUnidadeTodos(){
  const u = agUnidadePadrao();
  Object.values(agDiasConfig).forEach(lista=>lista.forEach(e=>{ e.unidade = u; }));
}
function agSetLocal(nome){
  const sel = document.getElementById("ag-unidade"); if(sel) sel.value = nome;
  agAplicarUnidadeTodos();
  renderLocaisTrabalhoAgenda(); renderChipsDiasAgenda(); mostrarUltimaVisitaUnidade();
}
function agAoMudarUnidade(){ agAplicarUnidadeTodos(); renderLocaisTrabalhoAgenda(); renderChipsDiasAgenda(); mostrarUltimaVisitaUnidade(); }
// Visita OU Local de trabalho: ao escolher um, os campos do outro somem
function agSetTipoAgenda(t){
  agTipoAgenda = t==="local" ? "local" : "visita";
  const local = agTipoAgenda==="local";
  document.querySelectorAll("#ag-tipo-sw .sw-btn").forEach(b=>{ const at = b.dataset.t===agTipoAgenda; b.classList.toggle("ativo", at); b.classList.toggle("sw-aprovado", at); });
  document.getElementById("ag-bloco-local").style.display = local ? "" : "none";
  document.getElementById("ag-bloco-unidade").style.display = local ? "none" : "";
  const sel = document.getElementById("ag-unidade"); if(sel) sel.value = "";
  popularSelectUnidadeAgenda();
  agAplicarUnidadeTodos();
  renderLocaisTrabalhoAgenda(); renderChipsDiasAgenda(); mostrarUltimaVisitaUnidade();
}
function agAlvoVisita(){
  const el = document.getElementById("ag-quem");
  if(el && el.value && ehAdminOuCoordenador()){ const u = USUARIOS.find(x=>x.id===el.value); if(u) return u; }
  return currentUser;
}

/* ---- seletor de pessoas só com avatar (foto ou iniciais) ---- */
function avFaceHtml(u){
  if(u.foto) return `<img class="av-face" src="${u.foto}" alt="">`;
  return `<span class="av-face" style="background:${corAvatarPorNome(u.nome)};">${escHtml(iniciaisTexto(u.nome))}</span>`;
}
function avPickerHtml(users, cls, tipo, nomeGrupo, marcadoFn, desabilitado){
  return users.map(u=>{
    const rot = u.id===currentUser.id ? u.nome+" (eu)" : u.nome;
    return `<label class="av-pick" title="${escHtml(rot)}"><input type="${tipo}" class="${cls}" ${nomeGrupo?`name="${nomeGrupo}"`:""} value="${u.id}" ${marcadoFn(u)?"checked":""} ${desabilitado?"disabled":""}>${avFaceHtml(u)}<i class="av-ok">✓</i></label>`;
  }).join("");
}
function avPickerNomes(boxId, nomeId){
  const box = document.getElementById(boxId), el = document.getElementById(nomeId); if(!box || !el) return;
  const nomes = [...box.querySelectorAll("input:checked")].map(i=>{ const u = USUARIOS.find(x=>x.id===i.value); return u ? primeiroNomeAgenda(u.nome) : ""; }).filter(Boolean);
  el.textContent = nomes.length ? nomes.join(", ") : "Ninguém selecionado";
}
document.addEventListener("change", e=>{
  const box = e.target.closest && e.target.closest(".av-picker"); if(!box) return;
  avPickerNomes(box.id, box.id.replace(/-lista$|-av$/, "-nome").replace(/^(ag-quem)-nome$/, "ag-quem-nome"));
});
function preencherQuemVisita(){
  const campo = document.getElementById("ag-campo-quem"), sel = document.getElementById("ag-quem");
  if(!campo || !sel) return;
  if(!ehAdminOuCoordenador()){ campo.style.display = "none"; sel.innerHTML = ""; return; }
  campo.style.display = "";
  const us = usuariosAtivosOrdenados();
  sel.innerHTML = us.map(u=>`<option value="${u.id}">${escHtml(u.id===currentUser.id ? u.nome+" (eu)" : u.nome)}</option>`).join("");
  sel.value = currentUser.id;
  sel.onchange = ()=>atualizarSelecaoAgenda();
  const box = document.getElementById("ag-quem-av");
  box.innerHTML = avPickerHtml(us, "ag-q", "radio", "ag-q-grupo", u=>u.id===currentUser.id, false);
  box.querySelectorAll("input").forEach(r=>r.addEventListener("change", ()=>{ sel.value = r.value; sel.onchange(); }));
  avPickerNomes("ag-quem-av","ag-quem-nome");
}
function abrirModalVisitaAgenda(iso){
  if(!currentUser || !(currentUser.modulos||[]).includes("agenda")){ mostrarToast("Você não tem acesso ao agendamento de visitas."); return; }
  agTipoAgenda = "visita"; agDiasConfig = {}; agMotivosBase = []; agExtras = []; agMenuTipoAberto = null; { const dd = document.getElementById("ag-descricao"); if(dd) dd.value = ""; }
  const _sel = document.getElementById("ag-unidade"); if(_sel) _sel.value = "";
  popularSelectUnidadeAgenda();
  preencherQuemVisita();
  document.querySelectorAll("#ag-tipo-sw .sw-btn").forEach(b=>{ const at = b.dataset.t==="visita"; b.classList.toggle("ativo", at); b.classList.toggle("sw-aprovado", at); });
  document.getElementById("ag-bloco-local").style.display = "none"; document.getElementById("ag-bloco-unidade").style.display = "";
  const oc = document.getElementById("ag-oculto"); if(oc) oc.checked = false;
  if(iso){ const g = new Date(iso+"T00:00:00").getDay(); if(g!==0 && g!==6) agDiasSelecionados.add(iso); }
  renderLocaisTrabalhoAgenda();
  atualizarSelecaoAgenda();
  mostrarUltimaVisitaUnidade();
  document.getElementById("modal-visita").style.display = "flex";
}
function fecharModalVisitaAgenda(){ const m = document.getElementById("modal-visita"); if(m) m.style.display = "none"; }
function popularSelectUnidadeAgenda(){
  const sel = document.getElementById("ag-unidade");
  if(!sel) return;
  const atual = sel.value;
  const locais = locaisTrabalhoAgenda();
  const lista = agTipoAgenda==="local" ? locais : UNIDADES.map(u=>u.nome).filter(n=>!locais.includes(n));
  sel.innerHTML = '<option value="">Selecione...</option>' + lista.map(n=>`<option>${escHtml(n)}</option>`).join("");
  sel.value = lista.includes(atual) ? atual : "";
}
function mostrarSubAcidentes(sub){
  if(sub==="indicadores"){ irParaView("dashAcidentes"); return; }
  if(sub==="registro"){ irParaView("registroAnalise"); return; }
  popularFiltrosTodosAcidentes(); renderTodosAcidentes();
}
function renderGradeSemanal(){ renderCalendario(); }
function renderGradeMensal(){ renderCalendario(); }
function mostrarSubAgenda(sub){ calModo = sub==="mensal" ? "mes" : "semana"; irParaView("calendario"); return; }
function mostrarSubAgendaLegado(sub){
  document.querySelectorAll("#view-agenda .insp-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('#view-agenda .insp-tab[data-sub="'+sub+'"]').classList.add("active");
  document.querySelectorAll("#view-agenda .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("agenda-sub-"+sub).classList.add("active");
  if(sub==="semanal") renderGradeSemanal();
  if(sub==="mensal") renderGradeMensal();
}

/* ---- Nova visita: seleção de vários dias e período (manhã, tarde ou dia inteiro) ---- */
const PERIODOS_AGENDA = ["Dia inteiro","Manhã","Tarde"];
const PERIODO_ABREV = {"Manhã":"M", "Tarde":"T", "Dia inteiro":"DI"};
const ORDEM_PERIODO_AGENDA = {"Dia inteiro":0, "Manhã":1, "Tarde":2};
const DIAS_SEMANA_ABREV = ["dom","seg","ter","qua","qui","sex","sáb"];
let agTipoAgenda = "visita";
let agDiasSelecionados = new Set();   // datas "AAAA-MM-DD" marcadas no calendário
let agCalMesOffset = 0;               // meses a partir do mês atual

function dataISOLocal(d){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function maiusc1(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
function dataBR(iso){ return iso.split("-").reverse().join("/"); }
function selecionarPeriodoAgenda(p){
  document.getElementById("ag-periodo").value = p;
  document.querySelectorAll("#ag-periodo-switch .sw-btn").forEach(b=>{
    const ativo = b.dataset.periodo===p;
    b.classList.toggle("ativo", ativo);
    b.classList.toggle("sw-aprovado", ativo);
  });
  renderChipsDiasAgenda(); mostrarUltimaVisitaUnidade();
}
function renderCalendarioSelecaoAgenda(){
  const wrap = document.getElementById("ag-calsel");
  if(!wrap) return;
  const hoje = new Date();
  const hojeISO = dataISOLocal(hoje);
  const mesRef = new Date(hoje.getFullYear(), hoje.getMonth()+agCalMesOffset, 1);
  const nomeMes = maiusc1(mesRef.toLocaleDateString("pt-BR", {month:"long", year:"numeric"}));
  const offsetPrimeiro = (mesRef.getDay()+6)%7;                     // segunda = 0
  const diasNoMes = new Date(mesRef.getFullYear(), mesRef.getMonth()+1, 0).getDate();
  const alvoSel = agAlvoVisita();
  const meusDias = new Set(AGENDA.filter(v=>alvoSel && v.usuarioId===alvoSel.id && v.status!=="Rejeitado").map(v=>v.data));

  let html = `<div class="ag-cal-topo">
      <button type="button" class="ag-cal-nav" onclick="mudarMesCalAgenda(-1)" aria-label="Mês anterior">‹</button>
      <span class="ag-cal-mes">${nomeMes}</span>
      <button type="button" class="ag-cal-nav" onclick="mudarMesCalAgenda(1)" aria-label="Próximo mês">›</button>
    </div><div class="ag-cal-grid">`;
  ["seg","ter","qua","qui","sex","sáb","dom"].forEach(d=>{ html += `<div class="ag-cal-sem">${d}</div>`; });
  for(let i=0; i<offsetPrimeiro; i++) html += "<div></div>";
  for(let dia=1; dia<=diasNoMes; dia++){
    const d = new Date(mesRef.getFullYear(), mesRef.getMonth(), dia);
    const iso = dataISOLocal(d);
    const fds = d.getDay()===0 || d.getDay()===6;
    const classes = ["ag-dia"];
    if(fds) classes.push("fds");
    if(iso===hojeISO) classes.push("hoje");
    if(agDiasSelecionados.has(iso)) classes.push("sel");
    if(meusDias.has(iso)) classes.push("tem");
    html += `<button type="button" class="${classes.join(" ")}" ${fds?"disabled":""} title="${fds?"Fim de semana — não é possível agendar":(meusDias.has(iso)?"Você já tem visita neste dia":"")}" onclick="alternarDiaAgenda('${iso}')">${dia}</button>`;
  }
  html += "</div>";
  wrap.innerHTML = html;
}
// atividades: uma seleção base vale para todos os dias; "extras" dão outro tipo de atividade a alguns dias
let agMotivosBase = [], agExtras = [], agMenuTipoAberto = null;
function agReconstruirConfig(){
  const dias = [...agDiasSelecionados].sort();
  agExtras.forEach(x=>{ x.dias = x.dias.filter(d=>agDiasSelecionados.has(d)); });
  const per = agPeriodoPadrao(), un = agUnidadePadrao();
  const novo = {};
  dias.forEach(iso=>{
    const ex = agExtras.filter(x=>x.dias.includes(iso)).pop();
    novo[iso] = [{unidade:un, periodo:(ex && ex.periodo) || per, motivos:(ex ? ex.motivos : agMotivosBase).slice()}];
  });
  agDiasConfig = novo;
}
function agListaMotivos(alvo){ return alvo==="b" ? agMotivosBase : (agExtras[alvo] && agExtras[alvo].motivos); }
function agMenuTipo(alvo, ev){
  if(ev) ev.stopPropagation();
  agMenuTipoAberto = agMenuTipoAberto===String(alvo) ? null : String(alvo); renderChipsDiasAgenda();
}
document.addEventListener("click", ()=>{ if(agMenuTipoAberto!==null){ agMenuTipoAberto = null; renderChipsDiasAgenda(); } });
function agAlternarMotivo(alvo, valor){
  agMenuTipoAberto = null;
  const l = agListaMotivos(alvo); if(!l) return;
  const k = l.indexOf(valor); if(k>=0) l.splice(k,1); else l.push(valor);
  renderChipsDiasAgenda();
}
function agNovoExtra(){
  const livres = [...agDiasSelecionados].sort().filter(d=>!agExtras.some(x=>x.dias.includes(d)));
  agExtras.push({dias:livres.length ? [livres[0]] : [], motivos:[], periodo:agPeriodoPadrao()});
  renderChipsDiasAgenda();
}
function agSetPeriodoExtra(i, p){ if(agExtras[i]){ agExtras[i].periodo = p; renderChipsDiasAgenda(); } }
function agRemoverExtra(i){ agExtras.splice(i,1); renderChipsDiasAgenda(); }
function agAlternarDiaExtra(i, iso){
  const x = agExtras[i]; if(!x) return;
  const k = x.dias.indexOf(iso);
  if(k>=0) x.dias.splice(k,1);
  else { agExtras.forEach(o=>{ const j = o.dias.indexOf(iso); if(j>=0) o.dias.splice(j,1); }); x.dias.push(iso); }
  renderChipsDiasAgenda();
}
function agChipsTipo(alvo, lista){
  const aberto = agMenuTipoAberto===String(alvo);
  const q = JSON.stringify(alvo).replace(/"/g,"&quot;");
  return `<div class="ag-tipos">
    ${lista.map(m=>`<button type="button" class="ag-tipo-chip sel" onclick="agAlternarMotivo(${q},this.dataset.m)" data-m="${escHtml(m)}" title="Remover">${escHtml(m)} ×</button>`).join("")}
    <span class="ag-tipo-mais">
      <button type="button" class="ag-tipo-add" onclick="agMenuTipo(${q},event)" title="Adicionar tipo de atividade" aria-label="Adicionar tipo de atividade">+</button>
      ${aberto ? `<span class="ag-tipo-menu">${TIPOS_ATIVIDADE_PRINCIPAIS.filter(m=>!lista.includes(m)).map(m=>`<button type="button" data-m="${escHtml(m)}" onclick="agAlternarMotivo(${q},this.dataset.m)">${escHtml(m)}</button>`).join("") || "<em>Todos adicionados</em>"}</span>` : ""}
    </span></div>`;
}
function renderChipsDiasAgenda(){
  const box = document.getElementById("ag-dias-config");
  const resumo = document.getElementById("ag-dias-resumo");
  if(!box || !resumo) return;
  const dias = [...agDiasSelecionados].sort();
  agReconstruirConfig();
  if(!dias.length){
    resumo.innerHTML = '<span class="ag-dica">Nenhum dia selecionado. Clique nos dias do calendário.</span>';
    box.innerHTML = "";
    return;
  }
  resumo.innerHTML = dias.length+" dia(s) selecionado(s)";
  const rot = x=>{ const d = new Date(x+"T00:00:00"); return DIAS_SEMANA_ABREV[d.getDay()]+" "+x.slice(8,10)+"/"+x.slice(5,7); };
  box.innerHTML = agChipsTipo("b", agMotivosBase)
    + agExtras.map((x,i)=>`<div class="ag-extra">
        <div class="ag-extra-topo"><span class="ag-extra-tit">Outro tipo de atividade em:</span>
          <button type="button" class="ag-mini-btn x" onclick="agRemoverExtra(${i})" aria-label="Remover" title="Remover">×</button></div>
        <div class="ag-dia-pills">${dias.map(d=>`<button type="button" class="ag-dia-pill ${x.dias.includes(d)?"sel":""}" onclick="agAlternarDiaExtra(${i},'${d}')">${rot(d)}</button>`).join("")}</div>
        <div class="ag-extra-linha">
          <div class="ag-per-mtd" role="group" aria-label="Período">${[["M","Manhã"],["T","Tarde"],["D","Dia inteiro"]].map(([l,pp])=>`<button type="button" class="${(x.periodo||agPeriodoPadrao())===pp?"ativo":""}" title="${pp}" aria-label="${pp}" onclick="agSetPeriodoExtra(${i},'${pp}')">${l}</button>`).join("")}</div>
          ${agChipsTipo(i, x.motivos)}
        </div>
      </div>`).join("")
    + (dias.length>1 ? `<button type="button" class="ag-add-outro" onclick="agNovoExtra()">+ Adicionar outro tipo de atividade nos dias selecionados</button>` : "");
}
function atualizarSelecaoAgenda(){ renderCalendarioSelecaoAgenda(); renderChipsDiasAgenda(); marcarSugestoesAgenda(); }
function alternarDiaAgenda(iso){
  const d = new Date(iso+"T00:00:00");
  if(d.getDay()===0 || d.getDay()===6) return;
  if(agDiasSelecionados.has(iso)){ agDiasSelecionados.delete(iso); delete agDiasConfig[iso]; }
  else { agDiasSelecionados.add(iso); agGarantirConfigDia(iso); }
  atualizarSelecaoAgenda();
}
function mudarMesCalAgenda(delta){ agCalMesOffset += delta; renderCalendarioSelecaoAgenda(); }

/* ---- Painéis da unidade: última visita (motivos) e sugestão de revisita em 30 dias ---- */
const REVISITA_PRAZO_DIAS = 30;
const DIAS_SEMANA_PLURAL = ["domingos","segundas","terças","quartas","quintas","sextas","sábados"];
function somarDiasISO(iso, n){ const d = new Date(iso+"T00:00:00"); d.setDate(d.getDate()+n); return dataISOLocal(d); }
function diasEntreISO(a, b){ return Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000); }
function semanaChaveISO(iso){ const d = new Date(iso+"T00:00:00"); d.setDate(d.getDate()-((d.getDay()+6)%7)); return dataISOLocal(d); }
function ehReuniaoAgenda(v){ return /reuniao/.test(String(v.motivo||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()); }
function motivosSeparadosAgenda(txt){ return String(txt||"").split(/\s*\+\s*/).map(s=>s.trim()).filter(Boolean); }

// Dias da semana + período em que o usuário costuma ter reunião (últimas 12 semanas)
function padraoReunioesAgenda(usuarioId){
  const hojeISO = dataISOLocal(new Date());
  const ini = somarDiasISO(hojeISO, -84);
  const minhas = AGENDA.filter(v=>v.usuarioId===usuarioId && v.status!=="Rejeitado");
  if(!minhas.length) return {habituais:[], semanas:0};
  const primeira = minhas.reduce((m,v)=>v.data<m?v.data:m, minhas[0].data);
  const semanas = Math.min(12, Math.max(1, Math.ceil(diasEntreISO(primeira<ini ? ini : primeira, hojeISO)/7)));
  const mapa = new Map();   // "dia|período" -> semanas distintas com reunião
  minhas.filter(v=>ehReuniaoAgenda(v) && v.data>=ini && v.data<hojeISO).forEach(v=>{
    const dow = new Date(v.data+"T00:00:00").getDay();
    (v.periodo==="Dia inteiro" ? ["Manhã","Tarde"] : [v.periodo]).forEach(p=>{
      const k = dow+"|"+p; if(!mapa.has(k)) mapa.set(k, new Set()); mapa.get(k).add(semanaChaveISO(v.data));
    });
  });
  const habituais = [];
  mapa.forEach((set,k)=>{ const [dow,periodo] = k.split("|"); if(set.size>=2 && set.size/semanas>=0.25) habituais.push({dow:Number(dow), periodo, n:set.size}); });
  habituais.sort((a,b)=>a.dow-b.dow || a.periodo.localeCompare(b.periodo,"pt-BR"));
  return {habituais, semanas};
}

// Sugere datas livres perto de (última visita à unidade + 30 dias), evitando reuniões habituais e dias já ocupados
function sugerirRevisitaAgenda(unidade, periodo){
  const hojeISO = dataISOLocal(new Date());
  const amanha = somarDiasISO(hojeISO, 1);
  const daUnidade = AGENDA.filter(v=>v.unidade===unidade && v.status!=="Rejeitado");
  const base = daUnidade.length ? daUnidade.reduce((m,v)=>v.data>m?v.data:m, daUnidade[0].data) : null;
  let alvo = base ? somarDiasISO(base, REVISITA_PRAZO_DIAS) : amanha;
  const prazoOriginal = alvo;
  const vencida = !!base && alvo<hojeISO;
  if(alvo<amanha) alvo = amanha;
  const padrao = padraoReunioesAgenda(currentUser.id);
  const minhas = AGENDA.filter(v=>v.usuarioId===currentUser.id && v.status!=="Rejeitado");
  const livre = (iso)=>{
    const dow = new Date(iso+"T00:00:00").getDay();
    if(dow===0 || dow===6) return false;
    if(padrao.habituais.some(h=>h.dow===dow && (periodo==="Dia inteiro" || h.periodo===periodo))) return false;
    return !minhas.some(v=>v.data===iso && (v.periodo==="Dia inteiro" || periodo==="Dia inteiro" || v.periodo===periodo));
  };
  let candidatos = [];
  for(const raio of [7, 14]){
    candidatos = [];
    for(let off=-raio; off<=raio; off++){
      const iso = somarDiasISO(alvo, off);
      if(iso<amanha || !livre(iso)) continue;
      candidatos.push({iso, diff:diasEntreISO(prazoOriginal, iso)});
    }
    if(candidatos.length>=3) break;
  }
  candidatos.sort((a,b)=> Math.abs(diasEntreISO(alvo,a.iso))-Math.abs(diasEntreISO(alvo,b.iso)) || (a.iso<b.iso?-1:1));
  return {base, prazo:prazoOriginal, vencida, sugestoes:candidatos.slice(0,3), padrao};
}
function rotuloPrazoSugestao(s, vencida, temBase){
  if(!temBase) return "próximo dia livre";
  if(vencida) return "prazo já vencido";
  const d = s.diff;
  return d===0 ? "no prazo (30 dias)" : d<0 ? (-d)+" dia"+(d===-1?"":"s")+" antes do prazo" : d+" dia"+(d===1?"":"s")+" após o prazo";
}
function renderUltimaVisitaUnidadeAgenda(unidade){
  const el = document.getElementById("ag-ultima-visita-info");
  const hojeISO = dataISOLocal(new Date());
  const passadas = AGENDA.filter(v=>v.unidade===unidade && v.status!=="Rejeitado" && v.data<=hojeISO);
  if(!passadas.length){
    el.innerHTML = '<div class="ag-painel-tit">Última visita à unidade</div><div class="ag-painel-txt">Nenhuma visita anterior registrada para esta unidade.</div>';
    return;
  }
  const ultimaData = passadas.reduce((m,v)=>v.data>m?v.data:m, passadas[0].data);
  const doDia = passadas.filter(v=>v.data===ultimaData);
  const motivos = [...new Set(doDia.flatMap(v=>motivosSeparadosAgenda(v.motivo)))];
  const quem = [...new Set(doDia.map(v=>primeiroNomeAgenda(v.usuarioNome)+" ("+v.periodo.toLowerCase()+")"))].join(", ");
  const dias = diasEntreISO(ultimaData, hojeISO);
  el.innerHTML = `<div class="ag-painel-tit">Última visita à unidade</div>
    <div class="ag-painel-txt"><b>${dataBR(ultimaData)}</b> · ${dias===0?"hoje":"há "+dias+" dia"+(dias===1?"":"s")} · ${escHtml(quem)}</div>
    <ul class="ag-bullets">${motivos.length ? motivos.map(m=>`<li>${escHtml(m)}</li>`).join("") : "<li>Motivo não informado</li>"}</ul>`;
}
function renderSugestaoRevisitaAgenda(unidade){
  const el = document.getElementById("ag-sugestao");
  const periodo = document.getElementById("ag-periodo").value || "Manhã";
  const s = sugerirRevisitaAgenda(unidade, periodo);
  const temBase = !!s.base;
  let resumo;
  if(!temBase) resumo = "Sem visita anterior: sugiro os próximos dias livres da sua agenda.";
  else if(s.vencida) resumo = `Prazo de revisita (30 dias após ${dataBR(s.base)}) venceu em <b>${dataBR(s.prazo)}</b>. Estes são os próximos dias livres:`;
  else resumo = `Revisita em 30 dias após <b>${dataBR(s.base)}</b> = <b>${dataBR(s.prazo)}</b>. Datas livres mais próximas:`;
  const chips = s.sugestoes.length ? s.sugestoes.map(x=>{
    const d = new Date(x.iso+"T00:00:00");
    const sel = agDiasSelecionados.has(x.iso) ? " sel" : "";
    return `<button type="button" class="ag-sug-chip${sel}" data-iso="${x.iso}" onclick="usarSugestaoAgenda('${x.iso}')"><b>${DIAS_SEMANA_ABREV[d.getDay()]} ${dataBR(x.iso).slice(0,5)}</b><small>${rotuloPrazoSugestao(x, s.vencida, temBase)}</small></button>`;
  }).join("") : '<span class="ag-painel-txt">Não encontrei dia livre nas próximas semanas para esse período.</span>';
  const hab = s.padrao.habituais;
  const nota = hab.length
    ? "Evitei seus dias de reunião habitual: "+hab.map(h=>DIAS_SEMANA_PLURAL[h.dow]+" ("+h.periodo.toLowerCase()+")").join(", ")+" e os dias em que você já tem visita."
    : "Não identifiquei reuniões habituais na sua agenda; evitei apenas os dias em que você já tem visita.";
  el.innerHTML = `<div class="ag-painel-tit">Sugestão de revisita</div>
    <div class="ag-painel-txt">${resumo}</div>
    <div class="ag-sug-chips">${chips}</div>
    <div class="ag-painel-nota">${escHtml(nota)}</div>`;
}
function marcarSugestoesAgenda(){
  document.querySelectorAll("#ag-sugestao .ag-sug-chip").forEach(b=>b.classList.toggle("sel", agDiasSelecionados.has(b.dataset.iso)));
}
function usarSugestaoAgenda(iso){
  agDiasSelecionados.add(iso); agGarantirConfigDia(iso);
  const hoje = new Date(), d = new Date(iso+"T00:00:00");
  agCalMesOffset = (d.getFullYear()-hoje.getFullYear())*12 + (d.getMonth()-hoje.getMonth());
  atualizarSelecaoAgenda();
}
function mostrarUltimaVisitaUnidade(){
  const unidade = document.getElementById("ag-unidade").value;
  const grade = document.getElementById("ag-paineis");
  if(!grade) return;
  if(agTipoAgenda!=="visita" || !unidade || !currentUser){ grade.style.display = "none"; return; }
  grade.style.display = "grid";
  renderUltimaVisitaUnidadeAgenda(unidade);
  renderSugestaoRevisitaAgenda(unidade);
}
async function adicionarVisitaAgenda(){
  const dias = [...agDiasSelecionados].sort();
  if(!dias.length){ alert("Selecione ao menos um dia no calendário."); return; }
  if(dias.some(iso=>{ const g = new Date(iso+"T00:00:00").getDay(); return g===0 || g===6; })){
    alert("Só é possível agendar visitas em dias úteis (segunda a sexta)."); return;
  }
  dias.forEach(agGarantirConfigDia);
  const alvo = agAlvoVisita();
  const sobrepoe = (a,b)=> a==="Dia inteiro" || b==="Dia inteiro" || a===b;
  // cada dia: unidade + período + ao menos uma atividade; sem períodos sobrepostos dentro do mesmo dia
  for(const iso of dias){
    const ents = agDiasConfig[iso];
    for(let i=0;i<ents.length;i++){
      const e = ents[i];
      e.unidade = agUnidadePadrao();
      if(!e.unidade){ alert(agTipoAgenda==="local" ? "Escolha o local de trabalho." : "Escolha a unidade / loja."); return; }
      if(!e.motivos.length){ alert("Em "+dataBR(iso)+": marque ao menos uma atividade principal."); return; }
      for(let j=i+1;j<ents.length;j++){
        if(sobrepoe(e.periodo, ents[j].periodo)){ alert("Em "+dataBR(iso)+": os períodos das unidades se sobrepõem. Use manhã em uma e tarde em outra."); return; }
      }
    }
  }
  // não duplica: mesma pessoa, mesma unidade, mesma data e período que se sobrepõe ao já agendado
  const novas = [], duplicadas = [];
  dias.forEach(iso=>agDiasConfig[iso].forEach(e=>{
    const dup = AGENDA.some(v=>v.usuarioId===alvo.id && v.unidade===e.unidade && v.data===iso && v.status!=="Rejeitado" && sobrepoe(v.periodo, e.periodo));
    if(dup) duplicadas.push(iso); else novas.push({iso, ...e});
  }));
  if(!novas.length){
    alert("Você já tem visita nessa unidade, nesse período, em: "+[...new Set(duplicadas)].map(dataBR).join(", ")+".");
    return;
  }
  const precisaAprovacao = currentUser.perfil === "Usuário Padrão";
  const linhas = novas.map(n=>({
    usuario_id: alvo.id, usuario_nome: alvo.nome, usuario_perfil: alvo.perfil,
    unidade: n.unidade, data: n.iso, periodo: n.periodo, motivo: n.motivos.join(" + "), status: precisaAprovacao ? "Pendente" : "Aprovado",
    oculto: false,
    descricao: (document.getElementById("ag-descricao")?.value || "").trim() || null
  }));
  const btn = document.getElementById("ag-btn-agendar");
  if(btn) btn.disabled = true;
  try{
    const { data: rows, error } = await dbGravarComOculto(p=>sb.from("agenda").insert(p).select(), linhas);
    if(error){ alert("Erro ao agendar visita: "+error.message); return; }
    (rows||[]).slice().reverse().forEach(r=>AGENDA.unshift(mapAgendaFromDb(r)));
    if(alvo.id!==currentUser.id && rows && rows.length) notificarVisitas(rows.map(mapAgendaFromDb), "Visita agendada para você");
    if(precisaAprovacao && rows && rows.length){
      const diasNovos = [...new Set(novas.map(n=>n.iso))];
      const unidades = [...new Set(novas.map(n=>n.unidade))].join(", ");
      const resumoDias = diasNovos.length===1 ? dataBR(diasNovos[0]) : diasNovos.length+" dias ("+diasNovos.map(d=>d.slice(8,10)+"/"+d.slice(5,7)).join(", ")+")";
      notificarAdminsCoordenadores("agenda_aprovacao", "Visita aguardando aprovação", currentUser.nome+" — "+unidades+" — "+resumoDias, "agenda", rows[0].id);
    }
  } finally {
    if(btn) btn.disabled = false;
  }
  agDiasSelecionados.clear(); agDiasConfig = {}; agMotivosBase = []; agExtras = [];
  fecharModalVisitaAgenda();
  atualizarSelecaoAgenda();
  mostrarUltimaVisitaUnidade();
  renderInicio();
  renderGradeSemanal();
  renderGradeMensal();
  const qtd = novas.length;
  let msg = qtd===1 ? "Visita agendada" : qtd+" visitas agendadas";
  if(duplicadas.length) msg += " ("+duplicadas.length+" já existia(m) e foi(ram) ignorada(s))";
  msg += precisaAprovacao ? " — aguardando aprovação do organizador." : ".";
  mostrarToast(msg);
}
async function removerVisitaAgenda(ids){
  ids = [].concat(ids);
  const msg = ids.length>1 ? "Esta linha reúne "+ids.length+" visitas (manhã e tarde) na mesma unidade. Remover as duas da agenda?" : "Remover esta visita da agenda?";
  if(!confirm(msg)) return;
  const { data: apagadas, error } = await sb.from("agenda").delete().in("id", ids).select("id");
  if(error){ alert("Erro ao remover visita: "+error.message); return; }
  if(!apagadas || !apagadas.length){ alert("Não foi possível remover: você não tem permissão para excluir esta visita (só quem a criou, o Administrador ou o Coordenador)."); return; }
  notificarVisitas(AGENDA.filter(v=>ids.includes(v.id)), ids.length>1 ? "Visitas removidas" : "Visita removida");
  AGENDA = AGENDA.filter(v=>!ids.includes(v.id));
  renderInicio(); renderGradeSemanal(); renderGradeMensal();
  if(typeof renderCalendario==="function") renderCalendario();
  if(typeof diaCalAtual!=="undefined" && diaCalAtual && document.getElementById("modal-dia-cal").style.display!=="none") renderDiaCal();
  mostrarToast(ids.length>1 ? "Visitas removidas." : "Visita removida.");
}
function tagStatusAgenda(status){
  const cor = status==="Aprovado"?"concluido":status==="Rejeitado"?"notificado":"andamento";
  return `<span class="tag-status ${cor}">${status}</span>`;
}

/* ---- Check-in / Check-out (geolocalização obrigatória) ---- */
async function fazerCheckin(id){
  const v = AGENDA.find(x=>x.id===id);
  if(!v) return;
  if(v.status!=="Aprovado"){ alert("Essa visita ainda não foi aprovada pelo organizador."); return; }
  mostrarToast("Obtendo localização para o check-in...");
  let geo;
  try{ geo = await capturarGeolocalizacaoObrigatoria(); }
  catch(e){ alert("Check-in não realizado: "+e.message); return; }
  const checkin = {hora:new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}), geo};
  const { error } = await sb.from("agenda").update({checkin}).eq("id", id);
  if(error){ alert("Erro ao registrar check-in: "+error.message); return; }
  v.checkin = checkin;
  notificarVisitas([v], "Check-in registrado");
  renderInicio();
  mostrarToast("Check-in registrado com localização.");
}
async function fazerCheckout(id){
  const v = AGENDA.find(x=>x.id===id);
  if(!v) return;
  if(!v.checkin){ alert("Faça o check-in antes do check-out."); return; }
  if(await vistBloqueiaCheckout(id)) return;
  mostrarToast("Obtendo localização para o check-out...");
  let geo;
  try{ geo = await capturarGeolocalizacaoObrigatoria(); }
  catch(e){ alert("Check-out não realizado: "+e.message); return; }
  const checkout = {hora:new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}), geo};
  const { error } = await sb.from("agenda").update({checkout}).eq("id", id);
  if(error){ alert("Erro ao registrar check-out: "+error.message); return; }
  v.checkout = checkout;
  notificarVisitas([v], "Check-out registrado");
  renderInicio();
  mostrarToast("Check-out registrado com localização.");
}
/* =====================================================================
   INÍCIO — página inicial do usuário (check-in do dia, resumo e avisos)
   ===================================================================== */
function saudacaoInicio(){ const h = new Date().getHours(); return h<12 ? "Bom dia" : h<18 ? "Boa tarde" : "Boa noite"; }
function abrirModuloInicio(view, sub){
  if(view==="agenda"){
    irParaView("calendario");
    if(sub==="minha"){
      if(!currentUser || !(currentUser.modulos||[]).includes("agenda")){ mostrarToast("Você não tem acesso ao agendamento de visitas."); return; }
      abrirModalVisitaAgenda();
    } else { calModo = sub==="mensal" ? "mes" : "semana"; renderCalendario(); }
    return;
  }
  if(!currentUser || !currentUser.modulos.includes(view)){ mostrarToast("Você não tem acesso a este módulo."); return; }
  irParaView(view);
}
function abrirDemandaInicio(id){
  if(!currentUser || !currentUser.modulos.includes("demandas")){ mostrarToast("Você não tem acesso a este módulo."); return; }
  irParaView("demandas");
  setTimeout(()=>abrirModalDemanda(id), 250);
}
function renderInicio(){
  if(!currentUser || !document.getElementById("inicio-hero")) return;
  renderInicioHero();
  renderInicioSessao();
  renderCheckinHoje();
  renderInicioCalendario();
  carregarReunioesParaCalendario();
  renderInicioKpis();
  renderInicioProximas();
  renderInicioDemandas();
  renderInicioAtencao();
  renderInicioEquipe();
  renderInicioAvisos();
  renderInicioPlanos();
}
function renderInicioHero(){
  const el = document.getElementById("inicio-hero");
  const dataTxt = maiusc1(new Date().toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long", year:"numeric"}));
  const foto = currentUser.foto
    ? `<img src="${escHtml(currentUser.foto)}" alt="">`
    : escHtml(iniciaisTexto(currentUser.nome));
  el.innerHTML = `
    <div class="in-hero-id">
      <span class="in-foto" aria-hidden="true">${foto}</span>
      <div>
        <span class="in-data-hoje">${escHtml(dataTxt)}</span>
        <h3>${saudacaoInicio()}, ${escHtml(primeiroNomeAgenda(currentUser.nome))}!</h3>
      </div>
    </div>
    <span class="in-perfil">${escHtml(currentUser.perfil)}</span>`;
}
// Check-in / check-out: um único card, que segue a agenda do dia (manhã primeiro; ao concluir, aparece a tarde)
function renderCheckinHoje(){
  const wrap = document.getElementById("checkin-hoje");
  if(!wrap || !currentUser) return;
  const hojeISO = dataISOLocal(new Date());
  const hoje = AGENDA.filter(v=>v.usuarioId===currentUser.id && v.data===hojeISO && v.status!=="Rejeitado")
    .sort((a,b)=>(ORDEM_PERIODO_AGENDA[a.periodo]??9)-(ORDEM_PERIODO_AGENDA[b.periodo]??9));
  if(!hoje.length){
    wrap.innerHTML = '<div class="ck-vazio"><b>Sem visita para hoje.</b><span>Quando você tiver uma visita agendada para o dia, o check-in aparece aqui.</span></div>';
    return;
  }
  const v = hoje.find(x=>!x.checkout) || hoje[hoje.length-1];
  const hora = reg => escHtml(horaDoRegistroAgenda(reg) || (reg && reg.hora) || "");
  const aprovada = v.status==="Aprovado";
  const todasConcluidas = hoje.every(x=>x.checkout);
  const passo = (cls, rotulo, sub)=>`<div class="ck-passo ${cls}"><i></i><b>${rotulo}</b><small>${sub||"&nbsp;"}</small></div>`;
  const passos =
    passo(aprovada ? "feito" : "aviso", aprovada ? "Agendada" : "Aguardando", aprovada ? "aprovada" : "aprovação")
    + passo(v.checkin ? "feito" : (aprovada ? "atual" : ""), "Check-in", v.checkin ? hora(v.checkin)+linkGeo(v.checkin.geo, "Ver local do check-in no mapa") : "")
    + passo(v.checkout ? "feito saida" : (v.checkin ? "atual" : ""), "Check-out", v.checkout ? hora(v.checkout)+linkGeo(v.checkout.geo, "Ver local do check-out no mapa") : "");
  let acao;
  if(!aprovada) acao = '<div class="ck-msg">O check-in é liberado depois que o organizador aprovar a visita.</div>';
  else if(!v.checkin) acao = `<button type="button" class="btn-primary ck-btn" onclick="fazerCheckin(${v.id})">Fazer check-in</button>`;
  else if(!v.checkout) acao = `<button type="button" class="btn-secondary ck-btn" onclick="fazerCheckout(${v.id})">Fazer check-out</button>`;
  else acao = '<div class="ck-msg ok">✓ '+(hoje.length>1 && todasConcluidas ? "Todas as visitas de hoje concluídas" : "Visita concluída")+'</div>';
  const seq = hoje.length>1 ? `<span class="ck-seq">Visita ${hoje.indexOf(v)+1} de ${hoje.length}</span>` : "";
  wrap.innerHTML = `<div class="ck-grid"><div class="ck-card ${aprovada?"":"pendente"} ${v.checkout?"concluida":""}">
      <div class="ck-topo"><span class="ck-un">${escHtml(v.unidade)}</span><span style="display:flex; gap:6px; align-items:center;">${seq}<span class="ck-per">${escHtml(v.periodo)}</span></span></div>
      <div class="ck-mot">${escHtml(v.motivo||"")}</div>
      <div class="ck-passos">${passos}</div>
      ${acao}
    </div></div>`;
}
function demandasAbertasDoUsuario(){
  return DEMANDAS.filter(d=>d.responsavelUsuarioId===currentUser.id && !d.entregueEm)
    .sort((a,b)=>{ if(!a.dataLimite) return 1; if(!b.dataLimite) return -1; return a.dataLimite<b.dataLimite?-1:a.dataLimite>b.dataLimite?1:0; });
}
function renderInicioKpis(){
  const el = document.getElementById("inicio-kpis");
  const seg = segundaDaSemana(0), sex = new Date(seg); sex.setDate(seg.getDate()+4);
  const iniSem = dataISOLocal(seg), fimSem = dataISOLocal(sex);
  const minhasSemana = AGENDA.filter(v=>v.usuarioId===currentUser.id && v.status!=="Rejeitado" && v.data>=iniSem && v.data<=fimSem).length;
  const abertas = demandasAbertasDoUsuario();
  const atrasadas = abertas.filter(d=>calcularControlePrazo(d.dataLimite, d.entregueEm).label==="Atrasado").length;
  const organizador = podeAprovarAgenda(currentUser);
  const pendentes = AGENDA.filter(v=>v.status==="Pendente" && (organizador || v.usuarioId===currentUser.id)).length;
  const avisos = avisosPendentes().length;
  const tile = (cor, rotulo, valor, rodape, clique)=>`
    <button type="button" class="in-kpi ${cor}" onclick="${clique}">
      <span class="in-kpi-lbl">${rotulo}</span><span class="in-kpi-val">${valor}</span><span class="in-kpi-foot">${rodape}</span>
    </button>`;
  el.innerHTML =
      tile("k-verde", "Minhas visitas na semana", minhasSemana, dataBR(iniSem).slice(0,5)+" a "+dataBR(fimSem).slice(0,5), "abrirModuloInicio('agenda','semanal')")
    + tile(atrasadas ? "k-vermelho" : "k-terracota", "Demandas em aberto", abertas.length, atrasadas ? atrasadas+" atrasada(s)" : "nenhuma atrasada", "abrirModuloInicio('demandas')")
    + tile(pendentes ? "k-laranja" : "k-areia", organizador ? "Visitas para aprovar" : "Visitas aguardando aprovação", pendentes, organizador ? "da equipe toda" : "suas visitas", organizador ? "abrirAprovacoesInicio()" : "abrirModuloInicio('agenda','semanal')")
    + tile(avisos ? "k-laranja" : "k-areia", "Avisos pendentes", avisos, avisos ? "clique para ver" : "tudo em dia", "document.getElementById('inicio-avisos').scrollIntoView({behavior:'smooth',block:'center'})");
}
/* ---- Início: calendário mensal de carga (verde → vermelho; cinza = ausente) ---- */
let inicioCalOffset = 0;
function inicioCalNavegar(d){ inicioCalOffset += d; renderInicioCalendario(); }
function inicioCalHoje(){ inicioCalOffset = 0; renderInicioCalendario(); }
function cargaDiaInicio(uid, iso){
  const it = calItensDoDia(uid, iso);
  const eventos = it.eventos.filter(e=>!CAL_AUSENCIAS.includes(e.tipo));
  const aus = it.eventos.filter(e=>CAL_AUSENCIAS.includes(e.tipo));
  return {total: eventos.length + it.reunioes.length + it.demandas.length + it.visitas.length, eventos:eventos.length + it.reunioes.length, demandas:it.demandas.length, visitas:it.visitas.length, aus};
}
function nivelCargaDia(n){ return n<=0 ? 0 : n<=2 ? 1 : n<=4 ? 2 : n<=6 ? 3 : 4; }
function renderInicioCalendario(){
  const el = document.getElementById("inicio-cal");
  if(!el || !currentUser) return;
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth()+inicioCalOffset);
  const ano = base.getFullYear(), mes = base.getMonth();
  document.getElementById("in-cal-titulo").textContent = maiusc1(base.toLocaleDateString("pt-BR", {month:"long", year:"numeric"}));
  const hojeISO = dataISOLocal(new Date());
  const ultimo = new Date(ano, mes+1, 0);
  let seg = new Date(ano, mes, 1); seg.setDate(seg.getDate() - ((seg.getDay()+6)%7));      // segunda-feira da semana do dia 1
  let html = ["Seg","Ter","Qua","Qui","Sex"].map(s=>`<div class="icm-sem">${s}</div>`).join("");
  while(seg <= ultimo){
    const dias = [];
    for(let i=0;i<5;i++){ const d = new Date(seg); d.setDate(seg.getDate()+i); dias.push(d); }
    if(dias.some(d=>d.getMonth()===mes)){
      dias.forEach(d=>{
        if(d.getMonth()!==mes){ html += '<div class="icm-d vazio"><b>·</b></div>'; return; }
        const iso = dataISOLocal(d), c = cargaDiaInicio(currentUser.id, iso);
        let cls = "", dica = dataBR(iso)+" — livre";
        if(c.aus.length){ cls = "aus"; dica = dataBR(iso)+" — ausente: "+c.aus.map(e=>e.tipo).join(", "); }
        else if(c.total){
          cls = "n"+nivelCargaDia(c.total);
          const partes = [c.visitas && c.visitas+" visita"+(c.visitas>1?"s":""), c.eventos && c.eventos+" evento"+(c.eventos>1?"s":""), c.demandas && c.demandas+" demanda"+(c.demandas>1?"s":"")].filter(Boolean);
          dica = dataBR(iso)+" — "+c.total+" atividade"+(c.total>1?"s":"")+" ("+partes.join(", ")+")";
        }
        html += `<div class="icm-d ${cls} ${iso===hojeISO?"hoje":""}"><b title="${escHtml(dica)}" onclick="inicioCalAbrirDia('${iso}')">${d.getDate()}</b></div>`;
      });
    }
    seg.setDate(seg.getDate()+7);
  }
  el.innerHTML = `<div class="icm">${html}</div>
    <div class="icm-leg"><span><i class="n1"></i>Leve</span><span><i class="n2"></i>Médio</span><span><i class="n3"></i>Alto</span><span><i class="n4"></i>Muito alto</span><span><i class="aus"></i>Ausente</span></div>`;
}
function inicioCalAbrirDia(iso){
  calModo = "semana"; calPessoas = [currentUser.id];
  calSemanaOffset = Math.round(diasEntreISO(dataISOLocal(segundaDaSemana(0)), dataISOLocal(segundaDoDia(iso)))/7);
  irParaView("calendario");
}
function vazioInicio(txt){ return `<div class="in-vazio">${txt}</div>`; }
function renderInicioProximas(){
  const el = document.getElementById("inicio-proximas");
  const hojeISO = dataISOLocal(new Date());
  const lista = AGENDA.filter(v=>v.usuarioId===currentUser.id && v.status!=="Rejeitado" && v.data>=hojeISO)
    .sort((a,b)=> a.data<b.data?-1:a.data>b.data?1:(ORDEM_PERIODO_AGENDA[a.periodo]??9)-(ORDEM_PERIODO_AGENDA[b.periodo]??9)).slice(0,6);
  if(!lista.length){ el.innerHTML = vazioInicio("Nenhuma visita agendada. Use “Agendar” para lançar novas visitas."); return; }
  el.innerHTML = '<ul class="in-lista">' + lista.map(v=>{
    const d = new Date(v.data+"T00:00:00");
    return `<li class="in-item">
      <div class="in-dia ${v.data===hojeISO?"hoje":""}"><b>${String(d.getDate()).padStart(2,"0")}</b><span>${v.data===hojeISO?"hoje":DIAS_SEMANA_ABREV[d.getDay()]}</span></div>
      <div class="in-item-corpo"><span class="in-item-tit">${calAvsHtml([v.usuarioId])}${escHtml(v.unidade)} <small>· ${escHtml(v.periodo)}</small></span><span class="in-item-sub">${escHtml(v.motivo||"")}</span></div>
      ${v.status==="Aprovado" ? "" : tagStatusAgenda(v.status)}
    </li>`;
  }).join("") + '</ul>';
}
function renderInicioDemandas(){
  const el = document.getElementById("inicio-demandas");
  const abertas = demandasAbertasDoUsuario().slice(0,6);
  if(!abertas.length){ el.innerHTML = vazioInicio("Você não tem demandas em aberto."); return; }
  el.innerHTML = '<ul class="in-lista">' + abertas.map(d=>{
    const p = calcularControlePrazo(d.dataLimite, d.entregueEm);
    return `<li class="in-item clicavel" onclick="abrirDemandaInicio(${d.id})">
      <span class="in-ponto" style="background:${p.cor};"></span>
      <div class="in-item-corpo"><span class="in-item-tit">${escHtml((d.demanda||"").slice(0,70))}</span><span class="in-item-sub">${escHtml([d.unidade, d.prioridade&&("Prioridade "+d.prioridade)].filter(Boolean).join(" · "))}</span></div>
      <span class="in-prazo" style="color:${p.cor};">${escHtml(p.label)}</span>
    </li>`;
  }).join("") + '</ul>';
}
// Onde está a equipe hoje: todos os outros usuários, com a visita do dia (local de trabalho) ou a ausência registrada no calendário
function renderInicioEquipe(){
  const el = document.getElementById("inicio-equipe");
  const hojeISO = dataISOLocal(new Date());
  const outros = usuariosAtivosOrdenados().filter(u=>u.id!==currentUser.id);
  if(!outros.length){ el.innerHTML = vazioInicio("Não há outros usuários cadastrados."); return; }
  const linhas = linhasDiaAgenda(hojeISO);
  const html = outros.map(u=>{
    const nome = `<span class="ag-linha-nome lg" title="${escHtml(u.nome)}">${escHtml(primeiroNomeAgenda(u.nome))}</span>`;
    const av = avatarMiniAgenda(u.id, u.nome);
    const aus = (typeof ausenciasDoUsuarioNoDia==="function") ? ausenciasDoUsuarioNoDia(u.id, hojeISO) : [];
    if(aus.length){
      const t = aus.map(e=>e.tipo).join(" · ");
      return `<div class="ag-linha">${av}${nome}<div class="ag-fatias"><div class="ag-fatia inteira aus" title="${escHtml(t)}"><span class="ag-un">${escHtml(t)}</span></div></div></div>`;
    }
    const minhas = linhas.filter(l=>l.usuarioId===u.id);
    if(!minhas.length) return `<div class="ag-linha">${av}${nome}<div class="ag-fatias"><div class="ag-fatia inteira vazia"><span class="ag-un" style="font-weight:500; opacity:.65;">Sem visita hoje</span></div></div></div>`;
    return minhas.map(l=>{
      const fatias = l.inteira ? fatiaAgendaHtml([l.inteira, l.par], "inteira", false, false)
                               : fatiaAgendaHtml([l.manha], "manha", false, false) + fatiaAgendaHtml([l.tarde], "tarde", false, false);
      return `<div class="ag-linha">${av}${nome}<div class="ag-fatias">${fatias}</div></div>`;
    }).join("");
  }).join("");
  el.innerHTML = '<div class="ag-linhas in-equipe">'+html+'</div>';
}
/* ---- Início: lojas que precisam de atenção ---- */
const ATENCAO_ACID_RECENTE_DIAS = 15, ATENCAO_ACID_MUITOS = 3, ATENCAO_ACID_JANELA_DIAS = 90, ATENCAO_LINHAS = 8;
const ATENCAO_ATEST_JANELA_DIAS = 30, ATENCAO_ATEST_MUITOS = 3;
let inicioAtencaoExpandido = false;
function unidadesDoUsuarioInicio(){
  return ehAdminOuCoordenador() ? UNIDADES : UNIDADES.filter(u=>lojasSobResponsabilidade().includes(u.nome));
}
function lojasEmAtencao(){
  const hojeISO = dataISOLocal(new Date());
  const tem = m => (currentUser.modulos||[]).includes(m);
  const lista = [];
  unidadesDoUsuarioInicio().forEach(u=>{
    const motivos = [];
    let peso = 0;
    // acidentes (módulo Acidentes)
    if(tem("lancamento")){
      const acid = ACIDENTES.filter(a=>a.loja===u.nome && a.data).map(a=>({...a, atras:diasEntreISO(a.data, hojeISO)})).filter(a=>a.atras>=0);
      const recentes = acid.filter(a=>a.atras<=ATENCAO_ACID_RECENTE_DIAS).sort((a,b)=>a.atras-b.atras);
      const janela = acid.filter(a=>a.atras<=ATENCAO_ACID_JANELA_DIAS);
      if(recentes.length){ motivos.push({tipo:"recente", cor:"vermelho", txt: recentes[0].atras===0 ? "Acidente hoje" : "Acidente há "+recentes[0].atras+" dia"+(recentes[0].atras===1?"":"s")}); peso += 100; }
      if(janela.length>=ATENCAO_ACID_MUITOS){ motivos.push({tipo:"muitos", cor:"laranja", txt: janela.length+" acidentes em "+ATENCAO_ACID_JANELA_DIAS+" dias"}); peso += 40+janela.length; }
    }
    // demandas atrasadas da unidade (módulo Demandas)
    if(tem("demandas")){
      const atras = DEMANDAS.filter(d=>d.unidade===u.nome && !d.entregueEm && calcularControlePrazo(d.dataLimite, d.entregueEm).label==="Atrasado").length;
      if(atras){ motivos.push({tipo:"demanda", cor:"vermelho", txt: atras+" demanda"+(atras===1?"":"s")+" atrasada"+(atras===1?"":"s")}); peso += 30+atras; }
    }
    // atestados recentes (módulo Saúde)
    if(tem("saude")){
      const n = ATESTADOS.filter(a=>a.loja===u.nome && a.dataAtestado && diasEntreISO(a.dataAtestado, hojeISO)>=0 && diasEntreISO(a.dataAtestado, hojeISO)<=ATENCAO_ATEST_JANELA_DIAS).length;
      if(n>=ATENCAO_ATEST_MUITOS){ motivos.push({tipo:"atestados", cor:"laranja", txt: n+" atestados em "+ATENCAO_ATEST_JANELA_DIAS+" dias"}); peso += 20+n; }
    }
    // fichas de EPI de novos admitidos aguardando download (módulo Ficha de EPI)
    if(tem("fichaEpi")){
      const n = EPI_NOVOS.filter(r=>normalizarTextoComparacao(r.loja)===normalizarTextoComparacao(u.nome)).length;
      if(n){ motivos.push({tipo:"epi", cor:"laranja", txt: n+" ficha"+(n===1?"":"s")+" de EPI para baixar"}); peso += 10+n; }
    }
    if(!motivos.length) return;
    lista.push({nome:u.nome, regional:u.regional||"", motivos, peso});
  });
  lista.sort((a,b)=> (b.peso-a.peso) || a.nome.localeCompare(b.nome,"pt-BR"));
  return lista;
}
function agendarUnidadeInicio(nome){
  if(!currentUser || !(currentUser.modulos||[]).includes("agenda")){ mostrarToast("Você não tem acesso ao agendamento de visitas."); return; }
  irParaView("calendario");
  abrirModalVisitaAgenda();
  const sel = document.getElementById("ag-unidade");
  if(sel){ sel.value = nome; mostrarUltimaVisitaUnidade(); renderLocaisTrabalhoAgenda(); }
}

// leva direto ao item que gerou o alerta da unidade
function irParaInsightUnidade(nome, tipo){
  const tem = m=>(currentUser.modulos||[]).includes(m);
  const setar = (id, v, ev)=>{ const el = document.getElementById(id); if(el){ el.value = v; el.dispatchEvent(new Event(ev||"change",{bubbles:true})); } };
  if(tipo==="recente" || tipo==="muitos"){
    if(!tem("lancamento")) return;
    irParaView("lancamento");
    setTimeout(()=>{ setar("todos-ac-unidade", nome); try{ renderTodosAcidentes(); }catch(e){} }, 300);
  } else if(tipo==="demanda"){
    if(!tem("demandas")) return;
    irParaView("demandas");
    setTimeout(()=>{ setar("dem-f-unidade", nome); try{ renderVisaoAtivaDemandas(); }catch(e){} }, 300);
  } else if(tipo==="atestados"){
    if(!tem("saude")) return;
    irParaView("saude");
    setTimeout(()=>{ try{ mostrarSubSaude("registros"); }catch(e){} setar("sd-busca", nome, "input"); try{ renderSaudeRegistros(); }catch(e){} }, 350);
  } else if(tipo==="epi"){
    if(!tem("fichaEpi")) return;
    irParaView("fichaEpi");
  }
}
function alternarAtencaoInicio(){ inicioAtencaoExpandido = !inicioAtencaoExpandido; renderInicioAtencao(); }
function renderInicioAtencao(){
  const el = document.getElementById("inicio-atencao");
  if(!el) return;
  const minhas = unidadesDoUsuarioInicio();
  if(!minhas.length){
    el.innerHTML = vazioInicio("Nenhuma unidade está vinculada a você como técnico responsável. Peça a um administrador para vincular em Gestão › Unidades.");
    return;
  }
  const lista = lojasEmAtencao();
  if(!lista.length){ el.innerHTML = vazioInicio("✓ Tudo em dia: nenhuma das "+minhas.length+" unidade(s) precisa de atenção agora."); return; }
  const visiveis = inicioAtencaoExpandido ? lista : lista.slice(0, ATENCAO_LINHAS);
  el.innerHTML = '<div class="at-grid">' + visiveis.map(l=>{
    const q = JSON.stringify(l.nome).replace(/"/g,"&quot;");
    return `<div class="at-item" role="button" tabindex="0" title="Abrir o item que gerou o alerta" onclick="irParaInsightUnidade(${q},'${l.motivos[0].tipo}')">
      <span class="at-nome">${escHtml(l.nome)}${l.regional?` <small>${escHtml(l.regional)}</small>`:""}</span>
      <span class="at-motivos">${l.motivos.map(m=>`<span class="at-chip ${m.cor} clicavel" onclick="event.stopPropagation(); irParaInsightUnidade(${q},'${m.tipo}')">${escHtml(m.txt)} ›</span>`).join("")}</span>
      ${(currentUser.modulos||[]).includes("agenda") ? `<button type="button" class="at-agendar" onclick="event.stopPropagation(); agendarUnidadeInicio(${q})" title="Agendar visita nesta unidade">+ agendar visita</button>` : ""}
    </div>`; }).join("") + '</div>'
    + (lista.length>ATENCAO_LINHAS ? `<button type="button" class="in-link" style="margin-top:10px;" onclick="alternarAtencaoInicio()">${inicioAtencaoExpandido ? "Mostrar menos" : "Ver todas ("+lista.length+")"}</button>` : "");
}

let inicioMostrarResolvidos = false;
// avisos que o usuário enxerga: para todos, para ele, ou os manuais que ele mesmo enviou
function avisosVisiveis(){
  return AVISOS.filter(a=> !a.destinatarios || a.destinatarios.includes(currentUser.id) || (a.tipo==="manual" && a.criadoPor===currentUser.id));
}
function avisosPendentes(){ return avisosVisiveis().filter(a=>!AVISOS_RESOLVIDOS.has(a.id)); }
function renderInicioAvisos(){
  const el = document.getElementById("inicio-avisos");
  const acoes = document.getElementById("inicio-avisos-acoes");
  if(!el) return;
  const todos = avisosVisiveis();
  const pend = todos.filter(a=>!AVISOS_RESOLVIDOS.has(a.id));
  const res = todos.filter(a=>AVISOS_RESOLVIDOS.has(a.id));
  if(acoes){
    acoes.innerHTML =
      (ehAdminOuCoordenador() ? '<button type="button" class="in-link" onclick="abrirModalAviso()">+ Novo aviso</button>' : "")
      + (res.length ? `<button type="button" class="in-link" onclick="alternarResolvidosInicio()">${inicioMostrarResolvidos ? "Ocultar resolvidos" : "Resolvidos ("+res.length+")"}</button>` : "");
  }
  const lista = inicioMostrarResolvidos ? pend.concat(res.slice(0,30)) : pend;
  if(!lista.length){ el.innerHTML = vazioInicio(todos.length ? "✓ Nenhum aviso pendente." : "Nenhum aviso por enquanto."); return; }
  el.innerHTML = '<ul class="in-lista">' + lista.map(a=>{
    const resolvido = AVISOS_RESOLVIDOS.has(a.id);
    const meta = [a.tipo==="manual" ? (a.criadoPor===currentUser.id ? "enviado por você" : "de "+(a.criadoPorNome||"—")) : "plataforma", tempoRelativoNotif(a.criadoEm)].filter(Boolean).join(" · ");
    const acao = a.referenciaTipo ? ` clicavel" onclick="abrirAviso(${a.id})` : "";
    const podeExcluir = a.tipo==="manual" && (a.criadoPor===currentUser.id || ehAdministrador());
    return `<li class="in-item av-item ${resolvido?"resolvido":""}">
      <label class="av-check" title="${resolvido?"Marcar como pendente":"Marcar como resolvido"}"><input type="checkbox" ${resolvido?"checked":""} onchange="alternarAvisoResolvido(${a.id})" aria-label="Marcar aviso como resolvido"><span></span></label>
      <div class="in-item-corpo av-corpo${acao}">
        <span class="av-tit">${escHtml(a.titulo)}</span>
        ${a.mensagem ? `<span class="av-msg">${escHtml(a.mensagem)}</span>` : ""}
        ${a.referenciaTipo && ROTULO_REF_AVISO[a.referenciaTipo] ? `<span class="av-link">Abrir ${escHtml(ROTULO_REF_AVISO[a.referenciaTipo])} →</span>` : ""}
        <span class="av-meta">${escHtml(meta)}</span>
      </div>
      ${podeExcluir ? `<button type="button" class="av-del" title="Excluir aviso" onclick="excluirAviso(${a.id})">×</button>` : ""}
    </li>`;
  }).join("") + '</ul>';
}
function alternarResolvidosInicio(){ inicioMostrarResolvidos = !inicioMostrarResolvidos; renderInicioAvisos(); }
async function alternarAvisoResolvido(id){
  const jaResolvido = AVISOS_RESOLVIDOS.has(id);
  if(jaResolvido) AVISOS_RESOLVIDOS.delete(id); else AVISOS_RESOLVIDOS.add(id);
  renderInicio();
  const { error } = jaResolvido
    ? await sb.from("avisos_resolvidos").delete().eq("aviso_id", id).eq("usuario_id", currentUser.id)
    : await sb.from("avisos_resolvidos").insert({aviso_id:id, usuario_id:currentUser.id});
  if(error){
    console.error("[Supabase] avisos_resolvidos:", error);
    if(jaResolvido) AVISOS_RESOLVIDOS.add(id); else AVISOS_RESOLVIDOS.delete(id);
    renderInicio(); mostrarToast("Não foi possível salvar. Tente de novo.");
  }
}
const ROTULO_REF_AVISO = {agenda:"visita", demanda:"demanda", reuniao:"reunião", calendario:"evento", acidente:"acidentes", epi_admitidos:"fichas de EPI"};
function abrirAviso(id){
  const a = AVISOS.find(x=>x.id===id);
  if(!a) return;
  const tem = m => (currentUser.modulos||[]).includes(m);
  const t = a.referenciaTipo, rid = a.referenciaId;
  if(t==="acidente" && tem("lancamento")) irParaView("lancamento");
  else if(t==="epi_admitidos" && tem("fichaEpi") && typeof abrirFichaEpiNovosAdmitidos==="function") abrirFichaEpiNovosAdmitidos();
  else if(t==="agenda" && tem("agenda")){
    abrirModuloInicio("agenda","semanal");
    const v = AGENDA.find(x=>String(x.id)===String(rid));
    if(v){ semanaAgendaOffset = offsetSemanaDeData(v.data); renderGradeSemanal(); }
  }
  else if(t==="demanda" && tem("demandas")) abrirDemandaInicio(Number(rid));
  else if(t==="reuniao" && tem("reunioes")){ irParaView("reunioes"); setTimeout(()=>abrirModalReuniao(Number(rid)), 400); }
  else if(t==="calendario"){
    const ev = CAL_EVENTOS.find(e=>String(e.id)===String(rid));
    if(ev){ calModo = "semana"; calSemanaOffset = Math.round(diasEntreISO(dataISOLocal(segundaDaSemana(0)), dataISOLocal(segundaDoDia(ev.dataInicio)))/7); }
    irParaView("calendario");
  }
  else if(t) mostrarToast("Você não tem acesso a este módulo.");
}
// lista de itens para relacionar a um aviso
function preencherRefAviso(){
  const tipo = document.getElementById("av-ref-tipo").value, sel = document.getElementById("av-ref-id");
  const hojeISO = dataISOLocal(new Date()), d14 = new Date(); d14.setDate(d14.getDate()-14); const corte = dataISOLocal(d14);
  let itens = [];
  if(tipo==="agenda") itens = AGENDA.filter(v=>v.status!=="Rejeitado" && v.data>=corte).sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:0).slice(0,300)
    .map(v=>({id:v.id, txt: dataBR(v.data).slice(0,5)+" · "+(v.usuarioNome||"")+" · "+v.unidade+" · "+v.periodo}));
  else if(tipo==="demanda") itens = DEMANDAS.filter(d=>!d.entregueEm).slice(0,300).map(d=>({id:d.id, txt:"#"+d.id+" · "+String(d.demanda||"").slice(0,70)+(d.responsavel ? " · "+d.responsavel : "")}));
  else if(tipo==="reuniao") itens = REUNIOES.slice().sort((a,b)=>String(b.data).localeCompare(String(a.data))).slice(0,150).map(r=>({id:r.id, txt:(r.data ? formatarDataBR(r.data).slice(0,5)+" · " : "")+r.titulo}));
  else if(tipo==="calendario") itens = CAL_EVENTOS.filter(e=>e.dataFim>=corte).sort((a,b)=>a.dataInicio<b.dataInicio?-1:1).slice(0,300)
    .map(e=>({id:e.id, txt: dataBR(e.dataInicio).slice(0,5)+" · "+e.titulo+" · "+((USUARIOS.find(u=>u.id===e.usuarioId)||{}).nome||"")}));
  else if(tipo==="acidente") itens = ACIDENTES.slice().sort((a,b)=>String(b.data).localeCompare(String(a.data))).slice(0,80).map(a=>({id:a.id, txt:(a.data ? dataBR(a.data)+" · " : "")+a.loja+" · "+(a.motivo||"")}));
  sel.disabled = !tipo;
  sel.innerHTML = tipo ? '<option value="">Selecione...</option>'+itens.map(i=>`<option value="${i.id}">${escHtml(i.txt)}</option>`).join("") : '<option value="">—</option>';
}
async function excluirAviso(id){
  const a = AVISOS.find(x=>x.id===id);
  if(!a || !confirm("Excluir este aviso para todos os destinatários?")) return;
  const { error } = await sb.from("avisos").delete().eq("id", id);
  if(error){ alert("Erro ao excluir o aviso: "+error.message); return; }
  AVISOS = AVISOS.filter(x=>x.id!==id);
  renderInicio();
}
// cria um aviso (manual ou automático); "destinatarios" null = todos
async function criarAvisoPlataforma({tipo, titulo, mensagem, destinatarios, referenciaTipo, referenciaId}){
  const { data, error } = await sb.from("avisos").insert({
    tipo: tipo||"manual", titulo, mensagem: mensagem||"", destinatarios: destinatarios||null,
    referencia_tipo: referenciaTipo||null, referencia_id: referenciaId!=null ? String(referenciaId) : null,
    criado_por: currentUser.id, criado_por_nome: currentUser.nome
  }).select().single();
  if(error){ console.error("[Supabase] avisos:", error); return null; }
  const a = mapAvisoFromDb(data);
  const paraMim = !a.destinatarios || a.destinatarios.includes(currentUser.id);
  if(paraMim || a.tipo==="manual") AVISOS.unshift(a);
  return a;
}
// aviso automático: novo acidente → quem acompanha acidentes
async function avisarNovoAcidente(ac){
  if(!currentUser) return;
  const dest = USUARIOS.filter(u=>u.ativo!==false && u.id!==currentUser.id && (u.perfil==="Administrador" || u.perfil==="Coordenador" || (u.modulos||[]).includes("lancamento"))).map(u=>u.id);
  if(!dest.length) return;
  await criarAvisoPlataforma({tipo:"acidente", titulo:"Novo acidente registrado", mensagem:[ac.loja, ac.motivo, dataBR(ac.data)].filter(Boolean).join(" · "), destinatarios:dest, referenciaTipo:"acidente", referenciaId:ac.id});
  renderInicio();
}
// envio manual (Administrador / Coordenador)
function abrirModalAviso(){
  if(!ehAdminOuCoordenador()) return;
  document.getElementById("form-aviso").reset();
  document.getElementById("av-lista-usuarios").innerHTML = usuariosAtivosOrdenados().filter(u=>u.id!==currentUser.id)
    .map(u=>`<label><input type="checkbox" class="av-dest-user" value="${u.id}"> ${escHtml(u.nome)}</label>`).join("");
  alternarDestinatariosAviso();
  preencherRefAviso();
  document.getElementById("modal-aviso").style.display = "flex";
  setTimeout(()=>document.getElementById("av-titulo").focus(), 50);
}
function fecharModalAviso(){ document.getElementById("modal-aviso").style.display = "none"; }
function alternarDestinatariosAviso(){
  document.getElementById("av-lista-usuarios").style.display = document.getElementById("av-dest-alguns").checked ? "flex" : "none";
}
async function enviarAviso(ev){
  if(ev) ev.preventDefault();
  if(!ehAdminOuCoordenador()) return false;
  const titulo = document.getElementById("av-titulo").value.trim();
  const mensagem = document.getElementById("av-mensagem").value.trim();
  if(!titulo) return false;
  const alguns = document.getElementById("av-dest-alguns").checked;
  const escolhidos = [...document.querySelectorAll(".av-dest-user")].filter(c=>c.checked).map(c=>c.value);
  if(alguns && !escolhidos.length){ alert("Escolha pelo menos uma pessoa ou selecione “Todos os usuários”."); return false; }
  const refTipo = document.getElementById("av-ref-tipo").value, refId = document.getElementById("av-ref-id").value;
  if(refTipo && !refId){ alert("Escolha o item relacionado ou selecione “Nada”."); return false; }
  const a = await criarAvisoPlataforma({tipo:"manual", titulo, mensagem, destinatarios: alguns ? escolhidos : null, referenciaTipo: refTipo||null, referenciaId: refTipo ? refId : null});
  if(!a){ alert("Não foi possível enviar o aviso. Tente novamente."); return false; }
  const quem = alguns ? escolhidos : usuariosAtivosOrdenados().filter(u=>u.id!==currentUser.id).map(u=>u.id);
  for(const uid of quem){ await criarNotificacao(uid, "aviso", "Novo aviso: "+titulo, mensagem.slice(0,120), "aviso", a.id); }
  fecharModalAviso();
  renderInicio();
  mostrarToast("Aviso enviado para "+(alguns ? escolhidos.length+" pessoa"+(escolhidos.length===1?"":"s") : "todos os usuários")+".");
  return false;
}

/* =====================================================================
   AGENDA UNIFICADA (antigas Agenda + Calendário): no topo de cada dia o card da visita
   (local de trabalho, check-in/out, tipos principais de atividade) e, abaixo, eventos, reuniões e demandas.
   Privacidade: item "Oculto" (e todo bloqueio) aparece como "Ocupado" para os demais; só o dono,
   quem criou e o Administrador enxergam os detalhes.
   ===================================================================== */
const CAL_TIPOS = {
  "Evento":{cor:"#3b7dd8", curto:"Evento"},
  "Reunião":{cor:"#7a54c7", curto:"Reunião"},
  "Atividade":{cor:"#6b7a90", curto:"Atividade"},
  "Folga":{cor:"#e07b39", curto:"Folga"},
  "Férias":{cor:"#d6457a", curto:"Férias"},
  "Compensação de banco de horas":{cor:"#a8801a", curto:"Banco de horas"},
  "Ausência justificada":{cor:"#8e5bb5", curto:"Aus. justificada"},
  "Bloqueio":{cor:"#5f6368", curto:"Bloqueio"},
  "Ocupado":{cor:"#9aa0a6", curto:"Ocupado"}
};
const CAL_AUSENCIAS = ["Folga","Férias","Compensação de banco de horas","Ausência justificada"];
const CAL_TIPOS_EVENTO = ["Evento","Reunião","Atividade"];
const PERIODO_HORAS = {"Manhã":["08:00","12:00"], "Tarde":["13:00","18:00"], "Dia inteiro":["08:00","18:00"]};
let calModo = "semana", calVista = "tudo", calPessoas = null;
function segundaDoDia(iso){ const d = new Date(iso+"T00:00:00"); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d; }
function calPodeEditar(e){ return !!currentUser && (e.criadoPor===currentUser.id || e.usuarioId===currentUser.id || ehAdminOuCoordenador()); }
// quem enxerga os detalhes de um item: o dono, quem criou e o Administrador
function calPodeVerDetalhe(donoId, criadoPor){ return !!currentUser && (currentUser.perfil==="Administrador" || donoId===currentUser.id || (!!criadoPor && criadoPor===currentUser.id)); }
function calMascararEvento(e){
  if((!e.oculto && e.tipo!=="Bloqueio") || calPodeVerDetalhe(e.usuarioId, e.criadoPor)) return e;
  return {...e, titulo:"Ocupado", tipo:"Ocupado", local:"", descricao:"", criadoPorNome:"", bloqueia:true, _mask:true};
}
function visitaMascarada(v){
  return v; // visitas e locais de trabalho nunca ficam ocultos
  if(false && !v.oculto || calPodeVerDetalhe(v.usuarioId, null)) return v;
  return {...v, unidade:"Ocupado", motivo:"", checkin:null, checkout:null, _mask:true};
}
function eventosCalDoDia(uid, iso){ return CAL_EVENTOS.filter(e=>e.usuarioId===uid && e.dataInicio<=iso && e.dataFim>=iso).map(calMascararEvento); }
function reunioesDoDia(uid, iso){
  return REUNIOES.filter(r=>r.data===iso && r.status!=="Cancelada" && (r.participantes||[]).includes(uid))
    .sort((a,b)=>(a.horaInicio||"").localeCompare(b.horaInicio||""));
}
function demandasAgendadasDoDia(uid, iso){ return DEMANDAS.filter(d=>d.responsavelUsuarioId===uid && d.agendadoPara===iso && !d.entregueEm && !demandaConcluida(d)); }
// quem está de folga/férias/banco de horas no dia (usado também no Início)
function ausenciasDoUsuarioNoDia(uid, iso){
  return eventosCalDoDia(uid, iso).filter(e=>CAL_AUSENCIAS.includes(e.tipo)).map(e=>({tipo: CAL_TIPOS[e.tipo].curto + (e.diaInteiro ? "" : " ("+e.horaInicio+"–"+e.horaFim+")")}));
}
function calItensDoDia(uid, iso){
  const eventos = eventosCalDoDia(uid, iso).sort((a,b)=>(a.diaInteiro?"":a.horaInicio).localeCompare(b.diaInteiro?"":b.horaInicio));
  const demandas = demandasAgendadasDoDia(uid, iso);
  const reunioes = reunioesDoDia(uid, iso);
  const visitas = visitasAtivasDoDia(iso).filter(v=>v.usuarioId===uid);
  const bloq = eventos.filter(e=>e.bloqueia);
  let status = "livre";
  if(bloq.some(e=>e.diaInteiro)) status = bloq.some(e=>e.diaInteiro && CAL_AUSENCIAS.includes(e.tipo)) ? "aus" : "ocup";
  else if(bloq.length || demandas.length || reunioes.length) status = "parcial";
  return {eventos, demandas, reunioes, visitas, status};
}
const CAL_ROTULO_STATUS = {livre:"Livre", parcial:"Parcial", ocup:"Ocupado", aus:"Ausente"};
// ícones (foto ou iniciais) de quem participa de um lançamento
function calAvsHtml(uids){
  const u = [...new Set(uids.filter(Boolean))];
  if(!u.length) return "";
  return `<span class="cal-avs">${u.slice(0,4).map(id=>avatarMiniAgenda(id, (USUARIOS.find(x=>x.id===id)||{}).nome||"?")).join("")}${u.length>4?`<span class="cal-avs-mais">+${u.length-4}</span>`:""}</span>`;
}
function calParticipantesEvento(e){
  if(!e.grupoId) return [e.usuarioId];
  return [...new Set(CAL_EVENTOS.filter(x=>x.grupoId===e.grupoId && x.dataInicio===e.dataInicio && x.dataFim===e.dataFim && x.titulo===e.titulo).map(x=>x.usuarioId))];
}
function calChipEvento(e, comAutor){
  const cor = (CAL_TIPOS[e.tipo]||CAL_TIPOS["Evento"]).cor;
  const hr = e.diaInteiro ? "" : `<span class="hr">${escHtml(e.horaInicio)}</span>`;
  const av = e._mask ? calAvsHtml([e.usuarioId]) : calAvsHtml(calParticipantesEvento(e));
  if(e._mask) return `<span class="cal-it ocup" title="Ocupado${e.diaInteiro ? "" : " · "+escHtml(e.horaInicio+"–"+e.horaFim)}">${av}${hr}Ocupado</span>`;
  const dica = [e.tipo, e.titulo, e.diaInteiro ? "dia inteiro" : e.horaInicio+"–"+e.horaFim, e.local, e.oculto ? "oculto para os outros" : "", e.bloqueia ? "bloqueia a agenda" : "não bloqueia", e.criadoPorNome && e.criadoPor!==e.usuarioId ? "criado por "+e.criadoPorNome : ""].filter(Boolean).join(" · ");
  // ausência ocupa na grade semanal o espaço do período que tira do dia (manhã, tarde ou dia inteiro)
  let aus = "";
  if(CAL_AUSENCIAS.includes(e.tipo)){
    const hi = e.diaInteiro ? "" : (e.horaInicio||""), hf = e.diaInteiro ? "" : (e.horaFim||"");
    const parcial = hi && hf && (hf<="12:30" || hi>="12:30");
    aus = ` aus ${parcial ? "aus-meio" : "aus-inteiro"}`;
  }
  return `<button type="button" class="cal-it${aus}" style="background:${cor};${e.bloqueia?"":"opacity:.75;"}" title="${escHtml(dica)}" onclick="abrirModalEventoCal(${e.id})">${av}${hr}${e.oculto||e.tipo==="Bloqueio" ? "🔒 " : ""}${escHtml(e.titulo)}${e.descricao ? `<span class="cal-desc">${escHtml(e.descricao)}</span>` : ""}</button>`;
}
function calChipDemanda(d, comAutor){
  const av = calAvsHtml([d.responsavelUsuarioId]);
  const abre = (currentUser.modulos||[]).includes("demandas") ? ` onclick="abrirDemandaInicio(${d.id})"` : "";
  return `<button type="button" class="cal-it dem" title="Demanda #${d.id} agendada: ${escHtml(d.demanda)}"${abre}>${av}▣ #${d.id} ${escHtml(d.demanda)}</button>`;
}
function calChipReuniao(r, comAutor, uid){
  const tipo = REUNIOES_TIPOS.find(t=>t.id===r.tipoId);
  const av = calAvsHtml((r.participantes||[]).length ? r.participantes : [uid]);
  const hr = r.horaInicio ? `<span class="hr">${escHtml(r.horaInicio)}</span>` : "";
  const dica = ["Reunião"+(tipo?" · "+tipo.nome:""), r.titulo, r.horaInicio ? r.horaInicio+(r.horaFim?"–"+r.horaFim:"") : "", r.local, r.status].filter(Boolean).join(" · ");
  const abre = (currentUser.modulos||[]).includes("reunioes") || ehAdminOuCoordenador() ? ` onclick="abrirModalReuniao(${r.id})"` : "";
  return `<button type="button" class="cal-it reu" title="${escHtml(dica)}"${abre}>${av}${hr}◷ ${escHtml(r.titulo)}</button>`;
}
function calPessoasSelecionadas(){
  if(!calPessoas) calPessoas = [currentUser.id];
  const ativos = new Set(usuariosAtivosOrdenados().map(u=>u.id));
  calPessoas = calPessoas.filter(id=>ativos.has(id));
  if(!calPessoas.length) calPessoas = [currentUser.id];
  return calPessoas;
}
function calAdicionarPessoa(id){ if(id && !calPessoas.includes(id)) calPessoas.push(id); renderCalendario(); }
function calRemoverPessoa(id){ if(calPessoas.length>1) calPessoas = calPessoas.filter(x=>x!==id); renderCalendario(); }
function calEquipeToda(){ calPessoas = usuariosAtivosOrdenados().map(u=>u.id); renderCalendario(); }
function calSomenteEu(){ calPessoas = [currentUser.id]; renderCalendario(); }
function calMudarModo(m){ calModo = m; renderCalendario(); }
function calMudarVista(v){ calVista = v; renderCalendario(); }
function calNavegar(d){ if(calModo==="semana") semanaAgendaOffset += d; else mesAgendaOffset += d; renderCalendario(); }
function calHoje(){ semanaAgendaOffset = 0; mesAgendaOffset = 0; renderCalendario(); }
let calReunioesCarregadas = false;
async function carregarReunioesParaCalendario(){
  if(calReunioesCarregadas || REUNIOES.length){ calReunioesCarregadas = true; return; }
  const [rt, rr] = await Promise.all([
    sb.from("reunioes_tipos").select("*").order("ordem").order("id"),
    sb.from("reunioes").select("*").order("data", {ascending:false}).limit(1500)
  ]);
  if(rt.error || rr.error){ console.error("[Supabase] reuniões p/ calendário:", rt.error||rr.error); return; }
  REUNIOES_TIPOS = (rt.data||[]).map(t=>({id:t.id, nome:t.nome, cor:t.cor||"#a15a33"}));
  REUNIOES = (rr.data||[]).map(mapReuniaoFromDb);
  calReunioesCarregadas = true;
  renderCalendario(); if(typeof renderInicioCalendario==="function") renderInicioCalendario();
}
function initCalendario(){ renderCalendario(); carregarReunioesParaCalendario(); }
/* ---- menu "+" ---- */
function calFecharMenuMais(){
  const m = document.getElementById("cal-menu-mais"); if(m) m.classList.remove("aberto");
  const b = document.getElementById("cal-plus"); if(b) b.setAttribute("aria-expanded","false");
}
function calToggleMenuMais(e){
  if(e) e.stopPropagation();
  const m = document.getElementById("cal-menu-mais"); if(!m) return;
  const abrir = !m.classList.contains("aberto");
  const v = document.getElementById("cal-menu-visita"); if(v) v.style.display = (currentUser.modulos||[]).includes("agenda") ? "" : "none";
  m.classList.toggle("aberto", abrir);
  document.getElementById("cal-plus").setAttribute("aria-expanded", abrir ? "true" : "false");
}
document.addEventListener("click", (e)=>{ if(!e.target.closest("#cal-plus-wrap")) calFecharMenuMais(); });
document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") calFecharMenuMais(); });
function calMenuAcao(a){
  calFecharMenuMais();
  if(a==="evento") abrirModalEventoCal();
  else if(a==="tarefa"){
    if(!(currentUser.modulos||[]).includes("demandas")){ mostrarToast("Você não tem acesso ao módulo de Demandas."); return; }
    irParaView("demandas"); setTimeout(()=>abrirModalDemanda(), 250);
  }
  else if(a==="visita") abrirModalVisitaAgenda();
  else if(a==="ausencia") abrirModalAusencia("ausencia");
  else if(a==="bloqueio") abrirModalAusencia("bloqueio");
}
/* ---- bloqueios ---- */
function calBloqueioNoIntervalo(uid, ini, fim, diaInteiro, hi, hf){
  return CAL_EVENTOS.some(e=>e.tipo==="Bloqueio" && e.usuarioId===uid && e.dataInicio<=fim && e.dataFim>=ini
    && (e.diaInteiro || diaInteiro || (e.horaInicio<hf && hi<e.horaFim)));
}
function visitaEmBloqueio(uid, iso, periodo){
  const h = PERIODO_HORAS[periodo] || PERIODO_HORAS["Dia inteiro"];
  return calBloqueioNoIntervalo(uid, iso, iso, false, h[0], h[1]);
}
/* ---- grade ---- */
function renderCalendario(){
  const grade = document.getElementById("cal-grade");
  if(!grade || !currentUser) return;
  const pessoas = calPessoasSelecionadas();
  montarIndiceUnidadesAgenda();
  const vw = document.getElementById("view-calendario"); if(vw) vw.classList.toggle("modo-semana", calModo==="semana");
  document.querySelectorAll("#cal-vista .sw-btn").forEach(b=>{ const a = b.dataset.vista===calVista; b.classList.toggle("ativo", a); b.classList.toggle("sw-aprovado", a); });
  document.querySelectorAll("#cal-modo .sw-btn").forEach(b=>{ const a = b.dataset.modo===calModo; b.classList.toggle("ativo", a); b.classList.toggle("sw-aprovado", a); });
  const equipeToda = pessoas.length>1;
  document.getElementById("cal-pessoas").innerHTML =
    `<div class="switch-aprovacao"><button type="button" class="sw-btn ${equipeToda?"":"ativo sw-aprovado"}" onclick="calSomenteEu()">Só eu</button><button type="button" class="sw-btn ${equipeToda?"ativo sw-aprovado":""}" onclick="calEquipeToda()">Toda a equipe</button></div>`;
  document.getElementById("cal-legenda").style.display = "none";
  document.getElementById("cal-legenda").innerHTML =
    '<span style="margin-right:14px;"><b style="color:var(--verde-esc)">Livre</b> · <b style="color:#a8801a">Parcial</b> (eventos com horário, reuniões ou demandas) · <b style="color:#c8741e">Ocupado</b> (dia inteiro ou bloqueio) · <b style="color:var(--terracota)">Ausente</b> (folga, férias, banco de horas, ausência justificada)</span><span>🔒 oculto: os outros veem só “Ocupado”</span><br>'
    + legendaLuzesHtml();
  const hojeISO = dataISOLocal(new Date());
  if(calModo==="semana"){ renderCalSemana(grade, pessoas, hojeISO); renderAprovacaoSemanaAgenda(); }
  else { renderCalMes(grade, pessoas, hojeISO); const ap = document.getElementById("sem-aprovacao"); if(ap){ ap.style.display = "none"; ap.innerHTML = ""; } }
  atualizarBadgeConvites();
}
// bloco de um dia para uma pessoa: card(s) da visita no topo e, abaixo, os demais itens
function calChipsConvite(uid, iso){
  if(!currentUser || uid!==currentUser.id) return "";
  return convitesPendentesRecebidos().filter(c=>c.dataRef===iso).map(c=>`<button type="button" class="cal-it convite" title="Convite de ${escHtml(c.convidanteNome)} — clique para responder" onclick="abrirConvites()">✉ ${escHtml(c.titulo)}</button>`).join("");
}
function calConteudoDia(uid, iso, multi){
  const it = calItensDoDia(uid, iso);
  // evento/reunião de várias pessoas aparece uma vez só (na 1ª pessoa exibida), com os ícones de todos
  const exibidas = calPessoasSelecionadas();
  if(exibidas.length>1){
    const primeira = ps=>exibidas.find(x=>ps.includes(x));
    it.eventos = it.eventos.filter(e=>e._mask || !e.grupoId || primeira(calParticipantesEvento(e))===uid);
    it.reunioes = it.reunioes.filter(r=>!(r.participantes||[]).length || primeira(r.participantes)===uid);
  }
  const vis = linhasDiaAgendaHtml(iso, true, false, true, uid, !multi);
  return {it, html:
      (vis ? `<div class="cal-visitas">${vis}</div>` : "")
    + (calVista==="visitas" ? it.eventos.filter(e=>CAL_AUSENCIAS.includes(e.tipo)) : it.eventos).map(e=>calChipEvento(e,multi)).join("")
    + (calVista==="visitas" ? "" : it.reunioes.map(r=>calChipReuniao(r,multi,uid)).join("") + it.demandas.map(d=>calChipDemanda(d,multi)).join("") + calChipsConvite(uid, iso))};
}
function renderCalSemana(grade, pessoas, hojeISO){
  const seg = segundaDaSemana(semanaAgendaOffset);
  const dias = []; for(let i=0;i<5;i++){ const d = new Date(seg); d.setDate(seg.getDate()+i); dias.push(d); }
  document.getElementById("cal-label").textContent = dias[0].toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}).replace(".","") + " – " + dias[4].toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}).replace(/\./g,"");
  const nomes = ["Segunda","Terça","Quarta","Quinta","Sexta"];
  let html = `<div class="cal-grid" style="grid-template-columns:minmax(120px,.7fr) repeat(5,minmax(0,1fr));"><div class="cal-head"></div>`;
  dias.forEach((d,i)=>{ html += `<div class="cal-head ${dataISOLocal(d)===hojeISO?"hoje":""}">${nomes[i]}<small>${d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}</small></div>`; });
  pessoas.forEach(uid=>{
    const u = USUARIOS.find(x=>x.id===uid); if(!u) return;
    const rs = calResumoPessoa(uid, dias[0] ? dataISOLocal(dias[0]) : "", dataISOLocal(dias[4]));
    html += `<div class="cal-pessoa"><div class="cp-id">${avatarMiniAgenda(u.id,u.nome)}<span class="nm" title="${escHtml(u.nome)}">${escHtml(primeiroNomeAgenda(u.nome))}</span></div>
      <div class="cp-res"><div title="Demandas da semana: total e concluídas">Demandas <b>${rs.dem}</b><span class="c"> · ${rs.demConc} concl.</span></div>
      <div title="Visitas da semana: agendadas e realizadas (com check-in)">Visitas <b>${rs.vis}</b><span class="c"> · ${rs.visReal} realiz.</span></div></div></div>`;
    dias.forEach(d=>{
      const iso = dataISOLocal(d), c = calConteudoDia(uid, iso, false);
      html += `<div class="cal-cel ${c.it.status} ${iso===hojeISO?"hoje":""}" data-uid="${uid}" data-iso="${iso}">
        <button type="button" class="cal-add" onclick="abrirModalEventoCal(null,'${iso}','${uid}')" title="Novo evento neste dia" aria-label="Novo evento">+</button>
        <span class="cal-st">${CAL_ROTULO_STATUS[c.it.status]}</span>
        ${c.html}
      </div>`;
    });
  });
  grade.innerHTML = html + "</div>";
}
function renderCalMes(grade, pessoas, hojeISO){
  const hoje = new Date(), mesRef = new Date(hoje.getFullYear(), hoje.getMonth()+mesAgendaOffset, 1);
  document.getElementById("cal-label").textContent = maiusc1(mesRef.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}));
  const inicio = new Date(mesRef); while(inicio.getDay()===0||inicio.getDay()===6) inicio.setDate(inicio.getDate()+1); inicio.setDate(inicio.getDate()-((inicio.getDay()+6)%7));
  const ultimo = new Date(mesRef.getFullYear(), mesRef.getMonth()+1, 0); while(ultimo.getDay()===0||ultimo.getDay()===6) ultimo.setDate(ultimo.getDate()-1); ultimo.setDate(ultimo.getDate()+(5-ultimo.getDay()));
  const multi = pessoas.length>1;
  let html = `<div class="cal-grid" style="grid-template-columns:repeat(5,minmax(0,1fr));">` + ["Seg","Ter","Qua","Qui","Sex"].map(n=>`<div class="cal-head">${n}</div>`).join("");
  const ordem = {livre:0, parcial:1, ocup:2, aus:3};
  for(let d=new Date(inicio); d<=ultimo; d.setDate(d.getDate()+1)){
    if(d.getDay()===0||d.getDay()===6) continue;
    const iso = dataISOLocal(d), doMes = d.getMonth()===mesRef.getMonth();
    let status = "livre", blocos = [], total = 0;
    const MAX = multi ? 8 : 6;
    pessoas.forEach(uid=>{
      const it = calItensDoDia(uid, iso);
      if(!multi) status = it.status; else if(ordem[it.status]>ordem[status]) status = it.status;
      const v = linhasDiaAgendaHtml(iso, true, false, true, uid, !multi);
      const chips = [];
      // evento/reunião de várias pessoas aparece uma vez só (na 1ª pessoa exibida)
      const primeira = ps=>pessoas.find(x=>ps.includes(x));
      it.eventos.filter(e=>calVista!=="visitas" || CAL_AUSENCIAS.includes(e.tipo))
        .filter(e=>e._mask || !e.grupoId || primeira(calParticipantesEvento(e))===uid)
        .forEach(e=>chips.push(calChipEvento(e, multi)));
      if(calVista!=="visitas"){
        it.reunioes.filter(r=>!(r.participantes||[]).length || primeira(r.participantes)===uid).forEach(r=>chips.push(calChipReuniao(r, multi, uid)));
        it.demandas.forEach(d2=>chips.push(calChipDemanda(d2, multi)));
        { const cc = calChipsConvite(uid, iso); if(cc) chips.push(cc); }
      }
      if(!v && !chips.length) return;
      // limite de itens por célula: o que passar vira "+N mais"
      const cab = v ? 1 : 0, cabem = Math.max(0, MAX-total-cab);
      const mostra = chips.slice(0, cabem);
      total += cab + mostra.length;
      blocos.push({v, mostra, resto: chips.length-mostra.length});
    });
    const extra = blocos.reduce((n,b)=>n+b.resto,0);
    const corpoCel = blocos.map(b=>`<div class="cal-bloco-pessoa">${b.v ? `<div class="cal-visitas">${b.v}</div>` : ""}${b.mostra.join("")}</div>`).join("");
    const cls = multi ? (status==="aus"?"aus":"") : status;
    html += `<div class="cal-cel ${cls} ${doMes?"":"fora-mes"} ${iso===hojeISO?"hoje":""}" data-iso="${iso}" ${!multi?`data-uid="${pessoas[0]}"`:""}>
      <button type="button" class="cal-add" onclick="abrirModalEventoCal(null,'${iso}')" title="Novo evento neste dia" aria-label="Novo evento">+</button>
      <span class="cal-dia-num">${d.getDate()}</span>
      ${corpoCel}${extra>0 ? `<span class="cal-mais" title="Clique no dia para ver tudo">+${extra} mais</span>` : ""}
    </div>`;
  }
  grade.innerHTML = html + "</div>";
}


/* =====================================================================
   RESUMO do período (demandas e visitas) + JANELA DO DIA
   ===================================================================== */
function calIntervaloAtual(){
  if(calModo==="semana"){ const seg = segundaDaSemana(semanaAgendaOffset), fim = new Date(seg); fim.setDate(seg.getDate()+4); return [dataISOLocal(seg), dataISOLocal(fim)]; }
  const hoje = new Date(), m = new Date(hoje.getFullYear(), hoje.getMonth()+mesAgendaOffset, 1), u = new Date(m.getFullYear(), m.getMonth()+1, 0);
  return [dataISOLocal(m), dataISOLocal(u)];
}
function calEhLocalTrabalho(unidade){ return locaisTrabalhoAgenda().some(l=>normTxt(l)===normTxt(unidade)); }
function calResumoPessoa(uid, ini, fim){
  const noIntervalo = d=> d && d>=ini && d<=fim;
  const dem = DEMANDAS.filter(d=>d.responsavelUsuarioId===uid && (noIntervalo(d.dataLimite) || noIntervalo(d.agendadoPara) || noIntervalo(d.entregueEm && String(d.entregueEm).slice(0,10))));
  const demConc = dem.filter(d=>demandaConcluida(d) || d.entregueEm).length;
  const ag = AGENDA.filter(v=>v.usuarioId===uid && v.status!=="Rejeitado" && v.data>=ini && v.data<=fim);
  const vis = ag.filter(v=>!calEhLocalTrabalho(v.unidade));
  return {dem:dem.length, demConc, vis:vis.length, visReal:vis.filter(v=>v.checkin).length, locais:ag.length-vis.length};
}
function renderCalResumo(pessoas){
  const el = document.getElementById("cal-resumo"); if(!el) return;
  const [ini, fim] = calIntervaloAtual();
  const linhas = pessoas.map(uid=>({uid, ...calResumoPessoa(uid, ini, fim)}));
  const tot = linhas.reduce((a,l)=>({dem:a.dem+l.dem, demConc:a.demConc+l.demConc, vis:a.vis+l.vis, visReal:a.visReal+l.visReal, locais:a.locais+l.locais}), {dem:0,demConc:0,vis:0,visReal:0,locais:0});
  const card = (rot, a, b, sub)=>`<div class="cal-res-item"><span class="rot">${rot}</span><span class="val"><b>${a}</b>${b!==null?` <i>/</i> <b class="b">${b}</b>`:""}</span><span class="sub">${sub}</span></div>`;
  let html = `<div class="cal-res-topo"><h4>Resumo ${calModo==="semana"?"da semana":"do mês"}</h4><span class="sub">${dataBR(ini)} a ${dataBR(fim)} · ${pessoas.length>1?"equipe selecionada":"só eu"}</span></div>
    <div class="cal-res-grid">
      ${card("Demandas", tot.dem, tot.demConc, "total · concluídas")}
      ${card("Visitas", tot.vis, tot.visReal, "agendadas · realizadas (com check-in)")}
      ${card("Local de trabalho", tot.locais, null, "dias agendados")}
    </div>`;
  if(pessoas.length>1){
    html += `<div class="cal-res-pessoas">` + linhas.map(l=>{
      const u = USUARIOS.find(x=>x.id===l.uid); if(!u) return "";
      return `<div class="cal-res-p">${avatarMiniAgenda(u.id,u.nome)}<span class="nm">${escHtml(u.nome)}</span><span class="n" title="Demandas: total / concluídas">▣ ${l.dem}/${l.demConc}</span><span class="n" title="Visitas: agendadas / realizadas">📍 ${l.vis}/${l.visReal}</span></div>`;
    }).join("") + `</div>`;
  }
  el.innerHTML = html;
}
// clique no dia abre a janela com os detalhes
document.addEventListener("click", e=>{
  const cel = e.target.closest && e.target.closest("#cal-grade .cal-cel"); if(!cel) return;
  if(e.target.closest("button, a, select, input, [onclick]")) return;
  const iso = cel.dataset.iso; if(!iso) return;
  abrirDiaCal(iso, cel.dataset.uid || null);
});
let diaCalAtual = null;
function fecharDiaCal(){ document.getElementById("modal-dia-cal").style.display = "none"; }
function abrirDiaCal(iso, uidUnico){
  diaCalAtual = {iso, uid:uidUnico};
  renderDiaCal();
  document.getElementById("modal-dia-cal").style.display = "flex";
}
function diaCalSecao(titulo, itens){ return itens.length ? `<div class="dc-sec"><h5>${titulo} <span class="dc-n">${itens.length}</span></h5>${itens.join("")}</div>` : ""; }
let diaCalVistos = new Set();
function diaCalPessoaHtml(uid, iso){
  const u = USUARIOS.find(x=>x.id===uid); if(!u) return "";
  const it = calItensDoDia(uid, iso);
  const mascara = e=>e._mask;
  const visitas = it.visitas.map(v=>{
    if(v._mask) return `<div class="dc-item ocup"><span class="dc-t">Ocupado</span><span class="dc-s">${escHtml(v.periodo||"")}</span></div>`;
    const local = calEhLocalTrabalho(v.unidade);
    const st = {Aprovado:"ok", Pendente:"pend", Rejeitado:"rej"}[v.status] || "";
    const ci = v.checkin ? `<span class="dc-chip ok">Check-in ${escHtml(horaDoRegistroAgenda(v.checkin)||v.checkin.hora||"")}${linkGeo(v.checkin.geo,"Ver local do check-in")}</span>` : `<span class="dc-chip">Sem check-in</span>`;
    const co = v.checkout ? `<span class="dc-chip out">Check-out ${escHtml(horaDoRegistroAgenda(v.checkout)||v.checkout.hora||"")}${linkGeo(v.checkout.geo,"Ver local do check-out")}</span>` : "";
    return `<div class="dc-item ${local?"c-loc":"c-vis"}"><div class="dc-l1"><span class="dc-t">${calAvsHtml([v.usuarioId])} ${local?"🏢":"📍"} ${escHtml(v.unidade)}</span><span class="dc-chip ${st}">${escHtml(v.status||"")}</span></div>
      <div class="dc-s">${escHtml(v.periodo||"")} · ${local?"Local de trabalho":"Visita"}${v.oculto?" · 🔒 oculto":""}</div>
      <div class="dc-chips">${motivosSeparadosAgenda(v.motivo).map(m=>`<span class="dc-chip tipo">${escHtml(m)}</span>`).join("")}</div>
      ${v.descricao ? `<div class="dc-desc">${escHtml(v.descricao)}</div>` : ""}
      <div class="dc-chips">${ci}${co}</div>
      ${(ehAdministrador() || podeExcluirVisitaAgenda(v)) ? `<div class="dc-acoes">${ehAdministrador() ? `<button type="button" class="dc-ed" onclick="abrirEdicaoVisita(${v.id})">Editar</button> ` : ""}${podeExcluirVisitaAgenda(v) ? `<button type="button" class="dc-del" onclick="removerVisitaAgenda([${v.id}])">Excluir</button>` : ""}</div>` : ""}</div>`;
  });
  const unico = (chave)=>{ if(diaCalVistos.has(chave)) return false; diaCalVistos.add(chave); return true; };
  const evOk = it.eventos.filter(e=>e.tipo!=="Atividade" && (e._mask || !e.grupoId || unico("g"+e.grupoId+iso)));
  const ativ = it.eventos.filter(e=>e.tipo==="Atividade");
  const evHtml = e=>{
    if(e._mask) return `<div class="dc-item ocup"><span class="dc-t">Ocupado</span><span class="dc-s">${e.diaInteiro?"Dia inteiro":escHtml(e.horaInicio+"–"+e.horaFim)}</span></div>`;
    const cor = (CAL_TIPOS[e.tipo]||CAL_TIPOS["Evento"]).cor;
    return `<div class="dc-item clic" style="border-left-color:${cor};" onclick="fecharDiaCal(); abrirModalEventoCal(${e.id})"><div class="dc-l1"><span class="dc-t">${calAvsHtml(calParticipantesEvento(e))} ${e.oculto||e.tipo==="Bloqueio"?"🔒 ":""}${escHtml(e.titulo)}</span><span class="dc-chip" style="background:${cor}22; color:${cor};">${escHtml(e.tipo)}</span></div>
      <div class="dc-s">${e.diaInteiro?"Dia inteiro":escHtml(e.horaInicio+"–"+e.horaFim)}${e.local?" · "+escHtml(e.local):""}${e.bloqueia?" · bloqueia a agenda":""}</div>
      ${e.descricao?`<div class="dc-d">${escHtml(e.descricao)}</div>`:""}
      ${e.criadoPorNome && e.criadoPor!==e.usuarioId ? `<div class="dc-s">Criado por ${escHtml(e.criadoPorNome)}</div>`:""}</div>`;
  };
  const reu = it.reunioes.filter(r=>unico("r"+r.id+iso)).map(r=>{
    const tipo = REUNIOES_TIPOS.find(t=>t.id===r.tipoId);
    return `<div class="dc-item clic c-reu" onclick="fecharDiaCal(); abrirModalReuniao(${r.id})"><div class="dc-l1"><span class="dc-t">${calAvsHtml(r.participantes||[uid])} ◷ ${escHtml(r.titulo)}</span><span class="dc-chip">${escHtml(r.status||"")}</span></div>
      <div class="dc-s">${r.horaInicio?escHtml(r.horaInicio+(r.horaFim?"–"+r.horaFim:"")):"Horário a definir"}${tipo?" · "+escHtml(tipo.nome):""}${r.local?" · "+escHtml(r.local):""}</div>
      ${r.pauta?`<div class="dc-d">${escHtml(String(r.pauta).slice(0,220))}</div>`:""}</div>`;
  });
  const demCard = (d, rotulo)=>{
    const gasto = DEMANDAS_TEMPO[d.id] || 0;
    return `<div class="dc-item clic c-dem" onclick="fecharDiaCal(); abrirDemandaInicio(${d.id})"><div class="dc-l1"><span class="dc-t">▣ #${d.id} ${escHtml(d.demanda)}</span><span class="dc-chip" style="background:${corEtapaDemanda(d)}22; color:${corEtapaDemanda(d)};">${escHtml(nomeEtapaDemanda(d))}</span></div>
      <div class="dc-s">${rotulo}${d.unidade?" · "+escHtml(d.unidade):""}${d.prioridade?" · prioridade "+escHtml(d.prioridade):""}${d.dataLimite?" · prazo "+dataBR(d.dataLimite):""}</div>
      <div class="dc-s">${d.tempoEstimado?"Estimado "+escHtml(d.tempoEstimado)+" · ":""}Cronômetro: ${gasto?formatarDuracao(gasto):"sem registro"}</div></div>`;
  };
  const agendadas = it.demandas.map(d=>demCard(d,"Agendada para o dia"));
  const venc = DEMANDAS.filter(d=>d.responsavelUsuarioId===uid && d.dataLimite===iso && !d.entregueEm && !demandaConcluida(d) && d.agendadoPara!==iso).map(d=>demCard(d,"Vence neste dia"));
  const conv = typeof convitesDoDiaHtml==="function" ? convitesDoDiaHtml(uid, iso) : [];
  const corpo = diaCalSecao("Visitas e local de trabalho", visitas)
    + diaCalSecao("Eventos e ausências", evOk.map(evHtml))
    + diaCalSecao("Reuniões", reu)
    + diaCalSecao("Convites pendentes", conv)
    + diaCalSecao("Demandas do dia", agendadas.concat(venc))
    + diaCalSecao("Atividades registradas (cronômetro)", ativ.map(evHtml));
  return `<div class="dc-pessoa"><div class="dc-pessoa-topo">${avatarMiniAgenda(u.id,u.nome)}<b>${escHtml(primeiroNomeAgenda(u.nome))}</b><span class="dc-status ${it.status}">${CAL_ROTULO_STATUS[it.status]}</span></div>
    ${corpo || '<div class="dc-vazio">Nada lançado neste dia.</div>'}</div>`;
}
function renderDiaCal(){
  if(!diaCalAtual) return;
  const {iso, uid} = diaCalAtual;
  diaCalVistos = new Set();
  const pessoas = uid ? [uid] : calPessoasSelecionadas();
  const d = new Date(iso+"T00:00:00");
  const tit = maiusc1(d.toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long", year:"numeric"}));
  document.getElementById("dia-cal-corpo").innerHTML = `<div class="dc-topo"><div><span class="dc-sub">Detalhes do dia</span><h3>${tit}</h3></div><button type="button" class="dc-x" onclick="fecharDiaCal()" aria-label="Fechar">×</button></div>
    <div class="dc-corpo">${pessoas.map(u=>diaCalPessoaHtml(u, iso)).join("")}</div>
    <div class="dc-rod"><button type="button" class="btn-secondary" onclick="fecharDiaCal(); abrirModalEventoCal(null,'${iso}'${uid?",'"+uid+"'":""})">+ Novo evento neste dia</button><button type="button" class="btn-primary inline" onclick="fecharDiaCal()">Fechar</button></div>`;
}
document.addEventListener("keydown", e=>{ if(e.key==="Escape") fecharDiaCal(); });


