/* =====================================================================
   SAÚDE — indicadores de atestados (dados reais do Supabase)
   5 sub-telas: Visão Geral, Lojas & Regionais, Motivos & CID, Reincidência,
   Todos os Registros. Filtros (unidade/regional/tipo/data) no topo, aplicados
   a todas as sub-telas.
   ===================================================================== */

// Acima desse número de dias, um registro é tratado como "afastamento
// prolongado" (ex.: aposentadoria por invalidez com data-fim fictícia tipo
// 31/12/9999) e é excluído do cálculo de duração média, pra não distorcer o
// indicador — mas continua contado e visível nas tabelas/KPI dedicado.
const SAUDE_DIAS_CAP = 180;

// Inicializa: init saude
function initSaude(){
  const wrapImportar = document.getElementById("sd-import-wrap");
  if(wrapImportar) wrapImportar.style.display = ehAdminOuCoordenador() ? "flex" : "none";
  popularFiltrosSaude();
  renderSaudeAtual();
}

let saudeStatusTimeout = null;
// Mostra uma mensagem curta e transitória ao lado do botão de importar
function mostrarStatusImport(msg, cor){
  const status = document.getElementById("sd-import-status");
  if(!status) return;
  clearTimeout(saudeStatusTimeout);
  status.style.color = cor||"var(--areia-esc)";
  status.textContent = msg;
  status.style.display = "inline";
  if(cor==="var(--verde-esc)"){
    saudeStatusTimeout = setTimeout(()=>{ status.style.display = "none"; }, 4000);
  }
}

// Função do módulo: importar backup atestados
async function importarBackupAtestados(){
  const input = document.getElementById("sd-import-file");
  const file = input.files[0];
  if(!file){ mostrarStatusImport("Selecione um arquivo primeiro.", "var(--vermelho)"); return; }
  mostrarStatusImport("Lendo o arquivo...");
  try{
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {type:"array", cellDates:true});
    let registros = [];
    let mapaRegional = {};

    if(wb.SheetNames.includes("REGIONAIS")){
      const regs = XLSX.utils.sheet_to_json(wb.Sheets["REGIONAIS"], {defval:null});
      regs.forEach(r=>{ if(r.Regional && r.Lojas) mapaRegional[r.Lojas] = r.Regional; });
    }
    if(wb.SheetNames.includes("Atestados")){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets["Atestados"], {defval:null});
      registros = registros.concat(rows.filter(r=>r.Loja).map(r=>({
        matricula: r.Matricula!=null ? String(r.Matricula) : null,
        nome: r.Nome || null, loja: r.Loja || null, regional: mapaRegional[r.Loja] || null,
        data_atestado: normalizarDataImportacao(r.Data), hospital: r.Hospital || null, especialidade: null,
        motivo: r.Motivo || null, afastamento_inicio: normalizarDataImportacao(r.Inicio),
        afastamento_fim: normalizarDataImportacao(r.Fim), duracao_dias: Number(r.Dias)||0,
        tipo_atestado: r.Tipo || null, cid: r.CID || null, convenio: r.Convenio || null,
        setor: r.Setor || null, funcao: r.Funcao || null
      })));
    }
    if(wb.SheetNames.includes("BASE BOT")){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets["BASE BOT"], {defval:null});
      registros = registros.concat(rows.filter(r=>r.loja).map(r=>({
        matricula: null, nome: null, loja: r.loja || null, regional: mapaRegional[r.loja] || null,
        data_atestado: normalizarDataImportacao(r.data_atestado), hospital: null, especialidade: null,
        motivo: r.motivo || null, afastamento_inicio: normalizarDataImportacao(r.afastamento_inicio),
        afastamento_fim: normalizarDataImportacao(r.afastamento_fim), duracao_dias: Number(r.dias)||0,
        tipo_atestado: r.tipo || null, cid: r.cid || null, convenio: null, setor: null, funcao: null
      })));
    }

    if(!registros.length){
      mostrarStatusImport('Não encontrei nenhuma aba reconhecida ("Atestados" ou "BASE BOT") nesse arquivo.', "var(--vermelho)");
      return;
    }

    const LOTE = 500;
    let inseridos = 0;
    for(let i=0; i<registros.length; i+=LOTE){
      const lote = registros.slice(i, i+LOTE);
      mostrarStatusImport("Importando... "+Math.min(i+LOTE, registros.length)+" de "+registros.length);
      const { data, error } = await sb.from("atestados").insert(lote).select();
      if(error){ mostrarStatusImport("Erro ao importar (parou em "+inseridos+" registros): "+error.message, "var(--vermelho)"); return; }
      (data||[]).forEach(a=>{
        ATESTADOS.push({
          id:a.id, matricula:a.matricula, nome:a.nome, loja:a.loja, regional:a.regional,
          dataAtestado:a.data_atestado, hospital:a.hospital, especialidade:a.especialidade, motivo:a.motivo,
          afastamentoInicio:a.afastamento_inicio, afastamentoFim:a.afastamento_fim, duracaoDias:a.duracao_dias||0,
          tipoAtestado:a.tipo_atestado, cid:a.cid, convenio:a.convenio, setor:a.setor, funcao:a.funcao
        });
      });
      inseridos += lote.length;
    }

    mostrarStatusImport(inseridos+" registro(s) importado(s) com sucesso!", "var(--verde-esc)");
    input.value = "";
    popularFiltrosSaude();
    renderSaudeAtual();
    renderSaudeRegistros();
  }catch(e){
    mostrarStatusImport("Erro ao processar o arquivo: "+e.message, "var(--vermelho)");
  }
}

