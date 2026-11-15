/* =====================================================================
   ABSENTEÍSMO — dashboard, importação e categorias
   ===================================================================== */

// Função do módulo: regional da loja
function regionalDaLoja(loja){
  const u = UNIDADES.find(x => normalizarTextoComparacao(x.nome)===normalizarTextoComparacao(loja));
  return u ? (u.regional || null) : null;
}

// Função do módulo: categoria do tipo ausencia
function categoriaDoTipoAusencia(tipo){
  const c = ABSENTEISMO_CATEGORIAS.find(x => x.tipoAusencia===tipo);
  return c ? c.categoria : null;
}

// Inicializa: init absenteismo
function initAbsenteismo(){
  renderCategoriaPillsAbsenteismo();
  renderMetricaPillsAbsenteismo();
  popularFiltrosAbsenteismo();
  renderAbsenteismoVisaoGeral();
}

// Troca para a sub-tela: mostrar sub absenteismo
function mostrarSubAbsenteismo(sub){
  document.querySelectorAll("#view-absenteismo .insp-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('#view-absenteismo .insp-tab[data-sub="'+sub+'"]').classList.add("active");
  document.querySelectorAll("#view-absenteismo .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("absenteismo-sub-"+sub).classList.add("active");
  if(sub==="visao") renderAbsenteismoVisaoGeral();
  else if(sub==="mensal") renderAbsenteismoMensal();
  else { popularFiltroTipoAbsenteismo(); renderAbsenteismoDetalheTabela(); }
}

// Desenha na tela: render categoria pills absenteismo
function renderCategoriaPillsAbsenteismo(){
  const wrap = document.getElementById("abs-categoria-pills");
  if(!wrap) return;
  const opcoes = ["Todos", ...ABS_CATEGORIAS.map(c=>c.nome)];
  wrap.innerHTML = opcoes.map(c=>`<button type="button" class="sw-btn ${absCategoriaAtiva===c?'ativo sw-aprovado':''}" onclick='selecionarCategoriaAbsenteismo(${JSON.stringify(c)})'>${c}</button>`).join("");
}

// Desenha na tela: render metrica pills absenteismo
function renderMetricaPillsAbsenteismo(){
  const wrap = document.getElementById("abs-metrica-pills");
  if(!wrap) return;
  const opcoes = [["quantidade","Quantidade"],["dias","Dias"]];
  wrap.innerHTML = opcoes.map(([v,rotulo])=>`<button type="button" class="sw-btn ${absMetricaAtiva===v?'ativo sw-aprovado':''}" onclick='selecionarMetricaAbsenteismo(${JSON.stringify(v)})'>${rotulo}</button>`).join("");
}

// Função do módulo: selecionar categoria absenteismo
function selecionarCategoriaAbsenteismo(c){
  absCategoriaAtiva = c;
  renderCategoriaPillsAbsenteismo();
  renderAbsenteismoVisaoGeral();
}

// Função do módulo: selecionar metrica absenteismo
function selecionarMetricaAbsenteismo(m){
  absMetricaAtiva = m;
  renderMetricaPillsAbsenteismo();
  renderAbsenteismoVisaoGeral();
}

// Preenche: popular filtros absenteismo
function popularFiltrosAbsenteismo(){
  fillSelect("abs-f-loja", [...new Set(ABSENTEISMO.map(a=>a.loja).filter(Boolean))].sort());
  fillSelect("abs-f-setor", [...new Set(ABSENTEISMO.map(a=>a.setor).filter(Boolean))].sort());
  fillSelect("abs-f-regional", [...new Set(UNIDADES.map(u=>u.regional).filter(Boolean))].sort());
}

// Preenche: popular filtro tipo absenteismo
function popularFiltroTipoAbsenteismo(){
  fillSelect("abs-reg-tipo", [...new Set(ABSENTEISMO.map(a=>a.tipoAusencia).filter(Boolean))].sort());
}

// Limpa: limpar filtros absenteismo
function limparFiltrosAbsenteismo(){
  ["abs-f-loja","abs-f-setor","abs-f-regional","abs-f-de","abs-f-ate"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
  renderAbsenteismoVisaoGeral();
}

// Função do módulo: dados filtrados absenteismo base
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

// Função do módulo: soma ou contagem
function somaOuContagem(lista){
  return absMetricaAtiva==="dias" ? lista.reduce((s,a)=>s+(Number(a.dias)||0), 0) : lista.length;
}

// Desenha na tela: render grafico contagem absenteismo
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

// Desenha na tela: render absenteismo visao geral
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

// Função do módulo: mes da data
function mesDaData(iso){
  if(!iso) return null;
  return iso.slice(0,7)+"-01";
}

// Desenha na tela: render absenteismo mensal
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

// Ordena a lista de: ordenar absenteismo detalhe
function ordenarAbsenteismoDetalhe(campo){
  if(ordenacaoAbsDetalhe.campo===campo) ordenacaoAbsDetalhe.dir *= -1;
  else ordenacaoAbsDetalhe = {campo, dir:1};
  renderAbsenteismoDetalheTabela();
}

// Função do módulo: agregado por loja setor
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

// Desenha na tela: render absenteismo detalhe tabela
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

// Função do módulo: normalizar texto absenteismo
/* ---- Gestão de Absenteísmo: importação do relatório BRUTO + mapeamento de categorias ---- */
function normalizarTextoAbsenteismo(s){
  return (s||"").toString().trim();
}

// Inicializa: init gestao absenteismo
function initGestaoAbsenteismo(){
  document.getElementById("abs-kpi-total-base").textContent = ABSENTEISMO.length;
  renderTabelaCategoriasAbsenteismo();
}

// Desenha na tela: render tabela categorias absenteismo
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

// Atualiza: atualizar categoria absenteismo
async function atualizarCategoriaAbsenteismo(id, categoria){
  const { error } = await sb.from("absenteismo_categorias").update({categoria: categoria||null}).eq("id", id);
  if(error){ alert("Erro ao atualizar categoria: "+error.message); return; }
  const item = ABSENTEISMO_CATEGORIAS.find(c=>c.id===id);
  if(item) item.categoria = categoria || null;
  mostrarToast("Categoria atualizada.");
}

// Função do módulo: importar absenteismo bruto
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

