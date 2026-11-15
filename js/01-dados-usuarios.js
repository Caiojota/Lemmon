
if(typeof Chart !== "undefined"){
  Chart.defaults.font.family = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
  Chart.defaults.font.size = 11.5;
  Chart.defaults.color = "#9f8167";
}

/* =====================================================================
   1) MODELO DE DADOS E SEED (dados de demonstração em memória)
   ===================================================================== */
const GRAVIDADES = ["Sem afastamento","Afastamento de baixo impacto","Com afastamento","Afastamento previdenciário","Óbito"];
/* ---- Logos usados na plataforma e nos relatórios em PDF ---- */
const HORTIFRUTI_LOGO_DATAURL = "data:image/png;base64,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";
document.querySelectorAll("img[data-hf]").forEach(i=>{i.src=HORTIFRUTI_LOGO_DATAURL;});
const LEMON_LOGO_SVG = `<svg viewBox="0 0 680 220" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="lemonClipPdf"><ellipse cx="145" cy="115" rx="62" ry="52"/></clipPath></defs><ellipse cx="145" cy="115" rx="62" ry="52" fill="#faa61a"/><g clip-path="url(#lemonClipPdf)" stroke="#e5d1ab" stroke-width="2" opacity="0.5"><line x1="80" y1="80" x2="210" y2="95"/><line x1="80" y1="95" x2="210" y2="110"/><line x1="80" y1="110" x2="210" y2="125"/><line x1="80" y1="125" x2="210" y2="140"/><line x1="80" y1="140" x2="210" y2="155"/></g><ellipse cx="80" cy="115" rx="7" ry="10" fill="#faa61a"/><ellipse cx="210" cy="115" rx="7" ry="10" fill="#faa61a"/><path d="M145 45 C 172 49, 185 65, 185 65 C 185 92, 168 108, 145 114 C 122 108, 105 92, 105 65 C 105 65, 118 49, 145 45 Z" fill="#00b262"/><rect x="139" y="70" width="12" height="28" rx="2" fill="#efe1d3" opacity="0.9"/><rect x="131" y="78" width="28" height="12" rx="2" fill="#efe1d3" opacity="0.9"/><text x="250" y="105" font-size="20" font-weight="500" fill="#9f8167" font-family="sans-serif" letter-spacing="2">plataforma</text><text x="248" y="160" font-size="62" font-weight="500" fill="#a15a33" font-family="sans-serif">lemon</text></svg>`;
const LEMON_LOGO_SVG_BRANCO = `<svg viewBox="0 0 680 220" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="lemonClipPdfW"><ellipse cx="145" cy="115" rx="62" ry="52"/></clipPath></defs><ellipse cx="145" cy="115" rx="62" ry="52" fill="#ffffff"/><g clip-path="url(#lemonClipPdfW)" stroke="#cfead9" stroke-width="2" opacity="0.6"><line x1="80" y1="80" x2="210" y2="95"/><line x1="80" y1="95" x2="210" y2="110"/><line x1="80" y1="110" x2="210" y2="125"/><line x1="80" y1="125" x2="210" y2="140"/><line x1="80" y1="140" x2="210" y2="155"/></g><ellipse cx="80" cy="115" rx="7" ry="10" fill="#ffffff"/><ellipse cx="210" cy="115" rx="7" ry="10" fill="#ffffff"/><path d="M145 45 C 172 49, 185 65, 185 65 C 185 92, 168 108, 145 114 C 122 108, 105 92, 105 65 C 105 65, 118 49, 145 45 Z" fill="#ffffff" opacity="0.55"/><rect x="139" y="70" width="12" height="28" rx="2" fill="#00512c" opacity="0.9"/><rect x="131" y="78" width="28" height="12" rx="2" fill="#00512c" opacity="0.9"/><text x="250" y="105" font-size="20" font-weight="500" fill="#eaf5ee" font-family="sans-serif" letter-spacing="2">plataforma</text><text x="248" y="160" font-size="62" font-weight="500" fill="#ffffff" font-family="sans-serif">lemon</text></svg>`;
function svgParaPngDataUrl(svgMarkup, width, height){
  return new Promise((resolve, reject)=>{
    try{
      const svgBlob = new Blob([svgMarkup], {type:"image/svg+xml;charset=utf-8"});
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = function(){
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = function(e){ URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    }catch(e){ reject(e); }
  });
}
/* ---- Geolocalização obrigatória: usada em Inspeções (início/assinatura) e na Agenda (check-in/check-out) ---- */
function capturarGeolocalizacaoObrigatoria(){
  return new Promise((resolve, reject)=>{
    if(!navigator.geolocation){
      reject(new Error("Geolocalização não é suportada neste navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos)=> resolve({lat:pos.coords.latitude, lng:pos.coords.longitude, precisao:Math.round(pos.coords.accuracy)}),
      (err)=> reject(new Error("Não foi possível obter sua localização ("+err.message+"). Verifique se a permissão de localização está ativada no navegador/dispositivo.")),
      {enableHighAccuracy:true, timeout:12000, maximumAge:0}
    );
  });
}
const GRAVIDADE_COR = {
  "Sem afastamento":"#00b262",
  "Afastamento de baixo impacto":"#faa61a",
  "Com afastamento":"#f06650",
  "Afastamento previdenciário":"#ee3135",
  "Óbito":"#981b22"
};
const GRAVIDADE_BADGE = {
  "Sem afastamento":"sem","Afastamento de baixo impacto":"com","Com afastamento":"com2",
  "Afastamento previdenciário":"prev","Óbito":"obito"
};

/* ---- Dados reais de acidentes (planilha "Relatório de Acidentes Tratado") ---- */
function negocioDaLoja(loja){ return "Loja"; }
let ACIDENTES = [];

/* =====================================================================
   1B) UNIDADES (CADASTRO MESTRE — USADO POR DASHBOARD E INSPEÇÕES)
   ===================================================================== */
let UNIDADES = [];
let proxIdUnidade = 69;

/* ---- Estrutura Operacional (listas usadas no Lançamento; carregada do Supabase) ---- */
let ESTRUTURA = { funcoes:[], setores:[], bps:[], gerentesRegionais:[] };
function renderEstrutura(){
  const mapa = {funcoes:"lista-funcoes", setores:"lista-setores", bps:"lista-bps", gerentesRegionais:"lista-gerentesRegionais"};
  const saoPessoas = {funcoes:false, setores:false, bps:true, gerentesRegionais:true};
  Object.entries(mapa).forEach(([chave, elId])=>{
    const wrap = document.getElementById(elId);
    if(!wrap) return;
    if(!ESTRUTURA[chave].length){ wrap.innerHTML = '<span class="estrutura-vazio">Nenhum item cadastrado.</span>'; return; }
    wrap.innerHTML = ESTRUTURA[chave].map((v,idx)=>{
      const iniciais = saoPessoas[chave] ? v.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase() : "";
      return `
      <div class="admin-item-row">
        ${saoPessoas[chave] ? `<div class="avatar-mini">${iniciais}</div>` : ""}
        <span class="txt">${v}</span>
        <button type="button" class="del-btn" onclick="removerEstrutura('${chave}', ${idx})">Remover</button>
      </div>
    `;
    }).join("");
  });
  const listaLojas = document.getElementById("lista-lojas-readonly");
  if(listaLojas){
    listaLojas.innerHTML = UNIDADES.map(u=>`<span class="pill" style="margin:0 8px 8px 0; display:inline-flex;">${u.nome}</span>`).join("") || '<span class="estrutura-vazio">Nenhuma unidade cadastrada.</span>';
  }
  popularDropdownsLancamento();
}
const ESTRUTURA_TIPO_DB = {funcoes:"funcao", setores:"setor", bps:"bp", gerentesRegionais:"gerente_regional"};
async function addEstrutura(chave){
  const mapaInput = {funcoes:"novo-item-funcao", setores:"novo-item-setor", bps:"novo-item-bp", gerentesRegionais:"novo-item-gr"};
  const input = document.getElementById(mapaInput[chave]);
  const valor = input.value.trim();
  if(!valor) return;
  if(ESTRUTURA[chave].includes(valor)){ mostrarToast("Esse item já está cadastrado."); return; }
  const { error } = await sb.from("estrutura_itens").insert({tipo: ESTRUTURA_TIPO_DB[chave], valor});
  if(error){ alert("Erro ao adicionar item: "+error.message); return; }
  ESTRUTURA[chave].push(valor);
  input.value = "";
  renderEstrutura();
  mostrarToast("Item adicionado.");
}
async function removerEstrutura(chave, idx){
  if(!confirm("Remover este item da lista?")) return;
  const valor = ESTRUTURA[chave][idx];
  const { error } = await sb.from("estrutura_itens").delete().eq("tipo", ESTRUTURA_TIPO_DB[chave]).eq("valor", valor);
  if(error){ alert("Erro ao remover item: "+error.message); return; }
  ESTRUTURA[chave].splice(idx,1);
  renderEstrutura();
}
function popularDropdownsLancamento(){
  const fillIfExists = (id, arr)=>{
    const sel = document.getElementById(id);
    if(!sel) return;
    const atual = sel.value;
    sel.innerHTML = arr.map(v=>`<option>${v}</option>`).join("");
    if(arr.includes(atual)) sel.value = atual;
  };
  fillIfExists("in-setor", ESTRUTURA.setores);
  fillIfExists("in-funcao", ESTRUTURA.funcoes);
  fillIfExists("in-loja", UNIDADES.map(u=>u.nome));
  atualizarRegionalDaUnidadeForm();
}
function atualizarRegionalDaUnidadeForm(){
  const sel = document.getElementById("in-loja");
  const campoRegional = document.getElementById("in-regional");
  if(!sel || !campoRegional) return;
  const unidade = unidadePorNome(sel.value);
  campoRegional.value = unidade && unidade.regional ? unidade.regional : "Não atribuído";
}

/* ---- Auditoria (geolocalização de inspeções e assinaturas) ---- */
function renderAuditoria(){
  const tbody = document.getElementById("tbl-auditoria");
  if(!tbody) return;
  if(!INSPECOES.length){
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--areia-esc);">Nenhum registro ainda.</td></tr>';
    return;
  }
  const fmtGeo = (geo)=> geo ? `<a href="https://www.google.com/maps?q=${geo.lat},${geo.lng}" target="_blank" rel="noopener">${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}</a>` : "—";
  tbody.innerHTML = INSPECOES.map(insp=>`
    <tr>
      <td>${insp.unidade}</td>
      <td>${insp.tecnicoNome}</td>
      <td>${insp.inicioHora || "—"}</td>
      <td>${fmtGeo(insp.geoInicio)}</td>
      <td>${insp.assinadoEm || (insp.assinado? "sim (sem horário)":"não assinado")}</td>
      <td>${fmtGeo(insp.geoAssinatura)}</td>
    </tr>
  `).join("");
}

function unidadePorNome(nome){
  return UNIDADES.find(u=>u.nome===nome);
}
function regionalDaUnidade(nomeUnidade){
  const u = unidadePorNome(nomeUnidade);
  return u ? u.regional : "";
}
function renderUnidades(){
  const tb = document.getElementById("tbl-unidades");
  if(!tb) return;
  tb.innerHTML = UNIDADES.map(u=>`
    <tr>
      <td><b>${u.nome}</b></td>
      <td>${u.praca}</td>
      <td>${u.regional}</td>
      <td>${u.gerente}</td>
      <td>${u.supervisor}</td>
      <td>${u.tecnicoResponsavel}</td>
      <td>${u.qtdColaboradores}</td>
      <td>
        <button class="small-btn" onclick="abrirModalUnidade(${u.id})">Editar</button>
        <button class="small-btn danger" onclick="removerUnidade(${u.id})">Remover</button>
      </td>
    </tr>
  `).join("");
}
function abrirModalUnidade(id){
  document.getElementById("form-unidade").reset();
  if(id){
    const u = UNIDADES.find(x=>x.id===id);
    document.getElementById("modal-unidade-title").textContent = "Editar unidade";
    document.getElementById("un-id").value = u.id;
    document.getElementById("un-nome").value = u.nome;
    document.getElementById("un-cnpj").value = u.cnpj||"";
    document.getElementById("un-endereco").value = u.endereco||"";
    document.getElementById("un-praca").value = u.praca;
    document.getElementById("un-regional").value = u.regional||"";
    document.getElementById("un-bp").value = u.bp||"";
    document.getElementById("un-tipo-loja").value = u.tipoLoja||"";
    document.getElementById("un-tipo-negocio").value = u.tipoNegocio;
    document.getElementById("un-qtd-colaboradores").value = u.qtdColaboradores||0;
    document.getElementById("un-gerente").value = u.gerente||"";
    document.getElementById("un-gerente-regional").value = u.gerenteRegional||"";
    document.getElementById("un-supervisor").value = u.supervisor||"";
    document.getElementById("un-email-gerente").value = u.emailGerente||"";
    document.getElementById("un-contato-gerente").value = u.telefoneGerente||"";
    document.getElementById("un-tecnico").value = u.tecnicoResponsavel||"";
    document.querySelectorAll(".un-checkin-perfil").forEach(cb=>{ cb.checked = (u.perfisComCheckin||[]).includes(cb.value); });
  } else {
    document.getElementById("modal-unidade-title").textContent = "Nova unidade";
    document.getElementById("un-id").value = "";
    document.querySelectorAll(".un-checkin-perfil").forEach(cb=>{ cb.checked = true; });
  }
  document.getElementById("modal-unidade").style.display = "flex";
}
function fecharModalUnidade(){ document.getElementById("modal-unidade").style.display="none"; }
async function salvarUnidade(ev){
  ev.preventDefault();
  const id = document.getElementById("un-id").value;
  const dados = {
    nome: document.getElementById("un-nome").value.trim(),
    cnpj: document.getElementById("un-cnpj").value.trim(),
    endereco: document.getElementById("un-endereco").value.trim(),
    praca: document.getElementById("un-praca").value,
    regional: document.getElementById("un-regional").value.trim(),
    bp: document.getElementById("un-bp").value.trim(),
    tipoLoja: document.getElementById("un-tipo-loja").value.trim(),
    tipoNegocio: document.getElementById("un-tipo-negocio").value,
    qtdColaboradores: Number(document.getElementById("un-qtd-colaboradores").value)||0,
    gerente: document.getElementById("un-gerente").value.trim(),
    gerenteRegional: document.getElementById("un-gerente-regional").value.trim(),
    supervisor: document.getElementById("un-supervisor").value.trim(),
    emailGerente: document.getElementById("un-email-gerente").value.trim(),
    telefoneGerente: document.getElementById("un-contato-gerente").value.trim(),
    tecnicoResponsavel: document.getElementById("un-tecnico").value.trim(),
    perfisComCheckin: [...document.querySelectorAll(".un-checkin-perfil")].filter(cb=>cb.checked).map(cb=>cb.value)
  };
  if(id){
    const { error } = await sb.from("unidades").update(unidadeToDb(dados)).eq("id", Number(id));
    if(error){ alert("Erro ao atualizar unidade: "+error.message); return; }
    const u = UNIDADES.find(x=>x.id===Number(id));
    Object.assign(u, dados);
    acaoPlataforma("Unidade atualizada", dados.nome||"", null, null);
    mostrarToast("Unidade atualizada com sucesso.");
  } else {
    const { data, error } = await sb.from("unidades").insert(unidadeToDb(dados)).select().single();
    if(error){ alert("Erro ao cadastrar unidade: "+error.message); return; }
    UNIDADES.push(mapUnidadeFromDb(data));
    acaoPlataforma("Unidade cadastrada", dados.nome||"", null, null);
    mostrarToast("Unidade cadastrada com sucesso.");
  }
  fecharModalUnidade();
  renderUnidades();
  popularFiltros();
}
async function removerUnidade(id){
  if(!confirm("Remover esta unidade do cadastro?")) return;
  const { error } = await sb.from("unidades").delete().eq("id", id);
  if(error){ alert("Erro ao remover unidade: "+error.message); return; }
  UNIDADES = UNIDADES.filter(u=>u.id!==id);
  renderUnidades();
  popularFiltros();
}

/* =====================================================================
   2) USUÁRIOS E CONTROLE DE ACESSO
   ===================================================================== */
const MODULOS_PADRAO = {
  "Administrador": ["lancamento","inspecoes","agenda","demandas","reunioes","saude","absenteismo","fichaEpi","auditoriaEpi","gestao"],
  "Coordenador": ["lancamento","inspecoes","agenda","demandas","reunioes","saude","absenteismo","fichaEpi","auditoriaEpi","gestao"],
  "Usuário Padrão": ["lancamento","inspecoes","agenda","demandas","reunioes","saude","absenteismo","fichaEpi","auditoriaEpi"]
};
let USUARIOS = [];
let currentUser = null;

const SUPABASE_URL = "https://azpfhiktqwydvjgrruia.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0yC0Jvi31bzG7musdR3mjA_FIgz81lK";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function doLogin(ev){
  ev.preventDefault();
  const email = document.getElementById("login-user").value.trim();
  const senha = document.getElementById("login-pass").value;
  const errBox = document.getElementById("login-error");
  const btn = document.getElementById("btn-login");
  errBox.style.display = "none";
  btn.disabled = true; btn.textContent = "Entrando...";

  const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });

  btn.disabled = false; btn.textContent = "Entrar";
  if(error || !data.user){
    errBox.textContent = "E-mail ou senha inválidos. Tente novamente.";
    errBox.style.display = "block";
    return false;
  }
  await entrarNaPlataforma(data.user.id);
  return false;
}

async function entrarNaPlataforma(userId){
  const errBox = document.getElementById("login-error");
  const { data: perfil, error } = await sb.from("profiles").select("*").eq("id", userId).single();
  if(error || !perfil || !perfil.ativo){
    errBox.textContent = "Usuário sem acesso à plataforma. Fale com um administrador.";
    errBox.style.display = "block";
    await sb.auth.signOut();
    return;
  }
  currentUser = mapProfileFromDb(perfil);
  document.getElementById("login-screen").style.display="none";
  document.getElementById("app").style.display="block";
  document.getElementById("user-name").textContent = currentUser.nome;
  document.getElementById("user-role").textContent = currentUser.perfil;
  const avatarEl = document.getElementById("user-avatar");
  if(currentUser.foto){ avatarEl.innerHTML = `<img src="${currentUser.foto}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`; }
  else { avatarEl.textContent = currentUser.nome.charAt(0).toUpperCase(); }

  mostrarToast("Carregando dados da plataforma...");
  await carregarDadosDoSupabase();
  montarMenu();
  irParaView("inicio");
  iniciarAtualizacaoAutomatica();
}

function doLogout(){
  pararAtualizacaoAutomatica();
  document.getElementById("user-dropdown").style.display = "none";
  sb.auth.signOut();
  currentUser = null;
  document.getElementById("app").style.display="none";
  document.getElementById("login-screen").style.display="flex";
  document.getElementById("login-form").reset();
}

/* restaura a sessão automaticamente se a pessoa já estiver logada (recarregou a página, etc.) */
document.addEventListener("DOMContentLoaded", async ()=>{
  const { data } = await sb.auth.getSession();
  if(data && data.session && data.session.user){
    await entrarNaPlataforma(data.session.user.id);
  }
});

/* =====================================================================
   MAPEADORES: linha do banco (snake_case) <-> objeto do app (camelCase)
   ===================================================================== */
function normalizarAgrupamento(texto){
  return (texto||"").trim().toUpperCase().replace(/\s+/g,' ');
}
function mapAcidenteFromDb(r){
  return {
    id:r.id, data:r.data, horaAcidente:r.hora_acidente, horaAtendimento:r.hora_atendimento,
    tipo:r.tipo, praca:r.praca, negocio:r.negocio, regional:r.regional, loja:r.loja,
    setor:r.setor, funcao:r.funcao, funcionario:r.funcionario, motivo:normalizarAgrupamento(r.motivo),
    agenteCausador:r.agente_causador, local:r.local, partesAtingidas:(r.partes_atingidas||[]).map(normalizarAgrupamento),
    gravidade:r.gravidade, dias:r.dias, obs:r.obs||""
  };
}
function acidenteToDb(a){
  return {
    data:a.data, hora_acidente:a.horaAcidente, hora_atendimento:a.horaAtendimento, tipo:a.tipo,
    praca:a.praca, negocio:a.negocio, regional:a.regional, loja:a.loja, setor:a.setor, funcao:a.funcao,
    funcionario:a.funcionario, motivo:a.motivo, agente_causador:a.agenteCausador, local:a.local,
    partes_atingidas:a.partesAtingidas, gravidade:a.gravidade, dias:a.dias, obs:a.obs
  };
}
function mapUnidadeFromDb(r){
  return {
    id:r.id, nome:r.nome, cnpj:r.cnpj||"", endereco:r.endereco||"", praca:r.praca||"",
    regional:r.regional||"", gerente:r.gerente||"", gerenteRegional:r.gerente_regional||"",
    supervisor:r.supervisor||"", tipoLoja:r.tipo_loja||"", tipoNegocio:r.tipo_negocio||"",
    qtdColaboradores:r.qtd_colaboradores||0, tecnicoResponsavel:r.tecnico_responsavel||"",
    emailGerente:r.email_gerente||"", telefoneGerente:r.telefone_gerente||"", bp:r.bp||"",
    perfisComCheckin: r.perfis_checkin||[]
  };
}
function unidadeToDb(u){
  return {
    nome:u.nome, cnpj:u.cnpj, endereco:u.endereco, praca:u.praca, regional:u.regional,
    gerente:u.gerente, gerente_regional:u.gerenteRegional, supervisor:u.supervisor,
    tipo_loja:u.tipoLoja, tipo_negocio:u.tipoNegocio, qtd_colaboradores:u.qtdColaboradores,
    tecnico_responsavel:u.tecnicoResponsavel, email_gerente:u.emailGerente,
    telefone_gerente:u.telefoneGerente, bp:u.bp, perfis_checkin:u.perfisComCheckin
  };
}
function mapFichaEpiFromDb(r){
  return {
    id:r.id, matricula:r.matricula, nomeColaborador:r.nome_colaborador, loja:r.loja, setor:r.setor, funcao:r.funcao,
    itens: Array.isArray(r.itens) ? r.itens : [], impressaEm:r.impressa_em,
    statusAuditoria:r.status_auditoria||"Pendente", auditadoPor:r.auditado_por, auditadoEm:r.auditado_em,
    observacoesAuditoria:r.observacoes_auditoria||""
  };
}
function mapProfileFromDb(r){
  return {
    id:r.id, nome:r.nome, login:r.login||"", registro:r.registro||"", cargo:r.cargo||"",
    assinatura:r.assinatura||null, foto:r.foto||null, perfil:r.perfil, modulos:r.modulos||[],
    ativo:r.ativo, notificacoesAtivas:r.notificacoes_ativas||[], cargaHorariaDiaria:r.carga_horaria_diaria!=null ? Number(r.carga_horaria_diaria) : 8
  };
}
function mapInspecaoFromDb(r){
  return {
    id:r.id, unidade:r.unidade, data:r.data,
    tecnicoNome:r.tecnico_nome, tecnicoRegistro:r.tecnico_registro, tecnicoCargo:r.tecnico_cargo,
    assinado:r.assinado, assinadoEm:r.assinado_em, geoAssinatura:r.geo_assinatura,
    inicioHora:r.inicio_hora, geoInicio:r.geo_inicio,
    checklistGeral:(r.inspecoes_checklist||[]).map(c=>({id:c.id, texto:c.texto, status:c.status})),
    itens:(r.inspecoes_itens||[]).map(it=>({
      id:it.id, numero:it.numero, categoria:it.categoria, local:it.local, risco:it.risco,
      riscoExposto:it.risco_exposto, solucao:it.solucao, prazoDias:it.prazo_dias, dataLimite:it.data_limite,
      gut:{g:it.gut_g,u:it.gut_u,t:it.gut_t,score:it.gut_score,classe:it.gut_classe,label:it.gut_label},
      status:it.status
    })),
    ocorrencias:(r.inspecoes_ocorrencias||[]).map(o=>({id:o.id, texto:o.texto, hora:o.hora}))
  };
}
function mapAgendaFromDb(r){
  return {
    id:r.id, usuarioId:r.usuario_id, usuarioNome:r.usuario_nome, usuarioPerfil:r.usuario_perfil,
    unidade:r.unidade, data:r.data, periodo:r.periodo, motivo:r.motivo, status:r.status,
    checkin:r.checkin, checkout:r.checkout, oculto:r.oculto===true, descricao:r.descricao||""
  };
}
function mapFichaFromDb(r){
  return {
    id:r.id, acidenteId:r.acidente_id, acidenteResumo:r.acidente_resumo, dataAnalise:r.data_analise,
    prazo:r.prazo, status:r.status, descricao:r.descricao, causaImediata:r.causa_imediata,
    causaRaiz:r.causa_raiz, acoes:r.acoes, responsavel:r.responsavel
  };
}
function mapDemandaFromDb(r){
  return {
    id:r.id, dataEntrada:r.data_entrada, dataLimite:r.data_limite, tempoEstimado:r.tempo_estimado||"",
    categoria:r.categoria, tipoDemanda:r.tipo_demanda, prioridade:r.prioridade, area:r.area||"", tipoAtividade:r.tipo_atividade||"",
    demanda:r.demanda, fluxoId:r.fluxo_id, etapaId:r.etapa_id,
    aguardandoItem:r.aguardando_item||"", aguardandoResponsavel:r.aguardando_responsavel||"",
    unidade:r.unidade||"", responsavel:r.responsavel||"", responsavelUsuarioId:r.responsavel_usuario_id,
    agendadoPara:r.agendado_para, entregueEm:r.entregue_em, satisfacaoEntrega:r.satisfacao_entrega||"",
    saldoAnterior:r.saldo_anterior||"", tempoGasto:r.tempo_gasto||"",
    emailRelacionado:r.email_relacionado||"", comentarios:r.comentarios||"", demandaMaeId:r.demanda_mae_id,
    criadoPor:r.created_by, createdAt:r.created_at, updatedAt:r.updated_at,
    analiseQualidade:r.analise_qualidade||"", aprovacaoQualidade:r.aprovacao_qualidade||"Pendente",
    aprovadoPor:r.aprovado_por, aprovadoEm:r.aprovado_em, qualidadeSolicitadaEm:r.qualidade_solicitada_em
  };
}
function demandaToDb(d){
  return {
    data_entrada:d.dataEntrada||null, data_limite:d.dataLimite||null, tempo_estimado:d.tempoEstimado,
    categoria:d.categoria, tipo_demanda:d.tipoDemanda, prioridade:d.prioridade, area:d.area||null, tipo_atividade:d.tipoAtividade||null,
    demanda:d.demanda, fluxo_id:d.fluxoId, etapa_id:d.etapaId,
    aguardando_item:d.aguardandoItem, aguardando_responsavel:d.aguardandoResponsavel,
    unidade:d.unidade, responsavel:d.responsavel, responsavel_usuario_id:d.responsavelUsuarioId||null,
    agendado_para:d.agendadoPara||null, entregue_em:d.entregueEm||null, satisfacao_entrega:d.satisfacaoEntrega,
    saldo_anterior:d.saldoAnterior, tempo_gasto:d.tempoGasto,
    email_relacionado:d.emailRelacionado, comentarios:d.comentarios, demanda_mae_id:d.demandaMaeId||null,
    analise_qualidade:d.analiseQualidade||"", aprovacao_qualidade:d.aprovacaoQualidade||"Pendente",
    aprovado_por:d.aprovadoPor||null, aprovado_em:d.aprovadoEm||null, qualidade_solicitada_em:d.qualidadeSolicitadaEm||null
  };
}

/* =====================================================================
   CARREGAMENTO INICIAL — busca tudo do Supabase para dentro das
   variáveis em memória que o resto do app já usa (ACIDENTES, UNIDADES, etc.)
   ===================================================================== */
function mapAvisoFromDb(a){
  return {id:a.id, tipo:a.tipo, titulo:a.titulo, mensagem:a.mensagem||"", destinatarios:a.destinatarios||null,
    referenciaTipo:a.referencia_tipo, referenciaId:a.referencia_id, criadoPor:a.criado_por, criadoPorNome:a.criado_por_nome||"", criadoEm:a.created_at};
}
function mapEventoCalFromDb(e){
  return {id:e.id, titulo:e.titulo, tipo:e.tipo, usuarioId:e.usuario_id, criadoPor:e.criado_por, criadoPorNome:e.criado_por_nome||"",
    dataInicio:e.data_inicio, dataFim:e.data_fim, diaInteiro:e.dia_inteiro!==false,
    horaInicio:(e.hora_inicio||"").slice(0,5), horaFim:(e.hora_fim||"").slice(0,5), local:e.local||"", descricao:e.descricao||"", bloqueia:e.bloqueia!==false, oculto:e.oculto===true, grupoId:e.grupo_id||null};
}
function mapNovoAdmitidoFromDb(r){
  return {id:r.id, nome:r.nome, loja:r.loja||"", setor:r.setor||"", funcao:r.funcao||"", tecnico:r.tecnico_responsavel||"", lote:r.lote||"", criadoEm:r.created_at};
}
// avisos, calendário e fichas de novos admitidos
async function carregarAvisosCalendarioEpi(){
  const corte = new Date(); corte.setDate(corte.getDate()-120);
  const [rAv, rAvR, rCal, rNA, rCv] = await Promise.all([
    sb.from("avisos").select("*").order("id", {ascending:false}).limit(300),
    sb.from("avisos_resolvidos").select("aviso_id"),
    sb.from("calendario_eventos").select("*").gte("data_fim", dataISOLocal(corte)).order("data_inicio").range(0, 9999),
    sb.from("epi_novos_admitidos").select("*").order("id").range(0, 9999),
    sb.from("convites").select("*").order("id", {ascending:false}).limit(600),
  ]);
  if(!rCv.error) CONVITES = (rCv.data||[]).map(mapConviteFromDb); else console.error("[Supabase] convites:", rCv.error);
  if(!rAv.error) AVISOS = (rAv.data||[]).map(mapAvisoFromDb); else console.error("[Supabase] avisos:", rAv.error);
  if(!rAvR.error) AVISOS_RESOLVIDOS = new Set((rAvR.data||[]).map(r=>r.aviso_id)); else console.error("[Supabase] avisos_resolvidos:", rAvR.error);
  if(!rCal.error) CAL_EVENTOS = (rCal.data||[]).map(mapEventoCalFromDb); else console.error("[Supabase] calendario_eventos:", rCal.error);
  if(!rNA.error) EPI_NOVOS = (rNA.data||[]).map(mapNovoAdmitidoFromDb); else console.error("[Supabase] epi_novos_admitidos:", rNA.error);
}
async function carregarDadosDoSupabase(){
  const [rAc, rUn, rEst, rProf, rInsp, rAg, rFi, rDem, rFlu, rEta, rOpc, rNot, rTipCfg, rChkGrp, rChkIt, rOcTip, rAtest, rAbsent, rAbsentCat, rEpiFichas, rAgMot] = await Promise.all([
    sb.from("acidentes").select("*").order("id"),
    sb.from("unidades").select("*").order("nome"),
    sb.from("estrutura_itens").select("*"),
    sb.from("profiles").select("*"),
    sb.from("inspecoes").select("*, inspecoes_checklist(*), inspecoes_itens(*), inspecoes_ocorrencias(*)").order("id", {ascending:false}),
    sb.from("agenda").select("*").order("id", {ascending:false}),
    sb.from("fichas_analise").select("*").order("id", {ascending:false}),
    sb.from("demandas").select("*").order("id", {ascending:false}),
    sb.from("fluxos").select("*").order("id"),
    sb.from("fluxo_etapas").select("*").order("ordem"),
    sb.from("demandas_opcoes").select("*"),
    sb.from("notificacoes").select("*").order("id", {ascending:false}).limit(50),
    sb.from("demandas_tipos_config").select("*").order("nome"),
    sb.from("checklist_grupos").select("*").order("ordem"),
    sb.from("checklist_itens_config").select("*").order("ordem"),
    sb.from("ocorrencias_tipos").select("*").order("ordem"),
    sb.from("atestados").select("*").order("data_atestado", {ascending:false}),
    sb.from("absenteismo").select("*").order("data_inicio", {ascending:false}).range(0, 59999),
    sb.from("absenteismo_categorias").select("*"),
    sb.from("epi_fichas_impressas").select("*").order("impressa_em", {ascending:false}).range(0, 9999),
    sb.from("agenda_motivos").select("*").order("ordem"),
  ]);

  if(rAc.error) console.error("[Supabase] acidentes:", rAc.error);
  if(rUn.error) console.error("[Supabase] unidades:", rUn.error);
  if(rEst.error) console.error("[Supabase] estrutura_itens:", rEst.error);
  if(rProf.error) console.error("[Supabase] profiles:", rProf.error);
  if(rInsp.error) console.error("[Supabase] inspecoes:", rInsp.error);
  if(rAg.error) console.error("[Supabase] agenda:", rAg.error);
  if(rFi.error) console.error("[Supabase] fichas_analise:", rFi.error);
  if(rDem.error) console.error("[Supabase] demandas:", rDem.error);
  if(rFlu.error) console.error("[Supabase] fluxos:", rFlu.error);
  if(rEta.error) console.error("[Supabase] fluxo_etapas:", rEta.error);
  if(rOpc.error) console.error("[Supabase] demandas_opcoes:", rOpc.error);
  if(rNot.error) console.error("[Supabase] notificacoes:", rNot.error);
  if(rTipCfg.error) console.error("[Supabase] demandas_tipos_config:", rTipCfg.error);

  ACIDENTES = (rAc.data||[]).map(mapAcidenteFromDb);
  UNIDADES = (rUn.data||[]).map(mapUnidadeFromDb);
  ESTRUTURA = {funcoes:[], setores:[], bps:[], gerentesRegionais:[]};
  (rEst.data||[]).forEach(it=>{
    if(it.tipo==="funcao") ESTRUTURA.funcoes.push(it.valor);
    else if(it.tipo==="setor") ESTRUTURA.setores.push(it.valor);
    else if(it.tipo==="bp") ESTRUTURA.bps.push(it.valor);
    else if(it.tipo==="gerente_regional") ESTRUTURA.gerentesRegionais.push(it.valor);
  });
  USUARIOS = (rProf.data||[]).map(mapProfileFromDb);
  INSPECOES = (rInsp.data||[]).map(mapInspecaoFromDb);
  AGENDA = (rAg.data||[]).map(mapAgendaFromDb);
  FICHAS_ANALISE = (rFi.data||[]).map(mapFichaFromDb);
  DEMANDAS = (rDem.data||[]).map(mapDemandaFromDb);
  FLUXOS = (rFlu.data||[]).map(f=>({id:f.id, nome:f.nome, padrao:f.padrao}));
  FLUXO_ETAPAS = (rEta.data||[]).map(e=>({id:e.id, fluxoId:e.fluxo_id, nome:e.nome, ordem:e.ordem, cor:e.cor}));
  DEMANDAS_OPCOES = {categoria:[], area:[], tipo_atividade:[]};
  (rOpc.data||[]).forEach(o=>{ if(DEMANDAS_OPCOES[o.tipo]) DEMANDAS_OPCOES[o.tipo].push(o.valor); });
  DEMANDAS_TIPOS_CONFIG = (rTipCfg.data||[]).map(t=>({id:t.id, nome:t.nome, fluxoId:t.fluxo_id, tempoEstimadoHoras:t.tempo_estimado_horas, requerAnaliseQualidade:!!t.requer_analise_qualidade}));
  CHECKLIST_GRUPOS = (rChkGrp.data||[]).map(g=>({id:g.id, nome:g.nome, ordem:g.ordem}));
  CHECKLIST_ITENS_CONFIG = (rChkIt.data||[]).map(i=>({id:i.id, grupoId:i.grupo_id, titulo:i.titulo, descricao:i.descricao||"", ordem:i.ordem, requerEvidencia:!!i.requer_evidencia}));
  OCORRENCIAS_TIPOS = (rOcTip.data||[]).map(t=>({id:t.id, valor:t.valor, ordem:t.ordem}));
  ATESTADOS = (rAtest.data||[]).map(a=>({
    id:a.id, matricula:a.matricula, nome:a.nome, loja:a.loja, regional:a.regional,
    dataAtestado:a.data_atestado, hospital:a.hospital, especialidade:a.especialidade, motivo:a.motivo,
    afastamentoInicio:a.afastamento_inicio, afastamentoFim:a.afastamento_fim, duracaoDias:a.duracao_dias||0,
    tipoAtestado:a.tipo_atestado, cid:a.cid, convenio:a.convenio, setor:a.setor, funcao:a.funcao
  }));
  if(rAtest.error) console.error("[Supabase] atestados:", rAtest.error);
  ABSENTEISMO = (rAbsent.data||[]).map(a=>({
    id:a.id, matricula:a.matricula, nome:a.nome, loja:a.loja, setor:a.setor, funcao:a.funcao,
    tipoAusencia:a.tipo_ausencia, dias:Number(a.dias)||0, horas:Number(a.horas)||0,
    dataInicio:a.data_inicio, dataFim:a.data_fim
  }));
  ABSENTEISMO_CATEGORIAS = (rAbsentCat.data||[]).map(c=>({id:c.id, tipoAusencia:c.tipo_ausencia, categoria:c.categoria}));
  EPI_FICHAS_IMPRESSAS = (rEpiFichas.data||[]).map(mapFichaEpiFromDb);
  if(rEpiFichas.error) console.error("[Supabase] epi_fichas_impressas:", rEpiFichas.error);
  AGENDA_MOTIVOS = (rAgMot.data||[]).map(m=>({id:m.id, valor:m.valor, ordem:m.ordem}));
  if(rAgMot.error) console.error("[Supabase] agenda_motivos:", rAgMot.error);
  if(rAbsent.error) console.error("[Supabase] absenteismo:", rAbsent.error);
  if(rAbsentCat.error) console.error("[Supabase] absenteismo_categorias:", rAbsentCat.error);
  if(rChkGrp.error) console.error("[Supabase] checklist_grupos:", rChkGrp.error);
  if(rChkIt.error) console.error("[Supabase] checklist_itens_config:", rChkIt.error);
  if(rOcTip.error) console.error("[Supabase] ocorrencias_tipos:", rOcTip.error);
  NOTIFICACOES = (rNot.data||[]).map(n=>({id:n.id, usuarioId:n.usuario_id, tipo:n.tipo, titulo:n.titulo, mensagem:n.mensagem, referenciaTipo:n.referencia_tipo, referenciaId:n.referencia_id, lida:n.lida, dispensada:!!n.dispensada, criadoEm:n.created_at}));

  let maxNumero = 0;
  INSPECOES.forEach(i=>i.itens.forEach(it=>{ if(it.numero>maxNumero) maxNumero=it.numero; }));
  proxNumeroItem = maxNumero+1;

  await carregarAvisosCalendarioEpi();
  await carregarSessaoAtiva(); await carregarTempoDemandas();

  popularFiltros();
  popularDropdownsLancamento();
  renderNotificacoes();
  await gerarNotificacoesPrazoDemandas();
  mostrarToast("Dados carregados do banco.");
}
/* ---- Módulos-contêiner: "Tarefas" e "Dashboards" reúnem telas que antes eram módulos/abas soltos ---- */
const CONTEINERES = {
  tarefas: {paineis:[
    {id:"inspecoes",   rotulo:"Relatório Vistorial", perm:"inspecoes",   no:"view-inspecoes",             abrir:()=>initInspecoes()},
    {id:"registro",    rotulo:"Registro e Análise", perm:"lancamento",  no:"acidentes-sub-registro",     abrir:()=>renderLancamentos()},
    {id:"fichaEpi",    rotulo:"Ficha de EPI",       perm:"fichaEpi|auditoriaEpi", no:"view-fichaEpi",    abrir:()=>{ initFichaEpi(); ajustarAbasFichaEpi(); }},
  ]},
  dashboards: {paineis:[
    {id:"acidentes",   rotulo:"Acidentes",   perm:"lancamento", no:"acidentes-sub-indicadores", abrir:()=>requestAnimationFrame(()=>requestAnimationFrame(atualizarDashboard))},
    {id:"agenda",      rotulo:"Agenda",      perm:"agenda",   organizador:true, no:"agenda-sub-indicadores",   abrir:()=>requestAnimationFrame(()=>requestAnimationFrame(renderIndicadoresAgenda))},
    {id:"demandas",    rotulo:"Demandas",    perm:"demandas", organizador:true, no:"demandas-sub-indicadores", abrir:()=>renderIndicadoresDemandas()},
    {id:"absenteismo", rotulo:"Absenteísmo", perm:"absenteismo", no:"view-absenteismo",           abrir:()=>initAbsenteismo()},
    {id:"saude",       rotulo:"Saúde",       perm:"saude",       no:"view-saude",                 abrir:()=>initSaude()},
    {id:"acidentesLista", rotulo:"Todos os Acidentes", perm:"lancamento", oculto:true, no:"acidentes-sub-todos", abrir:()=>mostrarSubAcidentes("todos")},
  ]}
};
// nomes antigos de tela continuam funcionando: apontam para o painel novo
const VIEW_PARA_PAINEL = {
  inspecoes:["tarefas","inspecoes"], registroAnalise:["tarefas","registro"], fichaEpi:["tarefas","fichaEpi"], auditoriaEpi:["tarefas","fichaEpi","auditoria"],
  absenteismo:["dashboards","absenteismo"], saude:["dashboards","saude"], lancamento:["dashboards","acidentesLista"],
  dashAcidentes:["dashboards","acidentes"], dashAgenda:["dashboards","agenda"], dashDemandas:["dashboards","demandas"]
};
const painelAtivo = {tarefas:null, dashboards:null};
function painelPermitido(p){
  return !!currentUser && String(p.perm).split("|").some(k=>(currentUser.modulos||[]).includes(k)) && (!p.organizador || podeAprovarAgenda(currentUser));
}
function paineisDoConteiner(c){ return CONTEINERES[c].paineis.filter(painelPermitido); }
// move os blocos que já existiam para dentro dos módulos-contêiner (uma vez só)
function montarConteineres(){
  Object.keys(CONTEINERES).forEach(c=>{
    const host = document.getElementById(c+"-paineis");
    if(!host || host.dataset.montado) return;
    CONTEINERES[c].paineis.forEach(p=>{
      const no = document.getElementById(p.no);
      if(!no) return;
      const cx = document.createElement("div");
      cx.className = "cont-painel"; cx.id = "cp-"+c+"-"+p.id;
      host.appendChild(cx); cx.appendChild(no);
      if(no.classList.contains("insp-sub")) no.classList.add("active");
    });
    host.dataset.montado = "1";
  });
}
function renderAbasConteiner(c){
  const el = document.getElementById(c+"-tabs");
  if(el) el.innerHTML = "";                                  // as abas agora ficam no menu suspenso
  const p = CONTEINERES[c].paineis.find(x=>x.id===painelAtivo[c]);
  const h2 = document.querySelector("#view-"+c+" > .topbar h2");
  if(h2 && p) h2.textContent = p.rotulo;
}
function abrirPainelConteiner(c, id){
  const lista = paineisDoConteiner(c);
  const p = lista.find(x=>x.id===id) || lista.find(x=>x.id===painelAtivo[c]) || lista[0];
  if(!p){ mostrarToast("Você não tem acesso a este módulo."); return false; }
  montarConteineres();
  painelAtivo[c] = p.id;
  CONTEINERES[c].paineis.forEach(q=>{
    const cx = document.getElementById("cp-"+c+"-"+q.id);
    if(cx) cx.classList.toggle("active", q===p);
    const no = document.getElementById(q.no);
    if(no && no.classList.contains("view")) no.classList.toggle("active", q===p);
  });
  renderAbasConteiner(c);
  p.abrir();
  return true;
}
function moduloVisivel(view){
  if(view==="inicio" || view==="calendario") return true;
  if(CONTEINERES[view]) return paineisDoConteiner(view).length>0;
  return (currentUser.modulos||[]).includes(view);
}
function montarMenu(){
  montarConteineres();
  { const g = document.getElementById("ud-gestao"); if(g) g.style.display = (currentUser.modulos||[]).includes("gestao") ? "flex" : "none"; }
  document.querySelectorAll(".nav-item").forEach(it=>{
    const view = it.dataset.view;
    if(!it.querySelector(".lbl")){ // rótulo em <span> (o menu mostra ícone + nome)
      const tx = [...it.childNodes].find(n=>n.nodeType===3 && n.textContent.trim());
      if(tx){ const sp=document.createElement("span"); sp.className="lbl"; sp.textContent=tx.textContent.trim(); it.replaceChild(sp, tx); it.title = sp.textContent; }
    }
    const grupo = !!CONTEINERES[view];
    if(grupo && !it.querySelector(".caret")) it.insertAdjacentHTML("beforeend",'<svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>');
    it.style.display = moduloVisivel(view) ? "flex" : "none";
    it.onclick = (e)=>{
      e.preventDefault();
      if(!grupo){ fecharNavDrop(); irParaView(view); return; }
      const lista = paineisDoConteiner(view).filter(p=>!p.oculto);
      if(lista.length===1){ fecharNavDrop(); irParaView(view, lista[0].id); return; }
      if(NAV_DROP_VIEW===view) fecharNavDrop(); else abrirNavDrop(it);
    };
    it.onmouseenter = ()=>{ clearTimeout(navDropTimer); if(grupo){ if(window.matchMedia("(hover:hover)").matches) abrirNavDrop(it); } else if(NAV_DROP_VIEW) agendarFecharNavDrop(); };
    it.onmouseleave = ()=>{ if(NAV_DROP_VIEW) agendarFecharNavDrop(); };
  });
}
/* ---- menu suspenso dos grupos (Tarefas, Dashboards): abre ao passar o mouse ou clicar ---- */
let NAV_DROP_VIEW = null, navDropTimer = null;
function fecharNavDrop(){
  clearTimeout(navDropTimer);
  const d = document.getElementById("nav-drop"); if(d) d.style.display = "none";
  NAV_DROP_VIEW = null;
  document.querySelectorAll(".nav-item.aberto").forEach(n=>n.classList.remove("aberto"));
}
function agendarFecharNavDrop(){ clearTimeout(navDropTimer); navDropTimer = setTimeout(fecharNavDrop, 220); }
function abrirNavDrop(it){
  const view = it.dataset.view;
  const lista = paineisDoConteiner(view).filter(p=>!p.oculto);
  if(!lista.length) return;
  let d = document.getElementById("nav-drop");
  if(!d){
    d = document.createElement("div"); d.id = "nav-drop"; d.className = "nav-drop"; d.setAttribute("role","menu");
    d.addEventListener("mouseenter", ()=>clearTimeout(navDropTimer));
    d.addEventListener("mouseleave", agendarFecharNavDrop);
    document.body.appendChild(d);
  }
  d.innerHTML = lista.map(p=>`<button type="button" role="menuitem" class="${viewAtual===view && painelAtivo[view]===p.id ? "ativo":""}" onclick="escolherNavDrop('${view}','${p.id}')">${escHtml(p.rotulo)}</button>`).join("");
  const r = it.getBoundingClientRect();
  const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;   // a tela roda com zoom: converte as coordenadas
  d.style.left = Math.max(6, Math.min(r.left/z, window.innerWidth/z-210))+"px"; d.style.top = (r.bottom/z+2)+"px"; d.style.display = "block";
  document.querySelectorAll(".nav-item.aberto").forEach(n=>n.classList.remove("aberto"));
  it.classList.add("aberto"); NAV_DROP_VIEW = view;
}
function escolherNavDrop(view, id){ fecharNavDrop(); irParaView(view, id); }
document.addEventListener("click", (e)=>{ if(NAV_DROP_VIEW && !e.target.closest(".nav-item.aberto") && !e.target.closest("#nav-drop")) fecharNavDrop(); });
document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") fecharNavDrop(); });
let viewAtual = "inicio";
/* ---- controle segmentado estilo iPhone: o "polegar" branco desliza até a opção ativa ---- */
function iosPosicionarThumb(sw){
  const th = sw.querySelector(":scope > .sw-thumb"); if(!th) return;
  const at = sw.querySelector(".sw-btn.ativo");
  if(!at || !at.offsetWidth){ th.style.width = "0"; return; }
  th.style.width = at.offsetWidth+"px"; th.style.transform = "translateX("+at.offsetLeft+"px)";
}
function iosSwitches(){
  document.querySelectorAll(".switch-aprovacao").forEach(sw=>{
    if(!sw.dataset.ios){
      sw.dataset.ios = "1";
      if(/flex-wrap/.test(sw.getAttribute("style")||"")) sw.classList.add("sem-thumb");
      else { const th = document.createElement("span"); th.className = "sw-thumb"; sw.insertBefore(th, sw.firstChild); }
    }
    iosPosicionarThumb(sw);
  });
}
{
  let ag = false;
  const agendar = ()=>{ if(ag) return; ag = true; requestAnimationFrame(()=>{ ag = false; iosSwitches(); }); };
  new MutationObserver(agendar).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:["class"]});
  window.addEventListener("resize", agendar);
  document.addEventListener("DOMContentLoaded", agendar);
  agendar();
}

