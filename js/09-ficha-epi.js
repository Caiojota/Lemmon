/* =====================================================================
   FICHA DE EPI — marcação por colaborador, lote, novos admitidos e auditoria
   ===================================================================== */

// Função do módulo: invalidar base epi
function invalidarBaseEpi(){ EPI_BASE.carregada = false; EPI_BASE.promessa = null; }

// Função do módulo: carregar base epi
async function carregarBaseEpi(){
  if(EPI_BASE.carregada) return EPI_BASE;
  if(!EPI_BASE.promessa){
    EPI_BASE.promessa = (async()=>{
      const [colabs, epis] = await Promise.all([
        buscarTodasLinhas("colaboradores", "id,matricula,nome,loja,setor,cargo,admissao"),
        buscarTodasLinhas("epi_por_funcao", "id,setor,funcao,ca,descricao,ordem")
      ]);
      const porMatricula = new Map();            // se a matrícula repetir, vale o último importado
      colabs.forEach(c=>{ porMatricula.set(String(c.matricula).trim(), c); });
      const indice = new Map();
      epis.forEach(e=>{
        const chave = normalizarTextoComparacao(e.setor)+"|"+normalizarTextoComparacao(e.funcao);
        if(!indice.has(chave)) indice.set(chave, []);
        indice.get(chave).push(e);
      });
      indice.forEach(lista=>lista.sort((a,b)=>(a.ordem||0)-(b.ordem||0)));
      EPI_BASE.colaboradores = [...porMatricula.values()];
      EPI_BASE.epis = epis;
      EPI_BASE.indiceEpis = indice;
      EPI_BASE.carregada = true;
      return EPI_BASE;
    })().catch(e=>{ EPI_BASE.promessa = null; throw e; });
  }
  return EPI_BASE.promessa;
}

// Função do módulo: epis da funcao epi
function episDaFuncaoEpi(setor, cargo){
  return EPI_BASE.indiceEpis.get(normalizarTextoComparacao(setor)+"|"+normalizarTextoComparacao(cargo)) || [];
}

// Função do módulo: lojas base epi
function lojasBaseEpi(incluirUnidades){
  const mapa = new Map();
  EPI_BASE.colaboradores.forEach(c=>{ const k = normalizarTextoComparacao(c.loja); if(k && !mapa.has(k)) mapa.set(k, c.loja); });
  if(incluirUnidades) UNIDADES.forEach(u=>{ const k = normalizarTextoComparacao(u.nome); if(k && !mapa.has(k)) mapa.set(k, u.nome); });
  return [...mapa.values()].sort(cmpPtBr);
}

// Função do módulo: setores epi disponiveis
function setoresEpiDisponiveis(){
  const mapa = new Map();
  EPI_BASE.epis.forEach(e=>{ const k = normalizarTextoComparacao(e.setor); if(k && !mapa.has(k)) mapa.set(k, e.setor); });
  return [...mapa.values()].sort(cmpPtBr);
}

// Função do módulo: funcoes epi do setor
function funcoesEpiDoSetor(setor){
  const s = normalizarTextoComparacao(setor), mapa = new Map();
  EPI_BASE.epis.forEach(e=>{
    if(normalizarTextoComparacao(e.setor)!==s) return;
    const k = normalizarTextoComparacao(e.funcao);
    if(k && !mapa.has(k)) mapa.set(k, e.funcao);
  });
  return [...mapa.values()].sort(cmpPtBr);
}

// Preenche: preencher select epi
function preencherSelectEpi(id, valores, rotuloVazio){
  const sel = document.getElementById(id);
  if(!sel) return;
  const atual = sel.value;
  sel.innerHTML = `<option value="">${escHtml(rotuloVazio)}</option>` + valores.map(v=>`<option value="${escHtml(v)}">${escHtml(v)}</option>`).join("");
  if(valores.includes(atual)) sel.value = atual;
}

// Inicializa: init ficha epi
/* ---- Entrada na aba e navegação entre sub-abas ---- */
async function initFichaEpi(){
  const aviso = document.getElementById("fe-aviso-base");
  try{
    await carregarBaseEpi();
  }catch(e){
    aviso.style.display = "block";
    aviso.textContent = "Não foi possível carregar a base de colaboradores e EPIs: "+(e && e.message ? e.message : e);
    return;
  }
  if(!EPI_BASE.colaboradores.length){
    aviso.style.display = "block";
    aviso.textContent = "A base de colaboradores está vazia. Um administrador precisa importar a planilha em Gestão › Ficha de EPI.";
  } else {
    aviso.style.display = "none";
  }
  preencherSelectEpi("fe-lote-loja", lojasBaseEpi(false), "Selecione a loja...");
  preencherSelectEpi("fe-novo-loja", lojasBaseEpi(true), "Selecione...");
  preencherSelectEpi("fe-novo-setor", setoresEpiDisponiveis(), "Selecione...");
  aoTrocarLojaLoteEpi();
  aoTrocarSetorNovoEpi();
  renderAdmitidosEpi();
}

