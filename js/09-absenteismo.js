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

function regionalDaLoja(loja){
  const u = UNIDADES.find(x => normalizarTextoComparacao(x.nome)===normalizarTextoComparacao(loja));
  return u ? (u.regional || null) : null;
}
function categoriaDoTipoAusencia(tipo){
  const c = ABSENTEISMO_CATEGORIAS.find(x => x.tipoAusencia===tipo);
  return c ? c.categoria : null;
}
function initAbsenteismo(){
  renderCategoriaPillsAbsenteismo();
  renderMetricaPillsAbsenteismo();
  popularFiltrosAbsenteismo();
  renderAbsenteismoVisaoGeral();
}
function mostrarSubAbsenteismo(sub){
  document.querySelectorAll("#view-absenteismo .insp-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('#view-absenteismo .insp-tab[data-sub="'+sub+'"]').classList.add("active");
  document.querySelectorAll("#view-absenteismo .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("absenteismo-sub-"+sub).classList.add("active");
  if(sub==="visao") renderAbsenteismoVisaoGeral();
  else if(sub==="mensal") renderAbsenteismoMensal();
  else { popularFiltroTipoAbsenteismo(); renderAbsenteismoDetalheTabela(); }
}
function renderCategoriaPillsAbsenteismo(){
  const wrap = document.getElementById("abs-categoria-pills");
  if(!wrap) return;
  const opcoes = ["Todos", ...ABS_CATEGORIAS.map(c=>c.nome)];
  wrap.innerHTML = opcoes.map(c=>`<button type="button" class="sw-btn ${absCategoriaAtiva===c?'ativo sw-aprovado':''}" onclick='selecionarCategoriaAbsenteismo(${JSON.stringify(c)})'>${c}</button>`).join("");
}
function renderMetricaPillsAbsenteismo(){
  const wrap = document.getElementById("abs-metrica-pills");
  if(!wrap) return;
  const opcoes = [["quantidade","Quantidade"],["dias","Dias"]];
  wrap.innerHTML = opcoes.map(([v,rotulo])=>`<button type="button" class="sw-btn ${absMetricaAtiva===v?'ativo sw-aprovado':''}" onclick='selecionarMetricaAbsenteismo(${JSON.stringify(v)})'>${rotulo}</button>`).join("");
}
function selecionarCategoriaAbsenteismo(c){
  absCategoriaAtiva = c;
  renderCategoriaPillsAbsenteismo();
  renderAbsenteismoVisaoGeral();
}
function selecionarMetricaAbsenteismo(m){
  absMetricaAtiva = m;
  renderMetricaPillsAbsenteismo();
  renderAbsenteismoVisaoGeral();
}
function popularFiltrosAbsenteismo(){
  fillSelect("abs-f-loja", [...new Set(ABSENTEISMO.map(a=>a.loja).filter(Boolean))].sort());
  fillSelect("abs-f-setor", [...new Set(ABSENTEISMO.map(a=>a.setor).filter(Boolean))].sort());
  fillSelect("abs-f-regional", [...new Set(UNIDADES.map(u=>u.regional).filter(Boolean))].sort());
}
function popularFiltroTipoAbsenteismo(){
  fillSelect("abs-reg-tipo", [...new Set(ABSENTEISMO.map(a=>a.tipoAusencia).filter(Boolean))].sort());
}
function limparFiltrosAbsenteismo(){
  ["abs-f-loja","abs-f-setor","abs-f-regional","abs-f-de","abs-f-ate"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
  renderAbsenteismoVisaoGeral();
}
function dadosFiltradosAbsenteismoBase(){
  const loja = document.getElementById("abs-f-loja")?.value;
  const setor = document.getElementById("abs-f-setor")?.value;
  const regional = document.getElementById("abs-f-regional")?.value;
  const de = document.getElementById("abs-f-de")?.value;
  const ate = document.getElementById("abs-f-ate")?.value;
  return ABSENTEISMO.filter(a=>{
    if(loja && a.loja!==loja) return false;
    if(setor && a.setor!==setor) return false;
    if(regional && regionalDaLoja(a.loja)!==regional) return false;
    if(de && (!a.dataInicio || a.dataInicio<de)) return false;
    if(ate && (!a.dataInicio || a.dataInicio>ate)) return false;
    return true;
  });
}
function somaOuContagem(lista){
  return absMetricaAtiva==="dias" ? lista.reduce((s,a)=>s+(Number(a.dias)||0), 0) : lista.length;
}
function renderGraficoContagemAbsenteismo(key, canvasId, dados, chaveFn, top, cor){
  const agrupado = {};
  dados.forEach(a=>{
    const k = chaveFn(a) || "Não mapeado";
    if(!agrupado[k]) agrupado[k] = [];
    agrupado[k].push(a);
  });
  const rotuloSerie = absMetricaAtiva==="dias" ? "Dias" : "Registros";
  const ordenado = Object.entries(agrupado).map(([k,lista])=>[k, somaOuContagem(lista)]).sort((a,b)=>b[1]-a[1]).slice(0, top);
  criarChart(key, canvasId, {
    type:"bar",
    data:{ labels: ordenado.map(o=>o[0]), datasets:[{label:rotuloSerie, data:ordenado.map(o=>Number(o[1].toFixed ? o[1].toFixed(1) : o[1])), backgroundColor:cor, borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });
}
function renderAbsenteismoVisaoGeral(){
  const dadosBase = dadosFiltradosAbsenteismoBase();
  const rotuloMetrica = absMetricaAtiva==="dias" ? "dia(s) no período/filtro" : "registro(s) no período/filtro";

  const kpiRow = document.getElementById("abs-kpi-row");
  if(kpiRow){
    kpiRow.innerHTML = ABS_CATEGORIAS.map((cat,i)=>{
      const valor = somaOuContagem(dadosBase.filter(a=>categoriaDoTipoAusencia(a.tipoAusencia)===cat.nome));
      const classes = ["k1","k2","k4","k5","k2"];
      return `<div class="kpi ${classes[i]}" style="cursor:pointer;" onclick='selecionarCategoriaAbsenteismo(${JSON.stringify(cat.nome)})'><div class="lbl">${cat.nome}</div><div class="val">${valor}</div><span class="foot">${rotuloMetrica} · clique para detalhar</span></div>`;
    }).join("");
  }

  const dadosGrafico = absCategoriaAtiva==="Todos"
    ? dadosBase.filter(a=> ABS_CATEGORIAS.some(c=>c.nome===categoriaDoTipoAusencia(a.tipoAusencia)))
    : dadosBase.filter(a=> categoriaDoTipoAusencia(a.tipoAusencia)===absCategoriaAtiva);

  const sufixo = (absCategoriaAtiva!=="Todos" ? " — "+absCategoriaAtiva : " — todos os indicadores") + (absMetricaAtiva==="dias" ? " (em dias)" : " (em registros)");
  document.getElementById("abs-titulo-loja").textContent = "Por loja"+sufixo;
  document.getElementById("abs-titulo-setor").textContent = "Por setor"+sufixo;
  document.getElementById("abs-titulo-regional").textContent = "Por regional"+sufixo;

  renderGraficoContagemAbsenteismo("absLoja", "chart-abs-loja", dadosGrafico, a=>a.loja, 12, "#00733f");
  renderGraficoContagemAbsenteismo("absSetor", "chart-abs-setor", dadosGrafico, a=>a.setor, 12, "#faa61a");
  renderGraficoContagemAbsenteismo("absRegional", "chart-abs-regional", dadosGrafico, a=>regionalDaLoja(a.loja), 10, "#ee3135");

  const porLoja = {};
  dadosGrafico.forEach(a=>{
    if(!porLoja[a.loja]) porLoja[a.loja] = {registros:0, dias:0};
    porLoja[a.loja].registros += 1;
    porLoja[a.loja].dias += Number(a.dias)||0;
  });
  const rankingOrdenado = Object.entries(porLoja).sort((a,b)=>a[1].dias-b[1].dias);
  const tbodyRanking = document.getElementById("tbl-abs-ranking");
  if(tbodyRanking){
    tbodyRanking.innerHTML = rankingOrdenado.map(([loja,v],idx)=>`
      <tr><td>${idx+1}</td><td>${loja}</td><td>${v.registros}</td><td>${v.dias.toFixed(1)}</td><td>${v.registros? (v.dias/v.registros).toFixed(2) : "0"}</td></tr>
    `).join("") || '<tr><td colspan="5" style="text-align:center; padding:14px; color:var(--areia-esc);">Nenhum dado.</td></tr>';
  }
}
function mesDaData(iso){
  if(!iso) return null;
  return iso.slice(0,7)+"-01";
}
function renderAbsenteismoMensal(){
  const porMes = {};
  ABSENTEISMO.forEach(a=>{
    const cat = categoriaDoTipoAusencia(a.tipoAusencia);
    if(!cat) return;
    const mes = mesDaData(a.dataInicio);
    if(!mes) return;
    if(!porMes[mes]) porMes[mes] = {};
    porMes[mes][cat] = (porMes[mes][cat]||0)+1;
  });
  const meses = Object.keys(porMes).sort();

  criarChart("absMensal", "chart-abs-mensal", {
    type:"line",
    data:{
      labels: meses.map(m=> new Date(m+"T00:00:00").toLocaleDateString("pt-BR",{month:"short", year:"2-digit"})),
      datasets: ABS_CATEGORIAS.map(cat=>({
        label: cat.nome, data: meses.map(m=>porMes[m][cat.nome]||0), borderColor: cat.cor, backgroundColor: cat.cor, tension:.3, fill:false
      }))
    },
    options:{plugins:{legend:{position:"bottom", labels:{font:{size:10}}}}, scales:{y:{beginAtZero:true}}}
  });
  const tbody = document.getElementById("tbl-abs-mensal");
  if(tbody){
    tbody.innerHTML = meses.map(m=>{
      const linha = ABS_CATEGORIAS.map(cat=>porMes[m][cat.nome]||0);
      const total = linha.reduce((s,v)=>s+v,0);
      return `<tr>
        <td>${new Date(m+"T00:00:00").toLocaleDateString("pt-BR",{month:"long", year:"numeric"})}</td>
        ${linha.map(v=>`<td>${v}</td>`).join("")}
        <td><b>${total}</b></td>
      </tr>`;
    }).join("") || '<tr><td colspan="7" style="text-align:center; padding:14px; color:var(--areia-esc);">Nenhum dado.</td></tr>';
  }
}
let ordenacaoAbsDetalhe = {campo:"totalDias", dir:-1};
function ordenarAbsenteismoDetalhe(campo){
  if(ordenacaoAbsDetalhe.campo===campo) ordenacaoAbsDetalhe.dir *= -1;
  else ordenacaoAbsDetalhe = {campo, dir:1};
  renderAbsenteismoDetalheTabela();
}
function agregadoPorLojaSetor(){
  const agrupado = {};
  ABSENTEISMO.forEach(a=>{
    const chave = a.loja+"|"+a.setor;
    if(!agrupado[chave]) agrupado[chave] = {loja:a.loja, setor:a.setor, porCategoria:{}, totalAusencias:0, totalDias:0};
    const acc = agrupado[chave];
    const cat = categoriaDoTipoAusencia(a.tipoAusencia);
    if(cat) acc.porCategoria[cat] = (acc.porCategoria[cat]||0)+1;
    acc.totalAusencias += 1;
    acc.totalDias += Number(a.dias)||0;
  });
  return Object.values(agrupado).map(d=>({
    ...d,
    mediaDias: d.totalAusencias ? d.totalDias/d.totalAusencias : 0
  }));
}
function renderAbsenteismoDetalheTabela(){
  const tbody = document.getElementById("tbl-abs-detalhe");
  if(!tbody) return;
  const busca = (document.getElementById("abs-busca")?.value||"").trim().toLowerCase();
  let linhas = agregadoPorLojaSetor().filter(d=>{
    if(!busca) return true;
    return (d.loja+" "+d.setor).toLowerCase().includes(busca);
  });
  const {campo, dir} = ordenacaoAbsDetalhe;
  linhas = linhas.slice().sort((a,b)=>{
    let va = campo==="loja"||campo==="setor" ? a[campo] : (a[campo] ?? 0);
    let vb = campo==="loja"||campo==="setor" ? b[campo] : (b[campo] ?? 0);
    if(typeof va === "string"){ va=va.toLowerCase(); vb=(vb||"").toLowerCase(); }
    if(va<vb) return -1*dir;
    if(va>vb) return 1*dir;
    return 0;
  });
  const contador = document.getElementById("abs-reg-contador");
  if(contador) contador.textContent = linhas.length+" combinação(ões) loja+setor.";
  if(!linhas.length){
    tbody.innerHTML = `<tr><td colspan="10"><div class="lista-vazio"><b>Nenhum resultado</b>Ajuste a busca ou importe os dados em Gestão › Absenteísmo.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = linhas.map(d=>`<tr>
    <td class="col-sticky" style="min-width:200px; max-width:260px;">${d.loja}</td>
    <td>${d.setor}</td>
    <td>${d.porCategoria["Abono dia"]||0}</td>
    <td>${d.porCategoria["Acidentes de Trabalho"]||0}</td>
    <td>${d.porCategoria["Faltas não justificadas"]||0}</td>
    <td>${d.porCategoria["Licença Médica"]||0}</td>
    <td>${d.porCategoria["Licença Médica Continuada"]||0}</td>
    <td><b>${d.totalAusencias}</b></td>
    <td>${d.totalDias.toFixed(1)}</td>
    <td>${d.mediaDias.toFixed(2)}</td>
  </tr>`).join("");
}

/* ---- Gestão de Absenteísmo: importação do relatório BRUTO + mapeamento de categorias ---- */
function normalizarTextoAbsenteismo(s){
  return (s||"").toString().trim();
}
function initGestaoAbsenteismo(){
  document.getElementById("abs-kpi-total-base").textContent = ABSENTEISMO.length;
  renderTabelaCategoriasAbsenteismo();
}
function renderTabelaCategoriasAbsenteismo(){
  const tbody = document.getElementById("tbl-abs-categorias");
  if(!tbody) return;
  const ordenado = ABSENTEISMO_CATEGORIAS.slice().sort((a,b)=> (a.categoria?0:1)-(b.categoria?0:1) || a.tipoAusencia.localeCompare(b.tipoAusencia));
  tbody.innerHTML = ordenado.map(c=>`
    <tr>
      <td>${c.tipoAusencia}</td>
      <td><select onchange="atualizarCategoriaAbsenteismo(${c.id}, this.value)">
        <option value="">Sem categoria</option>
        ${ABS_CATEGORIAS.map(cat=>`<option value="${cat.nome}" ${c.categoria===cat.nome?"selected":""}>${cat.nome}</option>`).join("")}
      </select></td>
    </tr>
  `).join("") || '<tr><td colspan="2" style="text-align:center; padding:14px; color:var(--areia-esc);">Importe uma planilha para ver os tipos de ausência encontrados.</td></tr>';
}
async function atualizarCategoriaAbsenteismo(id, categoria){
  const { error } = await sb.from("absenteismo_categorias").update({categoria: categoria||null}).eq("id", id);
  if(error){ alert("Erro ao atualizar categoria: "+error.message); return; }
  const item = ABSENTEISMO_CATEGORIAS.find(c=>c.id===id);
  if(item) item.categoria = categoria || null;
  mostrarToast("Categoria atualizada.");
}
async function importarAbsenteismoBruto(){
  const input = document.getElementById("abs-import-file");
  const status = document.getElementById("abs-import-status");
  const file = input.files[0];
  if(!file){ status.style.color="var(--vermelho)"; status.textContent = "Selecione um arquivo primeiro."; return; }
  status.style.color = "var(--areia-esc)";
  status.textContent = "Lendo o arquivo...";
  try{
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {type:"array", cellDates:true});
    const nomeAba = wb.SheetNames.includes("GERAL") ? "GERAL" : wb.SheetNames[0];
    const linhas = XLSX.utils.sheet_to_json(wb.Sheets[nomeAba], {header:1, defval:null});
    if(!linhas.length){ status.style.color="var(--vermelho)"; status.textContent = "A planilha está vazia."; return; }

    const registrosBrutos = linhas.slice(1).filter(r=> r[17]); // "Tipo de ausência ou presença" preenchido
    status.textContent = "Processando "+registrosBrutos.length+" linha(s)...";

    // canoniza a grafia de loja/setor GLOBALMENTE (corrige inconsistências de maiúscula/minúscula e acentuação
    // que existem na exportação original, ex.: "Adm cafe/lanchonete" vs "Adm Café/Lanchonete")
    const pesoLoja = {}, pesoSetor = {};
    registrosBrutos.forEach(r=>{
      const loja = normalizarTextoAbsenteismo(r[5]), setor = normalizarTextoAbsenteismo(r[13]);
      const chaveLoja = normalizarTextoComparacao(loja), chaveSetor = normalizarTextoComparacao(setor);
      if(loja){ pesoLoja[chaveLoja] = pesoLoja[chaveLoja]||{}; pesoLoja[chaveLoja][loja] = (pesoLoja[chaveLoja][loja]||0)+1; }
      if(setor){ pesoSetor[chaveSetor] = pesoSetor[chaveSetor]||{}; pesoSetor[chaveSetor][setor] = (pesoSetor[chaveSetor][setor]||0)+1; }
    });
    const canonLoja = {}, canonSetor = {};
    Object.entries(pesoLoja).forEach(([k,v])=>{ canonLoja[k] = Object.entries(v).sort((a,b)=>b[1]-a[1])[0][0]; });
    Object.entries(pesoSetor).forEach(([k,v])=>{ canonSetor[k] = Object.entries(v).sort((a,b)=>b[1]-a[1])[0][0]; });

    // deduplicar por chave natural
    const vistos = new Set();
    const registros = [];
    registrosBrutos.forEach(r=>{
      const matricula = r[0]!=null ? String(r[0]).trim() : null;
      if(!matricula) return;
      const dataInicio = normalizarDataImportacao(r[20]);
      const dataFim = normalizarDataImportacao(r[21]);
      const tipo = String(r[17]).trim();
      const dias = Number(r[18])||0;
      const chave = matricula+"|"+tipo+"|"+dataInicio+"|"+dataFim+"|"+dias;
      if(vistos.has(chave)) return;
      vistos.add(chave);
      const lojaBruta = normalizarTextoAbsenteismo(r[5]), setorBruto = normalizarTextoAbsenteismo(r[13]);
      registros.push({
        matricula, nome: r[1]||null,
        loja: canonLoja[normalizarTextoComparacao(lojaBruta)] || lojaBruta || null,
        setor: canonSetor[normalizarTextoComparacao(setorBruto)] || setorBruto || null,
        funcao: r[16]||null, tipo_ausencia: tipo, dias, horas: Number(r[19])||0,
        data_inicio: dataInicio, data_fim: dataFim
      });
    });

    if(!registros.length){
      status.style.color = "var(--vermelho)";
      status.textContent = 'Nenhuma linha com "Tipo de ausência ou presença" preenchido foi encontrada.';
      return;
    }

    const tiposConhecidos = new Set(ABSENTEISMO_CATEGORIAS.map(c=>c.tipoAusencia));
    const tiposNovos = [...new Set(registros.map(r=>r.tipo_ausencia))].filter(t=>!tiposConhecidos.has(t));
    if(tiposNovos.length){
      const { data: catsNovas, error: eCat } = await sb.from("absenteismo_categorias").insert(tiposNovos.map(t=>({tipo_ausencia:t, categoria:null}))).select();
      if(!eCat && catsNovas) ABSENTEISMO_CATEGORIAS = ABSENTEISMO_CATEGORIAS.concat(catsNovas.map(c=>({id:c.id, tipoAusencia:c.tipo_ausencia, categoria:c.categoria})));
    }

    const LOTE = 500;
    let inseridos = 0, ignorados = 0;
    for(let i=0; i<registros.length; i+=LOTE){
      const lote = registros.slice(i, i+LOTE);
      status.textContent = "Importando... "+Math.min(i+LOTE, registros.length)+" de "+registros.length;
      const { data, error } = await sb.from("absenteismo")
        .upsert(lote, {onConflict: "matricula,tipo_ausencia,data_inicio,data_fim,dias", ignoreDuplicates: true})
        .select();
      if(error){ status.style.color="var(--vermelho)"; status.textContent = "Erro ao importar (parou em "+inseridos+" registros): "+error.message; return; }
      const novos = data||[];
      inseridos += novos.length;
      ignorados += lote.length - novos.length;
      novos.forEach(a=>{
        ABSENTEISMO.push({
          id:a.id, matricula:a.matricula, nome:a.nome, loja:a.loja, setor:a.setor, funcao:a.funcao,
          tipoAusencia:a.tipo_ausencia, dias:Number(a.dias)||0, horas:Number(a.horas)||0,
          dataInicio:a.data_inicio, dataFim:a.data_fim
        });
      });
    }

    status.style.color = "var(--verde-esc)";
    status.textContent = inseridos+" registro(s) novo(s) importado(s). "+ignorados+" já existiam na base e foram descartados automaticamente.";
    input.value = "";
    document.getElementById("abs-kpi-total-base").textContent = ABSENTEISMO.length;
    renderTabelaCategoriasAbsenteismo();
  }catch(e){
    status.style.color = "var(--vermelho)";
    status.textContent = "Erro ao processar o arquivo: "+e.message;
  }
}

function initGestao(){
  renderUsuarios();
  renderUnidades();
  renderEstrutura();
  renderAuditoria();
}

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
function cancelarInspecaoAtual(){
  if(!confirm("Cancelar esta inspeção? Os dados preenchidos (ainda não gerados em PDF) serão perdidos.")) return;
  inspecaoAtiva = null;
  document.getElementById("insp-form-ativo").style.display = "none";
  document.getElementById("insp-picker-unidade").style.display = "block";
}

/* ---- Classificação da Matriz GUT ---- */
function classificarGUT(score){
  if(score>=80) return {classe:"alto", label:"Alto Risco"};
  if(score>=40) return {classe:"medio", label:"Risco Médio"};
  if(score>=20) return {classe:"baixo", label:"Baixo Risco"};
  return {classe:"obs", label:"Observação"};
}
function tagGUT(score){
  const c = classificarGUT(score);
  return `<span class="tag-gut ${c.classe}">${c.label} (${score})</span>`;
}
function classeStatus(status){
  return status==="Notificado" ? "notificado"
       : status==="Não iniciado" ? "naoiniciado"
       : status==="Em Andamento" ? "andamento"
       : "concluido";
}
function tagStatus(status){
  return `<span class="tag-status ${classeStatus(status)}">${status}</span>`;
}

/* ---- Parte 1: checklist geral da loja ---- */
function montarChecklistGeral(){
  checklistGeralAtual = CHECKLIST_ITENS_CONFIG.slice().sort((a,b)=>a.ordem-b.ordem).map(cfg=>({
    id: cfg.id, itemConfigId: cfg.id, grupoId: cfg.grupoId,
    titulo: cfg.titulo, descricao: cfg.descricao, requerEvidencia: cfg.requerEvidencia,
    status: null, foto: null
  }));
}
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
function checklistTemEvidenciasPendentes(){
  return checklistGeralAtual.some(item=> item.requerEvidencia && (item.status==='PC'||item.status==='NC') && !item.foto);
}
function setStatusChecklistGeral(id, status){
  const it = checklistGeralAtual.find(i=>i.id===id);
  if(it) it.status = status;
  renderChecklistGeral();
}
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
function removerFotoChecklistGeral(id){
  const it = checklistGeralAtual.find(i=>i.id===id);
  if(it){ it.foto = null; renderChecklistGeral(); }
}

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
function fecharModalItemInspecao(){
  document.getElementById("modal-item-inspecao").style.display = "none";
}
function atualizarPreviewDataLimite(){
  const dataStr = document.getElementById("insp-data").value || new Date().toISOString().slice(0,10);
  const prazo = Number(document.getElementById("it-prazo").value)||0;
  const d = new Date(dataStr+"T00:00:00");
  d.setDate(d.getDate()+prazo);
  document.getElementById("it-data-limite-preview").value = d.toLocaleDateString("pt-BR");
}
function atualizarPreviewGUT(){
  const g = Number(document.getElementById("it-g").value);
  const u = Number(document.getElementById("it-u").value);
  const t = Number(document.getElementById("it-t").value);
  document.getElementById("gut-preview").innerHTML = tagGUT(g*u*t);
}
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
function removerItemAtual(numero){
  if(!confirm("Remover este item da inspeção atual?")) return;
  itensInspecaoAtual = itensInspecaoAtual.filter(i=>i.numero!==numero);
  renderItensInspecao();
}
function atualizarStatusItemAtual(numero, status){
  const it = itensInspecaoAtual.find(i=>i.numero===numero);
  if(it) it.status = status;
  renderItensInspecao();
}
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

/* ---- Parte 3: ocorrências ---- */
function popularTiposOcorrencia(){
  const sel = document.getElementById("oc-tipo");
  if(!sel) return;
  sel.innerHTML = OCORRENCIAS_TIPOS.length
    ? OCORRENCIAS_TIPOS.slice().sort((a,b)=>a.ordem-b.ordem).map(t=>`<option>${t.valor}</option>`).join("")
    : '<option value="">Nenhum tipo cadastrado</option>';
}
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
function removerOcorrencia(idx){
  ocorrenciasAtual.splice(idx,1);
  renderOcorrencias();
}
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

/* ---- Assinatura ---- */
function atualizarStatusAssinatura(){
  assinaturaConfirmada = false;
  assinaturaTimestamp = null;
  assinaturaGeo = null;
  const box = document.getElementById("assinatura-status-box");
  if(box){ box.textContent = "Relatório ainda não assinado."; box.classList.remove("ok"); }
}
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
function fecharModalInspecao(){
  document.getElementById("modal-inspecao").style.display = "none";
}

