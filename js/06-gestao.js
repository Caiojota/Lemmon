/* =====================================================================
   GESTÃO — EPI e C.A por função
   ===================================================================== */
const EF = {carregado:false, linhas:[], combos:new Map(), cargos:new Map(), itens:new Map(), abertos:new Set(), catalogo:[], aba:"funcoes", lista:"todas", busca:"", sel:null, edit:null};
const efN = normalizarTextoComparacao;
const efChave = (setor, funcao)=>efN(setor)+"|"+efN(funcao);
const EF_CA_OK = /^(\d{3,6}|N\/?A)$/i;

async function initEpiFuncao(){
  if(!EF.carregado){
    document.getElementById("ef-lista").innerHTML = '<div class="ef-vazio">Carregando…</div>';
    document.getElementById("ef-editor").innerHTML = '<div class="ef-vazio">Carregando…</div>';
  }
  try{
    await efCarregar();
  }catch(e){
    console.error("[Supabase] EPI por função:", e);
    document.getElementById("ef-lista").innerHTML = '<div class="ef-vazio" style="color:var(--vermelho);">Não foi possível carregar os dados.</div>';
    return;
  }
  efRenderTudo();
}
async function efCarregar(){
  const [linhas, colabs] = await Promise.all([
    buscarTodasLinhas("epi_por_funcao", "id,setor,funcao,ca,descricao,ordem"),
    buscarTodasLinhas("colaboradores", "id,setor,cargo")
  ]);
  EF.linhas = linhas;
  EF.combos = new Map();
  linhas.forEach(l=>{
    const k = efChave(l.setor, l.funcao);
    if(!EF.combos.has(k)) EF.combos.set(k, {key:k, setor:l.setor, funcao:l.funcao, rows:[]});
    EF.combos.get(k).rows.push(l);
  });
  EF.combos.forEach(c=>c.rows.sort((a,b)=>(a.ordem||0)-(b.ordem||0) || a.id-b.id));
  EF.cargos = new Map();
  colabs.forEach(c=>{
    if(!c.cargo || !c.setor) return;
    const cn = efN(c.cargo), sn = efN(c.setor);
    if(!EF.cargos.has(cn)) EF.cargos.set(cn, {cargoN:cn, cargo:String(c.cargo).trim(), total:0, setores:new Map()});
    const g = EF.cargos.get(cn); g.total++;
    if(!g.setores.has(sn)) g.setores.set(sn, {setor:String(c.setor).trim(), setorN:sn, n:0});
    g.setores.get(sn).n++;
  });
  // universo setor + função: o que existe na base de colaboradores somado ao que já tem lista
  EF.itens = new Map();
  EF.combos.forEach(c=>EF.itens.set(c.key, {key:c.key, setor:c.setor, funcao:c.funcao, n:0, rows:c.rows}));
  colabs.forEach(c=>{
    if(!c.cargo || !c.setor) return;
    const k = efChave(c.setor, c.cargo);
    if(!EF.itens.has(k)) EF.itens.set(k, {key:k, setor:String(c.setor).trim(), funcao:String(c.cargo).trim(), n:0, rows:null});
    EF.itens.get(k).n++;
  });
  efMontarCatalogo();
  EF.carregado = true;
  invalidarBaseEpi();
}
function efColabsDoCombo(setor, funcao){
  const it = EF.itens.get(efChave(setor, funcao));
  return it ? it.n : 0;
}
function efMontarCatalogo(){
  const m = new Map();
  EF.linhas.forEach(l=>{
    const k = efN(l.descricao);
    if(!m.has(k)) m.set(k, {desc:String(l.descricao).trim(), cas:new Set(), ids:[], combos:new Set(), freq:new Map()});
    const g = m.get(k);
    const ca = String(l.ca||"").trim(); if(ca) g.cas.add(ca);
    g.ids.push(l.id); g.combos.add(efChave(l.setor,l.funcao));
    g.freq.set(l.descricao.trim(), (g.freq.get(l.descricao.trim())||0)+1);
  });
  EF.catalogo = [...m.values()].map(g=>{
    g.desc = [...g.freq.entries()].sort((a,b)=>b[1]-a[1])[0][0];
    return {desc:g.desc, novoDesc:g.desc, cas:[...g.cas], novoCa:g.cas.size===1?[...g.cas][0]:"", ids:g.ids, n:g.combos.size};
  }).sort((a,b)=>a.desc.localeCompare(b.desc,"pt-BR"));
}
function efSemLista(){
  return [...EF.itens.values()].filter(i=>!i.rows);
}
function efRenderTudo(){
  efRenderKpis(); efRenderLista(); efRenderEditor(); efRenderCatalogo(); efRenderListas();
}
function efRenderListas(){
  document.getElementById("ef-dl-epis").innerHTML = EF.catalogo.map(c=>`<option value="${escHtml(c.desc)}">`).join("");
  const setores = new Set(); EF.combos.forEach(c=>setores.add(c.setor)); EF.cargos.forEach(g=>g.setores.forEach(s=>setores.add(s.setor)));
  document.getElementById("ef-dl-setores").innerHTML = [...setores].sort((a,b)=>a.localeCompare(b,"pt-BR")).map(s=>`<option value="${escHtml(s)}">`).join("");
  const funcoes = new Set(); EF.combos.forEach(c=>funcoes.add(c.funcao)); EF.cargos.forEach(g=>funcoes.add(g.cargo));
  document.getElementById("ef-dl-funcoes").innerHTML = [...funcoes].sort((a,b)=>a.localeCompare(b,"pt-BR")).map(s=>`<option value="${escHtml(s)}">`).join("");
}
function efRenderKpis(){
  const setores = new Set(); EF.itens.forEach(i=>setores.add(efN(i.setor)));
  let semColabs = 0; EF.itens.forEach(i=>{ if(!i.rows) semColabs += i.n; });
  const ic = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>';
  const k = (cls,n,r)=>`<div class="dm-kpi ${cls}"><span class="dm-kpi-ic">${ic}</span><div><b>${n}</b><span>${r}</span></div></div>`;
  document.getElementById("ef-kpis").innerHTML = k("", setores.size, "Setores") + k("terra", EF.combos.size, "Setor + função com lista") + k(semColabs?"verm":"", semColabs.toLocaleString("pt-BR"), "Colaboradores sem lista") + k("amb", EF.catalogo.length, "EPIs no catálogo");
}
function efMostrarAba(a){
  EF.aba = a;
  document.querySelectorAll("#ef-abas button").forEach(b=>b.classList.toggle("active", b.dataset.a===a));
  document.getElementById("ef-painel-funcoes").style.display = a==="funcoes" ? "" : "none";
  document.getElementById("ef-painel-catalogo").style.display = a==="catalogo" ? "" : "none";
}
function efTrocarLista(l){
  EF.lista = l;
  document.querySelectorAll("#ef-seg button").forEach(b=>b.classList.toggle("active", b.dataset.l===l));
  efRenderLista();
}
function efFiltrarLista(v){ EF.busca = v; efRenderLista(); }
function efAlternarSetor(sn){ if(EF.abertos.has(sn)) EF.abertos.delete(sn); else EF.abertos.add(sn); efRenderLista(); }
function efRenderLista(){
  const q = efN(EF.busca);
  const el = document.getElementById("ef-lista");
  const todos = [...EF.itens.values()];
  const semN = todos.filter(i=>!i.rows).length;
  document.getElementById("ef-n-todas").textContent = "("+todos.length+")";
  document.getElementById("ef-n-sem").textContent = "("+semN+")";
  document.getElementById("ef-n-com").textContent = "("+(todos.length-semN)+")";
  // totais de cada setor (sempre sobre todas as funções do setor, independente do filtro)
  const tot = new Map();
  todos.forEach(i=>{
    const sn = efN(i.setor);
    if(!tot.has(sn)) tot.set(sn, {setor:i.setor, total:0, sem:0, colabs:0, colabsSem:0});
    const t = tot.get(sn); t.total++; t.colabs += i.n; if(!i.rows){ t.sem++; t.colabsSem += i.n; }
  });
  const passa = i => (EF.lista==="todas" || (EF.lista==="sem" ? !i.rows : !!i.rows)) && (!q || efN(i.setor+" "+i.funcao).includes(q));
  const grupos = new Map();
  todos.filter(passa).forEach(i=>{
    const sn = efN(i.setor);
    if(!grupos.has(sn)) grupos.set(sn, {sn, itens:[]});
    grupos.get(sn).itens.push(i);
  });
  const ordem = [...grupos.values()].sort((a,b)=>{
    const ta = tot.get(a.sn), tb = tot.get(b.sn);
    if(EF.lista==="sem" && tb.colabsSem!==ta.colabsSem) return tb.colabsSem-ta.colabsSem;
    return ta.setor.localeCompare(tb.setor,"pt-BR");
  });
  const html = ordem.map(g=>{
    const t = tot.get(g.sn);
    const aberto = !!q || EF.abertos.has(g.sn);
    const badge = t.sem ? `<span class="ef-badge verm">${t.sem} sem lista</span>` : `<span class="ef-badge verde">completo</span>`;
    const itens = aberto ? g.itens.sort((a,b)=>a.funcao.localeCompare(b.funcao,"pt-BR")).map(i=>{
      const info = i.n ? i.n.toLocaleString("pt-BR")+" colaborador"+(i.n===1?"":"es") : "sem colaboradores na base";
      const b2 = i.rows ? `<span class="ef-badge">${i.rows.length} EPI${i.rows.length===1?"":"s"}</span>` : `<span class="ef-badge verm">sem lista</span>`;
      return `<button type="button" class="ef-item ${EF.sel==="c:"+i.key?"sel":""}" data-k="${escHtml("c:"+i.key)}" onclick="efSelecionar(this.dataset.k)"><b><span>${escHtml(i.funcao)}</span>${b2}</b><small>${info}</small></button>`;
    }).join("") : "";
    return `<div class="ef-grp ${aberto?"aberto":""}"><button type="button" class="ef-grp-cab" data-s="${escHtml(g.sn)}" onclick="efAlternarSetor(this.dataset.s)"><span class="seta">▶</span><span class="nome"><b>${escHtml(t.setor)}</b><small>${t.total} função${t.total===1?"":"es"} · ${t.colabs.toLocaleString("pt-BR")} colaborador${t.colabs===1?"":"es"}</small></span>${badge}</button>${itens}</div>`;
  }).join("") || (EF.lista==="sem" && !q ? '<div class="ef-vazio">Tudo certo: todas as funções de todos os setores têm lista de EPI.</div>' : '<div class="ef-vazio">Nenhum setor ou função encontrado.</div>');
  el.innerHTML = html;
}