// Tudo fica numa tela só agora (sem abas) — os filtros do topo re-renderizam
// todos os blocos de uma vez.
function renderSaudeAtual(){
  renderSaudeVisaoGeral();
  renderSaudeLojasRegionais();
  renderSaudeMotivosCid();
  renderSaudeReincidencia();
  renderSaudeRegistros();
}

// Preenche: popular filtros saude
function popularFiltrosSaude(){
  fillSelect("sd-f-unidade", [...new Set(ATESTADOS.map(a=>a.loja).filter(Boolean))].sort());
  fillSelect("sd-f-regional", [...new Set(ATESTADOS.map(a=>a.regional).filter(Boolean))].sort());
  fillSelect("sd-lojas-regional", [...new Set(ATESTADOS.map(a=>a.regional).filter(Boolean))].sort());
  popularSaudeTipoDropdown();
}

/* ---- filtro de Tipo: dropdown de múltipla seleção ---- */
// vazio = "todos os tipos" (sem filtro)
let saudeTiposSelecionados = new Set();

function popularSaudeTipoDropdown(){
  const tipos = [...new Set(ATESTADOS.map(a=>a.tipoAtestado).filter(Boolean))].sort();
  // mantém marcados só os tipos que ainda existem na base (ex.: após reimportar)
  saudeTiposSelecionados = new Set([...saudeTiposSelecionados].filter(t=>tipos.includes(t)));
  const painel = document.getElementById("sd-f-tipo-painel");
  if(!painel) return;
  const acoes = painel.querySelector(".chk-dropdown-acoes");
  painel.querySelectorAll(".chk-dropdown-item").forEach(el=>el.remove());
  tipos.forEach(t=>{
    const item = document.createElement("label");
    item.className = "chk-dropdown-item";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.value = t; cb.checked = saudeTiposSelecionados.has(t);
    cb.onchange = ()=>toggleSaudeTipo(t, cb.checked);
    item.appendChild(cb);
    item.appendChild(document.createTextNode(" "+t));
    painel.insertBefore(item, acoes);
  });
  atualizarRotuloSaudeTipo();
}

// Alterna (mostra/esconde): toggle saude tipo dropdown
function toggleSaudeTipoDropdown(){
  document.getElementById("sd-f-tipo-dropdown").classList.toggle("aberto");
}

function toggleSaudeTipo(tipo, marcado){
  if(marcado) saudeTiposSelecionados.add(tipo);
  else saudeTiposSelecionados.delete(tipo);
  atualizarRotuloSaudeTipo();
  renderSaudeAtual();
}

