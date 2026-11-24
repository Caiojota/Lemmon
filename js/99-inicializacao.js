/* =====================================================================
   INICIALIZAÇÃO — trechos de código que rodam assim que a página carrega:
   variáveis globais, configurações, listeners (ex.: DOMContentLoaded) e
   os sons da plataforma. A ordem aqui é a mesma do arquivo original;
   não mude a ordem destes blocos.
   ===================================================================== */

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

let ACIDENTES = [];

/* =====================================================================
   1B) UNIDADES (CADASTRO MESTRE — USADO POR DASHBOARD E INSPEÇÕES)
   ===================================================================== */
let UNIDADES = [];

let proxIdUnidade = 69;

/* ---- Estrutura Operacional (listas usadas no Lançamento; carregada do Supabase) ---- */
let ESTRUTURA = { funcoes:[], setores:[], bps:[], gerentesRegionais:[] };

const ESTRUTURA_TIPO_DB = {funcoes:"funcao", setores:"setor", bps:"bp", gerentesRegionais:"gerente_regional"};

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

/* restaura a sessão automaticamente se a pessoa já estiver logada (recarregou a página, etc.) */
document.addEventListener("DOMContentLoaded", async ()=>{
  const { data } = await sb.auth.getSession();
  if(data && data.session && data.session.user){
    await entrarNaPlataforma(data.session.user.id);
  }
});

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

/* ---- menu suspenso dos grupos (Tarefas, Dashboards): abre ao passar o mouse ou clicar ---- */
let NAV_DROP_VIEW = null, navDropTimer = null;

document.addEventListener("click", (e)=>{ if(NAV_DROP_VIEW && !e.target.closest(".nav-item.aberto") && !e.target.closest("#nav-drop")) fecharNavDrop(); });

document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") fecharNavDrop(); });

let viewAtual = "inicio";

{
  let ag = false;
  const agendar = ()=>{ if(ag) return; ag = true; requestAnimationFrame(()=>{ ag = false; iosSwitches(); }); };
  new MutationObserver(agendar).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:["class"]});
  window.addEventListener("resize", agendar);
  document.addEventListener("DOMContentLoaded", agendar);
  agendar();
}

document.addEventListener("click", (e)=>{
  const m = document.getElementById("user-menu"), dd = document.getElementById("user-dropdown");
  if(m && dd && !m.contains(e.target)){ dd.style.display = "none"; const bt=document.getElementById("user-menu-btn"); if(bt) bt.setAttribute("aria-expanded","false"); }
});

/* =====================================================================
   3) DASHBOARD — FILTROS, KPIs, TERMÔMETRO E GRÁFICOS
   ===================================================================== */
let charts = {};

["f-unidade","f-regional","f-praca","f-negocio","f-tipo","f-de","f-ate"].forEach(id=>{
  document.addEventListener("DOMContentLoaded",()=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener("change", atualizarDashboard);
  });
});

/* ---- Ficha de acompanhamento da análise de acidente de trabalho ---- */
let FICHAS_ANALISE = [];

const ICONE_PLAY = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="vertical-align:-2px;"><path d="M6 4.5v15l14-7.5-14-7.5Z"/></svg>';

const ICONE_PAUSE = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="vertical-align:-2px;"><path d="M6 4h4v16H6V4Zm8 0h4v16h-4V4Z"/></svg>';

let DEMANDAS = [];

let FLUXOS = [];

let FLUXO_ETAPAS = [];

let DEMANDAS_OPCOES = {categoria:[], area:[], tipo_atividade:[]};

let DEMANDAS_TIPOS_CONFIG = [];

let CHECKLIST_GRUPOS = [];

let CHECKLIST_ITENS_CONFIG = [];

let OCORRENCIAS_TIPOS = [];

let ATESTADOS = [];

let ABSENTEISMO = [];

let ABSENTEISMO_CATEGORIAS = [];

let EPI_FICHAS_IMPRESSAS = [];

let NOTIFICACOES = [];

let AVISOS = [];

// avisos da plataforma (manuais e automáticos)
let AVISOS_RESOLVIDOS = new Set();

// ids dos avisos que o usuário logado marcou como resolvidos
let CONVITES = [];

let CAL_EVENTOS = [];

// eventos do calendário (eventos, atividades, folgas, férias...)
let EPI_NOVOS = [];

// fichas de EPI de novos admitidos aguardando download
let sessoesModalAtual = [];

let sessaoAbertaModalAtual = null;

let timerIntervalIdDemanda = null;

let comentariosQualidadeModalAtual = [];

/* ---- Demandas: lista tipo planilha ---- */
let proxIdFicha = 1;

/* ---- Todos os Acidentes (sem limite de quantidade) ---- */
let ordenacaoTodosAcidentes = {campo:"data", dir:-1};

let pendingImport = [];