/* ---- Editor ---- */
function efDestinosDe(funcao, principalKey){
  const destinos = new Map();
  const g = EF.cargos.get(efN(funcao));
  if(g) g.setores.forEach(s=>destinos.set(efChave(s.setor,funcao), {setor:s.setor, n:s.n}));
  EF.combos.forEach(c=>{ if(efN(c.funcao)===efN(funcao) && !destinos.has(c.key)) destinos.set(c.key, {setor:c.setor, n:0}); });
  return [...destinos.entries()].filter(([k])=>k!==principalKey).map(([k,d])=>{
    const tem = EF.combos.has(k);
    return {key:k, setor:d.setor, n:d.n, tem, nItens: tem ? EF.combos.get(k).rows.length : 0, checked:false};
  }).sort((a,b)=>(a.tem-b.tem) || b.n-a.n || a.setor.localeCompare(b.setor,"pt-BR"));
}
function efSelecionar(k){
  const key = String(k).slice(2);
  const it = EF.itens.get(key); if(!it) return;
  EF.sel = k; EF.abertos.add(efN(it.setor));
  EF.edit = {modo:"combo", tem:!!it.rows, funcao:it.funcao, principal:{setor:it.setor, key}, linhas:(it.rows||[]).map(r=>({descricao:r.descricao, ca:r.ca||""})), destinos:efDestinosDe(it.funcao, key), setorTxt:"", funcaoTxt:""};
  efRenderLista(); efRenderEditor();
}
function efNovaManual(){
  efMostrarAba("funcoes");
  EF.sel = null;
  EF.edit = {modo:"manual", funcao:"", principal:null, linhas:[], destinos:[], setorTxt:"", funcaoTxt:""};
  efRenderLista(); efRenderEditor();
  const f = document.getElementById("ef-man-setor"); if(f) f.focus();
}
function efRenderEditor(){
  const el = document.getElementById("ef-editor");
  const ed = EF.edit;
  if(!ed){
    el.innerHTML = '<div class="ef-vazio" style="padding:70px 20px;"><b style="display:block; color:var(--marrom-esc); font-size:15px; margin-bottom:6px;">Escolha um setor e uma função</b>Abra um setor na lista ao lado e clique na função para ver e editar os EPIs e C.A daquele setor.<br>Em “Sem lista” aparecem as funções da base de colaboradores que ainda não têm EPIs definidos.</div>';
    return;
  }
  const manual = ed.modo==="manual";
  let sub = "";
  if(ed.modo==="combo"){ const n = efColabsDoCombo(ed.principal.setor, ed.funcao); sub = (ed.tem?"Lista de EPI deste setor":"Ainda sem lista neste setor")+(n?" · "+n.toLocaleString("pt-BR")+" colaborador"+(n===1?"":"es")+" na base":""); }
  else sub = "Informe o setor e a função e monte a lista abaixo.";
  const copiaveis = [...EF.combos.values()].filter(c=>!ed.principal || c.key!==ed.principal.key)
    .sort((a,b)=>(efN(b.funcao)===efN(ed.funcao)) - (efN(a.funcao)===efN(ed.funcao)) || a.funcao.localeCompare(b.funcao,"pt-BR") || a.setor.localeCompare(b.setor,"pt-BR"));
  const optCopia = '<option value="">Copiar lista de…</option>' + copiaveis.map(c=>`<option value="${escHtml(c.key)}">${escHtml(c.funcao)} — ${escHtml(c.setor)} (${c.rows.length})</option>`).join("");
  const dest = ed.destinos;
  el.innerHTML = `
    <div class="ef-ed-cab">
      <div class="tit"><span class="eyebrow">${manual?"Novo setor e função":"Setor · "+escHtml(ed.principal.setor)}</span><h3>${manual?"Novo setor e função":escHtml(ed.funcao)}</h3><p>${sub}</p></div>
      <select onchange="efCopiarDe(this.value)" title="Parte de uma lista que já existe">${optCopia}</select>
      ${ed.modo==="combo" && ed.tem?`<button type="button" class="small-btn danger" onclick="efExcluirLista()">Excluir lista</button>`:""}
    </div>
    ${manual?`<div class="ef-manual"><div><label>Setor</label><input id="ef-man-setor" list="ef-dl-setores" value="${escHtml(ed.setorTxt)}" oninput="EF.edit.setorTxt=this.value" placeholder="ex.: ADM HORTIFRUTI"></div><div><label>Função</label><input id="ef-man-funcao" list="ef-dl-funcoes" value="${escHtml(ed.funcaoTxt)}" oninput="EF.edit.funcaoTxt=this.value" placeholder="ex.: REPOSITOR"></div></div>`:""}
    <div class="ef-cols"><span>#</span><span>EPI</span><span>C.A</span><span></span></div>
    <div class="ef-linhas" id="ef-linhas"></div>
    <button type="button" class="rn-add-btn" onclick="efAddLinha()">+ Adicionar EPI</button>
    ${dest.length?`<div class="ef-dest"><h4>Usar esta mesma lista em outros setores (opcional)</h4>
      <p>A mesma função pode usar EPIs diferentes em cada setor, por isso nada vem marcado. Marque só os setores em que esta lista também vale. Marcar um setor que já tem lista <b>substitui</b> a lista dele.</p>
      <div class="ef-dest-acoes"><button type="button" class="small-btn" onclick="efMarcarDest('sem')">Marcar os sem lista</button><button type="button" class="small-btn" onclick="efMarcarDest('nenhum')">Desmarcar todos</button></div>
      <div class="ef-dest-grid">${dest.map((d,i)=>`<label><input type="checkbox" ${d.checked?"checked":""} onchange="EF.edit.destinos[${i}].checked=this.checked; efAtualizarAviso();"><span title="${escHtml(d.setor)}">${escHtml(d.setor)}</span>${d.tem?`<span class="ef-badge">já tem ${d.nItens}</span>`:`<span class="ef-badge verm">sem lista</span>`}${d.n?`<span class="ef-badge verde">${d.n}</span>`:""}</label>`).join("")}</div></div>`:""}
    <div class="ef-rodape"><span class="aviso" id="ef-aviso"></span><button type="button" class="btn-secondary" onclick="efCancelar()">Cancelar</button><button type="button" class="btn-primary inline" id="ef-salvar" onclick="efSalvar()">Salvar lista</button></div>`;
  efRenderLinhas(); efAtualizarAviso();
}
function efRenderLinhas(){
  const ed = EF.edit; if(!ed) return;
  const el = document.getElementById("ef-linhas");
  if(!ed.linhas.length){ el.innerHTML = '<div class="ef-vazio" style="padding:14px;">Nenhum EPI na lista deste setor. Clique em “+ Adicionar EPI” ou copie a lista de outra função/setor.</div>'; return; }
  el.innerHTML = ed.linhas.map((l,i)=>{
    const ca = String(l.ca||"").trim();
    const inval = ca!=="" && !EF_CA_OK.test(ca);
    return `<div class="ef-linha"><span class="num">${i+1}</span>
      <input list="ef-dl-epis" value="${escHtml(l.descricao)}" placeholder="Nome do EPI" oninput="EF.edit.linhas[${i}].descricao=this.value" onchange="efAoEscolherEpi(${i})">
      <input value="${escHtml(l.ca)}" placeholder="C.A ou N/A" class="${inval?"invalido":""}" title="${inval?"C.A costuma ter de 3 a 6 números (ou N/A)":""}" oninput="EF.edit.linhas[${i}].ca=this.value; this.classList.toggle('invalido', this.value.trim()!=='' && !EF_CA_OK.test(this.value.trim()));">
      <span class="acoes"><button type="button" class="ef-btn-ic" title="Subir" ${i===0?"disabled":""} onclick="efMover(${i},-1)">↑</button><button type="button" class="ef-btn-ic" title="Descer" ${i===ed.linhas.length-1?"disabled":""} onclick="efMover(${i},1)">↓</button><button type="button" class="ef-btn-ic del" title="Remover" onclick="efDelLinha(${i})">×</button></span></div>`;
  }).join("");
}
function efAddLinha(){ EF.edit.linhas.push({descricao:"", ca:""}); efRenderLinhas(); const ins = document.querySelectorAll("#ef-linhas .ef-linha input"); if(ins.length>=2) ins[ins.length-2].focus(); }
function efDelLinha(i){ EF.edit.linhas.splice(i,1); efRenderLinhas(); }
function efMover(i, d){ const a = EF.edit.linhas; const j = i+d; if(j<0||j>=a.length) return; [a[i],a[j]] = [a[j],a[i]]; efRenderLinhas(); }
function efAoEscolherEpi(i){
  const l = EF.edit.linhas[i];
  const c = EF.catalogo.find(x=>efN(x.desc)===efN(l.descricao));
  if(c){ l.descricao = c.desc; if(!String(l.ca||"").trim() && c.cas.length===1) l.ca = c.cas[0]; efRenderLinhas(); }
}
function efCopiarDe(key){
  if(!key) return;
  const c = EF.combos.get(key); if(!c) return;
  if(EF.edit.linhas.some(l=>l.descricao.trim()) && !confirm("Substituir a lista atual pela lista de “"+c.funcao+" — "+c.setor+"”?")){ efRenderEditor(); return; }
  EF.edit.linhas = c.rows.map(r=>({descricao:r.descricao, ca:r.ca||""}));
  efRenderEditor();
}
function efMarcarDest(modo){ EF.edit.destinos.forEach(d=>{ d.checked = modo==="sem" ? !d.tem : false; }); efRenderEditor(); }
function efAtualizarAviso(){
  const ed = EF.edit, el = document.getElementById("ef-aviso"); if(!ed||!el) return;
  const marcados = ed.destinos.filter(d=>d.checked);
  const subst = marcados.filter(d=>d.tem).length;
  const colabs = marcados.reduce((a,d)=>a+(d.tem?0:d.n),0);
  el.style.color = "var(--areia-esc)";
  el.textContent = marcados.length ? "Será aplicada também em "+marcados.length+" setor"+(marcados.length===1?"":"es")+(subst?" ("+subst+" com lista substituída)":"")+(colabs?" · passa a cobrir "+colabs.toLocaleString("pt-BR")+" colaboradores":"")+"." : "";
}
function efCancelar(){ EF.edit = null; EF.sel = null; efRenderLista(); efRenderEditor(); }
function efAviso(msg, erro){ const el = document.getElementById("ef-aviso"); if(el){ el.style.color = erro ? "var(--vermelho)" : "var(--verde-esc)"; el.textContent = msg; } }
async function efSalvar(){
  const ed = EF.edit; if(!ed) return;
  let funcao = ed.funcao, alvos = [];
  if(ed.modo==="manual"){
    funcao = ed.funcaoTxt.trim();
    const setor = ed.setorTxt.trim();
    if(!setor || !funcao){ efAviso("Informe o setor e a função.", true); return; }
    alvos.push({setor, key:efChave(setor, funcao)});
  } else if(ed.modo==="combo"){
    alvos.push({setor:ed.principal.setor, key:ed.principal.key});
  }
  ed.destinos.filter(d=>d.checked).forEach(d=>alvos.push({setor:d.setor, key:d.key}));
  if(!alvos.length){ efAviso("Marque ao menos um setor para aplicar a lista.", true); return; }
  const linhas = ed.linhas.map(l=>({descricao:l.descricao.trim(), ca:String(l.ca||"").trim()})).filter(l=>l.descricao);
  if(!linhas.length){ efAviso("Adicione ao menos um EPI à lista.", true); return; }
  if(linhas.some(l=>!l.ca)){ efAviso("Informe o C.A de cada EPI (ou N/A quando não houver).", true); return; }
  const estranhos = linhas.filter(l=>!EF_CA_OK.test(l.ca));
  if(estranhos.length && !confirm("Estes C.A fogem do padrão (3 a 6 números ou N/A): "+estranhos.map(l=>l.descricao+" → "+l.ca).join("; ")+".\n\nSalvar mesmo assim?")) return;
  const novas = alvos.flatMap(a=>linhas.map((l,i)=>({setor:a.setor, funcao, descricao:l.descricao, ca:l.ca.toUpperCase()==="NA"?"N/A":l.ca.toUpperCase()==="N/A"?"N/A":l.ca, ordem:i})));
  const antigos = alvos.flatMap(a=>(EF.combos.get(efChave(a.setor, funcao))||{rows:[]}).rows.map(r=>r.id));
  const btn = document.getElementById("ef-salvar"); btn.disabled = true;
  efAviso("Salvando…", false);
  try{
    // insere primeiro e só então remove a lista antiga: se algo falhar, nada se perde
    for(let i=0;i<novas.length;i+=200){
      const { error } = await sb.from("epi_por_funcao").insert(novas.slice(i,i+200));
      if(error) throw error;
    }
    for(let i=0;i<antigos.length;i+=200){
      const { error } = await sb.from("epi_por_funcao").delete().in("id", antigos.slice(i,i+200));
      if(error) throw error;
    }
  }catch(e){
    btn.disabled = false;
    efAviso("Erro ao salvar: "+(e.message||e), true);
    return;
  }
  const chaveSel = efChave(alvos[0].setor, funcao);
  await efCarregar();
  EF.lista = "todas";
  document.querySelectorAll("#ef-seg button").forEach(b=>b.classList.toggle("active", b.dataset.l==="todas"));
  efSelecionar("c:"+chaveSel);
  efRenderKpis(); efRenderCatalogo(); efRenderListas();
  efAviso("Lista salva em "+alvos.length+" setor"+(alvos.length===1?"":"es")+".", false);
  mostrarToast("Lista de EPI salva.");
}
async function efExcluirLista(){
  const ed = EF.edit; if(!ed || ed.modo!=="combo") return;
  const c = EF.combos.get(ed.principal.key); if(!c) return;
  if(!confirm("Excluir a lista de EPI de “"+c.funcao+" — "+c.setor+"”? Os colaboradores dessa função ficarão sem lista.")) return;
  const { error } = await sb.from("epi_por_funcao").delete().in("id", c.rows.map(r=>r.id));
  if(error){ efAviso("Erro ao excluir: "+error.message, true); return; }
  EF.edit = null; EF.sel = null;
  await efCarregar(); efRenderTudo();
  mostrarToast("Lista excluída.");
}

