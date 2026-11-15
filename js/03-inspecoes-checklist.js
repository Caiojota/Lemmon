/* =====================================================================
   INSPEÇÕES DE SEGURANÇA — checklist geral e plano de ação (GUT), ocorrências, pendências e PDF
   ===================================================================== */

// Preenche: popular selects unidade
function popularSelectsUnidade(){
  ["insp-unidade-select","pend-unidade-select"].forEach(id=>{
    const sel = document.getElementById(id);
    if(!sel) return;
    const atual = sel.value;
    sel.innerHTML = '<option value="">'+(id==="pend-unidade-select"?"Selecione uma unidade...":"Selecione...")+'</option>';
    UNIDADES.forEach(u=>{ const o=document.createElement("option"); o.value=u.nome; o.textContent=u.nome; sel.appendChild(o); });
    sel.value = atual || "";
  });
}

// Inicializa: init inspecoes legacy
function initInspecoesLegacy(){
  popularSelectsUnidade();
  const campoPicker = document.getElementById("insp-data-picker");
  if(campoPicker && !campoPicker.value){ campoPicker.valueAsDate = new Date(); }
  if(currentUser){
    document.getElementById("insp-tecnico-nome").textContent = currentUser.nome;
    document.getElementById("insp-tecnico-registro").textContent = currentUser.registro || "sem registro cadastrado";
    document.getElementById("insp-tecnico-cargo").textContent = currentUser.cargo || "sem cargo cadastrado";
  }
  if(inspecaoAtiva){
    document.getElementById("insp-picker-unidade").style.display = "none";
    document.getElementById("insp-form-ativo").style.display = "block";
  } else {
    document.getElementById("insp-picker-unidade").style.display = "block";
    document.getElementById("insp-form-ativo").style.display = "none";
  }
  atualizarStatusAssinatura();
  renderChecklistGeral();
  renderItensInspecao();
  renderOcorrencias();
  renderPendencias();
  renderHistoricoInspecoes();
}

