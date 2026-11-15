/* =====================================================================
   CONVITES — evento ou tarefa com convidado que aceita ou recusa
   ===================================================================== */
function mapConviteFromDb(c){
  return {id:c.id, tipo:c.tipo, titulo:c.titulo, descricao:c.descricao||"", convidanteId:c.convidante_id, convidanteNome:c.convidante_nome||"",
    convidadoId:c.convidado_id, status:c.status, dataRef:c.data_ref, dados:c.dados||{}, origemId:c.origem_id, resultadoId:c.resultado_id, criadoEm:c.created_at};
}
function convitesRecebidos(){ return CONVITES.filter(c=>currentUser && c.convidadoId===currentUser.id); }
function convitesEnviados(){ return CONVITES.filter(c=>currentUser && c.convidanteId===currentUser.id); }
function convitesPendentesRecebidos(){ return convitesRecebidos().filter(c=>c.status==="Pendente"); }
function atualizarBadgeConvites(){
  const n = currentUser ? convitesPendentesRecebidos().length : 0;
  const b = document.getElementById("cal-convites-n"); if(!b) return;
  b.textContent = n; b.style.display = n ? "inline-flex" : "none";
  const btn = document.getElementById("cal-convites-btn"); if(btn) btn.classList.toggle("tem", n>0);
}
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
function convitesDoDiaHtml(uid, iso){
  if(!currentUser || uid!==currentUser.id) return [];
  return convitesPendentesRecebidos().filter(c=>c.dataRef===iso).map(c=>`<div class="dc-item convite"><div class="dc-l1"><span class="dc-t">✉ ${escHtml(c.titulo)}</span><span class="dc-chip pend">${c.tipo==="evento"?"Evento":"Tarefa"}</span></div>
    <div class="dc-s">Convite de ${escHtml(c.convidanteNome)}${conviteQuando(c)}</div>
    <div class="dc-chips"><button type="button" class="cv-btn sim" onclick="responderConvite(${c.id},true)">✓ Aceitar</button><button type="button" class="cv-btn nao" onclick="responderConvite(${c.id},false)">Recusar</button></div></div>`);
}
function conviteQuando(c){
  const d = c.dados||{};
  if(c.tipo==="evento") return " · "+(d.data_inicio===d.data_fim || !d.data_fim ? dataBR(d.data_inicio||c.dataRef) : dataBR(d.data_inicio)+" a "+dataBR(d.data_fim))+(d.dia_inteiro ? " · dia inteiro" : (d.hora_inicio ? " · "+String(d.hora_inicio).slice(0,5)+"–"+String(d.hora_fim||"").slice(0,5) : ""));
  return d.dataLimite ? " · prazo "+dataBR(d.dataLimite) : "";
}
let convitesAbaAtual = "recebidos";
function abrirConvites(){ convitesAbaAtual = convitesPendentesRecebidos().length || !convitesEnviados().length ? "recebidos" : "enviados"; renderConvites(); document.getElementById("modal-convites").style.display = "flex"; }
function fecharConvites(){ document.getElementById("modal-convites").style.display = "none"; }
function convitesAba(a){ convitesAbaAtual = a; renderConvites(); }
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
async function cancelarConvite(id){
  const c = CONVITES.find(x=>x.id===id); if(!c || c.status!=="Pendente" || !confirm("Cancelar este convite?")) return;
  const { error } = await sb.from("convites").delete().eq("id", id);
  if(error){ alert("Erro ao cancelar: "+error.message); return; }
  CONVITES = CONVITES.filter(x=>x.id!==id); renderConvites(); renderCalendario();
}
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
// campos "Convidar pessoas" dos formulários
function convPickerHtml(cls, excluirIds){
  return avPickerHtml(usuariosAtivosOrdenados().filter(u=>u.id!==currentUser.id && !(excluirIds||[]).includes(u.id)), cls, "checkbox", "", ()=>false, false);
}
function convStatusHtml(tipo, origemId){
  const l = CONVITES.filter(c=>c.tipo===tipo && c.origemId===origemId);
  if(!l.length) return '<span class="dc-vazio">Nenhum convite enviado.</span>';
  return l.map(c=>{ const u = USUARIOS.find(x=>x.id===c.convidadoId); return `<span class="dc-chip ${c.status==="Aceito"?"ok":c.status==="Recusado"?"rej":"pend"}" style="margin:0 6px 6px 0;">${escHtml(u?u.nome:"—")} · ${c.status}</span>`; }).join("");
}
function calPopularConvidados(ev){
  const box = document.getElementById("cal-convidados-lista"), nome = document.getElementById("cal-convidados-nome");
  if(!box) return;
  if(ev){ box.className = ""; box.innerHTML = convStatusHtml("evento", ev.id); nome.textContent = ""; }
  else { box.className = "av-picker"; box.innerHTML = convPickerHtml("cal-conv"); avPickerNomes("cal-convidados-lista","cal-convidados-nome"); nome.textContent = "Ninguém convidado"; }
}
function demPopularConvidados(id){
  const box = document.getElementById("dem-convidados-lista"), nome = document.getElementById("dem-convidados-nome");
  if(!box) return;
  if(id){ box.className = ""; box.innerHTML = convStatusHtml("tarefa", Number(id)); nome.textContent = ""; }
  else { box.className = "av-picker"; box.innerHTML = convPickerHtml("dem-conv"); nome.textContent = "Ninguém convidado"; }
}