/* ---- Catálogo (C.A em lote) ---- */
function efRenderCatalogo(){
  const el = document.getElementById("ef-catalogo"); if(!el) return;
  if(!EF.catalogo.length){ el.innerHTML = '<div class="ef-vazio">Nenhum EPI cadastrado ainda.</div>'; return; }
  el.innerHTML = `<table class="ef-cat"><thead><tr><th>EPI</th><th style="width:190px;">C.A</th><th style="width:120px;">Usado em</th><th style="width:110px;"></th></tr></thead><tbody>` +
    EF.catalogo.map((c,i)=>`<tr><td><input value="${escHtml(c.novoDesc)}" oninput="EF.catalogo[${i}].novoDesc=this.value"></td>
      <td><input value="${escHtml(c.novoCa)}" placeholder="${c.cas.length>1?"vários: "+escHtml(c.cas.join(", ")):"C.A ou N/A"}" oninput="EF.catalogo[${i}].novoCa=this.value"></td>
      <td>${c.n} combinaç${c.n===1?"ão":"ões"}</td>
      <td><button type="button" class="small-btn" style="white-space:nowrap;" onclick="efAplicarCatalogo(${i})">Aplicar a todas</button></td></tr>`).join("") + `</tbody></table>`;
}
async function efAplicarCatalogo(i){
  const c = EF.catalogo[i]; if(!c) return;
  const desc = c.novoDesc.trim(), ca = c.novoCa.trim();
  if(!desc || !ca){ alert("Informe o nome do EPI e o C.A."); return; }
  if(!EF_CA_OK.test(ca) && !confirm("O C.A “"+ca+"” foge do padrão (3 a 6 números ou N/A). Aplicar mesmo assim?")) return;
  if(!confirm("Alterar “"+c.desc+"” para “"+desc+"” com C.A "+ca+" em "+c.n+" combinaç"+(c.n===1?"ão":"ões")+" de setor e função?")) return;
  const { error } = await sb.from("epi_por_funcao").update({descricao:desc, ca}).in("id", c.ids);
  if(error){ alert("Erro ao atualizar: "+error.message); return; }
  const selAntes = EF.sel;
  await efCarregar();
  if(selAntes && EF.edit && EF.edit.modo==="combo" && EF.combos.has(selAntes.slice(2))) efSelecionar(selAntes);
  efRenderTudo();
  mostrarToast("EPI e C.A atualizados em todas as funções.");
}

