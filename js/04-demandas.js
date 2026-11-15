/* =====================================================================
   DEMANDAS — quadro kanban (estilo Jira/Planner)
   ===================================================================== */

// Inicializa: init demandas
/* =====================================================================
   DEMANDAS — QUADRO KANBAN (ESTILO JIRA / MICROSOFT PLANNER)
   ===================================================================== */
function initDemandas(){
  popularFiltrosDemandas();
  montarCabecalhosDemandas();
  aplicarColunasDemandas();
  carregarContagemMensagensDemandas();
  aplicarPermissaoCriacaoDemandas();
  const tabAtraso = document.getElementById("tab-dem-atraso");
  if(tabAtraso) tabAtraso.style.display = ehAdminOuCoordenador() ? "inline-block" : "none";
  renderVisaoAtivaDemandas();
}

// Preenche: popular filtros demandas
function popularFiltrosDemandas(){
  fillSelect("dem-f-categoria", DEMANDAS_OPCOES.categoria||[]);
  fillSelect("dem-f-area", DEMANDAS_OPCOES.area||[]);
  fillSelect("dem-f-tipo-atividade", DEMANDAS_OPCOES.tipo_atividade||[]);
  fillSelect("dem-f-tipo", DEMANDAS_TIPOS_CONFIG.map(t=>t.nome));
  fillSelect("dem-f-etapa", [...new Set(FLUXO_ETAPAS.map(e=>e.nome))]);
  fillSelect("dem-f-unidade", UNIDADES.map(u=>u.nome));
  renderFiltroRespDemandas();
}

// Desenha na tela: render filtro resp demandas
function renderFiltroRespDemandas(){
  const box = document.getElementById("dem-f-resp-av"); if(!box) return;
  if(!ehAdminOuCoordenador()){ box.style.display = "none"; DEM_F_RESP.clear(); return; }
  box.style.display = "";
  box.innerHTML = usuariosAtivosOrdenados().map(u=>`<button type="button" class="dm-resp-btn ${DEM_F_RESP.has(u.id)?"sel":""}" title="${escHtml(u.nome)}" aria-pressed="${DEM_F_RESP.has(u.id)}" onclick="alternarFiltroRespDemandas('${u.id}')">${avatarMiniAgenda(u.id,u.nome)}</button>`).join("");
}

// Alterna (mostra/esconde): alternar filtro resp demandas
function alternarFiltroRespDemandas(id){
  if(DEM_F_RESP.has(id)) DEM_F_RESP.delete(id); else DEM_F_RESP.add(id);
  renderFiltroRespDemandas(); renderVisaoAtivaDemandas();
}

// Limpa: limpar filtros demandas
function limparFiltrosDemandas(){
  ["dem-f-busca","dem-f-categoria","dem-f-area","dem-f-tipo-atividade","dem-f-tipo","dem-f-prioridade","dem-f-etapa","dem-f-unidade"].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value = "";
  });
  DEM_F_RESP.clear(); renderFiltroRespDemandas();
  renderVisaoAtivaDemandas();
}

// Calcula: calcular controle prazo
function calcularControlePrazo(dataLimite, entregueEm){
  if(!dataLimite) return {label:"Sem prazo", cor:"#9f8167"};
  if(entregueEm){
    const limite = new Date(dataLimite+"T00:00:00");
    const entrega = new Date(entregueEm+"T00:00:00");
    const diasAtraso = Math.round((entrega-limite)/86400000);
    if(diasAtraso > 0) return {label:"Entregue com "+diasAtraso+"d de atraso", cor:"#ee3135"};
    return {label:"Entregue no prazo", cor:"#00b262"};
  }
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const limite = new Date(dataLimite+"T00:00:00");
  const dias = Math.round((limite-hoje)/86400000);
  if(dias < 0) return {label:"Atrasado", cor:"#ee3135"};
  if(dias === 0) return {label:"Vence hoje", cor:"#ee3135"};
  if(dias === 1) return {label:"Vence amanhã", cor:"#f99d33"};
  if(dias <= 2) return {label:"Vence em 2 dias", cor:"#f99d33"};
  if(dias <= 7) return {label:"Vence em 1 semana", cor:"#faa61a"};
  return {label:"Dentro do prazo", cor:"#00b262"};
}

// Função do módulo: carregar tempo demandas
async function carregarTempoDemandas(){
  const { data, error } = await sb.from("demandas_sessoes").select("demanda_id,duracao_segundos,fim").not("fim","is",null).range(0, 49999);
  if(error){ console.error("[Supabase] tempo das demandas:", error); return; }
  const m = {}; (data||[]).forEach(r=>{ m[r.demanda_id] = (m[r.demanda_id]||0) + (r.duracao_segundos||0); });
  DEMANDAS_TEMPO = m;
}

// Função do módulo: tempo gasto demanda
function tempoGastoDemanda(d){
  let t = DEMANDAS_TEMPO[d.id] || 0;
  if(typeof SESSAO_ATIVA!=="undefined" && SESSAO_ATIVA && SESSAO_ATIVA.demanda_id===d.id) t += Math.max(0, Math.floor((Date.now() - new Date(SESSAO_ATIVA.inicio).getTime())/1000));
  return t;
}

// Função do módulo: barra tempo html
function barraTempoHtml(d, comTexto){
  const cfg = DEMANDAS_TIPOS_CONFIG.find(t=>t.nome===d.tipoDemanda);
  const est = cfg && cfg.tempoEstimadoHoras!=null ? cfg.tempoEstimadoHoras*3600 : 0;
  const gasto = tempoGastoDemanda(d);
  if(!est && !gasto) return comTexto ? '<small class="dm-prazo-txt" title="Tempo de cronômetro">0min</small>' : "";
  const pct = est ? Math.min(100, gasto/est*100) : 0;
  const cor = est && gasto>est ? "#ee3135" : pct>=80 ? "#f99d33" : "#00b262";
  const txt = est ? formatarDuracao(gasto)+" de "+formatarDuracao(est) : formatarDuracao(gasto)+" (sem estimativa)";
  return `<span class="dm-prazo-bar" title="Tempo de cronômetro: ${txt}"><i style="width:${pct}%; background:${cor};"></i></span>`+(comTexto ? `<small class="dm-prazo-txt">${txt}</small>` : "");
}

// Função do módulo: barra prazo html
// (antiga) barra fina: quanto do prazo (entrada → limite) já passou — não é mais usada nas demandas
function barraPrazoHtml(d, comTexto){
  if(!d.dataLimite || !d.dataEntrada || d.entregueEm) return "";
  const ini = new Date(d.dataEntrada+"T00:00:00"), fim = new Date(d.dataLimite+"T00:00:00");
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const total = Math.max(1, Math.round((fim-ini)/86400000));
  const rest = Math.round((fim-hoje)/86400000);
  const pct = rest<0 ? 100 : Math.max(0, Math.min(100, Math.round((hoje-ini)/86400000)/total*100));
  const cor = calcularControlePrazo(d.dataLimite, d.entregueEm).cor;
  const txt = rest<0 ? Math.abs(rest)+"d de atraso" : rest===0 ? "vence hoje" : rest+"d restante"+(rest>1?"s":"");
  return `<span class="dm-prazo-bar" title="${txt} · limite ${formatarDataBR(d.dataLimite)}"><i style="width:${pct}%; background:${cor};"></i></span>`+(comTexto ? `<small class="dm-prazo-txt">${txt}</small>` : "");
}

// Função do módulo: cor prioridade
function corPrioridade(p){ return p==="Alta" ? "#ee3135" : p==="Baixa" ? "#00733f" : "#faa61a"; }

// Função do módulo: iniciais texto
function iniciaisTexto(nome){
  if(!nome) return "—";
  return nome.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase();
}

// Função do módulo: cor avatar por nome
function corAvatarPorNome(nome){
  if(!nome) return "#9f8167";
  let hash = 0;
  for(let i=0; i<nome.length; i++) hash = nome.charCodeAt(i) + ((hash<<5)-hash);
  return PALETA_AVATARES[Math.abs(hash) % PALETA_AVATARES.length];
}

// Função do módulo: cor tipo demanda
function corTipoDemanda(tipo){
  return corAvatarPorNome(tipo||"—");
}

// Função do módulo: norm busca dem
function normBuscaDem(s){ return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); }

// Função do módulo: demandas escopo usuario
function demandasEscopoUsuario(){
  return DEMANDAS.filter(d=> ehAdminOuCoordenador() || (!!currentUser && d.responsavelUsuarioId===currentUser.id));
}

// Função do módulo: dados filtrados demandas
function dadosFiltradosDemandas(){
  const cat = document.getElementById("dem-f-categoria")?.value;
  const area = document.getElementById("dem-f-area")?.value;
  const tipoAtiv = document.getElementById("dem-f-tipo-atividade")?.value;
  const tipo = document.getElementById("dem-f-tipo")?.value;
  const prio = document.getElementById("dem-f-prioridade")?.value;
  const etapaNome = document.getElementById("dem-f-etapa")?.value;
  const uni = document.getElementById("dem-f-unidade")?.value;
  const q = normBuscaDem(document.getElementById("dem-f-busca")?.value);
  return demandasEscopoUsuario().filter(d=>{
    if(cat && d.categoria!==cat) return false;
    if(area && d.area!==area) return false;
    if(tipoAtiv && d.tipoAtividade!==tipoAtiv) return false;
    if(tipo && d.tipoDemanda!==tipo) return false;
    if(prio && d.prioridade!==prio) return false;
    if(etapaNome && nomeEtapaDemanda(d)!==etapaNome) return false;
    if(DEM_F_RESP.size && ehAdminOuCoordenador() && !DEM_F_RESP.has(d.responsavelUsuarioId) && !DEMANDAS.some(x=>x.demandaMaeId===d.id && DEM_F_RESP.has(x.responsavelUsuarioId))) return false;
    if(uni && d.unidade!==uni) return false;
    if(q && !normBuscaDem("#"+d.id+" "+d.demanda+" "+d.responsavel+" "+d.unidade+" "+d.categoria+" "+d.tipoDemanda).includes(q)) return false;
    return true;
  });
}

// Função do módulo: nome etapa demanda
function nomeEtapaDemanda(d){
  const e = FLUXO_ETAPAS.find(x=>x.id===d.etapaId);
  return e ? e.nome : "—";
}

// Função do módulo: cor etapa demanda
function corEtapaDemanda(d){
  const e = FLUXO_ETAPAS.find(x=>x.id===d.etapaId);
  return e ? e.cor : "#9f8167";
}

// Função do módulo: demanda concluida
function demandaConcluida(d){
  return nomeEtapaDemanda(d).toLowerCase().includes("conclu");
}

// Função do módulo: resolucao demanda
function resolucaoDemanda(d){
  return demandaConcluida(d) ? "Concluído" : "Sem resolução";
}

// Função do módulo: formatar data br
function formatarDataBR(iso){
  if(!iso) return "—";
  const soData = iso.split("T")[0];
  return soData.split("-").reverse().join("/");
}

// Função do módulo: dias para entrega
function diasParaEntrega(d){
  if(!d.dataEntrada || !d.dataLimite) return null;
  const dif = Math.round((new Date(d.dataLimite+"T00:00:00") - new Date(d.dataEntrada+"T00:00:00"))/86400000);
  return dif;
}

// Função do módulo: demandas filhas
function demandasFilhas(d){
  return DEMANDAS.filter(x=>x.demandaMaeId===d.id);
}

// Alterna (mostra/esconde): alternar sub demandas
function alternarSubDemandas(id){
  if(DEM_EXPANDIDAS.has(id)) DEM_EXPANDIDAS.delete(id); else DEM_EXPANDIDAS.add(id);
  renderVisaoAtivaDemandas();
}

// Função do módulo: dem responsaveis lista
// ícones dos responsáveis: quem responde pela demanda + quem responde pelas sub-demandas
function demResponsaveisLista(d){
  const vistos = new Set(), lista = [];
  [d].concat(DEMANDAS.filter(x=>x.demandaMaeId===d.id)).forEach(x=>{
    if(!x.responsavel) return;
    const k = x.responsavelUsuarioId || x.responsavel;
    if(vistos.has(k)) return; vistos.add(k); lista.push({id:x.responsavelUsuarioId, nome:x.responsavel});
  });
  return lista;
}

// Função do módulo: dem responsaveis html
function demResponsaveisHtml(d){
  const l = demResponsaveisLista(d);
  if(!l.length) return "—";
  const MAX = 4;
  return `<span class="dm-resp-pilha" title="${escHtml(l.map(r=>r.nome).join(", "))}">` + l.slice(0,MAX).map(r=>avatarMiniAgenda(r.id, r.nome)).join("") + (l.length>MAX ? `<span class="dm-resp-mais">+${l.length-MAX}</span>` : "") + `</span>`;
}

// Função do módulo: dem prefixo linha
function demPrefixoLinha(d){
  const nf = (DEM_FILHAS_NA_LISTA.get(d.id)||[]).length;
  const ind = demNivelLinha ? `<span class="dm-filha-ind" style="margin-left:${(demNivelLinha-1)*16}px;">↳</span>` : "";
  const seta = nf ? `<button type="button" class="dm-caret ${DEM_EXPANDIDAS.has(d.id)?"aberta":""}" title="${DEM_EXPANDIDAS.has(d.id)?"Recolher":"Mostrar"} as ${nf} sub-demanda${nf>1?"s":""}" aria-label="Sub-demandas" onclick="event.stopPropagation(); alternarSubDemandas(${d.id})">▸</button><span class="dm-subn" title="${nf} sub-demanda${nf>1?"s":""}">${nf}</span>` : "";
  return ind+seta;
}