/* ---- registrar ausência / bloquear a agenda ---- */
let ausModo = "ausencia";
function ausDiasUteis(ini, fim){
  if(!ini || !fim || fim<ini) return 0;
  let n = 0; for(let d=new Date(ini+"T00:00:00"), f=new Date(fim+"T00:00:00"); d<=f; d.setDate(d.getDate()+1)){ const g=d.getDay(); if(g!==0 && g!==6) n++; }
  return n;
}
function ausAtualizarResumo(){
  const el = document.getElementById("aus-resumo"); if(!el) return;
  const ini = document.getElementById("aus-ini").value, fim = document.getElementById("aus-fim").value;
  if(fim && ini && fim<ini){ el.textContent = "A data final não pode ser antes da inicial."; return; }
  const n = ausDiasUteis(ini, fim);
  el.textContent = n ? n+" dia"+(n===1?"":"s")+" útil"+(n===1?"":"eis")+" no período (fins de semana não contam)." : "";
}
function ausPeriodo(p){
  document.getElementById("aus-periodo").value = p;
  document.querySelectorAll("#aus-periodo-sw .sw-btn").forEach(b=>{ const a = b.dataset.p===p; b.classList.toggle("ativo",a); b.classList.toggle("sw-aprovado",a); });
  const h = p==="Horário";
  document.getElementById("aus-hi-wrap").style.display = h ? "" : "none";
  document.getElementById("aus-hf-wrap").style.display = h ? "" : "none";
}
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
function fecharModalAusencia(){ document.getElementById("modal-aus").style.display = "none"; }
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
function calAlternarHoras(){
  const di = document.getElementById("cal-dia-inteiro").checked;
  document.getElementById("cal-horas-hi").style.display = di ? "none" : "";
  document.getElementById("cal-horas-hf").style.display = di ? "none" : "";
}
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
function fecharModalEventoCal(){ document.getElementById("modal-cal").style.display = "none"; }
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
function calHorasSobrepoem(a, b){ if(a.diaInteiro || b.diaInteiro) return true; return a.hi < b.hf && b.hi < a.hf; }
// o que já ocupa a pessoa no período do novo evento
function calConflitos(uid, d){
  const lista = CAL_EVENTOS.filter(e=>e.id!==d.id && e.usuarioId===uid && e.bloqueia && e.dataInicio<=d.fim && e.dataFim>=d.ini
    && calHorasSobrepoem({diaInteiro:e.diaInteiro, hi:e.horaInicio, hf:e.horaFim}, d)).map(e=>{ const m = calMascararEvento(e); return m.tipo+": "+m.titulo; });
  if(d.diaInteiro) DEMANDAS.filter(x=>x.responsavelUsuarioId===uid && x.agendadoPara && x.agendadoPara>=d.ini && x.agendadoPara<=d.fim && !x.entregueEm && !demandaConcluida(x)).forEach(x=>lista.push("Demanda #"+x.id+" agendada em "+dataBR(x.agendadoPara)));
  return lista;
}
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