/* ---- Gestão de Demandas: opções (categoria/tipo) e fluxos (colunas do Kanban) ---- */
function renderOpcoesDemandas(){
  ["categoria","area","tipo_atividade"].forEach(tipo=>{
    const wrap = document.getElementById("lista-dem-"+tipo);
    if(!wrap) return;
    const lista = DEMANDAS_OPCOES[tipo]||[];
    wrap.innerHTML = lista.length ? lista.map((v,idx)=>`
      <div class="admin-item-row">
        <span class="txt">${v}</span>
        <button type="button" class="del-btn" onclick="removerOpcaoDemanda('${tipo}', ${idx})">Remover</button>
      </div>
    `).join("") : '<span class="estrutura-vazio">Nenhum item cadastrado.</span>';
  });
}
async function addOpcaoDemanda(tipo){
  const input = document.getElementById("novo-item-dem-"+tipo);
  const valor = input.value.trim();
  if(!valor) return;
  if((DEMANDAS_OPCOES[tipo]||[]).includes(valor)){ mostrarToast("Esse item já está cadastrado."); return; }
  const { error } = await sb.from("demandas_opcoes").insert({tipo, valor});
  if(error){ alert("Erro ao adicionar: "+error.message); return; }
  DEMANDAS_OPCOES[tipo].push(valor);
  input.value = "";
  renderOpcoesDemandas();
  popularFiltrosDemandas();
}
async function removerOpcaoDemanda(tipo, idx){
  const valor = DEMANDAS_OPCOES[tipo][idx];
  if(!confirm("Remover este item?")) return;
  const { error } = await sb.from("demandas_opcoes").delete().eq("tipo", tipo).eq("valor", valor);
  if(error){ alert("Erro ao remover: "+error.message); return; }
  DEMANDAS_OPCOES[tipo].splice(idx,1);
  renderOpcoesDemandas();
  popularFiltrosDemandas();
}

