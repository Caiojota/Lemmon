/* =====================================================================
   CONVITES E AUSÊNCIAS
   ===================================================================== */

// Converte do formato do banco para o do app:: map convite from db
/* =====================================================================
   CONVITES — evento ou tarefa com convidado que aceita ou recusa
   ===================================================================== */
function mapConviteFromDb(c){
  return {id:c.id, tipo:c.tipo, titulo:c.titulo, descricao:c.descricao||"", convidanteId:c.convidante_id, convidanteNome:c.convidante_nome||"",
    convidadoId:c.convidado_id, status:c.status, dataRef:c.data_ref, dados:c.dados||{}, origemId:c.origem_id, resultadoId:c.resultado_id, criadoEm:c.created_at};
}

// Função do módulo: convites recebidos
function convitesRecebidos(){ return CONVITES.filter(c=>currentUser && c.convidadoId===currentUser.id); }

// Função do módulo: convites enviados
function convitesEnviados(){ return CONVITES.filter(c=>currentUser && c.convidanteId===currentUser.id); }

// Função do módulo: convites pendentes recebidos
function convitesPendentesRecebidos(){ return convitesRecebidos().filter(c=>c.status==="Pendente"); }

// Atualiza: atualizar badge convites
function atualizarBadgeConvites(){
  const n = currentUser ? convitesPendentesRecebidos().length : 0;
  const b = document.getElementById("cal-convites-n"); if(!b) return;
  b.textContent = n; b.style.display = n ? "inline-flex" : "none";
  const btn = document.getElementById("cal-convites-btn"); if(btn) btn.classList.toggle("tem", n>0);
}

// Função do módulo: enviar convites
// envia convites (uma linha por convidado; ignora quem já foi convidado para o mesmo item)
async function enviarConvites(tipo, titulo, descricao, dataRef, dados, origemId, ids){
  ids = [...new Set(ids||[])].filter(id=>id && id!==currentUser.id);
  ids = ids.filter(id=>!CONVITES.some(c=>c.tipo===tipo && c.origemId===origemId && c.convidadoId===id));
  if(!ids.length) return 0;
  const linhas = ids.map(id=>({tipo, titulo, descricao:descricao||"", convidante_id:currentUser.id, convidante_nome:currentUser.nome, convidado_id:id, status:"Pendente", data_ref:dataRef||null, dados, origem_id:origemId}));
  const { data, error } = await sb.from("convites").insert(linhas).select();
  if(error){ alert("O item foi salvo, mas não foi possível enviar os convites: "+error.message); return 0; }
  (data||[]).forEach(r=>{
    const c = mapConviteFromDb(r); CONVITES.unshift(c);
    criarNotificacao(c.convidadoId, "calendario_evento", "Convite: "+titulo, currentUser.nome+" convidou você para "+(tipo==="evento"?"um evento":"uma tarefa")+(dataRef?" em "+dataBR(dataRef):"")+". Aceite ou recuse em Agenda › Convites.", "convite", c.id);
  });
  atualizarBadgeConvites();
  return (data||[]).length;
}

// Função do módulo: convites do dia html
function convitesDoDiaHtml(uid, iso){
  if(!currentUser || uid!==currentUser.id) return [];
  return convitesPendentesRecebidos().filter(c=>c.dataRef===iso).map(c=>`<div class="dc-item convite"><div class="dc-l1"><span class="dc-t">✉ ${escHtml(c.titulo)}</span><span class="dc-chip pend">${c.tipo==="evento"?"Evento":"Tarefa"}</span></div>
    <div class="dc-s">Convite de ${escHtml(c.convidanteNome)}${conviteQuando(c)}</div>
    <div class="dc-chips"><button type="button" class="cv-btn sim" onclick="responderConvite(${c.id},true)">✓ Aceitar</button><button type="button" class="cv-btn nao" onclick="responderConvite(${c.id},false)">Recusar</button></div></div>`);
}

// Função do módulo: convite quando
function conviteQuando(c){
  const d = c.dados||{};
  if(c.tipo==="evento") return " · "+(d.data_inicio===d.data_fim || !d.data_fim ? dataBR(d.data_inicio||c.dataRef) : dataBR(d.data_inicio)+" a "+dataBR(d.data_fim))+(d.dia_inteiro ? " · dia inteiro" : (d.hora_inicio ? " · "+String(d.hora_inicio).slice(0,5)+"–"+String(d.hora_fim||"").slice(0,5) : ""));
  return d.dataLimite ? " · prazo "+dataBR(d.dataLimite) : "";
}

