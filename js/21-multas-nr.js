/* =====================================================================
   MULTAS NR — calculadora de multas trabalhistas por descumprimento de NR
   Modelo: grau da infração (1 a 4) x tipo (S-Segurança / M-Medicina) x
   faixa de nº de empregados, conforme NR-28 (Fiscalização e Penalidades).
   ===================================================================== */

// Formata número como reais: formatar reais
function mnFormatarReais(v){
  if(v==null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
}

// Acha a faixa de nº de empregados que contém o valor n
function mnFaixa(n){
  const faixas = MULTAS_DADOS.faixasEmpregados || [];
  let f = faixas.find(f => n >= f.min && (f.max==null || n <= f.max));
  return f || faixas[faixas.length-1];
}

// Preenche o select de NRs com todas as NRs ativas disponíveis em NR_DADOS
function mnPopularNrs(){
  const sel = document.getElementById("mn-nr");
  if(!sel) return;
  const atual = sel.value;
  const nrs = Object.keys(NR_DADOS)
    .filter(nr => !NR_DADOS[nr].status || NR_DADOS[nr].status==="ativa")
    .sort((a,b)=> (parseInt(a.replace(/\D/g,""),10)||0) - (parseInt(b.replace(/\D/g,""),10)||0));
  sel.innerHTML = '<option value="">Selecione...</option>' + nrs.map(nr=>{
    const titulo = NR_DADOS[nr].titulo ? ` — ${NR_DADOS[nr].titulo}` : "";
    return `<option value="${escHtml(nr)}">${escHtml(nr)}${escHtml(titulo)}</option>`;
  }).join("");
  if(nrs.includes(atual)) sel.value = atual;
}

// Ao trocar a NR selecionada, repopula o select de itens
function mnAoTrocarNr(){
  const nr = document.getElementById("mn-nr").value;
  const selItem = document.getElementById("mn-item");
  document.getElementById("mn-item-obs").textContent = "";
  if(!nr){ selItem.innerHTML = '<option value="">Selecione a NR primeiro...</option>'; return; }
  const itens = (MULTAS_DADOS.itensPorNr[nr] || []);
  let opts = '<option value="">(Nenhum item específico listado — usar grau/tipo manualmente)</option>';
  opts += itens.map(it=>`<option value="${escHtml(it.item)}">${escHtml(it.item)} — ${escHtml(it.descricao)}</option>`).join("");
  selItem.innerHTML = opts;
  document.getElementById("mn-resultado").style.display = "none";
}

// Ao trocar o item, preenche automaticamente grau/tipo e mostra o código/observação
function mnAoTrocarItem(){
  const nr = document.getElementById("mn-nr").value;
  const itemCode = document.getElementById("mn-item").value;
  const info = (MULTAS_DADOS.itensPorNr[nr]||[]).find(x=>x.item===itemCode);
  const obs = document.getElementById("mn-item-obs");
  if(!info){ obs.textContent = ""; return; }
  if(info.grau) document.getElementById("mn-grau").value = String(info.grau);
  if(info.tipo) document.getElementById("mn-tipo").value = info.tipo;
  obs.textContent = `Código do item no Anexo II da NR-28: ${info.codigo||"não informado"}. Grau e tipo preenchidos automaticamente — você pode ajustar se achar que não se aplica ao seu caso.`;
}

// Calcula e mostra o valor estimado da multa
function mnCalcular(){
  const nr = document.getElementById("mn-nr").value;
  const itemCode = document.getElementById("mn-item").value;
  const n = parseInt(document.getElementById("mn-empregados").value, 10);
  const grau = document.getElementById("mn-grau").value;
  const tipo = document.getElementById("mn-tipo").value;
  const reincidente = document.getElementById("mn-reincidencia").value==="sim";

  if(!nr){ alert("Selecione a NR."); return; }
  if(!Number.isFinite(n) || n<1){ alert("Informe o número de empregados da empresa."); return; }

  const faixa = mnFaixa(n);
  const itemInfo = (MULTAS_DADOS.itensPorNr[nr]||[]).find(x=>x.item===itemCode);
  const tabela = tipo==="S" ? MULTAS_DADOS.estimadoPorFaixaGrauS : MULTAS_DADOS.estimadoPorFaixaGrauM;
  let range = tabela?.[faixa.chave]?.[grau];
  let origemValor = "estimado (faixa × grau × tipo)";
  if(!range){
    const conf = MULTAS_DADOS.confirmadoTetoPiso2025?.[tipo];
    range = conf ? [conf.minimo, conf.maximo] : null;
    origemValor = "teto/piso geral confirmado (sem detalhamento por faixa/grau disponível)";
  }

  const wrap = document.getElementById("mn-resultado");
  if(!range){
    wrap.style.display = "block";
    document.getElementById("mn-valor").textContent = "—";
    document.getElementById("mn-detalhes-lista").innerHTML = "";
    document.getElementById("mn-base-legal").innerHTML = '<span class="mn-sem-dados">Ainda não há dados suficientes pra estimar essa combinação. Consulte um especialista.</span>';
    return;
  }

  const [min, max] = range;
  const valorAplicado = reincidente ? max : null;

  wrap.style.display = "block";
  document.getElementById("mn-valor").innerHTML = reincidente
    ? mnFormatarReais(max)
    : `${mnFormatarReais(min)} <span class="cent">a</span> ${mnFormatarReais(max)}`;

  const linhas = [];
  linhas.push(["Porte da empresa (nº empregados)", `${n} — ${faixa.rotulo}`]);
  linhas.push(["Grau da infração", `Grau ${grau}`]);
  linhas.push(["Tipo", tipo==="S" ? "Segurança do Trabalho" : "Medicina do Trabalho"]);
  if(itemInfo) linhas.push(["Item / código (Anexo II)", `${itemInfo.item} — ${itemInfo.codigo||"—"}`]);
  linhas.push(["Faixa de valor estimada", `${mnFormatarReais(min)} a ${mnFormatarReais(max)}`]);
  linhas.push(["Origem do valor", origemValor]);
  if(reincidente) linhas.push(["Reincidência / embaraço / fraude", `Valor máximo da faixa aplicado: ${mnFormatarReais(max)}`]);
  document.getElementById("mn-detalhes-lista").innerHTML = linhas.map(([k,v])=>`<li><span>${escHtml(k)}</span><span>${escHtml(v)}</span></li>`).join("");

  let baseLegal = `<b>Base legal:</b> ${escHtml(MULTAS_DADOS.fonteLegal||"—")}`;
  if(MULTAS_DADOS.regraReincidencia) baseLegal += `<br><b>Regra de reincidência considerada:</b> ${escHtml(MULTAS_DADOS.regraReincidencia)}`;
  document.getElementById("mn-base-legal").innerHTML = baseLegal;

  wrap.scrollIntoView({behavior:"smooth", block:"nearest"});
}

// Leva o usuário até a explicação desse item/NR no módulo "NR Explicada"
function mnVerExplicacaoItem(){
  const nr = document.getElementById("mn-nr").value;
  if(!nr){ alert("Selecione uma NR primeiro."); return; }
  irParaView("nrexplicada", "consulta");
  setTimeout(()=>{ if(typeof nreAbrirNr==="function") nreAbrirNr(nr); }, 120);
}

// Inicializa o módulo Multas NR (chamado toda vez que o painel abre)
function initMultasNr(){
  mnPopularNrs();
}