document.addEventListener("DOMContentLoaded", ()=>{
  const input = document.getElementById("file-input");
  input.addEventListener("change", (e)=>{ if(e.target.files[0]) processarArquivo(e.target.files[0]); });
  const zone = document.getElementById("drop-zone");
  zone.addEventListener("dragover", e=>{ e.preventDefault(); zone.style.borderColor="#00b262"; });
  zone.addEventListener("dragleave", e=>{ zone.style.borderColor=""; });
  zone.addEventListener("drop", e=>{
    e.preventDefault(); zone.style.borderColor="";
    if(e.dataTransfer.files[0]) processarArquivo(e.dataTransfer.files[0]);
  });

  const inputRh = document.getElementById("file-input-rh");
  const zoneRh = document.getElementById("drop-zone-rh");
  if(inputRh && zoneRh){
    inputRh.addEventListener("change", (e)=>{ if(e.target.files[0]) processarArquivoConciliacaoRH(e.target.files[0]); });
    zoneRh.addEventListener("dragover", e=>{ e.preventDefault(); zoneRh.style.borderColor="#00b262"; });
    zoneRh.addEventListener("dragleave", e=>{ zoneRh.style.borderColor=""; });
    zoneRh.addEventListener("drop", e=>{
      e.preventDefault(); zoneRh.style.borderColor="";
      if(e.dataTransfer.files[0]) processarArquivoConciliacaoRH(e.dataTransfer.files[0]);
    });
  }
});

const COLUNAS_MODELO = ["Data","Tipo (Trajeto/Típico)","Praça","Regional","Loja","Tipo de Negócio","Setor","Função","Funcionário","Motivo","Agente Causador","Local do Acidente","Partes do corpo atingidas","Hora do Acidente","Hora do Atendimento","Gravidade","Dias de Afastamento"];

/* =====================================================================
   6) INSPEÇÕES DE SEGURANÇA — CHECKLIST GERAL, PLANO DE AÇÃO (GUT),
      OCORRÊNCIAS, PENDÊNCIAS POR UNIDADE E RELATÓRIO EM PDF
   ===================================================================== */
const CHECKLIST_GERAL_ITENS = [
  "Fachada e área externa limpas e organizadas",
  "Documentação obrigatória em dia (Alvará, AVCB, etc.)",
  "Sinalização de segurança visível e conservada",
  "Extintores de incêndio dentro da validade e desobstruídos",
  "Saídas de emergência sinalizadas e desobstruídas",
  "Instalações elétricas sem fios expostos ou improvisos",
  "EPIs disponíveis e em bom estado de conservação",
  "Área de armazenamento organizada e sem risco de queda de materiais"
];

const CATEGORIAS_ITEM = ["Infraestrutura","Incêndio","SESMT","Segurança Patrimonial","Meio Ambiente","Outros"];

let inspecaoAtiva = null;

// {unidade} — preenchido só depois de "Iniciar nova inspeção"
let checklistGeralAtual = [];

// Parte 1: itens fixos {id, texto, status, foto}
let proxNumeroItem = 1;

// numeração global e sequencial dos itens da Parte 2 (nunca reinicia)
let itensInspecaoAtual = [];

// Parte 2: itens já adicionados na inspeção em andamento
let fotoItemTemp = null;

// foto do item que está sendo cadastrado no modal (Parte 2)
let ocorrenciasAtual = [];

// Parte 3: ocorrências registradas na inspeção em andamento
let assinaturaConfirmada = false;

let assinaturaTimestamp = null;

let assinaturaGeo = null;

let INSPECOES = [];

// histórico leve: todos os campos, exceto fotos
let proxIdInspecao = 1;

// filtro por responsáveis: ícones dos usuários, dá para marcar mais de um (usuário padrão só enxerga as próprias demandas)
let DEM_F_RESP = new Set();

["dem-f-categoria","dem-f-area","dem-f-tipo-atividade","dem-f-tipo","dem-f-prioridade","dem-f-etapa","dem-f-unidade"].forEach(id=>{
  document.addEventListener("DOMContentLoaded", ()=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener("change", renderVisaoAtivaDemandas);
  });
});

// tempo de cronômetro acumulado por demanda (segundos) e barra "gasto x estimado do tipo"
let DEMANDAS_TEMPO = {};

const PALETA_AVATARES = ["#a15a33","#00733f","#a35e8e","#24a076","#f06650","#54412f","#9f8167","#54be95","#a35e8e","#f9b16b"];

let ordenacaoListaDemandas = {campo:"dataEntrada", dir:-1};

/* ---- Sub-demandas na lista: a demanda principal ganha uma seta que expande as filhas ---- */
let DEM_EXPANDIDAS = new Set(), DEM_FILHAS_NA_LISTA = new Map(), demNivelLinha = 0;

let DEMANDAS_MSG_CONT = {};

let demandasTodasColunas = false;

let DEMANDAS_SEL = new Set();