/* ---- Tipos de demanda: fluxo automático + tempo estimado padrão ---- */
function renderTiposDemandaConfig(){
  const selNovo = document.getElementById("novo-tipo-fluxo");
  if(selNovo) selNovo.innerHTML = FLUXOS.map(f=>`<option value="${f.id}">${f.nome}</option>`).join("");
  const tbody = document.getElementById("tbl-tipos-demanda-config");
  if(!tbody) return;
  if(!DEMANDAS_TIPOS_CONFIG.length){
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--areia-esc); padding:16px;">Nenhum tipo de demanda cadastrado.</td></tr>';
    return;
  }
  tbody.innerHTML = DEMANDAS_TIPOS_CONFIG.map(t=>{
    const opcoesFluxo = FLUXOS.map(f=>`<option value="${f.id}" ${f.id===t.fluxoId?"selected":""}>${f.nome}</option>`).join("");
    return `<tr>
      <td>${t.nome}</td>
      <td><select onchange="atualizarTipoDemandaConfig(${t.id}, 'fluxo_id', this.value)">${opcoesFluxo}</select></td>
      <td><input type="number" min="0" step="0.5" value="${t.tempoEstimadoHoras ?? ''}" style="width:80px;" placeholder="horas" onchange="atualizarTipoDemandaConfig(${t.id}, 'tempo_estimado_horas', this.value)"> h</td>
      <td style="text-align:center;"><input type="checkbox" ${t.requerAnaliseQualidade?"checked":""} onchange="atualizarTipoDemandaConfig(${t.id}, 'requer_analise_qualidade', this.checked)"></td>
      <td><button type="button" class="small-btn danger" onclick="removerTipoDemandaConfig(${t.id})">Remover</button></td>
    </tr>`;
  }).join("");
}
async function addTipoDemandaConfig(){
  const nome = document.getElementById("novo-tipo-nome").value.trim();
  const fluxoId = Number(document.getElementById("novo-tipo-fluxo").value);
  const tempo = document.getElementById("novo-tipo-tempo").value;
  const requerQualidade = document.getElementById("novo-tipo-qualidade").checked;
  if(!nome){ alert("Informe o nome do tipo de demanda."); return; }
  if(DEMANDAS_TIPOS_CONFIG.some(t=>t.nome.toLowerCase()===nome.toLowerCase())){ mostrarToast("Esse tipo já está cadastrado."); return; }
  const { data, error } = await sb.from("demandas_tipos_config").insert({
    nome, fluxo_id: fluxoId||null, tempo_estimado_horas: tempo? Number(tempo) : null, requer_analise_qualidade: requerQualidade
  }).select().single();
  if(error){ alert("Erro ao adicionar tipo de demanda: "+error.message); return; }
  DEMANDAS_TIPOS_CONFIG.push({id:data.id, nome:data.nome, fluxoId:data.fluxo_id, tempoEstimadoHoras:data.tempo_estimado_horas, requerAnaliseQualidade:!!data.requer_analise_qualidade});
  document.getElementById("novo-tipo-nome").value = "";
  document.getElementById("novo-tipo-tempo").value = "";
  document.getElementById("novo-tipo-qualidade").checked = false;
  renderTiposDemandaConfig();
  mostrarToast("Tipo de demanda adicionado.");
}
async function atualizarTipoDemandaConfig(id, campo, valor){
  const t = DEMANDAS_TIPOS_CONFIG.find(x=>x.id===id);
  if(!t) return;
  const payload = {};
  if(campo==="fluxo_id"){ payload.fluxo_id = Number(valor)||null; t.fluxoId = payload.fluxo_id; }
  if(campo==="tempo_estimado_horas"){ payload.tempo_estimado_horas = valor? Number(valor) : null; t.tempoEstimadoHoras = payload.tempo_estimado_horas; }
  if(campo==="requer_analise_qualidade"){ payload.requer_analise_qualidade = !!valor; t.requerAnaliseQualidade = !!valor; }
  const { error } = await sb.from("demandas_tipos_config").update(payload).eq("id", id);
  if(error){ alert("Erro ao atualizar: "+error.message); return; }
  mostrarToast("Configuração atualizada.");
}
async function removerTipoDemandaConfig(id){
  if(!confirm("Remover este tipo de demanda? Demandas já criadas com esse tipo não serão alteradas.")) return;
  const { error } = await sb.from("demandas_tipos_config").delete().eq("id", id);
  if(error){ alert("Erro ao remover: "+error.message); return; }
  DEMANDAS_TIPOS_CONFIG = DEMANDAS_TIPOS_CONFIG.filter(t=>t.id!==id);
  renderTiposDemandaConfig();
}

