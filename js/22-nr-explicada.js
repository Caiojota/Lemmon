/* =====================================================================
   NR EXPLICADA — consulta das Normas Regulamentadoras, item por item
   ===================================================================== */

let nreNrAtiva = null;

// Lista todas as NRs (chave "NR-1".."NR-38"), ordenadas numericamente
function nreListaOrdenada(){
  return Object.keys(NR_DADOS).sort((a,b)=> (parseInt(a.replace(/\D/g,""),10)||0) - (parseInt(b.replace(/\D/g,""),10)||0));
}

// Desenha a lista lateral de NRs, respeitando o filtro de busca
function nreRenderLista(){
  const wrap = document.getElementById("nre-lista-itens");
  if(!wrap) return;
  const busca = normalizarTextoComparacao(document.getElementById("nre-busca").value);
  const nrs = nreListaOrdenada().filter(nr=>{
    if(!busca) return true;
    const d = NR_DADOS[nr];
    if(normalizarTextoComparacao(nr).includes(busca)) return true;
    if(d.titulo && normalizarTextoComparacao(d.titulo).includes(busca)) return true;
    if(d.itens && d.itens.some(it => normalizarTextoComparacao(it.numero+" "+it.titulo+" "+(it.explicacao||"")).includes(busca))) return true;
    return false;
  });
  if(!nrs.length){ wrap.innerHTML = '<p class="dica-campo">Nenhuma NR encontrada.</p>'; return; }
  wrap.innerHTML = nrs.map(nr=>{
    const d = NR_DADOS[nr];
    const revogada = d.status==="revogada" || d.status==="vaga";
    const tag = revogada ? `<span class="tag-status notificado">${d.status==="vaga"?"Vaga":"Revogada"}</span>` : "";
    return `<button type="button" class="nre-nr-btn ${nreNrAtiva===nr?"ativo":""}" onclick="nreAbrirNr('${nr}')"><span>${escHtml(nr)}${d.titulo?" — "+escHtml(d.titulo):""}</span>${tag}</button>`;
  }).join("");
}

// Abre a NR escolhida no painel de detalhe
function nreAbrirNr(nr){
  nreNrAtiva = nr;
  nreRenderLista();
  const d = NR_DADOS[nr];
  const det = document.getElementById("nre-detalhe");
  if(!d){ det.innerHTML = '<div class="nre-vazio">NR não encontrada.</div>'; return; }

  if(d.status==="revogada" || d.status==="vaga"){
    det.innerHTML = `<h3>${escHtml(nr)}${d.titulo?" — "+escHtml(d.titulo):""}</h3>
      <p class="nre-resumo"><span class="tag-status notificado">${d.status==="vaga"?"Número vago":"Revogada"}</span></p>
      <p class="nre-resumo">${escHtml(d.observacao||"Essa NR não está mais em vigor.")}</p>`;
    return;
  }

  const itens = (d.itens||[]).map(it=>`
    <div class="nre-item-card">
      <div class="num">${escHtml(it.numero)}</div>
      <h4>${escHtml(it.titulo)}</h4>
      <p>${escHtml(it.explicacao||"")}</p>
    </div>`).join("");

  det.innerHTML = `
    <h3>${escHtml(nr)} — ${escHtml(d.titulo||"")}</h3>
    <p class="nre-resumo">${escHtml(d.resumo||"")}</p>
    ${itens || '<p class="dica-campo">Conteúdo detalhado ainda não cadastrado pra essa NR.</p>'}
  `;
}

// Inicializa o módulo NR Explicada (chamado toda vez que o painel abre)
function initNrExplicada(){
  nreRenderLista();
  if(!nreNrAtiva){
    const primeira = nreListaOrdenada().find(nr => NR_DADOS[nr].status!=="revogada" && NR_DADOS[nr].status!=="vaga");
    if(primeira) nreAbrirNr(primeira);
  } else {
    nreAbrirNr(nreNrAtiva);
  }
}