// Troca para a sub-tela: mostrar sub inspecao
function mostrarSubInspecao(sub){
  document.querySelectorAll("#view-inspecoes .insp-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('#view-inspecoes .insp-tab[data-sub="'+sub+'"]').classList.add("active");
  document.querySelectorAll("#view-inspecoes .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("insp-sub-"+sub).classList.add("active");
  if(sub==="pendencias") renderPendencias();
  if(sub==="historico") renderHistoricoInspecoes();
}

// Troca para a sub-tela: mostrar sub gestao
function mostrarSubGestao(sub){
  document.querySelectorAll("#view-gestao .insp-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('#view-gestao .insp-tab[data-sub="'+sub+'"]').classList.add("active");
  document.querySelectorAll("#view-gestao .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("gestao-sub-"+sub).classList.add("active");
  if(sub==="usuarios") renderUsuarios();
  if(sub==="unidades") renderUnidades();
  if(sub==="estrutura") renderEstrutura();
  if(sub==="auditoria") renderAuditoria();
  if(sub==="demandas"){ renderOpcoesDemandas(); renderFluxosConfig(); renderTiposDemandaConfig(); }
  if(sub==="agenda") renderMotivosAgendaGestao();
  if(sub==="disponibilidade"){ renderDisponibilidadeUsuarios(); renderGradeDisponibilidade(); }
  if(sub==="checklist"){ renderGruposChecklist(); renderItensChecklistConfig(); renderTiposOcorrenciaGestao(); vistGestaoInit(); }
  if(sub==="epi") initGestaoEpi();
  if(sub==="epifuncao") initEpiFuncao();
  if(sub==="absenteismo") initGestaoAbsenteismo();
}

// Inicializa: init gestao
function initGestao(){
  renderUsuarios();
  renderUnidades();
  renderEstrutura();
  renderAuditoria();
}

// Função do módulo: iniciar nova inspecao
/* ---- Iniciar / cancelar inspeção ---- */
async function iniciarNovaInspecao(){
  const unidade = document.getElementById("insp-unidade-select").value;
  if(!unidade){ alert("Selecione uma unidade para iniciar a inspeção."); return; }
  const dataEscolhida = document.getElementById("insp-data-picker").value || new Date().toISOString().slice(0,10);

  const statusEl = document.getElementById("insp-picker-geo-status");
  const btn = document.getElementById("btn-iniciar-inspecao");
  if(btn) btn.disabled = true;
  if(statusEl){ statusEl.style.color = "var(--areia-esc)"; statusEl.textContent = "📍 Obtendo sua localização — é obrigatória para iniciar a inspeção..."; }

  let geo;
  try{
    geo = await capturarGeolocalizacaoObrigatoria();
  }catch(e){
    if(statusEl){ statusEl.style.color = "var(--vermelho)"; statusEl.textContent = "⚠ "+e.message+" Não é possível iniciar a inspeção sem a localização."; }
    if(btn) btn.disabled = false;
    return;
  }

  inspecaoAtiva = {
    unidade,
    inicioHora: new Date().toLocaleString("pt-BR", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}),
    geoInicio: geo
  };
  document.getElementById("insp-unidade").value = unidade;
  document.getElementById("insp-data").value = dataEscolhida;
  document.getElementById("insp-picker-unidade").style.display = "none";
  document.getElementById("insp-form-ativo").style.display = "block";
  montarChecklistGeral();
  renderChecklistGeral();
  itensInspecaoAtual = [];
  renderItensInspecao();
  ocorrenciasAtual = [];
  popularTiposOcorrencia();
  renderOcorrencias();
  atualizarStatusAssinatura();

  const boxForm = document.getElementById("insp-geo-status");
  if(boxForm) boxForm.textContent = "📍 Localização capturada (precisão de "+geo.precisao+"m) às "+inspecaoAtiva.inicioHora;
  if(statusEl){ statusEl.textContent = ""; }
  if(btn) btn.disabled = false;
}

// Remove/cancela: cancelar inspecao atual
function cancelarInspecaoAtual(){
  if(!confirm("Cancelar esta inspeção? Os dados preenchidos (ainda não gerados em PDF) serão perdidos.")) return;
  inspecaoAtiva = null;
  document.getElementById("insp-form-ativo").style.display = "none";
  document.getElementById("insp-picker-unidade").style.display = "block";
}

// Função do módulo: classificar gut
/* ---- Classificação da Matriz GUT ---- */
function classificarGUT(score){
  if(score>=80) return {classe:"alto", label:"Alto Risco"};
  if(score>=40) return {classe:"medio", label:"Risco Médio"};
  if(score>=20) return {classe:"baixo", label:"Baixo Risco"};
  return {classe:"obs", label:"Observação"};
}

// Define o rótulo/cor visual de status de: tag gut
function tagGUT(score){
  const c = classificarGUT(score);
  return `<span class="tag-gut ${c.classe}">${c.label} (${score})</span>`;
}

// Define o rótulo/cor visual de status de: classe status
function classeStatus(status){
  return status==="Notificado" ? "notificado"
       : status==="Não iniciado" ? "naoiniciado"
       : status==="Em Andamento" ? "andamento"
       : "concluido";
}

// Define o rótulo/cor visual de status de: tag status
function tagStatus(status){
  return `<span class="tag-status ${classeStatus(status)}">${status}</span>`;
}

// Função do módulo: montar checklist geral
/* ---- Parte 1: checklist geral da loja ---- */
function montarChecklistGeral(){
  checklistGeralAtual = CHECKLIST_ITENS_CONFIG.slice().sort((a,b)=>a.ordem-b.ordem).map(cfg=>({
    id: cfg.id, itemConfigId: cfg.id, grupoId: cfg.grupoId,
    titulo: cfg.titulo, descricao: cfg.descricao, requerEvidencia: cfg.requerEvidencia,
    status: null, foto: null
  }));
}

// Desenha na tela: render checklist geral
function renderChecklistGeral(){
  const wrap = document.getElementById("insp-checklist-geral");
  if(!wrap) return;
  if(!checklistGeralAtual.length){
    wrap.innerHTML = '<div class="card"><span class="sub">Nenhum item de checklist configurado ainda. Cadastre grupos e itens em Gestão › Checklist de Inspeção.</span></div>';
    return;
  }
  const gruposOrdenados = CHECKLIST_GRUPOS.slice().sort((a,b)=>a.ordem-b.ordem);
  wrap.innerHTML = gruposOrdenados.map(g=>{
    const itensDoGrupo = checklistGeralAtual.filter(it=>it.grupoId===g.id);
    if(!itensDoGrupo.length) return "";
    return `<div class="checklist-grupo-titulo">${g.nome}</div>` + itensDoGrupo.map(item=>{
      const precisaFoto = item.requerEvidencia && (item.status==='PC' || item.status==='NC');
      const fotoFaltando = precisaFoto && !item.foto;
      return `
      <div class="insp-item ${fotoFaltando?'insp-item-alerta':''}" data-id="${item.id}">
        <div class="insp-item-txt">${item.titulo}${item.descricao?`<br><span class="insp-item-desc">${item.descricao}</span>`:""}</div>
        <div class="insp-item-status">
          <button type="button" class="st-btn st-conforme ${item.status==='C'?'active':''}" onclick="setStatusChecklistGeral(${item.id},'C')">C</button>
          <button type="button" class="st-btn st-pc ${item.status==='PC'?'active':''}" onclick="setStatusChecklistGeral(${item.id},'PC')">PC</button>
          <button type="button" class="st-btn st-nao ${item.status==='NC'?'active':''}" onclick="setStatusChecklistGeral(${item.id},'NC')">NC</button>
          <button type="button" class="st-btn st-na ${item.status==='NA'?'active':''}" onclick="setStatusChecklistGeral(${item.id},'NA')">N/A</button>
        </div>
        <div class="insp-item-foto">
          ${item.foto
            ? `<img src="${item.foto}" class="insp-thumb" onclick="removerFotoChecklistGeral(${item.id})" title="Clique para remover a evidência">`
            : `<label class="foto-btn ${fotoFaltando?'foto-btn-obrigatoria':''}"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:-2px;"><path d="M9 3h6l1.2 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.8L9 3Zm3 5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg> Evidência${item.requerEvidencia?" *":""}<input type="file" accept="image/*" capture="environment" onchange="onFotoChecklistGeralChange(${item.id}, this)" hidden></label>`
          }
          ${fotoFaltando ? '<span class="insp-item-aviso">Evidência obrigatória</span>' : ""}
        </div>
      </div>`;
    }).join("");
  }).join("");
}

// Função do módulo: checklist tem evidencias pendentes
function checklistTemEvidenciasPendentes(){
  return checklistGeralAtual.some(item=> item.requerEvidencia && (item.status==='PC'||item.status==='NC') && !item.foto);
}

// Função do módulo: set status checklist geral
function setStatusChecklistGeral(id, status){
  const it = checklistGeralAtual.find(i=>i.id===id);
  if(it) it.status = status;
  renderChecklistGeral();
}

// Reage ao evento:: on foto checklist geral change
function onFotoChecklistGeralChange(id, input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    const it = checklistGeralAtual.find(i=>i.id===id);
    if(it){ it.foto = e.target.result; renderChecklistGeral(); }
  };
  reader.readAsDataURL(file);
}

// Remove/cancela: remover foto checklist geral
function removerFotoChecklistGeral(id){
  const it = checklistGeralAtual.find(i=>i.id===id);
  if(it){ it.foto = null; renderChecklistGeral(); }
}

// Abre: abrir modal item inspecao
/* ---- Parte 2: plano de ação (não conformidades) ---- */
function abrirModalItemInspecao(){
  if(!inspecaoAtiva){ alert("Inicie uma inspeção primeiro."); return; }
  document.getElementById("form-item-inspecao").reset();
  document.getElementById("it-prazo").value = 15;
  fotoItemTemp = null;
  document.getElementById("it-foto-area").innerHTML = '<label class="foto-btn" style="display:inline-block; width:auto;"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:-2px;"><path d="M9 3h6l1.2 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.8L9 3Zm3 5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg> Tirar foto / anexar<input type="file" accept="image/*" capture="environment" onchange="onFotoItemModalChange(this)" hidden></label>';
  atualizarPreviewDataLimite();
  atualizarPreviewGUT();
  document.getElementById("modal-item-inspecao").style.display = "flex";
}

// Fecha: fechar modal item inspecao
function fecharModalItemInspecao(){
  document.getElementById("modal-item-inspecao").style.display = "none";
}

// Atualiza: atualizar preview data limite
function atualizarPreviewDataLimite(){
  const dataStr = document.getElementById("insp-data").value || new Date().toISOString().slice(0,10);
  const prazo = Number(document.getElementById("it-prazo").value)||0;
  const d = new Date(dataStr+"T00:00:00");
  d.setDate(d.getDate()+prazo);
  document.getElementById("it-data-limite-preview").value = d.toLocaleDateString("pt-BR");
}

// Atualiza: atualizar preview gut
function atualizarPreviewGUT(){
  const g = Number(document.getElementById("it-g").value);
  const u = Number(document.getElementById("it-u").value);
  const t = Number(document.getElementById("it-t").value);
  document.getElementById("gut-preview").innerHTML = tagGUT(g*u*t);
}

// Reage ao evento:: on foto item modal change
function onFotoItemModalChange(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    fotoItemTemp = e.target.result;
    document.getElementById("it-foto-area").innerHTML = `<img src="${fotoItemTemp}" class="insp-thumb" title="Foto anexada">`;
  };
  reader.readAsDataURL(file);
}

// Função do módulo: adicionar item inspecao
function adicionarItemInspecao(ev){
  ev.preventDefault();
  const dataStr = document.getElementById("insp-data").value || new Date().toISOString().slice(0,10);
  const prazo = Number(document.getElementById("it-prazo").value)||0;
  const dataLimite = new Date(dataStr+"T00:00:00");
  dataLimite.setDate(dataLimite.getDate()+prazo);

  const g = Number(document.getElementById("it-g").value);
  const u = Number(document.getElementById("it-u").value);
  const t = Number(document.getElementById("it-t").value);
  const score = g*u*t;

  itensInspecaoAtual.push({
    numero: proxNumeroItem++,
    categoria: document.getElementById("it-categoria").value,
    local: document.getElementById("it-local").value.trim(),
    risco: document.getElementById("it-risco").value.trim(),
    riscoExposto: document.getElementById("it-risco-exposto").value.trim(),
    solucao: document.getElementById("it-solucao").value.trim(),
    prazoDias: prazo,
    dataLimite: dataLimite.toISOString().slice(0,10),
    gut: {g,u,t,score, ...classificarGUT(score)},
    status: document.getElementById("it-status").value,
    foto: fotoItemTemp
  });
  fecharModalItemInspecao();
  renderItensInspecao();
  mostrarToast("Item nº "+(proxNumeroItem-1)+" adicionado.");
  return false;
}

// Remove/cancela: remover item atual
function removerItemAtual(numero){
  if(!confirm("Remover este item da inspeção atual?")) return;
  itensInspecaoAtual = itensInspecaoAtual.filter(i=>i.numero!==numero);
  renderItensInspecao();
}

// Atualiza: atualizar status item atual
function atualizarStatusItemAtual(numero, status){
  const it = itensInspecaoAtual.find(i=>i.numero===numero);
  if(it) it.status = status;
  renderItensInspecao();
}

// Desenha na tela: render itens inspecao
function renderItensInspecao(){
  const tbody = document.getElementById("tbl-itens-insp-atual");
  if(!tbody) return;
  if(!itensInspecaoAtual.length){
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; color:var(--areia-esc);">Nenhum item adicionado ainda. Clique em "+ Adicionar item".</td></tr>';
    return;
  }
  tbody.innerHTML = itensInspecaoAtual.map(it=>`
    <tr>
      <td><b>${it.numero}</b></td>
      <td>${it.categoria}</td>
      <td>${it.local}</td>
      <td>${it.risco}</td>
      <td>${it.riscoExposto||"—"}</td>
      <td>${it.solucao||"—"}</td>
      <td>${it.prazoDias} dia(s)</td>
      <td>${it.dataLimite.split("-").reverse().join("/")}</td>
      <td>${tagGUT(it.gut.score)}</td>
      <td>${it.foto? `<img src="${it.foto}" class="insp-thumb">` : "—"}</td>
      <td>
        <select onchange="atualizarStatusItemAtual(${it.numero}, this.value)">
          <option ${it.status==="Notificado"?"selected":""}>Notificado</option>
          <option ${it.status==="Não iniciado"?"selected":""}>Não iniciado</option>
          <option ${it.status==="Em Andamento"?"selected":""}>Em Andamento</option>
          <option ${it.status==="Concluído"?"selected":""}>Concluído</option>
        </select>
      </td>
      <td><button type="button" class="small-btn" onclick="removerItemAtual(${it.numero})">Remover</button></td>
    </tr>
  `).join("");
}

// Preenche: popular tipos ocorrencia
/* ---- Parte 3: ocorrências ---- */
function popularTiposOcorrencia(){
  const sel = document.getElementById("oc-tipo");
  if(!sel) return;
  sel.innerHTML = OCORRENCIAS_TIPOS.length
    ? OCORRENCIAS_TIPOS.slice().sort((a,b)=>a.ordem-b.ordem).map(t=>`<option>${t.valor}</option>`).join("")
    : '<option value="">Nenhum tipo cadastrado</option>';
}

// Função do módulo: adicionar ocorrencia
function adicionarOcorrencia(){
  const input = document.getElementById("nova-ocorrencia-texto");
  const texto = input.value.trim();
  if(!texto){ alert("Descreva a ocorrência antes de adicionar."); return; }
  ocorrenciasAtual.push({
    texto,
    hora: new Date().toLocaleString("pt-BR"),
    tipo: document.getElementById("oc-tipo").value || "",
    colaborador: document.getElementById("oc-colaborador").value.trim(),
    acao: document.getElementById("oc-acao").value.trim()
  });
  input.value = "";
  document.getElementById("oc-colaborador").value = "";
  document.getElementById("oc-acao").value = "";
  renderOcorrencias();
}

// Remove/cancela: remover ocorrencia
function removerOcorrencia(idx){
  ocorrenciasAtual.splice(idx,1);
  renderOcorrencias();
}

// Desenha na tela: render ocorrencias
function renderOcorrencias(){
  const wrap = document.getElementById("lista-ocorrencias");
  if(!wrap) return;
  if(!ocorrenciasAtual.length){
    wrap.innerHTML = '<span class="sub">Nenhuma ocorrência registrada nesta inspeção.</span>';
    return;
  }
  wrap.innerHTML = ocorrenciasAtual.map((o,idx)=>`
    <div class="ocorrencia-card">
      <div class="oc-card-topo">
        <div>
          ${o.tipo?`<span class="td-badge" style="background:var(--terracota);">${o.tipo}</span>`:""}
          ${o.colaborador?`<span class="sub" style="margin-left:6px;">Colaborador: <b style="color:var(--marrom-esc);">${o.colaborador}</b></span>`:""}
        </div>
        <button type="button" class="small-btn danger" onclick="removerOcorrencia(${idx})">Remover</button>
      </div>
      <div class="oc-card-texto">${o.texto}</div>
      ${o.acao?`<div class="oc-card-acao"><b>Ação realizada:</b> ${o.acao}</div>`:""}
      <span class="sub" style="font-size:10.5px;">${o.hora}</span>
    </div>
  `).join("");
}

// Atualiza: atualizar status assinatura
/* ---- Assinatura ---- */
function atualizarStatusAssinatura(){
  assinaturaConfirmada = false;
  assinaturaTimestamp = null;
  assinaturaGeo = null;
  const box = document.getElementById("assinatura-status-box");
  if(box){ box.textContent = "Relatório ainda não assinado."; box.classList.remove("ok"); }
}

// Função do módulo: assinar relatorio
async function assinarRelatorio(){
  if(!currentUser || !currentUser.assinatura){
    alert("Este usuário ainda não tem uma assinatura cadastrada. Peça para um administrador cadastrar em Gestão › Usuários.");
    return;
  }
  const box = document.getElementById("assinatura-status-box");
  box.classList.remove("ok");
  box.textContent = "📍 Obtendo localização — é obrigatória para assinar...";

  let geo;
  try{
    geo = await capturarGeolocalizacaoObrigatoria();
  }catch(e){
    box.textContent = "⚠ "+e.message+" Não é possível assinar sem a localização. Tente novamente.";
    return;
  }

  assinaturaGeo = geo;
  assinaturaTimestamp = new Date().toLocaleString("pt-BR", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  assinaturaConfirmada = true;
  box.textContent = "✓ Assinado por "+currentUser.nome+" em "+assinaturaTimestamp+" — 📍 "+geo.lat.toFixed(5)+", "+geo.lng.toFixed(5);
  box.classList.add("ok");
  mostrarToast("Relatório assinado.");
}

// Função do módulo: gerar relatorio inspecao
/* ---- Geração do relatório em PDF (sem IA), com capa dinâmica e 3 partes ---- */
async function gerarRelatorioInspecao(){
  if(!inspecaoAtiva){ alert("Inicie uma inspeção (escolhendo a unidade) antes de gerar o relatório."); return; }
  if(checklistTemEvidenciasPendentes()){
    alert("Há itens da Parte 1 marcados como PC ou NC que exigem evidência (foto) e ainda não têm uma anexada. Anexe as evidências indicadas em vermelho antes de gerar o relatório.");
    return;
  }

  const unidade = inspecaoAtiva.unidade;
  const unidadeInfo = unidadePorNome(unidade) || {};
  const dataStr = document.getElementById("insp-data").value || new Date().toISOString().slice(0,10);
  const dataFmt = dataStr.split("-").reverse().join("/");
  const tecnico = currentUser || {nome:"—", registro:"—", cargo:"—"};

  mostrarToast("Gerando relatório em PDF...");

  let lemonPng = null;
  try{ lemonPng = await svgParaPngDataUrl(LEMON_LOGO_SVG_BRANCO, 680, 220); }catch(e){ console.error("[PDF] Falha ao converter logo Lemon:", e); }

  const COR_VERDE = [0,81,44];
  const COR_VERDE_VIVO = [0,178,98];
  const COR_TERRA = [161,90,51];
  const COR_TEXTO = [40,30,20];
  const COR_MUTED = [140,120,95];

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"pt", format:"a4"});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  /* ============ CAPA ============ */
  doc.setFillColor(COR_VERDE[0],COR_VERDE[1],COR_VERDE[2]);
  doc.rect(0, 0, pageW, 260, "F");
  if(lemonPng){
    try{ doc.addImage(lemonPng, "PNG", 40, 40, 170, 55); }catch(e){}
  }
  try{ doc.addImage(HORTIFRUTI_LOGO_DATAURL, "PNG", pageW-150, 44, 110, 38); }catch(e){}

  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold"); doc.setFontSize(24);
  doc.text("Relatório de Inspeção", 40, 155);
  doc.text("de Segurança", 40, 185);
  doc.setFont("helvetica","normal"); doc.setFontSize(11);
  doc.text("SESMT — Hortifruti Natural da Terra", 40, 215);

  let cy = 300;
  doc.setTextColor(COR_MUTED[0],COR_MUTED[1],COR_MUTED[2]);
  doc.setFont("helvetica","bold"); doc.setFontSize(10.5);
  doc.text("UNIDADE INSPECIONADA", 40, cy); cy += 22;

  doc.setDrawColor(225,215,195);
  doc.roundedRect(40, cy-16, pageW-80, 190, 10, 10);
  cy += 14;

  function linhaCapa(label, valor){
    doc.setFont("helvetica","bold"); doc.setFontSize(9.5); doc.setTextColor(COR_MUTED[0],COR_MUTED[1],COR_MUTED[2]);
    doc.text(label.toUpperCase(), 60, cy);
    doc.setFont("helvetica","normal"); doc.setFontSize(12); doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
    doc.text(valor || "—", 60, cy+15);
    cy += 34;
  }
  linhaCapa("Nome da unidade", unidadeInfo.nome || unidade);
  linhaCapa("Endereço", unidadeInfo.endereco);
  linhaCapa("Praça / Regional", (unidadeInfo.praca||"—")+" — "+(unidadeInfo.regional||"—"));
  linhaCapa("Gerente regional", unidadeInfo.gerenteRegional);
  linhaCapa("Técnico responsável pela unidade", unidadeInfo.tecnicoResponsavel);

  cy += 20;
  doc.setDrawColor(210,195,165); doc.line(40, cy, pageW-40, cy); cy += 26;
  doc.setFont("helvetica","bold"); doc.setFontSize(10.5); doc.setTextColor(COR_MUTED[0],COR_MUTED[1],COR_MUTED[2]);
  doc.text("DADOS DO RELATÓRIO", 40, cy); cy += 20;
  doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
  doc.text("Data do relatório: "+dataFmt, 40, cy); cy += 16;
  doc.text("Realizado por: "+tecnico.nome+" — "+(tecnico.registro||"sem registro")+" — "+(tecnico.cargo||"—"), 40, cy); cy += 22;

  const totalNC = itensInspecaoAtual.length;
  const totalPend = itensInspecaoAtual.filter(i=>i.status!=="Concluído").length;
  const totalOcorrenciasCapa = ocorrenciasAtual.length;
  const boxW = (pageW-80-20)/3;
  function caixaEstatistica(x, valor, label, cor){
    doc.setFillColor(cor[0],cor[1],cor[2]);
    doc.roundedRect(x, cy, boxW, 56, 8, 8, "F");
    doc.setTextColor(255,255,255);
    doc.setFont("helvetica","bold"); doc.setFontSize(21);
    doc.text(String(valor), x+14, cy+30);
    doc.setFont("helvetica","normal"); doc.setFontSize(8.3);
    doc.text(label, x+14, cy+44, {maxWidth: boxW-24});
  }
  caixaEstatistica(40, totalNC, "Itens no plano de ação", COR_TERRA);
  caixaEstatistica(40+boxW+10, totalPend, "Pendentes de conclusão", [238,49,53]);
  caixaEstatistica(40+2*(boxW+10), totalOcorrenciasCapa, "Ocorrências registradas", COR_VERDE);
  doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);

  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(190,180,165);
  doc.text("Plataforma Lemon — documento gerado eletronicamente em "+new Date().toLocaleString("pt-BR"), 40, pageH-30);

  /* ============ PÁGINAS DE CONTEÚDO ============ */
  doc.addPage();
  let y = 50;

  function faixaSecao(titulo){
    if(y > pageH-110){ doc.addPage(); y = 50; }
    doc.setFillColor(COR_VERDE[0],COR_VERDE[1],COR_VERDE[2]);
    doc.roundedRect(40, y-20, pageW-80, 28, 6, 6, "F");
    doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(11.5);
    doc.text(titulo, 52, y-1);
    y += 26;
    doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
  }
  function pill(texto, x, yPos, cor){
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5);
    const w = doc.getTextWidth(texto)+14;
    doc.setFillColor(cor[0],cor[1],cor[2]);
    doc.roundedRect(x, yPos-10, w, 14, 7, 7, "F");
    doc.setTextColor(255,255,255);
    doc.text(texto, x+7, yPos);
    doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
    return w;
  }

  faixaSecao("PARTE 1 — CHECKLIST GERAL DA LOJA");
  const CORES_STATUS_CHECKLIST = {C:COR_VERDE_VIVO, PC:[250,166,26], NC:[238,49,53], NA:[159,129,103]};
  const ROTULOS_STATUS_CHECKLIST = {C:"Conforme", PC:"Parcialmente Conforme", NC:"Não Conforme", NA:"Não se Aplica"};
  const resumoStatus = {C:0,PC:0,NC:0,NA:0};
  checklistGeralAtual.forEach(it=>{ if(resumoStatus[it.status]!=null) resumoStatus[it.status]++; });
  doc.setFont("helvetica","normal"); doc.setFontSize(9.5);
  let xResumo = 40;
  Object.entries(resumoStatus).forEach(([k,v])=>{
    const texto = ROTULOS_STATUS_CHECKLIST[k]+": "+v;
    const w = pill(texto, xResumo, y, CORES_STATUS_CHECKLIST[k]);
    xResumo += w + 8;
  });
  y += 24;

  const gruposOrdenadosPdf = CHECKLIST_GRUPOS.slice().sort((a,b)=>a.ordem-b.ordem);
  gruposOrdenadosPdf.forEach(grupo=>{
    const itensDoGrupo = checklistGeralAtual.filter(it=>it.grupoId===grupo.id);
    if(!itensDoGrupo.length) return;
    if(y > pageH-90){ doc.addPage(); y = 50; }
    doc.setFillColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
    doc.roundedRect(40, y-14, pageW-80, 22, 5, 5, "F");
    doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(10);
    doc.text(grupo.nome.toUpperCase(), 50, y);
    y += 22;
    doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);

    itensDoGrupo.forEach((item)=>{
      const corStatus = CORES_STATUS_CHECKLIST[item.status] || [190,175,150];
      const linhasDesc = item.descricao ? doc.splitTextToSize(item.descricao, pageW-220) : [];
      const alturaTexto = 16 + linhasDesc.length*11;
      const alturaFoto = item.foto ? 66 : 0;
      const alturaCard = Math.max(alturaTexto, alturaFoto) + 16;
      if(y + alturaCard > pageH-60){ doc.addPage(); y = 50; }
      doc.setDrawColor(230,220,200); doc.setFillColor(253,251,246);
      doc.roundedRect(40, y-16, pageW-80, alturaCard, 6, 6, "FD");
      doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
      doc.text(item.titulo, 50, y, {maxWidth: pageW-220});
      let yDesc = y+13;
      doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(COR_MUTED[0],COR_MUTED[1],COR_MUTED[2]);
      linhasDesc.forEach(l=>{ doc.text(l, 50, yDesc, {maxWidth: pageW-220}); yDesc += 11; });
      doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
      pill(ROTULOS_STATUS_CHECKLIST[item.status] || "Não avaliado", pageW-190, y-4, corStatus);
      if(item.foto){
        const formato = item.foto.startsWith("data:image/png") ? "PNG" : "JPEG";
        try{ doc.addImage(item.foto, formato, 50, y+alturaTexto-4, 78, 56); }catch(e){}
      }
      y += alturaCard + 10;
    });
    y += 6;
  });
  y += 8;

  faixaSecao("PARTE 2 — PLANO DE AÇÃO (NÃO CONFORMIDADES)");
  if(!itensInspecaoAtual.length){
    doc.setFont("helvetica","normal"); doc.setFontSize(10);
    doc.text("Nenhum item de plano de ação registrado nesta inspeção.", 40, y); y+=18;
  }
  itensInspecaoAtual.forEach((item)=>{
    const linhasRisco = doc.splitTextToSize("Risco/Desvio: "+item.risco, pageW-260);
    const linhasSolucao = item.solucao ? doc.splitTextToSize("Solução proposta: "+item.solucao, pageW-260) : [];
    const alturaTexto = 34 + (linhasRisco.length+linhasSolucao.length)*11;
    const alturaFoto = item.foto ? 100 : 0;
    const alturaCard = Math.max(alturaTexto, alturaFoto+20) + 14;
    if(y + alturaCard > pageH-60){ doc.addPage(); y = 50; }

    const gcor = item.gut.classe==="alto"?[152,27,34]:item.gut.classe==="medio"?[161,90,51]:item.gut.classe==="baixo"?[0,178,98]:[159,129,103];
    doc.setFillColor(gcor[0],gcor[1],gcor[2]);
    doc.rect(40, y-16, 5, alturaCard, "F");
    doc.setDrawColor(230,220,200); doc.setFillColor(253,251,246);
    doc.roundedRect(45, y-16, pageW-125, alturaCard, 4, 4, "FD");

    let yc = y;
    doc.setFont("helvetica","bold"); doc.setFontSize(10.5); doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
    doc.text("Nº "+item.numero+" — "+item.local, 55, yc);
    pill(item.categoria, pageW-260, yc-4, COR_TERRA);
    yc += 16;
    doc.setFont("helvetica","normal"); doc.setFontSize(9.5);
    linhasRisco.forEach(l=>{ doc.text(l, 55, yc, {maxWidth: pageW-260}); yc+=11; });
    linhasSolucao.forEach(l=>{ doc.text(l, 55, yc, {maxWidth: pageW-260}); yc+=11; });
    doc.text("Prazo: "+item.prazoDias+" dia(s) — limite "+item.dataLimite.split("-").reverse().join("/"), 55, yc); yc+=14;
    pill(item.gut.label+" ("+item.gut.score+")", 55, yc, gcor);
    const scor = item.status==="Concluído"?[0,178,98]:item.status==="Em Andamento"?[249,157,51]:item.status==="Notificado"?[161,90,51]:[140,120,95];
    pill(item.status, 55+doc.getTextWidth(item.gut.label+" ("+item.gut.score+")")+30, yc, scor);

    if(item.foto){
      const formato = item.foto.startsWith("data:image/png") ? "PNG" : "JPEG";
      try{ doc.addImage(item.foto, formato, pageW-190, y-10, 130, 95); }catch(e){}
    }
    y += alturaCard + 14;
  });
  y += 8;

  faixaSecao("PARTE 3 — REGISTRO DE OCORRÊNCIAS");
  if(!ocorrenciasAtual.length){
    doc.setFont("helvetica","normal"); doc.setFontSize(10);
    doc.text("Nenhuma ocorrência registrada nesta inspeção.", 40, y); y+=18;
  }
  ocorrenciasAtual.forEach(o=>{
    const linhasTexto = doc.splitTextToSize(o.texto, pageW-100);
    const linhasAcao = o.acao ? doc.splitTextToSize("Ação realizada: "+o.acao, pageW-100) : [];
    const alturaCard = 22 + linhasTexto.length*11 + linhasAcao.length*11 + (o.acao?6:0);
    if(y + alturaCard > pageH-60){ doc.addPage(); y = 50; }
    doc.setFillColor(COR_TERRA[0],COR_TERRA[1],COR_TERRA[2]);
    doc.rect(40, y-16, 4, alturaCard, "F");
    doc.setDrawColor(230,220,200); doc.setFillColor(253,251,246);
    doc.roundedRect(44, y-16, pageW-84, alturaCard, 5, 5, "FD");

    let yo = y;
    if(o.tipo){ pill(o.tipo, 54, yo, COR_TERRA); }
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(COR_MUTED[0],COR_MUTED[1],COR_MUTED[2]);
    doc.text(o.hora, pageW-130, yo);
    if(o.colaborador){ doc.text("Colaborador: "+o.colaborador, o.tipo? 54+doc.getTextWidth(o.tipo)+30 : 54, yo); }
    yo += 16;
    doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
    linhasTexto.forEach(l=>{ doc.text(l, 54, yo, {maxWidth: pageW-100}); yo += 11; });
    if(o.acao){
      yo += 4;
      doc.setFont("helvetica","italic"); doc.setFontSize(8.5); doc.setTextColor(COR_MUTED[0],COR_MUTED[1],COR_MUTED[2]);
      linhasAcao.forEach(l=>{ doc.text(l, 54, yo, {maxWidth: pageW-100}); yo += 11; });
    }
    y += alturaCard + 12;
  });

  /* ============ BLOCO DE ASSINATURA ============ */
  if(y > pageH-160){ doc.addPage(); y = 50; }
  y += 10;
  doc.setDrawColor(COR_VERDE[0],COR_VERDE[1],COR_VERDE[2]);
  doc.setLineWidth(1.4); doc.line(40, y, pageW-40, y); doc.setLineWidth(1); y+=26;
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(COR_TEXTO[0],COR_TEXTO[1],COR_TEXTO[2]);
  doc.text("Responsável técnico pela inspeção", 40, y); y+=18;
  if(assinaturaConfirmada && tecnico.assinatura){
    try{
      const formato = tecnico.assinatura.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(tecnico.assinatura, formato, 40, y, 140, 50);
      y += 56;
    }catch(e){ y += 10; }
  } else {
    doc.setDrawColor(150,130,105); doc.line(40, y+30, 220, y+30);
    y += 40;
  }
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text(tecnico.nome, 40, y); y+=13;
  doc.text((tecnico.registro||"sem registro")+" — "+(tecnico.cargo||"—"), 40, y); y+=13;
  doc.text(assinaturaConfirmada ? "Assinado digitalmente em "+assinaturaTimestamp+"." : "Documento não assinado digitalmente.", 40, y); y+=13;
  if(assinaturaConfirmada){
    doc.text(assinaturaGeo ? "Localização da assinatura: "+assinaturaGeo.lat.toFixed(5)+", "+assinaturaGeo.lng.toFixed(5)+" (precisão ~"+assinaturaGeo.precisao+"m)" : "Localização da assinatura: não disponível", 40, y); y+=13;
  }
  if(inspecaoAtiva && inspecaoAtiva.geoInicio){
    doc.setFontSize(9); doc.setTextColor(140,120,95);
    doc.text("Inspeção iniciada em "+inspecaoAtiva.inicioHora+" — localização: "+inspecaoAtiva.geoInicio.lat.toFixed(5)+", "+inspecaoAtiva.geoInicio.lng.toFixed(5), 40, y);
  }

  const totalPaginasRelatorio = doc.internal.getNumberOfPages();
  for(let p=2; p<=totalPaginasRelatorio; p++){
    doc.setPage(p);
    doc.setDrawColor(225,215,195); doc.setLineWidth(0.6);
    doc.line(40, pageH-38, pageW-40, pageH-38);
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(COR_MUTED[0],COR_MUTED[1],COR_MUTED[2]);
    doc.text("Relatório de Inspeção de Segurança — "+unidade, 40, pageH-24);
    doc.text("Página "+(p-1)+" de "+(totalPaginasRelatorio-1), pageW-100, pageH-24);
  }

  const nomeArquivo = "inspecao_"+dataStr+"_"+unidade.replace(/[^a-zA-Z0-9]+/g,"_").slice(0,30)+".pdf";
  doc.save(nomeArquivo);

  await salvarInspecaoNoHistorico(unidade, dataStr, tecnico);
}