/* ---- Gestão do Checklist de Inspeção (Parte 1: grupos + itens) ---- */
function renderGruposChecklist(){
  const wrap = document.getElementById("lista-grupos-checklist");
  if(!wrap) return;
  const grupos = CHECKLIST_GRUPOS.slice().sort((a,b)=>a.ordem-b.ordem);
  wrap.innerHTML = grupos.length ? grupos.map(g=>{
    const qtdItens = CHECKLIST_ITENS_CONFIG.filter(i=>i.grupoId===g.id).length;
    return `<div class="admin-item-row">
      <span class="txt">${g.nome} <span class="sub">(${qtdItens} item(ns))</span></span>
      <button type="button" class="del-btn" onclick="removerGrupoChecklist(${g.id})">Remover</button>
    </div>`;
  }).join("") : '<span class="estrutura-vazio">Nenhum grupo cadastrado.</span>';
  const selNovoItem = document.getElementById("novo-item-checklist-grupo");
  if(selNovoItem) selNovoItem.innerHTML = grupos.map(g=>`<option value="${g.id}">${g.nome}</option>`).join("") || '<option value="">Cadastre um grupo primeiro</option>';
}
async function addGrupoChecklist(){
  const input = document.getElementById("novo-grupo-checklist-nome");
  const nome = input.value.trim();
  if(!nome) return;
  const ordem = CHECKLIST_GRUPOS.length ? Math.max(...CHECKLIST_GRUPOS.map(g=>g.ordem))+1 : 1;
  const { data, error } = await sb.from("checklist_grupos").insert({nome, ordem}).select().single();
  if(error){ alert("Erro ao adicionar grupo: "+error.message); return; }
  CHECKLIST_GRUPOS.push({id:data.id, nome:data.nome, ordem:data.ordem});
  input.value = "";
  renderGruposChecklist();
  renderItensChecklistConfig();
  mostrarToast("Grupo adicionado.");
}
async function removerGrupoChecklist(id){
  const qtd = CHECKLIST_ITENS_CONFIG.filter(i=>i.grupoId===id).length;
  if(!confirm(qtd ? `Remover este grupo e seus ${qtd} item(ns)?` : "Remover este grupo?")) return;
  const { error } = await sb.from("checklist_grupos").delete().eq("id", id);
  if(error){ alert("Erro ao remover: "+error.message); return; }
  CHECKLIST_GRUPOS = CHECKLIST_GRUPOS.filter(g=>g.id!==id);
  CHECKLIST_ITENS_CONFIG = CHECKLIST_ITENS_CONFIG.filter(i=>i.grupoId!==id);
  renderGruposChecklist();
  renderItensChecklistConfig();
}
function renderItensChecklistConfig(){
  const tbody = document.getElementById("tbl-itens-checklist-config");
  if(!tbody) return;
  if(!CHECKLIST_ITENS_CONFIG.length){
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--areia-esc); padding:16px;">Nenhum item cadastrado.</td></tr>';
    return;
  }
  const grupos = CHECKLIST_GRUPOS.slice().sort((a,b)=>a.ordem-b.ordem);
  const itens = CHECKLIST_ITENS_CONFIG.slice().sort((a,b)=>a.ordem-b.ordem);
  tbody.innerHTML = itens.map(i=>{
    const opcoesGrupo = grupos.map(g=>`<option value="${g.id}" ${g.id===i.grupoId?"selected":""}>${g.nome}</option>`).join("");
    return `<tr>
      <td><select onchange="atualizarItemChecklistConfig(${i.id}, 'grupo_id', this.value)">${opcoesGrupo}</select></td>
      <td>${i.titulo}</td>
      <td style="max-width:280px;">${i.descricao||"—"}</td>
      <td style="text-align:center;"><input type="checkbox" ${i.requerEvidencia?"checked":""} onchange="atualizarItemChecklistConfig(${i.id}, 'requer_evidencia', this.checked)"></td>
      <td><button type="button" class="small-btn danger" onclick="removerItemChecklist(${i.id})">Remover</button></td>
    </tr>`;
  }).join("");
}
async function addItemChecklist(){
  const grupoId = Number(document.getElementById("novo-item-checklist-grupo").value);
  const titulo = document.getElementById("novo-item-checklist-titulo").value.trim();
  const descricao = document.getElementById("novo-item-checklist-desc").value.trim();
  const requerEvidencia = document.getElementById("novo-item-checklist-evidencia").checked;
  if(!grupoId){ alert("Cadastre e selecione um grupo primeiro."); return; }
  if(!titulo){ alert("Informe o título do item."); return; }
  const itensDoGrupo = CHECKLIST_ITENS_CONFIG.filter(i=>i.grupoId===grupoId);
  const ordem = itensDoGrupo.length ? Math.max(...itensDoGrupo.map(i=>i.ordem))+1 : 1;
  const { data, error } = await sb.from("checklist_itens_config").insert({
    grupo_id: grupoId, titulo, descricao, ordem, requer_evidencia: requerEvidencia
  }).select().single();
  if(error){ alert("Erro ao adicionar item: "+error.message); return; }
  CHECKLIST_ITENS_CONFIG.push({id:data.id, grupoId:data.grupo_id, titulo:data.titulo, descricao:data.descricao||"", ordem:data.ordem, requerEvidencia:!!data.requer_evidencia});
  document.getElementById("novo-item-checklist-titulo").value = "";
  document.getElementById("novo-item-checklist-desc").value = "";
  document.getElementById("novo-item-checklist-evidencia").checked = false;
  renderGruposChecklist();
  renderItensChecklistConfig();
  mostrarToast("Item adicionado.");
}
async function atualizarItemChecklistConfig(id, campo, valor){
  const item = CHECKLIST_ITENS_CONFIG.find(i=>i.id===id);
  if(!item) return;
  const payload = {};
  if(campo==="grupo_id"){ payload.grupo_id = Number(valor); item.grupoId = payload.grupo_id; }
  if(campo==="requer_evidencia"){ payload.requer_evidencia = !!valor; item.requerEvidencia = !!valor; }
  const { error } = await sb.from("checklist_itens_config").update(payload).eq("id", id);
  if(error){ alert("Erro ao atualizar: "+error.message); return; }
  mostrarToast("Item atualizado.");
  renderGruposChecklist();
}
async function removerItemChecklist(id){
  if(!confirm("Remover este item do checklist?")) return;
  const { error } = await sb.from("checklist_itens_config").delete().eq("id", id);
  if(error){ alert("Erro ao remover: "+error.message); return; }
  CHECKLIST_ITENS_CONFIG = CHECKLIST_ITENS_CONFIG.filter(i=>i.id!==id);
  renderGruposChecklist();
  renderItensChecklistConfig();
}

