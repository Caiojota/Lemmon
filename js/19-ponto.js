/* =====================================================================
   PONTO — registro de entrada/saída do próprio usuário logado, com
   localização obrigatória e foto tirada ao vivo (sem upload de arquivo).
   O registro fica pendente até um Administrador/Coordenador comparar a
   foto ao vivo com a foto cadastrada do colaborador e aprovar; quando
   aprovado, a foto é descartada e o check-in é marcado automaticamente.
   ===================================================================== */

let PT_GEO_ATUAL = null;     // {lat,lng,precisao} capturados ao abrir o registro
let PT_FOTO_ATUAL = null;    // foto (base64) tirada agora, ao vivo
let PT_TIPO_ATUAL = null;    // "entrada" ou "saida" que será solicitado
let PT_CAM_STREAM = null;    // stream da câmera aberta no momento
let PT_RELOGIO_TIMER = null;

// Inicializa a tela de Ponto: relógio, status de hoje, histórico e (se admin) as filas de aprovação/equipe
async function initPonto(){
  ptAtualizarRelogio();
  if(!PT_RELOGIO_TIMER) PT_RELOGIO_TIMER = setInterval(ptAtualizarRelogio, 1000);
  const admin = ehAdminOuCoordenador();
  document.getElementById("pt-pendentes-card").style.display = admin ? "block" : "none";
  document.getElementById("pt-equipe-card").style.display = admin ? "block" : "none";
  document.getElementById("pt-folha-card").style.display = admin ? "block" : "none";
  if(admin){
    const hoje = new Date().toISOString().slice(0,10);
    const campoData = document.getElementById("pt-eq-data");
    if(!campoData.value) campoData.value = hoje;
    await ptRenderPendentes();
    await ptRenderEquipe();
    ptPopularSelectFolha();
    const campoMes = document.getElementById("pt-folha-mes");
    if(!campoMes.value) campoMes.value = hoje.slice(0,7);
    await ptRenderFolha();
  }
  await ptSincronizarStatus();
  await ptRenderHistorico();
}

// Desenha o relógio grande (hora atual) e a data por extenso
function ptAtualizarRelogio(){
  const agora = new Date();
  const el1 = document.getElementById("pt-relogio");
  if(el1) el1.textContent = agora.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
  const el2 = document.getElementById("pt-data");
  if(el2) el2.textContent = agora.toLocaleDateString("pt-BR", {weekday:"long", day:"2-digit", month:"long", year:"numeric"});
}

// Descobre se há um pedido pendente e qual seria a próxima batida; atualiza a tela de Ponto e o card da Início
async function ptSincronizarStatus(){
  const { count } = await sb.from("ponto_registros").select("id", {count:"exact", head:true}).eq("usuario_id", currentUser.id).eq("status","pendente");
  const pendente = (count||0) > 0;
  let rotulo, textoStatus, habilitado = true;
  if(pendente){
    PT_TIPO_ATUAL = null;
    textoStatus = "Aguardando aprovação de um administrador/coordenador sobre o seu último registro.";
    rotulo = "Aguardando aprovação...";
    habilitado = false;
  } else {
    const { data, error } = await sb.rpc("ponto_proximo_tipo", {p_usuario: currentUser.id});
    const proximo = error ? "entrada" : data;
    PT_TIPO_ATUAL = proximo;
    textoStatus = proximo==="entrada" ? "Você ainda não bateu a entrada hoje." : "Entrada registrada — falta bater a saída.";
    rotulo = proximo==="entrada" ? "Bater entrada" : "Bater saída";
  }
  const sEl = document.getElementById("pt-status-hoje"); if(sEl) sEl.textContent = textoStatus;
  const bEl = document.getElementById("pt-btn-bater"); if(bEl){ bEl.textContent = rotulo; bEl.disabled = !habilitado; }

  const card = document.getElementById("in-ponto-card");
  if(card){
    card.style.display = (currentUser.modulos||[]).includes("ponto") ? "flex" : "none";
    const s2 = document.getElementById("in-ponto-status"); if(s2) s2.textContent = textoStatus;
    const b2 = document.getElementById("in-ponto-btn"); if(b2){ b2.textContent = rotulo; b2.disabled = !habilitado; }
  }
}

