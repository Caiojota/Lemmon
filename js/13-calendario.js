/* =====================================================================
   CALENDÁRIO — agenda unificada da equipe
   ===================================================================== */

// Função do módulo: segunda do dia
function segundaDoDia(iso){ const d = new Date(iso+"T00:00:00"); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d; }

// Função do módulo: cal pode editar
function calPodeEditar(e){ return !!currentUser && (e.criadoPor===currentUser.id || e.usuarioId===currentUser.id || ehAdminOuCoordenador()); }

// Função do módulo: cal pode ver detalhe
// quem enxerga os detalhes de um item: o dono, quem criou e o Administrador
function calPodeVerDetalhe(donoId, criadoPor){ return !!currentUser && (currentUser.perfil==="Administrador" || donoId===currentUser.id || (!!criadoPor && criadoPor===currentUser.id)); }

// Função do módulo: cal mascarar evento
function calMascararEvento(e){
  if((!e.oculto && e.tipo!=="Bloqueio") || calPodeVerDetalhe(e.usuarioId, e.criadoPor)) return e;
  return {...e, titulo:"Ocupado", tipo:"Ocupado", local:"", descricao:"", criadoPorNome:"", bloqueia:true, _mask:true};
}

// Função do módulo: visita mascarada
function visitaMascarada(v){
  return v; // visitas e locais de trabalho nunca ficam ocultos
  if(false && !v.oculto || calPodeVerDetalhe(v.usuarioId, null)) return v;
  return {...v, unidade:"Ocupado", motivo:"", checkin:null, checkout:null, _mask:true};
}

// Função do módulo: eventos cal do dia
function eventosCalDoDia(uid, iso){ return CAL_EVENTOS.filter(e=>e.usuarioId===uid && e.dataInicio<=iso && e.dataFim>=iso).map(calMascararEvento); }

// Função do módulo: reunioes do dia
function reunioesDoDia(uid, iso){
  return REUNIOES.filter(r=>r.data===iso && r.status!=="Cancelada" && (r.participantes||[]).includes(uid))
    .sort((a,b)=>(a.horaInicio||"").localeCompare(b.horaInicio||""));
}

// Função do módulo: demandas agendadas do dia
function demandasAgendadasDoDia(uid, iso){ return DEMANDAS.filter(d=>d.responsavelUsuarioId===uid && d.agendadoPara===iso && !d.entregueEm && !demandaConcluida(d)); }

// Função do módulo: ausencias do usuario no dia
// quem está de folga/férias/banco de horas no dia (usado também no Início)
function ausenciasDoUsuarioNoDia(uid, iso){
  return eventosCalDoDia(uid, iso).filter(e=>CAL_AUSENCIAS.includes(e.tipo)).map(e=>({tipo: CAL_TIPOS[e.tipo].curto + (e.diaInteiro ? "" : " ("+e.horaInicio+"–"+e.horaFim+")")}));
}

// Função do módulo: cal itens do dia
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

// Função do módulo: cal avs html
// ícones (foto ou iniciais) de quem participa de um lançamento
function calAvsHtml(uids){
  const u = [...new Set(uids.filter(Boolean))];
  if(!u.length) return "";
  return `<span class="cal-avs">${u.slice(0,4).map(id=>avatarMiniAgenda(id, (USUARIOS.find(x=>x.id===id)||{}).nome||"?")).join("")}${u.length>4?`<span class="cal-avs-mais">+${u.length-4}</span>`:""}</span>`;
}

// Função do módulo: cal participantes evento
function calParticipantesEvento(e){
  if(!e.grupoId) return [e.usuarioId];
  return [...new Set(CAL_EVENTOS.filter(x=>x.grupoId===e.grupoId && x.dataInicio===e.dataInicio && x.dataFim===e.dataFim && x.titulo===e.titulo).map(x=>x.usuarioId))];
}

// Função do módulo: cal chip evento
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