// ids das demandas marcadas para alteração em lote
const COLUNAS_DEMANDAS = [
  {k:null, t:"", sel:true, cel:d=>`<input type="checkbox" class="dm-sel" ${DEMANDAS_SEL.has(d.id)?"checked":""} onchange="alternarSelecaoDemanda(${d.id}, this.checked)" aria-label="Selecionar demanda #${d.id}">`},
  {k:"demanda", t:"Demanda", sticky:true, cel:d=>{
    const n = DEMANDAS_MSG_CONT[d.id]||0;
    const chat = n ? `<span class="dm-msgs-chip" title="${n} mensagem(ns) na conversa"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12Z"/></svg>${n}</span>` : "";
    return demPrefixoLinha(d)+`<span class="jira-type-dot" style="background:${corTipoDemanda(d.tipoDemanda)};"></span><span class="jira-issue-key">#${d.id}</span>${chat}<span class="jira-issue-title">${escHtml(d.demanda)}</span>`;
  }},
  {k:"tipoDemanda", t:"Tipo de demanda", cel:d=>escHtml(d.tipoDemanda||"—")},
  {k:"prioridade", t:"Prioridade", cel:d=>`<span class="jira-prioridade"><span class="flag ${d.prioridade==="Alta"?"alta":d.prioridade==="Baixa"?"baixa":"normal"}"></span>${escHtml(d.prioridade)}</span>`},
  {k:"status", t:"Status", cel:d=>`<span class="jira-status-chip" style="background:${corEtapaDemanda(d)};">${escHtml(nomeEtapaDemanda(d))}</span>`},
  {k:"prazo", t:"Prazo · tempo (cronômetro)", cel:d=>{ const p=calcularControlePrazo(d.dataLimite,d.entregueEm); return `<div class="dm-prazo-cel"><span class="jira-status-chip" style="background:${p.cor};">${p.label}</span>${barraTempoHtml(d, true)}</div>`; }},
  {k:"dataLimite", t:"Data limite", cel:d=>formatarDataBR(d.dataLimite)},
  {k:"aguardandoItem", t:"Aguardando", cel:d=>d.aguardandoItem ? `<span title="${escHtml(d.aguardandoResponsavel||"")}">${escHtml(d.aguardandoItem)}</span>` : "—"},
  {k:"unidade", t:"Unidade", cel:d=>escHtml(d.unidade||"—")},
  {k:"responsavel", t:"Responsáveis", cel:d=>demResponsaveisHtml(d)},
  {k:"categoria", t:"Categoria", ext:true, cel:d=>escHtml(d.categoria||"—")},
  {k:"area", t:"Área", ext:true, cel:d=>escHtml(d.area||"—")},
  {k:"tipoAtividade", t:"Tipo de atividade", ext:true, cel:d=>escHtml(d.tipoAtividade||"—")},
  {k:"dataEntrada", t:"Data de entrada", ext:true, cel:d=>formatarDataBR(d.dataEntrada)},
  {k:"diasEntrega", t:"Tempo p/ entrega (dias)", ext:true, cel:d=>{ const x=diasParaEntrega(d); return x!=null?x:"—"; }},
  {k:"tempoEstimado", t:"Tempo estimado", ext:true, cel:d=>escHtml(d.tempoEstimado||"—")},
  {k:"aguardandoResponsavel", t:"Aguardando (resp.)", ext:true, cel:d=>escHtml(d.aguardandoResponsavel||"—")},
  {k:"agendadoPara", t:"Agendado para", ext:true, cel:d=>formatarDataBR(d.agendadoPara)},
  {k:"entregueEm", t:"Entregue em", ext:true, cel:d=>formatarDataBR(d.entregueEm)},
  {k:"satisfacaoEntrega", t:"Satisf. da entrega", ext:true, cel:d=>escHtml(d.satisfacaoEntrega||"—")},
  {k:"saldoAnterior", t:"Saldo anterior", ext:true, cel:d=>escHtml(d.saldoAnterior||"—")},
  {k:"tempoGasto", t:"Tempo gasto", ext:true, cel:d=>escHtml(d.tempoGasto||"—")},
  {k:"emailRelacionado", t:"Título de e-mail", ext:true, cel:d=>escHtml(d.emailRelacionado||"—")},
  {k:"comentarios", t:"Comentários", ext:true, cel:d=>`<span title="${escHtml(d.comentarios||"")}">${escHtml((d.comentarios||"—").slice(0,30))}</span>`},
  {k:"aprovacaoQualidade", t:"Aprovação qualidade", ext:true, cel:d=>escHtml(d.aprovacaoQualidade||"—")},
  {k:"demandaMae", t:"Demanda mãe", ext:true, cel:d=>d.demandaMaeId ? "#"+d.demandaMaeId : "—"},
  {k:null, t:"Demanda filha", ext:true, cel:d=>{ const f=demandasFilhas(d); return f.length ? f.map(x=>"#"+x.id).join(", ") : "—"; }}
];

