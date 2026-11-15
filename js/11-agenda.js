/* =====================================================================
   AGENDA — visitas da equipe, check-in/out, aprovação, indicadores e exportação
   ===================================================================== */

// Verifica se: pode aprovar agenda
function podeAprovarAgenda(user){ return !!user && (user.perfil==="Administrador" || user.perfil==="Coordenador"); }

// Inicializa: init agenda
function initAgenda(){
  popularSelectUnidadeAgenda();
  popularMotivosAgenda();
  atualizarSelecaoAgenda();
  renderInicio();
  renderGradeSemanal();
  renderGradeMensal();
}

// Preenche: popular motivos agenda
function popularMotivosAgenda(){ renderChipsDiasAgenda(); }

// Função do módulo: ag unidade padrao
function agUnidadePadrao(){ const el = document.getElementById("ag-unidade"); return el ? el.value : ""; }

// Função do módulo: ag periodo padrao
function agPeriodoPadrao(){ const el = document.getElementById("ag-periodo"); return (el && el.value) || "Manhã"; }

// Função do módulo: ag garantir config dia
function agGarantirConfigDia(iso){
  if(agDiasConfig[iso]) return;
  const outro = Object.keys(agDiasConfig).sort()[0];
  agDiasConfig[iso] = outro ? JSON.parse(JSON.stringify(agDiasConfig[outro])) : [{unidade:agUnidadePadrao(), periodo:agPeriodoPadrao(), motivos:[]}];
}

// Função do módulo: ag sincronizar dias
// um único cartão de atividades vale para todos os dias marcados: edita o do 1º dia e replica nos demais
function agSincronizarDias(){
  const dias = [...agDiasSelecionados].sort(); if(dias.length<2) return;
  const modelo = JSON.stringify(agDiasConfig[dias[0]]||[]);
  dias.slice(1).forEach(iso=>{ agDiasConfig[iso] = JSON.parse(modelo); });
}

// Função do módulo: ag set entrada
function agSetEntrada(iso, i, campo, valor){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const e = agDiasConfig[iso] && agDiasConfig[iso][i]; if(!e) return;
  e[campo] = valor;
  renderChipsDiasAgenda();
}

// Função do módulo: ag add motivo
function agAddMotivo(iso, i, valor){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const e = agDiasConfig[iso] && agDiasConfig[iso][i]; if(!e || !valor) return;
  if(!e.motivos.includes(valor)) e.motivos.push(valor);
  renderChipsDiasAgenda();
}

// Função do módulo: ag remover motivo
function agRemoverMotivo(iso, i, k){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const e = agDiasConfig[iso] && agDiasConfig[iso][i]; if(!e) return;
  e.motivos.splice(k,1); renderChipsDiasAgenda();
}

// Função do módulo: ag nova entrada
function agNovaEntrada(iso){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const lista = agDiasConfig[iso]; if(!lista) return;
  const usados = lista.map(e=>e.periodo);
  const periodo = usados.includes("Manhã") ? (usados.includes("Tarde") ? "Manhã" : "Tarde") : "Manhã";
  lista.push({unidade:agUnidadePadrao(), periodo, motivos:[]});
  renderChipsDiasAgenda();
}

// Função do módulo: ag remover entrada
function agRemoverEntrada(iso, i){
  iso = [...agDiasSelecionados].sort()[0] || iso;
  const lista = agDiasConfig[iso]; if(!lista || lista.length<2) return;
  lista.splice(i,1); renderChipsDiasAgenda();
}

// Função do módulo: ag copiar primeiro dia
function agCopiarPrimeiroDia(){
  const dias = [...agDiasSelecionados].sort();
  if(dias.length<2) return;
  const modelo = JSON.parse(JSON.stringify(agDiasConfig[dias[0]]||[]));
  dias.slice(1).forEach(iso=>{ agDiasConfig[iso] = JSON.parse(JSON.stringify(modelo)); });
  renderChipsDiasAgenda();
  mostrarToast("Atividades do primeiro dia copiadas para os demais.");
}

// Função do módulo: norm txt
function normTxt(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }

// Função do módulo: locais trabalho agenda
function locaisTrabalhoAgenda(){
  const nomes = UNIDADES.map(u=>u.nome);
  return LOCAIS_TRABALHO.map(l=>nomes.find(n=>normTxt(n)===normTxt(l)) || l);
}

// Função do módulo: unidades agenda opcoes
function unidadesAgendaOpcoes(){
  const locais = locaisTrabalhoAgenda();
  return [...locais, ...UNIDADES.map(u=>u.nome).filter(n=>!locais.includes(n))];
}

// Função do módulo: ag tipos atividade
function agTiposAtividade(){
  const base = TIPOS_ATIVIDADE_PRINCIPAIS.slice(), chaves = new Set(base.map(normTxt));
  AGENDA_MOTIVOS.slice().sort((a,b)=>a.ordem-b.ordem).forEach(m=>{ if(!chaves.has(normTxt(m.valor))){ chaves.add(normTxt(m.valor)); base.push(m.valor); } });
  return base;
}

// Desenha na tela: render locais trabalho agenda
function renderLocaisTrabalhoAgenda(){
  const box = document.getElementById("ag-locais"); if(!box) return;
  const atual = agUnidadePadrao();
  box.innerHTML = locaisTrabalhoAgenda().map(n=>`<button type="button" class="sw-btn ${n===atual?"ativo sw-aprovado":""}" data-l="${escHtml(n)}" onclick="agSetLocal(this.dataset.l)">${escHtml(n)}</button>`).join("");
}

// Função do módulo: ag aplicar unidade todos
function agAplicarUnidadeTodos(){
  const u = agUnidadePadrao();
  Object.values(agDiasConfig).forEach(lista=>lista.forEach(e=>{ e.unidade = u; }));
}

// Função do módulo: ag set local
function agSetLocal(nome){
  const sel = document.getElementById("ag-unidade"); if(sel) sel.value = nome;
  agAplicarUnidadeTodos();
  renderLocaisTrabalhoAgenda(); renderChipsDiasAgenda(); mostrarUltimaVisitaUnidade();
}

// Função do módulo: ag ao mudar unidade
function agAoMudarUnidade(){ agAplicarUnidadeTodos(); renderLocaisTrabalhoAgenda(); renderChipsDiasAgenda(); mostrarUltimaVisitaUnidade(); }

// Função do módulo: ag set tipo agenda
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

// Função do módulo: ag alvo visita
function agAlvoVisita(){
  const el = document.getElementById("ag-quem");
  if(el && el.value && ehAdminOuCoordenador()){ const u = USUARIOS.find(x=>x.id===el.value); if(u) return u; }
  return currentUser;
}

// Função do módulo: av face html
/* ---- seletor de pessoas só com avatar (foto ou iniciais) ---- */
function avFaceHtml(u){
  if(u.foto) return `<img class="av-face" src="${u.foto}" alt="">`;
  return `<span class="av-face" style="background:${corAvatarPorNome(u.nome)};">${escHtml(iniciaisTexto(u.nome))}</span>`;
}

// Função do módulo: av picker html
function avPickerHtml(users, cls, tipo, nomeGrupo, marcadoFn, desabilitado){
  return users.map(u=>{
    const rot = u.id===currentUser.id ? u.nome+" (eu)" : u.nome;
    return `<label class="av-pick" title="${escHtml(rot)}"><input type="${tipo}" class="${cls}" ${nomeGrupo?`name="${nomeGrupo}"`:""} value="${u.id}" ${marcadoFn(u)?"checked":""} ${desabilitado?"disabled":""}>${avFaceHtml(u)}<i class="av-ok">✓</i></label>`;
  }).join("");
}

// Função do módulo: av picker nomes
function avPickerNomes(boxId, nomeId){
  const box = document.getElementById(boxId), el = document.getElementById(nomeId); if(!box || !el) return;
  const nomes = [...box.querySelectorAll("input:checked")].map(i=>{ const u = USUARIOS.find(x=>x.id===i.value); return u ? primeiroNomeAgenda(u.nome) : ""; }).filter(Boolean);
  el.textContent = nomes.length ? nomes.join(", ") : "Ninguém selecionado";
}

// Preenche: preencher quem visita
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

// Abre: abrir modal visita agenda
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

// Fecha: fechar modal visita agenda
function fecharModalVisitaAgenda(){ const m = document.getElementById("modal-visita"); if(m) m.style.display = "none"; }

// Preenche: popular select unidade agenda
function popularSelectUnidadeAgenda(){
  const sel = document.getElementById("ag-unidade");
  if(!sel) return;
  const atual = sel.value;
  const locais = locaisTrabalhoAgenda();
  const lista = agTipoAgenda==="local" ? locais : UNIDADES.map(u=>u.nome).filter(n=>!locais.includes(n));
  sel.innerHTML = '<option value="">Selecione...</option>' + lista.map(n=>`<option>${escHtml(n)}</option>`).join("");
  sel.value = lista.includes(atual) ? atual : "";
}

// Troca para a sub-tela: mostrar sub acidentes
function mostrarSubAcidentes(sub){
  if(sub==="indicadores"){ irParaView("dashAcidentes"); return; }
  if(sub==="registro"){ irParaView("registroAnalise"); return; }
  popularFiltrosTodosAcidentes(); renderTodosAcidentes();
}