// Função do módulo: html linhas demandas aninhadas
function htmlLinhasDemandasAninhadas(linhas){
  const ids = new Set(linhas.map(d=>d.id));
  const temMae = d=>!!d.demandaMaeId && d.demandaMaeId!==d.id && ids.has(d.demandaMaeId);
  const filhas = new Map();
  linhas.forEach(d=>{ if(temMae(d)){ if(!filhas.has(d.demandaMaeId)) filhas.set(d.demandaMaeId, []); filhas.get(d.demandaMaeId).push(d); } });
  DEM_FILHAS_NA_LISTA = filhas;
  const saida = [], vistos = new Set();
  const emitir = (d, nivel)=>{
    if(vistos.has(d.id)) return;
    vistos.add(d.id);
    demNivelLinha = nivel; saida.push(linhaDemandaHtml(d));
    if(DEM_EXPANDIDAS.has(d.id)) (filhas.get(d.id)||[]).forEach(f=>emitir(f, nivel+1));
  };
  linhas.filter(d=>!temMae(d)).forEach(d=>emitir(d,0));
  demNivelLinha = 0;
  return saida.join("");
}

// Desenha na tela: render sub demandas modal
function renderSubDemandasModal(d){
  const el = document.getElementById("dem-sub-lista"), btn = document.getElementById("btn-nova-sub");
  if(!el) return;
  if(!d){ el.innerHTML = '<span class="estrutura-vazio">Salve a demanda para criar sub-demandas dentro dela.</span>'; if(btn) btn.style.display = "none"; return; }
  if(btn) btn.style.display = "";
  const fs = demandasFilhas(d);
  el.innerHTML = fs.length ? '<div class="estrutura-lista" style="max-height:170px;">' + fs.map(f=>`<div class="admin-item-row" style="cursor:pointer;" onclick="abrirModalDemanda(${f.id})"><span class="txt"><span class="jira-issue-key">#${f.id}</span> ${escHtml(f.demanda.slice(0,70))}</span><span class="jira-status-chip" style="background:${corEtapaDemanda(f)};">${escHtml(nomeEtapaDemanda(f))}</span></div>`).join("") + '</div>'
    : '<span class="estrutura-vazio">Nenhuma sub-demanda ainda.</span>';
}

// Função do módulo: nova sub demanda
async function novaSubDemanda(){
  const maeId = Number(document.getElementById("dem-id").value);
  if(!maeId){ alert("Salve a demanda antes de criar sub-demandas."); return; }
  const mae = DEMANDAS.find(d=>d.id===maeId);
  await abrirModalDemanda(null);
  document.getElementById("dem-mae").value = String(maeId);
  if(mae){
    document.getElementById("dem-unidade").value = mae.unidade||"";
    document.getElementById("dem-prioridade").value = mae.prioridade||"Normal";
    if(mae.responsavelUsuarioId) document.getElementById("dem-responsavel").value = mae.responsavelUsuarioId;
    if(mae.dataLimite) document.getElementById("dem-data-limite").value = mae.dataLimite;
  }
  document.getElementById("demanda-modal-title").textContent = "Nova sub-demanda de #"+maeId;
  atualizarCabecalhoJanelaDemanda();
  document.getElementById("dem-descricao").focus();
}

// Ordena a lista de: ordenar lista demandas
function ordenarListaDemandas(campo){
  if(ordenacaoListaDemandas.campo===campo) ordenacaoListaDemandas.dir *= -1;
  else ordenacaoListaDemandas = {campo, dir:1};
  renderVisaoAtivaDemandas();
}

// Função do módulo: valor ordenacao demanda
function valorOrdenacaoDemanda(d, campo){
  switch(campo){
    case "demanda": return d.demanda||"";
    case "categoria": return d.categoria||"";
    case "area": return d.area||"";
    case "tipoAtividade": return d.tipoAtividade||"";
    case "tipoDemanda": return d.tipoDemanda||"";
    case "prioridade": return {Alta:0,Normal:1,Baixa:2}[d.prioridade] ?? 3;
    case "status": return nomeEtapaDemanda(d);
    case "prazo": return d.dataLimite || "9999-99-99";
    case "dataEntrada": return d.dataEntrada || "";
    case "dataLimite": return d.dataLimite || "";
    case "diasEntrega": return diasParaEntrega(d) ?? 9999;
    case "tempoEstimado": return d.tempoEstimado || "";
    case "aguardandoItem": return d.aguardandoItem || "";
    case "aguardandoResponsavel": return d.aguardandoResponsavel || "";
    case "unidade": return d.unidade || "";
    case "responsavel": return d.responsavel || "";
    case "agendadoPara": return d.agendadoPara || "";
    case "entregueEm": return d.entregueEm || "";
    case "satisfacaoEntrega": return d.satisfacaoEntrega || "";
    case "saldoAnterior": return d.saldoAnterior || "";
    case "tempoGasto": return d.tempoGasto || "";
    case "emailRelacionado": return d.emailRelacionado || "";
    case "comentarios": return d.comentarios || "";
    case "aprovacaoQualidade": return d.aprovacaoQualidade || "";
    case "demandaMae": return d.demandaMaeId || 0;
    default: return "";
  }
}

// Função do módulo: montar cabecalhos demandas
function montarCabecalhosDemandas(){
  const h = COLUNAS_DEMANDAS.map(c=> c.sel
    ? `<th class="col-sel"><input type="checkbox" class="dm-sel-todos" onchange="selecionarTodasDemandas(this.checked)" title="Selecionar todas as demandas da lista" aria-label="Selecionar todas"></th>`
    : `<th class="${c.sticky?"col-sticky":""} ${c.ext?"col-ext":""}"${c.k?` onclick="ordenarListaDemandas('${c.k}')"`:""}>${c.t}</th>`).join("");
  ["tr-cabecalho-demandas","tr-cabecalho-demandas-concluidas"].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML = h; });
}

// Aplica: aplicar colunas demandas
function aplicarColunasDemandas(){
  ["tabela-demandas-ativas","tabela-demandas-concluidas"].forEach(id=>{ const t=document.getElementById(id); if(t) t.classList.toggle("compacta", !demandasTodasColunas); });
  const b = document.getElementById("btn-dem-colunas");
  if(b){ b.textContent = demandasTodasColunas ? "Mostrar menos colunas" : "Mostrar todas as colunas"; b.classList.toggle("on", demandasTodasColunas); }
}

// Alterna (mostra/esconde): alternar colunas demandas
function alternarColunasDemandas(){ demandasTodasColunas = !demandasTodasColunas; aplicarColunasDemandas(); }

// Função do módulo: linha demanda html
function linhaDemandaHtml(d){
  const prioClasse = d.prioridade==="Alta" ? "alta" : d.prioridade==="Baixa" ? "baixa" : "normal";
  return `<tr class="pr-${prioClasse} ${DEMANDAS_SEL.has(d.id)?"sel":""} ${demNivelLinha?"dm-filha":""}" data-id="${d.id}" onclick="abrirModalDemanda(${d.id})">` +
    COLUNAS_DEMANDAS.map(c=> c.sel
      ? `<td class="col-sel" onclick="event.stopPropagation()">${c.cel(d)}</td>`
      : `<td class="${c.sticky?"col-sticky":""} ${c.ext?"col-ext":""}">${c.cel(d)}</td>`).join("") + `</tr>`;
}

// Ordena a lista de: ordenar linhas
function ordenarLinhas(linhas){
  const {campo, dir} = ordenacaoListaDemandas;
  return linhas.slice().sort((a,b)=>{
    const va = valorOrdenacaoDemanda(a,campo), vb = valorOrdenacaoDemanda(b,campo);
    if(va<vb) return -1*dir;
    if(va>vb) return 1*dir;
    return 0;
  });
}

// Desenha na tela: render kpis demandas
function renderKpisDemandas(){
  const el = document.getElementById("dm-kpis");
  if(!el) return;
  const esc = demandasEscopoUsuario();
  const ativas = esc.filter(d=>!demandaConcluida(d));
  const concluidas = esc.length - ativas.length;
  const hoje = dataISOLocal(new Date());
  const em7 = somarDiasISO(hoje, 7);
  const vencem = ativas.filter(d=>!d.entregueEm && d.dataLimite && d.dataLimite>=hoje && d.dataLimite<=em7).length;
  const atrasadas = ativas.filter(d=>!d.entregueEm && d.dataLimite && d.dataLimite<hoje).length;
  const aguardando = ativas.filter(d=>d.aguardandoItem || d.aguardandoResponsavel).length;
  const ic = {
    lista:'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    rel:'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
    alerta:'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>',
    pausa:'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/></svg>'
  };
  const k = (cls, icone, n, rotulo)=>`<div class="dm-kpi ${cls}"><span class="dm-kpi-ic">${icone}</span><div><b>${n}</b><span>${rotulo}</span></div></div>`;
  el.innerHTML = k("", ic.lista, ativas.length, "Demandas ativas") + k("amb", ic.rel, vencem, "Vencem em 7 dias") + k("verm", ic.alerta, atrasadas, "Em atraso") + k("terra", ic.pausa, aguardando, "Aguardando alguém");
  const nA = document.getElementById("dm-n-ativas"); if(nA) nA.textContent = ativas.length;
  const nC = document.getElementById("dm-n-concluidas"); if(nC) nC.textContent = concluidas;
  const r = document.getElementById("dm-resumo");
  if(r) r.textContent = ehAdminOuCoordenador() ? "Visão da equipe: todas as demandas, com prazos, responsáveis e a conversa de cada uma." : "Suas demandas, com prazos e a conversa de cada uma.";
}

// Desenha na tela: render visao ativa demandas
function renderVisaoAtivaDemandas(){
  const sub = document.querySelector("#view-demandas .insp-tab.active")?.dataset.sub || "ativas";
  renderKpisDemandas();
  if(sub==="concluidas") renderListaDemandasConcluidas();
  else renderListaDemandas();
}