document.addEventListener("DOMContentLoaded", ()=>{
  const b = document.getElementById("dem-f-busca");
  if(b) b.addEventListener("input", renderVisaoAtivaDemandas);
  const f = document.getElementById("form-demanda");
  if(f) f.addEventListener("change", atualizarCabecalhoJanelaDemanda);
  const inp = document.getElementById("dem-chat-input");
  if(inp){
    inp.addEventListener("keydown", e=>{ if(e.key==="Enter" && !e.shiftKey && !e.isComposing){ e.preventDefault(); enviarMensagemDemanda(); } });
    inp.addEventListener("input", ()=>{ inp.style.height="auto"; inp.style.height = Math.min(inp.scrollHeight,120)+"px"; });
  }
});

document.addEventListener("keydown", e=>{
  if(e.key!=="Escape") return;
  const dem = document.getElementById("modal-demanda");
  const reu = document.getElementById("modal-reuniao");
  if(dem && dem.style.display==="flex") fecharModalDemanda();
  else if(reu && reu.style.display==="flex") fecharModalReuniao();
});

/* ---- Sessão em andamento (aparece na página inicial) ---- */
let SESSAO_ATIVA = null, relogioSessaoId = null;

/* ---- Disponibilidade: grade semanal/mensal por dia ---- */
let dispModoVisao = "semana";

let dispOffsetSemana = 0;

let dispOffsetMes = 0;

/* ---- Chat da demanda ---- */
let chatDemanda = {id:null, msgs:[], timer:null};

const ICONE_CHAT_VAZIO = '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12Z"/></svg>';

/* =====================================================================
   REUNIÕES — Reuniões (com tipos) e Dailys
   ===================================================================== */
let REUNIOES = [], REUNIOES_TIPOS = [];

let rnFiltro = {quando:"proximas"};

let rnEdit = null;

let rnSubAtual = "reunioes";

document.addEventListener("DOMContentLoaded", ()=>{
  ["rn-tipo","rn-data","rn-status"].forEach(id=>{ const el = document.getElementById(id); if(el) el.addEventListener("change", ()=>{ if(rnEdit) atualizarChipsReuniao(); }); });
});

/* =====================================================================
   DAILYS — reunião diária: prioridades, achados, demandas travadas
   ===================================================================== */
let dlData = null;

// dia aberto (AAAA-MM-DD)
let dlItens = [];

// itens do dia aberto e do dia útil anterior
let dlPresencas = [];

// ids presentes no dia aberto
let dlContagem = {};

// data -> nº de itens (tira de dias)
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

/* =====================================================================
   GESTÃO — EPI e C.A por função
   ===================================================================== */
const EF = {carregado:false, linhas:[], combos:new Map(), cargos:new Map(), itens:new Map(), abertos:new Set(), catalogo:[], aba:"funcoes", lista:"todas", busca:"", sel:null, edit:null};

const efN = normalizarTextoComparacao;

const efChave = (setor, funcao)=>efN(setor)+"|"+efN(funcao);

const EF_CA_OK = /^(\d{3,6}|N\/?A)$/i;

document.addEventListener("click", (e)=>{
  const wrap = document.querySelector(".notif-wrap");
  const dd = document.getElementById("notif-dropdown");
  if(wrap && dd && !wrap.contains(e.target)) dd.style.display = "none";
});

/* ---- Gestão da base de EPI (colaboradores + EPI por função) ---- */
/* =====================================================================
   FICHA DE EPI — módulo dentro da plataforma:
   ficha individual, impressão em lote e novo admitido (fora da base)
   ===================================================================== */
const EPI_FRENTE_LINHAS = 14;

// linhas de lançamento na frente (EPIs da função + linhas em branco)
const EPI_VERSO_LINHAS = 24;

// linhas de lançamento no verso (histórico), antes do desligamento
let EPI_BASE = {colaboradores:[], epis:[], indiceEpis:new Map(), carregada:false, promessa:null};

let fichaEpiIndividual = null;

// {colab, epis, historicoId}
let fichaEpiNovo = null;

/* ---- Novos admitidos por planilha: importação → fila do técnico → baixar (sai da fila sozinha) ---- */
let ADM_PREVIA = [];

let ADM_SEL = new Set();

const ADM_COLUNAS = {
  nome:["NOME","COLABORADOR","NOMECOLABORADOR","NOMECOMPLETO","FUNCIONARIO"],
  loja:["LOJA","UNIDADE","FILIAL"],
  setor:["SETOR","DEPARTAMENTO","AREA"],
  funcao:["FUNCAO","CARGO"],
  admissao:["ADMISSAO","DATAADMISSAO","DATADEADMISSAO"]
};

let ordenacaoSaudeRegistros = {campo:"data_atestado", dir:-1};

/* =====================================================================
   ABSENTEÍSMO — dashboard, importação e categorias (dados reais do Supabase)
   ===================================================================== */
/* =====================================================================
   ABSENTEÍSMO — dashboard, importação e categorias (dados reais do Supabase,
   calculados pela própria plataforma a partir dos registros brutos)
   ===================================================================== */