// Abre: abrir convites
function abrirConvites(){ convitesAbaAtual = convitesPendentesRecebidos().length || !convitesEnviados().length ? "recebidos" : "enviados"; renderConvites(); document.getElementById("modal-convites").style.display = "flex"; }

// Fecha: fechar convites
function fecharConvites(){ document.getElementById("modal-convites").style.display = "none"; }

// Função do módulo: convites aba
function convitesAba(a){ convitesAbaAtual = a; renderConvites(); }

// Desenha na tela: render convites
function renderConvites(){
  document.querySelectorAll("#cv-abas .sw-btn").forEach(b=>{ const at = b.dataset.a===convitesAbaAtual; b.classList.toggle("ativo", at); b.classList.toggle("sw-aprovado", at); });
  const corpo = document.getElementById("cv-corpo");
  const chipSt = st=>`<span class="dc-chip ${st==="Aceito"?"ok":st==="Recusado"?"rej":"pend"}">${st}</span>`;
  const quem = id=>{ const u = USUARIOS.find(x=>x.id===id); return u ? u.nome : "—"; };
  if(convitesAbaAtual==="recebidos"){
    const lista = convitesRecebidos().slice().sort((a,b)=>(a.status==="Pendente"?0:1)-(b.status==="Pendente"?0:1) || b.id-a.id);
    corpo.innerHTML = lista.length ? lista.map(c=>`<div class="dc-item convite"><div class="dc-l1"><span class="dc-t">${c.tipo==="evento"?"◆":"▣"} ${escHtml(c.titulo)}</span>${chipSt(c.status)}</div>
      <div class="dc-s">${c.tipo==="evento"?"Evento":"Tarefa"} · convite de ${escHtml(c.convidanteNome)}${conviteQuando(c)}</div>
      ${c.descricao?`<div class="dc-d">${escHtml(c.descricao)}</div>`:""}
      ${c.status==="Pendente" ? `<div class="dc-chips"><button type="button" class="cv-btn sim" onclick="responderConvite(${c.id},true)">✓ Aceitar</button><button type="button" class="cv-btn nao" onclick="responderConvite(${c.id},false)">Recusar</button></div>` : ""}</div>`).join("")
      : '<div class="dc-vazio">Nenhum convite recebido.</div>';
  } else {
    const lista = convitesEnviados().slice().sort((a,b)=>b.id-a.id);
    corpo.innerHTML = lista.length ? lista.map(c=>`<div class="dc-item convite"><div class="dc-l1"><span class="dc-t">${c.tipo==="evento"?"◆":"▣"} ${escHtml(c.titulo)}</span>${chipSt(c.status)}</div>
      <div class="dc-s">Para ${escHtml(quem(c.convidadoId))} · ${c.tipo==="evento"?"Evento":"Tarefa"}${conviteQuando(c)}</div>
      ${c.status==="Pendente" ? `<div class="dc-chips"><button type="button" class="cv-btn nao" onclick="cancelarConvite(${c.id})">Cancelar convite</button></div>` : ""}</div>`).join("")
      : '<div class="dc-vazio">Você ainda não enviou convites.</div>';
  }
}

// Remove/cancela: cancelar convite
async function cancelarConvite(id){
  const c = CONVITES.find(x=>x.id===id); if(!c || c.status!=="Pendente" || !confirm("Cancelar este convite?")) return;
  const { error } = await sb.from("convites").delete().eq("id", id);
  if(error){ alert("Erro ao cancelar: "+error.message); return; }
  CONVITES = CONVITES.filter(x=>x.id!==id); renderConvites(); renderCalendario();
}