/* ---- Atualização dos dados: automática (a cada 2 min, sem atrapalhar quem está digitando) e manual ---- */
const ATUALIZACAO_AUTO_MS = 120000;
let timerAtualizacao = null, atualizandoDados = false, ultimaAtualizacao = Date.now();
function interacaoEmAndamento(){
  const ae = document.activeElement;
  if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return true;
  return [...document.querySelectorAll(".modal-bg")].some(m=>m.style.display && m.style.display!=="none");
}
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
const VIEWS_RECARREGAVEIS_AUTO = ["inicio","agenda","demandas","lancamento","calendario"];
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
function iniciarAtualizacaoAutomatica(){
  pararAtualizacaoAutomatica();
  timerAtualizacao = setInterval(()=>atualizarDados("auto"), ATUALIZACAO_AUTO_MS);
}
function pararAtualizacaoAutomatica(){ if(timerAtualizacao){ clearInterval(timerAtualizacao); timerAtualizacao = null; } }
document.addEventListener("visibilitychange", ()=>{
  if(!document.hidden && currentUser && Date.now()-ultimaAtualizacao > 60000) atualizarDados("auto");
});

/* ---- Aprovação de visitas: feita direto na Visão Semanal (Administrador/Coordenador) ---- */
function visitasPendentesAgenda(){ return AGENDA.filter(v=>v.status==="Pendente"); }
function intervaloSemanaAgenda(){
  const seg = segundaDaSemana(semanaAgendaOffset), sex = new Date(seg); sex.setDate(seg.getDate()+4);
  return [dataISOLocal(seg), dataISOLocal(sex)];
}
function offsetSemanaDeData(iso){
  const d = new Date(iso+"T00:00:00");
  const seg = new Date(d); seg.setDate(d.getDate() - ((d.getDay()+6)%7));
  return Math.round((seg - segundaDaSemana(0)) / (7*86400000));
}
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
function abrirAprovacoesInicio(){
  abrirModuloInicio("agenda","semanal");
  irParaSemanaPendenteAgenda();
}
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
// botões Aprovar / Rejeitar dentro do card da visita pendente (só para quem organiza)
function botoesAprovarAgendaHtml(vs){
  const ids = (vs||[]).filter(x=>x && x.status==="Pendente" && !x._mask).map(x=>x.id);
  if(!ids.length || !podeAprovarAgenda(currentUser)) return "";
  return `<span class="ag-aprov-btns">
    <button type="button" class="ag-ap sim" title="Aprovar visita" onclick="event.stopPropagation(); decidirVisitasAgenda([${ids.join(",")}],'Aprovado')">✓ Aprovar</button>
    <button type="button" class="ag-ap nao" title="Rejeitar visita" onclick="event.stopPropagation(); decidirVisitasAgenda([${ids.join(",")}],'Rejeitado')">Rejeitar</button>
  </span>`;
}
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
async function aprovarSemanaAgenda(){
  const [ini, fim] = intervaloSemanaAgenda();
  const ids = visitasPendentesAgenda().filter(v=>v.data>=ini && v.data<=fim).map(v=>v.id);
  if(!ids.length) return;
  if(!confirm("Aprovar as "+ids.length+" visita(s) pendente(s) desta semana?")) return;
  await decidirVisitasAgenda(ids, "Aprovado");
}
function aprovarVisita(id){ return decidirVisitasAgenda([id], "Aprovado"); }
function rejeitarVisita(id){ return decidirVisitasAgenda([id], "Rejeitado"); }