// Desenha na tela: render lista demandas
function renderListaDemandas(){
  const tbody = document.getElementById("tbl-lista-demandas");
  if(!tbody) return;
  const linhas = ordenarLinhas(dadosFiltradosDemandas().filter(d=>!demandaConcluida(d)));
  if(!linhas.length){
    tbody.innerHTML = `<tr><td colspan="${COLUNAS_DEMANDAS.length}"><div class="lista-vazio"><b>Nenhuma demanda por aqui</b>Você não tem demandas em aberto ou elas não correspondem aos filtros atuais.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = htmlLinhasDemandasAninhadas(linhas);
  sincronizarSelecaoDemandas();
}

// Desenha na tela: render lista demandas concluidas
function renderListaDemandasConcluidas(){
  const tbody = document.getElementById("tbl-lista-demandas-concluidas");
  if(!tbody) return;
  const linhas = ordenarLinhas(dadosFiltradosDemandas().filter(d=>demandaConcluida(d)));
  if(!linhas.length){
    tbody.innerHTML = `<tr><td colspan="${COLUNAS_DEMANDAS.length}"><div class="lista-vazio"><b>Nenhuma demanda concluída ainda</b>Assim que uma demanda for concluída, ela aparece aqui.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = htmlLinhasDemandasAninhadas(linhas);
  sincronizarSelecaoDemandas();
}

// Função do módulo: sub demandas ativa
/* ---- Seleção múltipla e alteração em lote ---- */
function subDemandasAtiva(){ return document.querySelector("#view-demandas .insp-tab.active")?.dataset.sub || "ativas"; }

// Função do módulo: ids demandas visiveis
function idsDemandasVisiveis(){   // só as linhas que estão na tela (sub-demandas recolhidas não entram na seleção)
  const tb = document.getElementById(subDemandasAtiva()==="concluidas" ? "tbl-lista-demandas-concluidas" : "tbl-lista-demandas");
  return tb ? [...tb.querySelectorAll("tr[data-id]")].map(tr=>Number(tr.dataset.id)) : [];
}

// Alterna (mostra/esconde): alternar selecao demanda
function alternarSelecaoDemanda(id, on){
  if(on) DEMANDAS_SEL.add(id); else DEMANDAS_SEL.delete(id);
  const tr = document.querySelector('#view-demandas tr[data-id="'+id+'"]');
  if(tr) tr.classList.toggle("sel", !!on);
  sincronizarSelecaoDemandas();
}

// Função do módulo: selecionar todas demandas
function selecionarTodasDemandas(on){
  idsDemandasVisiveis().forEach(id=>{ if(on) DEMANDAS_SEL.add(id); else DEMANDAS_SEL.delete(id); });
  document.querySelectorAll("#view-demandas tbody tr[data-id]").forEach(tr=>{
    const id = Number(tr.dataset.id), marcado = DEMANDAS_SEL.has(id);
    tr.classList.toggle("sel", marcado);
    const cb = tr.querySelector("input.dm-sel"); if(cb) cb.checked = marcado;
  });
  sincronizarSelecaoDemandas();
}

// Limpa: limpar selecao demandas
function limparSelecaoDemandas(){ DEMANDAS_SEL.clear(); selecionarTodasDemandas(false); }

// Função do módulo: sincronizar selecao demandas
// mantém o checkbox do cabeçalho e a barra de ações coerentes com a seleção
function sincronizarSelecaoDemandas(){
  const existentes = new Set(DEMANDAS.map(d=>d.id));
  [...DEMANDAS_SEL].forEach(id=>{ if(!existentes.has(id)) DEMANDAS_SEL.delete(id); });
  const visiveis = idsDemandasVisiveis();
  const marcadasVis = visiveis.filter(id=>DEMANDAS_SEL.has(id)).length;
  document.querySelectorAll("#view-demandas input.dm-sel-todos").forEach(cb=>{
    cb.checked = visiveis.length>0 && marcadasVis===visiveis.length;
    cb.indeterminate = marcadasVis>0 && marcadasVis<visiveis.length;
  });
  const n = DEMANDAS_SEL.size;
  ["ativas","concluidas"].forEach(sub=>{
    const bar = document.getElementById("dm-lote-"+sub);
    if(!bar) return;
    if(!n){ bar.style.display = "none"; bar.innerHTML = ""; return; }
    bar.style.display = "flex";
    bar.innerHTML = `<span><b>${n}</b> demanda${n===1?"":"s"} selecionada${n===1?"":"s"}</span>
      <span class="dm-lote-acoes">
        <button type="button" class="lote-principal" onclick="abrirModalLoteDemandas()">Alterar em lote</button>
        <button type="button" class="lote-secundario" onclick="limparSelecaoDemandas()">Limpar seleção</button>
      </span>`;
  });
}

// Função do módulo: opcoes lote
function opcoesLote(lista, rotuloVazio){
  return `<option value="">${rotuloVazio||"— manter —"}</option>` + lista.map(v=>`<option value="${escHtml(v)}">${escHtml(v)}</option>`).join("");
}

// Abre: abrir modal lote demandas
function abrirModalLoteDemandas(){
  const sel = DEMANDAS.filter(d=>DEMANDAS_SEL.has(d.id));
  if(!sel.length) return;
  const campo = (rotulo, html, extra)=>`<div class="field" ${extra||""}><label>${rotulo}</label>${html}</div>`;
  const fluxos = [...new Set(sel.map(d=>d.fluxoId))];
  let etapaHtml;
  if(fluxos.length===1){
    const etapas = FLUXO_ETAPAS.filter(e=>e.fluxoId===fluxos[0]).sort((a,b)=>a.ordem-b.ordem);
    etapaHtml = `<select id="lote-etapa"><option value="">— manter —</option>${etapas.map(e=>`<option value="${e.id}">${escHtml(e.nome)}</option>`).join("")}</select>`;
  } else {
    etapaHtml = `<select id="lote-etapa" disabled><option value="">— tipos de demanda diferentes —</option></select>`;
  }
  const respHtml = ehAdminOuCoordenador()
    ? campo("Responsável", `<select id="lote-responsavel"><option value="">— manter —</option>${usuariosAtivosOrdenados().map(u=>`<option value="${u.id}">${escHtml(u.nome)}</option>`).join("")}</select>`) : "";
  document.getElementById("lote-titulo").textContent = "Alterar "+sel.length+" demanda"+(sel.length===1?"":"s")+" em lote";
  document.getElementById("lote-campos").innerHTML =
    campo("Prioridade", `<select id="lote-prioridade">${opcoesLote(["Alta","Normal","Baixa"])}</select>`)
    + campo("Status", etapaHtml)
    + respHtml
    + campo("Unidade", `<select id="lote-unidade">${opcoesLote(UNIDADES.map(u=>u.nome).sort((a,b)=>a.localeCompare(b,"pt-BR")))}</select>`)
    + campo("Data limite", `<input type="date" id="lote-data-limite">`)
    + campo("Agendado para", `<input type="date" id="lote-agendado">`)
    + campo("Categoria", `<select id="lote-categoria">${opcoesLote(DEMANDAS_OPCOES.categoria||[])}</select>`)
    + campo("Área", `<select id="lote-area">${opcoesLote(DEMANDAS_OPCOES.area||[])}</select>`)
    + campo("Tipo de atividade", `<select id="lote-tipo-atividade">${opcoesLote(DEMANDAS_OPCOES.tipo_atividade||[])}</select>`);
  const av = document.getElementById("lote-aviso");
  av.style.display = fluxos.length>1 ? "block" : "none";
  av.textContent = fluxos.length>1 ? "As demandas selecionadas têm tipos (fluxos) diferentes, por isso o status não pode ser alterado em lote." : "";
  document.getElementById("lote-btn-excluir").style.display = ehAdminOuCoordenador() ? "inline-block" : "none";
  document.getElementById("modal-dem-lote").style.display = "flex";
}

// Fecha: fechar modal lote demandas
function fecharModalLoteDemandas(){ document.getElementById("modal-dem-lote").style.display = "none"; }

// Aplica: aplicar lote demandas
async function aplicarLoteDemandas(ev){
  if(ev) ev.preventDefault();
  const sel = DEMANDAS.filter(d=>DEMANDAS_SEL.has(d.id));
  if(!sel.length) return false;
  const v = id => { const el = document.getElementById(id); return el && !el.disabled ? el.value : ""; };
  const mud = {};
  if(v("lote-prioridade")) mud.prioridade = v("lote-prioridade");
  if(v("lote-unidade")) mud.unidade = v("lote-unidade");
  if(v("lote-categoria")) mud.categoria = v("lote-categoria");
  if(v("lote-area")) mud.area = v("lote-area");
  if(v("lote-tipo-atividade")) mud.tipoAtividade = v("lote-tipo-atividade");
  if(v("lote-data-limite")) mud.dataLimite = v("lote-data-limite");
  if(v("lote-agendado")) mud.agendadoPara = v("lote-agendado");
  if(v("lote-responsavel")){
    const u = USUARIOS.find(x=>x.id===v("lote-responsavel"));
    if(u){ mud.responsavelUsuarioId = u.id; mud.responsavel = u.nome; }
  }
  const novaEtapa = v("lote-etapa") ? FLUXO_ETAPAS.find(e=>String(e.id)===v("lote-etapa")) : null;
  if(novaEtapa) mud.etapaId = novaEtapa.id;
  if(!Object.keys(mud).length){ alert("Preencha pelo menos um campo para alterar."); return false; }
  // a data agendada não pode passar do limite de entrega (mesma regra da janela da demanda)
  const conflitos = sel.filter(d=>{
    const lim = mud.dataLimite || d.dataLimite, ag = mud.agendadoPara || d.agendadoPara;
    return lim && ag && ag > lim;
  });
  if(conflitos.length){
    alert("A data agendada não pode ser depois do limite de entrega.\nConflito em: "+conflitos.slice(0,6).map(d=>"#"+d.id).join(", ")+(conflitos.length>6?" …":"")+"\nAjuste as datas e tente de novo.");
    return false;
  }
  const hoje = dataISOLocal(new Date());
  const agoraIso = new Date().toISOString();
  const btn = document.getElementById("lote-btn-aplicar"); btn.disabled = true;
  let ok = 0, falhas = [];
  for(const d of sel){
    const dados = {...mud};
    if(novaEtapa){
      const concluira = novaEtapa.nome.toLowerCase().includes("conclu");
      if(concluira && !d.entregueEm) dados.entregueEm = hoje;
      if(!concluira && d.entregueEm && demandaConcluida(d)) dados.entregueEm = null;
    }
    const payload = {};
    const todos = demandaToDb({...d, ...dados});
    Object.keys(dados).forEach(k=>{
      const col = {prioridade:"prioridade", unidade:"unidade", categoria:"categoria", area:"area", tipoAtividade:"tipo_atividade", dataLimite:"data_limite", agendadoPara:"agendado_para", responsavelUsuarioId:"responsavel_usuario_id", responsavel:"responsavel", etapaId:"etapa_id", entregueEm:"entregue_em"}[k];
      if(col) payload[col] = todos[col];
    });
    const { error } = await sb.from("demandas").update({...payload, updated_at: agoraIso}).eq("id", d.id);
    if(error){ console.error("[lote demandas]", error); falhas.push(d.id); continue; }
    const etapaAntes = nomeEtapaDemanda(d);
    const respAntes = d.responsavelUsuarioId;
    Object.assign(d, dados, {updatedAt: agoraIso});
    ok++;
    const resumo = (novaEtapa && etapaAntes!==nomeEtapaDemanda(d)) ? "Status alterado para: "+nomeEtapaDemanda(d) : "Demanda atualizada";
    if(d.responsavelUsuarioId && d.responsavelUsuarioId!==(currentUser&&currentUser.id)){
      const tipo = (mud.responsavelUsuarioId && respAntes!==d.responsavelUsuarioId) ? "demanda_atribuida" : "demanda_atualizada";
      const titulo = tipo==="demanda_atribuida" ? "Demanda atribuída a você" : resumo;
      criarNotificacao(d.responsavelUsuarioId, tipo, titulo, d.demanda.slice(0,80), "demanda", d.id);
    }
  }
  btn.disabled = false;
  fecharModalLoteDemandas();
  if(!falhas.length) DEMANDAS_SEL.clear();
  else { DEMANDAS_SEL = new Set(falhas); }
  popularFiltrosDemandas();
  renderVisaoAtivaDemandas();
  if(ok) acaoPlataforma(ok+" demanda"+(ok===1?"":"s")+" alterada"+(ok===1?"":"s")+" em lote", "", null, null);
  mostrarToast(falhas.length ? ok+" alterada(s); "+falhas.length+" com erro (continuam selecionadas)." : ok+" demanda"+(ok===1?"":"s")+" atualizada"+(ok===1?"":"s")+".");
  return false;
}

// Remove/cancela: excluir lote demandas
async function excluirLoteDemandas(){
  if(!ehAdminOuCoordenador()) return;
  const sel = DEMANDAS.filter(d=>DEMANDAS_SEL.has(d.id));
  const nFilhas = DEMANDAS.filter(d=>d.demandaMaeId && DEMANDAS_SEL.has(d.demandaMaeId) && !DEMANDAS_SEL.has(d.id)).length;
  if(!sel.length || !confirm("Excluir "+sel.length+" demanda"+(sel.length===1?"":"s")+(nFilhas ? " e "+nFilhas+" sub-demanda"+(nFilhas===1?"":"s")+" ligada"+(nFilhas===1?"":"s") : "")+" definitivamente? Esta ação não pode ser desfeita.")) return;
  const ids = sel.map(d=>d.id);
  const { data: apagadas, error } = await sb.from("demandas").delete().in("id", ids).select("id");
  if(error){ alert("Erro ao excluir: "+error.message); return; }
  if(!apagadas || !apagadas.length){ alert("Não foi possível excluir: sem permissão."); return; }
  DEMANDAS = DEMANDAS.filter(d=>!DEMANDAS_SEL.has(d.id) && !(d.demandaMaeId && DEMANDAS_SEL.has(d.demandaMaeId)));
  DEMANDAS_SEL.clear();
  fecharModalLoteDemandas();
  popularFiltrosDemandas();
  renderVisaoAtivaDemandas();
  acaoPlataforma(ids.length+" demanda"+(ids.length===1?"":"s")+" excluída"+(ids.length===1?"":"s"), "", null, null);
  mostrarToast(ids.length+" demanda"+(ids.length===1?"":"s")+" excluída"+(ids.length===1?"":"s")+".");
}

// Troca para a sub-tela: mostrar sub demandas
function mostrarSubDemandas(sub){
  document.querySelectorAll("#view-demandas .insp-tab").forEach(b=>b.classList.remove("active"));
  const abaDm = document.querySelector('#view-demandas .insp-tab[data-sub="'+sub+'"]'); if(abaDm) abaDm.classList.add("active");
  document.querySelectorAll("#view-demandas .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("demandas-sub-"+sub).classList.add("active");
  const mostrarFiltros = (sub==="ativas" || sub==="concluidas");
  const barra = document.getElementById("dm-barra");
  if(barra){
    // a barra de filtros vale para Ativas e Concluídas: move-a para dentro da aba aberta
    const alvo = document.getElementById("demandas-sub-"+sub);
    if(mostrarFiltros && barra.parentElement!==alvo) alvo.insertBefore(barra, alvo.firstChild);
  }
  const kp = document.getElementById("dm-kpis");
  if(kp) kp.style.display = (sub==="indicadores") ? "none" : "";
  if(sub==="ativas") renderListaDemandas();
  else if(sub==="concluidas") renderListaDemandasConcluidas();
  else if(sub==="atraso") renderDemandasEmAtraso();
  else if(sub==="indicadores") renderIndicadoresDemandas();
  renderKpisDemandas();
}

// Função do módulo: carregar contagem mensagens demandas
async function carregarContagemMensagensDemandas(){
  try{
    const { data, error } = await sb.from("demandas_mensagens").select("demanda_id").range(0, 19999);
    if(error) throw error;
    DEMANDAS_MSG_CONT = {};
    (data||[]).forEach(r=>{ DEMANDAS_MSG_CONT[r.demanda_id] = (DEMANDAS_MSG_CONT[r.demanda_id]||0)+1; });
    renderVisaoAtivaDemandas();
  }catch(e){ console.error("[Supabase] demandas_mensagens:", e); }
}

// Desenha na tela: render indicadores demandas
function renderIndicadoresDemandas(){
  if(!ehAdminOuCoordenador()) return;
  const todas = DEMANDAS.slice();
  const ativas = todas.filter(d=>!demandaConcluida(d));
  const concluidas = todas.filter(d=>demandaConcluida(d));
  const hoje = new Date().toISOString().slice(0,10);
  const emAtraso = ativas.filter(d=>d.dataLimite && d.dataLimite<hoje);
  const aguardandoQualidade = todas.filter(d=>d.aprovacaoQualidade==="Em análise" || d.aprovacaoQualidade==="Reprovado");

  document.getElementById("dki-total-ativas").textContent = ativas.length;
  document.getElementById("dki-total-concluidas").textContent = concluidas.length;
  document.getElementById("dki-em-atraso").textContent = emAtraso.length;
  document.getElementById("dki-aguardando-qualidade").textContent = aguardandoQualidade.length;

  const concluidasComDatas = concluidas.filter(d=>d.dataEntrada && d.entregueEm);
  const tempoMedio = concluidasComDatas.length
    ? concluidasComDatas.reduce((s,d)=>s+Math.max(0,(new Date(d.entregueEm)-new Date(d.dataEntrada))/86400000),0)/concluidasComDatas.length
    : 0;
  document.getElementById("dki-tempo-medio").textContent = tempoMedio ? tempoMedio.toFixed(1) : "—";

  const porResponsavel = {};
  ativas.forEach(d=>{ const nome = d.responsavel || "Sem responsável"; porResponsavel[nome] = (porResponsavel[nome]||0)+1; });
  const respOrdenado = Object.entries(porResponsavel).sort((a,b)=>b[1]-a[1]);
  criarChart("demResponsavel", "chart-dem-responsavel", {
    type:"bar",
    data:{ labels:respOrdenado.map(r=>r[0]), datasets:[{label:"Demandas ativas", data:respOrdenado.map(r=>r[1]), backgroundColor:"#00733f", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const porCategoria = {};
  ativas.forEach(d=>{ const c = d.categoria || "Sem categoria"; porCategoria[c] = (porCategoria[c]||0)+1; });
  criarChart("demCategoria", "chart-dem-categoria", {
    type:"doughnut",
    data:{ labels:Object.keys(porCategoria), datasets:[{data:Object.values(porCategoria), backgroundColor:["#00733f","#faa61a","#a15a33","#a35e8e","#24a076","#f06650","#54412f","#9f8167"], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom", labels:{font:{size:10.5}}}}}
  });

  const porArea = {};
  ativas.forEach(d=>{ const a = d.area || "Sem área"; porArea[a] = (porArea[a]||0)+1; });
  criarChart("demArea", "chart-dem-area", {
    type:"doughnut",
    data:{ labels:Object.keys(porArea), datasets:[{data:Object.values(porArea), backgroundColor:["#a35e8e","#00733f","#faa61a","#9f8167","#f06650"], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom", labels:{font:{size:10.5}}}}}
  });

  const porTipoAtividade = {};
  ativas.forEach(d=>{ const t = d.tipoAtividade || "Sem tipo"; porTipoAtividade[t] = (porTipoAtividade[t]||0)+1; });
  const tipoAtivOrdenado = Object.entries(porTipoAtividade).sort((a,b)=>b[1]-a[1]);
  criarChart("demTipoAtividade", "chart-dem-tipo-atividade", {
    type:"bar",
    data:{ labels:tipoAtivOrdenado.map(t=>t[0]), datasets:[{label:"Demandas", data:tipoAtivOrdenado.map(t=>t[1]), backgroundColor:"#24a076", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const porPrioridade = {Alta:0, Normal:0, Baixa:0};
  ativas.forEach(d=>{ if(porPrioridade[d.prioridade]!=null) porPrioridade[d.prioridade]++; });
  criarChart("demPrioridade", "chart-dem-prioridade", {
    type:"doughnut",
    data:{ labels:Object.keys(porPrioridade), datasets:[{data:Object.values(porPrioridade), backgroundColor:[corPrioridade("Alta"),corPrioridade("Normal"),corPrioridade("Baixa")], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom"}}}
  });

  const porStatus = {};
  ativas.forEach(d=>{ const s = nomeEtapaDemanda(d); porStatus[s] = (porStatus[s]||0)+1; });
  const statusOrdenado = Object.entries(porStatus).sort((a,b)=>b[1]-a[1]);
  criarChart("demStatus", "chart-dem-status", {
    type:"bar",
    data:{ labels:statusOrdenado.map(s=>s[0]), datasets:[{label:"Demandas", data:statusOrdenado.map(s=>s[1]), backgroundColor:"#faa61a", borderRadius:6}]},
    options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const meses = [];
  const base = new Date(); base.setDate(1);
  for(let i=5; i>=0; i--){ const d = new Date(base.getFullYear(), base.getMonth()-i, 1); meses.push(d); }
  const criadasPorMes = meses.map(m=>{
    const chave = m.toISOString().slice(0,7);
    return todas.filter(d=>d.dataEntrada && d.dataEntrada.slice(0,7)===chave).length;
  });
  const concluidasPorMes = meses.map(m=>{
    const chave = m.toISOString().slice(0,7);
    return todas.filter(d=>d.entregueEm && d.entregueEm.slice(0,7)===chave).length;
  });
  criarChart("demTendencia", "chart-dem-tendencia", {
    type:"line",
    data:{
      labels: meses.map(m=>m.toLocaleDateString("pt-BR",{month:"short", year:"2-digit"})),
      datasets:[
        {label:"Criadas", data:criadasPorMes, borderColor:"#a15a33", backgroundColor:"#a15a33", tension:.3},
        {label:"Concluídas", data:concluidasPorMes, borderColor:"#00733f", backgroundColor:"#00733f", tension:.3}
      ]
    },
    options:{plugins:{legend:{position:"bottom"}}, scales:{y:{beginAtZero:true, ticks:{precision:0}}}}
  });
}

// Desenha na tela: render demandas em atraso
function renderDemandasEmAtraso(){
  const todas = DEMANDAS.slice();
  const ativas = todas.filter(d=>!demandaConcluida(d));
  const hoje = new Date().toISOString().slice(0,10);
  const emAtraso = ativas.filter(d=>d.dataLimite && d.dataLimite<hoje)
    .map(d=>({...d, diasAtraso: Math.round((new Date(hoje)-new Date(d.dataLimite+"T00:00:00"))/86400000)}))
    .sort((a,b)=>b.diasAtraso-a.diasAtraso);

  document.getElementById("dka-total").textContent = emAtraso.length;
  const mediaDias = emAtraso.length ? (emAtraso.reduce((s,d)=>s+d.diasAtraso,0)/emAtraso.length) : 0;
  document.getElementById("dka-media-dias").textContent = mediaDias ? mediaDias.toFixed(1) : "0";
  document.getElementById("dka-maior-atraso").textContent = emAtraso.length ? ("#"+emAtraso[0].id+" — "+emAtraso[0].diasAtraso+"d") : "—";

  const tbAtraso = document.getElementById("tbl-dem-atraso");
  if(!emAtraso.length){
    tbAtraso.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--areia-esc);padding:16px;">Nenhuma demanda em atraso.</td></tr>';
    return;
  }
  tbAtraso.innerHTML = emAtraso.map(d=>{
    return `<tr onclick="abrirModalDemanda(${d.id})" style="cursor:pointer;"><td>#${d.id} — ${d.demanda}</td><td>${d.categoria||"—"}</td><td>${d.area||"—"}</td><td>${d.responsavel||"—"}</td><td>${formatarDataBR(d.dataLimite)}</td><td><b style="color:var(--vermelho);">${d.diasAtraso}</b></td></tr>`;
  }).join("");
}

// Função do módulo: eh administrador
function ehAdministrador(){ return !!currentUser && currentUser.perfil==="Administrador"; }

// Função do módulo: eh admin ou coordenador
function ehAdminOuCoordenador(){ return !!currentUser && (currentUser.perfil==="Administrador" || currentUser.perfil==="Coordenador"); }

// Função do módulo: eh responsavel da demanda
function ehResponsavelDaDemanda(d){ return !!currentUser && !!d && d.responsavelUsuarioId===currentUser.id; }

// Função do módulo: etapa selecionada eh conclusao
function etapaSelecionadaEhConclusao(){
  return !!document.getElementById("dem-entregue-em")?.value;
}

// Aplica: aplicar permissoes modal demanda
function aplicarPermissoesModalDemanda(d){
  const admin = ehAdministrador();
  const podeClassificar = true;
  const responsavel = ehResponsavelDaDemanda(d);
  const podeCampoResp = ehAdminOuCoordenador() || responsavel;
  const concluida = etapaSelecionadaEhConclusao();
  document.querySelectorAll("#form-demanda .campo-admin input, #form-demanda .campo-admin select, #form-demanda .campo-admin textarea").forEach(el=>{ el.disabled = !podeClassificar; });
  document.querySelectorAll("#form-demanda .campo-resp input, #form-demanda .campo-resp select, #form-demanda .campo-resp textarea").forEach(el=>{ el.disabled = !podeCampoResp; });
  const selEtapa = document.getElementById("dem-etapa");
  if(selEtapa){
    selEtapa.disabled = concluida ? true : !podeCampoResp;
    selEtapa.title = concluida ? "Demanda concluída — status travado. Use \"Desfazer\" (Administrador) para reabrir." : "";
  }
  document.getElementById("btn-entregar-demanda").disabled = !podeCampoResp || concluida;
  const btnDesfazer = document.getElementById("btn-desfazer-entrega");
  if(btnDesfazer) btnDesfazer.style.display = admin ? "inline-block" : "none";
  document.querySelectorAll("#form-demanda .campo-aprovacao select").forEach(el=>{ el.disabled = !admin; });
  const btnTimer = document.getElementById("btn-timer-demanda");
  btnTimer.disabled = !responsavel || concluida;
  btnTimer.title = concluida ? "Demanda concluída — cronômetro encerrado." : (responsavel ? "" : "Somente o responsável pela demanda pode usar o cronômetro");
  const podeLancar = ehAdminOuCoordenador() || responsavel;
  document.querySelectorAll("#dem-timer-box .dm-ts-form input, #dem-timer-box .dm-ts-form button").forEach(el=>{ el.disabled = !podeLancar; });
}

// Aplica: aplicar permissao criacao demandas
function aplicarPermissaoCriacaoDemandas(){
  const btnNova = document.getElementById("btn-nova-demanda");
  if(btnNova) btnNova.style.display = "inline-flex";
}

// Função do módulo: formatar duracao
function formatarDuracao(seg){
  seg = Math.max(0, Math.round(seg||0));
  const h = Math.floor(seg/3600), m = Math.floor((seg%3600)/60), s = seg%60;
  if(h) return h+"h "+m+"min";
  if(m) return m+"min "+s+"s";
  return s+"s";
}

// Função do módulo: segundos gastos total
function segundosGastosTotal(){
  let total = sessoesModalAtual.filter(s=>s.fim).reduce((acc,s)=>acc+(s.duracao_segundos||0),0);
  if(sessaoAbertaModalAtual) total += Math.floor((Date.now() - new Date(sessaoAbertaModalAtual.inicio).getTime())/1000);
  return total;
}

// Função do módulo: config tipo demanda atual
function configTipoDemandaAtual(){
  const nome = document.getElementById("dem-tipo").value;
  return DEMANDAS_TIPOS_CONFIG.find(t=>t.nome===nome);
}

// Atualiza: atualizar display tempo demanda
function atualizarDisplayTempoDemanda(){
  const segGasto = segundosGastosTotal();
  document.getElementById("dem-tempo-gasto-display").textContent = formatarDuracao(segGasto);
  const cfg = configTipoDemandaAtual();
  const elRestante = document.getElementById("dem-tempo-restante-display");
  const barra = document.getElementById("dem-tempo-barra");
  if(barra){
    const total = (cfg && cfg.tempoEstimadoHoras!=null) ? cfg.tempoEstimadoHoras*3600 : 0;
    const pct = total>0 ? Math.min(100, segGasto/total*100) : 0;
    barra.style.width = pct+"%";
    barra.className = total>0 && segGasto>total ? "estourou" : pct>=80 ? "quase" : "";
  }
  if(cfg && cfg.tempoEstimadoHoras!=null){
    const restante = (cfg.tempoEstimadoHoras*3600) - segGasto;
    elRestante.textContent = restante>=0 ? formatarDuracao(restante)+" restantes" : "excedido em "+formatarDuracao(-restante);
    elRestante.style.color = restante>=0 ? "var(--verde-viv)" : "var(--vermelho)";
  } else {
    elRestante.textContent = "—";
    elRestante.style.color = "var(--marrom-esc)";
  }
}

// Desenha na tela: render historico sessoes modal
function renderHistoricoSessoesModal(){
  const wrap = document.getElementById("dem-historico-sessoes");
  if(!wrap) return;
  const todas = sessaoAbertaModalAtual ? [sessaoAbertaModalAtual, ...sessoesModalAtual] : sessoesModalAtual;
  const n = document.getElementById("dem-ts-n"); if(n) n.textContent = todas.length ? "("+todas.length+")" : "";
  if(!todas.length){ wrap.innerHTML = '<span class="estrutura-vazio">Nenhum lançamento ainda.</span>'; return; }
  wrap.innerHTML = todas.map(s=>{
    const u = USUARIOS.find(x=>x.id===s.usuario_id);
    const ini = new Date(s.inicio);
    const hm = d=>d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
    const quando = ini.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})+" "+hm(ini)+" → "+(s.fim ? hm(new Date(s.fim)) : "em andamento");
    const dur = s.fim ? formatarDuracao(s.duracao_segundos) : formatarDuracao((Date.now()-ini.getTime())/1000);
    const podeRemover = s.fim && (s.usuario_id===(currentUser&&currentUser.id) || ehAdminOuCoordenador());
    return `<div class="dm-ts-it"><span class="tx" title="${escHtml((u?u.nome:"—")+" · "+quando+" ("+dur+")")}">${escHtml(u?primeiroNomeAgenda(u.nome):"—")} · ${quando} · <b>${dur}</b></span>${podeRemover ? `<button type="button" title="Remover lançamento" onclick="removerSessaoDemanda(${s.id})">×</button>` : ""}</div>`;
  }).join("");
}

// Função do módulo: adicionar timesheet demanda
// time sheet: lançamento manual de horas (dia + início + término)
async function adicionarTimesheetDemanda(){
  const id = Number(document.getElementById("dem-id").value);
  if(!id){ alert("Salve a demanda antes de lançar horas."); return; }
  const d = DEMANDAS.find(x=>x.id===id);
  if(!(ehAdminOuCoordenador() || ehResponsavelDaDemanda(d))){ alert("Somente o responsável pela demanda (ou um coordenador) lança horas aqui."); return; }
  const dia = document.getElementById("dem-ts-data").value, hi = document.getElementById("dem-ts-ini").value, hf = document.getElementById("dem-ts-fim").value;
  if(!dia || !hi || !hf){ alert("Informe o dia, o horário de início e o de término."); return; }
  const ini = new Date(dia+"T"+hi+":00"), fim = new Date(dia+"T"+hf+":00");
  if(!(fim>ini)){ alert("O término precisa ser depois do início."); return; }
  const dur = Math.round((fim-ini)/1000);
  const { data, error } = await sb.from("demandas_sessoes").insert({demanda_id:id, usuario_id:currentUser.id, inicio:ini.toISOString(), fim:fim.toISOString(), duracao_segundos:dur}).select().single();
  if(error){ alert("Erro ao lançar as horas: "+error.message); return; }
  DEMANDAS_TEMPO[id] = (DEMANDAS_TEMPO[id]||0) + dur;
  sessoesModalAtual.unshift(data);
  sessoesModalAtual.sort((a,b)=>new Date(b.inicio)-new Date(a.inicio));
  document.getElementById("dem-ts-ini").value = ""; document.getElementById("dem-ts-fim").value = "";
  renderHistoricoSessoesModal(); atualizarDisplayTempoDemanda();
  mostrarToast("Horas lançadas no time sheet.");
}

// Remove/cancela: remover sessao demanda
async function removerSessaoDemanda(sid){
  const s = sessoesModalAtual.find(x=>x.id===sid);
  if(!s || !confirm("Remover este lançamento de horas?")) return;
  const { error } = await sb.from("demandas_sessoes").delete().eq("id", sid);
  if(error){ alert("Erro ao remover o lançamento: "+error.message); return; }
  if(s.demanda_id!=null) DEMANDAS_TEMPO[s.demanda_id] = Math.max(0, (DEMANDAS_TEMPO[s.demanda_id]||0) - (s.duracao_segundos||0));
  sessoesModalAtual = sessoesModalAtual.filter(x=>x.id!==sid);
  renderHistoricoSessoesModal(); atualizarDisplayTempoDemanda();
}

// Função do módulo: carregar sessoes modal demanda
async function carregarSessoesModalDemanda(demandaId){
  const { data, error } = await sb.from("demandas_sessoes").select("*").eq("demanda_id", demandaId).order("inicio", {ascending:false});
  if(error){ console.error("[Supabase] demandas_sessoes:", error); sessoesModalAtual = []; sessaoAbertaModalAtual = null; return; }
  sessaoAbertaModalAtual = (data||[]).find(s=>!s.fim) || null;
  sessoesModalAtual = (data||[]).filter(s=>s.fim);
}

// Alterna (mostra/esconde): toggle timer demanda
async function toggleTimerDemanda(){
  const id = Number(document.getElementById("dem-id").value);
  if(!id){ alert("Salve a demanda antes de usar o cronômetro."); return; }
  const btn = document.getElementById("btn-timer-demanda");
  if(sessaoAbertaModalAtual){
    if(timerIntervalIdDemanda){ clearInterval(timerIntervalIdDemanda); timerIntervalIdDemanda=null; }
    const fechada = await finalizarSessaoDemanda(sessaoAbertaModalAtual);
    if(!fechada) return;
    sessoesModalAtual.unshift(fechada);
    sessaoAbertaModalAtual = null;
    btn.innerHTML = ICONE_PLAY+" Iniciar";
    btn.classList.remove("timer-ativo");
    mostrarToast("Cronômetro pausado e registrado no calendário.");
  } else {
    // só uma demanda por vez: se outra estiver rodando, ela é pausada (e registrada) antes
    if(SESSAO_ATIVA && SESSAO_ATIVA.demanda_id!==id){ await finalizarSessaoDemanda(SESSAO_ATIVA); mostrarToast("A demanda que estava em andamento foi pausada."); }
    const { data, error } = await sb.from("demandas_sessoes").insert({demanda_id:id, usuario_id:currentUser.id}).select().single();
    if(error){ alert("Erro ao iniciar o cronômetro: "+error.message); return; }
    sessaoAbertaModalAtual = data; SESSAO_ATIVA = data;
    btn.innerHTML = ICONE_PAUSE+" Pausar";
    btn.classList.add("timer-ativo");
    timerIntervalIdDemanda = setInterval(atualizarDisplayTempoDemanda, 1000);
    mostrarToast("Cronômetro iniciado.");
  }
  renderHistoricoSessoesModal();
  atualizarDisplayTempoDemanda();
  renderInicio();
}

// Função do módulo: carregar sessao ativa
async function carregarSessaoAtiva(){
  if(!currentUser) return;
  const { data, error } = await sb.from("demandas_sessoes").select("*").eq("usuario_id", currentUser.id).is("fim", null).order("inicio", {ascending:false}).limit(1);
  if(error){ console.error("[Supabase] sessão ativa:", error); return; }
  SESSAO_ATIVA = (data && data[0]) || null;
}

// Função do módulo: finalizar sessao demanda
// encerra a sessão: grava o fim e registra a atividade no calendário (com horário de início e término)
async function finalizarSessaoDemanda(sess){
  const fimIso = new Date().toISOString();
  const duracao = Math.round((new Date(fimIso).getTime() - new Date(sess.inicio).getTime())/1000);
  const { error } = await sb.from("demandas_sessoes").update({fim: fimIso, duracao_segundos: duracao}).eq("id", sess.id);
  if(error){ alert("Erro ao pausar o cronômetro: "+error.message); return null; }
  const fechada = {...sess, fim: fimIso, duracao_segundos: duracao};
  DEMANDAS_TEMPO[sess.demanda_id] = (DEMANDAS_TEMPO[sess.demanda_id]||0) + duracao;
  if(SESSAO_ATIVA && SESSAO_ATIVA.id===sess.id) SESSAO_ATIVA = null;
  await registrarSessaoNoCalendario(fechada);
  return fechada;
}

// Função do módulo: registrar sessao no calendario
async function registrarSessaoNoCalendario(sess){
  const ini = new Date(sess.inicio), fim = new Date(sess.fim);
  if(fim-ini < 60000) return;                                   // menos de 1 minuto: não vira evento
  const hm = d=>String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  const dIni = dataISOLocal(ini);
  const horaFim = dataISOLocal(fim)===dIni ? hm(fim) : "23:59";    // se passou da meia-noite, vai até o fim do dia de início
  const d = DEMANDAS.find(x=>x.id===sess.demanda_id);
  const titulo = "Demanda #"+sess.demanda_id+(d ? " — "+String(d.demanda).slice(0,80) : "");
  const linha = {titulo, tipo:"Atividade", usuario_id:currentUser.id, criado_por:currentUser.id, criado_por_nome:currentUser.nome,
    data_inicio:dIni, data_fim:dIni, dia_inteiro:false, hora_inicio:hm(ini), hora_fim:horaFim, local:"",
    descricao:"Registrado automaticamente ao pausar o cronômetro da demanda.", bloqueia:true};
  const { data, error } = await sb.from("calendario_eventos").insert(linha).select();
  if(error){ console.error("[Supabase] calendario (sessão):", error); return; }
  (data||[]).forEach(r=>CAL_EVENTOS.push(mapEventoCalFromDb(r)));
}

// Função do módulo: pausar sessao inicio
async function pausarSessaoInicio(){
  if(!SESSAO_ATIVA) return;
  const sess = SESSAO_ATIVA;
  const fechada = await finalizarSessaoDemanda(sess);
  if(!fechada) return;
  if(sessaoAbertaModalAtual && sessaoAbertaModalAtual.id===sess.id){        // o modal da mesma demanda está aberto: mantém o estado dele
    if(timerIntervalIdDemanda){ clearInterval(timerIntervalIdDemanda); timerIntervalIdDemanda=null; }
    sessoesModalAtual.unshift(fechada); sessaoAbertaModalAtual = null;
    const btn = document.getElementById("btn-timer-demanda"); if(btn){ btn.innerHTML = ICONE_PLAY+" Iniciar"; btn.classList.remove("timer-ativo"); }
    renderHistoricoSessoesModal(); atualizarDisplayTempoDemanda();
  }
  renderInicio();
  mostrarToast("Cronômetro pausado e registrado no calendário.");
}

// Função do módulo: relogio sessao texto
function relogioSessaoTexto(){
  const s = Math.max(0, Math.floor((Date.now() - new Date(SESSAO_ATIVA.inicio).getTime())/1000));
  return String(Math.floor(s/3600)).padStart(2,"0")+":"+String(Math.floor((s%3600)/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
}

// Desenha na tela: render inicio sessao
function renderInicioSessao(){
  const el = document.getElementById("inicio-sessao");
  if(!el) return;
  if(relogioSessaoId){ clearInterval(relogioSessaoId); relogioSessaoId = null; }
  if(!SESSAO_ATIVA || !currentUser){ el.style.display = "none"; el.innerHTML = ""; return; }
  const d = DEMANDAS.find(x=>x.id===SESSAO_ATIVA.demanda_id);
  const nome = d ? d.demanda : "Demanda #"+SESSAO_ATIVA.demanda_id;
  const meta = d ? [("#"+d.id), d.unidade, d.tipoDemanda].filter(Boolean).join(" · ") : "";
  const abrir = (currentUser.modulos||[]).includes("demandas") ? `<button type="button" class="in-link" onclick="abrirDemandaInicio(${SESSAO_ATIVA.demanda_id})">Abrir demanda</button>` : "";
  el.style.display = "block";
  el.innerHTML = `<div class="card in-sessao">
      <div class="in-sessao-topo"><span class="in-sessao-ponto"></span><span class="in-sessao-rot">Em andamento agora</span>${abrir}</div>
      <div class="in-sessao-corpo">
        <div class="in-sessao-txt"><b title="${escHtml(nome)}">${escHtml(nome)}</b><small>${escHtml(meta)}</small></div>
        <span class="in-sessao-relogio" id="sessao-relogio">${relogioSessaoTexto()}</span>
        <button type="button" class="btn-secondary in-sessao-btn" onclick="pausarSessaoInicio()">${ICONE_PAUSE} Pausar</button>
      </div>
    </div>`;
  relogioSessaoId = setInterval(()=>{
    const r = document.getElementById("sessao-relogio");
    if(!r || !SESSAO_ATIVA){ clearInterval(relogioSessaoId); relogioSessaoId = null; return; }
    r.textContent = relogioSessaoTexto();
  }, 1000);
}

// Reage à ação:: ao trocar tipo demanda
function aoTrocarTipoDemanda(){
  const cfg = configTipoDemandaAtual();
  const fluxoId = cfg && cfg.fluxoId ? cfg.fluxoId : (FLUXOS.find(f=>f.padrao)||FLUXOS[0]||{}).id;
  document.getElementById("dem-fluxo-id-atual").value = fluxoId || "";
  popularEtapasModalDemanda();
  const disp = document.getElementById("dem-tempo-estimado-display");
  disp.textContent = (cfg && cfg.tempoEstimadoHoras!=null) ? formatarDuracao(cfg.tempoEstimadoHoras*3600) : "Não definido para este tipo";
  atualizarDisplayTempoDemanda();
  onCampoEtapaChange();
}

// Função do módulo: etapa eh analise qualidade
/* ---- Análise de qualidade: switch, comentários e solicitações ---- */
function etapaEhAnaliseQualidade(d){
  return nomeEtapaDemanda(d).toLowerCase().includes("qualidade");
}

// Função do módulo: tipo requer qualidade
function tipoRequerQualidade(d){
  const cfg = DEMANDAS_TIPOS_CONFIG.find(t=>t.nome===d.tipoDemanda);
  return !!(cfg && cfg.requerAnaliseQualidade);
}

// Função do módulo: carregar comentarios qualidade
async function carregarComentariosQualidade(demandaId){
  const { data, error } = await sb.from("demandas_qualidade_comentarios").select("*").eq("demanda_id", demandaId).order("created_at", {ascending:false});
  if(error){ console.error("[Supabase] demandas_qualidade_comentarios:", error); comentariosQualidadeModalAtual = []; return; }
  comentariosQualidadeModalAtual = data||[];
}

// Desenha na tela: render timeline qualidade
function renderTimelineQualidade(){
  const wrap = document.getElementById("dem-qualidade-timeline");
  if(!wrap) return;
  if(!comentariosQualidadeModalAtual.length){ wrap.innerHTML = '<span class="estrutura-vazio">Nenhuma movimentação registrada ainda.</span>'; return; }
  const rotulos = {solicitacao:["Solicitação","#9f8167"], reprovacao:["Reprovado","#ee3135"], resolucao:["Resolvido","#faa61a"], aprovacao:["Aprovado","#00b262"], comentario:["Comentário","#9f8167"]};
  wrap.innerHTML = comentariosQualidadeModalAtual.map(c=>{
    const autor = USUARIOS.find(u=>u.id===c.autor_id);
    const [rotulo, cor] = rotulos[c.tipo] || rotulos.comentario;
    return `<div class="admin-item-row qualidade-comentario-item">
      <span class="qc-meta"><span class="qc-tipo-tag" style="background:${cor};">${rotulo}</span>${autor?autor.nome:"—"} · ${new Date(c.created_at).toLocaleString("pt-BR")}</span>
      <span class="txt">${c.comentario}</span>
    </div>`;
  }).join("");
}

// Função do módulo: registrar evento qualidade
async function registrarEventoQualidade(demandaId, tipo, comentario){
  const { data, error } = await sb.from("demandas_qualidade_comentarios").insert({demanda_id:demandaId, autor_id:currentUser.id, comentario, tipo}).select().single();
  if(error){ console.error("[Supabase] registrar evento qualidade:", error); return null; }
  comentariosQualidadeModalAtual.unshift(data);
  return data;
}

// Função do módulo: solicitar analise qualidade
async function solicitarAnaliseQualidade(){
  const id = Number(document.getElementById("dem-id").value);
  const d = DEMANDAS.find(x=>x.id===id);
  if(!d) return;
  if(!ehAdministrador() && !ehResponsavelDaDemanda(d)) return;
  const agoraIso = new Date().toISOString();
  const { error } = await sb.from("demandas").update({aprovacao_qualidade:"Em análise", qualidade_solicitada_em: agoraIso}).eq("id", id);
  if(error){ alert("Erro ao solicitar análise: "+error.message); return; }
  d.aprovacaoQualidade = "Em análise"; d.qualidadeSolicitadaEm = agoraIso;
  await registrarEventoQualidade(id, "solicitacao", "Solicitou análise de qualidade.");
  await notificarAdminsCoordenadores("demanda_qualidade_solicitada", "Solicitação de análise de qualidade", d.demanda.slice(0,80), "demanda", d.id);
  renderTimelineQualidade();
  renderBlocoQualidade(d);
  mostrarToast("Solicitação enviada ao administrador.");
}

// Função do módulo: aprovar qualidade
async function aprovarQualidade(){
  if(!ehAdministrador()) return;
  const id = Number(document.getElementById("dem-id").value);
  const d = DEMANDAS.find(x=>x.id===id);
  if(!d) return;
  const agoraIso = new Date().toISOString();
  const { error } = await sb.from("demandas").update({aprovacao_qualidade:"Aprovado", aprovado_por:currentUser.id, aprovado_em:agoraIso}).eq("id", id);
  if(error){ alert("Erro ao aprovar: "+error.message); return; }
  d.aprovacaoQualidade = "Aprovado"; d.aprovadoPor = currentUser.id; d.aprovadoEm = agoraIso;
  await registrarEventoQualidade(id, "aprovacao", "Análise de qualidade aprovada.");
  if(d.responsavelUsuarioId) criarNotificacao(d.responsavelUsuarioId, "demanda_qualidade_aprovada", "Análise de qualidade aprovada", d.demanda.slice(0,80), "demanda", d.id);
  acaoPlataforma("Análise de qualidade aprovada", d.demanda.slice(0,80), "demanda", d.id, [d.responsavelUsuarioId]);
  renderTimelineQualidade();
  renderBlocoQualidade(d);
  mostrarToast("Análise aprovada.");
}

// Função do módulo: iniciar reprovacao
function iniciarReprovacao(){
  if(!ehAdministrador()) return;
  const acoes = document.getElementById("dem-qualidade-acoes");
  acoes.innerHTML = `
    <textarea class="qualidade-textarea-reprovar" id="dem-texto-reprovacao" rows="3" placeholder="Descreva a alteração que precisa ser feita..."></textarea>
    <div style="display:flex; gap:10px;">
      <button type="button" class="btn-primary inline" style="background:var(--vermelho);" onclick="confirmarReprovacao()">Confirmar reprovação</button>
      <button type="button" class="btn-secondary" onclick="cancelarReprovacao()">Cancelar</button>
    </div>`;
}

// Remove/cancela: cancelar reprovacao
function cancelarReprovacao(){
  const id = Number(document.getElementById("dem-id").value);
  renderBlocoQualidade(DEMANDAS.find(x=>x.id===id));
}

// Função do módulo: confirmar reprovacao
async function confirmarReprovacao(){
  const texto = document.getElementById("dem-texto-reprovacao").value.trim();
  if(!texto){ alert("Descreva a alteração a ser feita."); return; }
  const id = Number(document.getElementById("dem-id").value);
  const d = DEMANDAS.find(x=>x.id===id);
  if(!d) return;
  const agoraIso = new Date().toISOString();
  const { error } = await sb.from("demandas").update({aprovacao_qualidade:"Reprovado", aprovado_por:currentUser.id, aprovado_em:agoraIso}).eq("id", id);
  if(error){ alert("Erro ao reprovar: "+error.message); return; }
  d.aprovacaoQualidade = "Reprovado"; d.aprovadoPor = currentUser.id; d.aprovadoEm = agoraIso;
  await registrarEventoQualidade(id, "reprovacao", texto);
  if(d.responsavelUsuarioId) criarNotificacao(d.responsavelUsuarioId, "demanda_qualidade_reprovada", "Correção solicitada na demanda", texto.slice(0,80), "demanda", d.id);
  acaoPlataforma("Correção solicitada na demanda", d.demanda.slice(0,80), "demanda", d.id, [d.responsavelUsuarioId]);
  renderTimelineQualidade();
  renderBlocoQualidade(d);
  mostrarToast("Reprovação registrada.");
}

// Função do módulo: marcar resolvido
async function marcarResolvido(){
  const id = Number(document.getElementById("dem-id").value);
  const d = DEMANDAS.find(x=>x.id===id);
  if(!d) return;
  if(!ehAdministrador() && !ehResponsavelDaDemanda(d)) return;
  const agoraIso = new Date().toISOString();
  const { error } = await sb.from("demandas").update({aprovacao_qualidade:"Em análise", qualidade_solicitada_em: agoraIso}).eq("id", id);
  if(error){ alert("Erro ao marcar como resolvido: "+error.message); return; }
  d.aprovacaoQualidade = "Em análise"; d.qualidadeSolicitadaEm = agoraIso;
  await registrarEventoQualidade(id, "resolucao", "Marcou a correção como resolvida.");
  await notificarAdminsCoordenadores("demanda_qualidade_resolvida", "Correção resolvida — aguardando reanálise", d.demanda.slice(0,80), "demanda", d.id);
  renderTimelineQualidade();
  renderBlocoQualidade(d);
  mostrarToast("Marcado como resolvido. O administrador foi notificado.");
}

// Função do módulo: demandas ativas do usuario
/* ---- Disponibilidade de usuários (carga horária diária x demandas ativas) ---- */
function demandasAtivasDoUsuario(usuarioId){
  return DEMANDAS.filter(d=> d.responsavelUsuarioId===usuarioId && !nomeEtapaDemanda(d).toLowerCase().includes("conclu") && d.aprovacaoQualidade!=="Aprovado");
}

// Função do módulo: horas alocadas usuario
function horasAlocadasUsuario(usuarioId){
  return demandasAtivasDoUsuario(usuarioId).reduce((soma,d)=>{
    const cfg = DEMANDAS_TIPOS_CONFIG.find(t=>t.nome===d.tipoDemanda);
    return soma + (cfg && cfg.tempoEstimadoHoras!=null ? Number(cfg.tempoEstimadoHoras) : 0);
  }, 0);
}

// Desenha na tela: render disponibilidade usuarios
function renderDisponibilidadeUsuarios(){
  const wrap = document.getElementById("lista-disponibilidade-usuarios");
  if(!wrap) return;
  const ativos = USUARIOS.filter(u=>u.ativo!==false);
  if(!ativos.length){ wrap.innerHTML = '<span class="estrutura-vazio">Nenhum usuário ativo.</span>'; return; }
  wrap.innerHTML = ativos.map(u=>{
    const alocado = horasAlocadasUsuario(u.id);
    const limite = u.cargaHorariaDiaria || 8;
    const disponivel = limite - alocado;
    const pct = limite>0 ? Math.min(100, Math.round((alocado/limite)*100)) : 0;
    const cor = disponivel < 0 ? "var(--vermelho)" : pct>80 ? "var(--laranja)" : "var(--verde-viv)";
    const qtdDemandas = demandasAtivasDoUsuario(u.id).length;
    const rotuloDisponivel = disponivel>=0
      ? formatarDuracao(disponivel*3600)+" disponíveis"
      : "sobrecarregado em "+formatarDuracao(-disponivel*3600);
    return `<div class="disp-usuario-card">
      <div class="disp-usuario-topo">
        <div class="disp-usuario-nome"><span class="kc-avatar" style="width:24px; height:24px; font-size:9px; display:inline-flex;">${iniciaisTexto(u.nome)}</span>${u.nome}</div>
        <span class="disp-usuario-valor" style="color:${cor};">${rotuloDisponivel}</span>
      </div>
      <div class="disp-barra"><div class="disp-barra-fill" style="width:${pct}%; background:${cor};"></div></div>
      <span class="sub">${alocado.toFixed(1)}h estimadas de ${limite}h/dia · ${qtdDemandas} demanda(s) ativa(s)</span>
    </div>`;
  }).join("");
}

// Função do módulo: segunda da semana disp
function segundaDaSemanaDisp(offset){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const dia = hoje.getDay();
  const diffParaSegunda = (dia===0 ? -6 : 1-dia);
  hoje.setDate(hoje.getDate()+diffParaSegunda+offset*7);
  return hoje;
}

// Função do módulo: horas alocadas usuario no dia
function horasAlocadasUsuarioNoDia(usuarioId, dataISO){
  return DEMANDAS.filter(d=>d.responsavelUsuarioId===usuarioId && d.agendadoPara===dataISO && !demandaConcluida(d))
    .reduce((soma,d)=>{
      const cfg = DEMANDAS_TIPOS_CONFIG.find(t=>t.nome===d.tipoDemanda);
      return soma + (cfg && cfg.tempoEstimadoHoras!=null ? Number(cfg.tempoEstimadoHoras) : 0);
    }, 0);
}

// Função do módulo: cor carga dia
function corCargaDia(alocado, limite){
  if(alocado<=0) return "#e5e0d3";
  if(limite<=0) return "#ee3135";
  const pct = alocado/limite;
  if(pct<0.6) return "#54be95";
  if(pct<=1) return "#faa61a";
  return "#ee3135";
}

// Função do módulo: mudar visao disponibilidade
function mudarVisaoDisponibilidade(modo){
  dispModoVisao = modo;
  document.getElementById("btn-disp-semana").classList.toggle("ativo", modo==="semana");
  document.getElementById("btn-disp-mes").classList.toggle("ativo", modo==="mes");
  renderGradeDisponibilidade();
}

// Função do módulo: navegar disponibilidade
function navegarDisponibilidade(delta){
  if(dispModoVisao==="semana") dispOffsetSemana += delta;
  else dispOffsetMes += delta;
  renderGradeDisponibilidade();
}

// Desenha na tela: render grade disponibilidade
function renderGradeDisponibilidade(){
  const wrap = document.getElementById("disp-grid-usuarios");
  const label = document.getElementById("disp-periodo-label");
  if(!wrap) return;
  const ativos = USUARIOS.filter(u=>u.ativo!==false);
  if(!ativos.length){ wrap.innerHTML = '<span class="estrutura-vazio">Nenhum usuário ativo.</span>'; return; }

  if(dispModoVisao==="semana"){
    const seg = segundaDaSemanaDisp(dispOffsetSemana);
    const dias = []; for(let i=0;i<5;i++){ const d=new Date(seg); d.setDate(seg.getDate()+i); dias.push(d); }
    if(label) label.textContent = dias[0].toLocaleDateString("pt-BR")+" – "+dias[4].toLocaleDateString("pt-BR");
    const nomesDias = ["Seg","Ter","Qua","Qui","Sex"];
    wrap.innerHTML = ativos.map(u=>{
      const limite = u.cargaHorariaDiaria || 8;
      const celulas = dias.map((d,i)=>{
        const iso = d.toISOString().slice(0,10);
        const alocado = horasAlocadasUsuarioNoDia(u.id, iso);
        const cor = corCargaDia(alocado, limite);
        return `<div class="disp-dia-semana-cel" style="border-left:4px solid ${cor};">
          <div class="dsc-data">${nomesDias[i]} ${String(d.getDate()).padStart(2,"0")}</div>
          <div class="dsc-horas" style="color:${alocado>0?cor:"var(--areia-esc)"};">${alocado>0?alocado.toFixed(1)+"h":"livre"}</div>
        </div>`;
      }).join("");
      return `<div class="disp-usuario-linha">
        <div class="disp-nome"><span class="kc-avatar" style="width:22px; height:22px; font-size:8.5px; display:inline-flex;">${iniciaisTexto(u.nome)}</span>${u.nome} <span class="sub" style="font-weight:400;">(${limite}h/dia)</span></div>
        <div class="disp-dias-semana">${celulas}</div>
      </div>`;
    }).join("");
  } else {
    const hojeBase = new Date();
    const ano = hojeBase.getFullYear(), mesBase = hojeBase.getMonth()+dispOffsetMes;
    const primeiroDia = new Date(ano, mesBase, 1);
    const ultimoDia = new Date(ano, mesBase+1, 0);
    if(label) label.textContent = primeiroDia.toLocaleDateString("pt-BR",{month:"long", year:"numeric"});
    const qtdDias = ultimoDia.getDate();
    wrap.innerHTML = ativos.map(u=>{
      const limite = u.cargaHorariaDiaria || 8;
      let celulas = "";
      for(let dia=1; dia<=qtdDias; dia++){
        const d = new Date(ano, mesBase, dia);
        const iso = d.toISOString().slice(0,10);
        const alocado = horasAlocadasUsuarioNoDia(u.id, iso);
        const cor = corCargaDia(alocado, limite);
        celulas += `<div class="disp-dia-mes-cel" style="background:${cor};" title="${d.toLocaleDateString("pt-BR")}: ${alocado.toFixed(1)}h alocadas de ${limite}h"></div>`;
      }
      return `<div class="disp-usuario-linha">
        <div class="disp-nome"><span class="kc-avatar" style="width:22px; height:22px; font-size:8.5px; display:inline-flex;">${iniciaisTexto(u.nome)}</span>${u.nome} <span class="sub" style="font-weight:400;">(${limite}h/dia)</span></div>
        <div class="disp-dias-mes">${celulas}</div>
      </div>`;
    }).join("");
  }
}

// Reage ao evento:: on campo etapa change
function onCampoEtapaChange(){
  const id = Number(document.getElementById("dem-id").value);
  const d = DEMANDAS.find(x=>x.id===id);
  if(!d) return;
  const etapaSelecionada = Number(document.getElementById("dem-etapa").value);
  renderBlocoQualidade({...d, etapaId: etapaSelecionada});
}

// Desenha na tela: render bloco qualidade
function renderBlocoQualidade(d){
  const titulo = document.getElementById("dem-qualidade-titulo");
  const bloco = document.getElementById("dem-qualidade-bloco");
  if(!titulo || !bloco) return;
  const precisa = d && tipoRequerQualidade(d) && (etapaEhAnaliseQualidade(d) || d.aprovacaoQualidade!=="Pendente");
  const cardQ = document.getElementById("dem-qualidade-card");
  if(cardQ) cardQ.style.display = precisa ? "block" : "none";
  titulo.style.display = precisa ? "flex" : "none";
  bloco.style.display = precisa ? "block" : "none";
  if(!precisa) return;

  const admin = ehAdministrador();
  const responsavel = ehResponsavelDaDemanda(d);
  const estado = d.aprovacaoQualidade || "Pendente";
  const cores = {"Pendente":"#9f8167", "Em análise":"#faa61a", "Reprovado":"#ee3135", "Aprovado":"#00b262"};
  document.getElementById("dem-qualidade-status-badge").innerHTML =
    `<span class="qualidade-status-pill" style="background:${cores[estado]}22; color:${cores[estado]};">${estado}</span>`;

  const acoes = document.getElementById("dem-qualidade-acoes");
  let html = "";
  if(estado === "Pendente"){
    html = (admin||responsavel)
      ? `<button type="button" class="btn-primary inline" onclick="solicitarAnaliseQualidade()">Solicitar Análise de Qualidade</button>`
      : `<span class="sub">Aguardando o responsável solicitar a análise de qualidade.</span>`;
  } else if(estado === "Em análise"){
    html = admin
      ? `<div style="display:flex; gap:10px;">
          <button type="button" class="btn-primary inline" onclick="aprovarQualidade()">Aprovado</button>
          <button type="button" class="btn-secondary" style="border-color:var(--vermelho); color:var(--vermelho);" onclick="iniciarReprovacao()">Reprovado</button>
        </div>`
      : `<span class="sub">Aguardando análise do administrador.</span>`;
  } else if(estado === "Reprovado"){
    const ultimaCorrecao = comentariosQualidadeModalAtual.find(c=>c.tipo==="reprovacao");
    if(ultimaCorrecao) html += `<div class="qualidade-correcao-box"><strong>Correção solicitada:</strong><br>${ultimaCorrecao.comentario}</div>`;
    if(admin||responsavel) html += `<button type="button" class="btn-primary inline" onclick="marcarResolvido()">Resolvido</button>`;
  } else if(estado === "Aprovado"){
    html = `<span class="sub" style="color:var(--verde-viv); font-weight:600;">Análise de qualidade aprovada${d.aprovadoEm ? " em "+new Date(d.aprovadoEm).toLocaleString("pt-BR") : ""}.</span>`;
  }
  acoes.innerHTML = html;
}

// Atualiza: atualizar display entrega
function atualizarDisplayEntrega(){
  const val = document.getElementById("dem-entregue-em").value;
  const btn = document.getElementById("btn-entregar-demanda");
  const disp = document.getElementById("dem-entregue-em-display");
  if(val){
    disp.style.display = "block";
    const cEnt = document.getElementById("dem-campo-entrega"); if(cEnt) cEnt.style.display = "";
    const botaoDesfazer = ehAdministrador() ? `<button type="button" class="del-btn" style="display:inline; padding:2px 8px;" id="btn-desfazer-entrega" onclick="desfazerEntregaDemanda()">Desfazer</button>` : "";
    disp.innerHTML = `Entregue em <strong>${val.split("-").reverse().join("/")}</strong>${botaoDesfazer ? " — "+botaoDesfazer : ""}`;
    btn.style.display = "none";
  } else {
    disp.style.display = "none";
    disp.innerHTML = "";
    const cEnt = document.getElementById("dem-campo-entrega"); if(cEnt) cEnt.style.display = "none";
    btn.style.display = "inline-flex";
  }
  if(typeof atualizarCabecalhoJanelaDemanda==="function") atualizarCabecalhoJanelaDemanda();
}

// Função do módulo: registrar entrega demanda
async function registrarEntregaDemanda(){
  if(sessaoAbertaModalAtual){
    await toggleTimerDemanda();
  }
  document.getElementById("dem-entregue-em").value = new Date().toISOString().slice(0,10);
  const fluxoId = Number(document.getElementById("dem-fluxo-id-atual").value) || null;
  const etapaConcluida = FLUXO_ETAPAS.find(e=>e.fluxoId===fluxoId && e.nome.toLowerCase().includes("conclu"));
  if(etapaConcluida){
    document.getElementById("dem-etapa").value = etapaConcluida.id;
  } else {
    mostrarToast("Entrega registrada. Não há etapa de conclusão nesse fluxo — ajuste o status manualmente.");
  }
  atualizarDisplayEntrega();
  const demandaId = Number(document.getElementById("dem-id").value);
  const demandaEmEdicao = DEMANDAS.find(x=>x.id===demandaId);
  if(demandaEmEdicao) aplicarPermissoesModalDemanda(demandaEmEdicao);
}

// Função do módulo: desfazer entrega demanda
function desfazerEntregaDemanda(){
  document.getElementById("dem-entregue-em").value = "";
  const fluxoId = Number(document.getElementById("dem-fluxo-id-atual").value) || null;
  const etapasDoFluxo = FLUXO_ETAPAS.filter(e=>e.fluxoId===fluxoId).sort((a,b)=>a.ordem-b.ordem);
  const etapaReabertura = etapasDoFluxo.find(e=>!e.nome.toLowerCase().includes("conclu")) || etapasDoFluxo[0];
  if(etapaReabertura) document.getElementById("dem-etapa").value = etapaReabertura.id;
  atualizarDisplayEntrega();
  const demandaId = Number(document.getElementById("dem-id").value);
  const demandaEmEdicao = DEMANDAS.find(x=>x.id===demandaId);
  if(demandaEmEdicao) aplicarPermissoesModalDemanda(demandaEmEdicao);
  mostrarToast("Entrega desfeita — status reaberto para ajuste.");
}

// Verifica se: validar agendado para
function validarAgendadoPara(){
  const agendado = document.getElementById("dem-agendado-para").value;
  const limite = document.getElementById("dem-data-limite").value;
  const aviso = document.getElementById("dem-agendado-aviso");
  if(agendado && limite && agendado > limite){
    aviso.style.display = "block";
    aviso.textContent = "A data agendada não pode ser depois do limite de entrega ("+limite.split("-").reverse().join("/")+").";
    return false;
  }
  aviso.style.display = "none";
  aviso.textContent = "";
  return true;
}

// Preenche: popular etapas modal demanda
function popularEtapasModalDemanda(){
  const fluxoId = Number(document.getElementById("dem-fluxo-id-atual").value) || null;
  const selEtapa = document.getElementById("dem-etapa");
  const etapas = fluxoId ? FLUXO_ETAPAS.filter(e=>e.fluxoId===fluxoId).sort((a,b)=>a.ordem-b.ordem) : [];
  const atual = selEtapa.value;
  selEtapa.innerHTML = etapas.map(e=>`<option value="${e.id}">${e.nome}</option>`).join("") || '<option value="">Selecione um tipo de demanda</option>';
  if(etapas.some(e=>String(e.id)===atual)) selEtapa.value = atual;
}

// Abre: abrir modal demanda
async function abrirModalDemanda(id, etapaIdPreDefinida){
  if(timerIntervalIdDemanda){ clearInterval(timerIntervalIdDemanda); timerIntervalIdDemanda=null; }
  sessoesModalAtual = []; sessaoAbertaModalAtual = null;
  { const dts = document.getElementById("dem-ts-data"); if(dts){ dts.value = dataISOLocal(new Date()); document.getElementById("dem-ts-ini").value = ""; document.getElementById("dem-ts-fim").value = ""; } }

  document.getElementById("form-demanda").reset();
  document.getElementById("dem-id").value = "";
  demPopularConvidados(id);
  document.getElementById("dem-fluxo-id-atual").value = "";
  document.getElementById("dem-categoria").innerHTML = (DEMANDAS_OPCOES.categoria||[]).map(v=>`<option>${v}</option>`).join("");
  document.getElementById("dem-area").innerHTML = '<option value="">Selecione</option>' + (DEMANDAS_OPCOES.area||[]).map(v=>`<option>${v}</option>`).join("");
  document.getElementById("dem-tipo-atividade").innerHTML = '<option value="">Selecione</option>' + (DEMANDAS_OPCOES.tipo_atividade||[]).map(v=>`<option>${v}</option>`).join("");
  document.getElementById("dem-tipo").innerHTML = '<option value="">Selecione...</option>' + DEMANDAS_TIPOS_CONFIG.map(t=>`<option>${t.nome}</option>`).join("");
  document.getElementById("dem-unidade").innerHTML = '<option value="">—</option>' + UNIDADES.map(u=>`<option>${u.nome}</option>`).join("");
  document.getElementById("dem-responsavel").innerHTML = '<option value="">Selecione um usuário</option>' + USUARIOS.filter(u=>u.ativo!==false).map(u=>`<option value="${u.id}">${u.nome}</option>`).join("");
  document.getElementById("dem-mae").innerHTML = '<option value="">Nenhuma</option>' + DEMANDAS.filter(d=>d.id!==id).map(d=>`<option value="${d.id}">#${d.id} — ${d.demanda.slice(0,40)}</option>`).join("");

  let demandaAtual = null;
  if(id){
    demandaAtual = DEMANDAS.find(x=>x.id===id);
    if(!demandaAtual) return;
    document.getElementById("btn-remover-demanda").style.display = ehAdminOuCoordenador() ? "inline-block" : "none";
    document.getElementById("demanda-modal-title").textContent = demandaAtual.demanda.length>110 ? demandaAtual.demanda.slice(0,110)+"…" : demandaAtual.demanda;
    document.getElementById("dem-id").value = demandaAtual.id;
    document.getElementById("dem-descricao").value = demandaAtual.demanda||"";
    document.getElementById("dem-categoria").value = demandaAtual.categoria||"";
    document.getElementById("dem-area").value = demandaAtual.area||"";
    document.getElementById("dem-tipo-atividade").value = demandaAtual.tipoAtividade||"";
    document.getElementById("dem-tipo").value = demandaAtual.tipoDemanda||"";
    document.getElementById("dem-prioridade").value = demandaAtual.prioridade||"Normal";
    document.getElementById("dem-data-entrada").value = demandaAtual.dataEntrada||"";
    document.getElementById("dem-data-limite").value = demandaAtual.dataLimite||"";
    document.getElementById("dem-agendado-para").value = demandaAtual.agendadoPara||"";
    document.getElementById("dem-entregue-em").value = demandaAtual.entregueEm||"";
    atualizarDisplayEntrega();
    document.getElementById("dem-satisfacao").value = demandaAtual.satisfacaoEntrega||"";
    document.getElementById("dem-saldo-anterior").value = demandaAtual.saldoAnterior||"";
    document.getElementById("dem-unidade").value = demandaAtual.unidade||"";
    document.getElementById("dem-responsavel").value = demandaAtual.responsavelUsuarioId||"";
    document.getElementById("dem-fluxo-id-atual").value = demandaAtual.fluxoId||"";
    popularEtapasModalDemanda();
    document.getElementById("dem-etapa").value = demandaAtual.etapaId||"";
    document.getElementById("dem-aguardando-item").value = demandaAtual.aguardandoItem||"";
    document.getElementById("dem-aguardando-responsavel").value = demandaAtual.aguardandoResponsavel||"";
    document.getElementById("dem-email").value = demandaAtual.emailRelacionado||"";
    document.getElementById("dem-comentarios").value = demandaAtual.comentarios||"";
    document.getElementById("dem-mae").value = demandaAtual.demandaMaeId||"";

    const cfg = DEMANDAS_TIPOS_CONFIG.find(t=>t.nome===demandaAtual.tipoDemanda);
    document.getElementById("dem-tempo-estimado-display").textContent = (cfg && cfg.tempoEstimadoHoras!=null) ? formatarDuracao(cfg.tempoEstimadoHoras*3600) : "Não definido para este tipo";

    await carregarComentariosQualidade(demandaAtual.id);
    renderTimelineQualidade();
    renderBlocoQualidade(demandaAtual);

    await carregarSessoesModalDemanda(demandaAtual.id);
    const btnTimer = document.getElementById("btn-timer-demanda");
    if(sessaoAbertaModalAtual){
      btnTimer.innerHTML = ICONE_PAUSE+" Pausar"; btnTimer.classList.add("timer-ativo");
      timerIntervalIdDemanda = setInterval(atualizarDisplayTempoDemanda, 1000);
    } else {
      btnTimer.innerHTML = ICONE_PLAY+" Iniciar"; btnTimer.classList.remove("timer-ativo");
    }
    renderHistoricoSessoesModal();
    atualizarDisplayTempoDemanda();
    renderSubDemandasModal(demandaAtual);
  } else {
    renderSubDemandasModal(null);
    document.getElementById("btn-remover-demanda").style.display = "none";
    document.getElementById("demanda-modal-title").textContent = "Nova demanda";
    document.getElementById("dem-data-entrada").valueAsDate = new Date();
    document.getElementById("dem-tempo-estimado-display").textContent = "Selecione o tipo de demanda";
    document.getElementById("dem-tempo-gasto-display").textContent = "0min";
    document.getElementById("dem-tempo-restante-display").textContent = "—";
    document.getElementById("btn-timer-demanda").innerHTML = ICONE_PLAY+" Iniciar";
    document.getElementById("btn-timer-demanda").classList.remove("timer-ativo");
    atualizarDisplayEntrega();
    renderHistoricoSessoesModal();
    popularEtapasModalDemanda();
    comentariosQualidadeModalAtual = [];
    document.getElementById("dem-qualidade-card").style.display = "none";
    document.getElementById("dem-qualidade-titulo").style.display = "none";
    document.getElementById("dem-qualidade-bloco").style.display = "none";
  }
  aplicarPermissoesModalDemanda(demandaAtual);
  atualizarCabecalhoJanelaDemanda();
  document.body.style.overflow = "hidden";
  document.getElementById("modal-demanda").style.display = "flex";
  document.querySelector("#modal-demanda .dm-col-principal").scrollTop = 0;
  iniciarChatDemanda(demandaAtual ? demandaAtual.id : null);
}

// Fecha: fechar modal demanda
function fecharModalDemanda(){
  if(timerIntervalIdDemanda){ clearInterval(timerIntervalIdDemanda); timerIntervalIdDemanda = null; }
  pararChatDemanda();
  document.getElementById("modal-demanda").style.display = "none";
  if(document.getElementById("modal-reuniao").style.display!=="flex") document.body.style.overflow = "";
}

// Salva no banco: salvar demanda
async function salvarDemanda(ev){
  ev.preventDefault();
  const id = document.getElementById("dem-id").value;
  const fluxoVal = document.getElementById("dem-fluxo-id-atual").value;
  const etapaVal = document.getElementById("dem-etapa").value;
  if(!fluxoVal || !etapaVal){ alert("Selecione um Tipo de demanda válido — ele define o fluxo e as etapas."); return false; }
  if(!validarAgendadoPara()){ alert("A data agendada não pode ultrapassar o limite de entrega da demanda."); return false; }
  const respId = document.getElementById("dem-responsavel").value || null;
  const usuarioResp = respId ? USUARIOS.find(u=>u.id===respId) : null;
  const dados = {
    demanda: document.getElementById("dem-descricao").value.trim(),
    categoria: document.getElementById("dem-categoria").value,
    area: document.getElementById("dem-area").value,
    tipoAtividade: document.getElementById("dem-tipo-atividade").value,
    tipoDemanda: document.getElementById("dem-tipo").value,
    prioridade: document.getElementById("dem-prioridade").value,
    dataEntrada: document.getElementById("dem-data-entrada").value,
    dataLimite: document.getElementById("dem-data-limite").value,
    tempoEstimado: document.getElementById("dem-tempo-estimado-display").textContent,
    agendadoPara: document.getElementById("dem-agendado-para").value,
    entregueEm: document.getElementById("dem-entregue-em").value,
    tempoGasto: document.getElementById("dem-tempo-gasto-display").textContent,
    satisfacaoEntrega: document.getElementById("dem-satisfacao").value.trim(),
    saldoAnterior: document.getElementById("dem-saldo-anterior").value.trim(),
    unidade: document.getElementById("dem-unidade").value,
    responsavel: usuarioResp ? usuarioResp.nome : "",
    responsavelUsuarioId: respId,
    fluxoId: Number(fluxoVal),
    etapaId: Number(etapaVal),
    aguardandoItem: document.getElementById("dem-aguardando-item").value.trim(),
    aguardandoResponsavel: document.getElementById("dem-aguardando-responsavel").value.trim(),
    emailRelacionado: document.getElementById("dem-email").value.trim(),
    comentarios: document.getElementById("dem-comentarios").value.trim(),
    demandaMaeId: document.getElementById("dem-mae").value ? Number(document.getElementById("dem-mae").value) : null
  };
  if(id){
    const agoraIso = new Date().toISOString();
    const demandaAntes = DEMANDAS.find(x=>x.id===Number(id));
    const etapaAntes = demandaAntes ? nomeEtapaDemanda(demandaAntes) : null;
    const payloadUpdate = demandaToDb(dados);
    delete payloadUpdate.analise_qualidade;
    delete payloadUpdate.aprovacao_qualidade;
    delete payloadUpdate.aprovado_por;
    delete payloadUpdate.aprovado_em;
    delete payloadUpdate.qualidade_solicitada_em;
    const { error } = await sb.from("demandas").update({...payloadUpdate, updated_at: agoraIso}).eq("id", Number(id));
    if(error){ alert("Erro ao atualizar demanda: "+error.message); return false; }
    Object.assign(demandaAntes, dados, {updatedAt: agoraIso});
    const etapaDepois = nomeEtapaDemanda(demandaAntes);
    const resumoMudanca = etapaAntes && etapaAntes!==etapaDepois ? "Status alterado para: "+etapaDepois : "Demanda atualizada";
    if(demandaAntes.responsavelUsuarioId && demandaAntes.responsavelUsuarioId !== (currentUser && currentUser.id)){
      criarNotificacao(demandaAntes.responsavelUsuarioId, "demanda_atualizada", resumoMudanca, demandaAntes.demanda.slice(0,80), "demanda", demandaAntes.id);
    }
    notificarAdminsCoordenadores("demanda_atualizada", resumoMudanca, demandaAntes.demanda.slice(0,80), "demanda", demandaAntes.id, [demandaAntes.responsavelUsuarioId]);
    mostrarToast("Demanda atualizada.");
  } else {
    const { data, error } = await sb.from("demandas").insert({...demandaToDb(dados), created_by: currentUser?currentUser.id:null}).select().single();
    if(error){ alert("Erro ao criar demanda: "+error.message); return false; }
    const nova = mapDemandaFromDb(data);
    DEMANDAS.unshift(nova);
    if(nova.responsavelUsuarioId && nova.responsavelUsuarioId !== (currentUser && currentUser.id)){
      await criarNotificacao(nova.responsavelUsuarioId, "demanda_atribuida", "Nova demanda atribuída a você", nova.demanda.slice(0,80), "demanda", nova.id);
    }
    await notificarAdminsCoordenadores("demanda_atualizada", "Nova demanda criada", nova.demanda.slice(0,80), "demanda", nova.id, [nova.responsavelUsuarioId]);
    mostrarToast("Demanda criada.");
    const convIds = [...document.querySelectorAll(".dem-conv")].filter(c=>c.checked).map(c=>c.value).filter(u=>u!==nova.responsavelUsuarioId);
    if(convIds.length){
      const dadosConv = {demanda:dados.demanda, categoria:dados.categoria, area:dados.area, tipoAtividade:dados.tipoAtividade, tipoDemanda:dados.tipoDemanda, prioridade:dados.prioridade, dataLimite:dados.dataLimite, tempoEstimado:dados.tempoEstimado, unidade:dados.unidade, fluxoId:dados.fluxoId, etapaId:dados.etapaId, emailRelacionado:dados.emailRelacionado, comentarios:dados.comentarios};
      const nEnv = await enviarConvites("tarefa", nova.demanda.slice(0,80), "", dados.agendadoPara || dados.dataLimite || dataISOLocal(new Date()), dadosConv, nova.id, convIds);
      if(nEnv) mostrarToast("Demanda criada e "+nEnv+" convite"+(nEnv>1?"s enviados":" enviado")+".");
    }
  }
  fecharModalDemanda();
  popularFiltrosDemandas();
  renderVisaoAtivaDemandas();
  return false;
}

// Remove/cancela: remover demanda
async function removerDemanda(){
  const id = Number(document.getElementById("dem-id").value);
  if(!id) return;
  const nFilhas = DEMANDAS.filter(d=>d.demandaMaeId===id).length;
  if(!confirm(nFilhas ? "Remover esta demanda e as suas "+nFilhas+" sub-demanda"+(nFilhas===1?"":"s")+"?" : "Remover esta demanda?")) return;
  const { data: apagadas, error } = await sb.from("demandas").delete().eq("id", id).select("id");
  if(error){ alert("Erro ao remover demanda: "+error.message); return; }
  if(!apagadas || !apagadas.length){ alert("Não foi possível remover: apenas Administrador ou Coordenador podem excluir demandas."); return; }
  { const _d = DEMANDAS.find(d=>d.id===id); acaoPlataforma("Demanda removida", _d ? _d.demanda.slice(0,80) : "#"+id, null, null); }
  DEMANDAS = DEMANDAS.filter(d=>d.id!==id && d.demandaMaeId!==id);
  fecharModalDemanda();
  renderVisaoAtivaDemandas();
}

// Atualiza: atualizar cabecalho janela demanda
/* ---- Janela da demanda: cabeçalho (chips e etapas) ---- */
function atualizarCabecalhoJanelaDemanda(){
  const idEl = document.getElementById("dem-id");
  if(!idEl) return;
  const id = idEl.value;
  document.getElementById("dem-key").textContent = id ? "#"+id : "Nova";
  const prio = document.getElementById("dem-prioridade").value || "Normal";
  const prazo = calcularControlePrazo(document.getElementById("dem-data-limite").value, document.getElementById("dem-entregue-em").value);
  const limiteBr = document.getElementById("dem-data-limite").value ? " · "+formatarDataBR(document.getElementById("dem-data-limite").value) : "";
  const resp = USUARIOS.find(u=>u.id===document.getElementById("dem-responsavel").value);
  const tipo = document.getElementById("dem-tipo").value;
  const un = document.getElementById("dem-unidade").value;
  const chips = [];
  chips.push(`<span class="dm-chip"><i style="background:${corPrioridade(prio)};"></i>Prioridade ${escHtml(prio.toLowerCase())}</span>`);
  const barraPrazo = "";
  chips.push(`<span class="dm-chip"><i style="background:${prazo.cor};"></i>${prazo.label}${limiteBr}${barraPrazo ? '<span class="dm-prazo-wrap">'+barraPrazo+'</span>' : ""}</span>`);
  if(tipo) chips.push(`<span class="dm-chip">${escHtml(tipo)}</span>`);
  if(un) chips.push(`<span class="dm-chip">${escHtml(un)}</span>`);
  if(resp) chips.push(`<span class="dm-chip"><span class="jira-avatar-row"><span class="av" style="background:${corAvatarPorNome(resp.nome)}; width:18px; height:18px; font-size:8px;">${iniciaisTexto(resp.nome)}</span>${escHtml(resp.nome)}</span></span>`);
  document.getElementById("dem-chips").innerHTML = chips.join("");
  const sel = document.getElementById("dem-etapa");
  const ops = [...sel.options].filter(o=>o.value);
  const idx = ops.findIndex(o=>o.value===sel.value);
  document.getElementById("dem-stepper").innerHTML = ops.map((o,i)=>`<span class="dm-step ${i<idx?"feito":i===idx?"atual":""}">${escHtml(o.textContent)}</span>`).join("");
}

// Função do módulo: parar chat demanda
function pararChatDemanda(){
  if(chatDemanda.timer){ clearInterval(chatDemanda.timer); chatDemanda.timer = null; }
}

// Função do módulo: iniciar chat demanda
function iniciarChatDemanda(id){
  pararChatDemanda();
  chatDemanda = {id:id||null, msgs:[], timer:null};
  const inp = document.getElementById("dem-chat-input"), btn = document.getElementById("dem-chat-enviar");
  inp.value = ""; inp.style.height = "auto";
  if(!id){
    inp.disabled = true; btn.disabled = true;
    inp.placeholder = "Salve a demanda para abrir a conversa";
    renderChatDemanda(true);
    return;
  }
  inp.disabled = false; btn.disabled = false;
  inp.placeholder = "Escreva uma mensagem…";
  inp.title = "Enter envia · Shift+Enter quebra a linha";
  carregarMensagensDemanda(true).then(()=>{
    if(chatDemanda.id===id) chatDemanda.timer = setInterval(()=>carregarMensagensDemanda(false), 7000);
  });
}

// Função do módulo: carregar mensagens demanda
async function carregarMensagensDemanda(rolar){
  const id = chatDemanda.id;
  if(!id) return;
  const { data, error } = await sb.from("demandas_mensagens").select("*").eq("demanda_id", id).order("id");
  if(error){ console.error("[Supabase] demandas_mensagens:", error); return; }
  if(chatDemanda.id!==id) return;
  const assinatura = a=>a.map(m=>m.id).join(",");
  const mudou = assinatura(data||[]) !== assinatura(chatDemanda.msgs);
  chatDemanda.msgs = data||[];
  if(mudou || rolar) renderChatDemanda(!!rolar);
  if(DEMANDAS_MSG_CONT[id]!==chatDemanda.msgs.length){ DEMANDAS_MSG_CONT[id] = chatDemanda.msgs.length; }
}

// Função do módulo: linkificar texto
function linkificarTexto(txt){
  return escHtml(txt).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

// Função do módulo: rotulo dia chat
function rotuloDiaChat(iso){
  const hoje = dataISOLocal(new Date());
  if(iso===hoje) return "Hoje";
  if(iso===somarDiasISO(hoje,-1)) return "Ontem";
  return formatarDataBR(iso);
}

// Desenha na tela: render chat demanda
function renderChatDemanda(rolar){
  const el = document.getElementById("dem-chat-msgs");
  if(!el) return;
  const msgs = chatDemanda.msgs;
  document.getElementById("dem-chat-n").textContent = msgs.length ? msgs.length+(msgs.length===1?" mensagem":" mensagens") : "Sem mensagens";
  if(!msgs.length){
    el.innerHTML = `<div class="dm-chat-vazio">${ICONE_CHAT_VAZIO}${chatDemanda.id ? "Nenhuma mensagem ainda.<br>Use este espaço para alinhar prazos, tirar dúvidas e registrar decisões desta demanda." : "A conversa é liberada assim que a demanda for criada."}</div>`;
    return;
  }
  const perto = (el.scrollHeight - el.scrollTop - el.clientHeight) < 80;
  let diaAnt = "";
  const html = [];
  msgs.forEach(m=>{
    const dt = new Date(m.created_at);
    const dia = dataISOLocal(dt);
    if(dia!==diaAnt){ html.push(`<div class="dm-dia">${rotuloDiaChat(dia)}</div>`); diaAnt = dia; }
    const autor = USUARIOS.find(u=>u.id===m.autor_id);
    const nome = autor ? autor.nome : "Usuário";
    const minha = !!currentUser && m.autor_id===currentUser.id;
    const cor = corAvatarPorNome(nome);
    const podeApagar = minha || ehAdministrador();
    html.push(`<div class="dm-msg ${minha?"minha":""}">
      <span class="av" style="background:${cor};" title="${escHtml(nome)}">${iniciaisTexto(nome)}</span>
      <div class="bolha"><span class="quem" style="color:${cor};">${escHtml(nome)}</span><span class="txt">${linkificarTexto(m.mensagem)}</span><span class="hora">${podeApagar?`<button type="button" class="del" onclick="removerMensagemDemanda(${m.id})">apagar</button>`:""}${dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span></div>
    </div>`);
  });
  el.innerHTML = html.join("");
  if(rolar || perto) el.scrollTop = el.scrollHeight;
}

// Função do módulo: enviar mensagem demanda
async function enviarMensagemDemanda(){
  const id = chatDemanda.id;
  const inp = document.getElementById("dem-chat-input"), btn = document.getElementById("dem-chat-enviar");
  const txt = inp.value.trim();
  if(!id || !txt || !currentUser) return;
  btn.disabled = true;
  const { data, error } = await sb.from("demandas_mensagens").insert({demanda_id:id, autor_id:currentUser.id, mensagem:txt}).select().single();
  btn.disabled = false;
  if(error){ alert("Erro ao enviar a mensagem: "+error.message); return; }
  inp.value = ""; inp.style.height = "auto"; inp.focus();
  if(chatDemanda.id!==id) return;
  if(!chatDemanda.msgs.some(m=>m.id===data.id)) chatDemanda.msgs.push(data);
  renderChatDemanda(true);
  DEMANDAS_MSG_CONT[id] = chatDemanda.msgs.length;
  renderVisaoAtivaDemandas();
  // avisa quem participa da conversa (responsável, quem criou e quem já escreveu)
  const d = DEMANDAS.find(x=>x.id===id);
  const alvo = new Set([d&&d.responsavelUsuarioId, d&&d.criadoPor, ...chatDemanda.msgs.map(m=>m.autor_id)].filter(Boolean));
  alvo.delete(currentUser.id);
  alvo.forEach(uid=>{ criarNotificacao(uid, "demanda_mensagem", "Nova mensagem na demanda #"+id, currentUser.nome+": "+txt.slice(0,80), "demanda", id); });
}

// Remove/cancela: remover mensagem demanda
async function removerMensagemDemanda(msgId){
  if(!confirm("Apagar esta mensagem?")) return;
  const { error } = await sb.from("demandas_mensagens").delete().eq("id", msgId);
  if(error){ alert("Erro ao apagar a mensagem: "+error.message); return; }
  chatDemanda.msgs = chatDemanda.msgs.filter(m=>m.id!==msgId);
  renderChatDemanda(false);
  if(chatDemanda.id){ DEMANDAS_MSG_CONT[chatDemanda.id] = chatDemanda.msgs.length; renderVisaoAtivaDemandas(); }
}