const ABS_CATEGORIAS = [
  {nome:"Abono dia", cor:"#faa61a"},
  {nome:"Faltas não justificadas", cor:"#ee3135"},
  {nome:"Acidentes de Trabalho", cor:"#981b22"},
  {nome:"Licença Médica", cor:"#00733f"},
  {nome:"Licença Médica Continuada", cor:"#a15a33"}
];

let absCategoriaAtiva = "Todos";

let absMetricaAtiva = "quantidade";

let ordenacaoAbsDetalhe = {campo:"totalDias", dir:-1};

/* =====================================================================
   6B) AGENDA — VISITAS DA EQUIPE, CHECK-IN/OUT, APROVAÇÃO E EXPORTAÇÃO
   ===================================================================== */
let AGENDA = [];

let AGENDA_MOTIVOS = [];

let proxIdAgenda = 1;

let semanaAgendaOffset = 0;

let mesAgendaOffset = 0;

// Cada dia marcado tem uma ou mais entradas {unidade, periodo, motivos[]}: a unidade, o período e as atividades principais daquele dia
let agDiasConfig = {};

/* ---- Local de trabalho / tipos principais de atividade / modal ---- */
const LOCAIS_TRABALHO = ["VILA ABRANTES","DUAL SAÚDE","CD PAVUNA","HOME OFFICE"];

const TIPOS_ATIVIDADE_PRINCIPAIS = ["ADMINISTRATIVO","REUNIÃO","VISITA","AUDITORIA","ATENDIMENTO"];

document.addEventListener("change", e=>{
  const box = e.target.closest && e.target.closest(".av-picker"); if(!box) return;
  avPickerNomes(box.id, box.id.replace(/-lista$|-av$/, "-nome").replace(/^(ag-quem)-nome$/, "ag-quem-nome"));
});

/* ---- Nova visita: seleção de vários dias e período (manhã, tarde ou dia inteiro) ---- */
const PERIODOS_AGENDA = ["Dia inteiro","Manhã","Tarde"];

const PERIODO_ABREV = {"Manhã":"M", "Tarde":"T", "Dia inteiro":"DI"};

const ORDEM_PERIODO_AGENDA = {"Dia inteiro":0, "Manhã":1, "Tarde":2};

const DIAS_SEMANA_ABREV = ["dom","seg","ter","qua","qui","sex","sáb"];

let agTipoAgenda = "visita";

let agDiasSelecionados = new Set();

// datas "AAAA-MM-DD" marcadas no calendário
let agCalMesOffset = 0;

// atividades: uma seleção base vale para todos os dias; "extras" dão outro tipo de atividade a alguns dias
let agMotivosBase = [], agExtras = [], agMenuTipoAberto = null;

document.addEventListener("click", ()=>{ if(agMenuTipoAberto!==null){ agMenuTipoAberto = null; renderChipsDiasAgenda(); } });

/* ---- Painéis da unidade: última visita (motivos) e sugestão de revisita em 30 dias ---- */
const REVISITA_PRAZO_DIAS = 30;

const DIAS_SEMANA_PLURAL = ["domingos","segundas","terças","quartas","quintas","sextas","sábados"];

/* ---- Início: calendário mensal de carga (verde → vermelho; cinza = ausente) ---- */
let inicioCalOffset = 0;

/* ---- Início: lojas que precisam de atenção ---- */
const ATENCAO_ACID_RECENTE_DIAS = 15, ATENCAO_ACID_MUITOS = 3, ATENCAO_ACID_JANELA_DIAS = 90, ATENCAO_LINHAS = 8;

const ATENCAO_ATEST_JANELA_DIAS = 30, ATENCAO_ATEST_MUITOS = 3;

let inicioAtencaoExpandido = false;

let inicioMostrarResolvidos = false;

const ROTULO_REF_AVISO = {agenda:"visita", demanda:"demanda", reuniao:"reunião", calendario:"evento", acidente:"acidentes", epi_admitidos:"fichas de EPI"};

/* =====================================================================
   AGENDA UNIFICADA (antigas Agenda + Calendário): no topo de cada dia o card da visita
   (local de trabalho, check-in/out, tipos principais de atividade) e, abaixo, eventos, reuniões e demandas.
   Privacidade: item "Oculto" (e todo bloqueio) aparece como "Ocupado" para os demais; só o dono,
   quem criou e o Administrador enxergam os detalhes.
   ===================================================================== */
const CAL_TIPOS = {
  "Evento":{cor:"#3b7dd8", curto:"Evento"},
  "Reunião":{cor:"#7a54c7", curto:"Reunião"},
  "Atividade":{cor:"#6b7a90", curto:"Atividade"},
  "Folga":{cor:"#e07b39", curto:"Folga"},
  "Férias":{cor:"#d6457a", curto:"Férias"},
  "Compensação de banco de horas":{cor:"#a8801a", curto:"Banco de horas"},
  "Ausência justificada":{cor:"#8e5bb5", curto:"Aus. justificada"},
  "Bloqueio":{cor:"#5f6368", curto:"Bloqueio"},
  "Ocupado":{cor:"#9aa0a6", curto:"Ocupado"}
};