/* ---- Indicadores da Agenda (Administrador/Coordenador) ---- */
function limparFiltrosAgendaIndicadores(){
  document.getElementById("ag-ind-de").value = "";
  document.getElementById("ag-ind-ate").value = "";
  document.getElementById("ag-ind-profissional").value = "";
  renderIndicadoresAgenda();
}
// Horário e localização do check-in/out: só o próprio usuário e o Administrador enxergam
function podeVerPresencaAgenda(v){
  return !!currentUser && !!v && (currentUser.perfil==="Administrador" || v.usuarioId===currentUser.id);
}
function linkGeo(geo, rotulo){
  if(!geo || geo.lat==null || geo.lng==null) return "";
  return `<a class="ag-geo" href="https://www.google.com/maps?q=${encodeURIComponent(geo.lat)},${encodeURIComponent(geo.lng)}" target="_blank" rel="noopener" title="${escHtml(rotulo||"Ver local no mapa")}" aria-label="${escHtml(rotulo||"Ver local no mapa")}" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4.5A2.5 2.5 0 1 0 12 11.5 2.5 2.5 0 0 0 12 6.5Z"/></svg></a>`;
}
function celulaPresencaAgenda(v, reg){
  if(!reg) return "—";
  return podeVerPresencaAgenda(v) ? escHtml(horaDoRegistroAgenda(reg) || reg.hora || "") : "Registrado";
}
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