// Abre o quadro de confirmação: pega a localização, depois abre a câmera ao vivo
async function ptAbrirRegistro(){
  if(!currentUser.matricula){ alert("Seu usuário ainda não tem matrícula cadastrada. Peça para um administrador cadastrar em Usuários antes de bater o ponto."); return; }
  if(PT_TIPO_ATUAL===null){ await ptSincronizarStatus(); if(PT_TIPO_ATUAL===null){ alert("Você já tem um registro aguardando aprovação."); return; } }
  document.getElementById("modal-ponto").style.display = "flex";
  document.getElementById("pt-matricula").value = "";
  document.getElementById("pt-modal-status").textContent = "";
  document.getElementById("pt-modal-tipo").textContent = PT_TIPO_ATUAL === "saida" ? "saída" : "entrada";
  document.getElementById("pt-modal-info").textContent = "Obtendo sua localização...";
  PT_FOTO_ATUAL = null;
  document.getElementById("pt-foto-preview").style.display = "none";
  try{
    PT_GEO_ATUAL = await capturarGeolocalizacaoObrigatoria();
  }catch(e){
    document.getElementById("pt-modal-status").style.color = "var(--vermelho)";
    document.getElementById("pt-modal-status").textContent = e.message;
    document.getElementById("pt-modal-info").textContent = "";
    return;
  }
  document.getElementById("pt-modal-info").innerHTML = `<b>${escHtml(currentUser.nome)}</b> · localização capturada (precisão de ${PT_GEO_ATUAL.precisao}m)`;
  await ptIniciarCamera();
}

// Abre a câmera do dispositivo (câmera frontal) dentro do modal — nunca permite escolher arquivo do computador
async function ptIniciarCamera(){
  const video = document.getElementById("pt-cam-video"), aviso = document.getElementById("pt-cam-aviso");
  document.getElementById("pt-btn-capturar").style.display = "inline-block";
  document.getElementById("pt-btn-refazer").style.display = "none";
  document.getElementById("pt-foto-preview").style.display = "none";
  video.style.display = "none"; aviso.style.display = "block"; aviso.textContent = "Abrindo a câmera...";
  try{
    PT_CAM_STREAM = await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}, audio:false});
    video.srcObject = PT_CAM_STREAM;
    video.style.display = "block"; aviso.style.display = "none";
  }catch(e){
    aviso.textContent = "Não foi possível abrir a câmera (" + e.message + "). Verifique a permissão de câmera do navegador.";
  }
}

// Tira a foto (desenha o quadro atual do vídeo num canvas) e encerra a câmera
function ptCapturarFoto(){
  const video = document.getElementById("pt-cam-video");
  if(!video.videoWidth) return;
  const cv = document.getElementById("pt-cam-canvas");
  cv.width = video.videoWidth; cv.height = video.videoHeight;
  cv.getContext("2d").drawImage(video, 0, 0, cv.width, cv.height);
  PT_FOTO_ATUAL = cv.toDataURL("image/jpeg", 0.85);
  ptPararCamera();
  video.style.display = "none";
  const prev = document.getElementById("pt-foto-preview");
  prev.src = PT_FOTO_ATUAL; prev.style.display = "block";
  document.getElementById("pt-btn-capturar").style.display = "none";
  document.getElementById("pt-btn-refazer").style.display = "inline-block";
}

// Descarta a foto tirada e reabre a câmera para tirar outra
async function ptRefazerFoto(){
  PT_FOTO_ATUAL = null;
  await ptIniciarCamera();
}

// Encerra a câmera (libera o dispositivo)
function ptPararCamera(){
  if(PT_CAM_STREAM){ PT_CAM_STREAM.getTracks().forEach(t=>t.stop()); PT_CAM_STREAM = null; }
}

// Fecha o modal de registro, encerrando a câmera se estiver aberta
function ptFecharModal(){
  ptPararCamera();
  document.getElementById("modal-ponto").style.display = "none";
}

