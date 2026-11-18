/* =====================================================================
   PONTO — registro de entrada/saída do próprio usuário logado, com
   localização obrigatória, foto no momento e confirmação de matrícula
   ===================================================================== */

let PT_GEO_ATUAL = null;     // {lat,lng,precisao} capturados ao abrir o registro
let PT_FOTO_ATUAL = null;    // foto (base64) tirada agora
let PT_TIPO_ATUAL = null;    // "entrada" ou "saida" que será registrado
let PT_RELOGIO_TIMER = null;

// Inicializa a tela de Ponto: relógio, status de hoje, histórico e (se admin) a equipe
async function initPonto(){
  ptAtualizarRelogio();
  if(!PT_RELOGIO_TIMER) PT_RELOGIO_TIMER = setInterval(ptAtualizarRelogio, 1000);
  document.getElementById("pt-equipe-card").style.display = ehAdminOuCoordenador() ? "block" : "none";
  if(ehAdminOuCoordenador()){
    const hoje = new Date(); const iso = hoje.toISOString().slice(0,10);
    const campoData = document.getElementById("pt-eq-data");
    if(!campoData.value) campoData.value = iso;
    ptRenderEquipe();
  }
  await ptAtualizarStatusHoje();
  await ptRenderHistorico();
}

// Desenha o relógio grande (hora atual) e a data por extenso
function ptAtualizarRelogio(){
  const agora = new Date();
  document.getElementById("pt-relogio").textContent = agora.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
  document.getElementById("pt-data").textContent = agora.toLocaleDateString("pt-BR", {weekday:"long", day:"2-digit", month:"long", year:"numeric"});
}

// Verifica se a próxima batida é entrada ou saída e ajusta o texto do botão
async function ptAtualizarStatusHoje(){
  const { data, error } = await sb.rpc("ponto_proximo_tipo", {p_usuario: currentUser.id});
  const proximo = error ? "entrada" : data;
  PT_TIPO_ATUAL = proximo;
  document.getElementById("pt-status-hoje").textContent = proximo==="entrada" ? "Você ainda não bateu a entrada hoje." : "Entrada registrada — falta bater a saída.";
  document.getElementById("pt-btn-bater").textContent = proximo==="entrada" ? "Bater entrada" : "Bater saída";
}

// Abre o quadro de confirmação: pega a localização primeiro, depois mostra o modal
async function ptAbrirRegistro(){
  const btn = document.getElementById("pt-btn-bater");
  const msg = document.getElementById("pt-msg");
  btn.disabled = true; msg.style.color = "var(--areia-esc)"; msg.textContent = "Obtendo sua localização...";
  try{
    PT_GEO_ATUAL = await capturarGeolocalizacaoObrigatoria();
  }catch(e){
    btn.disabled = false; msg.style.color = "var(--vermelho)"; msg.textContent = e.message;
    return;
  }
  btn.disabled = false; msg.textContent = "";
  PT_FOTO_ATUAL = null;
  document.getElementById("pt-foto-preview").style.display = "none";
  document.getElementById("pt-matricula").value = "";
  document.getElementById("pt-modal-status").textContent = "";
  document.getElementById("pt-modal-tipo").textContent = PT_TIPO_ATUAL === "saida" ? "saída" : "entrada";
  document.getElementById("pt-modal-info").innerHTML = `<b>${escHtml(currentUser.nome)}</b> · localização capturada (precisão de ${PT_GEO_ATUAL.precisao}m)`;
  document.getElementById("modal-ponto").style.display = "flex";
}

// Lê a foto tirada pela câmera e mostra a prévia
function ptFotoChange(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    PT_FOTO_ATUAL = e.target.result;
    const prev = document.getElementById("pt-foto-preview");
    prev.src = PT_FOTO_ATUAL; prev.style.display = "block";
  };
  reader.readAsDataURL(file);
}