function marcarTodosSaudeTipo(marcar){
  const tipos = [...new Set(ATESTADOS.map(a=>a.tipoAtestado).filter(Boolean))];
  saudeTiposSelecionados = marcar ? new Set(tipos) : new Set();
  document.querySelectorAll("#sd-f-tipo-painel .chk-dropdown-item input").forEach(cb=>cb.checked = marcar);
  atualizarRotuloSaudeTipo();
  renderSaudeAtual();
}

function atualizarRotuloSaudeTipo(){
  const btn = document.getElementById("sd-f-tipo-btn");
  if(!btn) return;
  const n = saudeTiposSelecionados.size;
  btn.textContent = n===0 ? "Todos" : (n===1 ? [...saudeTiposSelecionados][0] : n+" selecionados");
}

// fecha o dropdown de tipo ao clicar fora dele
document.addEventListener("click", (e)=>{
  const dd = document.getElementById("sd-f-tipo-dropdown");
  if(dd && dd.classList.contains("aberto") && !dd.contains(e.target)) dd.classList.remove("aberto");
});

// Limpa: limpar filtros saude
function limparFiltrosSaude(){
  ["sd-f-unidade","sd-f-regional","sd-f-de","sd-f-ate"].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value = "";
  });
  marcarTodosSaudeTipo(false);
}

// Função do módulo: dados filtrados saude
function dadosFiltradosSaude(){
  const unidade = document.getElementById("sd-f-unidade")?.value;
  const regional = document.getElementById("sd-f-regional")?.value;
  const de = document.getElementById("sd-f-de")?.value;
  const ate = document.getElementById("sd-f-ate")?.value;
  return ATESTADOS.filter(a=>{
    if(unidade && a.loja!==unidade) return false;
    if(regional && a.regional!==regional) return false;
    if(saudeTiposSelecionados.size && !saudeTiposSelecionados.has(a.tipoAtestado)) return false;
    if(de && (!a.dataAtestado || a.dataAtestado<de)) return false;
    if(ate && (!a.dataAtestado || a.dataAtestado>ate)) return false;
    return true;
  });
}