// Salva no banco: salvar inspecao no historico
async function salvarInspecaoNoHistorico(unidade, dataStr, tecnico){
  const { data: inspRow, error } = await sb.from("inspecoes").insert({
    unidade, data: dataStr,
    tecnico_id: tecnico.id || null, tecnico_nome: tecnico.nome, tecnico_registro: tecnico.registro||"", tecnico_cargo: tecnico.cargo||"",
    assinado: assinaturaConfirmada, assinado_em: assinaturaTimestamp, geo_assinatura: assinaturaGeo,
    inicio_hora: inspecaoAtiva ? inspecaoAtiva.inicioHora : null,
    geo_inicio: inspecaoAtiva ? inspecaoAtiva.geoInicio : null
  }).select().single();

  if(error || !inspRow){ alert("Erro ao salvar a inspeção no banco: "+(error?.message||"")); return; }
  const novoId = inspRow.id;
  acaoPlataforma("Inspeção registrada", unidade+" — "+tecnico.nome, "inspecao", novoId);

  if(checklistGeralAtual.length){
    const { error: e1 } = await sb.from("inspecoes_checklist").insert(checklistGeralAtual.map(i=>({
      inspecao_id: novoId, texto: i.titulo, status: i.status||"Não avaliado", item_config_id: i.itemConfigId
    })));
    if(e1) console.error("[Supabase] checklist:", e1);
  }
  if(itensInspecaoAtual.length){
    const { error: e2 } = await sb.from("inspecoes_itens").insert(itensInspecaoAtual.map(i=>({
      inspecao_id: novoId, numero:i.numero, categoria:i.categoria, local:i.local, risco:i.risco,
      risco_exposto:i.riscoExposto, solucao:i.solucao, prazo_dias:i.prazoDias, data_limite:i.dataLimite,
      gut_g:i.gut.g, gut_u:i.gut.u, gut_t:i.gut.t, gut_score:i.gut.score, gut_classe:i.gut.classe, gut_label:i.gut.label,
      status:i.status
    })));
    if(e2) console.error("[Supabase] itens:", e2);
  }
  if(ocorrenciasAtual.length){
    const { error: e3 } = await sb.from("inspecoes_ocorrencias").insert(ocorrenciasAtual.map(o=>({
      inspecao_id: novoId, texto:o.texto, hora:o.hora, tipo:o.tipo||null, colaborador:o.colaborador||null, acao:o.acao||null
    })));
    if(e3) console.error("[Supabase] ocorrencias:", e3);
  }

  const { data: full } = await sb.from("inspecoes")
    .select("*, inspecoes_checklist(*), inspecoes_itens(*), inspecoes_ocorrencias(*)")
    .eq("id", novoId).single();
  INSPECOES.unshift(full ? mapInspecaoFromDb(full) : {
    id:novoId, unidade, data:dataStr, tecnicoNome:tecnico.nome, tecnicoRegistro:tecnico.registro||"", tecnicoCargo:tecnico.cargo||"",
    assinado:assinaturaConfirmada, checklistGeral:[], itens:[], ocorrencias:[]
  });

  // volta para a tela de escolha de unidade, pronta para a próxima inspeção
  inspecaoAtiva = null;
  checklistGeralAtual = [];
  itensInspecaoAtual = [];
  ocorrenciasAtual = [];
  document.getElementById("insp-form-ativo").style.display = "none";
  document.getElementById("insp-picker-unidade").style.display = "block";
  document.getElementById("insp-unidade-select").value = "";
  atualizarStatusAssinatura();
  renderPendencias();
  renderHistoricoInspecoes();
  renderAuditoria();
  mostrarToast("Relatório em PDF gerado. Histórico salvo sem as fotos.");
}