// Função do módulo: responder convite
async function responderConvite(id, aceitar){
  const c = CONVITES.find(x=>x.id===id); if(!c || c.status!=="Pendente" || c.convidadoId!==currentUser.id) return;
  const d = c.dados || {};
  let resultadoId = null;
  if(aceitar){
    if(c.tipo==="evento"){
      const ini = d.data_inicio || c.dataRef, fim = d.data_fim || ini;
      if(d.bloqueia!==false){
        const cf = calConflitos(currentUser.id, {id:null, ini, fim, diaInteiro:!!d.dia_inteiro, hi:d.hora_inicio?String(d.hora_inicio).slice(0,5):"", hf:d.hora_fim?String(d.hora_fim).slice(0,5):""});
        if(cf.length && !confirm("Você já tem compromisso nesse período:\n\n"+cf.slice(0,3).join("\n")+"\n\nAceitar mesmo assim?")) return;
      }
      const linha = {titulo:c.titulo, tipo:d.tipo||"Evento", usuario_id:currentUser.id, criado_por:c.convidanteId, criado_por_nome:c.convidanteNome,
        data_inicio:ini, data_fim:fim, dia_inteiro:!!d.dia_inteiro, hora_inicio:d.dia_inteiro?null:(d.hora_inicio||null), hora_fim:d.dia_inteiro?null:(d.hora_fim||null),
        local:d.local||"", descricao:((d.descricao||"")+(d.descricao?"\n":"")+"Convite de "+c.convidanteNome).trim(), bloqueia:d.bloqueia!==false, oculto:false, ...(d.grupo_id ? {grupo_id:d.grupo_id} : {})};
      const { data, error } = await dbGravarComOculto(p=>sb.from("calendario_eventos").insert(p).select(), [linha]);
      if(error){ alert("Erro ao aceitar o convite: "+error.message); return; }
      (data||[]).forEach(r=>{ CAL_EVENTOS.push(mapEventoCalFromDb(r)); resultadoId = r.id; });
    } else {
      const etapas = FLUXO_ETAPAS.filter(e=>e.fluxoId===d.fluxoId).sort((a,b)=>(a.ordem||0)-(b.ordem||0));
      const nova = {demanda:d.demanda||c.titulo, categoria:d.categoria||"", area:d.area||"", tipoAtividade:d.tipoAtividade||"", tipoDemanda:d.tipoDemanda||"", prioridade:d.prioridade||"Normal",
        dataEntrada:dataISOLocal(new Date()), dataLimite:d.dataLimite||"", tempoEstimado:d.tempoEstimado||"", agendadoPara:"", entregueEm:"", tempoGasto:"", satisfacaoEntrega:"", saldoAnterior:"",
        unidade:d.unidade||"", responsavel:currentUser.nome, responsavelUsuarioId:currentUser.id, fluxoId:d.fluxoId, etapaId:etapas.length ? etapas[0].id : d.etapaId,
        aguardandoItem:"", aguardandoResponsavel:"", emailRelacionado:d.emailRelacionado||"", comentarios:((d.comentarios||"")+(d.comentarios?"\n":"")+"Convite de "+c.convidanteNome).trim(), demandaMaeId:null};
      const { data, error } = await sb.from("demandas").insert({...demandaToDb(nova), created_by:currentUser.id}).select().single();
      if(error){ alert("Erro ao aceitar o convite: "+error.message); return; }
      DEMANDAS.unshift(mapDemandaFromDb(data)); resultadoId = data.id;
    }
  }
  const { error: e2 } = await sb.from("convites").update({status:aceitar?"Aceito":"Recusado", respondido_em:new Date().toISOString(), resultado_id:resultadoId}).eq("id", id);
  if(e2){ alert("Erro ao registrar a resposta: "+e2.message); return; }
  c.status = aceitar ? "Aceito" : "Recusado"; c.resultadoId = resultadoId;
  criarNotificacao(c.convidanteId, "calendario_evento", currentUser.nome+(aceitar?" aceitou":" recusou")+" seu convite", c.titulo, "convite", c.id);
  mostrarToast(aceitar ? (c.tipo==="evento" ? "Convite aceito: o evento entrou na sua agenda." : "Convite aceito: criei uma nova demanda para você.") : "Convite recusado.");
  atualizarBadgeConvites(); renderCalendario(); renderInicio();
  if(document.getElementById("modal-convites").style.display==="flex") renderConvites();
  if(document.getElementById("modal-dia-cal").style.display==="flex") renderDiaCal();
}

// Função do módulo: conv picker html
// campos "Convidar pessoas" dos formulários
function convPickerHtml(cls, excluirIds){
  return avPickerHtml(usuariosAtivosOrdenados().filter(u=>u.id!==currentUser.id && !(excluirIds||[]).includes(u.id)), cls, "checkbox", "", ()=>false, false);
}

// Função do módulo: conv status html
function convStatusHtml(tipo, origemId){
  const l = CONVITES.filter(c=>c.tipo===tipo && c.origemId===origemId);
  if(!l.length) return '<span class="dc-vazio">Nenhum convite enviado.</span>';
  return l.map(c=>{ const u = USUARIOS.find(x=>x.id===c.convidadoId); return `<span class="dc-chip ${c.status==="Aceito"?"ok":c.status==="Recusado"?"rej":"pend"}" style="margin:0 6px 6px 0;">${escHtml(u?u.nome:"—")} · ${c.status}</span>`; }).join("");
}