// Função do módulo: cal chip demanda
function calChipDemanda(d, comAutor){
  const av = calAvsHtml([d.responsavelUsuarioId]);
  const abre = (currentUser.modulos||[]).includes("demandas") ? ` onclick="abrirDemandaInicio(${d.id})"` : "";
  return `<button type="button" class="cal-it dem" title="Demanda #${d.id} agendada: ${escHtml(d.demanda)}"${abre}>${av}▣ #${d.id} ${escHtml(d.demanda)}</button>`;
}

// Função do módulo: cal chip reuniao
function calChipReuniao(r, comAutor, uid){
  const tipo = REUNIOES_TIPOS.find(t=>t.id===r.tipoId);
  const av = calAvsHtml((r.participantes||[]).length ? r.participantes : [uid]);
  const hr = r.horaInicio ? `<span class="hr">${escHtml(r.horaInicio)}</span>` : "";
  const dica = ["Reunião"+(tipo?" · "+tipo.nome:""), r.titulo, r.horaInicio ? r.horaInicio+(r.horaFim?"–"+r.horaFim:"") : "", r.local, r.status].filter(Boolean).join(" · ");
  const abre = (currentUser.modulos||[]).includes("reunioes") || ehAdminOuCoordenador() ? ` onclick="abrirModalReuniao(${r.id})"` : "";
  return `<button type="button" class="cal-it reu" title="${escHtml(dica)}"${abre}>${av}${hr}◷ ${escHtml(r.titulo)}</button>`;
}

// Função do módulo: cal pessoas selecionadas
function calPessoasSelecionadas(){
  if(!calPessoas) calPessoas = [currentUser.id];
  const ativos = new Set(usuariosAtivosOrdenados().map(u=>u.id));
  calPessoas = calPessoas.filter(id=>ativos.has(id));
  if(!calPessoas.length) calPessoas = [currentUser.id];
  return calPessoas;
}

// Função do módulo: cal adicionar pessoa
function calAdicionarPessoa(id){ if(id && !calPessoas.includes(id)) calPessoas.push(id); renderCalendario(); }

// Função do módulo: cal remover pessoa
function calRemoverPessoa(id){ if(calPessoas.length>1) calPessoas = calPessoas.filter(x=>x!==id); renderCalendario(); }

// Função do módulo: cal equipe toda
function calEquipeToda(){ calPessoas = usuariosAtivosOrdenados().map(u=>u.id); renderCalendario(); }

// Função do módulo: cal somente eu
function calSomenteEu(){ calPessoas = [currentUser.id]; renderCalendario(); }

// Função do módulo: cal mudar modo
function calMudarModo(m){ calModo = m; renderCalendario(); }

// Função do módulo: cal mudar vista
function calMudarVista(v){ calVista = v; renderCalendario(); }

// Função do módulo: cal navegar
function calNavegar(d){ if(calModo==="semana") semanaAgendaOffset += d; else mesAgendaOffset += d; renderCalendario(); }

// Função do módulo: cal hoje
function calHoje(){ semanaAgendaOffset = 0; mesAgendaOffset = 0; renderCalendario(); }

// Função do módulo: carregar reunioes para calendario
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

// Inicializa: init calendario
function initCalendario(){ renderCalendario(); carregarReunioesParaCalendario(); }

// Função do módulo: cal fechar menu mais
/* ---- menu "+" ---- */
function calFecharMenuMais(){
  const m = document.getElementById("cal-menu-mais"); if(m) m.classList.remove("aberto");
  const b = document.getElementById("cal-plus"); if(b) b.setAttribute("aria-expanded","false");
}

// Função do módulo: cal toggle menu mais
function calToggleMenuMais(e){
  if(e) e.stopPropagation();
  const m = document.getElementById("cal-menu-mais"); if(!m) return;
  const abrir = !m.classList.contains("aberto");
  const v = document.getElementById("cal-menu-visita"); if(v) v.style.display = (currentUser.modulos||[]).includes("agenda") ? "" : "none";
  m.classList.toggle("aberto", abrir);
  document.getElementById("cal-plus").setAttribute("aria-expanded", abrir ? "true" : "false");
}

// Função do módulo: cal menu acao
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