// Função do módulo: lista pendencias por unidade
/* ---- Pendências (por unidade, com mini-dashboard por categoria) ---- */
function listaPendenciasPorUnidade(unidade){
  const linhas = [];
  INSPECOES.forEach(insp=>{
    if(insp.unidade!==unidade) return;
    insp.itens.forEach(it=>{
      if(it.status!=="Concluído"){
        linhas.push({inspecaoId:insp.id, unidade:insp.unidade, ...it});
      }
    });
  });
  return linhas;
}

// Desenha na tela: render pendencias
function renderPendencias(){
  const unidade = document.getElementById("pend-unidade-select").value;
  const vazio = document.getElementById("pend-vazio");
  const conteudo = document.getElementById("pend-conteudo");
  if(!unidade){
    vazio.style.display = "block";
    conteudo.style.display = "none";
    return;
  }
  vazio.style.display = "none";
  conteudo.style.display = "block";

  const pend = listaPendenciasPorUnidade(unidade);

  // mini-dashboard por categoria
  const porCategoria = {};
  CATEGORIAS_ITEM.forEach(c=>porCategoria[c]=0);
  pend.forEach(it=>{ porCategoria[it.categoria] = (porCategoria[it.categoria]||0)+1; });
  document.getElementById("pend-mini-dash").innerHTML = CATEGORIAS_ITEM.map(c=>`
    <div class="pend-mini-card">
      <div class="n">${porCategoria[c]||0}</div>
      <div class="l">${c}</div>
    </div>
  `).join("");

  document.getElementById("pend-resumo-texto").textContent = unidade+" — "+pend.length+" pendência(s) em aberto";

  const tbody = document.getElementById("tbl-pendencias");
  if(!pend.length){
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--areia-esc);">Nenhuma pendência nesta unidade.</td></tr>';
    return;
  }
  tbody.innerHTML = pend.map(it=>`
    <tr>
      <td><b>${it.numero}</b></td>
      <td>${it.categoria}</td>
      <td>${it.local}</td>
      <td>${it.risco}</td>
      <td>${it.dataLimite.split("-").reverse().join("/")}</td>
      <td>${tagGUT(it.gut.score)}</td>
      <td>
        <select onchange="atualizarStatusItemHistorico(${it.inspecaoId}, ${it.numero}, this.value)">
          <option ${it.status==="Notificado"?"selected":""}>Notificado</option>
          <option ${it.status==="Não iniciado"?"selected":""}>Não iniciado</option>
          <option ${it.status==="Em Andamento"?"selected":""}>Em Andamento</option>
          <option ${it.status==="Concluído"?"selected":""}>Concluído</option>
        </select>
      </td>
    </tr>
  `).join("");
}