// Função do módulo: cal popular convidados
function calPopularConvidados(ev){
  const box = document.getElementById("cal-convidados-lista"), nome = document.getElementById("cal-convidados-nome");
  if(!box) return;
  if(ev){ box.className = ""; box.innerHTML = convStatusHtml("evento", ev.id); nome.textContent = ""; }
  else { box.className = "av-picker"; box.innerHTML = convPickerHtml("cal-conv"); avPickerNomes("cal-convidados-lista","cal-convidados-nome"); nome.textContent = "Ninguém convidado"; }
}

// Função do módulo: dem popular convidados
function demPopularConvidados(id){
  const box = document.getElementById("dem-convidados-lista"), nome = document.getElementById("dem-convidados-nome");
  if(!box) return;
  if(id){ box.className = ""; box.innerHTML = convStatusHtml("tarefa", Number(id)); nome.textContent = ""; }
  else { box.className = "av-picker"; box.innerHTML = convPickerHtml("dem-conv"); nome.textContent = "Ninguém convidado"; }
}

// Função do módulo: aus dias uteis
function ausDiasUteis(ini, fim){
  if(!ini || !fim || fim<ini) return 0;
  let n = 0; for(let d=new Date(ini+"T00:00:00"), f=new Date(fim+"T00:00:00"); d<=f; d.setDate(d.getDate()+1)){ const g=d.getDay(); if(g!==0 && g!==6) n++; }
  return n;
}

// Função do módulo: aus atualizar resumo
function ausAtualizarResumo(){
  const el = document.getElementById("aus-resumo"); if(!el) return;
  const ini = document.getElementById("aus-ini").value, fim = document.getElementById("aus-fim").value;
  if(fim && ini && fim<ini){ el.textContent = "A data final não pode ser antes da inicial."; return; }
  const n = ausDiasUteis(ini, fim);
  el.textContent = n ? n+" dia"+(n===1?"":"s")+" útil"+(n===1?"":"eis")+" no período (fins de semana não contam)." : "";
}

// Função do módulo: aus periodo
function ausPeriodo(p){
  document.getElementById("aus-periodo").value = p;
  document.querySelectorAll("#aus-periodo-sw .sw-btn").forEach(b=>{ const a = b.dataset.p===p; b.classList.toggle("ativo",a); b.classList.toggle("sw-aprovado",a); });
  const h = p==="Horário";
  document.getElementById("aus-hi-wrap").style.display = h ? "" : "none";
  document.getElementById("aus-hf-wrap").style.display = h ? "" : "none";
}

// Abre: abrir modal ausencia
function abrirModalAusencia(modo, isoPadrao){
  ausModo = modo==="bloqueio" ? "bloqueio" : "ausencia";
  const bl = ausModo==="bloqueio";
  document.getElementById("form-aus").reset();
  document.getElementById("aus-titulo").textContent = bl ? "Bloquear a agenda" : "Registrar ausência";
  document.getElementById("aus-campo-tipo").style.display = bl ? "none" : "";
  document.getElementById("aus-campo-oculto").style.display = bl ? "none" : "";
  document.getElementById("aus-obs-lbl").textContent = bl ? "Motivo (só você e o administrador veem)" : "Observação (opcional)";
  const hoje = isoPadrao || dataISOLocal(new Date());
  document.getElementById("aus-ini").value = hoje; document.getElementById("aus-fim").value = hoje;
  ausPeriodo("Dia inteiro"); ausAtualizarResumo();
  const campo = document.getElementById("aus-campo-pessoas"), lista = document.getElementById("aus-pessoas-lista");
  if(ehAdminOuCoordenador()){
    campo.style.display = "";
    lista.innerHTML = avPickerHtml(usuariosAtivosOrdenados(), "aus-p", "checkbox", "", u=>u.id===currentUser.id, false);
  } else { campo.style.display = "none"; lista.innerHTML = `<input type="checkbox" class="aus-p" value="${currentUser.id}" checked>`; }
  avPickerNomes("aus-pessoas-lista","aus-pessoas-nome");
  document.getElementById("modal-aus").style.display = "flex";
}

// Fecha: fechar modal ausencia
function fecharModalAusencia(){ document.getElementById("modal-aus").style.display = "none"; }