/* ---- Visão semanal ---- */
function segundaDaSemana(offsetSemanas){
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const dia = hoje.getDay();
  const diffParaSegunda = (dia===0? -6 : 1-dia);
  hoje.setDate(hoje.getDate()+diffParaSegunda+offsetSemanas*7);
  return hoje;
}
function mudarSemanaAgenda(delta){ semanaAgendaOffset += delta; renderGradeSemanal(); }
function irSemanaAtualAgenda(){ semanaAgendaOffset = 0; renderGradeSemanal(); }
function dataUltimaVisitaAnterior(usuarioId, unidade, dataAtual){
  const anteriores = AGENDA.filter(v=>v.usuarioId===usuarioId && v.unidade===unidade && v.status!=="Rejeitado" && v.data<dataAtual);
  if(!anteriores.length) return null;
  return anteriores.reduce((max,v)=> v.data>max?v.data:max, anteriores[0].data);
}
/* ---- Visões semanal e mensal: uma linha por usuário, dividida em Manhã | Tarde (ou barra inteira = Dia inteiro) ---- */
function primeiroNomeAgenda(n){ return String(n||"").trim().split(/\s+/)[0]; }
// Monta as linhas de um dia: cada usuário com uma linha por visita "Dia inteiro" e uma linha dividida para manhã/tarde
const LUZ_VERDE_DIAS = 20, LUZ_AMARELO_DIAS = 45;   // limites da luz de "última visita na unidade": verde ≤20 d, amarela ≤45 d, vermelha >45 d
let agIndiceUnidades = new Map();                   // unidade -> datas (ordenadas) das visitas aprovadas
function montarIndiceUnidadesAgenda(){
  const m = new Map();
  AGENDA.forEach(v=>{ if(v.status!=="Aprovado") return; if(!m.has(v.unidade)) m.set(v.unidade, new Set()); m.get(v.unidade).add(v.data); });
  agIndiceUnidades = new Map([...m].map(([u,s])=>[u,[...s].sort()]));
}
// dias entre esta visita e a visita aprovada anterior à mesma unidade (qualquer usuário)
function luzUltimaVisita(v){
  const datas = agIndiceUnidades.get(v.unidade) || [];
  let ant = null;
  for(const d of datas){ if(d<v.data) ant = d; else break; }
  if(!ant) return {cls:"nenhuma", ant:null, dias:null};
  const dias = Math.round((new Date(v.data+"T00:00:00")-new Date(ant+"T00:00:00"))/86400000);
  return {cls: dias<=LUZ_VERDE_DIAS ? "verde" : dias<=LUZ_AMARELO_DIAS ? "amarelo" : "vermelho", ant, dias};
}
function legendaLuzesHtml(){
  return `<span class="agm-luzes">
    <span><i class="ag-luz verde"></i>Verde: visita até ${LUZ_VERDE_DIAS} dias</span>
    <span><i class="ag-luz amarelo"></i>Amarela: ${LUZ_VERDE_DIAS+1} a ${LUZ_AMARELO_DIAS} dias</span>
    <span><i class="ag-luz vermelho"></i>Vermelha: loja sem visita há mais de ${LUZ_AMARELO_DIAS} dias</span></span>`;
}
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
function fecharEdicaoVisita(){ const o = document.getElementById("modal-edit-visita"); if(o) o.remove(); }
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
function podeExcluirVisitaAgenda(v){ return !!currentUser && !v._mask && (v.usuarioId===currentUser.id || ehAdminOuCoordenador()); }
function horaDoRegistroAgenda(reg){
  const m = reg && reg.hora ? String(reg.hora).match(/(\d{2}:\d{2})/) : null;
  return m ? m[1] : "";
}
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
// check-in: horário ao lado do local (com o ícone do mapa); check-out: linha vermelha com o horário
function presencaPartesAgenda(vs){
  const lista = vs.filter(podeVerPresencaAgenda);
  const comIn = lista.find(x=>horaDoRegistroAgenda(x.checkin));
  const comOut = [...lista].reverse().find(x=>horaDoRegistroAgenda(x.checkout));
  const entrada = comIn ? `<span class="ag-hora" title="Check-in">${escHtml(horaDoRegistroAgenda(comIn.checkin))}${linkGeo(comIn.checkin.geo, "Ver local do check-in no mapa")}</span>` : "";
  const saida = comOut ? `<div class="ag-saida"><span>Check-out ${escHtml(horaDoRegistroAgenda(comOut.checkout))}</span>${linkGeo(comOut.checkout.geo, "Ver local do check-out no mapa")}</div>` : "";
  return {entrada, saida};
}
function dicaVisitaAgenda(vs){
  return vs.map(v=>v.usuarioNome+" · "+v.unidade+" · "+v.periodo+(v.motivo?" · "+v.motivo:"")+(v.status==="Pendente"?" (pendente de aprovação)":"")+(v.descricao?"\n"+v.descricao:"")).join("\n");
}
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
function avatarMiniAgenda(usuarioId, nomeFallback){
  const u = USUARIOS.find(x=>x.id===usuarioId);
  const nome = u ? u.nome : (nomeFallback||"");
  if(u && u.foto) return `<img src="${u.foto}" class="agm-av" alt="" title="${escHtml(nome)}">`;
  return `<span class="agm-av" title="${escHtml(nome)}" style="background:${corAvatarPorNome(nome)};">${escHtml(iniciaisTexto(nome))}</span>`;
}
function visitasAtivasDoDia(iso){
  return AGENDA.filter(v=>v.data===iso && v.status!=="Rejeitado").map(visitaMascarada)
    .sort((a,b)=> (ORDEM_PERIODO_AGENDA[a.periodo]??9)-(ORDEM_PERIODO_AGENDA[b.periodo]??9) || String(a.usuarioNome).localeCompare(String(b.usuarioNome),"pt-BR"));
}
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

/* ---- Visão mensal: todos os dados de cada visita direto no dia (sem precisar clicar) ---- */
function mudarMesAgenda(delta){ mesAgendaOffset += delta; renderGradeMensal(); }
function irMesAtualAgenda(){ mesAgendaOffset = 0; renderGradeMensal(); }
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