// Troca para a sub-tela: mostrar sub ficha epi
function mostrarSubFichaEpi(sub){
  document.querySelectorAll("#view-fichaEpi .insp-tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('#view-fichaEpi .insp-tab[data-sub="'+sub+'"]').classList.add("active");
  document.querySelectorAll("#view-fichaEpi .insp-sub").forEach(s=>s.classList.remove("active"));
  document.getElementById("fichaEpi-sub-"+sub).classList.add("active");
  if(sub==="auditoria") initAuditoriaEpi();
  if(sub==="entrega") initEntregaEpi();
  if(sub==="estoque") initEstoqueEpi();
}

// Função do módulo: ajustar abas ficha epi
function ajustarAbasFichaEpi(){
  const tem = k => (currentUser.modulos||[]).includes(k);
  const abas = [...document.querySelectorAll("#view-fichaEpi .insp-tab")];
  abas.forEach(b=>{ b.style.display = (b.dataset.sub==="auditoria" ? tem("auditoriaEpi") : tem("fichaEpi")) ? "" : "none"; });
  const ativa = abas.find(b=>b.classList.contains("active"));
  if(!ativa || ativa.style.display==="none"){ const p = abas.find(b=>b.style.display!=="none"); if(p) mostrarSubFichaEpi(p.dataset.sub); }
  else if(ativa.dataset.sub==="auditoria") initAuditoriaEpi();
}

// Função do módulo: imprimir folhas epi
/* ---- Impressão: usa um contêiner próprio, fora do app, para sair só as folhas ---- */
function imprimirFolhasEpi(html){
  const raiz = document.getElementById("epi-print-root");
  raiz.innerHTML = html;
  document.body.classList.add("imprimindo-epi");
  const limpar = ()=>{
    document.body.classList.remove("imprimindo-epi");
    raiz.innerHTML = "";
    window.removeEventListener("afterprint", limpar);
  };
  window.addEventListener("afterprint", limpar);
  setTimeout(()=>window.print(), 150);
}

// Função do módulo: imprimir previa epi
function imprimirPreviaEpi(idContainer){
  const el = document.getElementById(idContainer);
  if(!el || !el.innerHTML.trim()){ alert("Gere a ficha antes de imprimir."); return; }
  imprimirFolhasEpi(el.innerHTML);
}

// Função do módulo: itens historico epi
/* ---- Histórico de fichas (alimenta a aba Auditoria EPI) ---- */
function itensHistoricoEpi(epis){
  return epis.map(e=>({descricao:e.descricao, ca:e.ca||null, jaEntregue:!!e.jaEntregue, dataEntrega:e.dataEntrega||null}));
}

// Função do módulo: registrar fichas no historico
async function registrarFichasNoHistorico(lista){
  const linhas = lista.map(({colab, epis})=>({
    matricula: colab.matricula ? String(colab.matricula) : "", nome_colaborador: colab.nome||null, loja: colab.loja||null,
    setor: colab.setor||null, funcao: colab.cargo||null, itens: itensHistoricoEpi(epis)
  }));
  const gravadas = [];
  for(let i=0; i<linhas.length; i+=200){
    const { data, error } = await sb.from("epi_fichas_impressas").insert(linhas.slice(i, i+200)).select();
    if(error){ console.error("[EPI] não foi possível registrar no histórico:", error); return {ok:false, qtd:gravadas.length, erro:error, linhas:gravadas}; }
    (data||[]).forEach(r=>{ gravadas.push(r); EPI_FICHAS_IMPRESSAS.unshift(mapFichaEpiFromDb(r)); });
  }
  return {ok:true, qtd:gravadas.length, linhas:gravadas};
}

// Função do módulo: nova busca ficha epi
/* ---- Ficha individual (por matrícula) ---- */
function novaBuscaFichaEpi(){
  document.getElementById("fe-ind-previa").style.display = "none";
  document.getElementById("fe-ind-marcacao").style.display = "none";
  document.getElementById("fe-ind-busca").style.display = "block";
  document.getElementById("fe-ind-status").textContent = "";
  const campo = document.getElementById("fe-ind-matricula");
  campo.value = "";
  campo.focus();
  fichaEpiIndividual = null;
}

// Função do módulo: voltar para marcacao epi
function voltarParaMarcacaoEpi(){
  document.getElementById("fe-ind-previa").style.display = "none";
  document.getElementById("fe-ind-marcacao").style.display = "block";
}

// Função do módulo: buscar ficha epi
async function buscarFichaEpi(){
  const matricula = document.getElementById("fe-ind-matricula").value.trim();
  const status = document.getElementById("fe-ind-status");
  if(!matricula){ status.style.color = "var(--vermelho)"; status.textContent = "Digite a matrícula."; return; }
  status.style.color = "var(--areia-esc)";
  status.textContent = "Buscando...";
  try{
    await carregarBaseEpi();
  }catch(e){
    status.style.color = "var(--vermelho)";
    status.textContent = "Erro ao carregar a base: "+(e && e.message ? e.message : e);
    return;
  }
  const colab = EPI_BASE.colaboradores.find(c=>String(c.matricula).trim()===matricula);
  if(!colab){
    status.style.color = "var(--vermelho)";
    status.textContent = "Matrícula não encontrada na base. Se for um novo admitido, use a aba \"Novo admitido (fora da base)\".";
    return;
  }
  const epis = episDaFuncaoEpi(colab.setor, colab.cargo);
  fichaEpiIndividual = {colab, epis, historicoId:null};
  renderizarMarcacaoEpis(colab, epis);
  document.getElementById("fe-ind-busca").style.display = "none";
  document.getElementById("fe-ind-marcacao").style.display = "block";
  status.textContent = "";
}

// Desenha na tela: renderizar marcacao epis
function renderizarMarcacaoEpis(colab, epis){
  document.getElementById("fe-ind-colab-info").innerHTML = `<b>${escHtml(colab.nome||"—")}</b> · matrícula ${escHtml(colab.matricula)} · ${escHtml(colab.loja||"—")} · ${escHtml(colab.setor||"—")} · ${escHtml(colab.cargo||"—")}`;
  const tbody = document.getElementById("fe-ind-marcacao-tbody");
  if(!epis.length){
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--terracota); text-align:center; padding:14px;">Nenhum EPI padrão cadastrado para "${escHtml(colab.setor||"—")} / ${escHtml(colab.cargo||"—")}". A ficha será gerada com as linhas em branco.</td></tr>`;
    return;
  }
  tbody.innerHTML = epis.map((e,idx)=>`
    <tr>
      <td style="text-align:center;"><input type="checkbox" id="fe-mk-check-${idx}" onchange="document.getElementById('fe-mk-data-${idx}').disabled = !this.checked; if(this.checked) document.getElementById('fe-mk-data-${idx}').focus();"></td>
      <td>${escHtml(e.descricao)}</td>
      <td>${escHtml(e.ca||"—")}</td>
      <td><input type="date" id="fe-mk-data-${idx}" disabled style="width:100%;"></td>
    </tr>
  `).join("");
}

// Função do módulo: gerar ficha individual
async function gerarFichaIndividual(){
  if(!fichaEpiIndividual) return;
  const { colab } = fichaEpiIndividual;
  const epis = fichaEpiIndividual.epis.map((e,idx)=>{
    const check = document.getElementById("fe-mk-check-"+idx);
    const data = document.getElementById("fe-mk-data-"+idx);
    const jaTem = !!(check && check.checked);
    return {...e, jaEntregue:jaTem, dataEntrega:(jaTem && data && data.value) ? data.value : null};
  });
  document.getElementById("fe-ind-folhas").innerHTML = renderizarFichaEpiHtml(colab, epis);
  document.getElementById("fe-ind-marcacao").style.display = "none";
  document.getElementById("fe-ind-previa").style.display = "block";
  // registra no histórico; se o usuário ajustar e gerar de novo, atualiza o mesmo registro (sem duplicar)
  if(fichaEpiIndividual.historicoId){
    const id = fichaEpiIndividual.historicoId;
    const { error } = await sb.from("epi_fichas_impressas").update({itens: itensHistoricoEpi(epis)}).eq("id", id);
    if(!error){ const local = EPI_FICHAS_IMPRESSAS.find(f=>f.id===id); if(local) local.itens = itensHistoricoEpi(epis); }
  } else {
    const r = await registrarFichasNoHistorico([{colab, epis}]);
    if(r.ok && r.linhas[0]) fichaEpiIndividual.historicoId = r.linhas[0].id;
  }
}

// Função do módulo: colaboradores do lote epi
/* ---- Impressão em lote (por loja ou loja + setor) ---- */
function colaboradoresDoLoteEpi(){
  const loja = document.getElementById("fe-lote-loja").value;
  const setor = document.getElementById("fe-lote-setor").value;
  const incluirSem = document.getElementById("fe-lote-incluir-sem").checked;
  if(!loja) return {lista:[], total:0, semLista:0};
  const lojaN = normalizarTextoComparacao(loja), setorN = normalizarTextoComparacao(setor);
  let lista = EPI_BASE.colaboradores
    .filter(c=> normalizarTextoComparacao(c.loja)===lojaN && (!setor || normalizarTextoComparacao(c.setor)===setorN))
    .map(c=>({colab:c, epis:episDaFuncaoEpi(c.setor, c.cargo)}));
  const total = lista.length;
  const semLista = lista.filter(x=>!x.epis.length).length;
  if(!incluirSem) lista = lista.filter(x=>x.epis.length);
  lista.sort((a,b)=> cmpPtBr(a.colab.setor||"", b.colab.setor||"") || cmpPtBr(a.colab.nome||"", b.colab.nome||""));
  return {lista, total, semLista};
}

// Reage à ação:: ao trocar loja lote epi
function aoTrocarLojaLoteEpi(){
  const loja = document.getElementById("fe-lote-loja").value;
  const lojaN = normalizarTextoComparacao(loja);
  const mapa = new Map();
  if(loja){
    EPI_BASE.colaboradores.forEach(c=>{
      if(normalizarTextoComparacao(c.loja)!==lojaN) return;
      const k = normalizarTextoComparacao(c.setor);
      if(k && !mapa.has(k)) mapa.set(k, c.setor);
    });
  }
  const sel = document.getElementById("fe-lote-setor");
  sel.innerHTML = '<option value="">Todos os setores (loja inteira)</option>' + [...mapa.values()].sort(cmpPtBr).map(s=>`<option value="${escHtml(s)}">${escHtml(s)}</option>`).join("");
  atualizarPreviaLoteEpi();
}