// Confirma o registro: exige foto e matrícula, grava no banco e atualiza as listas
async function ptConfirmarRegistro(){
  const status = document.getElementById("pt-modal-status");
  if(!PT_FOTO_ATUAL){ status.style.color="var(--vermelho)"; status.textContent = "Tire uma foto para confirmar."; return; }
  const matricula = document.getElementById("pt-matricula").value.trim();
  if(!matricula){ status.style.color="var(--vermelho)"; status.textContent = "Digite sua matrícula."; return; }
  const btn = document.getElementById("pt-btn-confirmar"); const rot = btn.textContent;
  btn.disabled = true; btn.textContent = "Salvando...";
  const { data, error } = await sb.rpc("ponto_registrar", {
    p_usuario: currentUser.id, p_matricula: matricula, p_lat: PT_GEO_ATUAL.lat, p_lng: PT_GEO_ATUAL.lng,
    p_precisao: PT_GEO_ATUAL.precisao, p_foto: PT_FOTO_ATUAL
  });
  btn.disabled = false; btn.textContent = rot;
  if(error){ status.style.color="var(--vermelho)"; status.textContent = error.message || "Não foi possível registrar."; return; }
  document.getElementById("modal-ponto").style.display = "none";
  mostrarToast(data && data.tipo==="saida" ? "Saída registrada." : "Entrada registrada.");
  await ptAtualizarStatusHoje();
  await ptRenderHistorico();
  if(ehAdminOuCoordenador()) ptRenderEquipe();
}

// Mostra a localização como um linque para abrir no mapa
function ptLinkLocal(lat, lng){
  if(lat==null || lng==null) return "—";
  return `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener">Ver no mapa</a>`;
}

// Lista o histórico de ponto do próprio usuário, agrupado por dia (entrada + saída)
async function ptRenderHistorico(){
  const { data, error } = await sb.from("ponto_registros").select("*").eq("usuario_id", currentUser.id).order("data_hora",{ascending:false}).limit(60);
  const tbody = document.getElementById("pt-hist-tbody");
  if(error){ tbody.innerHTML = `<tr><td colspan="4" style="color:var(--vermelho);text-align:center;padding:14px;">Erro ao carregar: ${escHtml(error.message||"")}</td></tr>`; return; }
  const porDia = {};
  (data||[]).forEach(r=>{
    const dia = r.data_hora.slice(0,10);
    if(!porDia[dia]) porDia[dia] = {entrada:null, saida:null};
    if(!porDia[dia][r.tipo]) porDia[dia][r.tipo] = r;
  });
  const dias = Object.keys(porDia).sort((a,b)=>b.localeCompare(a));
  if(!dias.length){ tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:14px;color:var(--areia-esc)">Nenhum registro ainda.</td></tr>`; return; }
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

// (Administrador/Coordenador) lista o ponto de toda a equipe num dia escolhido
async function ptRenderEquipe(){
  const dataSel = document.getElementById("pt-eq-data").value;
  const busca = normalizarTextoComparacao(document.getElementById("pt-eq-busca").value);
  if(!dataSel) return;
  const ini = dataSel+"T00:00:00", fim = dataSel+"T23:59:59";
  const { data, error } = await sb.from("ponto_registros").select("*").gte("data_hora", ini).lte("data_hora", fim).order("data_hora",{ascending:true});
  const tbody = document.getElementById("pt-eq-tbody");
  if(error){ tbody.innerHTML = `<tr><td colspan="5" style="color:var(--vermelho);text-align:center;padding:14px;">Erro ao carregar: ${escHtml(error.message||"")}</td></tr>`; return; }
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
  if(!linhas.length){ tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:14px;color:var(--areia-esc)">Nenhum registro nesse dia.</td></tr>`; return; }
  tbody.innerHTML = linhas.map(l=>{
    const foto = (l.entrada && l.entrada.foto) || (l.saida && l.saida.foto);
    const local = l.entrada ? ptLinkLocal(l.entrada.latitude, l.entrada.longitude) : (l.saida ? ptLinkLocal(l.saida.latitude, l.saida.longitude) : "—");
    return `<tr>
      <td>${escHtml(l.nome)}${l.registro?` <span class="sub">Mat. ${escHtml(l.registro)}</span>`:""}</td>
      <td>${l.entrada ? vDataHora(l.entrada.data_hora).split(" ").pop() : "—"}</td>
      <td>${l.saida ? vDataHora(l.saida.data_hora).split(" ").pop() : "—"}</td>
      <td>${foto ? `<img src="${foto}" style="width:34px;height:34px;border-radius:8px;object-fit:cover;cursor:pointer;" onclick="window.open('${foto}','_blank')">` : "—"}</td>
      <td>${local}</td>
    </tr>`;
  }).join("");
}