// Desenha na tela: render grade semanal
function renderGradeSemanal(){ renderCalendario(); }

// Desenha na tela: render grade mensal
function renderGradeMensal(){ renderCalendario(); }

// Troca para a sub-tela: mostrar sub agenda
function mostrarSubAgenda(sub){ calModo = sub==="mensal" ? "mes" : "semana"; irParaView("calendario"); return; }

// Troca para a sub-tela: mostrar sub agenda legado
function mostrarSubAgendaLegado(sub){
  document.querySelectorAll("#view-agenda .insp-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('#view-agenda .insp-tab[data-sub="'+sub+'"]').classList.add("active");
  document.querySelectorAll("#view-agenda .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("agenda-sub-"+sub).classList.add("active");
  if(sub==="semanal") renderGradeSemanal();
  if(sub==="mensal") renderGradeMensal();
}

// Função do módulo: data isolocal
// meses a partir do mês atual

function dataISOLocal(d){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

// Função do módulo: maiusc1
function maiusc1(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }

// Função do módulo: data br
function dataBR(iso){ return iso.split("-").reverse().join("/"); }

// Função do módulo: selecionar periodo agenda
function selecionarPeriodoAgenda(p){
  document.getElementById("ag-periodo").value = p;
  document.querySelectorAll("#ag-periodo-switch .sw-btn").forEach(b=>{
    const ativo = b.dataset.periodo===p;
    b.classList.toggle("ativo", ativo);
    b.classList.toggle("sw-aprovado", ativo);
  });
  renderChipsDiasAgenda(); mostrarUltimaVisitaUnidade();
}

// Desenha na tela: render calendario selecao agenda
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

// Função do módulo: ag reconstruir config
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

// Função do módulo: ag lista motivos
function agListaMotivos(alvo){ return alvo==="b" ? agMotivosBase : (agExtras[alvo] && agExtras[alvo].motivos); }

// Função do módulo: ag menu tipo
function agMenuTipo(alvo, ev){
  if(ev) ev.stopPropagation();
  agMenuTipoAberto = agMenuTipoAberto===String(alvo) ? null : String(alvo); renderChipsDiasAgenda();
}

// Função do módulo: ag alternar motivo
function agAlternarMotivo(alvo, valor){
  agMenuTipoAberto = null;
  const l = agListaMotivos(alvo); if(!l) return;
  const k = l.indexOf(valor); if(k>=0) l.splice(k,1); else l.push(valor);
  renderChipsDiasAgenda();
}

// Função do módulo: ag novo extra
function agNovoExtra(){
  const livres = [...agDiasSelecionados].sort().filter(d=>!agExtras.some(x=>x.dias.includes(d)));
  agExtras.push({dias:livres.length ? [livres[0]] : [], motivos:[], periodo:agPeriodoPadrao()});
  renderChipsDiasAgenda();
}

// Função do módulo: ag set periodo extra
function agSetPeriodoExtra(i, p){ if(agExtras[i]){ agExtras[i].periodo = p; renderChipsDiasAgenda(); } }

// Função do módulo: ag remover extra
function agRemoverExtra(i){ agExtras.splice(i,1); renderChipsDiasAgenda(); }

// Função do módulo: ag alternar dia extra
function agAlternarDiaExtra(i, iso){
  const x = agExtras[i]; if(!x) return;
  const k = x.dias.indexOf(iso);
  if(k>=0) x.dias.splice(k,1);
  else { agExtras.forEach(o=>{ const j = o.dias.indexOf(iso); if(j>=0) o.dias.splice(j,1); }); x.dias.push(iso); }
  renderChipsDiasAgenda();
}

// Função do módulo: ag chips tipo
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

// Desenha na tela: render chips dias agenda
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

// Atualiza: atualizar selecao agenda
function atualizarSelecaoAgenda(){ renderCalendarioSelecaoAgenda(); renderChipsDiasAgenda(); marcarSugestoesAgenda(); }

// Alterna (mostra/esconde): alternar dia agenda
function alternarDiaAgenda(iso){
  const d = new Date(iso+"T00:00:00");
  if(d.getDay()===0 || d.getDay()===6) return;
  if(agDiasSelecionados.has(iso)){ agDiasSelecionados.delete(iso); delete agDiasConfig[iso]; }
  else { agDiasSelecionados.add(iso); agGarantirConfigDia(iso); }
  atualizarSelecaoAgenda();
}

// Função do módulo: mudar mes cal agenda
function mudarMesCalAgenda(delta){ agCalMesOffset += delta; renderCalendarioSelecaoAgenda(); }

// Calcula: somar dias iso
function somarDiasISO(iso, n){ const d = new Date(iso+"T00:00:00"); d.setDate(d.getDate()+n); return dataISOLocal(d); }

// Função do módulo: dias entre iso
function diasEntreISO(a, b){ return Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000); }

// Função do módulo: semana chave iso
function semanaChaveISO(iso){ const d = new Date(iso+"T00:00:00"); d.setDate(d.getDate()-((d.getDay()+6)%7)); return dataISOLocal(d); }

// Função do módulo: eh reuniao agenda
function ehReuniaoAgenda(v){ return /reuniao/.test(String(v.motivo||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()); }

// Função do módulo: motivos separados agenda
function motivosSeparadosAgenda(txt){ return String(txt||"").split(/\s*\+\s*/).map(s=>s.trim()).filter(Boolean); }

// Função do módulo: padrao reunioes agenda
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

// Função do módulo: sugerir revisita agenda
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

// Função do módulo: rotulo prazo sugestao
function rotuloPrazoSugestao(s, vencida, temBase){
  if(!temBase) return "próximo dia livre";
  if(vencida) return "prazo já vencido";
  const d = s.diff;
  return d===0 ? "no prazo (30 dias)" : d<0 ? (-d)+" dia"+(d===-1?"":"s")+" antes do prazo" : d+" dia"+(d===1?"":"s")+" após o prazo";
}

// Desenha na tela: render ultima visita unidade agenda
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

// Desenha na tela: render sugestao revisita agenda
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

// Função do módulo: marcar sugestoes agenda
function marcarSugestoesAgenda(){
  document.querySelectorAll("#ag-sugestao .ag-sug-chip").forEach(b=>b.classList.toggle("sel", agDiasSelecionados.has(b.dataset.iso)));
}

// Função do módulo: usar sugestao agenda
function usarSugestaoAgenda(iso){
  agDiasSelecionados.add(iso); agGarantirConfigDia(iso);
  const hoje = new Date(), d = new Date(iso+"T00:00:00");
  agCalMesOffset = (d.getFullYear()-hoje.getFullYear())*12 + (d.getMonth()-hoje.getMonth());
  atualizarSelecaoAgenda();
}

// Função do módulo: mostrar ultima visita unidade
function mostrarUltimaVisitaUnidade(){
  const unidade = document.getElementById("ag-unidade").value;
  const grade = document.getElementById("ag-paineis");
  if(!grade) return;
  if(agTipoAgenda!=="visita" || !unidade || !currentUser){ grade.style.display = "none"; return; }
  grade.style.display = "grid";
  renderUltimaVisitaUnidadeAgenda(unidade);
  renderSugestaoRevisitaAgenda(unidade);
}

// Função do módulo: adicionar visita agenda
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

// Remove/cancela: remover visita agenda
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

// Define o rótulo/cor visual de status de: tag status agenda
function tagStatusAgenda(status){
  const cor = status==="Aprovado"?"concluido":status==="Rejeitado"?"notificado":"andamento";
  return `<span class="tag-status ${cor}">${status}</span>`;
}

// Função do módulo: fazer checkin
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

// Função do módulo: fazer checkout
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

// Função do módulo: interacao em andamento
function interacaoEmAndamento(){
  const ae = document.activeElement;
  if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return true;
  return [...document.querySelectorAll(".modal-bg")].some(m=>m.style.display && m.style.display!=="none");
}

// Função do módulo: recarregar operacionais
// tabelas que mudam no dia a dia
async function recarregarOperacionais(){
  const [rAc, rAg, rDem, rNot] = await Promise.all([
    sb.from("acidentes").select("*").order("id"),
    sb.from("agenda").select("*").order("id", {ascending:false}),
    sb.from("demandas").select("*").order("id", {ascending:false}),
    sb.from("notificacoes").select("*").order("id", {ascending:false}).limit(50),
  ]);
  if(!rAc.error) ACIDENTES = (rAc.data||[]).map(mapAcidenteFromDb);
  if(!rAg.error) AGENDA = (rAg.data||[]).map(mapAgendaFromDb);
  if(!rDem.error) DEMANDAS = (rDem.data||[]).map(mapDemandaFromDb);
  if(!rNot.error) NOTIFICACOES = (rNot.data||[]).map(n=>({id:n.id, usuarioId:n.usuario_id, tipo:n.tipo, titulo:n.titulo, mensagem:n.mensagem, referenciaTipo:n.referencia_tipo, referenciaId:n.referencia_id, lida:n.lida, dispensada:!!n.dispensada, criadoEm:n.created_at}));
  await carregarAvisosCalendarioEpi();
  await carregarSessaoAtiva(); await carregarTempoDemandas();
}

// Atualiza: atualizar dados
async function atualizarDados(origem){
  if(!currentUser || atualizandoDados) return;
  const manual = origem==="manual";
  if(!manual && (document.hidden || interacaoEmAndamento())) return;
  atualizandoDados = true;
  const naoLidasAntes = NOTIFICACOES.filter(n=>n.usuarioId===currentUser.id && !n.dispensada && !n.lida).length;
  const btn = document.getElementById("btn-atualizar");
  if(btn) btn.classList.add("girando");
  try{
    if(manual) await carregarDadosDoSupabase(); else await recarregarOperacionais();
    ultimaAtualizacao = Date.now();
    const eu = USUARIOS.find(u=>u.id===currentUser.id);
    if(eu && eu.ativo!==false){ currentUser = eu; montarMenu(); }
    renderNotificacoes();
    const naoLidasDepois = NOTIFICACOES.filter(n=>n.usuarioId===currentUser.id && !n.dispensada && !n.lida).length;
    if(naoLidasDepois>naoLidasAntes) mostrarToast("Você tem "+(naoLidasDepois-naoLidasAntes)+" notificaç"+((naoLidasDepois-naoLidasAntes)===1?"ão nova":"ões novas")+".");
    if(manual || VIEWS_RECARREGAVEIS_AUTO.includes(viewAtual)) irParaView(viewAtual);
    if(btn) btn.title = "Atualizar dados agora · última atualização às "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  }catch(e){
    console.error("[atualizarDados]", e);
    if(manual) mostrarToast("Não foi possível atualizar agora. Tente de novo.");
  }finally{
    atualizandoDados = false;
    if(btn) btn.classList.remove("girando");
  }
}

// Função do módulo: iniciar atualizacao automatica
function iniciarAtualizacaoAutomatica(){
  pararAtualizacaoAutomatica();
  timerAtualizacao = setInterval(()=>atualizarDados("auto"), ATUALIZACAO_AUTO_MS);
}

// Função do módulo: parar atualizacao automatica
function pararAtualizacaoAutomatica(){ if(timerAtualizacao){ clearInterval(timerAtualizacao); timerAtualizacao = null; } }

// Função do módulo: visitas pendentes agenda
/* ---- Aprovação de visitas: feita direto na Visão Semanal (Administrador/Coordenador) ---- */
function visitasPendentesAgenda(){ return AGENDA.filter(v=>v.status==="Pendente"); }

// Função do módulo: intervalo semana agenda
function intervaloSemanaAgenda(){
  const seg = segundaDaSemana(semanaAgendaOffset), sex = new Date(seg); sex.setDate(seg.getDate()+4);
  return [dataISOLocal(seg), dataISOLocal(sex)];
}

// Função do módulo: offset semana de data
function offsetSemanaDeData(iso){
  const d = new Date(iso+"T00:00:00");
  const seg = new Date(d); seg.setDate(d.getDate() - ((d.getDay()+6)%7));
  return Math.round((seg - segundaDaSemana(0)) / (7*86400000));
}

// Função do módulo: ir para semana pendente agenda
// Vai para a semana mais próxima com visita pendente. Se a semana mostrada já tem pendência, fica nela (a não ser que forcarOutra).
function irParaSemanaPendenteAgenda(forcarOutra){
  calModo = "semana";
  const pend = visitasPendentesAgenda().map(v=>v.data).sort();
  if(!pend.length) return false;
  const [ini, fim] = intervaloSemanaAgenda();
  if(!forcarOutra && pend.some(d=>d>=ini && d<=fim)){ renderGradeSemanal(); return true; }
  const alvo = pend.find(d=>d>fim) || [...pend].reverse().find(d=>d<ini);
  if(!alvo) return false;
  semanaAgendaOffset = offsetSemanaDeData(alvo);
  renderGradeSemanal();
  return true;
}

// Abre: abrir aprovacoes inicio
function abrirAprovacoesInicio(){
  abrirModuloInicio("agenda","semanal");
  irParaSemanaPendenteAgenda();
}

// Desenha na tela: render aprovacao semana agenda
function renderAprovacaoSemanaAgenda(){
  const el = document.getElementById("sem-aprovacao");
  if(!el) return;
  el.style.display = "none"; el.innerHTML = ""; return; // faixa removida: aprovação continua nos botões dos cards
  const pend = podeAprovarAgenda(currentUser) ? visitasPendentesAgenda() : [];
  if(!pend.length){ el.style.display = "none"; el.innerHTML = ""; return; }
  const [ini, fim] = intervaloSemanaAgenda();
  const naSemana = pend.filter(v=>v.data>=ini && v.data<=fim).length;
  const fora = pend.length - naSemana;
  el.style.display = "flex";
  el.innerHTML = `<span class="ag-aprov-txt"><b>${pend.length} visita${pend.length===1?"":"s"} aguardando aprovação</b> · ${naSemana ? naSemana+" nesta semana" : "nenhuma nesta semana"}</span>
    <span class="ag-aprov-acoes">
      ${naSemana ? '<button type="button" class="small-btn" onclick="aprovarSemanaAgenda()">✓ Aprovar todas desta semana</button>' : ""}
      ${fora ? `<button type="button" class="small-btn" onclick="irParaSemanaPendenteAgenda(true)">Ver ${fora} em outras semanas →</button>` : ""}
    </span>`;
}

// Função do módulo: botoes aprovar agenda html
// botões Aprovar / Rejeitar dentro do card da visita pendente (só para quem organiza)
function botoesAprovarAgendaHtml(vs){
  const ids = (vs||[]).filter(x=>x && x.status==="Pendente" && !x._mask).map(x=>x.id);
  if(!ids.length || !podeAprovarAgenda(currentUser)) return "";
  return `<span class="ag-aprov-btns">
    <button type="button" class="ag-ap sim" title="Aprovar visita" onclick="event.stopPropagation(); decidirVisitasAgenda([${ids.join(",")}],'Aprovado')">✓ Aprovar</button>
    <button type="button" class="ag-ap nao" title="Rejeitar visita" onclick="event.stopPropagation(); decidirVisitasAgenda([${ids.join(",")}],'Rejeitado')">Rejeitar</button>
  </span>`;
}

// Função do módulo: decidir visitas agenda
async function decidirVisitasAgenda(ids, status){
  if(!podeAprovarAgenda(currentUser)) return;
  const alvo = AGENDA.filter(v=>ids.includes(v.id) && v.status==="Pendente");
  if(!alvo.length) return;
  const aprovar = status==="Aprovado";
  if(!aprovar && !confirm(alvo.length>1 ? "Rejeitar estas "+alvo.length+" visitas?" : "Rejeitar esta visita?")) return;
  const { error } = await sb.from("agenda").update({status}).in("id", alvo.map(v=>v.id));
  if(error){ alert("Erro ao "+(aprovar?"aprovar":"rejeitar")+" visita: "+error.message); return; }
  alvo.forEach(v=>{ v.status = status; });
  notificarVisitas(alvo, aprovar ? (alvo.length>1 ? "Visitas aprovadas" : "Visita aprovada") : (alvo.length>1 ? "Visitas rejeitadas" : "Visita rejeitada"));
  renderInicio(); renderGradeSemanal(); renderGradeMensal();
  mostrarToast(alvo.length>1 ? alvo.length+(aprovar?" visitas aprovadas.":" visitas rejeitadas.") : (aprovar?"Visita aprovada.":"Visita rejeitada."));
}

// Função do módulo: aprovar semana agenda
async function aprovarSemanaAgenda(){
  const [ini, fim] = intervaloSemanaAgenda();
  const ids = visitasPendentesAgenda().filter(v=>v.data>=ini && v.data<=fim).map(v=>v.id);
  if(!ids.length) return;
  if(!confirm("Aprovar as "+ids.length+" visita(s) pendente(s) desta semana?")) return;
  await decidirVisitasAgenda(ids, "Aprovado");
}

// Função do módulo: aprovar visita
function aprovarVisita(id){ return decidirVisitasAgenda([id], "Aprovado"); }

// Função do módulo: rejeitar visita
function rejeitarVisita(id){ return decidirVisitasAgenda([id], "Rejeitado"); }

// Limpa: limpar filtros agenda indicadores
/* ---- Indicadores da Agenda (Administrador/Coordenador) ---- */
function limparFiltrosAgendaIndicadores(){
  document.getElementById("ag-ind-de").value = "";
  document.getElementById("ag-ind-ate").value = "";
  document.getElementById("ag-ind-profissional").value = "";
  renderIndicadoresAgenda();
}

// Verifica se: pode ver presenca agenda
// Horário e localização do check-in/out: só o próprio usuário e o Administrador enxergam
function podeVerPresencaAgenda(v){
  return !!currentUser && !!v && (currentUser.perfil==="Administrador" || v.usuarioId===currentUser.id);
}

// Função do módulo: link geo
function linkGeo(geo, rotulo){
  if(!geo || geo.lat==null || geo.lng==null) return "";
  return `<a class="ag-geo" href="https://www.google.com/maps?q=${encodeURIComponent(geo.lat)},${encodeURIComponent(geo.lng)}" target="_blank" rel="noopener" title="${escHtml(rotulo||"Ver local no mapa")}" aria-label="${escHtml(rotulo||"Ver local no mapa")}" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4.5A2.5 2.5 0 1 0 12 11.5 2.5 2.5 0 0 0 12 6.5Z"/></svg></a>`;
}

// Função do módulo: celula presenca agenda
function celulaPresencaAgenda(v, reg){
  if(!reg) return "—";
  return podeVerPresencaAgenda(v) ? escHtml(horaDoRegistroAgenda(reg) || reg.hora || "") : "Registrado";
}

// Desenha na tela: render indicadores agenda
function renderIndicadoresAgenda(){
  const podeVer = podeAprovarAgenda(currentUser);
  const semPermissao = document.getElementById("agenda-indicadores-sem-permissao");
  const conteudo = document.getElementById("agenda-indicadores-conteudo");
  if(!podeVer){
    semPermissao.style.display = "block";
    conteudo.style.display = "none";
    return;
  }
  semPermissao.style.display = "none";
  conteudo.style.display = "block";

  const selProf = document.getElementById("ag-ind-profissional");
  if(selProf && !selProf.dataset.preenchido){
    const nomes = [...new Set(AGENDA.map(v=>v.usuarioNome))].sort();
    selProf.innerHTML = '<option value="">Todos</option>' + nomes.map(n=>`<option>${n}</option>`).join("");
    selProf.dataset.preenchido = "1";
  }

  const de = document.getElementById("ag-ind-de").value;
  const ate = document.getElementById("ag-ind-ate").value;
  const prof = document.getElementById("ag-ind-profissional").value;

  const visitas = AGENDA.filter(v=>{
    if(v.status==="Rejeitado") return false;
    if(de && v.data < de) return false;
    if(ate && v.data > ate) return false;
    if(prof && v.usuarioNome !== prof) return false;
    return true;
  }).sort((a,b)=> a.data<b.data?1:-1);

  const qtdCheckin = visitas.filter(v=>v.checkin).length;
  const qtdCheckout = visitas.filter(v=>v.checkout).length;
  const comRelatorio = visitas.filter(v=> INSPECOES.some(i=>i.unidade===v.unidade && i.data===v.data)).length;

  document.getElementById("agi-kpi-total").textContent = visitas.length;
  document.getElementById("agi-kpi-total-foot").textContent = visitas.length? "No período selecionado" : "—";
  document.getElementById("agi-kpi-checkin").textContent = qtdCheckin;
  document.getElementById("agi-kpi-checkout").textContent = qtdCheckout;
  document.getElementById("agi-kpi-relatorios").textContent = comRelatorio;
  document.getElementById("agi-kpi-relatorios-foot").textContent = visitas.length? Math.round(comRelatorio/visitas.length*100)+"% das visitas com relatório" : "—";

  const porTecnico = {};
  const porMotivo = {};
  const porLoja = {};
  visitas.forEach(v=>{
    porTecnico[v.usuarioNome] = (porTecnico[v.usuarioNome]||0)+1;
    const motivo = v.motivo || "Não informado";
    porMotivo[motivo] = (porMotivo[motivo]||0)+1;
    porLoja[v.unidade] = (porLoja[v.unidade]||0)+1;
  });

  const tecnicoOrdenado = Object.entries(porTecnico).sort((a,b)=>b[1]-a[1]);
  criarChart("agendaTecnico", "chart-agenda-tecnico", {
    type:"bar",
    data:{ labels:tecnicoOrdenado.map(t=>t[0]), datasets:[{label:"Visitas", data:tecnicoOrdenado.map(t=>t[1]), backgroundColor:"#00733f", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const motivoOrdenado = Object.entries(porMotivo).sort((a,b)=>b[1]-a[1]).slice(0,10);
  criarChart("agendaMotivo", "chart-agenda-motivo", {
    type:"bar",
    data:{ labels:motivoOrdenado.map(m=>m[0]), datasets:[{label:"Visitas", data:motivoOrdenado.map(m=>m[1]), backgroundColor:"#faa61a", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const lojaOrdenada = Object.entries(porLoja).sort((a,b)=>b[1]-a[1]).slice(0,10);
  criarChart("agendaLoja", "chart-agenda-loja", {
    type:"bar",
    data:{ labels:lojaOrdenada.map(l=>l[0]), datasets:[{label:"Visitas", data:lojaOrdenada.map(l=>l[1]), backgroundColor:"#a15a33", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const tbody = document.getElementById("tbl-agenda-todas-visitas");
  if(!visitas.length){
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--areia-esc);padding:16px;">Nenhuma visita para os filtros selecionados.</td></tr>';
    return;
  }
  tbody.innerHTML = visitas.map(v=>{
    const temRelatorio = INSPECOES.find(i=>i.unidade===v.unidade && i.data===v.data);
    return `<tr>
      <td>${v.data.split("-").reverse().join("/")}</td>
      <td>${v.periodo}</td>
      <td>${v.usuarioNome}</td>
      <td>${v.unidade}</td>
      <td>${v.motivo}</td>
      <td>${celulaPresencaAgenda(v, v.checkin)}</td>
      <td>${celulaPresencaAgenda(v, v.checkout)}</td>
      <td>${temRelatorio ? `<span class="tag-status concluido">Feito</span> <button type="button" class="small-btn" onclick="verDetalheInspecao(${temRelatorio.id})">Ver</button>` : '<span class="tag-status notificado">Não feito</span>'}</td>
    </tr>`;
  }).join("");
}

// Função do módulo: segunda da semana
/* ---- Visão semanal ---- */
function segundaDaSemana(offsetSemanas){
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const dia = hoje.getDay();
  const diffParaSegunda = (dia===0? -6 : 1-dia);
  hoje.setDate(hoje.getDate()+diffParaSegunda+offsetSemanas*7);
  return hoje;
}

// Função do módulo: mudar semana agenda
function mudarSemanaAgenda(delta){ semanaAgendaOffset += delta; renderGradeSemanal(); }

// Função do módulo: ir semana atual agenda
function irSemanaAtualAgenda(){ semanaAgendaOffset = 0; renderGradeSemanal(); }

// Função do módulo: data ultima visita anterior
function dataUltimaVisitaAnterior(usuarioId, unidade, dataAtual){
  const anteriores = AGENDA.filter(v=>v.usuarioId===usuarioId && v.unidade===unidade && v.status!=="Rejeitado" && v.data<dataAtual);
  if(!anteriores.length) return null;
  return anteriores.reduce((max,v)=> v.data>max?v.data:max, anteriores[0].data);
}

// Função do módulo: primeiro nome agenda
/* ---- Visões semanal e mensal: uma linha por usuário, dividida em Manhã | Tarde (ou barra inteira = Dia inteiro) ---- */
function primeiroNomeAgenda(n){ return String(n||"").trim().split(/\s+/)[0]; }

// Função do módulo: montar indice unidades agenda
// unidade -> datas (ordenadas) das visitas aprovadas
function montarIndiceUnidadesAgenda(){
  const m = new Map();
  AGENDA.forEach(v=>{ if(v.status!=="Aprovado") return; if(!m.has(v.unidade)) m.set(v.unidade, new Set()); m.get(v.unidade).add(v.data); });
  agIndiceUnidades = new Map([...m].map(([u,s])=>[u,[...s].sort()]));
}

// Função do módulo: luz ultima visita
// dias entre esta visita e a visita aprovada anterior à mesma unidade (qualquer usuário)
function luzUltimaVisita(v){
  const datas = agIndiceUnidades.get(v.unidade) || [];
  let ant = null;
  for(const d of datas){ if(d<v.data) ant = d; else break; }
  if(!ant) return {cls:"nenhuma", ant:null, dias:null};
  const dias = Math.round((new Date(v.data+"T00:00:00")-new Date(ant+"T00:00:00"))/86400000);
  return {cls: dias<=LUZ_VERDE_DIAS ? "verde" : dias<=LUZ_AMARELO_DIAS ? "amarelo" : "vermelho", ant, dias};
}

// Função do módulo: legenda luzes html
function legendaLuzesHtml(){
  return `<span class="agm-luzes">
    <span><i class="ag-luz verde"></i>Verde: visita até ${LUZ_VERDE_DIAS} dias</span>
    <span><i class="ag-luz amarelo"></i>Amarela: ${LUZ_VERDE_DIAS+1} a ${LUZ_AMARELO_DIAS} dias</span>
    <span><i class="ag-luz vermelho"></i>Vermelha: loja sem visita há mais de ${LUZ_AMARELO_DIAS} dias</span></span>`;
}

// Função do módulo: linhas dia agenda
function linhasDiaAgenda(iso, uidFiltro){
  const porUsuario = new Map();
  visitasAtivasDoDia(iso).filter(v=>!uidFiltro || v.usuarioId===uidFiltro).forEach(v=>{
    const k = v.usuarioId || v.usuarioNome;
    if(!porUsuario.has(k)) porUsuario.set(k, {usuarioId:v.usuarioId, nome:v.usuarioNome, dia:[], manha:[], tarde:[]});
    const g = porUsuario.get(k);
    (v.periodo==="Dia inteiro" ? g.dia : v.periodo==="Manhã" ? g.manha : g.tarde).push(v);
  });
  const linhas = [];
  [...porUsuario.values()].sort((a,b)=>String(a.nome).localeCompare(String(b.nome),"pt-BR")).forEach(g=>{
    const base = {usuarioId:g.usuarioId, nome:g.nome};
    g.dia.forEach(v=>linhas.push({...base, inteira:v, par:null}));
    // manhã + tarde na MESMA unidade viram uma linha inteira
    const usadas = new Set(), manhaRest = [];
    g.manha.forEach(m=>{
      const t = g.tarde.find(x=>!usadas.has(x) && x.unidade===m.unidade);
      if(t){ usadas.add(t); linhas.push({...base, inteira:m, par:t}); } else manhaRest.push(m);
    });
    const tardeRest = g.tarde.filter(t=>!usadas.has(t));
    const n = Math.max(manhaRest.length, tardeRest.length);
    for(let i=0;i<n;i++) linhas.push({...base, manha:manhaRest[i]||null, tarde:tardeRest[i]||null});
  });
  return linhas;
}

// Abre: abrir edicao visita
// edição de visita / local de trabalho (somente Administrador)
function abrirEdicaoVisita(id){
  if(!ehAdministrador()){ alert("Somente o Administrador pode editar."); return; }
  const v = AGENDA.find(x=>x.id===id); if(!v) return;
  fecharEdicaoVisita();
  const unidades = [...new Set([...UNIDADES.map(u=>u.nome), ...locaisTrabalhoAgenda(), v.unidade])];
  const mot = String(v.motivo||"").split("+").map(x=>x.trim()).filter(Boolean);
  const ov = document.createElement("div");
  ov.id = "modal-edit-visita"; ov.className = "ev-bg";
  ov.innerHTML = `<div class="ev-card" role="dialog" aria-label="Editar visita">
    <div class="ev-topo"><b>Editar visita / local de trabalho</b><button type="button" class="ev-x" onclick="fecharEdicaoVisita()" aria-label="Fechar">×</button></div>
    <div class="ev-pessoa">${avatarMiniAgenda(v.usuarioId, v.usuarioNome)} <span>${escHtml(primeiroNomeAgenda(v.usuarioNome))}</span></div>
    <label>Unidade / local<select id="ev-unidade">${unidades.map(u=>`<option ${u===v.unidade?"selected":""}>${escHtml(u)}</option>`).join("")}</select></label>
    <div class="ev-linha">
      <label>Data<input type="date" id="ev-data" value="${v.data}"></label>
      <label>Período<select id="ev-periodo">${["Manhã","Tarde","Dia inteiro"].map(p=>`<option ${p===v.periodo?"selected":""}>${p}</option>`).join("")}</select></label>
      <label>Status<select id="ev-status">${["Aprovado","Pendente"].map(p=>`<option ${p===v.status?"selected":""}>${p}</option>`).join("")}</select></label>
    </div>
    <label>Descrição<textarea id="ev-descricao" rows="2" maxlength="500" placeholder="Detalhes da visita ou do dia de trabalho">${escHtml(v.descricao||"")}</textarea></label>
    <div class="ev-tit">Atividades</div>
    <div class="ev-motivos">${TIPOS_ATIVIDADE_PRINCIPAIS.map(m=>`<label class="ev-chk"><input type="checkbox" value="${m}" ${mot.includes(m)?"checked":""}> ${m}</label>`).join("")}</div>
    <div class="ev-acoes"><button type="button" class="btn-secondary" onclick="fecharEdicaoVisita()">Cancelar</button><button type="button" class="btn-primary inline" onclick="salvarEdicaoVisita(${v.id})">Salvar</button></div>
  </div>`;
  ov.addEventListener("mousedown", e=>{ if(e.target===ov) fecharEdicaoVisita(); });
  document.body.appendChild(ov);
}

// Fecha: fechar edicao visita
function fecharEdicaoVisita(){ const o = document.getElementById("modal-edit-visita"); if(o) o.remove(); }

// Salva no banco: salvar edicao visita
async function salvarEdicaoVisita(id){
  if(!ehAdministrador()) return;
  const v = AGENDA.find(x=>x.id===id); if(!v) return;
  const motivo = [...document.querySelectorAll("#modal-edit-visita .ev-motivos input:checked")].map(c=>c.value).join(" + ");
  const novo = { unidade:document.getElementById("ev-unidade").value, data:document.getElementById("ev-data").value, periodo:document.getElementById("ev-periodo").value, status:document.getElementById("ev-status").value, motivo, descricao:(document.getElementById("ev-descricao").value||"").trim() || null };
  if(!novo.data){ alert("Informe a data."); return; }
  const conflito = AGENDA.some(x=>x.id!==id && x.usuarioId===v.usuarioId && x.data===novo.data && x.unidade===novo.unidade && (x.periodo===novo.periodo || x.periodo==="Dia inteiro" || novo.periodo==="Dia inteiro"));
  if(conflito){ alert("Este usuário já tem visita nessa unidade, nesse dia e período."); return; }
  const { data: atualizadas, error } = await sb.from("agenda").update(novo).eq("id", id).select("id");
  if(error){ alert("Erro ao salvar: "+error.message); return; }
  if(!atualizadas || !atualizadas.length){ alert("Não foi possível salvar: sem permissão."); return; }
  Object.assign(v, {...novo, descricao: novo.descricao||""});
  fecharEdicaoVisita();
  renderInicio(); renderGradeSemanal(); renderGradeMensal();
  if(typeof renderCalendario==="function") renderCalendario();
  if(typeof diaCalAtual!=="undefined" && diaCalAtual && document.getElementById("modal-dia-cal").style.display!=="none") renderDiaCal();
  mostrarToast("Visita atualizada.");
}

// Verifica se: pode excluir visita agenda
function podeExcluirVisitaAgenda(v){ return !!currentUser && !v._mask && (v.usuarioId===currentUser.id || ehAdminOuCoordenador()); }

// Função do módulo: hora do registro agenda
function horaDoRegistroAgenda(reg){
  const m = reg && reg.hora ? String(reg.hora).match(/(\d{2}:\d{2})/) : null;
  return m ? m[1] : "";
}

// Função do módulo: presenca visitas agenda
// devolve a etiqueta pronta (HTML) com "✓ 08:10 📍 – 11:30 📍", ou "" se não há registro ou o usuário não pode ver
function presencaVisitasAgenda(vs){
  const partes = vs.filter(podeVerPresencaAgenda).map(x=>{
    const i = horaDoRegistroAgenda(x.checkin), o = horaDoRegistroAgenda(x.checkout);
    if(!i) return "";
    return "✓ "+escHtml(i)+linkGeo(x.checkin.geo, "Ver local do check-in no mapa")
      + (o ? " – "+escHtml(o)+linkGeo(x.checkout && x.checkout.geo, "Ver local do check-out no mapa") : "");
  }).filter(Boolean);
  return partes.length ? `<span class="ag-tag ok">${partes.join(" &nbsp;")}</span>` : "";
}

// Função do módulo: presenca partes agenda
// check-in: horário ao lado do local (com o ícone do mapa); check-out: linha vermelha com o horário
function presencaPartesAgenda(vs){
  const lista = vs.filter(podeVerPresencaAgenda);
  const comIn = lista.find(x=>horaDoRegistroAgenda(x.checkin));
  const comOut = [...lista].reverse().find(x=>horaDoRegistroAgenda(x.checkout));
  const entrada = comIn ? `<span class="ag-hora" title="Check-in">${escHtml(horaDoRegistroAgenda(comIn.checkin))}${linkGeo(comIn.checkin.geo, "Ver local do check-in no mapa")}</span>` : "";
  const saida = comOut ? `<div class="ag-saida"><span>Check-out ${escHtml(horaDoRegistroAgenda(comOut.checkout))}</span>${linkGeo(comOut.checkout.geo, "Ver local do check-out no mapa")}</div>` : "";
  return {entrada, saida};
}

// Função do módulo: dica visita agenda
function dicaVisitaAgenda(vs){
  return vs.map(v=>v.usuarioNome+" · "+v.unidade+" · "+v.periodo+(v.motivo?" · "+v.motivo:"")+(v.status==="Pendente"?" (pendente de aprovação)":"")+(v.descricao?"\n"+v.descricao:"")).join("\n");
}

// Função do módulo: fatia agenda html
// vs = [visita] ou [manhã, tarde] (mesma unidade); detalhe = visão semanal (mostra motivo, período, presença e botão excluir)
function fatiaAgendaHtml(vs, cls, detalhe, luz){
  if(!vs || !vs.length || !vs[0]) return `<div class="ag-fatia ${cls} vazia"></div>`;
  vs = vs.filter(Boolean);
  const v = vs[0];
  const pendente = vs.some(x=>x.status==="Pendente");
  if(vs.every(x=>calEhLocalTrabalho(x.unidade))) cls += " local";
  let bolinha = "";
  if(luz){
    const l = luzUltimaVisita(v);
    const dica = l.ant ? "Visita anterior à unidade: "+dataBR(l.ant)+" ("+l.dias+" dia"+(l.dias===1?"":"s")+" antes)" : "Sem visita anterior registrada para esta unidade";
    bolinha = `<i class="ag-luz ${l.cls}" title="${escHtml(dica)}"></i>`;
  }
  let corpo = `<div class="ag-un-linha">${bolinha}<span class="ag-un">${escHtml(v.unidade)}</span></div>`;
  if(detalhe){
    const rotulo = vs.length>1 ? "Manhã e tarde" : v.periodo;
    const motivos = [...new Set(vs.map(x=>x.motivo).filter(Boolean))].join(" · ");
    const pr = presencaPartesAgenda(vs);
    corpo = `<span class="ag-rot">${escHtml(rotulo)}</span><div class="ag-un-linha">${typeof calAvsHtml==="function" ? calAvsHtml([v.usuarioId]) : ""}${bolinha}<span class="ag-un">${v.oculto && !v._mask ? "🔒 " : ""}${escHtml(v.unidade)}</span>${pr.entrada}</div>`
      + (motivos ? `<span class="ag-mot">${escHtml(motivos)}</span>` : "")
      + (v.descricao ? `<span class="ag-desc" title="${escHtml(v.descricao)}">${escHtml(v.descricao)}</span>` : "")
      + (pendente ? '<span class="ag-tag pend">Pendente</span>' : "")
      + pr.saida
      + botoesAprovarAgendaHtml(vs);
  }
  const editar = detalhe && vs.length===1 && ehAdministrador() && !v._mask
    ? `<button type="button" class="ag-fatia-ed" title="Editar visita" aria-label="Editar visita" onclick="event.stopPropagation(); abrirEdicaoVisita(${v.id})">✎</button>` : "";
  const excluir = detalhe && vs.every(podeExcluirVisitaAgenda)
    ? `<button type="button" class="ag-fatia-x" title="Remover ${vs.length>1?"estas visitas":"esta visita"}" aria-label="Remover visita" onclick="event.stopPropagation(); removerVisitaAgenda([${vs.map(x=>x.id).join(",")}])">×</button>` : "";
  return `<div class="ag-fatia ${cls} ${pendente?'pendente':''} ${v._mask?'mask':''}" title="${escHtml(dicaVisitaAgenda(vs))}">${corpo}${editar}${excluir}</div>`;
}

// Função do módulo: linhas dia agenda html
function linhasDiaAgendaHtml(iso, detalhe, comNome, luz, uidFiltro, semTopo){
  return linhasDiaAgenda(iso, uidFiltro).map(l=>{
    const fatias = l.inteira ? fatiaAgendaHtml([l.inteira, l.par], "inteira", detalhe, luz)
                             : fatiaAgendaHtml([l.manha], "manha", detalhe, luz) + fatiaAgendaHtml([l.tarde], "tarde", detalhe, luz);
    if(detalhe){
      return `<div class="ag-bloco">
        ${semTopo ? "" : `<div class="ag-bloco-topo">${avatarMiniAgenda(l.usuarioId, l.nome)}<span class="ag-linha-nome" title="${escHtml(l.nome)}">${escHtml(l.nome)}</span></div>`}
        <div class="ag-fatias det">${fatias}</div>
      </div>`;
    }
    const nome = comNome ? `<span class="ag-linha-nome lg" title="${escHtml(l.nome)}">${escHtml(primeiroNomeAgenda(l.nome))}</span>` : "";
    return `<div class="ag-linha">${avatarMiniAgenda(l.usuarioId, l.nome)}${nome}<div class="ag-fatias">${fatias}</div></div>`;
  }).join("");
}

// Função do módulo: avatar mini agenda
function avatarMiniAgenda(usuarioId, nomeFallback){
  const u = USUARIOS.find(x=>x.id===usuarioId);
  const nome = u ? u.nome : (nomeFallback||"");
  if(u && u.foto) return `<img src="${u.foto}" class="agm-av" alt="" title="${escHtml(nome)}">`;
  return `<span class="agm-av" title="${escHtml(nome)}" style="background:${corAvatarPorNome(nome)};">${escHtml(iniciaisTexto(nome))}</span>`;
}

// Função do módulo: visitas ativas do dia
function visitasAtivasDoDia(iso){
  return AGENDA.filter(v=>v.data===iso && v.status!=="Rejeitado").map(visitaMascarada)
    .sort((a,b)=> (ORDEM_PERIODO_AGENDA[a.periodo]??9)-(ORDEM_PERIODO_AGENDA[b.periodo]??9) || String(a.usuarioNome).localeCompare(String(b.usuarioNome),"pt-BR"));
}

// Desenha na tela: render grade semanal legado
/* ---- Visão semanal ---- */
function renderGradeSemanalLegado(){
  const wrap = document.getElementById("grade-semanal-agenda");
  if(!wrap) return;
  montarIndiceUnidadesAgenda();
  const lg = document.getElementById("sem-luzes"); if(lg) lg.innerHTML = legendaLuzesHtml();
  const seg = segundaDaSemana(semanaAgendaOffset);
  const dias = [];
  for(let i=0;i<5;i++){ const d=new Date(seg); d.setDate(seg.getDate()+i); dias.push(d); }
  renderAprovacaoSemanaAgenda();
  const hojeISO = dataISOLocal(new Date());

  const nomesDias = ["Segunda","Terça","Quarta","Quinta","Sexta"];
  let html = '<div class="agenda-semana-grid">';
  dias.forEach((d,i)=>{
    const ehHoje = dataISOLocal(d)===hojeISO;
    html += `<div class="agenda-semana-cell agenda-semana-head ${ehHoje?'hoje':''}">${nomesDias[i]}<small>${d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}</small></div>`;
  });
  dias.forEach(d=>{
    const iso = dataISOLocal(d);
    const linhas = linhasDiaAgendaHtml(iso, true, false, true);
    html += `<div class="agenda-semana-cell${iso===hojeISO?" hoje-col":""}">${linhas ? '<div class="ag-linhas">'+linhas+'</div>' : '<span class="avc-vazio">—</span>'}</div>`;
  });
  html += '</div>';
  wrap.innerHTML = html;
}

// Exporta: exportar imagem semana
/* ---- imagem de compartilhamento da semana: retângulo padrão 16:9 (1920x1080), com visitas, locais e ausências ---- */
// baixa um "print" da agenda exatamente como está na tela (semana ou mês, com os filtros atuais)
async function exportarImagemSemana(){
  const card = document.querySelector("#view-calendario .cal-card");
  if(!card || typeof html2canvas!=="function"){ return exportarImagemSemanaCanvas(); }
  const btn = document.getElementById("cal-btn-exportar"); if(btn) btn.disabled = true;
  const view = document.getElementById("view-calendario");
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  const rotulo = (document.getElementById("cal-label")||{}).textContent || "";
  const quem = calPessoasSelecionadas().map(id=>(USUARIOS.find(u=>u.id===id)||{}).nome).filter(Boolean).map(n=>primeiroNomeAgenda(n)).join(", ");
  // cópia fora da tela, com o zoom da página compensado, para o print sair em tamanho real
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:absolute; left:-30000px; top:0; background:#f1e5d9; padding:18px 20px 20px; zoom:"+(1/zoom)+"; width:"+Math.round(card.getBoundingClientRect().width/zoom)+"px;";
  const tit = document.createElement("div");
  tit.style.cssText = "font:700 20px Arial,sans-serif; color:#54412f; margin:0 0 12px;";
  tit.innerHTML = "Agenda · "+escHtml(rotulo)+(quem ? ' <span style="font-weight:400; font-size:14px; color:#8a735b;">· '+escHtml(quem)+"</span>" : "");
  wrap.appendChild(tit);
  const clone = card.cloneNode(true);
  clone.querySelectorAll(".cal-add, .ag-fatia-x, .ag-fatia-ed, [onclick*=\"calToggleMenuMais\"]").forEach(e=>e.remove());
  wrap.appendChild(clone);
  view.appendChild(wrap);
  try{
    const canvas = await html2canvas(wrap, {backgroundColor:"#f1e5d9", scale:2, useCORS:true, logging:false});
    const nome = "agenda_"+dataISOLocal(new Date())+".png";
    await new Promise(res=>canvas.toBlob(blob=>{
      if(blob){
        const link = document.createElement("a"); link.download = nome; link.href = URL.createObjectURL(blob); link.click();
        setTimeout(()=>URL.revokeObjectURL(link.href), 5000);
        mostrarToast("Print da agenda baixado.");
      }
      res();
    }, "image/png"));
  }catch(e){
    console.error(e); mostrarToast("Não foi possível gerar o print; baixando a versão resumida.");
    await exportarImagemSemanaCanvas();
  }finally{
    wrap.remove(); if(btn) btn.disabled = false;
  }
}

// Exporta: exportar imagem semana canvas
async function exportarImagemSemanaCanvas(){
  const pessoas = calPessoasSelecionadas().map(id=>USUARIOS.find(u=>u.id===id)).filter(Boolean);
  const seg = segundaDaSemana(semanaAgendaOffset);
  const dias = []; for(let i=0;i<5;i++){ const d = new Date(seg); d.setDate(seg.getDate()+i); dias.push(d); }
  const nomesDias = ["Segunda","Terça","Quarta","Quinta","Sexta"];
  const W = 1920, H = 1080, topo = 84, cabH = 56, rodape = 44, nomeW = 230, margem = 24;
  const corpoH = H - topo - cabH - rodape - margem;
  const rowH = Math.max(60, Math.min(190, Math.floor(corpoH / Math.max(1, pessoas.length))));
  const esc = Math.max(.62, Math.min(1.15, rowH/130));
  const colW = Math.floor((W - margem*2 - nomeW) / 5);
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const cortar = (t, larg)=>{ t = String(t||""); if(ctx.measureText(t).width<=larg) return t; while(t.length>1 && ctx.measureText(t+"…").width>larg) t = t.slice(0,-1); return t+"…"; };
  ctx.fillStyle = "#fdfaf5"; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = "#00512c"; ctx.fillRect(0,0,W,topo);
  ctx.fillStyle = "#fff"; ctx.font = "bold 34px Arial"; ctx.textBaseline = "middle";
  ctx.fillText("Agenda da semana", margem, topo/2);
  ctx.font = "26px Arial"; ctx.textAlign = "right";
  ctx.fillText(dias[0].toLocaleDateString("pt-BR")+" a "+dias[4].toLocaleDateString("pt-BR"), W-margem, topo/2); ctx.textAlign = "left";
  const y0 = topo + 10;
  dias.forEach((d,i)=>{
    const x = margem + nomeW + i*colW;
    ctx.fillStyle = dataISOLocal(d)===dataISOLocal(new Date()) ? "#d6efe0" : "#f5ede1"; ctx.fillRect(x, y0, colW-4, cabH-6);
    ctx.fillStyle = "#2b2118"; ctx.font = "bold 22px Arial"; ctx.textAlign = "center";
    ctx.fillText(nomesDias[i]+" "+d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}), x+(colW-4)/2, y0+(cabH-6)/2); ctx.textAlign = "left";
  });
  montarIndiceUnidadesAgenda();
  pessoas.forEach((u,r)=>{
    const y = y0 + cabH + r*rowH;
    ctx.fillStyle = r%2 ? "#fffdf9" : "#fbf7ef"; ctx.fillRect(margem, y, W-margem*2, rowH-4);
    ctx.fillStyle = corAvatarPorNome(u.nome); ctx.beginPath(); ctx.arc(margem+30, y+(rowH-4)/2, 18*Math.max(.8,esc), 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold "+Math.round(15*Math.max(.8,esc))+"px Arial"; ctx.textAlign = "center"; ctx.fillText(iniciaisTexto(u.nome), margem+30, y+(rowH-4)/2+1); ctx.textAlign = "left";
    ctx.fillStyle = "#2b2118"; ctx.font = "bold "+Math.round(19*Math.max(.85,esc))+"px Arial";
    ctx.fillText(cortar(u.nome, nomeW-80), margem+62, y+(rowH-4)/2);
    dias.forEach((d,i)=>{
      const iso = dataISOLocal(d), x = margem + nomeW + i*colW, w = colW-4;
      const itens = [];
      eventosCalDoDia(u.id, iso).filter(e=>CAL_AUSENCIAS.includes(e.tipo)).forEach(e=>itens.push({t:"AUSENTE", s:CAL_TIPOS[e.tipo].curto+(e.diaInteiro?"":" · "+e.horaInicio+"–"+e.horaFim), bg:"#fbe9e3", bar:"#d6457a", cor:"#a3294f"}));
      visitasAtivasDoDia(iso).filter(v=>v.usuarioId===u.id).forEach(v=>{
        const m = v._mask, pend = v.status==="Pendente";
        itens.push({t:(m?"OCUPADO":v.unidade)+" · "+v.periodo, s:m?"":v.motivo, bg:m?"#eceff1":pend?"#fdf0de":"#e7f5ed", bar:m?"#9aa0a6":pend?"#f99d33":"#00b262", cor:"#2b2118"});
      });
      eventosCalDoDia(u.id, iso).filter(e=>e._mask).forEach(e=>itens.push({t:"OCUPADO"+(e.diaInteiro?"":" · "+e.horaInicio+"–"+e.horaFim), s:"", bg:"#eceff1", bar:"#9aa0a6", cor:"#5f6368"}));
      const ih = Math.round(48*esc), gap = 4, cabem = Math.max(1, Math.floor((rowH-8+gap)/(ih+gap)));
      const mostrar = itens.length>cabem ? itens.slice(0,cabem-1) : itens;
      if(!itens.length){ ctx.fillStyle = "#f0e9db"; ctx.fillRect(x+6, y+(rowH-4)/2-1, 14, 2); return; }
      mostrar.forEach((it,k)=>{
        const iy = y+4+k*(ih+gap);
        ctx.fillStyle = it.bg; ctx.fillRect(x, iy, w, ih); ctx.fillStyle = it.bar; ctx.fillRect(x, iy, 5, ih);
        ctx.fillStyle = it.cor; ctx.font = "bold "+Math.round(15*esc)+"px Arial"; ctx.textBaseline = "alphabetic";
        ctx.fillText(cortar(it.t, w-18), x+12, iy+Math.round(ih*(it.s?.40:.62)));
        if(it.s){ ctx.fillStyle = "#a15a33"; ctx.font = Math.round(13*esc)+"px Arial"; ctx.fillText(cortar(it.s, w-18), x+12, iy+Math.round(ih*.78)); }
        ctx.textBaseline = "middle";
      });
      if(itens.length>cabem){ ctx.fillStyle = "#6b5b47"; ctx.font = "bold "+Math.round(13*esc)+"px Arial"; ctx.fillText("+"+(itens.length-mostrar.length)+" mais", x+8, y+4+mostrar.length*(ih+gap)+ih/2); }
    });
  });
  ctx.fillStyle = "#6b5b47"; ctx.font = "15px Arial"; ctx.textBaseline = "middle";
  ctx.fillText("Verde: visita aprovada  ·  Laranja: pendente  ·  Rosa: ausente  ·  Cinza: ocupado", margem, H-rodape/2-4);
  const nome = "agenda_semana_"+dataISOLocal(dias[0])+".png";
  canvas.toBlob(async blob=>{
    if(!blob) return;
    const file = new File([blob], nome, {type:"image/png"});
    const link = document.createElement("a"); link.download = nome; link.href = URL.createObjectURL(blob); link.click();
    setTimeout(()=>URL.revokeObjectURL(link.href), 5000);
    mostrarToast("Imagem da semana baixada.");
  }, "image/png");
}

// Exporta: exportar imagem semana legado
function exportarImagemSemanaLegado(){
  const seg = segundaDaSemana(semanaAgendaOffset);
  const dias = [];
  for(let i=0;i<5;i++){ const d=new Date(seg); d.setDate(seg.getDate()+i); dias.push(d); }
  const nomesDias = ["Segunda","Terça","Quarta","Quinta","Sexta"];
  montarIndiceUnidadesAgenda();
  const linhasPorDia = dias.map(d=>linhasDiaAgenda(dataISOLocal(d)));

  const colW = 280, headerH = 46, linhaH = 40, margem = 10;
  const maior = Math.max(1, ...linhasPorDia.map(l=>l.length));
  const corpoH = Math.max(80, 12 + maior*linhaH);
  const canvas = document.createElement("canvas");
  canvas.width = margem*2 + colW*5;
  canvas.height = 56 + headerH + corpoH + 36;
  const ctx = canvas.getContext("2d");
  const cortar = (txt, larg)=>{ let t = String(txt||""); if(ctx.measureText(t).width<=larg) return t; while(t.length>1 && ctx.measureText(t+"…").width>larg) t = t.slice(0,-1); return t+"…"; };

  ctx.fillStyle = "#fdfaf5"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#00512c"; ctx.fillRect(0,0,canvas.width,48);
  ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial";
  ctx.fillText("Agenda da Semana — "+dias[0].toLocaleDateString("pt-BR")+" a "+dias[4].toLocaleDateString("pt-BR"), 14, 30);

  const y = 56;
  dias.forEach((d,i)=>{
    const x = margem + i*colW;
    ctx.fillStyle = "#f5ede1"; ctx.fillRect(x, y, colW-4, headerH-4);
    ctx.fillStyle = "#2b2118"; ctx.font = "bold 13px Arial";
    ctx.fillText(nomesDias[i]+" "+d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}), x+10, y+27);
    ctx.strokeStyle = "#e5d6be"; ctx.strokeRect(x, y+headerH, colW-4, corpoH-4);
    linhasPorDia[i].forEach((l,li)=>{
      const ly = y+headerH+8+li*linhaH;
      // avatar
      ctx.fillStyle = corAvatarPorNome(l.nome); ctx.beginPath(); ctx.arc(x+18, ly+13, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 7px Arial"; ctx.textAlign = "center";
      ctx.fillText(iniciaisTexto(l.nome), x+18, ly+15.5); ctx.textAlign = "left";
      // nome
      ctx.fillStyle = "#2b2118"; ctx.font = "bold 10.5px Arial";
      ctx.fillText(cortar(primeiroNomeAgenda(l.nome), 40), x+32, ly+14);
      // fatias
      const fx = x+76, fw = colW-4-76-8, meia = (fw-3)/2;
      const bloco = (vs, bx, bw)=>{
        vs = (vs||[]).filter(Boolean);
        if(!vs.length){ ctx.fillStyle = "#f6f0e5"; ctx.fillRect(bx, ly-3, bw, 34); return; }
        const v = vs[0], pend = vs.some(x=>x.status==="Pendente");
        ctx.fillStyle = pend ? "#fdf0de" : "#e7f5ed"; ctx.fillRect(bx, ly-3, bw, 34);
        ctx.fillStyle = pend ? "#f99d33" : "#00b262"; ctx.fillRect(bx, ly-3, 3, 34);
        const lz = luzUltimaVisita(v);
        ctx.fillStyle = {verde:"#00b262", amarelo:"#f5b301", vermelho:"#ee3135", nenhuma:"#b8aa94"}[lz.cls];
        ctx.beginPath(); ctx.arc(bx+11, ly+6, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#2b2118"; ctx.font = "bold 10.5px Arial";
        ctx.fillText(cortar(v.unidade, bw-26), bx+19, ly+9);
        ctx.fillStyle = "#a15a33"; ctx.font = "9px Arial";
        const mot = [...new Set(vs.map(x=>x.motivo).filter(Boolean))].join(" · ");
        ctx.fillText(cortar((vs.length>1?"Manhã e tarde · ":(vs[0].periodo==="Dia inteiro"?"Dia inteiro · ":""))+mot, bw-14), bx+7, ly+22);
      };
      if(l.inteira) bloco([l.inteira, l.par], fx, fw);
      else { bloco([l.manha], fx, meia); bloco([l.tarde], fx+meia+3, meia); }
    });
  });
  ctx.fillStyle = "#6b5b47"; ctx.font = "10.5px Arial";
  ctx.fillText("Metade esquerda: manhã  ·  direita: tarde  ·  barra inteira: dia inteiro  ·  laranja: pendente  ·  luz: verde até "+LUZ_VERDE_DIAS+" d, amarela até "+LUZ_AMARELO_DIAS+" d, vermelha acima de "+LUZ_AMARELO_DIAS+" d sem visita", margem+4, canvas.height-14);

  const link = document.createElement("a");
  link.download = "agenda_semana_"+dataISOLocal(dias[0])+".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  mostrarToast("Imagem da semana exportada.");
}

// Função do módulo: mudar mes agenda
/* ---- Visão mensal: todos os dados de cada visita direto no dia (sem precisar clicar) ---- */
function mudarMesAgenda(delta){ mesAgendaOffset += delta; renderGradeMensal(); }

// Função do módulo: ir mes atual agenda
function irMesAtualAgenda(){ mesAgendaOffset = 0; renderGradeMensal(); }

// Função do módulo: visita mes html
// vs = [visita] ou [manhã, tarde] (mesma unidade)
function visitaMesHtml(vs){
  vs = vs.filter(Boolean);
  const v = vs[0];
  const pendente = vs.some(x=>x.status==="Pendente");
  const rotulo = vs.length>1 ? "Manhã e tarde" : v.periodo;
  const motivos = [...new Set(vs.map(x=>x.motivo).filter(Boolean))].join(" · ");
  const l = luzUltimaVisita(v);
  const dica = l.ant ? "Visita anterior à unidade: "+dataBR(l.ant)+" ("+l.dias+" dia"+(l.dias===1?"":"s")+" antes)" : "Sem visita anterior registrada para esta unidade";
  const ant = dataUltimaVisitaAnterior(v.usuarioId, v.unidade, v.data);
  const pres = presencaVisitasAgenda(vs);
  return `<div class="agm-v${pendente?" pendente":""}" title="${escHtml(dicaVisitaAgenda(vs))}">
    <div class="agm-v-topo"><span class="ag-rot">${escHtml(rotulo)}</span>${pendente ? '<span class="ag-tag pend">Pendente</span>' : ""}</div>
    <div class="ag-un-linha"><i class="ag-luz ${l.cls}" title="${escHtml(dica)}"></i><span class="agm-v-un">${escHtml(v.unidade)}</span></div>
    ${motivos ? `<div class="agm-v-mot">${escHtml(motivos)}</div>` : ""}
    <div class="agm-v-ult">${ant ? "Últ. visita: "+dataBR(ant) : "1ª visita a esta unidade"}</div>
    ${pres}
  </div>`;
}

// Função do módulo: dia mes agenda html
// um bloco por pessoa (avatar + nome) com todas as visitas dela no dia
function diaMesAgendaHtml(iso){
  const pessoas = new Map();
  linhasDiaAgenda(iso).forEach(l=>{
    const k = l.usuarioId || l.nome;
    if(!pessoas.has(k)) pessoas.set(k, {usuarioId:l.usuarioId, nome:l.nome, grupos:[]});
    const g = pessoas.get(k).grupos;
    if(l.inteira) g.push([l.inteira, l.par]); else { if(l.manha) g.push([l.manha]); if(l.tarde) g.push([l.tarde]); }
  });
  return [...pessoas.values()].map(p=>`<div class="agm-pessoa">
    <div class="agm-pessoa-topo">${avatarMiniAgenda(p.usuarioId, p.nome)}<span class="agm-pessoa-nome">${escHtml(p.nome)}</span></div>
    ${p.grupos.map(visitaMesHtml).join("")}
  </div>`).join("");
}

// Desenha na tela: render grade mensal legado
function renderGradeMensalLegado(){
  const wrap = document.getElementById("grade-mensal-agenda");
  if(!wrap) return;
  montarIndiceUnidadesAgenda();
  const lg = document.getElementById("agm-luzes"); if(lg) lg.innerHTML = legendaLuzesHtml();
  const hoje = new Date();
  const hojeISO = dataISOLocal(hoje);
  const mesRef = new Date(hoje.getFullYear(), hoje.getMonth()+mesAgendaOffset, 1);
  const label = document.getElementById("mes-agenda-label");
  if(label) label.textContent = maiusc1(mesRef.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}));

  // só segunda a sexta: começa na segunda da 1ª semana útil e termina na sexta da última
  const primeiro = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const ultimo = new Date(mesRef.getFullYear(), mesRef.getMonth()+1, 0);
  const inicio = new Date(primeiro);
  while(inicio.getDay()===0 || inicio.getDay()===6) inicio.setDate(inicio.getDate()+1);
  inicio.setDate(inicio.getDate() - ((inicio.getDay()+6)%7));
  const fim = new Date(ultimo);
  while(fim.getDay()===0 || fim.getDay()===6) fim.setDate(fim.getDate()-1);
  fim.setDate(fim.getDate() + (5 - fim.getDay()));

  let html = "";
  for(let d = new Date(inicio); d <= fim; d.setDate(d.getDate()+1)){
    const dow = d.getDay();
    if(dow===0 || dow===6) continue;
    const iso = dataISOLocal(d);
    const doMes = d.getMonth()===mesRef.getMonth();
    const qtd = visitasAtivasDoDia(iso).length;
    const classes = ["agm-dia"];
    if(!doMes) classes.push("fora-mes");
    if(iso===hojeISO) classes.push("hoje");
    html += `<div class="${classes.join(" ")}"><div class="agm-topo"><span class="agm-num">${d.getDate()}</span>${qtd ? `<span class="agm-qtd">${qtd} visita${qtd===1?"":"s"}</span>` : ""}</div>${diaMesAgendaHtml(iso)}</div>`;
  }
  const cab = ["Seg","Ter","Qua","Qui","Sex"].map(n=>`<div class="agm-head">${n}</div>`).join("");
  wrap.innerHTML = `<div class="agm-grid">${cab}${html}</div>`;

  const prefixo = mesRef.getFullYear()+"-"+String(mesRef.getMonth()+1).padStart(2,"0");
  const doMesVisitas = AGENDA.filter(v=>v.data.startsWith(prefixo) && v.status!=="Rejeitado");
  const totalEl = document.getElementById("agm-total");
  if(totalEl) totalEl.textContent = doMesVisitas.length===1 ? "1 visita no mês" : doMesVisitas.length+" visitas no mês";
  // legenda da equipe (avatar → nome)
  const equipeEl = document.getElementById("agm-equipe");
  if(equipeEl){
    const nomes = new Map();
    doMesVisitas.forEach(v=>{ if(!nomes.has(v.usuarioId||v.usuarioNome)) nomes.set(v.usuarioId||v.usuarioNome, {id:v.usuarioId, nome:v.usuarioNome}); });
    equipeEl.innerHTML = [...nomes.values()].sort((a,b)=>String(a.nome).localeCompare(String(b.nome),"pt-BR"))
      .map(u=>`<span class="agm-equipe-item">${avatarMiniAgenda(u.id,u.nome)}${escHtml(u.nome)}</span>`).join("");
  }
}