// Salva no banco: salvar ausencia
async function salvarAusencia(ev){
  if(ev) ev.preventDefault();
  const bl = ausModo==="bloqueio";
  const ini = document.getElementById("aus-ini").value, fim = document.getElementById("aus-fim").value;
  const per = document.getElementById("aus-periodo").value;
  if(!ini || !fim || fim<ini){ alert("A data final não pode ser antes da inicial."); return false; }
  if(!ausDiasUteis(ini, fim)){ alert("O período escolhido só tem fim de semana. Escolha ao menos um dia útil."); return false; }
  let diaInteiro = per==="Dia inteiro", hi = null, hf = null;
  if(per==="Manhã" || per==="Tarde"){ hi = PERIODO_HORAS[per][0]; hf = PERIODO_HORAS[per][1]; }
  else if(per==="Horário"){
    hi = document.getElementById("aus-hi").value; hf = document.getElementById("aus-hf").value;
    if(!hi || !hf || hf<=hi){ alert("Informe a hora de início e uma hora de fim posterior."); return false; }
  }
  let pessoas = [...document.querySelectorAll(".aus-p")].filter(c=>c.checked).map(c=>c.value);
  if(!ehAdminOuCoordenador()) pessoas = [currentUser.id];
  if(!pessoas.length){ alert("Escolha para quem é o lançamento."); return false; }
  const tipo = bl ? "Bloqueio" : document.getElementById("aus-tipo").value;
  const titulo = bl ? "Agenda bloqueada" : (CAL_TIPOS[tipo] ? (tipo==="Compensação de banco de horas" ? "Banco de horas" : tipo) : tipo);
  const obs = document.getElementById("aus-obs").value.trim();
  const ocCk = !bl && document.getElementById("aus-oculto").checked;
  const btn = document.getElementById("aus-btn-salvar"); btn.disabled = true;
  try{
    const linhas = pessoas.map(uid=>({titulo, tipo, usuario_id:uid, criado_por:currentUser.id, criado_por_nome:currentUser.nome,
      data_inicio:ini, data_fim:fim, dia_inteiro:diaInteiro, hora_inicio:hi, hora_fim:hf, local:"", descricao:obs, bloqueia:true,
      oculto: bl || ocCk || calBloqueioNoIntervalo(uid, ini, fim, diaInteiro, hi||"00:00", hf||"23:59")}));
    const { data, error } = await dbGravarComOculto(p=>sb.from("calendario_eventos").insert(p).select(), linhas);
    if(error){ alert("Erro ao salvar: "+error.message); return false; }
    (data||[]).forEach(r=>{
      const m = mapEventoCalFromDb(r); CAL_EVENTOS.push(m);
      if(m.usuarioId!==currentUser.id) criarNotificacao(m.usuarioId, "calendario_evento", bl ? "Sua agenda foi bloqueada" : "Ausência lançada no seu calendário", (bl ? "" : titulo+" — ")+(m.dataInicio===m.dataFim ? dataBR(m.dataInicio) : dataBR(m.dataInicio)+" a "+dataBR(m.dataFim)), "calendario", m.id);
    });
    acaoPlataforma(bl ? "Agenda bloqueada" : "Ausência registrada", bl ? "(bloqueio)" : titulo, "calendario", (data&&data[0]) ? data[0].id : null, pessoas);
    mostrarToast(bl ? "Agenda bloqueada." : "Ausência registrada.");
  } finally { btn.disabled = false; }
  fecharModalAusencia();
  renderCalendario(); renderInicio();
  return false;
}

// Função do módulo: cal ao mudar tipo
/* ---- criar / editar / excluir evento ---- */
function calAoMudarTipo(){
  const tipo = document.getElementById("cal-tipo").value;
  const aus = CAL_AUSENCIAS.includes(tipo);
  const bq = document.getElementById("cal-bloqueia");
  if(aus){ bq.checked = true; }
  bq.disabled = aus;
  document.getElementById("cal-bloqueia-lbl").style.opacity = aus ? ".6" : "1";
  const t = document.getElementById("cal-titulo");
  t.required = !aus;
  t.placeholder = aus ? "opcional — se vazio, usa “"+tipo+"”" : "ex.: Reunião com a loja Barra";
}

// Função do módulo: cal alternar horas
function calAlternarHoras(){
  const di = document.getElementById("cal-dia-inteiro").checked;
  document.getElementById("cal-horas-hi").style.display = di ? "none" : "";
  document.getElementById("cal-horas-hf").style.display = di ? "none" : "";
}