// Atualiza: atualizar status item historico
async function atualizarStatusItemHistorico(inspecaoId, numero, novoStatus){
  const insp = INSPECOES.find(i=>i.id===inspecaoId);
  if(!insp) return;
  const it = insp.itens.find(i=>i.numero===numero);
  if(!it) return;
  it.status = novoStatus;
  renderPendencias();
  renderHistoricoInspecoes();
  if(it.id){
    const { error } = await sb.from("inspecoes_itens").update({status: novoStatus}).eq("id", it.id);
    if(error) console.error("[Supabase] status item:", error);
  }
}

// Função do módulo: baixar pendencias pdf
function baixarPendenciasPDF(){
  const unidade = document.getElementById("pend-unidade-select").value;
  if(!unidade){ alert("Selecione uma unidade para baixar as pendências dela."); return; }
  const pend = listaPendenciasPorUnidade(unidade);
  if(!pend.length){ alert("Não há pendências para esta unidade."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"pt", format:"a4"});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 50;
  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("Itens Pendentes de Correção", 40, y); y+=20;
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text("Unidade: "+unidade+" — gerado em "+new Date().toLocaleDateString("pt-BR"), 40, y); y+=24;
  doc.setDrawColor(210,195,165); doc.line(40, y, pageW-40, y); y+=18;

  pend.forEach(it=>{
    if(y > pageH-100){ doc.addPage(); y = 50; }
    doc.setFont("helvetica","bold"); doc.setFontSize(10.5); doc.setTextColor(40,30,20);
    doc.text("Nº "+it.numero+" ["+it.categoria+"] — "+it.local, 40, y, {maxWidth: pageW-80}); y+=14;
    doc.setFont("helvetica","normal"); doc.setFontSize(9.5);
    doc.text("Risco/Desvio: "+it.risco, 50, y, {maxWidth: pageW-100}); y+=13;
    doc.text("Data limite: "+it.dataLimite.split("-").reverse().join("/")+"   GUT: "+it.gut.score+" ("+it.gut.label+")   Status: "+it.status, 50, y, {maxWidth: pageW-100}); y+=16;
    doc.setDrawColor(230,220,200); doc.line(40, y-4, pageW-40, y-4); y+=12;
  });

  doc.save("pendencias_"+unidade.replace(/[^a-zA-Z0-9]+/g,"_").slice(0,30)+"_"+new Date().toISOString().slice(0,10)+".pdf");
}