/* ---- VISÃO GERAL ---- */
function renderSaudeVisaoGeral(){
  const dados = dadosFiltradosSaude();
  document.getElementById("sd-kpi-total").textContent = dados.length;

  const totalDias = dados.reduce((s,a)=>s+(a.duracaoDias||0),0);
  document.getElementById("sd-kpi-dias").textContent = totalDias;

  const colaboradores = new Set(dados.map(a=>a.matricula).filter(Boolean));
  document.getElementById("sd-kpi-colaboradores").textContent = colaboradores.size;

  // duração média: exclui outliers (afastamentos prolongados) do cálculo,
  // pra um único registro com data-fim irreal não distorcer o indicador
  const diasValidos = dados.filter(a=>(a.duracaoDias||0) <= SAUDE_DIAS_CAP);
  const somaDiasValidos = diasValidos.reduce((s,a)=>s+(a.duracaoDias||0),0);
  document.getElementById("sd-kpi-media").textContent = diasValidos.length ? (somaDiasValidos/diasValidos.length).toFixed(1) : "0";

  const prolongados = dados.filter(a=>(a.duracaoDias||0) > SAUDE_DIAS_CAP);
  document.getElementById("sd-kpi-prolongados").textContent = prolongados.length;

  const medicos = dados.filter(a=>/m[eé]dic/i.test(a.tipoAtestado||""));
  document.getElementById("sd-kpi-pct-medico").textContent = dados.length ? Math.round(medicos.length/dados.length*100)+"%" : "0%";

  // evolução mensal
  const nomesMes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const rotuloMes = m=>{ const [ano,mes]=m.split("-"); return nomesMes[Number(mes)-1]+"/"+ano.slice(2); };
  const comData = dados.filter(a=>typeof a.dataAtestado==="string" && /^\d{4}-\d{2}/.test(a.dataAtestado));
  const mesGrupos = agrupar(comData, a=>a.dataAtestado.slice(0,7));
  const mesesOrdenados = Object.keys(mesGrupos).sort();
  criarChart("saudeEvolucao", "chart-saude-evolucao", {
    type:"line",
    data:{ labels:mesesOrdenados.map(rotuloMes), datasets:[{label:"Registros", data:mesesOrdenados.map(m=>mesGrupos[m].length), borderColor:"#00733f", backgroundColor:"rgba(0,115,63,0.15)", fill:true, tension:0.3, pointRadius:3, pointBackgroundColor:"#00733f", pointHoverRadius:5}]},
    options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const porUnidade = {};
  dados.forEach(a=>{ if(a.loja){ porUnidade[a.loja] = (porUnidade[a.loja]||0)+1; } });
  const topUnidades = Object.entries(porUnidade).sort((a,b)=>b[1]-a[1]).slice(0,12);
  criarChart("saudeUnidade", "chart-saude-unidade", {
    type:"bar",
    data:{ labels:topUnidades.map(u=>u[0]), datasets:[{label:"Registros", data:topUnidades.map(u=>u[1]), backgroundColor:"#00733f", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const porRegional = {};
  dados.forEach(a=>{ const r = a.regional||"Não mapeado"; porRegional[r] = (porRegional[r]||0)+1; });
  criarChart("saudeRegional", "chart-saude-regional", {
    type:"doughnut",
    data:{ labels:Object.keys(porRegional), datasets:[{data:Object.values(porRegional), backgroundColor:["#00733f","#faa61a","#a15a33","#a35e8e","#24a076","#f06650","#54412f","#9f8167","#54be95"], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom", labels:{font:{size:10}}}}}
  });
}

/* ---- LOJAS & REGIONAIS ---- */
function renderSaudeLojasRegionais(){
  const dados = dadosFiltradosSaude();

  // ranking por regional: registros + dias
  const regGrupos = {};
  dados.forEach(a=>{
    const r = a.regional||"Não mapeado";
    if(!regGrupos[r]) regGrupos[r] = {qtd:0, dias:0};
    regGrupos[r].qtd++; regGrupos[r].dias += (a.duracaoDias||0);
  });
  const regOrdenado = Object.entries(regGrupos).sort((a,b)=>b[1].qtd-a[1].qtd);
  criarChart("saudeRankingRegional", "chart-saude-ranking-regional", {
    type:"bar",
    data:{ labels:regOrdenado.map(r=>r[0]), datasets:[
      {label:"Registros", data:regOrdenado.map(r=>r[1].qtd), backgroundColor:"#00733f", borderRadius:6},
      {label:"Dias de afastamento", data:regOrdenado.map(r=>r[1].dias), backgroundColor:"#faa61a", borderRadius:6}
    ]},
    options:{indexAxis:"y", scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  // top 15 lojas: combo barra (registros) + linha (dias)
  const lojaGrupos = {};
  dados.forEach(a=>{
    if(!a.loja) return;
    if(!lojaGrupos[a.loja]) lojaGrupos[a.loja] = {qtd:0, dias:0, regional:a.regional, matriculas:new Set()};
    lojaGrupos[a.loja].qtd++; lojaGrupos[a.loja].dias += (a.duracaoDias||0);
    if(a.matricula) lojaGrupos[a.loja].matriculas.add(a.matricula);
  });
  const lojaOrdenado = Object.entries(lojaGrupos).sort((a,b)=>b[1].qtd-a[1].qtd).slice(0,15);
  criarChart("saudeTopLojas", "chart-saude-top-lojas", {
    data:{ labels:lojaOrdenado.map(l=>l[0]), datasets:[
      {type:"bar", label:"Registros", data:lojaOrdenado.map(l=>l[1].qtd), backgroundColor:"#00733f", borderRadius:6, yAxisID:"y"},
      {type:"line", label:"Dias de afastamento", data:lojaOrdenado.map(l=>l[1].dias), borderColor:"#ee3135", backgroundColor:"#ee3135", yAxisID:"y1", tension:0.3, pointRadius:3}
    ]},
    options:{
      scales:{
        x:{ticks:{autoSkip:false, maxRotation:60, minRotation:40}},
        y:{beginAtZero:true, ticks:{precision:0}, position:"left"},
        y1:{beginAtZero:true, position:"right", grid:{drawOnChartArea:false}}
      }
    }
  });

  // tabela: detalhamento por loja (todas, não só top 15), com filtro de regional próprio
  const regionalFiltro = document.getElementById("sd-lojas-regional")?.value;
  let linhas = Object.entries(lojaGrupos);
  if(regionalFiltro) linhas = linhas.filter(l=>l[1].regional===regionalFiltro);
  linhas = linhas.sort((a,b)=>b[1].qtd-a[1].qtd);
  const tbody = document.getElementById("tbl-saude-lojas");
  if(tbody){
    if(!linhas.length){
      tbody.innerHTML = `<tr><td colspan="5"><div class="lista-vazio"><b>Nenhum registro encontrado</b>Ajuste os filtros para ver os resultados.</div></td></tr>`;
    }else{
      tbody.innerHTML = linhas.map(([loja,info])=>`<tr>
        <td>${escHtml(loja)}</td>
        <td>${escHtml(info.regional||"—")}</td>
        <td>${info.qtd}</td>
        <td>${info.dias}</td>
        <td>${info.matriculas.size}</td>
      </tr>`).join("");
    }
  }
}

/* ---- MOTIVOS & CID ---- */
function renderSaudeMotivosCid(){
  const dados = dadosFiltradosSaude();

  const porMotivo = {};
  dados.forEach(a=>{ const m = (a.motivo||"Não informado").toUpperCase(); if(m!=="NÃO INFORMADO"&&m!=="COMPARECIMENTO") porMotivo[m] = (porMotivo[m]||0)+1; });
  const topMotivos = Object.entries(porMotivo).sort((a,b)=>b[1]-a[1]).slice(0,10);
  criarChart("saudeMotivo", "chart-saude-motivo", {
    type:"bar",
    data:{ labels:topMotivos.map(m=>m[0]), datasets:[{label:"Registros", data:topMotivos.map(m=>m[1]), backgroundColor:"#ee3135", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const porCid = {};
  dados.forEach(a=>{ if(a.cid) porCid[a.cid] = (porCid[a.cid]||0)+1; });
  const topCid = Object.entries(porCid).sort((a,b)=>b[1]-a[1]).slice(0,10);
  criarChart("saudeCid", "chart-saude-cid", {
    type:"bar",
    data:{ labels:topCid.map(c=>c[0]), datasets:[{label:"Registros", data:topCid.map(c=>c[1]), backgroundColor:"#a35e8e", borderRadius:6}]},
    options:{indexAxis:"y", plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const porTipo = {};
  dados.forEach(a=>{ const t = a.tipoAtestado||"Não informado"; porTipo[t] = (porTipo[t]||0)+1; });
  const topTipos = Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).slice(0,8);
  criarChart("saudeTipo", "chart-saude-tipo", {
    type:"doughnut",
    data:{ labels:topTipos.map(t=>t[0]), datasets:[{data:topTipos.map(t=>t[1]), backgroundColor:["#faa61a","#00b262","#a15a33","#a35e8e","#f06650","#54be95","#9f8167","#54412f"], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom", labels:{font:{size:10}}}}}
  });

  const porConvenio = {};
  dados.forEach(a=>{ const c = a.convenio||"Não informado"; porConvenio[c] = (porConvenio[c]||0)+1; });
  const topConvenio = Object.entries(porConvenio).sort((a,b)=>b[1]-a[1]).slice(0,8);
  criarChart("saudeConvenio", "chart-saude-convenio", {
    type:"doughnut",
    data:{ labels:topConvenio.map(c=>c[0]), datasets:[{data:topConvenio.map(c=>c[1]), backgroundColor:["#00733f","#faa61a","#a15a33","#a35e8e","#24a076","#f06650","#54412f","#9f8167"], borderWidth:2, borderColor:"#fffdfa"}]},
    options:{plugins:{legend:{position:"bottom", labels:{font:{size:10}}}}}
  });
}

/* ---- REINCIDÊNCIA ---- */
function renderSaudeReincidencia(){
  const dados = dadosFiltradosSaude();

  const grupos = {};
  dados.forEach(a=>{
    const chave = a.matricula || (a.nome ? "nome:"+a.nome : null);
    if(!chave) return;
    if(!grupos[chave]) grupos[chave] = {nome:a.nome, loja:a.loja, setor:a.setor, funcao:a.funcao, qtd:0, dias:0};
    grupos[chave].qtd++; grupos[chave].dias += (a.duracaoDias||0);
  });

  const colaboradores = Object.values(grupos);
  const reincidentes = colaboradores.filter(c=>c.qtd>=2).sort((a,b)=>b.qtd-a.qtd || b.dias-a.dias);

  document.getElementById("sd-kpi-reincidentes").textContent = reincidentes.length;
  document.getElementById("sd-kpi-pct-reincidencia").textContent = colaboradores.length ? Math.round(reincidentes.length/colaboradores.length*100)+"%" : "0%";

  const tbody = document.getElementById("tbl-saude-reincidencia");
  if(!tbody) return;
  if(!reincidentes.length){
    tbody.innerHTML = `<tr><td colspan="6"><div class="lista-vazio"><b>Nenhum colaborador reincidente</b>Ninguém com 2 ou mais registros no período filtrado.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = reincidentes.slice(0,100).map(c=>`<tr>
    <td>${escHtml(c.nome||"—")}</td>
    <td>${escHtml(c.loja||"—")}</td>
    <td>${escHtml(c.setor||"—")}</td>
    <td>${escHtml(c.funcao||"—")}</td>
    <td>${c.qtd}</td>
    <td>${c.dias}</td>
  </tr>`).join("");
}

/* ---- TODOS OS REGISTROS ---- */
function ordenarSaudeRegistros(campo){
  if(ordenacaoSaudeRegistros.campo===campo) ordenacaoSaudeRegistros.dir *= -1;
  else ordenacaoSaudeRegistros = {campo, dir:1};
  renderSaudeRegistros();
}

function renderSaudeRegistros(){
  const tbody = document.getElementById("tbl-saude-registros");
  if(!tbody) return;
  const busca = (document.getElementById("sd-busca")?.value||"").trim().toLowerCase();
  let linhas = ATESTADOS.filter(a=>{
    if(!busca) return true;
    const alvo = [a.nome,a.motivo,a.loja,a.cid,a.setor,a.funcao].filter(Boolean).join(" ").toLowerCase();
    return alvo.includes(busca);
  });
  const mapaCampo = {data_atestado:"dataAtestado", loja:"loja", regional:"regional", nome:"nome", setor:"setor", funcao:"funcao", tipo_atestado:"tipoAtestado", motivo:"motivo", cid:"cid", afastamento_inicio:"afastamentoInicio", afastamento_fim:"afastamentoFim", duracao_dias:"duracaoDias"};
  const {campo, dir} = ordenacaoSaudeRegistros;
  const chave = mapaCampo[campo]||campo;
  linhas = linhas.slice().sort((a,b)=>{
    let va = a[chave], vb = b[chave];
    if(chave==="duracaoDias"){ va = Number(va)||0; vb = Number(vb)||0; }
    else { va = (va||"").toString(); vb = (vb||"").toString(); }
    if(va<vb) return -1*dir;
    if(va>vb) return 1*dir;
    return 0;
  });

  const contador = document.getElementById("sd-contador");
  if(contador) contador.textContent = linhas.length+" registro(s) de "+ATESTADOS.length+" no total.";

  if(!linhas.length){
    tbody.innerHTML = `<tr><td colspan="12"><div class="lista-vazio"><b>Nenhum registro encontrado</b>Ajuste a busca para ver os resultados.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = linhas.map(a=>`<tr>
    <td class="col-sticky" style="min-width:110px; max-width:110px;">${formataData(a.dataAtestado)}</td>
    <td>${a.loja||"—"}</td>
    <td>${a.regional||"—"}</td>
    <td>${a.nome||"—"}</td>
    <td>${a.setor||"—"}</td>
    <td>${a.funcao||"—"}</td>
    <td>${a.tipoAtestado||"—"}</td>
    <td>${a.motivo||"—"}</td>
    <td>${a.cid||"—"}</td>
    <td>${formataData(a.afastamentoInicio)}</td>
    <td>${formataData(a.afastamentoFim)}</td>
    <td>${a.duracaoDias||0}</td>
  </tr>`).join("");
}