// Abre: abrir modal evento cal
function abrirModalEventoCal(id, isoPadrao, uidPadrao){
  document.getElementById("form-cal").reset();
  document.getElementById("cal-aviso-conflito").style.display = "none";
  const ev = id!=null ? CAL_EVENTOS.find(e=>e.id===Number(id)) : null;
  if(id!=null && !ev) return;
  if(ev && ev.tipo==="Ocupado") return;
  { const tipos = [...CAL_TIPOS_EVENTO, ...CAL_AUSENCIAS]; if(ev && !tipos.includes(ev.tipo)) tipos.push(ev.tipo);
    document.getElementById("cal-tipo").innerHTML = tipos.map(t=>`<option value="${escHtml(t)}">${escHtml((CAL_TIPOS[t]||{}).curto===undefined ? t : (CAL_AUSENCIAS.includes(t) ? CAL_TIPOS[t].curto : t))}</option>`).join(""); }
  const podeEditar = !ev || calPodeEditar(ev);
  calPopularConvidados(ev);
  document.getElementById("cal-id").value = ev ? ev.id : "";
  document.getElementById("cal-modal-titulo").textContent = ev ? (podeEditar ? "Editar evento" : "Evento") : "Novo evento";
  const hojeISO = dataISOLocal(new Date());
  document.getElementById("cal-titulo").value = ev ? ev.titulo : "";
  document.getElementById("cal-tipo").value = ev ? ev.tipo : "Evento";
  document.getElementById("cal-local").value = ev ? ev.local : "";
  document.getElementById("cal-ini").value = ev ? ev.dataInicio : (isoPadrao || hojeISO);
  document.getElementById("cal-fim").value = ev ? ev.dataFim : (isoPadrao || hojeISO);
  document.getElementById("cal-dia-inteiro").checked = ev ? ev.diaInteiro : true;
  document.getElementById("cal-hi").value = ev ? ev.horaInicio : "09:00";
  document.getElementById("cal-hf").value = ev ? ev.horaFim : "10:00";
  document.getElementById("cal-desc").value = ev ? ev.descricao : "";
  document.getElementById("cal-bloqueia").checked = ev ? ev.bloqueia : true;
  document.getElementById("cal-oculto").checked = ev ? !!ev.oculto : false;
  calAlternarHoras(); calAoMudarTipo();
  // pessoas: administrador/coordenador pode criar no nome de outros; usuário padrão só para si
  const lista = document.getElementById("cal-pessoas-lista"), campo = document.getElementById("cal-campo-pessoas");
  if(ev){
    const u = USUARIOS.find(x=>x.id===ev.usuarioId);
    lista.innerHTML = avPickerHtml([u || {id:ev.usuarioId, nome:"—"}], "cal-p", "checkbox", "", ()=>true, true);
    campo.querySelector("label").innerHTML = 'Pessoa'+(ev.criadoPor && ev.criadoPor!==ev.usuarioId ? ' <span class="ag-sub">(criado por '+escHtml(ev.criadoPorNome||"outra pessoa")+')</span>' : "");
  } else if(ehAdminOuCoordenador()){
    campo.querySelector("label").textContent = "Para quem";
    const alvo = uidPadrao || currentUser.id;
    lista.innerHTML = avPickerHtml(usuariosAtivosOrdenados(), "cal-p", "checkbox", "", u=>u.id===alvo, false);
  } else {
    campo.querySelector("label").textContent = "Para quem";
    lista.innerHTML = avPickerHtml([currentUser], "cal-p", "checkbox", "", ()=>true, true);
  }
  avPickerNomes("cal-pessoas-lista","cal-pessoas-nome");
  document.querySelectorAll("#form-cal input:not(.cal-p), #form-cal select, #form-cal textarea").forEach(el=>{ if(el.id!=="cal-id") el.disabled = !podeEditar; });
  if(podeEditar){ calAoMudarTipo(); calAtualizarOcultoAuto(); }
  document.getElementById("cal-btn-salvar").style.display = podeEditar ? "" : "none";
  document.getElementById("cal-btn-excluir").style.display = ev && podeEditar ? "inline-block" : "none";
  document.getElementById("modal-cal").style.display = "flex";
}

// Fecha: fechar modal evento cal
function fecharModalEventoCal(){ document.getElementById("modal-cal").style.display = "none"; }

// Função do módulo: cal atualizar oculto auto
// dentro de um bloqueio da agenda o evento fica oculto automaticamente
function calAtualizarOcultoAuto(){
  const cb = document.getElementById("cal-oculto"), av = document.getElementById("cal-aviso-oculto"); if(!cb) return;
  const ini = document.getElementById("cal-ini").value, fim = document.getElementById("cal-fim").value;
  const di = document.getElementById("cal-dia-inteiro").checked;
  const hi = document.getElementById("cal-hi").value || "00:00", hf = document.getElementById("cal-hf").value || "23:59";
  const pessoas = [...document.querySelectorAll(".cal-p")].filter(c=>c.checked).map(c=>c.value);
  const ehBloq = document.getElementById("cal-tipo").value==="Bloqueio";
  const dentro = !ehBloq && !!ini && !!fim && pessoas.some(u=>calBloqueioNoIntervalo(u, ini, fim, di, hi, hf));
  if(dentro || ehBloq) cb.checked = true;
  cb.disabled = dentro || ehBloq;
  if(av) av.style.display = dentro ? "block" : "none";
}

