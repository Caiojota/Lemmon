/* =====================================================================
   DASHBOARD DE ACIDENTES E INCIDENTES — filtros, KPIs, gráficos, lançamento manual e upload de Excel
   ===================================================================== */

// Preenche: popular filtros
function popularFiltros(){
  const unidades = [...new Set(ACIDENTES.map(a=>a.loja))].sort();
  const regionais = [...new Set(ACIDENTES.map(a=>a.regional).filter(Boolean))].sort();
  const pracas = [...new Set(ACIDENTES.map(a=>a.praca))].sort();
  const negocios = [...new Set(ACIDENTES.map(a=>a.negocio))].sort();
  const tipos = [...new Set(ACIDENTES.map(a=>a.tipo))].sort();
  fillSelect("f-unidade", unidades);
  fillSelect("f-regional", regionais);
  fillSelect("f-praca", pracas);
  fillSelect("f-negocio", negocios);
  fillSelect("f-tipo", tipos);
}

// Função do módulo: fill select
function fillSelect(id, arr){
  const sel = document.getElementById(id);
  if(!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todos</option>';
  arr.forEach(v=>{ const o=document.createElement("option"); o.value=v; o.textContent=v; sel.appendChild(o); });
  sel.value = atual || "";
}

// Função do módulo: clear filters
function clearFilters(){
  ["f-unidade","f-regional","f-praca","f-negocio","f-tipo"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("f-de").value=""; document.getElementById("f-ate").value="";
  atualizarDashboard();
}

// Função do módulo: dados filtrados
function dadosFiltrados(){
  const unidade = document.getElementById("f-unidade").value;
  const regional = document.getElementById("f-regional").value;
  const praca = document.getElementById("f-praca").value;
  const negocio = document.getElementById("f-negocio").value;
  const tipo = document.getElementById("f-tipo").value;
  const de = document.getElementById("f-de").value;
  const ate = document.getElementById("f-ate").value;
  return ACIDENTES.filter(a=>{
    if(unidade && a.loja!==unidade) return false;
    if(regional && a.regional!==regional) return false;
    if(praca && a.praca!==praca) return false;
    if(negocio && a.negocio!==negocio) return false;
    if(tipo && a.tipo!==tipo) return false;
    if(de && a.data < de) return false;
    if(ate && a.data > ate) return false;
    return true;
  });
}

// Função do módulo: dados filtrados sem tipo
function dadosFiltradosSemTipo(){
  const unidade = document.getElementById("f-unidade").value;
  const regional = document.getElementById("f-regional").value;
  const praca = document.getElementById("f-praca").value;
  const negocio = document.getElementById("f-negocio").value;
  const de = document.getElementById("f-de").value;
  const ate = document.getElementById("f-ate").value;
  return ACIDENTES.filter(a=>{
    if(unidade && a.loja!==unidade) return false;
    if(regional && a.regional!==regional) return false;
    if(praca && a.praca!==praca) return false;
    if(negocio && a.negocio!==negocio) return false;
    if(de && a.data < de) return false;
    if(ate && a.data > ate) return false;
    return true;
  });
}

// Função do módulo: minutos entre
function minutosEntre(hIni,hFim){
  const [h1,m1]=hIni.split(":").map(Number); const [h2,m2]=hFim.split(":").map(Number);
  let diff = (h2*60+m2)-(h1*60+m1);
  if(diff<0) diff += 24*60;
  return diff;
}

// Calcula: contar
function contar(arr, chave){
  const map = {};
  arr.forEach(a=>{ map[chave(a)] = (map[chave(a)]||0)+1; });
  return map;
}

// Calcula: somar
function somar(arr, chave, valor){
  const map = {};
  arr.forEach(a=>{ const k=chave(a); map[k]=(map[k]||0)+valor(a); });
  return map;
}

// Função do módulo: destroy chart
function destroyChart(key){ if(charts[key]){ charts[key].destroy(); delete charts[key]; } }

// Guarda, por chave de gráfico, a config usada e (quando disponível) os registros de cada categoria,
// para que qualquer gráfico da plataforma possa ser clicado e expandido com mais detalhes.
let CHART_META = {};
let chartDetalheGrande = null;
let chartDetalheChaveAtual = null;

// Função do módulo: criar chart
// "grupos" (opcional) é um objeto {categoria: [registros...]}, na mesma ordem/categorias do gráfico —
// quando informado, o detalhamento do gráfico permite clicar numa categoria e ver os registros dela.
function criarChart(key, canvasId, config, grupos){
  try{
    destroyChart(key);
    const canvas = document.getElementById(canvasId);
    if(!canvas){ console.error("[Dashboard] Canvas não encontrado:", canvasId); return; }
    // cada gráfico fica numa caixa de altura fixa (menor), preenchendo toda a largura do quadro
    if(canvas.parentNode && !canvas.parentNode.classList.contains("chart-box")){
      const bx = document.createElement("div"); bx.className = "chart-box";
      canvas.parentNode.insertBefore(bx, canvas); bx.appendChild(canvas);
    }
    config.options = Object.assign({}, config.options || {}, {maintainAspectRatio:false});
    charts[key] = new Chart(canvas, config);

    // título/subtítulo: pega do card que envolve o gráfico, pra não precisar repetir em cada chamada
    const card = canvas.closest(".card");
    const titulo = (card && card.querySelector("h3") && card.querySelector("h3").textContent) || "Indicador";
    const subtitulo = (card && card.querySelector(".sub") && card.querySelector(".sub").textContent) || "";
    CHART_META[key] = {titulo, subtitulo, config, grupos: grupos||null};

    const bx = canvas.parentNode;
    if(bx && bx.classList.contains("chart-box")){
      bx.classList.add("chart-box-clicavel");
      bx.title = "Clique para ver mais detalhes";
      bx.onclick = ()=>abrirDetalheChart(key);
    }
  }catch(e){
    console.error("[Dashboard] Erro ao criar o gráfico '"+key+"' ("+canvasId+"):", e);
  }
}

// Função do módulo: paleta
function paleta(){ return ["#00733f","#00b262","#a15a33","#54412f","#9f8167","#f99d33","#faa61a","#ee3135"]; }

// Calcula: agrupar — como "contar", mas guarda também os registros de cada categoria (pra detalhamento)
function agrupar(arr, chaveFn){
  const g = {};
  arr.forEach(a=>{
    const k = chaveFn(a);
    if(k===undefined || k===null || k==="") return;
    (g[k] = g[k]||[]).push(a);
  });
  return g;
}

/* =====================================================================
   DETALHAMENTO DE GRÁFICO — clique em qualquer gráfico da plataforma pra
   abrir uma versão maior dele, com uma tabela mostrando a quantidade (e,
   quando o gráfico tiver os registros de cada categoria) os acidentes de
   cada categoria, clicável pra ver a lista completa daquela categoria.
   ===================================================================== */
function abrirDetalheChart(key){
  const meta = CHART_META[key];
  if(!meta) return;
  chartDetalheChaveAtual = key;

  document.getElementById("chart-detalhe-titulo").textContent = meta.titulo;
  document.getElementById("chart-detalhe-sub").textContent = meta.subtitulo||"";

  if(chartDetalheGrande){ chartDetalheGrande.destroy(); chartDetalheGrande = null; }
  const canvas = document.getElementById("chart-detalhe-canvas");
  const configGrande = JSON.parse(JSON.stringify(meta.config));
  configGrande.options = Object.assign({}, configGrande.options||{}, {maintainAspectRatio:false});
  chartDetalheGrande = new Chart(canvas, configGrande);

  const labels = (meta.config.data && meta.config.data.labels) || [];
  const valores = (meta.config.data && meta.config.data.datasets && meta.config.data.datasets[0] && meta.config.data.datasets[0].data) || [];
  const total = valores.reduce((s,v)=>s+(Number(v)||0), 0) || 1;
  const tbody = document.getElementById("chart-detalhe-tbody");
  if(!labels.length){
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--areia-esc);">Sem dados para os filtros selecionados.</td></tr>';
  } else {
    tbody.innerHTML = labels.map((lbl,i)=>{
      const qtd = Number(valores[i])||0;
      const pct = Math.round((qtd/total)*1000)/10;
      const temRegistros = meta.grupos && meta.grupos[lbl] && meta.grupos[lbl].length;
      return `<tr ${temRegistros?`style="cursor:pointer;" onclick="mostrarRegistrosDetalheChart('${escHtml(String(lbl)).replace(/'/g,"&#39;")}')"`:""}>
        <td>${escHtml(String(lbl))}${temRegistros?' <span class="sub">(clique para ver os acidentes)</span>':""}</td>
        <td>${qtd}</td>
        <td>${pct}%</td>
      </tr>`;
    }).join("");
  }

  document.getElementById("chart-detalhe-bloco-lista").style.display = "block";
  document.getElementById("chart-detalhe-bloco-registros").style.display = "none";
  document.getElementById("modal-chart-detalhe").style.display = "flex";
}

// Desenha na tela: lista de acidentes de uma categoria específica do gráfico aberto no detalhamento
function mostrarRegistrosDetalheChart(label){
  const meta = CHART_META[chartDetalheChaveAtual];
  if(!meta || !meta.grupos) return;
  const registros = (meta.grupos[label]||[]).slice().sort((a,b)=> a.data<b.data?1:-1);
  document.getElementById("chart-detalhe-categoria-titulo").textContent = label+" — "+registros.length+" acidente(s)";
  const tbody = document.getElementById("chart-detalhe-registros-tbody");
  tbody.innerHTML = registros.map(a=>`
    <tr>
      <td>${a.data ? a.data.split("-").reverse().join("/") : "—"}</td>
      <td>${escHtml(a.funcionario||"—")}</td>
      <td>${escHtml(a.loja||"—")}</td>
      <td>${escHtml(a.setor||"—")}</td>
      <td>${escHtml(a.funcao||"—")}</td>
      <td>${escHtml(a.motivo||"—")}</td>
      <td>${escHtml(a.gravidade||"—")}</td>
      <td>${a.dias||0}</td>
    </tr>`).join("");
  document.getElementById("chart-detalhe-bloco-lista").style.display = "none";
  document.getElementById("chart-detalhe-bloco-registros").style.display = "block";
}

// Volta da lista de registros de uma categoria pro detalhamento geral do gráfico
function voltarListaDetalheChart(){
  document.getElementById("chart-detalhe-bloco-lista").style.display = "block";
  document.getElementById("chart-detalhe-bloco-registros").style.display = "none";
}

// Fecha o modal de detalhamento de gráfico
function fecharDetalheChart(){
  document.getElementById("modal-chart-detalhe").style.display = "none";
}

// Atualiza: atualizar dashboard
function atualizarDashboard(){
  const btnPpt = document.getElementById("btn-exportar-ppt");
  if(btnPpt) btnPpt.style.display = ehAdminOuCoordenador() ? "inline-flex" : "none";
  const avisoBox = document.getElementById("aviso-libs-dashboard");
  if(typeof Chart === "undefined"){
    avisoBox.style.display = "block";
    avisoBox.innerHTML = "⚠ A biblioteca de gráficos (Chart.js) não carregou. Isso geralmente acontece por bloqueio de rede/firewall ao endereço <b>cdnjs.cloudflare.com</b> ou por falta de conexão com a internet. Verifique sua rede e recarregue a página. Os números e tabelas abaixo continuam funcionando normalmente.";
    console.error("[Dashboard] Chart.js não está definido — verifique se https://cdnjs.cloudflare.com foi bloqueado.");
  } else if(avisoBox){
    avisoBox.style.display = "none";
  }
  const dados = dadosFiltrados();
  document.getElementById("pill-total").textContent = dados.length + (dados.length===1? " acidente no período":" acidentes no período");

  /* ---- KPIs ---- */
  const totalDias = dados.reduce((s,a)=>s+a.dias,0);
  const comAfastamento = dados.filter(a=>a.gravidade!=="Sem afastamento").length;
  const pct = dados.length? Math.round((comAfastamento/dados.length)*100) : 0;
  const obitos = dados.filter(a=>a.gravidade==="Óbito").length;
  const qtdTipico = dados.filter(a=>a.tipo==="Típico").length;
  const qtdTrajeto = dados.filter(a=>a.tipo==="Trajeto").length;

  document.getElementById("kpi-total").textContent = dados.length;
  if(ACIDENTES.length){
    const ultimaData = ACIDENTES.reduce((max,a)=> a.data>max? a.data:max, ACIDENTES[0].data);
    const dif = Math.floor((new Date().setHours(0,0,0,0) - new Date(ultimaData+"T00:00:00").getTime())/86400000);
    document.getElementById("kpi-dias-sem-acidente").textContent = (dif>=0?dif:0)+" dia(s) sem acidente (desde "+ultimaData.split("-").reverse().join("/")+")";
  } else {
    document.getElementById("kpi-dias-sem-acidente").textContent = "Sem registros de acidentes";
  }
  document.getElementById("kpi-dias").textContent = totalDias;
  document.getElementById("kpi-tipico-trajeto").textContent = qtdTipico+" / "+qtdTrajeto;
  document.getElementById("kpi-pct").textContent = pct + "%";
  document.getElementById("kpi-obitos").textContent = obitos;
  document.getElementById("kpi-dias-foot").textContent = dados.length? "Média de "+(Math.round((totalDias/dados.length)*10)/10)+" por caso" : "—";
  document.getElementById("kpi-pct-foot").textContent = comAfastamento+" de "+dados.length+" caso(s)";
  document.getElementById("kpi-obitos-foot").textContent = dados.length? Math.round((obitos/dados.length)*1000)/10+"% do total" : "—";

  /* ---- Termômetro de gravidade ---- */
  const track = document.getElementById("thermo-track");
  const legend = document.getElementById("thermo-legend");
  track.innerHTML=""; legend.innerHTML="";
  const gravGrupos = agrupar(dados, a=>a.gravidade);
  const gravCount = {}; Object.entries(gravGrupos).forEach(([k,v])=>gravCount[k]=v.length);
  const totalTh = dados.length || 1;
  GRAVIDADES.forEach(g=>{
    const qtd = gravCount[g]||0;
    const pctSeg = (qtd/totalTh)*100;
    const seg = document.createElement("div");
    seg.className = "thermo-seg";
    seg.style.width = pctSeg+"%";
    seg.style.background = GRAVIDADE_COR[g];
    seg.textContent = qtd>0 ? qtd : "";
    track.appendChild(seg);
    const li = document.createElement("div");
    li.className="li";
    li.innerHTML = '<span class="dot" style="background:'+GRAVIDADE_COR[g]+'"></span>'+g+' ('+qtd+')';
    legend.appendChild(li);
  });

  /* ---- Gráfico: tipo (Típico x Trajeto) ---- */
  const tipoGrupos = agrupar(dados, a=>a.tipo);
  const tipoCount = {}; Object.entries(tipoGrupos).forEach(([k,v])=>tipoCount[k]=v.length);
  criarChart("tipo", "chart-tipo", {
    type:"doughnut",
    data:{ labels:Object.keys(tipoCount), datasets:[{data:Object.values(tipoCount), backgroundColor:["#00733f","#a15a33"], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom", labels:{font:{family:"Open Sans"}}}}}
  }, tipoGrupos);

  /* ---- Gráfico: tipo de negócio ---- */
  const negOrdem = ["Loja","Logística","CP","Corporativo"];
  const negGrupos = agrupar(dados, a=>a.negocio);
  const negCount = {}; Object.entries(negGrupos).forEach(([k,v])=>negCount[k]=v.length);
  const negLabels = negOrdem.filter(n=>negCount[n]!==undefined).concat(Object.keys(negCount).filter(n=>!negOrdem.includes(n)));
  criarChart("negocio", "chart-negocio", {
    type:"doughnut",
    data:{ labels:negLabels, datasets:[{data:negLabels.map(n=>negCount[n]), backgroundColor:["#00733f","#faa61a","#a15a33","#54412f"], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom"}}}
  }, negGrupos);

  /* ---- Gráfico: por regional ---- */
  const regionalGrupos = agrupar(dados, a=>a.regional || "Não atribuído");
  const regionalCount = {}; Object.entries(regionalGrupos).forEach(([k,v])=>regionalCount[k]=v.length);
  const regionalOrdenado = Object.entries(regionalCount).sort((a,b)=>b[1]-a[1]);
  criarChart("regional", "chart-regional", {
    type:"bar",
    data:{ labels:regionalOrdenado.map(r=>r[0]), datasets:[{label:"Acidentes", data:regionalOrdenado.map(r=>r[1]), backgroundColor:"#00b262", borderRadius:6}]},
    options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{precision:0}}}}
  }, regionalGrupos);

  /* ---- Gráfico: categoria de afastamento ---- */
  criarChart("gravidade", "chart-gravidade", {
    type:"bar",
    data:{ labels:GRAVIDADES, datasets:[{label:"Casos", data:GRAVIDADES.map(g=>gravCount[g]||0), backgroundColor:GRAVIDADES.map(g=>GRAVIDADE_COR[g]), borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  }, gravGrupos);

  /* ---- Gráfico: unidades mais ofensoras (top 10) ---- */
  const unidadeGrupos = agrupar(dados, a=>a.loja);
  const unidadeCount = {}; Object.entries(unidadeGrupos).forEach(([k,v])=>unidadeCount[k]=v.length);
  const topUnidades = Object.entries(unidadeCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  criarChart("unidades", "chart-unidades", {
    type:"bar",
    data:{ labels:topUnidades.map(u=>u[0]), datasets:[{label:"Acidentes", data:topUnidades.map(u=>u[1]), backgroundColor:"#a15a33", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  }, unidadeGrupos);

  /* ---- Gráfico: por setor ---- */
  const setorGrupos = agrupar(dados, a=>a.setor);
  const setorCount = {}; Object.entries(setorGrupos).forEach(([k,v])=>setorCount[k]=v.length);
  const setoresOrdenados = Object.entries(setorCount).sort((a,b)=>b[1]-a[1]);
  criarChart("setor", "chart-setor", {
    type:"bar",
    data:{ labels:setoresOrdenados.map(s=>s[0]), datasets:[{label:"Acidentes", data:setoresOrdenados.map(s=>s[1]), backgroundColor:"#00733f", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  }, setorGrupos);

  /* ---- Gráfico: por função ---- */
  const funcaoGrupos = agrupar(dados, a=>a.funcao);
  const funcaoCount = {}; Object.entries(funcaoGrupos).forEach(([k,v])=>funcaoCount[k]=v.length);
  const funcoesOrdenadas = Object.entries(funcaoCount).sort((a,b)=>b[1]-a[1]);
  criarChart("funcao", "chart-funcao", {
    type:"bar",
    data:{ labels:funcoesOrdenadas.map(f=>f[0]), datasets:[{label:"Acidentes", data:funcoesOrdenadas.map(f=>f[1]), backgroundColor:"#faa61a", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  }, funcaoGrupos);

  /* ---- Gráfico: motivo do acidente (top 10) ---- */
  const motivoGrupos = agrupar(dados.filter(a=>a.motivo), a=>a.motivo);
  const motivoCount = {}; Object.entries(motivoGrupos).forEach(([k,v])=>motivoCount[k]=v.length);
  const topMotivos = Object.entries(motivoCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  criarChart("motivo", "chart-motivo", {
    type:"bar",
    data:{ labels:topMotivos.map(m=>m[0]), datasets:[{label:"Ocorrências", data:topMotivos.map(m=>m[1]), backgroundColor:"#ee3135", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  }, motivoGrupos);

  /* ---- Gráfico: agente causador ---- */
  const agenteGrupos = agrupar(dados.filter(a=>a.agenteCausador), a=>a.agenteCausador);
  const agenteCount = {}; Object.entries(agenteGrupos).forEach(([k,v])=>agenteCount[k]=v.length);
  criarChart("agente", "chart-agente", {
    type:"doughnut",
    data:{ labels:Object.keys(agenteCount), datasets:[{data:Object.values(agenteCount), backgroundColor:["#00733f","#faa61a","#a15a33","#54412f","#ee3135","#9f8167"], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom", labels:{font:{size:10.5}}}}}
  }, agenteGrupos);

  /* ---- Gráfico: partes do corpo atingidas (top 10) ---- */
  const partesGrupos = {};
  dados.forEach(a=>{ (a.partesAtingidas||[]).forEach(p=>{ if(p){ (partesGrupos[p]=partesGrupos[p]||[]).push(a); } }); });
  const partesFlat = {}; Object.entries(partesGrupos).forEach(([k,v])=>partesFlat[k]=v.length);
  const topPartes = Object.entries(partesFlat).sort((a,b)=>b[1]-a[1]).slice(0,10);
  criarChart("partes", "chart-partes", {
    type:"bar",
    data:{ labels:topPartes.map(p=>p[0]), datasets:[{label:"Ocorrências", data:topPartes.map(p=>p[1]), backgroundColor:"#54412f", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  }, partesGrupos);

  /* ---- Mapa de calor: dia da semana x faixa de horário ---- */
  renderHeatmapDiasHoras(dados);

  /* ---- Reincidência: motivo repetido na mesma unidade ---- */
  const chaveMotivoLoja = {};
  dados.forEach(a=>{
    if(!a.motivo) return;
    const chave = a.loja+"|||"+a.motivo;
    chaveMotivoLoja[chave] = (chaveMotivoLoja[chave]||0)+1;
  });
  const tbMotivoLoja = document.getElementById("tbl-reincidencia-motivo-loja");
  const reincidenciasMotivo = Object.entries(chaveMotivoLoja).filter(([,v])=>v>1).sort((a,b)=>b[1]-a[1]);
  if(!reincidenciasMotivo.length){
    tbMotivoLoja.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--areia-esc);padding:16px;">Nenhuma reincidência de motivo na mesma unidade para os filtros selecionados.</td></tr>';
  } else {
    tbMotivoLoja.innerHTML = reincidenciasMotivo.map(([chave,qtd])=>{
      const [loja,motivo] = chave.split("|||");
      return `<tr><td>${loja}</td><td>${motivo}</td><td><b>${qtd}</b></td></tr>`;
    }).join("");
  }

  /* ---- Reincidência: colaborador com mais de um acidente (independente do tipo) ---- */
  const porColaborador = {};
  dadosFiltradosSemTipo().forEach(a=>{
    if(!a.funcionario) return;
    if(!porColaborador[a.funcionario]) porColaborador[a.funcionario] = {qtd:0, lojas:new Set()};
    porColaborador[a.funcionario].qtd++;
    porColaborador[a.funcionario].lojas.add(a.loja);
  });
  const tbColaborador = document.getElementById("tbl-reincidencia-colaborador");
  const reincidenciasColab = Object.entries(porColaborador).filter(([,v])=>v.qtd>1).sort((a,b)=>b[1].qtd-a[1].qtd);
  if(!reincidenciasColab.length){
    tbColaborador.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--areia-esc);padding:16px;">Nenhum colaborador com mais de um acidente para os filtros selecionados.</td></tr>';
  } else {
    tbColaborador.innerHTML = reincidenciasColab.map(([nome,info])=>`<tr><td>${nome}</td><td>${[...info.lojas].join(", ")}</td><td><b>${info.qtd}</b></td></tr>`).join("");
  }
}

// Desenha na tela: render heatmap dias horas
function renderHeatmapDiasHoras(dados){
  const wrap = document.getElementById("heatmap-dias-horas");
  if(!wrap) return;
  const dias = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
  const faixas = [[0,2],[2,4],[4,6],[6,8],[8,10],[10,12],[12,14],[14,16],[16,18],[18,20],[20,22],[22,24]];
  const matriz = dias.map(()=>faixas.map(()=>0));

  dados.forEach(a=>{
    if(!a.data || !a.horaAcidente) return;
    const dt = new Date(a.data+"T00:00:00");
    let diaSemana = dt.getDay(); // 0=domingo
    diaSemana = diaSemana===0 ? 6 : diaSemana-1; // 0=segunda ... 6=domingo
    const hora = Number((a.horaAcidente.split(":")[0]))||0;
    const faixaIdx = faixas.findIndex(([ini,fim])=> hora>=ini && hora<fim);
    if(faixaIdx>=0) matriz[diaSemana][faixaIdx]++;
  });

  const max = Math.max(1, ...matriz.flat());
  function corIntensidade(v){
    if(v===0) return "#f2ece0";
    const t = v/max;
    // interpola de ambar claro para terracota/vinho escuro
    const r1=250,g1=210,b1=160, r2=152,g2=27,b2=34;
    const r=Math.round(r1+(r2-r1)*t), g=Math.round(g1+(g2-g1)*t), b=Math.round(b1+(b2-b1)*t);
    return `rgb(${r},${g},${b})`;
  }

  let html = '<table class="heatmap-table"><thead><tr><th></th>';
  faixas.forEach(([ini,fim])=>{ html += `<th>${String(ini).padStart(2,"0")}-${String(fim).padStart(2,"0")}h</th>`; });
  html += '</tr></thead><tbody>';
  dias.forEach((dia,di)=>{
    html += `<tr><td class="hm-dia">${dia}</td>`;
    faixas.forEach((_,fi)=>{
      const v = matriz[di][fi];
      const cor = corIntensidade(v);
      const corTexto = v/max>0.55 ? "#fff" : "#2b2118";
      html += `<td class="hm-cell" style="background:${cor}; color:${corTexto};">${v>0?v:""}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// Exporta: exportar dashboard ppt
/* ---- Exportação do Dashboard em PowerPoint (com insights automáticos) ---- */
async function exportarDashboardPPT(){
  if(!ehAdminOuCoordenador()){
    alert("Somente Administrador ou Coordenador podem exportar o dashboard em PPT.");
    return;
  }
  if(typeof PptxGenJS === "undefined"){
    alert("A biblioteca de exportação em PPT não carregou. Recarregue a página e tente novamente.");
    return;
  }
  mostrarToast("Gerando apresentação em PPT...");

  const dados = dadosFiltrados();
  const total = dados.length;
  const obitos = dados.filter(a=>a.gravidade==="Óbito").length;
  const comAfast = dados.filter(a=>a.gravidade!=="Sem afastamento").length;
  const pctAfast = total? Math.round((comAfast/total)*1000)/10 : 0;
  const totalDias = dados.reduce((s,a)=>s+(a.dias||0),0);

  const porUnidade = contar(dados, a=>a.loja);
  const porTipo = contar(dados, a=>a.tipo);
  const porGravidade = contar(dados, a=>a.gravidade);
  const porSetor = contar(dados, a=>a.setor);
  const porMotivo = contar(dados.filter(a=>a.motivo), a=>a.motivo);

  const topUnidade = Object.entries(porUnidade).sort((a,b)=>b[1]-a[1])[0];
  const topTipo = Object.entries(porTipo).sort((a,b)=>b[1]-a[1])[0];
  const topSetor = Object.entries(porSetor).sort((a,b)=>b[1]-a[1])[0];
  const topGravidade = Object.entries(porGravidade).sort((a,b)=>b[1]-a[1])[0];
  const topMotivo = Object.entries(porMotivo).sort((a,b)=>b[1]-a[1])[0];

  let diasSemAcidenteTxt = "—";
  if(ACIDENTES.length){
    const ultimaData = ACIDENTES.reduce((max,a)=> a.data>max? a.data:max, ACIDENTES[0].data);
    const dif = Math.floor((new Date().setHours(0,0,0,0) - new Date(ultimaData+"T00:00:00").getTime())/86400000);
    diasSemAcidenteTxt = (dif>=0?dif:0)+" dia(s)";
  }

  const insights = [];
  if(total===0){
    insights.push("Não há acidentes registrados para os filtros aplicados no período.");
  } else {
    if(topUnidade) insights.push("A unidade "+topUnidade[0]+" é a mais ofensora, com "+topUnidade[1]+" de "+total+" acidentes ("+Math.round(topUnidade[1]/total*100)+"%).");
    if(topTipo) insights.push("Acidentes do tipo \""+topTipo[0]+"\" são os mais frequentes ("+topTipo[1]+" ocorrência(s)).");
    if(topSetor) insights.push("O setor "+topSetor[0]+" é o mais afetado, com "+topSetor[1]+" acidente(s) registrado(s).");
    if(topMotivo) insights.push("O motivo mais recorrente é \""+topMotivo[0]+"\" ("+topMotivo[1]+" ocorrência(s)).");
    if(topGravidade) insights.push("A categoria de afastamento predominante é \""+topGravidade[0]+"\", representando "+Math.round(topGravidade[1]/total*100)+"% dos casos.");
    insights.push(pctAfast+"% dos acidentes resultaram em algum tipo de afastamento, totalizando "+totalDias+" dia(s) perdido(s).");
    if(obitos>0) insights.push("⚠ Foram registrados "+obitos+" óbito(s) no período — recomenda-se atenção prioritária às causas raízes desses casos.");
    insights.push("A unidade mais recente sem acidentes acumula "+diasSemAcidenteTxt+" desde o último registro.");
  }

  let lemonPng = null;
  try{ lemonPng = await svgParaPngDataUrl(LEMON_LOGO_SVG_BRANCO, 680, 220); }catch(e){}

  const capturarGrafico = (key)=>{
    try{ return charts[key] ? charts[key].toBase64Image() : null; }catch(e){ return null; }
  };
  function ajustarImagemChart(key, boxX, boxY, boxW, boxH){
    let w = boxW, h = boxH, x = boxX, y = boxY;
    try{
      const canvas = charts[key] && charts[key].canvas;
      if(canvas && canvas.width && canvas.height){
        const ratio = canvas.width / canvas.height;
        const boxRatio = boxW / boxH;
        if(ratio > boxRatio){ w = boxW; h = boxW / ratio; }
        else { h = boxH; w = boxH * ratio; }
        x = boxX + (boxW - w)/2;
        y = boxY + (boxH - h)/2;
      }
    }catch(e){}
    return {x, y, w, h};
  }
  const imgTipo = capturarGrafico("tipo");
  const imgNegocio = capturarGrafico("negocio");
  const imgGravidade = capturarGrafico("gravidade");
  const imgUnidades = capturarGrafico("unidades");
  const imgSetor = capturarGrafico("setor");
  const imgFuncao = capturarGrafico("funcao");
  const imgMotivo = capturarGrafico("motivo");
  const imgAgente = capturarGrafico("agente");
  const imgPartes = capturarGrafico("partes");

  const pptx = new PptxGenJS();
  pptx.defineLayout({name:"LAYOUT_16x9", width:10, height:5.63});
  pptx.layout = "LAYOUT_16x9";
  const VERDE = "00512C", AMBAR="FAA61A", TERRA="A15A33", CREME="EFE1D3", TEXTO="2B2118";

  // Slide 1 — Capa
  let s1 = pptx.addSlide();
  s1.background = {color: VERDE};
  if(lemonPng) s1.addImage({data:lemonPng, x:0.5, y:0.4, w:3.4, h:1.1});
  try{ s1.addImage({data:HORTIFRUTI_LOGO_DATAURL, x:8.0, y:0.45, w:1.6, h:0.55}); }catch(e){}
  s1.addText("Dashboard de Segurança do Trabalho", {x:0.5, y:2.1, w:9, h:0.8, fontSize:28, bold:true, color:"FFFFFF"});
  s1.addText("SESMT — Hortifruti Natural da Terra", {x:0.5, y:2.85, w:9, h:0.4, fontSize:14, color:"D7E9DD"});
  s1.addText("Gerado em "+new Date().toLocaleDateString("pt-BR")+"  •  "+total+" acidente(s) no período filtrado", {x:0.5, y:4.7, w:9, h:0.4, fontSize:11, color:"BFD9C8"});

  // Slide 2 — KPIs
  let s2 = pptx.addSlide();
  s2.background = {color:"FFFDFA"};
  s2.addText("Indicadores do Período", {x:0.4, y:0.3, w:9, h:0.5, fontSize:20, bold:true, color:TEXTO});
  const kpisPpt = [
    {label:"TOTAL DE ACIDENTES", valor:String(total), cor:TEXTO},
    {label:"ÓBITOS", valor:String(obitos), cor:"981B22"},
    {label:"% COM AFASTAMENTO", valor:pctAfast+"%", cor:TERRA},
    {label:"DIAS DE AFASTAMENTO", valor:String(totalDias), cor:AMBAR},
    {label:"DIAS SEM ACIDENTE", valor:diasSemAcidenteTxt, cor:VERDE}
  ];
  kpisPpt.forEach((k,i)=>{
    const x = 0.4 + i*1.9;
    s2.addShape("roundRect", {x, y:1.1, w:1.75, h:1.5, fill:{color:"F5EDE1"}, line:{color:"E5D6BE", width:1}, rectRadius:0.08});
    s2.addText(k.valor, {x, y:1.25, w:1.75, h:0.7, align:"center", fontSize:20, bold:true, color:k.cor});
    s2.addText(k.label, {x, y:1.9, w:1.75, h:0.6, align:"center", fontSize:8, color:"6B5B47"});
  });
  s2.addText("Insights automáticos", {x:0.4, y:2.9, w:9, h:0.4, fontSize:14, bold:true, color:TEXTO});
  s2.addText(insights.map(t=>({text:t, options:{bullet:true, breakLine:true}})), {x:0.4, y:3.3, w:9.2, h:2.0, fontSize:11, color:TEXTO, valign:"top"});

  // Slide 3 — Tipo e tipo de negócio
  if(imgTipo || imgNegocio){
    let s3 = pptx.addSlide();
    s3.background = {color:"FFFDFA"};
    s3.addText("Acidentes por Tipo e por Tipo de Negócio", {x:0.4, y:0.3, w:9, h:0.5, fontSize:18, bold:true, color:TEXTO});
    if(imgTipo){ const d = ajustarImagemChart("tipo", 0.4, 1.0, 4.4, 3.8); s3.addImage({data:imgTipo, x:d.x, y:d.y, w:d.w, h:d.h}); }
    if(imgNegocio){ const d = ajustarImagemChart("negocio", 5.1, 1.0, 4.4, 3.8); s3.addImage({data:imgNegocio, x:d.x, y:d.y, w:d.w, h:d.h}); }
  }

  // Slide 4 — Categoria de afastamento e unidades mais ofensoras
  if(imgGravidade || imgUnidades){
    let s4 = pptx.addSlide();
    s4.background = {color:"FFFDFA"};
    s4.addText("Categoria de Afastamento e Unidades Mais Ofensoras", {x:0.4, y:0.3, w:9, h:0.5, fontSize:18, bold:true, color:TEXTO});
    if(imgGravidade){ const d = ajustarImagemChart("gravidade", 0.4, 1.0, 4.4, 3.8); s4.addImage({data:imgGravidade, x:d.x, y:d.y, w:d.w, h:d.h}); }
    if(imgUnidades){ const d = ajustarImagemChart("unidades", 5.1, 1.0, 4.4, 3.8); s4.addImage({data:imgUnidades, x:d.x, y:d.y, w:d.w, h:d.h}); }
  }

  // Slide 5 — Setor e função
  if(imgSetor || imgFuncao){
    let s5 = pptx.addSlide();
    s5.background = {color:"FFFDFA"};
    s5.addText("Acidentes por Setor e por Função", {x:0.4, y:0.3, w:9, h:0.5, fontSize:18, bold:true, color:TEXTO});
    if(imgSetor){ const d = ajustarImagemChart("setor", 0.4, 1.0, 4.4, 3.8); s5.addImage({data:imgSetor, x:d.x, y:d.y, w:d.w, h:d.h}); }
    if(imgFuncao){ const d = ajustarImagemChart("funcao", 5.1, 1.0, 4.4, 3.8); s5.addImage({data:imgFuncao, x:d.x, y:d.y, w:d.w, h:d.h}); }
  }

  // Slide 6 — Motivo e agente causador
  if(imgMotivo || imgAgente){
    let s6 = pptx.addSlide();
    s6.background = {color:"FFFDFA"};
    s6.addText("Motivo do Acidente e Agente Causador", {x:0.4, y:0.3, w:9, h:0.5, fontSize:18, bold:true, color:TEXTO});
    if(imgMotivo){ const d = ajustarImagemChart("motivo", 0.4, 1.0, 4.4, 3.8); s6.addImage({data:imgMotivo, x:d.x, y:d.y, w:d.w, h:d.h}); }
    if(imgAgente){ const d = ajustarImagemChart("agente", 5.1, 1.0, 4.4, 3.8); s6.addImage({data:imgAgente, x:d.x, y:d.y, w:d.w, h:d.h}); }
  }

  // Slide 7 — Partes do corpo atingidas
  if(imgPartes){
    let s7 = pptx.addSlide();
    s7.background = {color:"FFFDFA"};
    s7.addText("Partes do Corpo Atingidas", {x:0.4, y:0.3, w:9, h:0.5, fontSize:18, bold:true, color:TEXTO});
    const d = ajustarImagemChart("partes", 1.5, 1.0, 7, 4.0);
    s7.addImage({data:imgPartes, x:d.x, y:d.y, w:d.w, h:d.h});
  }

  // Slide final
  let sF = pptx.addSlide();
  sF.background = {color: VERDE};
  if(lemonPng) sF.addImage({data:lemonPng, x:3.3, y:2.0, w:3.4, h:1.1});
  sF.addText("Prevenir. Cuidar e Monitorar.", {x:0.5, y:3.3, w:9, h:0.5, align:"center", fontSize:14, color:"FFFFFF"});

  pptx.writeFile({fileName: "dashboard_seguranca_"+new Date().toISOString().slice(0,10)+".pptx"});
  mostrarToast("Apresentação em PPT gerada.");
}

// Salva no banco: salvar acidente
/* =====================================================================
   4) LANÇAMENTO MANUAL
   ===================================================================== */
async function salvarAcidente(ev){
  ev.preventDefault();
  const idEdicao = document.getElementById("in-acidente-id").value;
  if(idEdicao && !ehAdministrador()){ alert("Somente o Administrador pode editar um registro de acidente."); return false; }
  const loja = document.getElementById("in-loja").value.trim();
  const negocioManual = document.getElementById("in-negocio").value;
  const novo = {
    data: document.getElementById("in-data").value,
    horaAcidente: document.getElementById("in-hora-acidente").value,
    horaAtendimento: document.getElementById("in-hora-atendimento").value,
    tipo: document.getElementById("in-tipo").value,
    praca: document.getElementById("in-praca").value,
    negocio: negocioManual,
    loja: loja,
    regional: document.getElementById("in-regional").value || "Não atribuído",
    setor: document.getElementById("in-setor").value.trim(),
    funcao: document.getElementById("in-funcao").value.trim(),
    funcionario: document.getElementById("in-funcionario").value.trim(),
    motivo: normalizarAgrupamento(document.getElementById("in-motivo").value),
    agenteCausador: document.getElementById("in-agente-causador").value,
    local: document.getElementById("in-local").value.trim(),
    partesAtingidas: document.getElementById("in-partes").value.split(",").map(p=>normalizarAgrupamento(p)).filter(Boolean),
    gravidade: document.getElementById("in-gravidade").value,
    dias: Number(document.getElementById("in-dias").value)||0,
    obs: document.getElementById("in-obs").value.trim()
  };
  if(idEdicao){
    const { error } = await sb.from("acidentes").update(acidenteToDb(novo)).eq("id", Number(idEdicao));
    if(error){ alert("Erro ao atualizar o acidente: "+error.message); return false; }
    Object.assign(ACIDENTES.find(x=>x.id===Number(idEdicao)), novo);
    acaoPlataforma("Acidente atualizado", (novo.loja||"")+" — "+(novo.motivo||""), "acidente", Number(idEdicao));
    mostrarToast("Registro de acidente atualizado com sucesso.");
  } else {
    const { data, error } = await sb.from("acidentes").insert({...acidenteToDb(novo), created_by: currentUser?currentUser.id:null}).select().single();
    if(error){ alert("Erro ao salvar o acidente no banco: "+error.message); return false; }
    const acidenteSalvo = mapAcidenteFromDb(data);
    ACIDENTES.push(acidenteSalvo);
    notificarAdminsCoordenadores("acidente_novo", "Novo acidente registrado", acidenteSalvo.loja+" — "+acidenteSalvo.motivo, "acidente", acidenteSalvo.id);
    avisarNovoAcidente(acidenteSalvo);
    mostrarToast("Registro de acidente salvo com sucesso.");
  }
  document.getElementById("form-acidente").reset();
  cancelarEdicaoAcidente();
  popularFiltros();
  renderLancamentos();
  return false;
}

// Preenche: popular select acidentes ficha
function popularSelectAcidentesFicha(){
  const sel = document.getElementById("fa-acidente");
  if(!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Selecione...</option>' + ACIDENTES
    .slice().sort((a,b)=> a.data<b.data?1:-1)
    .map(a=>`<option value="${a.id}">${a.data.split("-").reverse().join("/")} — ${a.loja} — ${a.setor} — ${a.gravidade}</option>`).join("");
  sel.value = atual || "";
  const box = document.getElementById("fa-responsavel-box");
  if(box && currentUser) box.textContent = "Responsável pela análise: "+currentUser.nome+(currentUser.cargo? " — "+currentUser.cargo : "");
}

// Salva no banco: salvar ficha analise
async function salvarFichaAnalise(ev){
  ev.preventDefault();
  const acidenteId = document.getElementById("fa-acidente").value;
  if(!acidenteId){ alert("Selecione o acidente relacionado a essa ficha."); return false; }
  const acidente = ACIDENTES.find(a=>a.id===Number(acidenteId));
  const nova = {
    acidente_id: Number(acidenteId),
    acidente_resumo: acidente ? (acidente.data.split("-").reverse().join("/")+" — "+acidente.loja+" — "+acidente.setor) : "Acidente não encontrado",
    data_analise: document.getElementById("fa-data").value,
    prazo: document.getElementById("fa-prazo").value,
    status: document.getElementById("fa-status").value,
    descricao: document.getElementById("fa-descricao").value.trim(),
    causa_imediata: document.getElementById("fa-causa-imediata").value.trim(),
    causa_raiz: document.getElementById("fa-causa-raiz").value.trim(),
    acoes: document.getElementById("fa-acoes").value.trim(),
    responsavel: currentUser ? currentUser.nome : "—"
  };
  const { data, error } = await sb.from("fichas_analise").insert(nova).select().single();
  if(error){ alert("Erro ao salvar a ficha de análise: "+error.message); return false; }
  FICHAS_ANALISE.unshift(mapFichaFromDb(data));
  document.getElementById("form-ficha-analise").reset();
  popularSelectAcidentesFicha();
  renderFichasAnalise();
  mostrarToast("Ficha de análise salva.");
  return false;
}

// Define o rótulo/cor visual de status de: tag status ficha
function tagStatusFicha(status){
  const cor = status==="Concluída" ? "concluido" : "andamento";
  return `<span class="tag-status ${cor}">${status}</span>`;
}

// Desenha na tela: render fichas analise
function renderFichasAnalise(){
  const tbody = document.getElementById("tbl-fichas-analise");
  if(!tbody) return;
  if(!FICHAS_ANALISE.length){
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--areia-esc);">Nenhuma ficha de análise registrada ainda.</td></tr>';
    return;
  }
  tbody.innerHTML = FICHAS_ANALISE.map(f=>`
    <tr>
      <td>${f.acidenteResumo}</td>
      <td>${f.dataAnalise? f.dataAnalise.split("-").reverse().join("/") : "—"}</td>
      <td>${f.responsavel}</td>
      <td>${f.prazo? f.prazo.split("-").reverse().join("/") : "—"}</td>
      <td>${tagStatusFicha(f.status)}</td>
      <td>
        <button type="button" class="small-btn" onclick="verDetalheFicha(${f.id})">Ver detalhes</button>
        <button type="button" class="small-btn danger" onclick="removerFichaAnalise(${f.id})">Remover</button>
      </td>
    </tr>
  `).join("");
}

// Função do módulo: ver detalhe ficha
function verDetalheFicha(id){
  const f = FICHAS_ANALISE.find(x=>x.id===id);
  if(!f) return;
  alert(
    "Acidente: "+f.acidenteResumo+"\\n"+
    "Responsável: "+f.responsavel+"\\n"+
    "Status: "+f.status+"\\n\\n"+
    "Descrição: "+(f.descricao||"—")+"\\n\\n"+
    "Causa imediata: "+(f.causaImediata||"—")+"\\n\\n"+
    "Causa básica/raiz: "+(f.causaRaiz||"—")+"\\n\\n"+
    "Ações corretivas: "+(f.acoes||"—")
  );
}

// Remove/cancela: remover ficha analise
async function removerFichaAnalise(id){
  if(!confirm("Remover esta ficha de análise?")) return;
  const { error } = await sb.from("fichas_analise").delete().eq("id", id);
  if(error){ alert("Erro ao remover ficha: "+error.message); return; }
  FICHAS_ANALISE = FICHAS_ANALISE.filter(f=>f.id!==id);
  renderFichasAnalise();
}

// Desenha na tela: render lancamentos
function renderLancamentos(){
  const tb = document.getElementById("tbl-lancamentos");
  const minhasUnidades = new Set(UNIDADES.filter(u=> currentUser && u.tecnicoResponsavel && u.tecnicoResponsavel.trim().toLowerCase()===currentUser.nome.trim().toLowerCase()).map(u=>u.nome));
  const meusLancamentos = ACIDENTES.filter(a=> minhasUnidades.has(a.loja));
  tb.innerHTML="";
  if(!minhasUnidades.size){
    tb.innerHTML = `<tr><td colspan="12" style="text-align:center;color:var(--areia-esc);padding:16px;">Nenhuma unidade está com você como técnico responsável no cadastro. Fale com o Administrador para vincular sua unidade.</td></tr>`;
    return;
  }
  if(!meusLancamentos.length){
    tb.innerHTML = `<tr><td colspan="12" style="text-align:center;color:var(--areia-esc);padding:16px;">Nenhum acidente registrado ainda nas unidades sob sua responsabilidade.</td></tr>`;
    return;
  }
  meusLancamentos.slice().sort((a,b)=>b.id-a.id).slice(0,25).forEach(a=>{
    tb.innerHTML += `<tr>
      <td>${formataData(a.data)}</td>
      <td><span class="badge ${a.tipo==='Trajeto'?'traj':'tip'}">${a.tipo}</span></td>
      <td>${a.praca}</td><td>${a.regional||"—"}</td><td>${a.negocio}</td><td>${a.loja}</td><td>${a.setor}</td><td>${a.funcao}</td>
      <td>${a.funcionario||"—"}</td><td>${a.motivo||"—"}</td>
      <td><span class="badge ${GRAVIDADE_BADGE[a.gravidade]}">${a.gravidade}</span></td>
      <td>${a.dias}</td>
    </tr>`;
  });
}

// Remove/cancela: cancelar edicao acidente
function cancelarEdicaoAcidente(){
  document.getElementById("in-acidente-id").value = "";
  document.getElementById("btn-salvar-acidente").textContent = "Salvar registro";
  document.getElementById("btn-excluir-acidente").style.display = "none";
  document.getElementById("in-dias").value = 0;
}

// Função do módulo: editar acidente
function editarAcidente(id){
  if(!ehAdministrador()) return;
  const a = ACIDENTES.find(x=>x.id===id);
  if(!a) return;
  mostrarSubAcidentes("registro");
  const painel = document.getElementById("painel-novo-registro");
  painel.style.display = "block";
  popularDropdownsLancamento();
  document.getElementById("in-acidente-id").value = a.id;
  document.getElementById("in-data").value = a.data||"";
  document.getElementById("in-hora-acidente").value = a.horaAcidente||"";
  document.getElementById("in-hora-atendimento").value = a.horaAtendimento||"";
  document.getElementById("in-tipo").value = a.tipo||"Típico";
  document.getElementById("in-praca").value = a.praca||"";
  document.getElementById("in-negocio").value = a.negocio||"Loja";
  document.getElementById("in-loja").value = a.loja||"";
  atualizarRegionalDaUnidadeForm();
  document.getElementById("in-setor").value = a.setor||"";
  document.getElementById("in-funcao").value = a.funcao||"";
  document.getElementById("in-funcionario").value = a.funcionario||"";
  document.getElementById("in-motivo").value = a.motivo||"";
  document.getElementById("in-agente-causador").value = a.agenteCausador||"";
  document.getElementById("in-local").value = a.local||"";
  document.getElementById("in-partes").value = (a.partesAtingidas||[]).join(", ");
  document.getElementById("in-gravidade").value = a.gravidade||"";
  document.getElementById("in-dias").value = a.dias||0;
  document.getElementById("in-obs").value = a.obs||"";
  document.getElementById("btn-salvar-acidente").textContent = "Salvar alterações";
  document.getElementById("btn-excluir-acidente").style.display = "inline-flex";
  painel.scrollIntoView({behavior:"smooth", block:"start"});
}

// Remove/cancela: excluir acidente
async function excluirAcidente(id){
  if(!ehAdministrador()){ alert("Somente o Administrador pode excluir um registro de acidente."); return; }
  const a = ACIDENTES.find(x=>x.id===id);
  if(!a) return;
  if(!confirm("Excluir definitivamente o acidente de "+(a.funcionario||"colaborador não identificado")+" em "+formataData(a.data)+"? Esta ação não pode ser desfeita.")) return;
  const { error } = await sb.from("acidentes").delete().eq("id", id);
  if(error){ alert("Erro ao excluir o acidente: "+error.message); return; }
  ACIDENTES = ACIDENTES.filter(x=>x.id!==id);
  acaoPlataforma("Acidente excluído", (a.loja||"")+" — "+(a.motivo||""), "acidente", id);
  mostrarToast("Registro de acidente excluído.");
  if(document.getElementById("in-acidente-id").value === String(id)){
    document.getElementById("form-acidente").reset();
    cancelarEdicaoAcidente();
    document.getElementById("painel-novo-registro").style.display = "none";
  }
  popularFiltros();
  renderLancamentos();
  renderTodosAcidentes();
  if(typeof atualizarDashboard === "function" && document.getElementById("acidentes-sub-indicadores")) atualizarDashboard();
}

// Função do módulo: formata data
function formataData(iso){ if(!iso) return "-"; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }

// Preenche: popular filtros todos acidentes
function popularFiltrosTodosAcidentes(){
  fillSelect("todos-ac-unidade", UNIDADES.map(u=>u.nome));
  fillSelect("todos-ac-gravidade", GRAVIDADES);
}

// Limpa: limpar filtros todos acidentes
function limparFiltrosTodosAcidentes(){
  ["todos-ac-busca","todos-ac-unidade","todos-ac-tipo","todos-ac-gravidade","todos-ac-de","todos-ac-ate"].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value = "";
  });
  renderTodosAcidentes();
}

// Ordena a lista de: ordenar todos acidentes
function ordenarTodosAcidentes(campo){
  if(ordenacaoTodosAcidentes.campo===campo) ordenacaoTodosAcidentes.dir *= -1;
  else ordenacaoTodosAcidentes = {campo, dir:1};
  renderTodosAcidentes();
}

// Desenha na tela: render todos acidentes
function renderTodosAcidentes(){
  const tbody = document.getElementById("tbl-todos-acidentes");
  if(!tbody) return;
  const thAcoes = document.getElementById("th-acoes-todos-acidentes");
  const admin = ehAdministrador();
  if(thAcoes) thAcoes.style.display = admin ? "table-cell" : "none";

  const busca = (document.getElementById("todos-ac-busca")?.value||"").trim().toLowerCase();
  const unidade = document.getElementById("todos-ac-unidade")?.value;
  const tipo = document.getElementById("todos-ac-tipo")?.value;
  const gravidade = document.getElementById("todos-ac-gravidade")?.value;
  const de = document.getElementById("todos-ac-de")?.value;
  const ate = document.getElementById("todos-ac-ate")?.value;

  let linhas = ACIDENTES.filter(a=>{
    if(unidade && a.loja!==unidade) return false;
    if(tipo && a.tipo!==tipo) return false;
    if(gravidade && a.gravidade!==gravidade) return false;
    if(de && a.data<de) return false;
    if(ate && a.data>ate) return false;
    if(busca){
      const alvo = [a.funcionario,a.motivo,a.loja,a.setor,a.funcao,a.local].filter(Boolean).join(" ").toLowerCase();
      if(!alvo.includes(busca)) return false;
    }
    return true;
  });

  const {campo, dir} = ordenacaoTodosAcidentes;
  linhas = linhas.slice().sort((a,b)=>{
    let va = a[campo], vb = b[campo];
    if(campo==="dias"){ va = Number(va)||0; vb = Number(vb)||0; }
    else { va = (va||"").toString(); vb = (vb||"").toString(); }
    if(va<vb) return -1*dir;
    if(va>vb) return 1*dir;
    return 0;
  });

  const contador = document.getElementById("todos-ac-contador");
  if(contador) contador.textContent = linhas.length+" acidente(s) encontrado(s) de "+ACIDENTES.length+" no total.";

  if(!linhas.length){
    tbody.innerHTML = `<tr><td colspan="14"><div class="lista-vazio"><b>Nenhum acidente encontrado</b>Ajuste os filtros ou a busca para ver os registros.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = linhas.map(a=>`<tr>
    <td class="col-sticky" style="min-width:100px; max-width:100px;">${formataData(a.data)}</td>
    <td><span class="badge ${a.tipo==='Trajeto'?'traj':'tip'}">${a.tipo}</span></td>
    <td>${a.praca||"—"}</td>
    <td>${a.regional||"—"}</td>
    <td>${a.negocio||"—"}</td>
    <td>${a.loja||"—"}</td>
    <td>${a.setor||"—"}</td>
    <td>${a.funcao||"—"}</td>
    <td>${a.funcionario||"—"}</td>
    <td>${a.motivo||"—"}</td>
    <td>${a.agenteCausador||"—"}</td>
    <td><span class="badge ${GRAVIDADE_BADGE[a.gravidade]}">${a.gravidade}</span></td>
    <td>${a.dias||0}</td>
    ${admin ? `<td><button type="button" class="small-btn" onclick="editarAcidente(${a.id})">Editar</button><button type="button" class="small-btn danger" onclick="excluirAcidente(${a.id})">Excluir</button></td>` : ""}
  </tr>`).join("");
}

// Alterna (mostra/esconde): toggle upload panel
/* =====================================================================
   5) UPLOAD DE EXCEL (painel dentro de Acidentes e Incidentes)
   ===================================================================== */
function toggleUploadPanel(){
  const painel = document.getElementById("painel-upload");
  painel.style.display = painel.style.display==="none" ? "block" : "none";
}

// Alterna (mostra/esconde): toggle novo registro panel
function toggleNovoRegistroPanel(){
  const painel = document.getElementById("painel-novo-registro");
  const abrindo = painel.style.display==="none";
  painel.style.display = abrindo ? "block" : "none";
  if(abrindo){
    document.getElementById("form-acidente").reset();
    cancelarEdicaoAcidente();
  }
}

// Alterna (mostra/esconde): toggle ficha analise panel
function toggleFichaAnalisePanel(){
  const painel = document.getElementById("painel-ficha-analise");
  const abrindo = painel.style.display === "none";
  painel.style.display = abrindo ? "block" : "none";
  if(abrindo){ popularSelectAcidentesFicha(); renderFichasAnalise(); }
}

// Função do módulo: baixar modelo
function baixarModelo(){
  const wsData = [COLUNAS_MODELO,
    ["2026-03-10","Típico","SP","Jean","Loja SP - Campinas","Loja","Estoque","Repositor","Fulano da Silva","Queda ao mesmo nível","Superfícies, Pisos e Estruturas","Área de vendas","Pe","09:15","09:40","Sem afastamento",0],
    ["2026-03-12","Trajeto","RJ","Rogerio","CD RJ - Duque de Caxias","Logística","Logística","Motorista","Ciclana Souza","Acidente de trânsito","Veículos","Estacionamento","07:05","07:50","Com afastamento",1]
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Modelo Acidentes");
  XLSX.writeFile(wb, "modelo_acidentes_sesmt.xlsx");
}

// Função do módulo: processar arquivo
function processarArquivo(file){
  const reader = new FileReader();
  reader.onload = (e)=>{
    const wb = XLSX.read(e.target.result, {type:"array"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, {defval:""});
    if(!rows.length){ document.getElementById("upload-status").textContent="A planilha está vazia."; return; }
    pendingImport = rows.map(normalizarLinha).filter(Boolean);
    mostrarPreview(rows);
    document.getElementById("upload-status").innerHTML = `<b>${pendingImport.length}</b> de ${rows.length} linha(s) prontas para importar. Confira a pré-visualização e confirme.`;
    document.getElementById("upload-actions").style.display = pendingImport.length? "flex":"none";
  };
  reader.readAsArrayBuffer(file);
}

// Função do módulo: excel hora to str
function excelHoraToStr(v){
  if(typeof v === "number"){
    const totalMin = Math.round(v*24*60);
    const h = Math.floor(totalMin/60)%24, m = totalMin%60;
    return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
  }
  return String(v||"").slice(0,5);
}

// Função do módulo: excel data to str
function excelDataToStr(v){
  if(typeof v === "number"){
    const d = XLSX.SSF.parse_date_code(v);
    return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
  }
  const s = String(v||"");
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  return s;
}

// Função do módulo: normalizar linha
function normalizarLinha(r){
  const get = (...keys)=>{ for(const k of keys){ if(r[k]!==undefined && r[k]!=="") return r[k]; } return ""; };
  const loja = String(get("Loja","Unidade")).trim();
  if(!loja) return null;
  const negocio = String(get("Tipo de Negócio","Negócio")).trim() || negocioDaLoja(loja);
  const unidadeInfo = unidadePorNome(loja);
  const regional = String(get("Regional")).trim() || (unidadeInfo && unidadeInfo.regional) || "Não atribuído";
  const gravRaw = String(get("Gravidade","Categoria de Afastamento")).trim();
  const gravidade = GRAVIDADES.find(g=>g.toLowerCase()===gravRaw.toLowerCase()) || "Sem afastamento";
  const partesRaw = String(get("Partes do corpo atingidas","Partes Atingidas")).trim();
  return {
    id:0,
    data: excelDataToStr(get("Data","Data do Acidente")),
    tipo: /trajeto/i.test(get("Tipo (Trajeto/Típico)","Tipo")) ? "Trajeto":"Típico",
    praca: String(get("Praça","Praca")).trim().toUpperCase(),
    negocio, loja, regional,
    setor: String(get("Setor")).trim(),
    funcao: String(get("Função","Funcao","Cargo")).trim(),
    funcionario: String(get("Funcionário","Colaborador","Nome do Colaborador")).trim(),
    motivo: normalizarAgrupamento(get("Motivo","Motivo do Acidente")),
    agenteCausador: String(get("Agente Causador")).trim(),
    local: String(get("Local do Acidente","Local")).trim(),
    partesAtingidas: partesRaw ? partesRaw.split(/[,\n]/).map(p=>normalizarAgrupamento(p)).filter(Boolean) : [],
    horaAcidente: excelHoraToStr(get("Hora do Acidente")),
    horaAtendimento: excelHoraToStr(get("Hora do Atendimento")),
    gravidade,
    dias: Number(get("Dias de Afastamento","Dias","Duração Tratamento (dias)"))||0,
    obs:""
  };
}

// Função do módulo: mostrar preview
function mostrarPreview(rows){
  const head = document.getElementById("tbl-preview-head");
  const body = document.getElementById("tbl-preview-body");
  const cols = Object.keys(rows[0]);
  head.innerHTML = "<tr>"+cols.map(c=>`<th>${c}</th>`).join("")+"</tr>";
  body.innerHTML = rows.slice(0,8).map(r=>"<tr>"+cols.map(c=>`<td>${r[c]}</td>`).join("")+"</tr>").join("");
}

// Função do módulo: confirmar importacao
function confirmarImportacao(){
  if(!pendingImport.length) return;
  let nextId = Math.max(0,...ACIDENTES.map(a=>a.id))+1;
  pendingImport.forEach(r=>{ r.id = nextId++; ACIDENTES.push(r); });
  mostrarToast(pendingImport.length+" registro(s) importado(s) com sucesso.");
  pendingImport = [];
  document.getElementById("upload-actions").style.display="none";
  document.getElementById("upload-status").textContent="Importação concluída. Você já pode enviar outro arquivo.";
  document.getElementById("tbl-preview-head").innerHTML="";
  document.getElementById("tbl-preview-body").innerHTML="";
  document.getElementById("file-input").value="";
  popularFiltros();
}

// Remove/cancela: cancelar importacao
function cancelarImportacao(){
  pendingImport = [];
  document.getElementById("upload-actions").style.display="none";
  document.getElementById("upload-status").textContent="Importação cancelada.";
  document.getElementById("tbl-preview-head").innerHTML="";
  document.getElementById("tbl-preview-body").innerHTML="";
  document.getElementById("file-input").value="";
}

/* =====================================================================
   CONCILIAÇÃO COM A PLANILHA DO RH
   Lê o relatório de acidentes do RH (agrupado em blocos por "Setor:"/
   "Unidade:", com uma linha por colaborador), compara cada registro com
   os acidentes já lançados na plataforma (nome do colaborador + data do
   acidente) e lista só os que ainda faltam lançar. Para cada um, mostra
   editáveis tanto os dados que a planilha trouxe (para conferir/corrigir)
   quanto os campos que ela não tinha (para completar antes de lançar).
   ===================================================================== */
let pendenciasConciliacaoRH = [];
let extrasPlataformaRH = [];

// Abre/fecha: alternar painel de conciliação com a planilha do RH
function toggleConciliacaoRHPanel(){
  const painel = document.getElementById("painel-conciliacao-rh");
  painel.style.display = painel.style.display==="none" ? "block" : "none";
}

// Util: chave de comparação (nome normalizado + data) para achar o que já foi lançado
function chaveConciliacaoRH(nome, data){
  return normalizarTextoComparacao(nome)+"|"+(data||"");
}

// Lê o arquivo enviado e monta a lista de pendências (ainda não lançadas)
function processarArquivoConciliacaoRH(file){
  if(!file) return;
  const status = document.getElementById("conciliacao-rh-status");
  status.textContent = "Lendo arquivo...";
  const reader = new FileReader();
  reader.onload = (e)=>{
    let aoa;
    try{
      const wb = XLSX.read(e.target.result, {type:"array"});
      const ws = wb.Sheets[wb.SheetNames[0]];
      aoa = XLSX.utils.sheet_to_json(ws, {header:1, defval:""});
    }catch(err){
      status.textContent = "Não consegui ler esse arquivo ("+(err && err.message ? err.message : "formato inválido")+").";
      return;
    }
    const lidos = parseRelatorioAcidentesRH(aoa);
    if(!lidos.length){
      status.textContent = "Não encontrei registros de acidente nesse arquivo. Confira se é o relatório detalhado do RH, agrupado por Setor/Unidade.";
      document.getElementById("conciliacao-rh-lista").innerHTML = "";
      pendenciasConciliacaoRH = [];
      extrasPlataformaRH = [];
      document.getElementById("conciliacao-rh-bloco-extras").style.display = "none";
      return;
    }
    const existentes = new Set(ACIDENTES.map(a=>chaveConciliacaoRH(a.funcionario, a.data)));
    const vistos = new Set();
    const pendentes = [];
    lidos.forEach(r=>{
      const chave = chaveConciliacaoRH(r.funcionario, r.data);
      if(existentes.has(chave) || vistos.has(chave)) return;
      vistos.add(chave);
      pendentes.push(r);
    });
    pendenciasConciliacaoRH = pendentes;

    // Também confere o caminho inverso: acidentes já lançados na plataforma que não aparecem na planilha do RH
    const chavesLidas = new Set(lidos.map(r=>chaveConciliacaoRH(r.funcionario, r.data)));
    extrasPlataformaRH = ACIDENTES.filter(a=>!chavesLidas.has(chaveConciliacaoRH(a.funcionario, a.data)));

    const jaLancados = lidos.length - pendentes.length;
    status.innerHTML = "<b>"+lidos.length+"</b> acidente(s) encontrado(s) na planilha · <b>"+jaLancados+"</b> já lançado(s) na plataforma (ignorados) · <b>"+pendentes.length+"</b> ainda precisam ser lançados · <b>"+extrasPlataformaRH.length+"</b> lançado(s) na plataforma sem correspondência na planilha.";
    renderConciliacaoRH();
    renderExtrasConciliacaoRH();
  };
  reader.readAsArrayBuffer(file);
}

// Desenha na tela: acidentes lançados na plataforma que não foram encontrados na planilha do RH enviada
function renderExtrasConciliacaoRH(){
  const bloco = document.getElementById("conciliacao-rh-bloco-extras");
  const tbody = document.getElementById("conciliacao-rh-extras-tbody");
  if(!extrasPlataformaRH.length){ bloco.style.display = "none"; return; }
  bloco.style.display = "block";
  tbody.innerHTML = extrasPlataformaRH.slice().sort((a,b)=> a.data<b.data?1:-1).map(a=>`
    <tr>
      <td>${a.data ? a.data.split("-").reverse().join("/") : "—"}</td>
      <td>${escHtml(a.funcionario||"—")}</td>
      <td>${escHtml(a.loja||"—")}</td>
      <td>${escHtml(a.setor||"—")}</td>
      <td>${escHtml(a.funcao||"—")}</td>
      <td>${escHtml(a.motivo||"—")}</td>
      <td>${escHtml(a.gravidade||"—")}</td>
      <td>${a.dias||0}</td>
    </tr>`).join("");
}

// Extrai os registros de um relatório agrupado em blocos "Setor:"/"Unidade:" (formato do RH)
function parseRelatorioAcidentesRH(aoa){
  const registros = [];
  let setorAtual = "", unidadeAtual = "";
  for(let i=0;i<aoa.length;i++){
    const row = aoa[i]||[];
    const c0 = String(row[0]!==undefined && row[0]!==null ? row[0] : "").trim();
    if(c0 === "Setor:"){
      setorAtual = String(row[1]||"").trim();
      unidadeAtual = String(row[3]||"").trim();
      continue;
    }
    if(!c0 || c0 === "Funcionário" || c0 === "Totalização do Setor") continue;
    const dataRaw = row[2];
    if(dataRaw===undefined || dataRaw===null || dataRaw==="") continue;
    const data = excelDataToStr(dataRaw);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
    registros.push({
      funcionario: c0,
      codigo: String(row[1]!==undefined && row[1]!==null ? row[1] : "").trim(),
      data,
      diasPerdidos: Number(row[3])||0,
      custo: row[4]!==undefined && row[4]!==null ? row[4] : "",
      setorRh: setorAtual,
      unidadeRh: unidadeAtual
    });
  }
  return registros;
}

// Sugere, entre os Setores cadastrados em Gestão, o que mais se parece com o texto trazido pelo RH
function sugerirSetorConciliacaoRH(setorRh){
  if(!setorRh) return "";
  const alvo = normalizarTextoComparacao(setorRh);
  return (ESTRUTURA.setores||[]).find(s=>normalizarTextoComparacao(s)===alvo) || "";
}

// Desenha na tela: a lista de pendências da conciliação com a planilha do RH
function renderConciliacaoRH(){
  const cont = document.getElementById("conciliacao-rh-lista");
  if(!pendenciasConciliacaoRH.length){ cont.innerHTML = ""; return; }
  cont.innerHTML = pendenciasConciliacaoRH.map((r,i)=>{
    const setorSugerido = sugerirSetorConciliacaoRH(r.setorRh);
    const obsSugerida = "Importado da planilha do RH — código "+(r.codigo||"—")+", setor RH \""+(r.setorRh||"—")+"\", unidade RH \""+(r.unidadeRh||"—")+"\".";
    return `
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <h3 style="margin:0;">${escHtml(r.funcionario)} — ${r.data.split("-").reverse().join("/")}</h3>
        <span class="sub">Da planilha do RH: código ${escHtml(r.codigo||"—")} · setor "${escHtml(r.setorRh||"—")}" · unidade "${escHtml(r.unidadeRh||"—")}" · custo R$ ${escHtml(String(r.custo))} · dias perdidos ${escHtml(String(r.diasPerdidos))}</span>
      </div>
      <div class="form-grid">
        <div class="field"><label>Nome do colaborador <span style="font-weight:400; text-transform:none; color:var(--areia-esc);">(da planilha)</span></label><input type="text" id="conc-rh-funcionario-${i}" value="${escHtml(r.funcionario)}"></div>
        <div class="field"><label>Data do acidente <span style="font-weight:400; text-transform:none; color:var(--areia-esc);">(da planilha)</span></label><input type="date" id="conc-rh-data-${i}" value="${r.data}"></div>
        <div class="field"><label>Dias de afastamento <span style="font-weight:400; text-transform:none; color:var(--areia-esc);">(da planilha)</span></label><input type="number" min="0" id="conc-rh-dias-${i}" value="${r.diasPerdidos}"></div>

        <div class="field"><label>Hora do acidente</label><input required type="time" id="conc-rh-hora-acidente-${i}"></div>
        <div class="field"><label>Hora do atendimento</label><input required type="time" id="conc-rh-hora-atendimento-${i}"></div>
        <div class="field"><label>Tipo de acidente</label>
          <select required id="conc-rh-tipo-${i}"><option value="">Selecione...</option><option value="Típico">Típico</option><option value="Trajeto">Trajeto</option></select>
        </div>

        <div class="field"><label>Praça</label>
          <select required id="conc-rh-praca-${i}"><option value="">Selecione...</option><option>SP</option><option>MG</option><option>ES</option><option>RJ</option></select>
        </div>
        <div class="field"><label>Tipo de negócio</label>
          <select required id="conc-rh-negocio-${i}"><option value="">Selecione...</option><option>Loja</option><option>Logística</option><option>CP</option><option>Corporativo</option></select>
        </div>
        <div class="field"><label>Loja / unidade</label>
          <select required id="conc-rh-loja-${i}" onchange="atualizarRegionalConciliacaoRH(${i})"><option value="">Selecione...</option>${UNIDADES.map(u=>`<option>${escHtml(u.nome)}</option>`).join("")}</select>
        </div>

        <div class="field"><label>Regional <span style="font-weight:400; text-transform:none; color:var(--areia-esc);">(automático)</span></label><input type="text" id="conc-rh-regional-${i}" disabled placeholder="Selecione a unidade"></div>
        <div class="field"><label>Setor <span style="font-weight:400; text-transform:none; color:var(--areia-esc);">${setorSugerido?"(sugestão da planilha)":""}</span></label>
          <select required id="conc-rh-setor-${i}"><option value="">Selecione...</option>${(ESTRUTURA.setores||[]).map(s=>`<option ${s===setorSugerido?"selected":""}>${escHtml(s)}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Função</label>
          <select required id="conc-rh-funcao-${i}"><option value="">Selecione...</option>${(ESTRUTURA.funcoes||[]).map(f=>`<option>${escHtml(f)}</option>`).join("")}</select>
        </div>

        <div class="field"><label>Motivo do acidente</label><input required type="text" id="conc-rh-motivo-${i}" placeholder="ex.: Corte com faca, Queda em escada..."></div>
        <div class="field"><label>Agente causador</label>
          <select required id="conc-rh-agente-${i}">
            <option value="">Selecione...</option>
            <option>Superfícies, Pisos e Estruturas</option>
            <option>Ferramentas Manuais Cortantes/Perfurantes</option>
            <option>Embalagens, Mobiliário e Outros</option>
            <option>Máquinas e Equipamentos</option>
            <option>Veículos</option>
            <option>Outros</option>
          </select>
        </div>
        <div class="field"><label>Local do acidente</label><input required type="text" id="conc-rh-local-${i}" placeholder="ex.: Doca de carga"></div>

        <div class="field"><label>Partes do corpo atingidas</label><input type="text" id="conc-rh-partes-${i}" placeholder="ex.: Dedo, Mão (separe por vírgula)"></div>
        <div class="field"><label>Gravidade</label>
          <select required id="conc-rh-gravidade-${i}">
            <option value="">Selecione...</option>
            <option ${r.diasPerdidos===0?"selected":""}>Sem afastamento</option>
            <option>Afastamento de baixo impacto</option>
            <option>Com afastamento</option>
            <option>Afastamento previdenciário</option>
            <option>Óbito</option>
          </select>
        </div>
        <div class="field full"><label>Observações</label><input type="text" id="conc-rh-obs-${i}" value="${escHtml(obsSugerida)}"></div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-primary inline" onclick="lancarAcidenteConciliacaoRH(${i})">Lançar este acidente</button>
        <button type="button" class="btn-secondary" onclick="ignorarConciliacaoRH(${i})">Ignorar esse registro</button>
      </div>
    </div>`;
  }).join("");
}

// Atualiza: regional automático ao escolher a loja/unidade na conciliação com o RH
function atualizarRegionalConciliacaoRH(i){
  const sel = document.getElementById("conc-rh-loja-"+i);
  const campo = document.getElementById("conc-rh-regional-"+i);
  if(!sel || !campo) return;
  const unidade = unidadePorNome(sel.value);
  campo.value = unidade && unidade.regional ? unidade.regional : "Não atribuído";
}

// Remove da lista de pendências sem lançar (ex.: já foi tratado manualmente)
function ignorarConciliacaoRH(i){
  pendenciasConciliacaoRH.splice(i,1);
  renderConciliacaoRH();
}

// Valida, salva no banco (mesmo caminho real do lançamento manual) e remove da lista de pendências
async function lancarAcidenteConciliacaoRH(i){
  const val = (id)=>{ const el = document.getElementById(id); return el ? el.value : ""; };
  const novo = {
    data: val("conc-rh-data-"+i),
    horaAcidente: val("conc-rh-hora-acidente-"+i),
    horaAtendimento: val("conc-rh-hora-atendimento-"+i),
    tipo: val("conc-rh-tipo-"+i),
    praca: val("conc-rh-praca-"+i),
    negocio: val("conc-rh-negocio-"+i),
    loja: val("conc-rh-loja-"+i).trim(),
    regional: val("conc-rh-regional-"+i) || "Não atribuído",
    setor: val("conc-rh-setor-"+i).trim(),
    funcao: val("conc-rh-funcao-"+i).trim(),
    funcionario: val("conc-rh-funcionario-"+i).trim(),
    motivo: normalizarAgrupamento(val("conc-rh-motivo-"+i)),
    agenteCausador: val("conc-rh-agente-"+i),
    local: val("conc-rh-local-"+i).trim(),
    partesAtingidas: val("conc-rh-partes-"+i).split(",").map(p=>normalizarAgrupamento(p)).filter(Boolean),
    gravidade: val("conc-rh-gravidade-"+i),
    dias: Number(val("conc-rh-dias-"+i))||0,
    obs: val("conc-rh-obs-"+i).trim()
  };
  const faltando = [];
  if(!novo.data) faltando.push("Data do acidente");
  if(!novo.funcionario) faltando.push("Nome do colaborador");
  if(!novo.horaAcidente) faltando.push("Hora do acidente");
  if(!novo.horaAtendimento) faltando.push("Hora do atendimento");
  if(!novo.tipo) faltando.push("Tipo de acidente");
  if(!novo.praca) faltando.push("Praça");
  if(!novo.negocio) faltando.push("Tipo de negócio");
  if(!novo.loja) faltando.push("Loja/unidade");
  if(!novo.setor) faltando.push("Setor");
  if(!novo.funcao) faltando.push("Função");
  if(!novo.motivo) faltando.push("Motivo do acidente");
  if(!novo.agenteCausador) faltando.push("Agente causador");
  if(!novo.local) faltando.push("Local do acidente");
  if(!novo.gravidade) faltando.push("Gravidade");
  if(faltando.length){ alert("Preencha antes de lançar: "+faltando.join(", ")); return; }

  const { data, error } = await sb.from("acidentes").insert({...acidenteToDb(novo), created_by: currentUser?currentUser.id:null}).select().single();
  if(error){ alert("Erro ao salvar o acidente no banco: "+error.message); return; }
  const acidenteSalvo = mapAcidenteFromDb(data);
  ACIDENTES.push(acidenteSalvo);
  notificarAdminsCoordenadores("acidente_novo", "Novo acidente registrado", acidenteSalvo.loja+" — "+acidenteSalvo.motivo, "acidente", acidenteSalvo.id);
  avisarNovoAcidente(acidenteSalvo);
  mostrarToast("Acidente de "+acidenteSalvo.funcionario+" lançado com sucesso.");
  pendenciasConciliacaoRH.splice(i,1);
  renderConciliacaoRH();
  popularFiltros();
  renderLancamentos();
}

