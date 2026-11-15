/* =====================================================================
   REUNIÕES — Reuniões (com tipos) e Dailys
   ===================================================================== */
let REUNIOES = [], REUNIOES_TIPOS = [];
let rnFiltro = {quando:"proximas"};
let rnEdit = null;
let rnSubAtual = "reunioes";

function avatarMini(nome){
  return `<span class="av" style="background:${corAvatarPorNome(nome)};" title="${escHtml(nome)}">${iniciaisTexto(nome)}</span>`;
}
function nomeUsuarioPorId(id){ const u = USUARIOS.find(x=>x.id===id); return u ? u.nome : "—"; }
function usuariosAtivosOrdenados(){
  return USUARIOS.filter(u=>u.ativo!==false).slice().sort((a,b)=>cmpPtBr(a.nome,b.nome));
}
function hhmm(t){ return t ? String(t).slice(0,5) : ""; }

function mapReuniaoFromDb(r){
  return {
    id:r.id, tipoId:r.tipo_id, titulo:r.titulo, data:r.data, horaInicio:hhmm(r.hora_inicio), horaFim:hhmm(r.hora_fim),
    local:r.local||"", pauta:r.pauta||"", ata:r.ata||"", status:r.status||"Agendada",
    participantes:Array.isArray(r.participantes)?r.participantes:[], presentes:Array.isArray(r.presentes)?r.presentes:[],
    encaminhamentos:Array.isArray(r.encaminhamentos)?r.encaminhamentos:[], criadoPor:r.criado_por
  };
}
async function initReunioes(){
  const btnTipos = document.getElementById("btn-gerenciar-tipos");
  if(btnTipos) btnTipos.style.display = ehAdminOuCoordenador() ? "" : "none";
  const [rt, rr] = await Promise.all([
    sb.from("reunioes_tipos").select("*").order("ordem").order("id"),
    sb.from("reunioes").select("*").order("data", {ascending:false}).limit(1500)
  ]);
  if(rt.error) console.error("[Supabase] reunioes_tipos:", rt.error);
  if(rr.error) console.error("[Supabase] reunioes:", rr.error);
  REUNIOES_TIPOS = (rt.data||[]).map(t=>({id:t.id, nome:t.nome, cor:t.cor||"#a15a33"}));
  REUNIOES = (rr.data||[]).map(mapReuniaoFromDb);
  popularFiltroTiposReuniao();
  renderReunioes();
  mostrarSubReunioes(rnSubAtual);
}
function popularFiltroTiposReuniao(){
  const sel = document.getElementById("rn-f-tipo");
  if(!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todos os tipos</option>' + REUNIOES_TIPOS.map(t=>`<option value="${t.id}">${escHtml(t.nome)}</option>`).join("");
  if(REUNIOES_TIPOS.some(t=>String(t.id)===atual)) sel.value = atual;
}
function mostrarSubReunioes(sub){
  rnSubAtual = sub;
  document.querySelectorAll("#view-reunioes .insp-tab").forEach(b=>b.classList.toggle("active", b.dataset.sub===sub));
  document.querySelectorAll("#view-reunioes .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("reunioes-sub-"+sub).classList.add("active");
  document.getElementById("btn-nova-reuniao").style.display = sub==="reunioes" ? "" : "none";
  if(sub==="dailys") initDailys();
}
function filtrarReunioesQuando(q){
  rnFiltro.quando = q;
  document.querySelectorAll("#rn-seg button").forEach(b=>b.classList.toggle("active", b.dataset.q===q));
  renderReunioes();
}
function rotuloMesReuniao(iso){
  const s = new Date(iso+"T00:00:00").toLocaleDateString("pt-BR",{month:"long", year:"numeric"});
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function reuniaoItemHtml(r, hoje){
  const tipo = REUNIOES_TIPOS.find(t=>t.id===r.tipoId);
  const cor = tipo ? tipo.cor : "#9f8167";
  const dt = new Date(r.data+"T00:00:00");
  const dia = String(dt.getDate()).padStart(2,"0");
  const mes = dt.toLocaleDateString("pt-BR",{month:"short"}).replace(".","");
  const sem = dt.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","");
  const hora = r.horaInicio ? r.horaInicio + (r.horaFim ? "–"+r.horaFim : "") : "Horário a definir";
  const nomes = r.participantes.map(nomeUsuarioPorId).filter(n=>n!=="—");
  const avs = nomes.slice(0,4).map(avatarMini).join("") + (nomes.length>4 ? `<span class="av mais">+${nomes.length-4}</span>` : "");
  const pend = r.encaminhamentos.filter(e=>!e.feito).length;
  const atrasada = r.status==="Agendada" && r.data<hoje;
  const lado = (atrasada ? `<span class="rn-pend" style="color:var(--vermelho); font-weight:700;">Já passou — registre a ata</span>` : "")
    + (pend ? `<span class="rn-pend">${pend} encaminhamento${pend===1?"":"s"} em aberto</span>` : "");
  return `<div class="rn-item ${r.data===hoje?"hoje":""}" style="border-left-color:${cor};" onclick="abrirModalReuniao(${r.id})">
    <div class="rn-data"><b>${dia}</b><span>${mes}</span></div>
    <div class="rn-corpo">
      <h4>${escHtml(r.titulo)}</h4>
      <div class="rn-meta">
        ${tipo?`<span class="rn-tipo" style="background:${cor};">${escHtml(tipo.nome)}</span>`:""}
        <span>${sem} · ${hora}</span>
        ${r.local?`<span>📍 ${escHtml(r.local)}</span>`:""}
        ${nomes.length?`<span class="rn-avs">${avs}</span>`:""}
      </div>
    </div>
    <div class="rn-lado"><span class="rn-status ${r.status}">${r.status}</span>${lado}</div>
  </div>`;
}
function renderReunioes(){
  const wrap = document.getElementById("rn-lista");
  if(!wrap) return;
  const hoje = dataISOLocal(new Date());
  const tipoSel = document.getElementById("rn-f-tipo")?.value;
  let lista = REUNIOES.filter(r=>!tipoSel || String(r.tipoId)===tipoSel);
  const cmpAsc = (a,b)=> (a.data+(a.horaInicio||"")).localeCompare(b.data+(b.horaInicio||""));
  if(rnFiltro.quando==="proximas"){
    lista = lista.filter(r=>r.data>=hoje && r.status!=="Cancelada").sort(cmpAsc);
  } else if(rnFiltro.quando==="realizadas"){
    lista = lista.filter(r=>r.status==="Realizada").sort((a,b)=>cmpAsc(b,a));
  } else {
    lista = lista.sort((a,b)=>cmpAsc(b,a));
  }
  if(!lista.length){
    const msg = rnFiltro.quando==="proximas" ? "Nenhuma reunião marcada pela frente." : rnFiltro.quando==="realizadas" ? "Nenhuma reunião realizada registrada." : "Nenhuma reunião cadastrada.";
    wrap.innerHTML = `<div class="rn-vazio"><b>${msg}</b>Clique em “+ Nova reunião” para marcar a primeira${REUNIOES_TIPOS.length?"":" (cadastre antes os tipos em “Gerenciar tipos de reunião”)"}.</div>`;
    return;
  }
  let mesAnt = "", html = [];
  lista.forEach(r=>{
    const mes = rotuloMesReuniao(r.data);
    if(mes!==mesAnt){ if(mesAnt) html.push("</div>"); html.push(`<div class="rn-mes">${mes}</div><div class="rn-lista">`); mesAnt = mes; }
    html.push(reuniaoItemHtml(r, hoje));
  });
  html.push("</div>");
  wrap.innerHTML = html.join("");
}

/* ---- Modal da reunião ---- */
function abrirModalReuniao(id){
  const r = id ? REUNIOES.find(x=>x.id===id) : null;
  if(id && !r) return;
  rnEdit = {
    id: r ? r.id : null,
    participantes: new Set(r ? r.participantes : (currentUser ? [currentUser.id] : [])),
    presentes: new Set(r ? r.presentes : []),
    encaminhamentos: r ? r.encaminhamentos.map(e=>({txt:e.txt||"", respId:e.respId||"", prazo:e.prazo||"", feito:!!e.feito})) : [],
    originais: r ? r.participantes.slice() : []
  };
  document.getElementById("form-reuniao").reset();
  document.getElementById("rn-id").value = r ? r.id : "";
  document.getElementById("rn-tipo").innerHTML = '<option value="">Sem tipo</option>' + REUNIOES_TIPOS.map(t=>`<option value="${t.id}">${escHtml(t.nome)}</option>`).join("");
  document.getElementById("rn-modal-title").textContent = r ? r.titulo : "Nova reunião";
  document.getElementById("rn-key").textContent = r ? "Reunião #"+r.id : "Nova";
  document.getElementById("btn-remover-reuniao").style.display = (r && (ehAdminOuCoordenador() || (currentUser && r.criadoPor===currentUser.id))) ? "" : "none";
  document.getElementById("rn-titulo").value = r ? r.titulo : "";
  document.getElementById("rn-tipo").value = r && r.tipoId ? r.tipoId : (REUNIOES_TIPOS[0] ? REUNIOES_TIPOS[0].id : "");
  document.getElementById("rn-status").value = r ? r.status : "Agendada";
  document.getElementById("rn-data").value = r ? r.data : dataISOLocal(new Date());
  document.getElementById("rn-hi").value = r ? r.horaInicio : "";
  document.getElementById("rn-hf").value = r ? r.horaFim : "";
  document.getElementById("rn-local").value = r ? r.local : "";
  document.getElementById("rn-pauta").value = r ? r.pauta : "";
  document.getElementById("rn-ata").value = r ? r.ata : "";
  renderParticipantesReuniao();
  renderEncaminhamentosReuniao();
  atualizarChipsReuniao();
  document.body.style.overflow = "hidden";
  document.getElementById("modal-reuniao").style.display = "flex";
  if(!r) setTimeout(()=>document.getElementById("rn-titulo").focus(), 50);
}
function fecharModalReuniao(){
  document.getElementById("modal-reuniao").style.display = "none";
  if(document.getElementById("modal-demanda").style.display!=="flex") document.body.style.overflow = "";
}
function atualizarChipsReuniao(){
  const tipo = REUNIOES_TIPOS.find(t=>String(t.id)===document.getElementById("rn-tipo").value);
  const data = document.getElementById("rn-data").value;
  const status = document.getElementById("rn-status").value;
  const chips = [];
  if(tipo) chips.push(`<span class="dm-chip"><i style="background:${tipo.cor};"></i>${escHtml(tipo.nome)}</span>`);
  if(data) chips.push(`<span class="dm-chip">${new Date(data+"T00:00:00").toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long"})}</span>`);
  chips.push(`<span class="dm-chip">${status}</span>`);
  chips.push(`<span class="dm-chip">${rnEdit.participantes.size} convocado${rnEdit.participantes.size===1?"":"s"}</span>`);
  document.getElementById("rn-chips").innerHTML = chips.join("");
}
function renderParticipantesReuniao(){
  const us = usuariosAtivosOrdenados();
  document.getElementById("rn-part").innerHTML =
    `<span class="cab">Participante</span><span class="cab">Convocado</span><span class="cab">Presente</span>` +
    us.map(u=>`<span class="nm">${avatarMini(u.nome)}${escHtml(u.nome)}</span>
      <input type="checkbox" ${rnEdit.participantes.has(u.id)?"checked":""} onchange="rnTogglePart('${u.id}','c',this.checked)">
      <input type="checkbox" ${rnEdit.presentes.has(u.id)?"checked":""} onchange="rnTogglePart('${u.id}','p',this.checked)">`).join("");
  atualizarChipsReuniao();
}
function rnTogglePart(uid, tipo, marcado){
  if(tipo==="c"){
    if(marcado) rnEdit.participantes.add(uid); else { rnEdit.participantes.delete(uid); rnEdit.presentes.delete(uid); }
  } else {
    if(marcado){ rnEdit.presentes.add(uid); rnEdit.participantes.add(uid); } else rnEdit.presentes.delete(uid);
  }
  renderParticipantesReuniao();
}
function rnConvocarTodos(){
  usuariosAtivosOrdenados().forEach(u=>rnEdit.participantes.add(u.id));
  renderParticipantesReuniao();
}
function renderEncaminhamentosReuniao(){
  const us = usuariosAtivosOrdenados();
  const opts = '<option value="">Responsável</option>' + us.map(u=>`<option value="${u.id}">${escHtml(u.nome)}</option>`).join("");
  const wrap = document.getElementById("rn-enc");
  if(!rnEdit.encaminhamentos.length){ wrap.innerHTML = '<span class="estrutura-vazio" style="color:var(--areia-esc); font-size:13px;">Nenhum encaminhamento ainda. Registre aqui o que ficou combinado, com responsável e prazo.</span>'; return; }
  wrap.innerHTML = rnEdit.encaminhamentos.map((e,i)=>`<div class="rn-enc-lin ${e.feito?"feito":""}">
    <input type="checkbox" ${e.feito?"checked":""} onchange="rnEncSet(${i},'feito',this.checked); renderEncaminhamentosReuniao();" title="Concluído">
    <input type="text" value="${escHtml(e.txt)}" maxlength="300" placeholder="O que precisa ser feito" oninput="rnEncSet(${i},'txt',this.value)">
    <select onchange="rnEncSet(${i},'respId',this.value)">${opts.replace(`value="${e.respId}"`, `value="${e.respId}" selected`)}</select>
    <input type="date" value="${escHtml(e.prazo)}" onchange="rnEncSet(${i},'prazo',this.value)">
    <button type="button" class="rn-x" title="Remover" onclick="rnEncDel(${i})">×</button>
  </div>`).join("");
}
function rnEncSet(i, campo, valor){ if(rnEdit.encaminhamentos[i]) rnEdit.encaminhamentos[i][campo] = valor; }
function rnEncAdd(){ rnEdit.encaminhamentos.push({txt:"", respId:"", prazo:"", feito:false}); renderEncaminhamentosReuniao(); const ins = document.querySelectorAll("#rn-enc .rn-enc-lin input[type=text]"); if(ins.length) ins[ins.length-1].focus(); }
function rnEncDel(i){ rnEdit.encaminhamentos.splice(i,1); renderEncaminhamentosReuniao(); }
document.addEventListener("DOMContentLoaded", ()=>{
  ["rn-tipo","rn-data","rn-status"].forEach(id=>{ const el = document.getElementById(id); if(el) el.addEventListener("change", ()=>{ if(rnEdit) atualizarChipsReuniao(); }); });
});
async function salvarReuniao(ev){
  ev.preventDefault();
  const id = document.getElementById("rn-id").value;
  const titulo = document.getElementById("rn-titulo").value.trim();
  const data = document.getElementById("rn-data").value;
  if(!titulo || !data){ alert("Informe o título e a data da reunião."); return false; }
  const hi = document.getElementById("rn-hi").value, hf = document.getElementById("rn-hf").value;
  if(hi && hf && hf<=hi){ alert("O horário de término precisa ser depois do início."); return false; }
  const tipoId = document.getElementById("rn-tipo").value;
  const payload = {
    tipo_id: tipoId ? Number(tipoId) : null, titulo, data,
    hora_inicio: hi||null, hora_fim: hf||null,
    local: document.getElementById("rn-local").value.trim(),
    pauta: document.getElementById("rn-pauta").value.trim(),
    ata: document.getElementById("rn-ata").value.trim(),
    status: document.getElementById("rn-status").value,
    participantes: [...rnEdit.participantes],
    presentes: [...rnEdit.presentes],
    encaminhamentos: rnEdit.encaminhamentos.filter(e=>e.txt.trim()).map(e=>({txt:e.txt.trim(), respId:e.respId||"", prazo:e.prazo||"", feito:!!e.feito})),
    updated_at: new Date().toISOString()
  };
  let salvo;
  if(id){
    const { data:d, error } = await sb.from("reunioes").update(payload).eq("id", Number(id)).select().single();
    if(error){ alert("Erro ao salvar a reunião: "+error.message); return false; }
    salvo = mapReuniaoFromDb(d);
    REUNIOES = REUNIOES.map(r=>r.id===salvo.id ? salvo : r);
  } else {
    const { data:d, error } = await sb.from("reunioes").insert({...payload, criado_por: currentUser.id}).select().single();
    if(error){ alert("Erro ao criar a reunião: "+error.message); return false; }
    salvo = mapReuniaoFromDb(d);
    REUNIOES.unshift(salvo);
  }
  const novos = salvo.participantes.filter(u=>!rnEdit.originais.includes(u) && u!==currentUser.id);
  const quando = formatarDataBR(salvo.data).slice(0,5) + (salvo.horaInicio ? " às "+salvo.horaInicio : "");
  novos.forEach(u=>criarNotificacao(u, "reuniao_convocada", "Você foi convocado para uma reunião", salvo.titulo+" · "+quando, "reuniao", salvo.id));
  acaoPlataforma(id ? "Reunião atualizada" : "Reunião criada", salvo.titulo+" · "+quando, "reuniao", salvo.id, novos);
  fecharModalReuniao();
  renderReunioes();
  mostrarToast(id ? "Reunião atualizada." : "Reunião criada.");
  return false;
}
async function removerReuniao(){
  const id = Number(document.getElementById("rn-id").value);
  if(!id || !confirm("Remover esta reunião?")) return;
  const { error } = await sb.from("reunioes").delete().eq("id", id);
  if(error){ alert("Erro ao remover a reunião: "+error.message); return; }
  { const _r = REUNIOES.find(r=>r.id===id); acaoPlataforma("Reunião removida", _r ? _r.titulo : "", null, null); }
  REUNIOES = REUNIOES.filter(r=>r.id!==id);
  fecharModalReuniao();
  renderReunioes();
}

/* ---- Tipos de reunião ---- */
function abrirTiposReuniao(){
  renderTiposReuniao();
  document.getElementById("rn-tipo-add").style.display = ehAdminOuCoordenador() ? "flex" : "none";
  document.getElementById("modal-reuniao-tipos").style.display = "flex";
}
function renderTiposReuniao(){
  const el = document.getElementById("rn-tipos-lista");
  const pode = ehAdminOuCoordenador();
  if(!REUNIOES_TIPOS.length){ el.innerHTML = '<span style="color:var(--areia-esc); font-size:13px;">Nenhum tipo cadastrado.</span>'; return; }
  el.innerHTML = REUNIOES_TIPOS.map(t=>{
    const n = REUNIOES.filter(r=>r.tipoId===t.id).length;
    return `<div class="rn-tipo-lin"><i style="background:${escHtml(t.cor)};"></i><span>${escHtml(t.nome)}</span><small style="color:var(--areia-esc); font-weight:500;">${n} reunião${n===1?"":"ões"}</small>${pode?`<button type="button" class="rn-x" title="Remover tipo" onclick="removerTipoReuniao(${t.id})">×</button>`:""}</div>`;
  }).join("");
}
async function addTipoReuniao(){
  const inp = document.getElementById("rn-tipo-nome");
  const nome = inp.value.trim();
  if(!nome) return;
  if(REUNIOES_TIPOS.some(t=>t.nome.toLowerCase()===nome.toLowerCase())){ mostrarToast("Esse tipo já está cadastrado."); return; }
  const cor = document.getElementById("rn-tipo-cor").value || "#a15a33";
  const ordem = REUNIOES_TIPOS.length ? Math.max(...REUNIOES_TIPOS.map(t=>t.id)) : 0;
  const { data, error } = await sb.from("reunioes_tipos").insert({nome, cor, ordem}).select().single();
  if(error){ alert("Erro ao criar o tipo: "+error.message); return; }
  REUNIOES_TIPOS.push({id:data.id, nome:data.nome, cor:data.cor});
  inp.value = "";
  renderTiposReuniao(); popularFiltroTiposReuniao(); renderReunioes();
}
async function removerTipoReuniao(id){
  const t = REUNIOES_TIPOS.find(x=>x.id===id);
  if(!t || !confirm('Remover o tipo "'+t.nome+'"? As reuniões que o usam ficam sem tipo.')) return;
  const { error } = await sb.from("reunioes_tipos").delete().eq("id", id);
  if(error){ alert("Erro ao remover o tipo: "+error.message); return; }
  REUNIOES_TIPOS = REUNIOES_TIPOS.filter(x=>x.id!==id);
  REUNIOES.forEach(r=>{ if(r.tipoId===id) r.tipoId = null; });
  renderTiposReuniao(); popularFiltroTiposReuniao(); renderReunioes();
}

/* =====================================================================
   DAILYS — reunião diária: prioridades, achados, demandas travadas
   ===================================================================== */
let dlData = null;          // dia aberto (AAAA-MM-DD)
let dlItens = [];           // itens do dia aberto e do dia útil anterior
let dlPresencas = [];       // ids presentes no dia aberto
let dlContagem = {};        // data -> nº de itens (tira de dias)
let dlVerTodasSug = false;
const DL_SECOES = {
  prioridade:{tit:"Prioridades do dia", dica:"O que precisa andar hoje. Marque conforme a equipe for entregando.",
    ic:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>'},
  achado:{tit:"Achados do dia anterior", dica:"O que a equipe encontrou ontem: desvios, aprendizados, ocorrências e novidades das unidades.",
    ic:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'},
  bloqueio:{tit:"Demandas travadas", dica:"O que está parado e quem pode destravar. O sistema sugere demandas atrasadas ou aguardando alguém.",
    ic:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg>'},
  outro:{tit:"Outros assuntos e avisos", dica:"Avisos gerais, férias, treinamentos, cobranças e qualquer coisa fora das pautas acima.",
    ic:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4V5Z"/></svg>'}
};
function ehFimDeSemanaISO(iso){ const d = new Date(iso+"T00:00:00").getDay(); return d===0 || d===6; }
function diaUtilAnterior(iso){ let d = somarDiasISO(iso,-1); while(ehFimDeSemanaISO(d)) d = somarDiasISO(d,-1); return d; }
function diaUtilSeguinte(iso){ let d = somarDiasISO(iso,1); while(ehFimDeSemanaISO(d)) d = somarDiasISO(d,1); return d; }
function rotuloDiaCurtoDaily(iso){
  const d = new Date(iso+"T00:00:00");
  return d.toLocaleDateString("pt-BR",{weekday:"long"}).split("-")[0] + ", " + formatarDataBR(iso).slice(0,5);
}
async function initDailys(){
  if(!dlData) dlData = dataISOLocal(new Date());
  await carregarDaily();
}
async function carregarDaily(){
  const prev = diaUtilAnterior(dlData);
  const desde = somarDiasISO(dataISOLocal(new Date()), -20);
  const [ri, rp, rc] = await Promise.all([
    sb.from("dailys_itens").select("*").in("data", [dlData, prev]).order("id"),
    sb.from("dailys_presencas").select("*").eq("data", dlData),
    sb.from("dailys_itens").select("data").gte("data", desde).limit(5000)
  ]);
  if(ri.error) console.error("[Supabase] dailys_itens:", ri.error);
  if(rp.error) console.error("[Supabase] dailys_presencas:", rp.error);
  dlItens = ri.data||[];
  dlPresencas = (rp.data||[]).map(p=>p.usuario_id);
  dlContagem = {};
  (rc.data||[]).forEach(r=>{ dlContagem[r.data] = (dlContagem[r.data]||0)+1; });
  renderDailyCompleta();
}
function renderDailyCompleta(){
  renderDailyNav(); renderDailyPresencas();
  ["prioridade","achado","bloqueio","outro"].forEach(renderDailySecao);
  renderDailyRodape();
}
function dlItensDoDia(secao){ return dlItens.filter(i=>i.data===dlData && i.secao===secao); }
async function dlIr(iso){
  if(!iso) return;
  dlData = iso; dlVerTodasSug = false;
  await carregarDaily();
}
function dlIrAnterior(){ return dlIr(diaUtilAnterior(dlData)); }
function dlIrSeguinte(){ return dlIr(diaUtilSeguinte(dlData)); }
function dlIrHoje(){ return dlIr(dataISOLocal(new Date())); }
function renderDailyNav(){
  const hoje = dataISOLocal(new Date());
  const prev = diaUtilAnterior(dlData);
  const longo = new Date(dlData+"T00:00:00").toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long"});
  // tira com os últimos dias úteis
  let cur = ehFimDeSemanaISO(hoje) ? diaUtilAnterior(hoje) : hoje;
  const dias = [];
  for(let i=0;i<7;i++){ dias.unshift(cur); cur = diaUtilAnterior(cur); }
  if(!dias.includes(dlData)){ dias.push(dlData); dias.sort(); }
  const pills = dias.map(d=>{
    const dt = new Date(d+"T00:00:00");
    const n = dlContagem[d]||0;
    return `<button type="button" class="dl-pill ${d===dlData?"sel":""}" onclick="dlIr('${d}')"><span>${dt.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","")}</span><b>${formatarDataBR(d).slice(0,5)}</b><em>${n?(n===1?"1 item":n+" itens"):""}</em></button>`;
  }).join("");
  document.getElementById("dl-nav").innerHTML = `
    <button type="button" class="dl-nav-btn" title="Dia útil anterior" onclick="dlIrAnterior()">‹</button>
    <button type="button" class="dl-nav-btn" title="Próximo dia útil" onclick="dlIrSeguinte()">›</button>
    <div class="dl-dia-tit"><b>${longo}</b><span>${dlData===hoje?"Daily de hoje":"Daily de "+formatarDataBR(dlData)} · dia anterior: ${rotuloDiaCurtoDaily(prev)}</span></div>
    <input type="date" value="${dlData}" onchange="dlIr(this.value)" title="Ir para uma data">
    ${dlData!==hoje?`<button type="button" class="dl-hoje" onclick="dlIrHoje()">Hoje</button>`:""}
    <div class="dl-tira">${pills}</div>`;
}
function usuariosDaily(){
  return usuariosAtivosOrdenados().filter(u=>(u.modulos||[]).includes("reunioes"));
}
function renderDailyPresencas(){
  const us = usuariosDaily();
  document.getElementById("dl-pres").innerHTML = `<span class="dl-pres-tit">Presentes ${dlPresencas.length}/${us.length}</span>` +
    us.map(u=>`<button type="button" class="${dlPresencas.includes(u.id)?"on":""}" onclick="dlTogglePresenca('${u.id}')">${avatarMini(u.nome)}${escHtml(u.nome.split(" ")[0])}</button>`).join("");
}
async function dlTogglePresenca(uid){
  const dia = dlData;
  if(dlPresencas.includes(uid)){
    const { error } = await sb.from("dailys_presencas").delete().eq("data", dia).eq("usuario_id", uid);
    if(error){ alert("Erro ao atualizar a presença: "+error.message); return; }
    dlPresencas = dlPresencas.filter(x=>x!==uid);
  } else {
    const { error } = await sb.from("dailys_presencas").insert({data:dia, usuario_id:uid});
    if(error){ alert("Erro ao atualizar a presença: "+error.message); return; }
    dlPresencas.push(uid);
  }
  if(dia===dlData){ renderDailyPresencas(); renderDailyRodape(); }
}
function opcoesUsuariosDaily(rotulo){
  return `<option value="">${rotulo}</option>` + usuariosAtivosOrdenados().map(u=>`<option value="${u.id}">${escHtml(u.nome)}</option>`).join("");
}
function opcoesDemandasDaily(){
  const ativas = DEMANDAS.filter(d=>!demandaConcluida(d) && !d.entregueEm).slice().sort((a,b)=>b.id-a.id);
  return '<option value="">Demanda relacionada (opcional)</option>' + ativas.map(d=>`<option value="${d.id}">#${d.id} — ${escHtml(d.demanda.slice(0,55))}</option>`).join("");
}
function dlPodeApagar(i){ return ehAdminOuCoordenador() || (!!currentUser && i.criado_por===currentUser.id); }
function dlItemHtml(i){
  const dem = i.demanda_id ? DEMANDAS.find(d=>d.id===i.demanda_id) : null;
  const tags = [];
  if(dem) tags.push(`<span class="dl-tag dem" title="Abrir a demanda" onclick="abrirModalDemanda(${dem.id})">#${dem.id} · ${escHtml(dem.demanda.length>40 ? dem.demanda.slice(0,40)+"…" : dem.demanda)}</span>`);
  if(i.unidade) tags.push(`<span class="dl-tag">${escHtml(i.unidade)}</span>`);
  if(i.responsavel_id) tags.push(`<span class="dl-tag"><span class="av" style="background:${corAvatarPorNome(nomeUsuarioPorId(i.responsavel_id))};">${iniciaisTexto(nomeUsuarioPorId(i.responsavel_id))}</span>${i.secao==="bloqueio"?"destrava: ":""}${escHtml(nomeUsuarioPorId(i.responsavel_id))}</span>`);
  if(i.secao==="achado" || i.secao==="outro"){ if(i.criado_por) tags.push(`<span class="dl-tag">por ${escHtml(nomeUsuarioPorId(i.criado_por).split(" ")[0])}</span>`); }
  const comCheck = i.secao==="prioridade" || i.secao==="bloqueio";
  return `<div class="dl-item ${i.feito?"feito":""}">
    ${comCheck?`<input type="checkbox" ${i.feito?"checked":""} onchange="dlMarcar(${i.id}, this.checked)" title="${i.secao==="bloqueio"?"Destravada":"Concluída"}">`:""}
    <div class="tx">${escHtml(i.texto)}${tags.length?`<div class="meta">${tags.join("")}</div>`:""}</div>
    ${dlPodeApagar(i)?`<button type="button" class="rn-x" title="Remover" onclick="dlRemover(${i.id})">×</button>`:""}
  </div>`;
}
function demandasTravadasDaily(){
  const hoje = dataISOLocal(new Date());
  const ja = new Set(dlItensDoDia("bloqueio").map(i=>i.demanda_id).filter(Boolean));
  return DEMANDAS.filter(d=>!demandaConcluida(d) && !d.entregueEm && !ja.has(d.id)).map(d=>{
    const motivos = []; let peso = 0;
    if(d.dataLimite && d.dataLimite<hoje){ const n = diasEntreISO(d.dataLimite, hoje); motivos.push("Atrasada há "+n+" dia"+(n===1?"":"s")); peso += 100+n; }
    if(d.aguardandoItem || d.aguardandoResponsavel){
      motivos.push("Aguardando "+[d.aguardandoItem, d.aguardandoResponsavel?"("+d.aguardandoResponsavel+")":""].filter(Boolean).join(" "));
      peso += 50;
    }
    return {d, motivos, peso};
  }).filter(x=>x.motivos.length).sort((a,b)=>b.peso-a.peso);
}
function renderDailySecao(secao){
  const el = document.getElementById("dl-card-"+secao);
  if(!el) return;
  const cfg = DL_SECOES[secao];
  const itens = dlItensDoDia(secao);
  const prev = diaUtilAnterior(dlData);
  let extra = "";
  let add = "";
  if(secao==="prioridade"){
    const pend = dlItens.filter(i=>i.data===prev && i.secao==="prioridade" && !i.feito && !itens.some(x=>x.texto===i.texto && x.demanda_id===i.demanda_id));
    if(pend.length) extra = `<div class="dl-banner">↻ ${pend.length} prioridade${pend.length===1?"":"s"} de ${rotuloDiaCurtoDaily(prev)} ficou${pend.length===1?"":"ram"} pendente${pend.length===1?"":"s"}.<button type="button" onclick="dlTrazerPendentes()">Trazer para hoje</button></div>`;
    add = `<div class="dl-add"><input type="text" id="dl-in-prioridade-tx" maxlength="300" placeholder="Qual é a prioridade?" onkeydown="if(event.key==='Enter'){event.preventDefault();dlAdicionar('prioridade');}">
      <select id="dl-in-prioridade-resp">${opcoesUsuariosDaily("Responsável")}</select><select id="dl-in-prioridade-dem">${opcoesDemandasDaily()}</select>
      <button type="button" onclick="dlAdicionar('prioridade')">Adicionar</button></div>`;
  } else if(secao==="achado"){
    add = `<div class="dl-add"><input type="text" id="dl-in-achado-tx" maxlength="400" placeholder="O que foi encontrado?" onkeydown="if(event.key==='Enter'){event.preventDefault();dlAdicionar('achado');}">
      <select id="dl-in-achado-un"><option value="">Unidade (opcional)</option>${UNIDADES.map(u=>`<option>${escHtml(u.nome)}</option>`).join("")}</select>
      <button type="button" onclick="dlAdicionar('achado')">Adicionar</button></div>`;
  } else if(secao==="bloqueio"){
    const sug = demandasTravadasDaily();
    if(sug.length){
      const vis = dlVerTodasSug ? sug : sug.slice(0,4);
      extra = `<div class="dl-sug"><div class="dl-sug-tit">Sugeridas pelo sistema (${sug.length})</div>` + vis.map(x=>`
        <div class="dl-sug-lin"><div class="tx"><b>#${x.d.id} · ${escHtml(x.d.demanda)}</b><span style="color:var(--areia-esc);">${escHtml(x.motivos.join(" · "))}${x.d.responsavel?" · "+escHtml(x.d.responsavel):""}</span></div>
        <button type="button" onclick="dlLevarBloqueio(${x.d.id})">Levar para a daily</button></div>`).join("") +
        (sug.length>4 ? `<button type="button" class="dm-btn-ghost" style="margin-top:8px; font-size:11.5px; padding:5px 10px;" onclick="dlVerTodasSug=!dlVerTodasSug; renderDailySecao('bloqueio');">${dlVerTodasSug?"Mostrar menos":"Ver todas ("+sug.length+")"}</button>` : "") + `</div>`;
    }
    add = `<div class="dl-add"><select id="dl-in-bloqueio-dem">${opcoesDemandasDaily()}</select>
      <input type="text" id="dl-in-bloqueio-tx" maxlength="300" placeholder="O que está travando?" onkeydown="if(event.key==='Enter'){event.preventDefault();dlAdicionar('bloqueio');}">
      <select id="dl-in-bloqueio-resp">${opcoesUsuariosDaily("Quem destrava")}</select>
      <button type="button" onclick="dlAdicionar('bloqueio')">Adicionar</button></div>`;
  } else {
    add = `<div class="dl-add"><input type="text" id="dl-in-outro-tx" maxlength="400" placeholder="Aviso ou assunto" onkeydown="if(event.key==='Enter'){event.preventDefault();dlAdicionar('outro');}"><button type="button" onclick="dlAdicionar('outro')">Adicionar</button></div>`;
  }
  const vazio = {prioridade:"Nenhuma prioridade definida para hoje.", achado:"Nenhum achado registrado.", bloqueio:"Nenhuma demanda travada registrada.", outro:"Nenhum aviso registrado."}[secao];
  el.innerHTML = `<div class="dl-card-cab"><span class="ic">${cfg.ic}</span><h4>${cfg.tit}</h4><span class="n">${itens.length}</span></div>
    <p class="dl-dica">${cfg.dica}</p>${extra}
    <div class="dl-itens">${itens.length ? itens.map(dlItemHtml).join("") : `<div class="dl-vazio">${vazio}</div>`}</div>${add}`;
}
async function dlInserir(obj){
  const { data, error } = await sb.from("dailys_itens").insert({data:dlData, ...obj}).select().single();
  if(error){ alert("Erro ao salvar o item da daily: "+error.message); return null; }
  dlItens.push(data);
  dlContagem[dlData] = (dlContagem[dlData]||0)+1;
  return data;
}
async function dlAdicionar(secao){
  const v = id=>{ const el = document.getElementById(id); return el ? el.value : ""; };
  const texto = v("dl-in-"+secao+"-tx").trim();
  const demId = v("dl-in-"+secao+"-dem");
  const dem = demId ? DEMANDAS.find(d=>d.id===Number(demId)) : null;
  if(!texto && !(secao==="prioridade" && dem)){ alert("Escreva o texto do item."); return; }
  const obj = {secao, texto: texto || (dem ? dem.demanda : ""), demanda_id: dem ? dem.id : null};
  if(secao==="prioridade" || secao==="bloqueio") obj.responsavel_id = v("dl-in-"+secao+"-resp") || null;
  if(secao==="achado") obj.unidade = v("dl-in-achado-un");
  const ok = await dlInserir(obj);
  if(!ok) return;
  renderDailySecao(secao); renderDailyRodape(); renderDailyNav();
}
async function dlTrazerPendentes(){
  const prev = diaUtilAnterior(dlData);
  const hoje = dlItensDoDia("prioridade");
  const pend = dlItens.filter(i=>i.data===prev && i.secao==="prioridade" && !i.feito && !hoje.some(x=>x.texto===i.texto && x.demanda_id===i.demanda_id));
  if(!pend.length) return;
  const rows = pend.map(i=>({data:dlData, secao:"prioridade", texto:i.texto, demanda_id:i.demanda_id, responsavel_id:i.responsavel_id, unidade:i.unidade||""}));
  const { data, error } = await sb.from("dailys_itens").insert(rows).select();
  if(error){ alert("Erro ao trazer as pendências: "+error.message); return; }
  dlItens.push(...(data||[]));
  dlContagem[dlData] = (dlContagem[dlData]||0)+(data||[]).length;
  renderDailySecao("prioridade"); renderDailyRodape(); renderDailyNav();
}
async function dlLevarBloqueio(demandaId){
  const x = demandasTravadasDaily().find(s=>s.d.id===demandaId);
  if(!x) return;
  const ok = await dlInserir({secao:"bloqueio", texto:x.motivos.join(" · "), demanda_id:x.d.id, responsavel_id:x.d.responsavelUsuarioId||null});
  if(!ok) return;
  renderDailySecao("bloqueio"); renderDailyRodape(); renderDailyNav();
}
async function dlMarcar(id, feito){
  const i = dlItens.find(x=>x.id===id);
  if(!i) return;
  const { error } = await sb.from("dailys_itens").update({feito}).eq("id", id);
  if(error){ alert("Erro ao atualizar o item: "+error.message); renderDailySecao(i.secao); return; }
  i.feito = feito;
  renderDailySecao(i.secao); renderDailyRodape();
}
async function dlRemover(id){
  const i = dlItens.find(x=>x.id===id);
  if(!i || !confirm("Remover este item da daily?")) return;
  const { error } = await sb.from("dailys_itens").delete().eq("id", id);
  if(error){ alert("Erro ao remover o item: "+error.message); return; }
  dlItens = dlItens.filter(x=>x.id!==id);
  if(i.data===dlData) dlContagem[dlData] = Math.max(0,(dlContagem[dlData]||1)-1);
  renderDailySecao(i.secao); renderDailyRodape(); renderDailyNav();
}
function renderDailyRodape(){
  const p = dlItensDoDia("prioridade"), b = dlItensDoDia("bloqueio");
  const el = document.getElementById("dl-rodape");
  el.innerHTML = `<span><b>${p.length}</b> prioridade${p.length===1?"":"s"} (${p.filter(i=>i.feito).length} concluída${p.filter(i=>i.feito).length===1?"":"s"})</span>
    <span>· <b>${dlItensDoDia("achado").length}</b> achado${dlItensDoDia("achado").length===1?"":"s"}</span>
    <span>· <b>${b.length}</b> demanda${b.length===1?"":"s"} travada${b.length===1?"":"s"} (${b.filter(i=>i.feito).length} destravada${b.filter(i=>i.feito).length===1?"":"s"})</span>
    <span>· <b>${dlPresencas.length}</b> presente${dlPresencas.length===1?"":"s"}</span>
    <button type="button" class="btn-secondary" onclick="copiarResumoDaily()">Copiar resumo da daily</button>`;
}
function resumoDailyTexto(){
  const longo = new Date(dlData+"T00:00:00").toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long", year:"numeric"});
  const lin = [];
  lin.push("DAILY — "+longo);
  if(dlPresencas.length) lin.push("Presentes: "+dlPresencas.map(nomeUsuarioPorId).join(", "));
  const sec = (tit, secao, fmt)=>{
    const its = dlItensDoDia(secao);
    lin.push("", tit+":");
    if(!its.length) lin.push("  (nada registrado)");
    its.forEach(i=>lin.push("  "+fmt(i)));
  };
  const dem = i=>{ const d = i.demanda_id ? DEMANDAS.find(x=>x.id===i.demanda_id) : null; return d ? " [#"+d.id+" "+d.demanda.slice(0,50)+"]" : ""; };
  sec("Prioridades do dia","prioridade", i=>(i.feito?"[x] ":"[ ] ")+i.texto+dem(i)+(i.responsavel_id?" — "+nomeUsuarioPorId(i.responsavel_id):""));
  sec("Achados do dia anterior","achado", i=>"- "+i.texto+(i.unidade?" ("+i.unidade+")":""));
  sec("Demandas travadas","bloqueio", i=>(i.feito?"[destravada] ":"- ")+i.texto+dem(i)+(i.responsavel_id?" — destrava: "+nomeUsuarioPorId(i.responsavel_id):""));
  sec("Outros assuntos","outro", i=>"- "+i.texto);
  return lin.join("\n");
}
async function copiarResumoDaily(){
  const txt = resumoDailyTexto();
  try{
    if(navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(txt);
    else throw new Error("sem clipboard");
    mostrarToast("Resumo da daily copiado.");
  }catch(e){
    const ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); mostrarToast("Resumo da daily copiado."); }catch(_){ prompt("Copie o resumo:", txt); }
    document.body.removeChild(ta);
  }
}