const CAL_AUSENCIAS = ["Folga","Férias","Compensação de banco de horas","Ausência justificada"];

const CAL_TIPOS_EVENTO = ["Evento","Reunião","Atividade"];

const PERIODO_HORAS = {"Manhã":["08:00","12:00"], "Tarde":["13:00","18:00"], "Dia inteiro":["08:00","18:00"]};

let calModo = "semana", calVista = "tudo", calPessoas = null;

const CAL_ROTULO_STATUS = {livre:"Livre", parcial:"Parcial", ocup:"Ocupado", aus:"Ausente"};

let calReunioesCarregadas = false;

document.addEventListener("click", (e)=>{ if(!e.target.closest("#cal-plus-wrap")) calFecharMenuMais(); });

document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") calFecharMenuMais(); });

// clique no dia abre a janela com os detalhes
document.addEventListener("click", e=>{
  const cel = e.target.closest && e.target.closest("#cal-grade .cal-cel"); if(!cel) return;
  if(e.target.closest("button, a, select, input, [onclick]")) return;
  const iso = cel.dataset.iso; if(!iso) return;
  abrirDiaCal(iso, cel.dataset.uid || null);
});

let diaCalAtual = null;

let diaCalVistos = new Set();

document.addEventListener("keydown", e=>{ if(e.key==="Escape") fecharDiaCal(); });

let convitesAbaAtual = "recebidos";

/* ---- registrar ausência / bloquear a agenda ---- */
let ausModo = "ausencia";

/* ---- Atualização dos dados: automática (a cada 2 min, sem atrapalhar quem está digitando) e manual ---- */
const ATUALIZACAO_AUTO_MS = 120000;

let timerAtualizacao = null, atualizandoDados = false, ultimaAtualizacao = Date.now();

const VIEWS_RECARREGAVEIS_AUTO = ["inicio","agenda","demandas","lancamento","calendario"];

document.addEventListener("visibilitychange", ()=>{
  if(!document.hidden && currentUser && Date.now()-ultimaAtualizacao > 60000) atualizarDados("auto");
});

// Monta as linhas de um dia: cada usuário com uma linha por visita "Dia inteiro" e uma linha dividida para manhã/tarde
const LUZ_VERDE_DIAS = 20, LUZ_AMARELO_DIAS = 45;

// limites da luz de "última visita na unidade": verde ≤20 d, amarela ≤45 d, vermelha >45 d
let agIndiceUnidades = new Map();

let assinaturaTemp = null;

let fotoUsuarioTemp = null;

/* =====================================================================
   8) UTILITÁRIOS
   ===================================================================== */
let toastTimer;

/* =====================================================================
   RELATÓRIO VISTORIAL — lista, checklist, inconformidades, ocorrências, plano de ação, assinatura e PDF
   ===================================================================== */
let VIST_REL = [], VIST_CFG = {tipos:[], riscos:[], gutItens:[], gutClasses:[]};

let VIST_ATUAL = null, VIST_TAB = "checklist", VIST_FILTRO = "todos", VIST_BUSCA = "";

let VIST_ACOES = [], VIST_ACOES_TS = 0, VIST_PDF = null, VIST_JAN = null, vistSaveTimer = null, VIST_LOJAS = null;

const VIST_PRAZOS = [1,7,15,30];

const VIST_STATUS_INC = ["Notificado","Em andamento","Solucionado (a verificar)","Concluído","Não resolvido"];

const VIST_URL_PUBLICA = "https://caiojota.github.io/Platafroma-Lemon/";

const VIST_TOKEN_DIAS = 60;

const VIST_ICO = {
  inc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  oc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>',
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>'
};

const vN = n => String(n).padStart(4,"0");

const vNorm = s => String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/\s+/g," ").trim();

const vEsc = s => escHtml(String(s==null?"":s));

const vHoje = () => dataISOLocal(new Date());

/* ---------- códigos (C / I / O), aparelho, assinatura validada, indicadores ---------- */
const vCod = (o, n)=> (o||"I") + vN(n||0);

let VIST_ITENS = [], VIST_LCARDS = [], VIST_MODO = "rel", VIST_PUN = "", VIST_PAINEL = null, VIST_PFIL = "abertas";

const vistConf = c => { const t = c.C+c.CA+c.NC; return t ? Math.round(c.C/t*100) : 0; };

let vistBuscaTimer = null;

let vistPad = null;

/* =====================================================================
   PÁGINA PÚBLICA DA LOJA (QR Code): token do relatório + matrícula
   ===================================================================== */
const PUB = {un:"", token:"", dados:null};