// Envia a solicitação de ponto (foto ao vivo + localização + matrícula); fica pendente até um admin aprovar
async function ptConfirmarRegistro(){
  const status = document.getElementById("pt-modal-status");
  if(!PT_FOTO_ATUAL){ status.style.color="var(--vermelho)"; status.textContent = "Tire a foto antes de enviar."; return; }
  const matricula = document.getElementById("pt-matricula").value.trim();
  if(!matricula){ status.style.color="var(--vermelho)"; status.textContent = "Digite sua matrícula."; return; }
  const btn = document.getElementById("pt-btn-confirmar"); const rot = btn.textContent;
  btn.disabled = true; btn.textContent = "Enviando...";
  const { error } = await sb.rpc("ponto_solicitar", {
    p_usuario: currentUser.id, p_matricula: matricula, p_lat: PT_GEO_ATUAL.lat, p_lng: PT_GEO_ATUAL.lng,
    p_precisao: PT_GEO_ATUAL.precisao, p_foto: PT_FOTO_ATUAL
  });
  btn.disabled = false; btn.textContent = rot;
  if(error){ status.style.color="var(--vermelho)"; status.textContent = error.message || "Não foi possível enviar."; return; }
  ptPararCamera();
  document.getElementById("modal-ponto").style.display = "none";
  mostrarToast("Enviado! Aguardando aprovação de um administrador.");
  await ptSincronizarStatus();
  await ptRenderHistorico();
}

// Mostra a localização como um linque para abrir no mapa
function ptLinkLocal(lat, lng){
  if(lat==null || lng==null) return "—";
  return `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener">Ver no mapa</a>`;
}