// Função do módulo: cal bloqueio no intervalo
/* ---- bloqueios ---- */
function calBloqueioNoIntervalo(uid, ini, fim, diaInteiro, hi, hf){
  return CAL_EVENTOS.some(e=>e.tipo==="Bloqueio" && e.usuarioId===uid && e.dataInicio<=fim && e.dataFim>=ini
    && (e.diaInteiro || diaInteiro || (e.horaInicio<hf && hi<e.horaFim)));
}

// Função do módulo: visita em bloqueio
function visitaEmBloqueio(uid, iso, periodo){
  const h = PERIODO_HORAS[periodo] || PERIODO_HORAS["Dia inteiro"];
  return calBloqueioNoIntervalo(uid, iso, iso, false, h[0], h[1]);
}

// Desenha na tela: render calendario
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

// Função do módulo: cal chips convite
// bloco de um dia para uma pessoa: card(s) da visita no topo e, abaixo, os demais itens
function calChipsConvite(uid, iso){
  if(!currentUser || uid!==currentUser.id) return "";
  return convitesPendentesRecebidos().filter(c=>c.dataRef===iso).map(c=>`<button type="button" class="cal-it convite" title="Convite de ${escHtml(c.convidanteNome)} — clique para responder" onclick="abrirConvites()">✉ ${escHtml(c.titulo)}</button>`).join("");
}

// Função do módulo: cal conteudo dia
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

// Desenha na tela: render cal semana
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

// Desenha na tela: render cal mes
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

// Função do módulo: cal intervalo atual
/* =====================================================================
   RESUMO do período (demandas e visitas) + JANELA DO DIA
   ===================================================================== */
function calIntervaloAtual(){
  if(calModo==="semana"){ const seg = segundaDaSemana(semanaAgendaOffset), fim = new Date(seg); fim.setDate(seg.getDate()+4); return [dataISOLocal(seg), dataISOLocal(fim)]; }
  const hoje = new Date(), m = new Date(hoje.getFullYear(), hoje.getMonth()+mesAgendaOffset, 1), u = new Date(m.getFullYear(), m.getMonth()+1, 0);
  return [dataISOLocal(m), dataISOLocal(u)];
}

// Função do módulo: cal eh local trabalho
function calEhLocalTrabalho(unidade){ return locaisTrabalhoAgenda().some(l=>normTxt(l)===normTxt(unidade)); }

// Função do módulo: cal resumo pessoa
function calResumoPessoa(uid, ini, fim){
  const noIntervalo = d=> d && d>=ini && d<=fim;
  const dem = DEMANDAS.filter(d=>d.responsavelUsuarioId===uid && (noIntervalo(d.dataLimite) || noIntervalo(d.agendadoPara) || noIntervalo(d.entregueEm && String(d.entregueEm).slice(0,10))));
  const demConc = dem.filter(d=>demandaConcluida(d) || d.entregueEm).length;
  const ag = AGENDA.filter(v=>v.usuarioId===uid && v.status!=="Rejeitado" && v.data>=ini && v.data<=fim);
  const vis = ag.filter(v=>!calEhLocalTrabalho(v.unidade));
  return {dem:dem.length, demConc, vis:vis.length, visReal:vis.filter(v=>v.checkin).length, locais:ag.length-vis.length};
}

// Desenha na tela: render cal resumo
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

// Fecha: fechar dia cal
function fecharDiaCal(){ document.getElementById("modal-dia-cal").style.display = "none"; }

// Abre: abrir dia cal
function abrirDiaCal(iso, uidUnico){
  diaCalAtual = {iso, uid:uidUnico};
  renderDiaCal();
  document.getElementById("modal-dia-cal").style.display = "flex";
}

// Função do módulo: dia cal secao
function diaCalSecao(titulo, itens){ return itens.length ? `<div class="dc-sec"><h5>${titulo} <span class="dc-n">${itens.length}</span></h5>${itens.join("")}</div>` : ""; }

// Função do módulo: dia cal pessoa html
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

// Desenha na tela: render dia cal
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