const PUB_ERROS = {TOKEN_INVALIDO:"Token não encontrado. Confira o código impresso no relatório.", OUTRA_LOJA:"Este token pertence a outra loja.", INDISPONIVEL:"Este relatório ainda não foi emitido.", EXPIRADO:"Este token expirou (validade de 60 dias). Peça um novo ao técnico de segurança.", BLOQUEADO:"Muitas tentativas incorretas. Aguarde alguns minutos e tente de novo.", MATRICULA:"Matrícula não encontrada. Confira o número e tente novamente.", ITEM:"Item não encontrado.", JA_DECLARADO:"Este item já foi informado como solucionado.", FOTO:"A foto da correção é obrigatória."};

document.addEventListener("DOMContentLoaded", ()=>{ if(document.documentElement.classList.contains("pub-mode")) pubIniciar(); });

/* ---------- Gestão › Relatório Vistorial ---------- */
const VG_TABELAS = {
  tipos:{t:"vist_tipos_inconformidade", cfg:"tipos", box:"vg-tipos", ph:"ex.: Infraestrutura"},
  riscos:{t:"vist_riscos", cfg:"riscos", box:"vg-riscos", ph:"ex.: Choque elétrico"}
};

document.addEventListener("DOMContentLoaded", ()=>{
  popularFiltros();
  popularDropdownsLancamento();
  document.getElementById("in-data").valueAsDate = new Date();
});

/* =====================================================================
   SONS — avisos sonoros (Web Audio API, sem arquivos externos)
   Liga/desliga em "Sons" no menu do avatar. Preferência salva por usuário.
   ===================================================================== */