// Função do módulo: db gravar com oculto
// grava; se o banco ainda não tem a coluna "oculto", grava sem ela e avisa
async function dbGravarComOculto(fazer, payload){
  let r = await fazer(payload);
  if(r.error && /oculto/i.test(r.error.message||"")){
    const limpa = Array.isArray(payload) ? payload.map(({oculto,...x})=>x) : (({oculto,...x})=>x)(payload);
    r = await fazer(limpa);
    if(!r.error) mostrarToast("Salvo, mas a coluna “oculto” ainda não existe no banco: rode o SQL de migração para o recurso funcionar.");
  }
  return r;
}

// Função do módulo: cal horas sobrepoem
function calHorasSobrepoem(a, b){ if(a.diaInteiro || b.diaInteiro) return true; return a.hi < b.hf && b.hi < a.hf; }

// Função do módulo: cal conflitos
// o que já ocupa a pessoa no período do novo evento
function calConflitos(uid, d){
  const lista = CAL_EVENTOS.filter(e=>e.id!==d.id && e.usuarioId===uid && e.bloqueia && e.dataInicio<=d.fim && e.dataFim>=d.ini
    && calHorasSobrepoem({diaInteiro:e.diaInteiro, hi:e.horaInicio, hf:e.horaFim}, d)).map(e=>{ const m = calMascararEvento(e); return m.tipo+": "+m.titulo; });
  if(d.diaInteiro) DEMANDAS.filter(x=>x.responsavelUsuarioId===uid && x.agendadoPara && x.agendadoPara>=d.ini && x.agendadoPara<=d.fim && !x.entregueEm && !demandaConcluida(x)).forEach(x=>lista.push("Demanda #"+x.id+" agendada em "+dataBR(x.agendadoPara)));
  return lista;
}

