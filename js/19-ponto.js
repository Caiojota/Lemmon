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
  if(admin){
    const hoje = new Date().toISOString().slice(0,10);
    const campoData = document.getElementById("pt-eq-data");
    if(!campoData.value) campoData.value = hoje;
    await ptRenderPendentes();
    await ptRenderEquipe();
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