const SOM = (function(){
  let ctx = null, destravado = false;
  const chave = ()=> "lemmon_sons_"+((typeof currentUser!=="undefined" && currentUser && currentUser.id) || "x");
  function ligado(){ try{ return localStorage.getItem(chave())!=="0"; }catch(e){ return true; } }
  function definir(v){ try{ localStorage.setItem(chave(), v?"1":"0"); }catch(e){} atualizarRotulo(); }
  function obterCtx(){
    if(!ctx){ const AC = window.AudioContext||window.webkitAudioContext; if(!AC) return null; try{ ctx = new AC(); }catch(e){ return null; } }
    if(ctx.state==="suspended"){ try{ ctx.resume(); }catch(e){} }
    return ctx;
  }
  // o navegador só libera áudio depois de um toque/clique do usuário
  ["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev, ()=>{ if(!destravado){ destravado = true; obterCtx(); } }, {passive:true}));
  // notas: [frequência Hz, início s, duração s, volume]
  function tocar(notas, tipo){
    if(!ligado()) return;
    const c = obterCtx(); if(!c || c.state!=="running") return;
    const t0 = c.currentTime + 0.02;
    notas.forEach(([f,ini,dur,vol])=>{
      const o = c.createOscillator(), g = c.createGain();
      o.type = tipo||"sine"; o.frequency.value = f;
      const v = vol||0.18;
      g.gain.setValueAtTime(0.0001, t0+ini);
      g.gain.exponentialRampToValueAtTime(v, t0+ini+0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+ini+dur);
      o.connect(g); g.connect(c.destination);
      o.start(t0+ini); o.stop(t0+ini+dur+0.05);
    });
  }
  const SONS = {
    notificacao: ()=>tocar([[988,0,.22],[1319,.16,.38]]),               // sino
    iniciar:     ()=>tocar([[523,0,.14],[659,.11,.14],[784,.22,.3]]),   // sobe
    pausar:      ()=>tocar([[784,0,.14],[523,.12,.3]]),                 // desce
    checkin:     ()=>tocar([[659,0,.14],[880,.12,.34]]),
    checkout:    ()=>tocar([[880,0,.14],[587,.12,.34]]),
    lembrete:    ()=>tocar([[880,0,.18],[880,.28,.18],[1175,.56,.4]]),
    alerta:      ()=>tocar([[330,0,.22,.2],[262,.24,.22,.2],[330,.48,.22,.2],[262,.72,.3,.2]],"triangle"),
    teste:       ()=>tocar([[784,0,.15],[988,.14,.15],[1319,.28,.34]])
  };
  function atualizarRotulo(){
    const el = document.getElementById("ud-sons-chk"); if(el) el.checked = ligado();
  }
  return {tocar:(n)=>{ try{ SONS[n] && SONS[n](); }catch(e){} }, ligado, definir, atualizarRotulo};
})();

// item "Sons" no menu do avatar (interruptor iOS)
(function(){
  const dd = document.getElementById("user-dropdown"); if(!dd || document.getElementById("ud-sons")) return;
  const d = document.createElement("div");
  d.className = "ud-item ud-sons"; d.id = "ud-sons"; d.setAttribute("role","menuitem");
  d.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg><span style="flex:1;">Sons</span><input type="checkbox" class="ios-toggle" id="ud-sons-chk" aria-label="Sons">';
  dd.insertBefore(d, dd.firstChild);
  const chk = d.querySelector("input");
  chk.addEventListener("click", e=>e.stopPropagation());
  chk.addEventListener("change", ()=>{ SOM.definir(chk.checked); if(chk.checked) SOM.tocar("teste"); });
  d.addEventListener("click", e=>{ if(e.target!==chk){ chk.checked = !chk.checked; chk.dispatchEvent(new Event("change")); } e.stopPropagation(); });
  SOM.atualizarRotulo();
})();

// som automático conforme o aviso mostrado na tela
(function(){
  const orig = window.mostrarToast;
  if(typeof orig!=="function") return;
  window.mostrarToast = function(msg){
    try{
      const m = String(msg||"");
      if(/^Você tem \d+ notificaç/.test(m)) SOM.tocar("notificacao");
      else if(/^Cronômetro iniciado/.test(m)) SOM.tocar("iniciar");
      else if(/^Cronômetro pausado/.test(m)) SOM.tocar("pausar");
      else if(/^Check-in registrado/.test(m)) SOM.tocar("checkin");
      else if(/^Check-out registrado/.test(m)) SOM.tocar("checkout");
    }catch(e){}
    return orig.apply(this, arguments);
  };
  try{ mostrarToast = window.mostrarToast; }catch(e){}
})();

// lembretes: eventos/reuniões em até 10 min e demandas vencendo
const LEMBRETES = (function(){
  const avisados = new Set();
  const pad = n=>String(n).padStart(2,"0");
  const isoHoje = d=> d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  function minutosAte(dataIso, hhmm){
    if(!dataIso || !hhmm) return null;
    const [h,mi] = hhmm.split(":").map(Number);
    const [a,me,di] = dataIso.split("-").map(Number);
    return (new Date(a,me-1,di,h,mi,0).getTime() - Date.now())/60000;
  }
  function verificar(){
    if(typeof currentUser==="undefined" || !currentUser) return;
    const hoje = isoHoje(new Date());
    const msgs = [];
    try{
      (CAL_EVENTOS||[]).forEach(e=>{
        if(e.diaInteiro || !e.horaInicio || e.dataInicio!==hoje || e.usuarioId!==currentUser.id) return;
        if(e.tipo==="Bloqueio") return;
        const m = minutosAte(e.dataInicio, e.horaInicio);
        const k = "ev"+e.id+hoje+e.horaInicio;
        if(m!==null && m>0 && m<=10 && !avisados.has(k)){ avisados.add(k); msgs.push("Em "+Math.ceil(m)+" min: "+(e.titulo||"Evento")+" ("+e.horaInicio+")"); }
      });
      (REUNIOES||[]).forEach(r=>{
        if(r.status==="Cancelada" || r.data!==hoje || !r.horaInicio || !(r.participantes||[]).includes(currentUser.id)) return;
        const m = minutosAte(r.data, r.horaInicio);
        const k = "re"+r.id+hoje+r.horaInicio;
        if(m!==null && m>0 && m<=10 && !avisados.has(k)){ avisados.add(k); msgs.push("Reunião em "+Math.ceil(m)+" min: "+(r.titulo||"Reunião")+" ("+r.horaInicio+")"); }
      });
    }catch(e){ console.error("[lembretes]", e); }
    if(msgs.length){ SOM.tocar("lembrete"); mostrarToast(msgs[0]+(msgs.length>1?" (+"+(msgs.length-1)+")":"")); }
  }
  // demandas minhas, não entregues, vencendo hoje/amanhã ou atrasadas — 1 aviso por demanda por dia
  function verificarDemandas(){
    if(typeof currentUser==="undefined" || !currentUser) return;
    try{
      const hoje = isoHoje(new Date()), am = new Date(); am.setDate(am.getDate()+1);
      const amanha = isoHoje(am);
      let ch = "lemmon_dem_aviso_"+currentUser.id+"_"+hoje, ja = [];
      try{ ja = JSON.parse(localStorage.getItem(ch)||"[]"); }catch(e){}
      const novas = (DEMANDAS||[]).filter(d=>d.responsavelUsuarioId===currentUser.id && !d.entregueEm && d.dataLimite && d.dataLimite<=amanha && !ja.includes(d.id));
      if(!novas.length) return;
      const atrasadas = novas.filter(d=>d.dataLimite<hoje).length;
      try{ localStorage.setItem(ch, JSON.stringify(ja.concat(novas.map(d=>d.id)))); }catch(e){}
      SOM.tocar("alerta");
      mostrarToast(novas.length+" demanda"+(novas.length>1?"s":"")+" "+(atrasadas?"vencendo ou atrasada"+(novas.length>1?"s":"")+" ("+atrasadas+" já vencida"+(atrasadas>1?"s":"")+")":"vencendo até amanhã")+".");
    }catch(e){ console.error("[lembretes demandas]", e); }
  }
  setInterval(verificar, 30000);
  setInterval(verificarDemandas, 300000);
  setTimeout(verificarDemandas, 8000);
  return {verificar, verificarDemandas};
})();

