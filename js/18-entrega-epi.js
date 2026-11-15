/* =====================================================================
   ENTREGA DE EPIs E ESTOQUE — registrar a entrega de EPI a um colaborador
   (com confirmação do colaborador) e controlar o saldo de estoque por loja
   ===================================================================== */

let ENT_ATUAL = null;      // {colab, epis, selecionados}
let ENT_PAD = null;        // estado do quadro de assinatura (canvas)
let ENT_ESTOQUE = [];      // cache de public.epi_estoque

const ENT_MOTIVOS = ["Primeira entrega", "Troca periódica", "Desgaste/dano", "Perda", "Outro"];

// Carrega (ou recarrega) o saldo de estoque de todas as lojas
async function entCarregarEstoque(){
  const { data, error } = await sb.from("epi_estoque").select("unidade,descricao,ca,quantidade_atual").order("unidade");
  if(!error) ENT_ESTOQUE = data || [];
  return ENT_ESTOQUE;
}

// Busca o saldo em estoque de um EPI numa loja (0 se não houver registro)
function entSaldoDe(loja, descricao, ca){
  const l = normalizarTextoComparacao(loja), d = normalizarTextoComparacao(descricao), c = normalizarTextoComparacao(ca||"");
  const reg = ENT_ESTOQUE.find(e=>normalizarTextoComparacao(e.unidade)===l && normalizarTextoComparacao(e.descricao)===d && normalizarTextoComparacao(e.ca||"")===c);
  return reg ? reg.quantidade_atual : 0;
}

// Inicializa a aba "Entrega de EPIs": carrega base, estoque e preenche os filtros
async function initEntregaEpi(){
  await carregarBaseEpi().catch(()=>{});
  await entCarregarEstoque();
  preencherSelectEpi("ent-hist-loja", lojasBaseEpi(true), "Todas");
  entNovaBusca();
  await entRenderHistorico();
}

// Volta a aba de Entrega para o estado de busca (sem colaborador selecionado)
function entNovaBusca(){
  document.getElementById("ent-itens").style.display = "none";
  document.getElementById("ent-busca").style.display = "block";
  document.getElementById("ent-status").textContent = "";
  const campo = document.getElementById("ent-matricula");
  campo.value = "";
  campo.focus();
  ENT_ATUAL = null;
}

// Busca o colaborador pela matrícula e mostra os EPIs da função dele para entrega
async function entBuscarColaborador(){
  const matricula = document.getElementById("ent-matricula").value.trim();
  const status = document.getElementById("ent-status");
  if(!matricula){ status.style.color = "var(--vermelho)"; status.textContent = "Digite a matrícula."; return; }
  status.style.color = "var(--areia-esc)";
  status.textContent = "Buscando...";
  try{ await carregarBaseEpi(); }catch(e){ status.style.color="var(--vermelho)"; status.textContent = "Erro ao carregar a base: "+(e&&e.message?e.message:e); return; }
  const colab = EPI_BASE.colaboradores.find(c=>String(c.matricula).trim()===matricula);
  if(!colab){ status.style.color="var(--vermelho)"; status.textContent = "Matrícula não encontrada na base."; return; }
  const epis = episDaFuncaoEpi(colab.setor, colab.cargo);
  await entCarregarEstoque();
  ENT_ATUAL = {colab, epis};
  entRenderItens(colab, epis);
  document.getElementById("ent-busca").style.display = "none";
  document.getElementById("ent-itens").style.display = "block";
  status.textContent = "";
}

// Desenha a tabela de EPIs da função do colaborador, com quantidade e motivo editáveis
function entRenderItens(colab, epis){
  document.getElementById("ent-colab-info").innerHTML = `<b>${escHtml(colab.nome||"—")}</b> · matrícula ${escHtml(colab.matricula)} · ${escHtml(colab.loja||"—")} · ${escHtml(colab.setor||"—")} · ${escHtml(colab.cargo||"—")}`;
  const tbody = document.getElementById("ent-itens-tbody");
  if(!epis.length){
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--terracota); text-align:center; padding:14px;">Nenhum EPI padrão cadastrado para "${escHtml(colab.setor||"—")} / ${escHtml(colab.cargo||"—")}".</td></tr>`;
    return;
  }
  const motivosOpts = ENT_MOTIVOS.map(m=>`<option>${escHtml(m)}</option>`).join("");
  tbody.innerHTML = epis.map((e,idx)=>{
    const saldo = entSaldoDe(colab.loja, e.descricao, e.ca);
    return `<tr>
      <td style="text-align:center;"><input type="checkbox" id="ent-chk-${idx}" onchange="document.getElementById('ent-qtd-${idx}').disabled=!this.checked; document.getElementById('ent-mot-${idx}').disabled=!this.checked;"></td>
      <td>${escHtml(e.descricao)}</td>
      <td>${escHtml(e.ca||"—")}</td>
      <td><input type="number" id="ent-qtd-${idx}" min="1" value="1" disabled style="width:100%;"></td>
      <td><select id="ent-mot-${idx}" disabled style="width:100%;">${motivosOpts}</select></td>
      <td style="${saldo<=0?'color:#b91c1c;font-weight:700;':''}">${saldo}</td>
    </tr>`;
  }).join("");
}