// Função do módulo: baixar resumo categoria pdf
function baixarResumoCategoriaPDF(){
  const unidade = document.getElementById("pend-unidade-select").value;
  if(!unidade){ alert("Selecione uma unidade para baixar o resumo."); return; }
  const pend = listaPendenciasPorUnidade(unidade);
  const porCategoria = {};
  CATEGORIAS_ITEM.forEach(c=>porCategoria[c]=0);
  pend.forEach(it=>{ porCategoria[it.categoria] = (porCategoria[it.categoria]||0)+1; });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"pt", format:"a4"});
  const pageW = doc.internal.pageSize.getWidth();
  let y = 50;
  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("Resumo de Pendências por Categoria", 40, y); y+=20;
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text("Unidade: "+unidade+" — gerado em "+new Date().toLocaleDateString("pt-BR"), 40, y); y+=26;
  doc.setDrawColor(210,195,165); doc.line(40, y, pageW-40, y); y+=20;

  CATEGORIAS_ITEM.forEach(c=>{
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(40,30,20);
    doc.text(c, 40, y);
    doc.text(String(porCategoria[c]||0), pageW-60, y);
    y += 20;
  });
  y += 10;
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("Total de pendências: "+pend.length, 40, y);

  doc.save("resumo_categorias_"+unidade.replace(/[^a-zA-Z0-9]+/g,"_").slice(0,30)+".pdf");
}

