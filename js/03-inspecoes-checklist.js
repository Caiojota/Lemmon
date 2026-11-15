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

let inspecaoAtiva = null;      // {unidade} — preenchido só depois de "Iniciar nova inspeção"
let checklistGeralAtual = [];  // Parte 1: itens fixos {id, texto, status, foto}
let proxNumeroItem = 1;        // numeração global e sequencial dos itens da Parte 2 (nunca reinicia)
let itensInspecaoAtual = [];   // Parte 2: itens já adicionados na inspeção em andamento
let fotoItemTemp = null;       // foto do item que está sendo cadastrado no modal (Parte 2)
let ocorrenciasAtual = [];     // Parte 3: ocorrências registradas na inspeção em andamento
let assinaturaConfirmada = false;
let assinaturaTimestamp = null;
let assinaturaGeo = null;
let INSPECOES = [];            // histórico leve: todos os campos, exceto fotos
let proxIdInspecao = 1;

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

function mostrarSubInspecao(sub){
  document.querySelectorAll("#view-inspecoes .insp-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('#view-inspecoes .insp-tab[data-sub="'+sub+'"]').classList.add("active");
  document.querySelectorAll("#view-inspecoes .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("insp-sub-"+sub).classList.add("active");
  if(sub==="pendencias") renderPendencias();
  if(sub==="historico") renderHistoricoInspecoes();
}

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