/* ---- Gestão dos motivos de visita da Agenda ---- */
function renderMotivosAgendaGestao(){
  const wrap = document.getElementById("lista-motivos-agenda");
  if(!wrap) return;
  const lista = AGENDA_MOTIVOS.slice().sort((a,b)=>a.ordem-b.ordem);
  wrap.innerHTML = lista.length ? lista.map(m=>`
    <div class="admin-item-row">
      <span class="txt">${escHtml(m.valor)}</span>
      <button type="button" class="del-btn" onclick="removerMotivoAgenda(${m.id})">Remover</button>
    </div>`).join("") : '<span class="estrutura-vazio">Nenhum motivo cadastrado.</span>';
}
async function addMotivoAgenda(){
  const input = document.getElementById("novo-motivo-agenda");
  const valor = input.value.trim();
  if(!valor) return;
  if(AGENDA_MOTIVOS.some(m=>m.valor.toLowerCase()===valor.toLowerCase())){ mostrarToast("Esse motivo já está cadastrado."); return; }
  const ordem = AGENDA_MOTIVOS.length ? Math.max(...AGENDA_MOTIVOS.map(m=>m.ordem))+1 : 1;
  const { data, error } = await sb.from("agenda_motivos").insert({valor, ordem}).select().single();
  if(error){ alert("Erro ao adicionar: "+error.message); return; }
  AGENDA_MOTIVOS.push({id:data.id, valor:data.valor, ordem:data.ordem});
  input.value = "";
  renderMotivosAgendaGestao();
  popularMotivosAgenda();
  mostrarToast("Motivo de visita adicionado.");
}
async function removerMotivoAgenda(id){
  if(!confirm("Remover este motivo da lista? As visitas já lançadas não são alteradas.")) return;
  const { error } = await sb.from("agenda_motivos").delete().eq("id", id);
  if(error){ alert("Erro ao remover: "+error.message); return; }
  AGENDA_MOTIVOS = AGENDA_MOTIVOS.filter(m=>m.id!==id);
  renderMotivosAgendaGestao();
  popularMotivosAgenda();
}

/* ---- Gestão dos Tipos de Ocorrência (Parte 3) ---- */
function renderTiposOcorrenciaGestao(){
  const wrap = document.getElementById("lista-tipos-ocorrencia");
  if(!wrap) return;
  const tipos = OCORRENCIAS_TIPOS.slice().sort((a,b)=>a.ordem-b.ordem);
  wrap.innerHTML = tipos.length ? tipos.map(t=>`
    <div class="admin-item-row">
      <span class="txt">${t.valor}</span>
      <button type="button" class="del-btn" onclick="removerTipoOcorrencia(${t.id})">Remover</button>
    </div>
  `).join("") : '<span class="estrutura-vazio">Nenhum tipo cadastrado.</span>';
}
async function addTipoOcorrencia(){
  const input = document.getElementById("novo-tipo-ocorrencia");
  const valor = input.value.trim();
  if(!valor) return;
  if(OCORRENCIAS_TIPOS.some(t=>t.valor.toLowerCase()===valor.toLowerCase())){ mostrarToast("Esse tipo já está cadastrado."); return; }
  const ordem = OCORRENCIAS_TIPOS.length ? Math.max(...OCORRENCIAS_TIPOS.map(t=>t.ordem))+1 : 1;
  const { data, error } = await sb.from("ocorrencias_tipos").insert({valor, ordem}).select().single();
  if(error){ alert("Erro ao adicionar: "+error.message); return; }
  OCORRENCIAS_TIPOS.push({id:data.id, valor:data.valor, ordem:data.ordem});
  input.value = "";
  renderTiposOcorrenciaGestao();
  mostrarToast("Tipo de ocorrência adicionado.");
}
async function removerTipoOcorrencia(id){
  if(!confirm("Remover este tipo de ocorrência?")) return;
  const { error } = await sb.from("ocorrencias_tipos").delete().eq("id", id);
  if(error){ alert("Erro ao remover: "+error.message); return; }
  OCORRENCIAS_TIPOS = OCORRENCIAS_TIPOS.filter(t=>t.id!==id);
  renderTiposOcorrenciaGestao();
}