// Atualiza: atualizar previa lote epi
function atualizarPreviaLoteEpi(){
  const resumo = document.getElementById("fe-lote-resumo");
  const btn = document.getElementById("fe-lote-btn");
  const tbody = document.getElementById("fe-lote-tbody");
  const loja = document.getElementById("fe-lote-loja").value;
  if(!loja){
    resumo.textContent = "Selecione uma loja para ver quantas fichas serão geradas.";
    btn.disabled = true;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:14px; color:var(--areia-esc);">Nenhuma loja selecionada.</td></tr>';
    return;
  }
  const { lista, total, semLista } = colaboradoresDoLoteEpi();
  const setor = document.getElementById("fe-lote-setor").value;
  const escopo = setor ? loja+" › "+setor : loja+" (todos os setores)";
  resumo.textContent = lista.length+" ficha(s) a gerar · "+escopo+" · "+(lista.length*2)+" página(s) em frente e verso"
    + (semLista ? " · "+semLista+" colaborador(es) sem lista de EPI cadastrada"+(lista.length<total ? " (não incluídos)" : " (linhas em branco)") : "");
  btn.disabled = !lista.length;
  tbody.innerHTML = lista.length ? lista.map(({colab, epis})=>`
    <tr>
      <td>${escHtml(colab.matricula)}</td>
      <td>${escHtml(colab.nome||"—")}</td>
      <td>${escHtml(colab.setor||"—")}</td>
      <td>${escHtml(colab.cargo||"—")}</td>
      <td>${epis.length ? epis.length : '<span style="color:var(--terracota);">sem lista</span>'}</td>
    </tr>`).join("") : '<tr><td colspan="5" style="text-align:center; padding:14px; color:var(--areia-esc);">Nenhum colaborador encontrado com esse filtro.</td></tr>';
}