// Lista o histórico de ponto JÁ APROVADO do próprio usuário, agrupado por dia
async function ptRenderHistorico(){
  const { data, error } = await sb.from("ponto_registros").select("*").eq("usuario_id", currentUser.id).eq("status","aprovado").order("data_hora",{ascending:false}).limit(60);
  const tbody = document.getElementById("pt-hist-tbody");
  if(error){ tbody.innerHTML = `<tr><td colspan="4" style="color:var(--vermelho);text-align:center;padding:14px;">Erro ao carregar: ${escHtml(error.message||"")}</td></tr>`; return; }
  const porDia = {};
  (data||[]).forEach(r=>{
    const dia = r.data_hora.slice(0,10);
    if(!porDia[dia]) porDia[dia] = {entrada:null, saida:null};
    if(!porDia[dia][r.tipo]) porDia[dia][r.tipo] = r;
  });
  const dias = Object.keys(porDia).sort((a,b)=>b.localeCompare(a));
  if(!dias.length){ tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:14px;color:var(--areia-esc)">Nenhum registro aprovado ainda.</td></tr>`; return; }
  tbody.innerHTML = dias.map(dia=>{
    const e = porDia[dia].entrada, s = porDia[dia].saida;
    const local = e ? ptLinkLocal(e.latitude, e.longitude) : (s ? ptLinkLocal(s.latitude, s.longitude) : "—");
    return `<tr>
      <td>${new Date(dia+"T00:00:00").toLocaleDateString("pt-BR")}</td>
      <td>${e ? vDataHora(e.data_hora).split(" ").pop() : "—"}</td>
      <td>${s ? vDataHora(s.data_hora).split(" ").pop() : "—"}</td>
      <td>${local}</td>
    </tr>`;
  }).join("");
}

// (Administrador/Coordenador) lista os pedidos pendentes, com a foto ao vivo ao lado da foto cadastrada
async function ptRenderPendentes(){
  const { data, error } = await sb.from("ponto_registros").select("*").eq("status","pendente").order("data_hora",{ascending:true});
  const host = document.getElementById("pt-pendentes-lista");
  if(error){ host.innerHTML = `<span style="color:var(--vermelho)">Erro ao carregar: ${escHtml(error.message||"")}</span>`; return; }
  if(!data || !data.length){ host.innerHTML = `<span class="sub">Nenhum pedido pendente no momento.</span>`; return; }
  host.innerHTML = data.map(r=>{
    const u = USUARIOS.find(x=>x.id===r.usuario_id);
    const nome = u ? u.nome : "(usuário removido)";
    const fotoCadastrada = u && u.foto ? `<img src="${u.foto}" style="width:120px;height:120px;object-fit:cover;border-radius:10px;">` : `<div style="width:120px;height:120px;border-radius:10px;background:var(--areia-cla);display:flex;align-items:center;justify-content:center;color:var(--marrom-esc);font-size:12px;text-align:center;padding:6px;">Sem foto cadastrada</div>`;
    return `<div style="border:1px solid rgba(0,0,0,.08); border-radius:12px; padding:14px; display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
      <div style="text-align:center;"><div class="sub" style="margin-bottom:4px;">Cadastrada</div>${fotoCadastrada}</div>
      <div style="text-align:center;"><div class="sub" style="margin-bottom:4px;">Tirada agora</div><img src="${r.foto}" style="width:120px;height:120px;object-fit:cover;border-radius:10px;"></div>
      <div style="flex:1; min-width:160px;">
        <b>${escHtml(nome)}</b>${u&&u.registro?` <span class="sub">Mat. ${escHtml(u.registro)}</span>`:""}<br>
        <span class="sub">${r.tipo==="saida"?"Saída":"Entrada"} solicitada às ${vDataHora(r.data_hora).split(" ").pop()}</span><br>
        <span class="sub">${ptLinkLocal(r.latitude, r.longitude)}</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn-secondary" onclick="ptResolverPendente(${r.id}, false, '${escHtml(nome).replace(/'/g,"")}')">Recusar</button>
        <button type="button" class="btn-primary inline" onclick="ptResolverPendente(${r.id}, true, '${escHtml(nome).replace(/'/g,"")}')">É a mesma pessoa — Aprovar</button>
      </div>
    </div>`;
  }).join("");
}

// Aprova (descarta a foto e confirma o check-in) ou recusa (avisa outros admins para resolver manualmente) um pedido
async function ptResolverPendente(id, aprovar, nome){
  const { error } = await sb.rpc("ponto_resolver", {p_id: id, p_aprovar: aprovar, p_admin: currentUser.id});
  if(error){ alert("Não foi possível concluir: " + (error.message||error)); return; }
  if(!aprovar){
    await notificarAdminsCoordenadores("ponto_pendente", "Ponto recusado — resolução manual necessária",
      `O registro de ponto de ${nome} foi recusado e precisa ser resolvido manualmente.`, "ponto_registros", id, [currentUser.id]);
  }
  mostrarToast(aprovar ? "Ponto aprovado." : "Ponto recusado — demais administradores foram avisados.");
  await ptRenderPendentes();
  await ptRenderEquipe();
}

// (Administrador/Coordenador) lista o ponto aprovado da equipe num dia escolhido
async function ptRenderEquipe(){
  const dataSel = document.getElementById("pt-eq-data").value;
  const busca = normalizarTextoComparacao(document.getElementById("pt-eq-busca").value);
  if(!dataSel) return;
  const ini = dataSel+"T00:00:00", fim = dataSel+"T23:59:59";
  const { data, error } = await sb.from("ponto_registros").select("*").eq("status","aprovado").gte("data_hora", ini).lte("data_hora", fim).order("data_hora",{ascending:true});
  const tbody = document.getElementById("pt-eq-tbody");
  if(error){ tbody.innerHTML = `<tr><td colspan="4" style="color:var(--vermelho);text-align:center;padding:14px;">Erro ao carregar: ${escHtml(error.message||"")}</td></tr>`; return; }
  const porUsuario = {};
  (data||[]).forEach(r=>{
    if(!porUsuario[r.usuario_id]) porUsuario[r.usuario_id] = {entrada:null, saida:null};
    if(!porUsuario[r.usuario_id][r.tipo]) porUsuario[r.usuario_id][r.tipo] = r;
  });
  let linhas = Object.keys(porUsuario).map(uid=>{
    const u = USUARIOS.find(x=>x.id===uid);
    return {uid, nome: u ? u.nome : "(usuário removido)", registro: u ? (u.registro||"") : "", ...porUsuario[uid]};
  });
  if(busca) linhas = linhas.filter(l=>normalizarTextoComparacao(l.nome).includes(busca) || normalizarTextoComparacao(l.registro).includes(busca));
  linhas.sort((a,b)=>cmpPtBr(a.nome,b.nome));
  if(!linhas.length){ tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:14px;color:var(--areia-esc)">Nenhum registro aprovado nesse dia.</td></tr>`; return; }
  tbody.innerHTML = linhas.map(l=>{
    const local = l.entrada ? ptLinkLocal(l.entrada.latitude, l.entrada.longitude) : (l.saida ? ptLinkLocal(l.saida.latitude, l.saida.longitude) : "—");
    return `<tr>
      <td>${escHtml(l.nome)}${l.registro?` <span class="sub">Mat. ${escHtml(l.registro)}</span>`:""}</td>
      <td>${l.entrada ? vDataHora(l.entrada.data_hora).split(" ").pop() : "—"}</td>
      <td>${l.saida ? vDataHora(l.saida.data_hora).split(" ").pop() : "—"}</td>
      <td>${local}</td>
    </tr>`;
  }).join("");
}

// Card de Ponto na página Início: mostra status e permite bater o ponto sem sair da Início
function renderInicioCardPonto(){
  const card = document.getElementById("in-ponto-card");
  if(!card) return;
  if(!(currentUser.modulos||[]).includes("ponto")){ card.style.display = "none"; return; }
  card.style.display = "flex";
  ptSincronizarStatus();
}

/* =====================================================================
   FOLHA DE PONTO — correção de horários e registro de ausências
   (Administrador/Coordenador). Cada linha é um dia do mês escolhido;
   os campos de hora e o seletor de ausência são editados direto na
   tabela e salvos linha a linha. Também gera o PDF para assinatura.
   ===================================================================== */

const PT_AUSENCIA_LABEL = {falta:"Falta", falta_justificada:"Falta justificada", atestado:"Atestado médico", ferias:"Férias", folga:"Folga", outro:"Outro"};

// Preenche o seletor de colaborador da folha de ponto com quem tem o módulo Ponto liberado
function ptPopularSelectFolha(){
  const sel = document.getElementById("pt-folha-usuario");
  if(!sel) return;
  const atual = sel.value;
  const lista = USUARIOS.filter(u=>(u.modulos||[]).includes("ponto")).slice().sort((a,b)=>cmpPtBr(a.nome,b.nome));
  sel.innerHTML = lista.map(u=>`<option value="${u.id}">${escHtml(u.nome)}${u.matricula?" — Mat. "+escHtml(u.matricula):""}</option>`).join("");
  if(atual && lista.some(u=>u.id===atual)) sel.value = atual;
}

// Busca, para um colaborador e mês, os registros aprovados e as ausências já lançadas
async function ptBuscarDadosFolha(uid, iniISO, fimISO){
  const [{data: regs, error: e1}, {data: ausencias, error: e2}] = await Promise.all([
    sb.from("ponto_registros").select("*").eq("usuario_id", uid).eq("status","aprovado").gte("data_hora", iniISO+"T00:00:00").lte("data_hora", fimISO+"T23:59:59"),
    sb.from("ponto_ausencias").select("*").eq("usuario_id", uid).gte("data", iniISO).lte("data", fimISO)
  ]);
  if(e1||e2) throw (e1||e2);
  const porDia = {};
  (regs||[]).forEach(r=>{
    const d = r.data_hora.slice(0,10);
    if(!porDia[d]) porDia[d] = {};
    if(!porDia[d][r.tipo]) porDia[d][r.tipo] = r;
  });
  const ausPorDia = {};
  (ausencias||[]).forEach(a=>{ ausPorDia[a.data] = a; });
  return {porDia, ausPorDia};
}

// Desenha a tabela do mês selecionado, com entrada/saída editáveis e seletor de ausência por dia
async function ptRenderFolha(){
  const sel = document.getElementById("pt-folha-usuario");
  const uid = sel ? sel.value : "";
  const mesVal = document.getElementById("pt-folha-mes").value; // "YYYY-MM"
  const tbody = document.getElementById("pt-folha-tbody");
  const resumo = document.getElementById("pt-folha-resumo");
  if(!uid || !mesVal){ tbody.innerHTML = ""; resumo.textContent = ""; return; }
  const [ano, mes] = mesVal.split("-").map(Number);
  const ini = new Date(ano, mes-1, 1), fim = new Date(ano, mes, 0);
  const iniISO = dataISOLocal(ini), fimISO = dataISOLocal(fim);

  let porDia, ausPorDia;
  try{ ({porDia, ausPorDia} = await ptBuscarDadosFolha(uid, iniISO, fimISO)); }
  catch(e){ tbody.innerHTML = `<tr><td colspan="7" style="color:var(--vermelho);text-align:center;padding:14px;">Erro ao carregar: ${escHtml(e.message||"")}</td></tr>`; return; }

  let linhasHtml = "";
  let totalMin = 0, diasTrabalhados = 0, diasAusencia = 0;
  for(let d = new Date(ini); d <= fim; d.setDate(d.getDate()+1)){
    const iso = dataISOLocal(d);
    const dia = porDia[iso] || {};
    const ent = dia.entrada, sai = dia.saida;
    const aus = ausPorDia[iso];
    let horasTxt = "—";
    if(ent && sai){
      const diffMin = Math.round((new Date(sai.data_hora) - new Date(ent.data_hora))/60000);
      if(diffMin > 0){ totalMin += diffMin; diasTrabalhados++; horasTxt = Math.floor(diffMin/60)+"h"+String(diffMin%60).padStart(2,"0"); }
    }
    if(aus) diasAusencia++;
    const horaEnt = ent ? new Date(ent.data_hora).toTimeString().slice(0,5) : "";
    const horaSai = sai ? new Date(sai.data_hora).toTimeString().slice(0,5) : "";
    const obsAtual = (aus&&aus.observacao) || (ent&&ent.observacao_edicao) || (sai&&sai.observacao_edicao) || "";
    linhasHtml += `<tr data-dia="${iso}">
      <td>${maiusc1(d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""))} ${iso.split("-").reverse().join("/")}</td>
      <td><input type="time" class="pt-folha-ent" value="${horaEnt}" style="width:105px;"></td>
      <td><input type="time" class="pt-folha-sai" value="${horaSai}" style="width:105px;"></td>
      <td>${horasTxt}</td>
      <td><select class="pt-folha-aus" style="min-width:150px;">
        <option value="">—</option>
        ${Object.entries(PT_AUSENCIA_LABEL).map(([v,l])=>`<option value="${v}" ${aus&&aus.tipo===v?"selected":""}>${l}</option>`).join("")}
      </select></td>
      <td><input type="text" class="pt-folha-obs" placeholder="observação" value="${escHtml(obsAtual)}" style="width:160px;"></td>
      <td><button type="button" class="small-btn" onclick="ptSalvarDiaFolha(this)">Salvar</button></td>
    </tr>`;
  }
  tbody.innerHTML = linhasHtml;
  const totalH = Math.floor(totalMin/60)+"h"+String(totalMin%60).padStart(2,"0");
  resumo.textContent = `Dias com entrada e saída: ${diasTrabalhados} · Total de horas no mês: ${totalH} · Ausências lançadas: ${diasAusencia}`;
}

// Salva, para o dia da linha clicada, a entrada, a saída e a ausência informadas (horário vazio remove o registro daquele tipo)
async function ptSalvarDiaFolha(btn){
  const tr = btn.closest("tr");
  const dia = tr.dataset.dia;
  const uid = document.getElementById("pt-folha-usuario").value;
  const hEnt = tr.querySelector(".pt-folha-ent").value;
  const hSai = tr.querySelector(".pt-folha-sai").value;
  const aus = tr.querySelector(".pt-folha-aus").value;
  const obs = tr.querySelector(".pt-folha-obs").value.trim();
  const rot = btn.textContent; btn.disabled = true; btn.textContent = "Salvando...";
  const { error } = await sb.rpc("ponto_admin_salvar_dia", {
    p_usuario: uid, p_data: dia, p_hora_entrada: hEnt||null, p_hora_saida: hSai||null,
    p_ausencia_tipo: aus||null, p_observacao: obs||null
  });
  btn.disabled = false; btn.textContent = rot;
  if(error){ alert("Erro ao salvar: "+error.message); return; }
  mostrarToast("Dia atualizado.");
  await ptRenderFolha();
  if(document.getElementById("pt-eq-data")) await ptRenderEquipe();
}

// Gera o PDF da folha de ponto do mês selecionado, pronto para o colaborador conferir e assinar
async function ptGerarPdfFolha(){
  const sel = document.getElementById("pt-folha-usuario");
  const uid = sel ? sel.value : "";
  const mesVal = document.getElementById("pt-folha-mes").value;
  if(!uid || !mesVal){ alert("Selecione o colaborador e o mês."); return; }
  const u = USUARIOS.find(x=>x.id===uid);
  const [ano, mes] = mesVal.split("-").map(Number);
  const ini = new Date(ano, mes-1, 1), fim = new Date(ano, mes, 0);
  const iniISO = dataISOLocal(ini), fimISO = dataISOLocal(fim);

  let porDia, ausPorDia;
  try{ ({porDia, ausPorDia} = await ptBuscarDadosFolha(uid, iniISO, fimISO)); }
  catch(e){ alert("Erro ao carregar os dados: "+(e.message||"")); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"pt", format:"a4"});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 60;
  try{ doc.addImage(HORTIFRUTI_LOGO_DATAURL, "PNG", 40, 30, 90, 31); }catch(e){}
  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("Folha de Ponto", pageW-40, 48, {align:"right"});
  doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(120,105,85);
  const nomeMes = maiusc1(ini.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}));
  doc.text("Período: "+nomeMes+"  ·  Gerado em "+new Date().toLocaleString("pt-BR"), pageW-40, 62, {align:"right"});
  doc.setTextColor(30,30,30);
  y = 92;
  doc.setDrawColor(210,195,165); doc.line(40,y,pageW-40,y); y += 18;
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text((u?u.nome:"—")+(u&&u.matricula?" — matrícula "+u.matricula:""), 40, y);
  y += 14;
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90,75,60);
  doc.text("Cargo: "+(u&&u.cargo?u.cargo:"—"), 40, y);
  doc.setTextColor(30,30,30);
  y += 22;

  const colX = [40, 108, 170, 232, 292, 375];
  const header = ["Data","Entrada","Saída","Horas","Ocorrência","Observação"];
  const desenhaCabecalho = ()=>{
    doc.setFillColor(245,238,222); doc.rect(40, y-11, pageW-80, 17, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(60,45,30);
    header.forEach((h,i)=>doc.text(h, colX[i], y));
    y += 15;
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(30,30,30);
  };
  desenhaCabecalho();

  let totalMin = 0;
  for(let d = new Date(ini); d <= fim; d.setDate(d.getDate()+1)){
    const iso = dataISOLocal(d);
    const dia = porDia[iso] || {};
    const aus = ausPorDia[iso];
    const ent = dia.entrada, sai = dia.saida;
    let horasTxt = "—";
    if(ent && sai){
      const dm = Math.round((new Date(sai.data_hora) - new Date(ent.data_hora))/60000);
      if(dm > 0){ totalMin += dm; horasTxt = Math.floor(dm/60)+"h"+String(dm%60).padStart(2,"0"); }
    }
    const ocorrencia = aus ? (PT_AUSENCIA_LABEL[aus.tipo]||aus.tipo) : "";
    const obs = (aus&&aus.observacao) || (ent&&ent.observacao_edicao) || (sai&&sai.observacao_edicao) || "";
    if(y > pageH-70){ doc.addPage(); y = 50; desenhaCabecalho(); }
    doc.text(maiusc1(d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""))+" "+iso.split("-").reverse().join("/"), colX[0], y);
    doc.text(ent ? new Date(ent.data_hora).toTimeString().slice(0,5) : "—", colX[1], y);
    doc.text(sai ? new Date(sai.data_hora).toTimeString().slice(0,5) : "—", colX[2], y);
    doc.text(horasTxt, colX[3], y);
    doc.text(ocorrencia||"—", colX[4], y);
    if(obs) doc.text(doc.splitTextToSize(obs, pageW-40-colX[5])[0]||"", colX[5], y);
    y += 13;
  }
  y += 8;
  doc.setDrawColor(210,195,165); doc.line(40,y,pageW-40,y); y += 18;
  const totalH = Math.floor(totalMin/60)+"h"+String(totalMin%60).padStart(2,"0");
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(30,30,30);
  doc.text("Total de horas no período: "+totalH, 40, y);
  y += 46;
  if(y > pageH-80){ doc.addPage(); y = 60; }
  doc.setFont("helvetica","normal"); doc.setFontSize(9);
  doc.text("Declaro, para os devidos fins, que conferi os registros de ponto acima referentes ao período indicado.", 40, y);
  y += 36;
  doc.setDrawColor(100,90,75); doc.line(40, y, 280, y);
  doc.setFontSize(9);
  doc.text("Assinatura do colaborador", 40, y+12);
  doc.text("Data: ____/____/______", 320, y+12);

  doc.save("folha_ponto_"+(u?u.nome.replace(/\s+/g,"_"):"colaborador")+"_"+mesVal+".pdf");
}