// Reúne os itens marcados e abre o quadro de assinatura para o colaborador confirmar
function entAbrirAssinatura(){
  if(!ENT_ATUAL) return;
  const selecionados = ENT_ATUAL.epis.map((e,idx)=>{
    const chk = document.getElementById("ent-chk-"+idx);
    if(!chk || !chk.checked) return null;
    const qtd = parseInt(document.getElementById("ent-qtd-"+idx).value, 10) || 0;
    const motivo = document.getElementById("ent-mot-"+idx).value;
    if(qtd<=0) return null;
    return {descricao: e.descricao, ca: e.ca||"", quantidade: qtd, motivo};
  }).filter(Boolean);
  if(!selecionados.length){ alert("Marque ao menos um item para entregar."); return; }
  ENT_ATUAL.selecionados = selecionados;
  document.getElementById("ent-ass-info").innerHTML = `<b>${escHtml(ENT_ATUAL.colab.nome)}</b> (matrícula ${escHtml(ENT_ATUAL.colab.matricula)}): assine abaixo e repita a matrícula para confirmar o recebimento de ${selecionados.length} item(ns).`;
  document.getElementById("ent-ass-matricula").value = "";
  document.getElementById("modal-epi-assinatura").style.display = "flex";
  const cv = document.getElementById("ent-ass-cv"), ctx = cv.getContext("2d");
  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b1f3a";
  ENT_PAD = {cv, ctx, desenhou:false, last:null};
  const pos = e=>{ const r = cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*cv.width/r.width, y:(e.clientY-r.top)*cv.height/r.height}; };
  cv.onpointerdown = e=>{ e.preventDefault(); cv.setPointerCapture(e.pointerId); ENT_PAD.last = pos(e); ctx.beginPath(); ctx.arc(ENT_PAD.last.x, ENT_PAD.last.y, 1.4, 0, 7); ctx.fillStyle="#0b1f3a"; ctx.fill(); ENT_PAD.desenhou = true; };
  cv.onpointermove = e=>{ if(!ENT_PAD.last) return; e.preventDefault(); const p = pos(e); ctx.beginPath(); ctx.moveTo(ENT_PAD.last.x, ENT_PAD.last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ENT_PAD.last = p; };
  const fim = ()=>{ if(ENT_PAD) ENT_PAD.last = null; };
  cv.onpointerup = fim; cv.onpointercancel = fim; cv.onpointerleave = fim;
  cv.addEventListener("limpar", ()=>{ ctx.clearRect(0,0,cv.width,cv.height); ENT_PAD.desenhou = false; });
}

// Grava a entrega no banco, baixa o estoque da loja e atualiza as listas na tela
async function entConfirmarEntrega(){
  if(!ENT_ATUAL || !ENT_ATUAL.selecionados) return;
  if(!ENT_PAD || !ENT_PAD.desenhou){ alert("Colete a assinatura no quadro antes de confirmar."); return; }
  const matriculaConf = document.getElementById("ent-ass-matricula").value.trim();
  const confBate = matriculaConf === String(ENT_ATUAL.colab.matricula).trim();
  if(!matriculaConf){ alert("Peça para o colaborador repetir a matrícula para confirmar."); return; }
  const btn = document.getElementById("ent-ass-confirmar"); const rot = btn.innerHTML;
  btn.disabled = true; btn.textContent = "Salvando...";
  const img = ENT_PAD.cv.toDataURL("image/png");
  const { colab, selecionados } = ENT_ATUAL;
  const { data, error } = await sb.rpc("epi_registrar_entrega", {
    p_matricula: String(colab.matricula), p_nome: colab.nome, p_loja: colab.loja, p_setor: colab.setor, p_funcao: colab.cargo,
    p_itens: selecionados, p_assinatura: img, p_confirmado_matricula: confBate, p_tecnico: currentUser.id
  });
  if(error){ btn.disabled = false; btn.innerHTML = rot; alert("Não foi possível registrar a entrega: "+(error.message||error)); return; }
  document.getElementById("modal-epi-assinatura").style.display = "none";
  btn.disabled = false; btn.innerHTML = rot;
  ENT_PAD = null;
  mostrarToast("Entrega registrada com sucesso.");
  await entCarregarEstoque();
  await entRenderHistorico();
  entNovaBusca();
}