function irParaView(view, painel){
  if(view==="agenda") view = "calendario";
  const mapa = VIEW_PARA_PAINEL[view];
  const alvo = mapa ? mapa[0] : view;
  const sub = mapa ? mapa[1] : painel;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  document.getElementById("view-"+alvo).classList.add("active");
  const navEl = document.querySelector('.nav-item[data-view="'+alvo+'"]');
  if(navEl) navEl.classList.add("active");
  viewAtual = alvo;
  if(CONTEINERES[alvo]){ abrirPainelConteiner(alvo, sub); if(mapa && mapa[2]) mostrarSubFichaEpi(mapa[2]); return; }
  if(alvo==="inicio") renderInicio();
  if(alvo==="inspecoes") initInspecoes();
  if(alvo==="agenda") initAgenda();
  if(alvo==="calendario") initCalendario();
  if(alvo==="demandas") initDemandas();
  if(alvo==="reunioes") initReunioes();
  if(alvo==="gestao") initGestao();
}
// menu da foto de perfil (Sair)
function toggleMenuUsuario(e){
  if(e) e.stopPropagation();
  const dd = document.getElementById("user-dropdown"), bt = document.getElementById("user-menu-btn");
  const abrir = dd.style.display==="none";
  dd.style.display = abrir ? "block" : "none";
  bt.setAttribute("aria-expanded", abrir ? "true" : "false");
}
document.addEventListener("click", (e)=>{
  const m = document.getElementById("user-menu"), dd = document.getElementById("user-dropdown");
  if(m && dd && !m.contains(e.target)){ dd.style.display = "none"; const bt=document.getElementById("user-menu-btn"); if(bt) bt.setAttribute("aria-expanded","false"); }
});

