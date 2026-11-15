/* =====================================================================
   CENTRAL DE NOTIFICAÇÕES (sino no cabeçalho)
   ===================================================================== */
function toggleNotificacoes(){
  const dd = document.getElementById("notif-dropdown");
  const abrindo = dd.style.display === "none";
  dd.style.display = abrindo ? "block" : "none";
  if(abrindo) renderNotificacoes();
}
document.addEventListener("click", (e)=>{
  const wrap = document.querySelector(".notif-wrap");
  const dd = document.getElementById("notif-dropdown");
  if(wrap && dd && !wrap.contains(e.target)) dd.style.display = "none";
});
function tempoRelativoNotif(iso){
  if(!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs/60000);
  if(min<1) return "agora";
  if(min<60) return min+"min";
  const h = Math.floor(min/60);
  if(h<24) return h+"h";
  return Math.floor(h/24)+"d";
}
function renderNotificacoes(){
  const badge = document.getElementById("notif-badge");
  const lista = document.getElementById("notif-lista");
  if(!currentUser || !badge || !lista) return;
  const minhas = NOTIFICACOES.filter(n=>n.usuarioId===currentUser.id && !n.dispensada);
  const naoLidas = minhas.filter(n=>!n.lida).length;
  if(naoLidas>0){ badge.style.display="flex"; badge.textContent = naoLidas>9?"9+":naoLidas; }
  else badge.style.display="none";
  document.title = (naoLidas>0 ? "("+naoLidas+") " : "")+"LEMMON | SESMT HNT";
  if(!minhas.length){ lista.innerHTML = '<div class="notif-vazio">Nenhuma notificação por aqui.</div>'; return; }
  lista.innerHTML = minhas.map(n=>`
    <div class="notif-item ${n.lida?'':'nao-lida'}" onclick="abrirNotificacao(${n.id})">
      <span class="ni-titulo">${n.titulo}</span>
      ${n.mensagem ? `<span class="ni-msg">${n.mensagem}</span>` : ""}
      <span class="ni-tempo">${tempoRelativoNotif(n.criadoEm)}</span>
    </div>
  `).join("");
}
async function abrirNotificacao(id){
  const n = NOTIFICACOES.find(x=>x.id===id);
  if(!n) return;
  // ao clicar, a notificação some da lista (fica "dispensada" no banco para não ser gerada de novo)
  n.lida = true; n.dispensada = true;
  renderNotificacoes(); renderInicio();
  await sb.from("notificacoes").update({lida:true, dispensada:true}).eq("id", id);
  if(n.referenciaTipo==="demanda" && n.referenciaId){
    document.getElementById("notif-dropdown").style.display = "none";
    irParaView("demandas");
    setTimeout(()=>abrirModalDemanda(Number(n.referenciaId)), 250);
  } else if(n.referenciaTipo==="reuniao" && n.referenciaId){
    document.getElementById("notif-dropdown").style.display = "none";
    irParaView("reunioes");
    setTimeout(()=>abrirModalReuniao(Number(n.referenciaId)), 400);
  } else if(n.referenciaTipo==="agenda" && n.referenciaId){
    document.getElementById("notif-dropdown").style.display = "none";
    abrirModuloInicio("agenda","semanal");
    const v = AGENDA.find(x=>String(x.id)===String(n.referenciaId));
    if(v){ semanaAgendaOffset = offsetSemanaDeData(v.data); renderGradeSemanal(); }
  } else if(n.referenciaTipo==="calendario"){
    document.getElementById("notif-dropdown").style.display = "none";
    const ev = CAL_EVENTOS.find(e=>String(e.id)===String(n.referenciaId));
    if(ev){ calModo = "semana"; calSemanaOffset = Math.round(diasEntreISO(dataISOLocal(segundaDaSemana(0)), dataISOLocal(segundaDoDia(ev.dataInicio)))/7); }
    irParaView("calendario");
  } else if(n.referenciaTipo==="convite"){
    document.getElementById("notif-dropdown").style.display = "none";
    irParaView("calendario"); setTimeout(()=>abrirConvites(), 250);
  } else if(n.referenciaTipo==="epi_admitidos"){
    document.getElementById("notif-dropdown").style.display = "none";
    if((currentUser.modulos||[]).includes("fichaEpi")) abrirFichaEpiNovosAdmitidos(); else irParaView("inicio");
  } else if(n.referenciaTipo==="acidente"){
    document.getElementById("notif-dropdown").style.display = "none";
    if((currentUser.modulos||[]).includes("lancamento")) irParaView("lancamento"); else irParaView("inicio");
  } else if(n.referenciaTipo==="inspecao"){
    document.getElementById("notif-dropdown").style.display = "none";
    if((currentUser.modulos||[]).includes("inspecoes")) irParaView("inspecoes"); else irParaView("inicio");
  } else if(n.referenciaTipo==="aviso"){
    document.getElementById("notif-dropdown").style.display = "none";
    const av = AVISOS.find(x=>String(x.id)===String(n.referenciaId));
    if(av && av.referenciaTipo) abrirAviso(av.id); else irParaView("inicio");
  }
}
async function marcarTodasNotificacoesLidas(){
  if(!currentUser) return;
  const idsNaoLidas = NOTIFICACOES.filter(n=>n.usuarioId===currentUser.id && !n.lida).map(n=>n.id);
  if(!idsNaoLidas.length) return;
  NOTIFICACOES.forEach(n=>{ if(n.usuarioId===currentUser.id) n.lida = true; });
  renderNotificacoes();
  await sb.from("notificacoes").update({lida:true}).in("id", idsNaoLidas);
}
async function limparNotificacoes(){
  if(!currentUser) return;
  const ids = NOTIFICACOES.filter(n=>n.usuarioId===currentUser.id && !n.dispensada).map(n=>n.id);
  if(!ids.length) return;
  NOTIFICACOES.forEach(n=>{ if(n.usuarioId===currentUser.id){ n.lida = true; n.dispensada = true; } });
  renderNotificacoes(); renderInicio();
  await sb.from("notificacoes").update({lida:true, dispensada:true}).in("id", ids);
}
async function criarNotificacao(usuarioId, tipo, titulo, mensagem, referenciaTipo, referenciaId){
  if(!usuarioId) return;
  const destinatario = USUARIOS.find(u=>u.id===usuarioId);
  // avisos da plataforma, eventos de calendário e fichas de EPI chegam a todos (não dependem da lista de tipos do perfil)
  const SEMPRE_NOTIFICAR = ["aviso","calendario_evento","epi_admitidos","agenda_decisao","acao_plataforma"];
  const recebeTudo = !!destinatario && (destinatario.perfil==="Administrador" || destinatario.perfil==="Coordenador");   // administradores e coordenadores recebem tudo
  if(destinatario && !recebeTudo && !SEMPRE_NOTIFICAR.includes(tipo) && Array.isArray(destinatario.notificacoesAtivas) && !destinatario.notificacoesAtivas.includes(tipo)) return;
  const { data, error } = await sb.from("notificacoes").insert({
    usuario_id: usuarioId, tipo, titulo, mensagem: mensagem||"",
    referencia_tipo: referenciaTipo||null, referencia_id: referenciaId!=null ? String(referenciaId) : null
  }).select().single();
  if(error){ console.error("[Supabase] notificacao:", error); return; }
  if(currentUser && usuarioId === currentUser.id){
    NOTIFICACOES.unshift({id:data.id, usuarioId:data.usuario_id, tipo:data.tipo, titulo:data.titulo, mensagem:data.mensagem, referenciaTipo:data.referencia_tipo, referenciaId:data.referencia_id, lida:data.lida, dispensada:false, criadoEm:data.created_at});
    renderNotificacoes();
  }
}
async function notificarAdminsCoordenadores(tipo, titulo, mensagem, refTipo, refId, excluir){
  const ex = new Set([...(excluir||[]), currentUser && currentUser.id]);   // quem fez a ação (e quem já foi avisado) fica de fora
  const destinatarios = USUARIOS.filter(u=> u.ativo!==false && (u.perfil==="Administrador"||u.perfil==="Coordenador") && !ex.has(u.id));
  for(const u of destinatarios){ await criarNotificacao(u.id, tipo, titulo, mensagem, refTipo, refId); }
}
// toda ação feita na plataforma chega para administradores e coordenadores
function acaoPlataforma(titulo, mensagem, refTipo, refId, excluir){
  return notificarAdminsCoordenadores("acao_plataforma", titulo, (currentUser ? currentUser.nome+" · " : "")+(mensagem||""), refTipo||null, refId!=null ? refId : null, excluir);
}
// visitas: avisa o dono da visita (quando foi outra pessoa que agiu) e os gestores
function notificarVisitas(vs, titulo){
  if(!vs || !vs.length) return;
  const donos = [...new Set(vs.map(v=>v.usuarioId).filter(u=>u && u!==currentUser.id))];
  const v0 = vs[0];
  const msg = (vs.length>1 ? vs.length+" visitas · " : "")+(v0.usuarioNome||"")+" — "+v0.unidade+" · "+dataBR(v0.data);
  donos.forEach(uid=>criarNotificacao(uid, "agenda_decisao", titulo, msg, "agenda", v0.id));
  acaoPlataforma(titulo, msg, "agenda", v0.id, donos);
}
async function gerarNotificacoesPrazoDemandas(){
  if(!currentUser) return;
  const minhas = DEMANDAS.filter(d=> d.responsavelUsuarioId===currentUser.id);
  for(const d of minhas){
    const prazo = calcularControlePrazo(d.dataLimite, d.entregueEm);
    let tipo = null;
    if(prazo.label==="Atrasado") tipo = "demanda_atrasada";
    else if(prazo.label==="Vence hoje" || prazo.label==="Vence amanhã") tipo = "demanda_vencendo";
    if(!tipo) continue;
    const jaExiste = NOTIFICACOES.some(n=>n.referenciaTipo==="demanda" && n.referenciaId===String(d.id) && n.tipo===tipo);
    if(jaExiste) continue;
    await criarNotificacao(currentUser.id, tipo, tipo==="demanda_atrasada"?"Demanda atrasada":"Demanda vencendo em breve", d.demanda.slice(0,80), "demanda", d.id);
  }
}

/* =====================================================================
   SAÚDE — visão geral e registros de atestados (dados reais do Supabase)
   ===================================================================== */
function initSaude(){
  const cardImportar = document.getElementById("sd-card-importar");
  if(cardImportar) cardImportar.style.display = ehAdminOuCoordenador() ? "block" : "none";
  popularFiltrosSaude();
  renderSaudeVisaoGeral();
}
/* ---- Gestão da base de EPI (colaboradores + EPI por função) ---- */