// Salva no banco: salvar evento cal
async function salvarEventoCal(ev){
  if(ev) ev.preventDefault();
  const id = document.getElementById("cal-id").value;
  const tipo = document.getElementById("cal-tipo").value;
  const aus = CAL_AUSENCIAS.includes(tipo);
  const titulo = document.getElementById("cal-titulo").value.trim() || (aus ? tipo : "");
  const ini = document.getElementById("cal-ini").value, fim = document.getElementById("cal-fim").value;
  const diaInteiro = document.getElementById("cal-dia-inteiro").checked;
  const hi = document.getElementById("cal-hi").value, hf = document.getElementById("cal-hf").value;
  if(!titulo){ alert("Informe o título do evento."); return false; }
  if(!ini || !fim || fim<ini){ alert("A data final não pode ser antes da inicial."); return false; }
  if(!diaInteiro){
    if(!hi || !hf){ alert("Informe a hora de início e de fim, ou marque “Dia inteiro”."); return false; }
    if(ini===fim && hf<=hi){ alert("A hora de fim precisa ser depois da hora de início."); return false; }
  }
  const pessoas = id ? [CAL_EVENTOS.find(e=>e.id===Number(id)).usuarioId] : [...document.querySelectorAll(".cal-p")].filter(c=>c.checked).map(c=>c.value);
  if(!pessoas.length){ alert("Escolha para quem é o evento."); return false; }
  if(!id && !ehAdminOuCoordenador() && pessoas.some(p=>p!==currentUser.id)){ alert("Você só pode criar eventos para si mesmo."); return false; }
  const campos = {titulo, tipo, data_inicio:ini, data_fim:fim, dia_inteiro:diaInteiro, hora_inicio:diaInteiro?null:hi, hora_fim:diaInteiro?null:hf,
    local:document.getElementById("cal-local").value.trim(), descricao:document.getElementById("cal-desc").value.trim(), bloqueia: aus ? true : document.getElementById("cal-bloqueia").checked};
  campos.oculto = document.getElementById("cal-oculto").checked || tipo==="Bloqueio" || pessoas.some(uid=>calBloqueioNoIntervalo(uid, ini, fim, diaInteiro, diaInteiro?"00:00":hi, diaInteiro?"23:59":hf));
  // avisa conflitos (e deixa o usuário decidir)
  const avisoEl = document.getElementById("cal-aviso-conflito");
  if(campos.bloqueia){
    const conflitos = [];
    pessoas.forEach(uid=>{ const c = calConflitos(uid, {id:id?Number(id):null, ini, fim, diaInteiro, hi, hf}); if(c.length){ const u = USUARIOS.find(x=>x.id===uid); conflitos.push((u?primeiroNomeAgenda(u.nome):"?")+": "+c.slice(0,3).join("; ")); } });
    if(conflitos.length && !confirm("Já existe compromisso nesse período:\n\n"+conflitos.join("\n")+"\n\nSalvar mesmo assim?")) return false;
  }
  avisoEl.style.display = "none";
  const btn = document.getElementById("cal-btn-salvar"); btn.disabled = true;
  try{
    if(id){
      const { error } = await dbGravarComOculto(p=>sb.from("calendario_eventos").update(p).eq("id", Number(id)), campos);
      if(error){ alert("Erro ao salvar o evento: "+error.message); return false; }
      const atual = CAL_EVENTOS.find(e=>e.id===Number(id));
      Object.assign(atual, mapEventoCalFromDb({...atual, titulo, tipo, usuario_id:atual.usuarioId, criado_por:atual.criadoPor, criado_por_nome:atual.criadoPorNome, ...campos}));
      acaoPlataforma("Evento atualizado no calendário", campos.oculto ? "(evento oculto)" : titulo, "calendario", Number(id), [atual.usuarioId]);
      mostrarToast("Evento atualizado.");
    } else {
      const convSel = [...document.querySelectorAll(".cal-conv")].filter(c=>c.checked).map(c=>c.value).filter(u=>!pessoas.includes(u));
      const grupo = (pessoas.length>1 || convSel.length) ? (crypto.randomUUID ? crypto.randomUUID() : null) : null;
      const linhas = pessoas.map(uid=>({...campos, usuario_id:uid, criado_por:currentUser.id, criado_por_nome:currentUser.nome, ...(grupo ? {grupo_id:grupo} : {})}));
      const { data, error } = await dbGravarComOculto(p=>sb.from("calendario_eventos").insert(p).select(), linhas);
      if(error){ alert("Erro ao criar o evento: "+error.message); return false; }
      (data||[]).forEach(r=>{
        const m = mapEventoCalFromDb(r); CAL_EVENTOS.push(m);
        if(m.usuarioId!==currentUser.id) criarNotificacao(m.usuarioId, "calendario_evento", "Novo evento no seu calendário", m.titulo+" — "+(m.dataInicio===m.dataFim ? dataBR(m.dataInicio) : dataBR(m.dataInicio)+" a "+dataBR(m.dataFim)), "calendario", m.id);
      });
      acaoPlataforma("Novo evento no calendário", campos.oculto ? "(evento oculto)" : titulo, "calendario", (data&&data[0]) ? data[0].id : null, pessoas);
      const convIds = [...document.querySelectorAll(".cal-conv")].filter(c=>c.checked).map(c=>c.value).filter(u=>!pessoas.includes(u));
      if(convIds.length && data && data[0]){
        const nEnv = await enviarConvites("evento", titulo, campos.descricao, ini, {grupo_id:grupo, tipo, data_inicio:ini, data_fim:fim, dia_inteiro:diaInteiro, hora_inicio:campos.hora_inicio, hora_fim:campos.hora_fim, local:campos.local, descricao:campos.descricao, bloqueia:campos.bloqueia}, data[0].id, convIds);
        if(nEnv) mostrarToast("Evento criado e "+nEnv+" convite"+(nEnv>1?"s enviados":" enviado")+".");
      }
      mostrarToast(pessoas.length>1 ? "Evento criado para "+pessoas.length+" pessoas." : (pessoas[0]!==currentUser.id ? "Evento criado no calendário de outra pessoa." : "Evento criado."));
    }
  } finally { btn.disabled = false; }
  fecharModalEventoCal();
  renderCalendario(); renderInicio();
  return false;
}

// Remove/cancela: excluir evento cal
async function excluirEventoCal(){
  const id = Number(document.getElementById("cal-id").value);
  const e = CAL_EVENTOS.find(x=>x.id===id);
  if(!e || !calPodeEditar(e) || !confirm("Excluir este evento?")) return;
  const { data: apagados, error } = await sb.from("calendario_eventos").delete().eq("id", id).select("id");
  if(error){ alert("Erro ao excluir: "+error.message); return; }
  if(!apagados || !apagados.length){ alert("Não foi possível excluir este evento: sem permissão."); return; }
  acaoPlataforma("Evento excluído do calendário", e.titulo, null, null, [e.usuarioId]);
  CAL_EVENTOS = CAL_EVENTOS.filter(x=>x.id!==id);
  fecharModalEventoCal(); renderCalendario(); renderInicio();
  mostrarToast("Evento excluído.");
}