// Lista as entregas mais recentes, filtrando por loja e por busca livre
async function entRenderHistorico(){
  const loja = document.getElementById("ent-hist-loja").value;
  const busca = normalizarTextoComparacao(document.getElementById("ent-hist-busca").value);
  let q = sb.from("epi_entregas").select("*").order("data_entrega",{ascending:false}).limit(200);
  if(loja) q = q.eq("loja", loja);
  const { data, error } = await q;
  const tbody = document.getElementById("ent-hist-tbody");
  if(error){ tbody.innerHTML = `<tr><td colspan="5" style="color:var(--vermelho);text-align:center;padding:14px;">Erro ao carregar: ${escHtml(error.message||"")}</td></tr>`; return; }
  let lista = data || [];
  if(busca) lista = lista.filter(r=>normalizarTextoComparacao(r.colaborador_nome).includes(busca) || normalizarTextoComparacao(r.matricula).includes(busca));
  if(!lista.length){ tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:14px;color:var(--areia-esc)">Nenhuma entrega encontrada.</td></tr>`; return; }
  tbody.innerHTML = lista.map(r=>{
    const itens = (r.itens||[]).map(i=>`${escHtml(i.descricao)} (${i.quantidade}x${i.ca?" · CA "+escHtml(i.ca):""})`).join(", ");
    return `<tr>
      <td>${vDataHora(r.data_entrega)}</td>
      <td>${escHtml(r.colaborador_nome)} <span class="sub">Mat. ${escHtml(r.matricula)}</span></td>
      <td>${escHtml(r.loja)}</td>
      <td>${itens}</td>
      <td>${r.assinatura?"✓ Assinado":"—"}${r.confirmado_por_matricula?" · matrícula conferida":""}</td>
    </tr>`;
  }).join("");
}

// Inicializa a aba "Estoque": preenche os seletores de loja e mostra o saldo atual
async function initEstoqueEpi(){
  await carregarBaseEpi().catch(()=>{});
  preencherSelectEpi("est-loja", lojasBaseEpi(true), "Selecione a loja...");
  preencherSelectEpi("est-f-loja", lojasBaseEpi(true), "Todas");
  await entCarregarEstoque();
  estRenderSaldo();
}

// Registra uma entrada de estoque (chegada de EPIs na loja) e atualiza o saldo
async function estRegistrarEntrada(){
  const loja = document.getElementById("est-loja").value;
  const descricao = document.getElementById("est-descricao").value.trim();
  const ca = document.getElementById("est-ca").value.trim();
  const qtd = parseInt(document.getElementById("est-qtd").value, 10) || 0;
  const motivo = document.getElementById("est-motivo").value.trim();
  const status = document.getElementById("est-status");
  if(!loja || !descricao || qtd<=0){ status.style.color="var(--vermelho)"; status.textContent = "Preencha loja, descrição e uma quantidade maior que zero."; return; }
  status.style.color = "var(--areia-esc)"; status.textContent = "Salvando...";
  const { error } = await sb.rpc("epi_estoque_entrada", {p_unidade:loja, p_descricao:descricao, p_ca:ca, p_quantidade:qtd, p_motivo:motivo, p_usuario:currentUser.id});
  if(error){ status.style.color="var(--vermelho)"; status.textContent = "Erro: "+(error.message||error); return; }
  status.style.color = "#00733f"; status.textContent = "Entrada registrada.";
  document.getElementById("est-descricao").value = ""; document.getElementById("est-ca").value = ""; document.getElementById("est-qtd").value = "1"; document.getElementById("est-motivo").value = "";
  await entCarregarEstoque();
  estRenderSaldo();
}

// Desenha a tabela de saldo de estoque, filtrada por loja
function estRenderSaldo(){
  const loja = document.getElementById("est-f-loja").value;
  const tbody = document.getElementById("est-saldo-tbody");
  let lista = ENT_ESTOQUE.slice().sort((a,b)=>cmpPtBr(a.unidade,b.unidade)||cmpPtBr(a.descricao,b.descricao));
  if(loja) lista = lista.filter(r=>r.unidade===loja);
  if(!lista.length){ tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:14px;color:var(--areia-esc)">Nenhum estoque registrado.</td></tr>`; return; }
  tbody.innerHTML = lista.map(r=>`<tr><td>${escHtml(r.unidade)}</td><td>${escHtml(r.descricao)}</td><td>${escHtml(r.ca||"—")}</td><td style="${r.quantidade_atual<=0?'color:#b91c1c;font-weight:700;':''}">${r.quantidade_atual}</td></tr>`).join("");
}