// Desenha na tela: render historico inspecoes
/* ---- Histórico de inspeções ---- */
function renderHistoricoInspecoes(){
  const tbody = document.getElementById("tbl-inspecoes");
  if(!tbody) return;
  if(!INSPECOES.length){
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--areia-esc);">Nenhuma inspeção gerada ainda.</td></tr>';
    return;
  }
  tbody.innerHTML = INSPECOES.map(insp=>{
    const pendentes = insp.itens.filter(i=>i.status!=="Concluído").length;
    return `
    <tr>
      <td>${insp.data.split("-").reverse().join("/")}</td>
      <td>${insp.unidade}</td>
      <td>${insp.tecnicoNome}</td>
      <td>${insp.itens.length}</td>
      <td>${pendentes}</td>
      <td><button type="button" class="small-btn" onclick="verDetalheInspecao(${insp.id})">Ver detalhes</button></td>
    </tr>
  `;}).join("");
}

// Função do módulo: ver detalhe inspecao
function verDetalheInspecao(id){
  const insp = INSPECOES.find(i=>i.id===id);
  if(!insp) return;
  document.getElementById("detalhe-inspecao-body").innerHTML = `
    <p style="font-size:13px; color:var(--areia-esc); margin-bottom:14px;">
      <b style="color:var(--marrom-esc)">${insp.unidade}</b> — ${insp.tecnicoNome} — ${insp.data.split("-").reverse().join("/")}
      ${insp.assinado? ' — <span style="color:var(--verde-esc); font-weight:700;">assinado</span>' : ' — <span style="color:var(--areia-esc);">não assinado</span>'}
    </p>
    <p style="font-size:12.5px; font-weight:700; color:var(--marrom-esc); margin-bottom:6px;">Parte 1 — Checklist geral</p>
    ${insp.checklistGeral.map(it=>`
      <div style="display:flex; justify-content:space-between; gap:10px; padding:6px 0; border-bottom:1px solid var(--areia-cla);">
        <span style="font-size:12.5px; color:var(--marrom-esc);">${it.texto}</span>
        <span class="tag-status ${classeStatus(it.status==='Conforme'?'Concluído':it.status==='Não Conforme'?'Notificado':'Não iniciado')}">${it.status}</span>
      </div>
    `).join("")}
    <p style="font-size:12.5px; font-weight:700; color:var(--marrom-esc); margin:14px 0 6px 0;">Parte 2 — Plano de ação</p>
    ${insp.itens.length? insp.itens.map(it=>`
      <div style="padding:10px 0; border-bottom:1px solid var(--areia-cla);">
        <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:4px;">
          <span style="font-size:13px; color:var(--marrom-esc);"><b>Nº ${it.numero}</b> [${it.categoria}] — ${it.local}</span>
          ${tagGUT(it.gut.score)}
        </div>
        <div style="font-size:12px; color:var(--areia-esc); margin-bottom:6px;">${it.risco}</div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:11.5px; color:var(--areia-esc);">Prazo: ${it.dataLimite.split("-").reverse().join("/")}</span>
          <select onchange="atualizarStatusItemHistorico(${insp.id}, ${it.numero}, this.value)">
            <option ${it.status==="Notificado"?"selected":""}>Notificado</option>
            <option ${it.status==="Não iniciado"?"selected":""}>Não iniciado</option>
            <option ${it.status==="Em Andamento"?"selected":""}>Em Andamento</option>
            <option ${it.status==="Concluído"?"selected":""}>Concluído</option>
          </select>
        </div>
      </div>
    `).join("") : '<span class="sub">Nenhum item registrado.</span>'}
    <p style="font-size:12.5px; font-weight:700; color:var(--marrom-esc); margin:14px 0 6px 0;">Parte 3 — Ocorrências</p>
    ${insp.ocorrencias.length? insp.ocorrencias.map(o=>`
      <div style="padding:6px 0; border-bottom:1px solid var(--areia-cla); font-size:12.5px; color:var(--marrom-esc);">${o.texto} <span style="color:var(--areia-esc); font-size:11px;">(${o.hora})</span></div>
    `).join("") : '<span class="sub">Nenhuma ocorrência registrada.</span>'}
  `;
  document.getElementById("modal-inspecao").style.display = "flex";
}

// Fecha: fechar modal inspecao
function fecharModalInspecao(){
  document.getElementById("modal-inspecao").style.display = "none";
}