async function criarFluxo(){
  const input = document.getElementById("novo-fluxo-nome");
  const nome = input.value.trim();
  if(!nome) return;
  const { data, error } = await sb.from("fluxos").insert({nome}).select().single();
  if(error){ alert("Erro ao criar fluxo: "+error.message); return; }
  FLUXOS.push({id:data.id, nome:data.nome, padrao:data.padrao});
  input.value = "";
  renderFluxosConfig();
  renderTiposDemandaConfig();
  popularFiltrosDemandas();
  mostrarToast("Fluxo criado. Adicione etapas a ele abaixo.");
}
async function removerFluxo(id){
  if(!confirm("Remover este fluxo e todas as suas etapas? Demandas nesse fluxo perderão a referência.")) return;
  const { error } = await sb.from("fluxos").delete().eq("id", id);
  if(error){ alert("Erro ao remover fluxo: "+error.message); return; }
  FLUXOS = FLUXOS.filter(f=>f.id!==id);
  FLUXO_ETAPAS = FLUXO_ETAPAS.filter(e=>e.fluxoId!==id);
  renderFluxosConfig();
  renderTiposDemandaConfig();
  popularFiltrosDemandas();
  renderVisaoAtivaDemandas();
}
async function addEtapaFluxo(fluxoId){
  const input = document.getElementById("nova-etapa-"+fluxoId);
  const nome = input.value.trim();
  if(!nome) return;
  const etapasDoFluxo = FLUXO_ETAPAS.filter(e=>e.fluxoId===fluxoId);
  const ordem = etapasDoFluxo.length ? Math.max(...etapasDoFluxo.map(e=>e.ordem))+1 : 1;
  const cores = ["#9f8167","#faa61a","#00733f","#00b262","#a15a33","#54412f","#24a076","#eb924a","#a35e8e","#f06650","#bd7cb5","#54be95"];
  const cor = cores[etapasDoFluxo.length % cores.length];
  const { data, error } = await sb.from("fluxo_etapas").insert({fluxo_id:fluxoId, nome, ordem, cor}).select().single();
  if(error){ alert("Erro ao adicionar etapa: "+error.message); return; }
  FLUXO_ETAPAS.push({id:data.id, fluxoId:data.fluxo_id, nome:data.nome, ordem:data.ordem, cor:data.cor});
  input.value = "";
  renderFluxosConfig();
  renderVisaoAtivaDemandas();
}
async function removerEtapaFluxo(etapaId){
  const temDemandas = DEMANDAS.some(d=>d.etapaId===etapaId);
  const msg = temDemandas ? "Existem demandas nessa etapa. Remover mesmo assim? Elas ficarão sem etapa definida." : "Remover esta etapa?";
  if(!confirm(msg)) return;
  const { error } = await sb.from("fluxo_etapas").delete().eq("id", etapaId);
  if(error){ alert("Erro ao remover etapa: "+error.message); return; }
  FLUXO_ETAPAS = FLUXO_ETAPAS.filter(e=>e.id!==etapaId);
  renderFluxosConfig();
  renderVisaoAtivaDemandas();
}
async function mudarCorEtapa(etapaId, cor){
  const e = FLUXO_ETAPAS.find(x=>x.id===etapaId);
  if(e) e.cor = cor;
  renderFluxosConfig();
  renderVisaoAtivaDemandas();
  const { error } = await sb.from("fluxo_etapas").update({cor}).eq("id", etapaId);
  if(error) console.error("[Supabase] cor etapa:", error);
}
async function moverEtapa(etapaId, direcao){
  const e = FLUXO_ETAPAS.find(x=>x.id===etapaId);
  if(!e) return;
  const doFluxo = FLUXO_ETAPAS.filter(x=>x.fluxoId===e.fluxoId).sort((a,b)=>a.ordem-b.ordem);
  const idx = doFluxo.findIndex(x=>x.id===etapaId);
  const alvoIdx = idx+direcao;
  if(alvoIdx<0 || alvoIdx>=doFluxo.length) return;
  const alvo = doFluxo[alvoIdx];
  const ordemTemp = e.ordem; e.ordem = alvo.ordem; alvo.ordem = ordemTemp;
  renderFluxosConfig();
  renderVisaoAtivaDemandas();
  await Promise.all([
    sb.from("fluxo_etapas").update({ordem:e.ordem}).eq("id", e.id),
    sb.from("fluxo_etapas").update({ordem:alvo.ordem}).eq("id", alvo.id)
  ]);
}
function renderFluxosConfig(){
  const wrap = document.getElementById("lista-fluxos-config");
  if(!wrap) return;
  if(!FLUXOS.length){ wrap.innerHTML = '<span class="estrutura-vazio">Nenhum fluxo cadastrado ainda.</span>'; return; }
  wrap.innerHTML = FLUXOS.map(f=>{
    const etapas = FLUXO_ETAPAS.filter(e=>e.fluxoId===f.id).sort((a,b)=>a.ordem-b.ordem);
    return `
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h3 style="margin:0;">${f.nome}${f.padrao ? ' <span class="tag-status concluido" style="font-size:9px;">Padrão</span>' : ''}</h3>
        ${!f.padrao ? `<button type="button" class="small-btn danger" onclick="removerFluxo(${f.id})">Remover fluxo</button>` : ''}
      </div>
      <div class="insp-add-item"><input type="text" id="nova-etapa-${f.id}" placeholder="ex.: Em revisão" onkeydown="if(event.key==='Enter'){event.preventDefault();addEtapaFluxo(${f.id});}"><button type="button" class="btn-secondary" onclick="addEtapaFluxo(${f.id})">+ Adicionar etapa</button></div>
      <div class="estrutura-lista">
        ${etapas.length ? etapas.map((e,idx)=>`
          <div class="admin-item-row">
            <input type="color" value="${e.cor}" onchange="mudarCorEtapa(${e.id}, this.value)" style="width:24px;height:24px;border:none;padding:0;border-radius:6px;flex:none;cursor:pointer;">
            <span class="txt">${e.nome}</span>
            <button type="button" class="del-btn" onclick="moverEtapa(${e.id}, -1)"${idx===0?' style="opacity:.3;"':''}>↑</button>
            <button type="button" class="del-btn" onclick="moverEtapa(${e.id}, 1)"${idx===etapas.length-1?' style="opacity:.3;"':''}>↓</button>
            <button type="button" class="del-btn" onclick="removerEtapaFluxo(${e.id})">Remover</button>
          </div>
        `).join("") : '<span class="estrutura-vazio">Nenhuma etapa cadastrada.</span>'}
      </div>
    </div>`;
  }).join("");
}