// Função do módulo: gerar lote epi
async function gerarLoteEpi(){
  const { lista } = colaboradoresDoLoteEpi();
  if(!lista.length){ alert("Selecione uma loja com colaboradores na base."); return; }
  if(lista.length>400 && !confirm("Serão geradas "+lista.length+" fichas ("+(lista.length*2)+" páginas). Continuar?")) return;
  const btn = document.getElementById("fe-lote-btn");
  const textoOriginal = btn.textContent;
  btn.disabled = true; btn.textContent = "Gerando...";
  try{
    if(document.getElementById("fe-lote-registrar").checked){
      const r = await registrarFichasNoHistorico(lista);
      if(!r.ok) mostrarToast("As fichas serão impressas, mas não foi possível registrá-las no histórico de auditoria.");
      else mostrarToast(r.qtd+" ficha(s) registrada(s) no histórico de auditoria.");
    }
    imprimirFolhasEpi(lista.map(({colab, epis})=>renderizarFichaEpiHtml(colab, epis)).join(""));
  } finally {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
}

// Reage à ação:: ao trocar setor novo epi
/* ---- Novo admitido (fora da base): matrícula em aberto ---- */
function aoTrocarSetorNovoEpi(){
  const setor = document.getElementById("fe-novo-setor").value;
  preencherSelectEpi("fe-novo-funcao", setor ? funcoesEpiDoSetor(setor) : [], setor ? "Selecione..." : "Selecione o setor primeiro");
  atualizarNovoEpi();
}

// Atualiza: atualizar novo epi
function atualizarNovoEpi(){
  const loja = document.getElementById("fe-novo-loja").value;
  const setor = document.getElementById("fe-novo-setor").value;
  const funcao = document.getElementById("fe-novo-funcao").value;
  const pronto = !!(loja && setor && funcao);
  document.getElementById("fe-novo-dados").style.display = pronto ? "block" : "none";
  if(!pronto) return;
  const epis = episDaFuncaoEpi(setor, funcao);
  document.getElementById("fe-novo-epis-info").innerHTML = epis.length
    ? "<b>"+epis.length+" EPI(s)</b> cadastrado(s) para esta função: "+epis.map(e=>escHtml(e.descricao)).join(" · ")
    : "Nenhum EPI cadastrado para esta função — a ficha sairá com as linhas em branco.";
}

// Limpa: limpar novo epi
function limparNovoEpi(){
  ["fe-novo-loja","fe-novo-setor"].forEach(id=>{ document.getElementById(id).value = ""; });
  document.getElementById("fe-novo-nome").value = "";
  document.getElementById("fe-novo-admissao").value = "";
  aoTrocarSetorNovoEpi();
  document.getElementById("fe-novo-previa").style.display = "none";
  fichaEpiNovo = null;
}

// Função do módulo: gerar ficha novo epi
async function gerarFichaNovoEpi(){
  const loja = document.getElementById("fe-novo-loja").value;
  const setor = document.getElementById("fe-novo-setor").value;
  const funcao = document.getElementById("fe-novo-funcao").value;
  const nome = document.getElementById("fe-novo-nome").value.trim();
  const admissao = document.getElementById("fe-novo-admissao").value;
  if(!loja || !setor || !funcao){ alert("Escolha loja, setor e função."); return; }
  if(!nome){ alert("Informe o nome do colaborador."); return; }
  if(!admissao){ alert("Informe a data de admissão."); return; }
  const colab = {matricula:"", nome, loja, setor, cargo:funcao, admissao};
  const epis = episDaFuncaoEpi(setor, funcao).map(e=>({...e, jaEntregue:false, dataEntrega:null}));
  fichaEpiNovo = {colab, epis};
  document.getElementById("fe-novo-folhas").innerHTML = renderizarFichaEpiHtml(colab, epis);
  document.getElementById("fe-novo-previa").style.display = "block";
  document.getElementById("fe-novo-previa").scrollIntoView({behavior:"smooth", block:"start"});
  await registrarFichasNoHistorico([{colab, epis}]);
}

// Função do módulo: chave cabecalho adm
function chaveCabecalhoAdm(s){ return normalizarTextoComparacao(s).replace(/[^A-Z0-9]/g,""); }

// Função do módulo: baixar modelo admitidos
function baixarModeloAdmitidos(){
  const ws = XLSX.utils.aoa_to_sheet([["Nome","Loja","Setor","Função"],["Maria da Silva","Barra","Padaria","Padeiro"]]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Novos admitidos");
  XLSX.writeFile(wb, "modelo_novos_admitidos.xlsx");
}

// Limpa: limpar previa admitidos
function limparPreviaAdmitidos(){
  ADM_PREVIA = [];
  const f = document.getElementById("fe-adm-arquivo"); if(f) f.value = "";
  document.getElementById("fe-adm-previa").style.display = "none";
  document.getElementById("fe-adm-status").textContent = "";
}

// Função do módulo: unidade por nome epi
function unidadePorNomeEpi(nome){ const k = normalizarTextoComparacao(nome); return UNIDADES.find(u=>normalizarTextoComparacao(u.nome)===k) || null; }

// Função do módulo: valor canonico epi
function valorCanonicoEpi(valor, lista){ const k = normalizarTextoComparacao(valor); return lista.find(v=>normalizarTextoComparacao(v)===k) || valor; }

// Função do módulo: ler planilha admitidos
async function lerPlanilhaAdmitidos(){
  const status = document.getElementById("fe-adm-status");
  const file = document.getElementById("fe-adm-arquivo").files[0];
  document.getElementById("fe-adm-previa").style.display = "none";
  if(!file) return;
  status.style.color = "var(--areia-esc)"; status.textContent = "Lendo a planilha...";
  try{
    await carregarBaseEpi();
    const wb = XLSX.read(await file.arrayBuffer(), {type:"array", cellDates:true});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(ws, {defval:""});
    if(!linhas.length) throw new Error("a planilha está vazia.");
    // descobre qual coluna é qual pelo cabeçalho
    const cab = Object.keys(linhas[0]), mapa = {};
    Object.entries(ADM_COLUNAS).forEach(([campo, apelidos])=>{ mapa[campo] = cab.find(c=>apelidos.includes(chaveCabecalhoAdm(c))); });
    const faltando = ["nome","loja","setor","funcao"].filter(c=>!mapa[c]);
    if(faltando.length) throw new Error("não encontrei a(s) coluna(s): "+faltando.map(c=>({nome:"Nome",loja:"Loja",setor:"Setor",funcao:"Função"}[c])).join(", ")+". Use o modelo da planilha.");
    const lojasBase = lojasBaseEpi(true), setores = setoresEpiDisponiveis();
    const jaNaFila = new Set(EPI_NOVOS.map(r=>normalizarTextoComparacao(r.nome)+"|"+normalizarTextoComparacao(r.loja)));
    const vistos = new Set();
    ADM_PREVIA = linhas.map(l=>{
      const get = c => (l[mapa[c]]==null ? "" : String(l[mapa[c]])).trim();
      const r = {nome:get("nome"), loja:get("loja"), setor:get("setor"), funcao:get("funcao"), erros:[], avisos:[], tecnico:""};
      if(!r.nome && !r.loja && !r.setor && !r.funcao) return null;       // linha em branco
      if(!r.nome) r.erros.push("sem nome");
      if(!r.loja) r.erros.push("sem loja");
      if(!r.setor) r.erros.push("sem setor");
      if(!r.funcao) r.erros.push("sem função");
      if(r.loja){
        r.loja = valorCanonicoEpi(r.loja, lojasBase);
        const un = unidadePorNomeEpi(r.loja);
        if(!un) r.avisos.push("loja não cadastrada em Unidades");
        else if(un.tecnicoResponsavel) r.tecnico = un.tecnicoResponsavel; else r.avisos.push("loja sem técnico responsável");
      }
      if(r.setor) r.setor = valorCanonicoEpi(r.setor, setores);
      if(r.setor && r.funcao){
        r.funcao = valorCanonicoEpi(r.funcao, funcoesEpiDoSetor(r.setor));
        if(!episDaFuncaoEpi(r.setor, r.funcao).length) r.avisos.push("sem lista de EPI (ficha com linhas em branco)");
      }
      const chave = normalizarTextoComparacao(r.nome)+"|"+normalizarTextoComparacao(r.loja);
      if(r.nome && jaNaFila.has(chave)) r.erros.push("já está aguardando download");
      else if(r.nome && vistos.has(chave)) r.erros.push("repetido na planilha");
      vistos.add(chave);
      return r;
    }).filter(Boolean);
    if(!ADM_PREVIA.length) throw new Error("não encontrei nenhuma linha com dados.");
    const validas = ADM_PREVIA.filter(r=>!r.erros.length), comErro = ADM_PREVIA.length-validas.length, comAviso = validas.filter(r=>r.avisos.length).length;
    document.getElementById("fe-adm-previa-tbody").innerHTML = ADM_PREVIA.slice(0,300).map(r=>`<tr>
      <td>${escHtml(r.nome||"—")}</td><td>${escHtml(r.loja||"—")}</td><td>${escHtml(r.setor||"—")}</td><td>${escHtml(r.funcao||"—")}</td><td>${escHtml(r.tecnico||"—")}</td>
      <td>${r.erros.length ? `<span class="fe-adm-erro">✗ ${escHtml(r.erros.join(", "))}</span>` : r.avisos.length ? `<span class="fe-adm-aviso">⚠ ${escHtml(r.avisos.join(", "))}</span>` : '<span class="fe-adm-ok">✓ ok</span>'}</td></tr>`).join("");
    status.style.color = "var(--areia-esc)";
    status.textContent = validas.length+" ficha(s) pronta(s) para enviar"+(comErro ? " · "+comErro+" linha(s) com erro (não serão enviadas)" : "")+(comAviso ? " · "+comAviso+" com aviso" : "")+".";
    const btn = document.getElementById("fe-adm-btn-enviar");
    btn.disabled = !validas.length; btn.textContent = "Enviar "+validas.length+" ficha"+(validas.length===1?"":"s")+" para os técnicos";
    document.getElementById("fe-adm-previa").style.display = "block";
  }catch(e){
    ADM_PREVIA = [];
    status.style.color = "var(--vermelho)"; status.textContent = "Não foi possível ler a planilha: "+(e && e.message ? e.message : e);
  }
}

// Função do módulo: enviar admitidos
async function enviarAdmitidos(){
  if(!ehAdminOuCoordenador()) return;
  const validas = ADM_PREVIA.filter(r=>!r.erros.length);
  if(!validas.length) return;
  const btn = document.getElementById("fe-adm-btn-enviar"); btn.disabled = true;
  const lote = new Date().toISOString().slice(0,16).replace("T"," ");
  try{
    const gravadas = [];
    for(let i=0; i<validas.length; i+=200){
      const linhas = validas.slice(i,i+200).map(r=>({nome:r.nome, loja:r.loja, setor:r.setor, funcao:r.funcao, tecnico_responsavel:r.tecnico||"", lote}));
      const { data, error } = await sb.from("epi_novos_admitidos").insert(linhas).select();
      if(error){ alert("Erro ao enviar as fichas: "+error.message+(gravadas.length ? "\n"+gravadas.length+" ficha(s) já tinham sido enviadas." : "")); break; }
      (data||[]).forEach(r=>gravadas.push(r));
    }
    gravadas.forEach(r=>EPI_NOVOS.push(mapNovoAdmitidoFromDb(r)));
    if(gravadas.length){
      await avisarTecnicosAdmitidos(gravadas.map(mapNovoAdmitidoFromDb), lote);
      acaoPlataforma("Planilha de novos admitidos enviada", gravadas.length+" ficha"+(gravadas.length===1?"":"s"), "epi_admitidos", lote);
    }
    limparPreviaAdmitidos();
    renderAdmitidosEpi(); renderInicio();
    if(gravadas.length) mostrarToast(gravadas.length+" ficha(s) enviada(s) para os técnicos responsáveis.");
  } finally { btn.disabled = false; }
}

// Função do módulo: avisar tecnicos admitidos
// um aviso por técnico (loja sem técnico vinculado: avisa administradores e coordenadores)
async function avisarTecnicosAdmitidos(registros, lote){
  const grupos = new Map();
  registros.forEach(r=>{ const k = normalizarTextoComparacao(r.tecnico); if(!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(r); });
  const gestores = USUARIOS.filter(u=>u.ativo!==false && (u.perfil==="Administrador" || u.perfil==="Coordenador")).map(u=>u.id);
  for(const [k, lista] of grupos){
    const tecnicos = k ? USUARIOS.filter(u=>u.ativo!==false && normalizarTextoComparacao(u.nome)===k).map(u=>u.id) : [];
    const dest = tecnicos.length ? tecnicos : gestores.filter(id=>id!==currentUser.id);
    if(!dest.length) continue;
    const lojas = [...new Set(lista.map(r=>r.loja))];
    const n = lista.length;
    const titulo = n+" ficha"+(n===1?"":"s")+" de EPI de novos admitidos disponíve"+(n===1?"l":"is")+" para download";
    const msg = lojas.slice(0,3).join(", ")+(lojas.length>3 ? " e mais "+(lojas.length-3) : "") + (tecnicos.length ? "" : " · sem técnico responsável vinculado");
    const a = await criarAvisoPlataforma({tipo:"epi_admitidos", titulo, mensagem:msg, destinatarios:dest, referenciaTipo:"epi_admitidos", referenciaId:lote});
    for(const uid of dest){ if(uid!==currentUser.id) await criarNotificacao(uid, "epi_admitidos", titulo, msg, "epi_admitidos", a ? a.id : lote); }
  }
}

// Função do módulo: fila admitidos do usuario
// fila do usuário: o técnico vê as lojas sob sua responsabilidade; administrador e coordenador veem todas
function filaAdmitidosDoUsuario(){
  if(!currentUser) return [];
  if(ehAdminOuCoordenador()) return EPI_NOVOS;
  const lojas = new Set(lojasSobResponsabilidade().map(normalizarTextoComparacao));
  const eu = normalizarTextoComparacao(currentUser.nome);
  return EPI_NOVOS.filter(r=>lojas.has(normalizarTextoComparacao(r.loja)) || (r.tecnico && normalizarTextoComparacao(r.tecnico)===eu));
}

// Desenha na tela: render admitidos epi
function renderAdmitidosEpi(){
  const tbody = document.getElementById("fe-adm-tbody");
  if(!tbody || !currentUser) return;
  document.getElementById("fe-adm-upload").style.display = ehAdminOuCoordenador() ? "block" : "none";
  const fila = filaAdmitidosDoUsuario();
  ADM_SEL = new Set([...ADM_SEL].filter(id=>fila.some(r=>r.id===id)));
  const badge = document.getElementById("fe-adm-badge");
  if(badge){ badge.style.display = fila.length ? "inline-block" : "none"; badge.textContent = fila.length; }
  document.getElementById("fe-adm-sub").textContent = ehAdminOuCoordenador()
    ? "Todas as fichas aguardando download. Cada técnico vê só as das lojas sob sua responsabilidade."
    : (lojasSobResponsabilidade().length ? "Fichas das lojas sob sua responsabilidade. Ao baixar, elas saem da lista automaticamente." : "Nenhuma loja está vinculada a você como técnico responsável (Gestão › Unidades).");
  document.getElementById("fe-adm-acoes").style.display = fila.length ? "flex" : "none";
  const sel = document.getElementById("fe-adm-selecao");
  const nSel = ADM_SEL.size;
  sel.textContent = nSel ? nSel+" selecionada"+(nSel===1?"":"s") : "Nada marcado: baixa todas as "+fila.length+" da lista.";
  document.getElementById("fe-adm-btn-baixar").textContent = nSel ? "🖨 Baixar fichas selecionadas ("+nSel+")" : "🖨 Baixar todas as fichas ("+fila.length+")";
  const todas = document.getElementById("fe-adm-todas");
  todas.checked = fila.length>0 && nSel===fila.length; todas.indeterminate = nSel>0 && nSel<fila.length;
  tbody.innerHTML = fila.length ? fila.map(r=>`<tr>
    <td><input type="checkbox" ${ADM_SEL.has(r.id)?"checked":""} onchange="alternarAdmitido(${r.id}, this.checked)" aria-label="Selecionar ${escHtml(r.nome)}"></td>
    <td>${escHtml(r.nome)}</td><td>${escHtml(r.loja)}</td><td>${escHtml(r.setor)}</td><td>${escHtml(r.funcao)}</td><td>${escHtml(r.tecnico||"—")}</td><td>${r.criadoEm ? dataBR(String(r.criadoEm).slice(0,10)) : "—"}</td></tr>`).join("")
    : '<tr><td colspan="7" style="text-align:center; padding:16px; color:var(--areia-esc);">Nenhuma ficha aguardando download.</td></tr>';
}

// Alterna (mostra/esconde): alternar admitido
function alternarAdmitido(id, on){ if(on) ADM_SEL.add(id); else ADM_SEL.delete(id); renderAdmitidosEpi(); }

// Função do módulo: selecionar todos admitidos
function selecionarTodosAdmitidos(on){ ADM_SEL = on ? new Set(filaAdmitidosDoUsuario().map(r=>r.id)) : new Set(); renderAdmitidosEpi(); }

// Abre: abrir ficha epi novos admitidos
function abrirFichaEpiNovosAdmitidos(){
  irParaView("fichaEpi");
  mostrarSubFichaEpi("admitidos");
}

// Função do módulo: baixar admitidos
// baixar = gerar as fichas (frente e verso, matrícula em branco), registrar no histórico e tirar da fila
async function baixarAdmitidos(){
  const fila = filaAdmitidosDoUsuario();
  const alvo = ADM_SEL.size ? fila.filter(r=>ADM_SEL.has(r.id)) : fila;
  if(!alvo.length){ alert("Não há fichas para baixar."); return; }
  if(alvo.length>400 && !confirm("Serão geradas "+alvo.length+" fichas. Continuar?")) return;
  await carregarBaseEpi();
  const btn = document.getElementById("fe-adm-btn-baixar"); btn.disabled = true;
  try{
    const lista = alvo.map(r=>({colab:{matricula:"", nome:r.nome, loja:r.loja, setor:r.setor, cargo:r.funcao, admissao:""}, epis: episDaFuncaoEpi(r.setor, r.funcao).map(e=>({...e, jaEntregue:false, dataEntrega:null}))}));
    const reg = await registrarFichasNoHistorico(lista);
    if(!reg.ok) mostrarToast("As fichas serão impressas, mas não foi possível registrá-las no histórico de auditoria.");
    imprimirFolhasEpi(lista.map(({colab, epis})=>renderizarFichaEpiHtml(colab, epis)).join(""));
    const ids = alvo.map(r=>r.id);
    const { error } = await sb.from("epi_novos_admitidos").delete().in("id", ids);
    if(error){ console.error("[EPI] não saiu da fila:", error); mostrarToast("Fichas geradas, mas não foi possível tirá-las da lista. Tente atualizar."); }
    else {
      EPI_NOVOS = EPI_NOVOS.filter(r=>!ids.includes(r.id));
      ADM_SEL = new Set();
      acaoPlataforma("Fichas de EPI baixadas", ids.length+" ficha"+(ids.length===1?"":"s"), null, null);
      mostrarToast(ids.length+" ficha"+(ids.length===1?"":"s")+" baixada"+(ids.length===1?"":"s")+" e removida"+(ids.length===1?"":"s")+" da lista.");
      await resolverAvisosEpiSeFilaVazia();
    }
    renderAdmitidosEpi(); renderInicio();
  } finally { btn.disabled = false; }
}

// Função do módulo: resolver avisos epi se fila vazia
// quando a fila do usuário zera, os avisos de fichas de novos admitidos dele ficam resolvidos
async function resolverAvisosEpiSeFilaVazia(){
  if(filaAdmitidosDoUsuario().length) return;
  const abertos = avisosVisiveis().filter(a=>a.tipo==="epi_admitidos" && !AVISOS_RESOLVIDOS.has(a.id));
  for(const a of abertos){
    const { error } = await sb.from("avisos_resolvidos").insert({aviso_id:a.id, usuario_id:currentUser.id});
    if(!error) AVISOS_RESOLVIDOS.add(a.id);
  }
}

// Desenha na tela: renderizar ficha epi html
/* ---- Layout da ficha: duas folhas A4 (frente e verso) ---- */
function renderizarFichaEpiHtml(colab, epis){
  const logo = HORTIFRUTI_LOGO_DATAURL;
  const admissaoFmt = colab.admissao ? String(colab.admissao).slice(0,10).split("-").reverse().join("/") : "";
  const campo = (rotulo, valor, colspan)=>`<td colspan="${colspan}"><span class="fe-l">${rotulo}</span><span class="fe-v">${valor ? escHtml(valor) : "&nbsp;"}</span></td>`;
  const dataBranco = "____/____/20___";
  const motivo = "N(&nbsp;&nbsp;) A(&nbsp;&nbsp;) D(&nbsp;&nbsp;) E(&nbsp;&nbsp;) M(&nbsp;&nbsp;)";
  const linhaEpi = (e)=>{
    const dataFmt = e.dataEntrega ? e.dataEntrega.split("-").reverse().join("/") : dataBranco;
    return `<tr><td>1</td><td class="fe-desc">${escHtml(e.descricao)}</td><td>${escHtml(e.ca||"—")}</td><td class="fe-data">${dataFmt}</td><td></td><td class="fe-motivo">${motivo}</td><td></td></tr>`;
  };
  const linhaVazia = `<tr><td></td><td class="fe-desc"></td><td></td><td class="fe-data">${dataBranco}</td><td></td><td class="fe-motivo">${motivo}</td><td></td></tr>`;
  const repetir = (qtd, html)=> qtd>0 ? new Array(qtd).fill(html).join("") : "";
  const cabecalhoTabela = `
    <colgroup><col style="width:6%"><col style="width:32%"><col style="width:9%"><col style="width:14%"><col style="width:13%"><col style="width:17%"><col style="width:9%"></colgroup>
    <thead>
      <tr><th colspan="3">Preenchimento na entrega</th><th></th><th></th><th colspan="2">Preenchimento na devolução</th></tr>
      <tr><th>Qtd.</th><th>Descrição do EPI</th><th>C.A</th><th>Data da entrega</th><th>Rubrica</th><th>Motivo</th><th>Rubrica</th></tr>
    </thead>`;
  const legenda = `<div class="fe-legenda">Motivos de devolução: <b>N</b> - Desgaste normal &nbsp;|&nbsp; <b>A</b> - Desgaste anormal &nbsp;|&nbsp; <b>D</b> - Desligamento do colaborador &nbsp;|&nbsp; <b>E</b> - Extravio &nbsp;|&nbsp; <b>M</b> - Dano por mau uso</div>`;

  // EPIs da função entram a partir da primeira linha da frente; se passar do limite, continuam no verso
  const naFrente = epis.slice(0, EPI_FRENTE_LINHAS);
  const noVerso = epis.slice(EPI_FRENTE_LINHAS);
  const linhasFrente = naFrente.map(linhaEpi).join("") + repetir(EPI_FRENTE_LINHAS - naFrente.length, linhaVazia);
  const linhasVerso = noVerso.map(linhaEpi).join("") + repetir(EPI_VERSO_LINHAS - noVerso.length, linhaVazia);
  const notaSemLista = epis.length ? "" : `<div class="fe-nota">Nenhum EPI padrão cadastrado para o setor/função "${escHtml(colab.setor||"—")} / ${escHtml(colab.cargo||"—")}". Preencha as linhas à mão ou consulte o SESMT.</div>`;

  const frente = `
    <div class="fe-folha fe-frente">
      <div class="fe-topo">
        <img class="fe-logo" src="${logo}" alt="Hortifruti Natural da Terra">
        <div class="fe-titulo">Ficha de Registro de Controle de EPI</div>
      </div>

      <div class="fe-secao">Dados do colaborador</div>
      <table class="fe-dados">
        <colgroup><col style="width:17%"><col style="width:17%"><col style="width:16%"><col style="width:16%"><col style="width:17%"><col style="width:17%"></colgroup>
        <tr>${campo("Nome do colaborador", colab.nome, 3)}${campo("Matrícula", colab.matricula, 2)}${campo("Admissão", admissaoFmt, 1)}</tr>
        <tr>${campo("Loja", colab.loja, 2)}${campo("Setor", colab.setor, 2)}${campo("Função", colab.cargo, 2)}</tr>
      </table>

      <div class="fe-secao">Termo de responsabilidade</div>
      <div class="fe-termo">Declaro sob minha inteira responsabilidade a guarda e conservação dos equipamentos de proteção individual constantes nesta ficha-controle. Assumo também a responsabilidade de devolvê-los integralmente ou parcialmente, quando solicitado, ou por ocasião de eventual rescisão de contrato, na data do respectivo aviso de qualquer das partes. Também estou ciente que, na eventualidade de danificar ou extraviar o equipamento por ato doloso ou culposo, estarei sujeito ao desconto do valor em meu salário, conforme parágrafo único do art. 158 da CLT. Também me comprometo a utilizá-los de forma correta e de acordo com as instruções de treinamento referentes ao uso correto, guarda, conservação e higienização dos EPIs, recebidas na presente data, fornecidas por profissional Técnico de Segurança do Trabalho. Também estou ciente que a não utilização dos mesmos em minhas atividades profissionais é ato faltoso e passível de punições legais e disciplinares de acordo com a Consolidação das Leis do Trabalho (CLT) – Capítulo V – Seção I – Art. 158º c/c Norma Regulamentadora (NR) - NR-1 e NR-6, alínea 6.7, disciplinadas pela Portaria MTb. nº 3.214/78 e artigo 191, itens I e II da CLT e súmula n. 80 do TST.</div>
      <div class="fe-assinaturas">
        <div>${escHtml(colab.nome||"")}<small>Nome do colaborador</small></div>
        <div>&nbsp;<small>Rubrica</small></div>
      </div>

      <div class="fe-secao">EPIs descartáveis disponíveis no setor</div>
      <div class="fe-descartaveis">EPIs disponibilizados para o colaborador no setor: (&nbsp;&nbsp;) Máscara cirúrgica &nbsp;&nbsp; (&nbsp;&nbsp;) Luvas descartáveis de procedimento &nbsp;&nbsp; (&nbsp;&nbsp;) Toucas descartáveis
        <small>Reconheço e afirmo que os itens descartáveis acima sempre estão disponíveis em meu setor, com livre acesso.</small></div>

      <div class="fe-secao">Registro de entrega e devolução de EPIs</div>
      ${notaSemLista}
      <table class="fe-tabela-epi">${cabecalhoTabela}<tbody>${linhasFrente}</tbody></table>
      ${legenda}
      <div class="fe-continua">Continua no verso ▸</div>
    </div>`;

  const verso = `
    <div class="fe-folha fe-verso">
      <div class="fe-topo">
        <img class="fe-logo" src="${logo}" alt="Hortifruti Natural da Terra">
        <div class="fe-titulo">Ficha de Registro de Controle de EPI<small>Continuação do registro de entrega e devolução (verso)</small></div>
      </div>
      <table class="fe-dados">
        <colgroup><col style="width:29%"><col style="width:14%"><col style="width:21%"><col style="width:18%"><col style="width:18%"></colgroup>
        <tr>${campo("Colaborador", colab.nome, 1)}${campo("Matrícula", colab.matricula, 1)}${campo("Loja", colab.loja, 1)}${campo("Setor", colab.setor, 1)}${campo("Função", colab.cargo, 1)}</tr>
      </table>

      <div class="fe-secao">Registro de entrega e devolução de EPIs (continuação)</div>
      <table class="fe-tabela-epi">${cabecalhoTabela}<tbody>${linhasVerso}</tbody></table>
      ${legenda}

      <div class="fe-fim-folha">
        <div class="fe-secao">Conferência de devolução após desligamento</div>
        <table class="fe-dados fe-desligamento">
          <colgroup><col style="width:35%"><col style="width:45%"><col style="width:20%"></colgroup>
          <tr>
            <td><span class="fe-l">Nome do colaborador</span><span class="fe-v">${escHtml(colab.nome||"")}</span></td>
            <td><span class="fe-l">Declaro que devolvi todos os EPIs entregues a mim durante o meu tempo na empresa (assinatura)</span></td>
            <td><span class="fe-l">Data do desligamento</span><span class="fe-v" style="font-weight:400; color:#555;">____/____/20___</span></td>
          </tr>
        </table>
      </div>
    </div>`;
  return frente + verso;
}

// Função do módulo: lojas sob responsabilidade
/* =====================================================================
   AUDITORIA DE FICHAS DE EPI — histórico, habilitação e relatório em PDF
   ===================================================================== */
function lojasSobResponsabilidade(){
  if(!currentUser) return [];
  return UNIDADES.filter(u=> u.tecnicoResponsavel && normalizarTextoComparacao(u.tecnicoResponsavel)===normalizarTextoComparacao(currentUser.nome)).map(u=>u.nome);
}

// Função do módulo: dados filtrados auditoria epi
function dadosFiltradosAuditoriaEpi(){
  const loja = document.getElementById("aud-f-loja")?.value;
  const status = document.getElementById("aud-f-status")?.value;
  const busca = (document.getElementById("aud-f-busca")?.value||"").trim().toLowerCase();
  const restringirPorResponsabilidade = !ehAdminOuCoordenador();
  const minhasLojas = restringirPorResponsabilidade ? new Set(lojasSobResponsabilidade()) : null;
  return EPI_FICHAS_IMPRESSAS.filter(f=>{
    if(restringirPorResponsabilidade && !minhasLojas.has(f.loja)) return false;
    if(loja && f.loja!==loja) return false;
    if(status && f.statusAuditoria!==status) return false;
    if(busca){
      const alvo = [f.nomeColaborador, f.matricula].filter(Boolean).join(" ").toLowerCase();
      if(!alvo.includes(busca)) return false;
    }
    return true;
  });
}

// Preenche: popular filtros auditoria epi
function popularFiltrosAuditoriaEpi(){
  const restringirPorResponsabilidade = !ehAdminOuCoordenador();
  const base = restringirPorResponsabilidade
    ? EPI_FICHAS_IMPRESSAS.filter(f=>lojasSobResponsabilidade().includes(f.loja))
    : EPI_FICHAS_IMPRESSAS;
  fillSelect("aud-f-loja", [...new Set(base.map(f=>f.loja).filter(Boolean))].sort());
}

// Limpa: limpar filtros auditoria epi
function limparFiltrosAuditoriaEpi(){
  ["aud-f-loja","aud-f-status","aud-f-busca"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
  renderAuditoriaEpi();
}

// Inicializa: init auditoria epi
function initAuditoriaEpi(){
  popularFiltrosAuditoriaEpi();
  renderAuditoriaEpi();
}

// Desenha na tela: render auditoria epi
function renderAuditoriaEpi(){
  const linhas = dadosFiltradosAuditoriaEpi().slice().sort((a,b)=> (b.impressaEm||"").localeCompare(a.impressaEm||""));
  document.getElementById("aud-kpi-total").textContent = linhas.length;
  document.getElementById("aud-kpi-pendentes").textContent = linhas.filter(f=>f.statusAuditoria==="Pendente").length;
  document.getElementById("aud-kpi-habilitadas").textContent = linhas.filter(f=>f.statusAuditoria==="Habilitada").length;
  document.getElementById("aud-kpi-divergencias").textContent = linhas.filter(f=>f.statusAuditoria==="Divergência").length;

  const tbody = document.getElementById("tbl-auditoria-epi");
  if(!linhas.length){
    tbody.innerHTML = `<tr><td colspan="9"><div class="lista-vazio"><b>Nenhuma ficha encontrada</b>Fichas aparecem aqui automaticamente assim que alguém imprime pela página pública.</div></td></tr>`;
    return;
  }
  const corStatus = {Pendente:"var(--areia-esc)", "Habilitada":"var(--verde-viv)", "Divergência":"var(--vermelho)"};
  tbody.innerHTML = linhas.map(f=>`
    <tr>
      <td class="col-sticky" style="min-width:200px; max-width:260px;">${f.nomeColaborador||"—"}</td>
      <td>${f.matricula || "—"}</td>
      <td>${f.loja||"—"}</td>
      <td>${f.setor||"—"}</td>
      <td>${f.itens.length} item(ns)</td>
      <td>${f.impressaEm ? new Date(f.impressaEm).toLocaleString("pt-BR") : "—"}</td>
      <td><span class="td-badge" style="background:${corStatus[f.statusAuditoria]||'#999'};">${f.statusAuditoria}</span></td>
      <td style="max-width:200px;" title="${f.observacoesAuditoria||''}">${(f.observacoesAuditoria||"—").slice(0,40)}</td>
      <td style="white-space:nowrap;">
        <button type="button" class="small-btn" onclick="habilitarFichaEpi(${f.id})">Habilitar</button>
        <button type="button" class="small-btn danger" onclick="marcarDivergenciaFichaEpi(${f.id})">Divergência</button>
      </td>
    </tr>
  `).join("");
}

// Função do módulo: habilitar ficha epi
async function habilitarFichaEpi(id){
  const { error } = await sb.from("epi_fichas_impressas").update({
    status_auditoria:"Habilitada", auditado_por: currentUser?currentUser.id:null, auditado_em: new Date().toISOString(), observacoes_auditoria: null
  }).eq("id", id);
  if(error){ alert("Erro ao habilitar: "+error.message); return; }
  const item = EPI_FICHAS_IMPRESSAS.find(f=>f.id===id);
  if(item){ item.statusAuditoria="Habilitada"; item.observacoesAuditoria=""; }
  mostrarToast("Ficha habilitada.");
  renderAuditoriaEpi();
}

// Função do módulo: marcar divergencia ficha epi
async function marcarDivergenciaFichaEpi(id){
  const motivo = prompt("Descreva a divergência encontrada nesta ficha:");
  if(motivo===null) return;
  if(!motivo.trim()){ alert("Descreva a divergência antes de confirmar."); return; }
  const { error } = await sb.from("epi_fichas_impressas").update({
    status_auditoria:"Divergência", auditado_por: currentUser?currentUser.id:null, auditado_em: new Date().toISOString(), observacoes_auditoria: motivo.trim()
  }).eq("id", id);
  if(error){ alert("Erro ao registrar divergência: "+error.message); return; }
  const item = EPI_FICHAS_IMPRESSAS.find(f=>f.id===id);
  if(item){ item.statusAuditoria="Divergência"; item.observacoesAuditoria=motivo.trim(); }
  mostrarToast("Divergência registrada.");
  renderAuditoriaEpi();
}

// Exporta: exportar relatorio auditoria epi
function exportarRelatorioAuditoriaEpi(){
  const linhas = dadosFiltradosAuditoriaEpi().slice().sort((a,b)=> (a.loja||"").localeCompare(b.loja||""));
  if(!linhas.length){ alert("Não há fichas para gerar relatório com os filtros atuais."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"pt", format:"a4"});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 60;

  try{ doc.addImage(HORTIFRUTI_LOGO_DATAURL, "PNG", 40, 30, 90, 31); }catch(e){}
  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("Relatório de Auditoria — Fichas de EPI", pageW-40, 48, {align:"right"});
  doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(120,105,85);
  doc.text("Gerado em "+new Date().toLocaleString("pt-BR")+" por "+(currentUser?currentUser.nome:"—"), pageW-40, 62, {align:"right"});
  doc.setTextColor(30,30,30);
  y = 90;
  doc.setDrawColor(210,195,165); doc.line(40, y, pageW-40, y); y += 22;

  const total = linhas.length;
  const pendentes = linhas.filter(f=>f.statusAuditoria==="Pendente").length;
  const habilitadas = linhas.filter(f=>f.statusAuditoria==="Habilitada").length;
  const divergencias = linhas.filter(f=>f.statusAuditoria==="Divergência").length;
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("Total: "+total+"   |   Habilitadas: "+habilitadas+"   |   Pendentes: "+pendentes+"   |   Divergências: "+divergencias, 40, y);
  y += 26;

  linhas.forEach(f=>{
    const linhasObs = f.observacoesAuditoria ? doc.splitTextToSize("Observação: "+f.observacoesAuditoria, pageW-120) : [];
    const altura = 40 + linhasObs.length*11;
    if(y + altura > pageH-60){ doc.addPage(); y = 50; }
    const yTopo = y;
    doc.setDrawColor(225,215,195); doc.setFillColor(253,251,246);
    doc.roundedRect(40, yTopo-14, pageW-80, altura, 5, 5, "FD");

    doc.setFont("helvetica","bold"); doc.setFontSize(10.5); doc.setTextColor(30,30,30);
    doc.text((f.nomeColaborador||"—")+" — matrícula "+(f.matricula||"não informada"), 50, y);
    const corSt = f.statusAuditoria==="Habilitada" ? [0,115,63] : f.statusAuditoria==="Divergência" ? [238,49,53] : [159,129,103];
    doc.setTextColor(...corSt); doc.setFont("helvetica","bold"); doc.setFontSize(9);
    doc.text(f.statusAuditoria, pageW-90, y);

    y += 14;
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(90,75,60);
    doc.text("Loja: "+(f.loja||"—")+"   Setor: "+(f.setor||"—")+"   Itens: "+f.itens.length+"   Impressa em: "+(f.impressaEm ? new Date(f.impressaEm).toLocaleDateString("pt-BR") : "—"), 50, y);

    if(linhasObs.length){
      y += 12;
      doc.setTextColor(190,40,40);
      linhasObs.forEach(l=>{ doc.text(l, 50, y, {maxWidth:pageW-120}); y += 11; });
    }
    y = yTopo + altura + 12;
  });

  doc.save("auditoria_epi_"+new Date().toISOString().slice(0,10)+".pdf");
}

// Inicializa: init gestao epi
function initGestaoEpi(){
  atualizarKpisEpi();
}

// Atualiza: atualizar kpis epi
async function atualizarKpisEpi(){
  const { count: qtdColab } = await sb.from("colaboradores").select("*", {count:"exact", head:true});
  const { data: combos } = await sb.from("epi_por_funcao").select("setor,funcao");
  const setColab = document.getElementById("epi-kpi-colaboradores");
  const setCombo = document.getElementById("epi-kpi-combinacoes");
  if(setColab) setColab.textContent = qtdColab || 0;
  if(setCombo) setCombo.textContent = new Set((combos||[]).map(c=>c.setor+"|"+c.funcao)).size;
}

// Função do módulo: parse lista epi por funcao sheet
function parseListaEpiPorFuncaoSheet(sheet){
  const linhas = XLSX.utils.sheet_to_json(sheet, {header:1, defval:null});
  const registros = [];
  let setorAtual = null;
  linhas.forEach(row=>{
    const [colSetor, colFuncaoSetor, colEpis] = row;
    if(colSetor) setorAtual = String(colSetor).trim();
    if(!colFuncaoSetor || !colEpis || !setorAtual) return;
    const textoFuncao = String(colFuncaoSetor).trim();
    if(["VOLTAR","LISTA DE EPIS POR FUNÇÃO"].includes(textoFuncao.toUpperCase())) return;
    const funcao = textoFuncao.split(" - ")[0].trim();
    String(colEpis).split(/\n|\\n/).map(l=>l.trim()).filter(Boolean).forEach((linha, idx)=>{
      const m = linha.match(/^(\S+)\s*-\s*(.+)$/);
      registros.push({
        setor: setorAtual, funcao,
        ca: m ? m[1].trim() : null,
        descricao: (m ? m[2] : linha).trim(),
        ordem: idx
      });
    });
  });
  return registros;
}

// Função do módulo: importar base epi
async function importarBaseEpi(){
  const input = document.getElementById("epi-import-file");
  const status = document.getElementById("epi-import-status");
  const file = input.files[0];
  if(!file){ status.style.color="var(--vermelho)"; status.textContent = "Selecione um arquivo primeiro."; return; }
  status.style.color = "var(--areia-esc)";
  status.textContent = "Lendo o arquivo...";
  try{
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {type:"array", cellDates:true});
    let colaboradores = [];
    let epis = [];

    if(wb.SheetNames.includes("BASE COLABORADORES")){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets["BASE COLABORADORES"], {defval:null});
      colaboradores = rows.filter(r=>r["Nº pessoal"]!=null).map(r=>({
        matricula: String(r["Nº pessoal"]).trim(),
        nome: r["Nome do Empregado"] || null,
        loja: r["Desc. Área de RH"] || null,
        setor: r["Desc. Cent. custo"] || null,
        cargo: r["Desc. Cargo"] || null,
        admissao: normalizarDataImportacao(r["Dt. Admissão"])
      }));
    }
    if(wb.SheetNames.includes("LISTA DE EPI POR FUNÇÃO")){
      epis = parseListaEpiPorFuncaoSheet(wb.Sheets["LISTA DE EPI POR FUNÇÃO"]);
    }

    if(!colaboradores.length && !epis.length){
      status.style.color = "var(--vermelho)";
      status.textContent = 'Não encontrei as abas "BASE COLABORADORES" e/ou "LISTA DE EPI POR FUNÇÃO" nesse arquivo.';
      return;
    }

    const substituir = document.getElementById("epi-import-substituir").checked;
    if(substituir){
      status.textContent = "Limpando a base atual...";
      if(colaboradores.length){ const {error} = await sb.from("colaboradores").delete().neq("id",0); if(error){ status.style.color="var(--vermelho)"; status.textContent="Erro ao limpar colaboradores: "+error.message; return; } }
      if(epis.length){ const {error} = await sb.from("epi_por_funcao").delete().neq("id",0); if(error){ status.style.color="var(--vermelho)"; status.textContent="Erro ao limpar EPI por função: "+error.message; return; } }
    }

    const LOTE = 500;
    for(let i=0; i<colaboradores.length; i+=LOTE){
      status.textContent = "Importando colaboradores... "+Math.min(i+LOTE,colaboradores.length)+" de "+colaboradores.length;
      const { error } = await sb.from("colaboradores").insert(colaboradores.slice(i,i+LOTE));
      if(error){ status.style.color="var(--vermelho)"; status.textContent = "Erro ao importar colaboradores: "+error.message; return; }
    }
    for(let i=0; i<epis.length; i+=LOTE){
      status.textContent = "Importando EPI por função... "+Math.min(i+LOTE,epis.length)+" de "+epis.length;
      const { error } = await sb.from("epi_por_funcao").insert(epis.slice(i,i+LOTE));
      if(error){ status.style.color="var(--vermelho)"; status.textContent = "Erro ao importar EPI por função: "+error.message; return; }
    }

    status.style.color = "var(--verde-esc)";
    status.textContent = colaboradores.length+" colaborador(es) e "+epis.length+" item(ns) de EPI importados com sucesso!";
    input.value = "";
    invalidarBaseEpi();
    atualizarKpisEpi();
  }catch(e){
    status.style.color = "var(--vermelho)";
    status.textContent = "Erro ao processar o arquivo: "+e.message;
  }
}

// Função do módulo: normalizar data importacao
function normalizarDataImportacao(v){
  if(v == null || v === "") return null;
  if(v instanceof Date) return v.toISOString().slice(0,10);
  if(typeof v === "number"){
    try{
      const d = XLSX.SSF.parse_date_code(v);
      if(d) return d.y+"-"+String(d.m).padStart(2,"0")+"-"+String(d.d).padStart(2,"0");
    }catch(e){}
  }
  const s = String(v).trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m) return m[3]+"-"+m[2].padStart(2,"0")+"-"+m[1].padStart(2,"0");
  return null;
}

