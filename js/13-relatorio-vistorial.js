/* =====================================================================
   RELATÓRIO VISTORIAL — lista, checklist, inconformidades, ocorrências, plano de ação, assinatura e PDF
   ===================================================================== */
let VIST_REL = [], VIST_CFG = {tipos:[], riscos:[], gutItens:[], gutClasses:[]};
let VIST_ATUAL = null, VIST_TAB = "checklist", VIST_FILTRO = "todos", VIST_BUSCA = "";
let VIST_ACOES = [], VIST_ACOES_TS = 0, VIST_PDF = null, VIST_JAN = null, vistSaveTimer = null, VIST_LOJAS = null;
const VIST_PRAZOS = [1,7,15,30];
const VIST_STATUS_INC = ["Notificado","Em andamento","Solucionado (a verificar)","Concluído","Não resolvido"];
const VIST_URL_PUBLICA = "https://caiojota.github.io/Platafroma-Lemon/";
const VIST_TOKEN_DIAS = 60;
const VIST_ICO = {
  inc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  oc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>',
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>'
};
const vN = n => String(n).padStart(4,"0");
const vNorm = s => String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/\s+/g," ").trim();
const vEsc = s => escHtml(String(s==null?"":s));
const vHoje = () => dataISOLocal(new Date());
/* ---------- códigos (C / I / O), aparelho, assinatura validada, indicadores ---------- */
const vCod = (o, n)=> (o||"I") + vN(n||0);
let VIST_ITENS = [], VIST_LCARDS = [], VIST_MODO = "rel", VIST_PUN = "", VIST_PAINEL = null, VIST_PFIL = "abertas";
function vistDeviceId(){
  try{
    let d = localStorage.getItem("vist_dev_id");
    if(!d){ d = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ("d"+Date.now().toString(36)+Math.random().toString(36).slice(2,10)); localStorage.setItem("vist_dev_id", d); }
    return d;
  }catch(e){ return "sem-armazenamento"; }
}
async function vSha(txt){
  try{
    if(window.crypto && crypto.subtle){
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(txt)));
      return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
    }
  }catch(e){}
  let h1 = 0x811c9dc5, h2 = 0x1b873593; const s = String(txt);
  for(let i=0;i<s.length;i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1^c, 16777619)>>>0; h2 = Math.imul(h2+c, 2654435761)>>>0; }
  return ("f"+h1.toString(16).padStart(8,"0")+h2.toString(16).padStart(8,"0")).padEnd(64,"0");
}
async function vistMetaAparelho(){
  const n = navigator, s = screen || {};
  const fp = (await vSha(JSON.stringify([n.userAgent||"", n.platform||"", n.language||"", (s.width||0)+"x"+(s.height||0), n.hardwareConcurrency||0, n.maxTouchPoints||0]))).slice(0,16);
  return {id:vistDeviceId(), fp};
}
async function vistHashConteudo(r){
  const ck = (r.checklist||[]).map(g=>[g.grupo, g.itens.map(i=>[i.id, i.r||"", (i.t||"").trim(), (i.f||[]).length])]);
  const ii = (r.inc||[]).filter(x=>x.origem!=="C").map(x=>[x.id, x.tipo, x.local, x.risco_desvio, x.gut_classe, x.data_limite]);
  const oo = (r.oc||[]).map(x=>[x.id, x.tipo, x.descricao, x.colaborador_matricula||""]);
  return await vSha(JSON.stringify([r.id, r.codigo, ck, ii, oo]));
}
async function vistColetarAssinatura(quem, pessoa, img){
  const r = VIST_ATUAL;
  const geo = await capturarGeolocalizacaoObrigatoria();
  const aparelho = await vistMetaAparelho();
  const em = new Date().toISOString();
  const conteudo = await vistHashConteudo(r);
  const imgHash = await vSha(img);
  const hash = await vSha(JSON.stringify([r.codigo, quem, pessoa.nome, pessoa.doc, em, geo, aparelho.id, aparelho.fp, conteudo, imgHash]));
  return {quem, nome:pessoa.nome, doc:pessoa.doc||"", cargo:pessoa.cargo||"", em, geo, aparelho, conteudo, imgHash, hash};
}
async function vistAssinaturasValidas(r){
  const atual = await vistHashConteudo(r);
  const t = !!(r.assinaturaImg && r.assinaturaMeta && r.assinaturaMeta.conteudo===atual);
  const l = !!(r.assinaturaLoja && r.assinaturaLoja.img && r.assinaturaLoja.conteudo===atual);
  const feitoT = !!(r.assinaturaImg && r.assinaturaMeta), feitoL = !!(r.assinaturaLoja && r.assinaturaLoja.img);
  return {t, l, feitoT, feitoL, atual, ok:t&&l};
}
function vistContarCheck(r){
  const c = {C:0, CA:0, NC:0, t:0};
  (r.checklist||[]).forEach(g=>g.itens.forEach(i=>{ if(i.r){ c[i.r]++; c.t++; } }));
  return c;
}
const vistConf = c => { const t = c.C+c.CA+c.NC; return t ? Math.round(c.C/t*100) : 0; };
function vistHistConf(r, ck){
  const l = ((r.painel&&r.painel.relatorios)||[]).filter(x=>x.id!==r.id).map(x=>{ const t = (x.c||0)+(x.ca||0)+(x.nc||0); return {id:x.id, data:x.data, pct:t?Math.round(x.c/t*100):null}; }).filter(x=>x.pct!==null);
  l.push({id:r.id, data:r.data, pct:vistConf(ck)});
  l.sort((a,b)=>String(a.data).localeCompare(String(b.data)) || a.id-b.id);
  return l.slice(-8);
}
function vistDonutSvg(c, ca, nc, size){
  const t = c+ca+nc, R = 40, C = 2*Math.PI*R; let off = 0;
  const seg = (v,col)=>{ if(!v||!t) return ""; const len = v/t*C; const s = `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${col}" stroke-width="16" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 50 50)"/>`; off += len; return s; };
  const pct = t ? Math.round(c/t*100) : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" font-family="Arial,sans-serif"><circle cx="50" cy="50" r="${R}" fill="none" stroke="#e7e1d6" stroke-width="16"/>${seg(c,"#16a34a")}${seg(ca,"#f59e0b")}${seg(nc,"#dc2626")}<text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="800" fill="#1a1a1a">${t?pct+"%":"—"}</text></svg>`;
}
function vistTendenciaSvg(h, w, hh){
  const W = 360, H = 130, pl = 28, pb = 22, pt = 12, pr = 6, n = Math.max(h.length,1), gap = (W-pl-pr)/n, bw = Math.min(34, gap*.62);
  const dim = hh ? `width="${w}" height="${hh}"` : `width="${w}" style="height:auto"`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ${dim} font-family="Arial,sans-serif">`;
  [0,50,100].forEach(v=>{ const y = pt+(H-pt-pb)*(1-v/100); s += `<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="#d9d2c3" stroke-width=".8" ${v?'stroke-dasharray="3 3"':""}/><text x="${pl-4}" y="${y+3}" font-size="9" text-anchor="end" fill="#6b5a45">${v}%</text>`; });
  h.forEach((p,i)=>{
    const x = pl+gap*i+(gap-bw)/2, bh = (H-pt-pb)*p.pct/100, y = H-pb-bh, cor = p.pct>=90?"#16a34a":p.pct>=70?"#f59e0b":"#dc2626";
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(bh,1).toFixed(1)}" rx="2" fill="${cor}"/><text x="${(x+bw/2).toFixed(1)}" y="${(y-3).toFixed(1)}" font-size="10" font-weight="700" text-anchor="middle" fill="#1a1a1a">${p.pct}%</text><text x="${(x+bw/2).toFixed(1)}" y="${H-8}" font-size="9" text-anchor="middle" fill="#555">${vEsc(String(p.data).slice(8,10)+"/"+String(p.data).slice(5,7))}</text>`;
  });
  return s + "</svg>";
}
function vistLegenda(c, ca, nc){
  return `<div class="vt-leg"><span><i style="background:#16a34a"></i>Conforme (C): <b>${c}</b></span><span><i style="background:#f59e0b"></i>C/ advertência (C/A): <b>${ca}</b></span><span><i style="background:#dc2626"></i>Não conforme (N/C): <b>${nc}</b></span></div>`;
}
function vistMetaResumo(m){
  if(!m) return "";
  const g = m.geo ? `${Number(m.geo.lat).toFixed(5)}, ${Number(m.geo.lng).toFixed(5)} (±${m.geo.precisao}m)` : "—";
  const mapa = m.geo ? `https://www.google.com/maps?q=${m.geo.lat},${m.geo.lng}` : "";
  return `<div class="vt-meta">🕒 ${vDataHora(m.em)}<br>📍 ${mapa?`<a href="${mapa}" target="_blank" rel="noopener">${g}</a>`:g}<br>📱 ID do aparelho <span class="mono">${vEsc((m.aparelho&&m.aparelho.id||"").slice(0,13))}</span><br>🔐 <span class="mono">${vEsc((m.hash||"").slice(0,24))}…</span></div>`;
}

function vAddDias(iso, n){ const d = new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return dataISOLocal(d); }
function vDataHora(iso){ if(!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("pt-BR")+" às "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }
function vPodeVerTodos(){ return ehAdminOuCoordenador(); }

/* ---------- carga de dados ---------- */
async function vistCarregarConfig(){
  const [a,b,c,d] = await Promise.all([
    sb.from("vist_tipos_inconformidade").select("*").order("ordem").order("id"),
    sb.from("vist_riscos").select("*").order("ordem").order("id"),
    sb.from("vist_gut_itens").select("*").order("valor",{ascending:false}),
    sb.from("vist_gut_classes").select("*").order("min_score",{ascending:false})
  ]);
  VIST_CFG.tipos = a.data||[]; VIST_CFG.riscos = b.data||[]; VIST_CFG.gutItens = c.data||[]; VIST_CFG.gutClasses = d.data||[];
}
function vistMapRel(r){
  return {id:r.id, unidade:r.unidade, data:r.data, tecnicoId:r.tecnico_id, tecnicoNome:r.tecnico_nome||"", registro:r.tecnico_registro||"", cargo:r.tecnico_cargo||"",
    agendaId:r.agenda_id, status:r.status, checklist:r.checklist||[], geoInicio:r.geo_inicio||null, assinaturaNome:r.assinatura_nome||"", assinaturaImg:r.assinatura_img||null, assinaturaMeta:r.assinatura_meta||null, assinaturaLoja:r.assinatura_loja||null,
    autenticidade:r.autenticidade||"", confC:r.n_c||0, confCA:r.n_ca||0, confNC:r.n_nc||0,
    numero:r.numero||null, codigo:r.codigo||"", token:r.token||"", tokenExpira:r.token_expira||null, assinadoEm:r.assinado_em||null,
    finalizadoEm:r.finalizado_em||null, criadoEm:r.created_at, itensTotal:r.itens_total||0, itensResp:r.itens_resp||0, nInc:0, nOc:0, nNC:0};
}
async function vistCarregarLista(){
  const cols = "id,numero,codigo,unidade,data,tecnico_id,tecnico_nome,agenda_id,status,itens_total,itens_resp,finalizado_em,created_at,assinado_em,n_c,n_ca,n_nc";
  const [r, i, o] = await Promise.all([
    sb.from("vist_relatorios").select(cols).order("created_at",{ascending:false}).limit(400),
    sb.from("vist_inconformidades").select("id,relatorio_id,unidade,status,origem,data_limite").limit(5000),
    sb.from("vist_ocorrencias").select("id,relatorio_id").limit(5000)
  ]);
  if(r.error){ console.error("[vist]", r.error); mostrarToast("Não foi possível carregar os relatórios."); return; }
  VIST_REL = (r.data||[]).map(vistMapRel);
  VIST_ITENS = i.data||[];
  const porId = {}; VIST_REL.forEach(x=>porId[x.id]=x);
  VIST_ITENS.forEach(x=>{ if(porId[x.relatorio_id] && x.origem!=="C"){ porId[x.relatorio_id].nInc++; if(x.status!=="Concluído") porId[x.relatorio_id].nAbertas = (porId[x.relatorio_id].nAbertas||0)+1; } });
  (o.data||[]).forEach(x=>{ if(porId[x.relatorio_id]) porId[x.relatorio_id].nOc++; });
}

/* ---------- visita ativa (check-in feito, check-out pendente) ---------- */
function vistVisitasAtivas(){
  if(!currentUser) return [];
  const h = vHoje();
  return AGENDA.filter(v=>v.usuarioId===currentUser.id && v.data===h && v.status==="Aprovado" && v.checkin && !v.checkout);
}

/* ---------- tela inicial: lista ---------- */
async function initInspecoes(){
  vistGarantirDom();
  if(!VIST_CFG.tipos.length && !VIST_CFG.gutItens.length) await vistCarregarConfig();
  await vistCarregarLista();
  vistRenderLista();
}
function vistFiltro(f){ VIST_FILTRO = f; vistRenderLista(); }
function vistBuscar(v){ VIST_BUSCA = v; vistRenderLista(true); }
function vistCardRel(r){
  const fin = r.status==="Finalizado";
  const pct = r.itensTotal ? Math.round(r.itensResp/r.itensTotal*100) : 0;
  return `<div class="vt-card ${fin?"fin":"rasc"}" onclick="vistAbrir(${r.id})">
    <div class="vt-card-topo"><div><div class="vt-card-un">${r.codigo?`<b style="color:var(--verde-esc);letter-spacing:.4px">${vEsc(r.codigo)}</b>`:vEsc(r.unidade)}</div><div class="vt-card-sub">${formatarDataBR(r.data)}${vPodeVerTodos() ? " · "+vEsc(r.tecnicoNome) : ""}</div></div>
      <span class="vt-pill ${fin?"fin":"rasc"}">${fin?"Finalizado":"Não finalizado"}</span></div>
    <div class="vt-metr"><span>${r.itensResp}/${r.itensTotal} itens</span><span class="${r.nInc?"alerta":""}">${r.nInc} inconformidade${r.nInc===1?"":"s"}</span><span>${r.nOc} ocorrência${r.nOc===1?"":"s"}</span></div>
    ${fin ? "" : `<div class="vt-prog"><i style="width:${pct}%"></i></div>`}
  </div>`;
}
function vistLojasResumo(){
  const hoje = vHoje(), m = {};
  VIST_REL.forEach(r=>{ const o = m[r.unidade] || (m[r.unidade] = {unidade:r.unidade, n:0, rasc:0, ult:null, conf:null}); o.n++; if(r.status!=="Finalizado") o.rasc++;
    if(r.status==="Finalizado" && (!o.ult || String(r.data)>=String(o.ult))){ o.ult = r.data; const t = r.confC+r.confCA+r.confNC; o.conf = t ? Math.round(r.confC/t*100) : null; } });
  Object.values(m).forEach(o=>{ const it = VIST_ITENS.filter(x=>x.unidade===o.unidade && x.status!=="Concluído"); o.abertas = it.length; o.venc = it.filter(x=>x.data_limite && x.data_limite<hoje).length; });
  return Object.values(m).sort((a,b)=>a.unidade.localeCompare(b.unidade,"pt-BR"));
}
function vistAbrirLoja(i){ VIST_PUN = VIST_LCARDS[i].unidade; VIST_PAINEL = null; VIST_FILTRO = "todos"; vistRenderLista(); window.scrollTo(0,0); }
function vistVoltarLojas(){ VIST_PUN = ""; VIST_PAINEL = null; vistRenderLista(); }
function vistNovoLoja(){ vistNovo(VIST_PUN); }
function vistRenderLista(manterFoco){
  const wrap = document.getElementById("vt-lista"); if(!wrap) return;
  const ck = document.getElementById("vt-aviso-ck");
  if(ck){
    if(vistBloqueioCheckin()){ ck.style.display = "block"; ck.textContent = "Você tem uma visita hoje: faça o check-in dela (página Início) para iniciar um relatório vistorial."; }
    else ck.style.display = "none";
  }
  const painelEl = document.getElementById("vt-painel"), busca = document.querySelector("#view-inspecoes .vt-busca"), chips = document.getElementById("vt-chips");
  document.querySelectorAll("#vt-chips .vt-chip").forEach(c=>c.classList.toggle("on", c.dataset.f===VIST_FILTRO));
  if(VIST_PUN){
    wrap.style.display = "none"; if(busca) busca.style.display = "none"; if(chips) chips.style.display = "flex"; painelEl.style.display = "block";
    vistRenderPainel(); return;
  }
  painelEl.style.display = "none"; wrap.style.display = ""; if(busca) busca.style.display = ""; if(chips) chips.style.display = "none";
  const q = vNorm(VIST_BUSCA);
  VIST_LCARDS = vistLojasResumo().filter(o=>!q || vNorm(o.unidade).includes(q));
  if(!VIST_LCARDS.length){
    wrap.innerHTML = `<div class="vt-vazio"><b>${VIST_REL.length ? "Nenhuma loja encontrada" : "Nenhum relatório ainda"}</b>${VIST_REL.length ? "Ajuste a busca." : "Toque no botão <b style='display:inline;font-size:inherit'>+</b> no canto superior para iniciar o primeiro relatório vistorial. A loja ganha um card automaticamente."}</div>`;
    return;
  }
  wrap.innerHTML = VIST_LCARDS.map((o,i)=>`<div class="vt-loja" onclick="vistAbrirLoja(${i})">
    <div class="vt-loja-t"><b>${vEsc(o.unidade)}</b><small>${o.n} relatório${o.n===1?"":"s"}${o.rasc?" · "+o.rasc+" em andamento":""}${o.ult?" · último "+formatarDataBR(o.ult):""}</small></div>
    <div class="vt-loja-k"><div class="${o.conf===null?"":o.conf>=90?"ok":o.conf>=70?"md":"al"}"><b>${o.conf===null?"—":o.conf+"%"}</b><span>Conformidade</span></div><div class="${o.abertas?"al":""}"><b>${o.abertas}</b><span>Em aberto</span></div><div class="${o.venc?"al":""}"><b>${o.venc}</b><span>Vencidos</span></div></div></div>`).join("");
}

/* ---------- código do relatório: 3 letras da unidade + nº (0001) + ano + iniciais do técnico + mês ---------- */
function vistIniciais(nome){
  const p = vNorm(nome).split(" ").filter(w=>w && !["DE","DA","DO","DAS","DOS","E"].includes(w));
  if(!p.length) return "XX";
  return (p[0][0] + (p.length>1 ? p[p.length-1][0] : "")).replace(/[^A-Z]/g,"");
}
function vistCodigo(unidade, numero, data, tecnico){
  const letras = vNorm(unidade).replace(/[^A-Z]/g,"").slice(0,3).padEnd(3,"X");
  return letras + vN(numero) + String(data).slice(0,4) + vistIniciais(tecnico) + String(data).slice(5,7);
}

/* ---------- novo relatório ---------- */
function vistVisitasHoje(){
  if(!currentUser) return [];
  const h = vHoje();
  return AGENDA.filter(v=>v.usuarioId===currentUser.id && v.data===h && v.status==="Aprovado" && !calEhLocalTrabalho(v.unidade));
}
// só bloqueia quando há visita aprovada hoje (fora local de trabalho) sem check-in feito
function vistBloqueioCheckin(){
  const vis = vistVisitasHoje().filter(v=>!v.checkout);
  if(!vis.length) return false;
  return !vis.some(v=>v.checkin);
}
async function vistNovo(un){
  if(vistBloqueioCheckin()){ alert("Você tem uma visita agendada para hoje. Faça o check-in dela (página Início) para iniciar o relatório vistorial."); return; }
  const ativas = vistVisitasAtivas();
  for(const v of ativas){
    const ex = VIST_REL.find(r=>r.agendaId===v.id && r.status!=="Finalizado");
    if(ex){ mostrarToast("Você já tem um relatório não finalizado desta visita."); return vistAbrir(ex.id); }
  }
  if(typeof un==="string" && un){ const va = ativas.find(x=>x.unidade===un && !VIST_REL.some(r=>r.agendaId===x.id)); return vistCriarRelatorio(un, va?va.id:null, (va&&va.checkin&&va.checkin.geo)||null); }
  const v = ativas.find(x=>!VIST_REL.some(r=>r.agendaId===x.id));
  if(v) return vistCriarRelatorio(v.unidade, v.id, (v.checkin&&v.checkin.geo)||null);
  // sem visita com check-in pendente (sem visita no dia, local de trabalho ou visita já concluída): escolhe a unidade
  const unids = (UNIDADES||[]).map(u=>u.nome).filter(Boolean).sort((x,y)=>x.localeCompare(y,"pt-BR"));
  const corpo = `<div class="vt-campo"><label class="rot">Unidade a vistoriar</label><select id="vn-un"><option value="">Selecione...</option>${unids.map(n=>`<option>${vEsc(n)}</option>`).join("")}</select></div>`;
  const rod = `<button type="button" class="vt-btn-x" onclick="vistFecharJanela('vt-jan-nova')" aria-label="Cancelar">×</button><button type="button" class="vt-btn-check" onclick="vistConfirmarNova()">${VIST_ICO.check} INICIAR</button>`;
  vistJanela("vt-jan-nova","#00733f",VIST_ICO.check,"Novo relatório vistorial","Sem check-in pendente: escolha a unidade",corpo,rod);
}
function vistConfirmarNova(){
  const un = document.getElementById("vn-un").value; if(!un){ alert("Escolha a unidade."); return; }
  vistFecharJanela("vt-jan-nova"); vistCriarRelatorio(un, null, null);
}
async function vistCriarRelatorio(unidade, agendaId, geo){
  if(!CHECKLIST_GRUPOS.length || !CHECKLIST_ITENS_CONFIG.length){ if(!confirm("O checklist ainda não tem itens cadastrados (Gestão › Relatório Vistorial). Iniciar mesmo assim?")) return; }
  const checklist = CHECKLIST_GRUPOS.slice().sort((a,b)=>a.ordem-b.ordem).map(g=>({
    grupo:g.nome,
    itens:CHECKLIST_ITENS_CONFIG.filter(i=>i.grupoId===g.id).sort((a,b)=>a.ordem-b.ordem).map(i=>({id:i.id, titulo:i.titulo, descricao:i.descricao||"", ev:!!i.requerEvidencia, r:null, t:"", f:[]}))
  })).filter(g=>g.itens.length);
  const total = checklist.reduce((s,g)=>s+g.itens.length,0);
  const dataRel = vHoje();
  const linha = {unidade, data:dataRel, tecnico_id:currentUser.id, tecnico_nome:currentUser.nome, tecnico_registro:currentUser.registro||"", tecnico_cargo:currentUser.cargo||"",
    agenda_id:agendaId, status:"Rascunho", checklist, geo_inicio:geo, itens_total:total, itens_resp:0};
  let data, error;
  for(let t=0; t<6; t++){
    const { data: n } = await sb.rpc("vist_proximo_numero_rel", {p_unidade:unidade});
    linha.numero = n || 1; linha.codigo = vistCodigo(unidade, linha.numero, dataRel, currentUser.nome);
    const res = await sb.from("vist_relatorios").insert(linha).select().single(); data = res.data; error = res.error;
    if(!error || error.code!=="23505") break;
  }
  if(error){ alert("Não foi possível criar o relatório: "+error.message); return; }
  VIST_REL.unshift(vistMapRel(data));
  vistRenderLista();
  vistAbrir(data.id);
}

/* ---------- abrir / fechar o editor ---------- */
function vistGarantirDom(){
  if(document.getElementById("vt-editor")) return;
  const d = document.createElement("div");
  d.innerHTML = `
  <div class="vt-tela" id="vt-editor">
    <div class="vt-eh"><button type="button" class="vt-eh-voltar" onclick="vistFecharEditor()" aria-label="Voltar">←</button>
      <div class="vt-eh-tit"><b id="vt-eh-un"></b><small id="vt-eh-sub"></small></div><span class="vt-salvo" id="vt-salvo"></span></div>
    <div class="vt-tabs" id="vt-tabs"></div>
    <div class="vt-corpo" id="vt-corpo"><div class="vt-corpo-in" id="vt-corpo-in"></div></div>
    <div class="vt-fabs" id="vt-fabs">
      <button type="button" class="vt-fab oc" onclick="vistAbrirOc()" aria-label="Nova ocorrência" title="Nova ocorrência">${VIST_ICO.oc}<span class="n" id="vt-fab-n-oc">0</span></button>
      <button type="button" class="vt-fab inc" onclick="vistAbrirInc()" aria-label="Nova inconformidade" title="Nova inconformidade">${VIST_ICO.inc}<span class="n" id="vt-fab-n-inc">0</span></button>
    </div>
  </div>
  <div class="vt-tela" id="vt-previa" style="z-index:780;">
    <div class="vt-eh"><button type="button" class="vt-eh-voltar" onclick="vistFecharPrevia()" aria-label="Voltar">←</button>
      <div class="vt-eh-tit"><b>Pré-visualização do relatório</b><small id="vt-prev-sub"></small></div></div>
    <div class="vt-prev-corpo" id="vt-prev-corpo"></div>
    <div class="vt-prev-barra"><button type="button" class="v" onclick="vistFecharPrevia()">← Voltar e editar</button><button type="button" class="f" id="vt-prev-fin" onclick="vistFinalizar()">Finalizar e gerar PDF</button></div>
  </div>`;
  while(d.firstChild) document.body.appendChild(d.firstChild);
}
async function vistAbrir(id){
  vistGarantirDom();
  mostrarToast("Abrindo relatório...");
  const [r, i, o, a] = await Promise.all([
    sb.from("vist_relatorios").select("*").eq("id",id).single(),
    sb.from("vist_inconformidades").select("*").eq("relatorio_id",id).order("origem").order("numero"),
    sb.from("vist_ocorrencias").select("*").eq("relatorio_id",id).order("id"),
    sb.from("vist_acoes").select("*").eq("relatorio_id",id).order("data")
  ]);
  if(r.error || !r.data){ alert("Não foi possível abrir o relatório."); return; }
  const rel = vistMapRel(r.data);
  rel.inc = i.data||[]; rel.oc = o.data||[]; rel.acoes = a.data||[];
  const [pr, pn] = await Promise.all([
    sb.rpc("vist_pendencias_unidade", {p_unidade:rel.unidade, p_rel:id}),
    sb.rpc("vist_painel_unidade", {p_unidade:rel.unidade})
  ]);
  rel.pend = Array.isArray(pr.data) ? pr.data : [];
  rel.painel = (pn && pn.data) || {relatorios:[], achados:[], ocorrencias:[]};
  VIST_ATUAL = rel; VIST_TAB = rel.status==="Finalizado" ? "estrategica" : "checklist";
  document.getElementById("vt-editor").classList.add("aberta");
  document.getElementById("vt-corpo").scrollTop = 0;
  vistRenderEditor();
}
async function vistFecharEditor(){
  if(vistSaveTimer){ clearTimeout(vistSaveTimer); await vistSalvarAgora(); }
  document.getElementById("vt-editor").classList.remove("aberta");
  document.getElementById("vt-fabs").classList.remove("on");
  VIST_ATUAL = null; VIST_PAINEL = null;
  await vistCarregarLista(); vistRenderLista();
  if(typeof renderInicio==="function") try{ renderInicio(); }catch(e){}
}
function vistRO(){ return !!VIST_ATUAL && VIST_ATUAL.status==="Finalizado"; }
function vistContarResp(r){ let t=0, ok=0; (r.checklist||[]).forEach(g=>g.itens.forEach(i=>{ t++; if(i.r) ok++; })); return {t, ok}; }
function vistRenderEditor(){
  const r = VIST_ATUAL; if(!r) return;
  document.getElementById("vt-eh-un").textContent = r.unidade;
  document.getElementById("vt-eh-sub").textContent = (r.codigo?r.codigo+" · ":"")+formatarDataBR(r.data)+" · "+r.tecnicoNome+(vistRO()?" · Finalizado":"");
  const tabs = document.getElementById("vt-tabs");
  if(vistRO()){
    tabs.style.display = "none"; tabs.innerHTML = "";
    document.getElementById("vt-fabs").classList.remove("on");
    vistRenderEstrategica(); return;
  }
  tabs.style.display = "";
  const abas = [["checklist","Checklist"],["lanc","Lançamentos",r.inc.length+r.oc.length+vistPendNaoVerif(r)],["emitir","Assinar e emitir"]];
  tabs.innerHTML = abas.map(a=>`<button type="button" class="vt-tab ${VIST_TAB===a[0]?"on":""}" onclick="vistTab('${a[0]}')">${a[1]}${a[2]?`<span class="n">${a[2]}</span>`:""}</button>`).join("");
  document.getElementById("vt-fabs").classList.add("on");
  document.getElementById("vt-fab-n-inc").textContent = r.inc.length;
  document.getElementById("vt-fab-n-oc").textContent = r.oc.length;
  document.getElementById("vt-fab-n-inc").style.display = r.inc.length ? "flex" : "none";
  document.getElementById("vt-fab-n-oc").style.display = r.oc.length ? "flex" : "none";
  if(VIST_TAB==="checklist") vistRenderChecklist();
  else if(VIST_TAB==="lanc") vistRenderLanc();
  else vistRenderEmitir();
}
function vistTab(t){ VIST_TAB = t; vistRenderEditor(); document.getElementById("vt-corpo").scrollTop = 0; }
function vistStatusSave(t){ const e = document.getElementById("vt-salvo"); if(e) e.textContent = t; }

/* ---------- checklist ---------- */
function vistRenderChecklist(){
  const r = VIST_ATUAL, ro = vistRO();
  const el = document.getElementById("vt-corpo-in");
  if(!r.checklist.length){ el.innerHTML = '<div class="vt-vazio">Este relatório não tem itens de checklist.<br>Use os botões flutuantes para lançar inconformidades e ocorrências.</div>'; return; }
  el.innerHTML = r.checklist.map((g,gi)=>{
    const ok = g.itens.filter(i=>i.r).length;
    return `<div class="vt-grupo" id="vg-${gi}"><div class="vt-grupo-h" onclick="this.parentNode.classList.toggle('fechado')"><b>${vEsc(g.grupo)}</b><span id="vg-n-${gi}">${ok}/${g.itens.length}</span></div>
      <div class="vt-grupo-itens">${g.itens.map((it,ii)=>vistItemHtml(gi,ii,ro)).join("")}</div></div>`;
  }).join("");
}
function vistItemHtml(gi, ii, ro){
  const it = VIST_ATUAL.checklist[gi].itens[ii];
  const b = (k,l,cls)=>`<button type="button" class="vt-r ${cls} ${it.r===k?"on":""}" ${ro?"disabled":""} onclick="vistResp(${gi},${ii},'${k}')">${l}</button>`;
  const precisaTxt = it.r==="CA" || it.r==="NC";
  const fotos = (it.f||[]).map((f,fi)=>`<div class="vt-foto"><img src="${f}" alt="">${ro?"":`<button type="button" onclick="vistFotoDel(${gi},${ii},${fi})" aria-label="Remover foto">×</button>`}</div>`).join("");
  const evFalta = it.ev && precisaTxt && !(it.f||[]).length;
  return `<div class="vt-item" id="vi-${gi}-${ii}">
    <div class="vt-item-t">${vEsc(it.titulo)}</div>${it.descricao?`<div class="vt-item-d">${vEsc(it.descricao)}</div>`:""}
    <div class="vt-resp">${b("C","C","c")}${b("CA","C/A","ca")}${b("NC","N/C","nc")}</div>
    ${precisaTxt ? `<div class="vt-obs"><label>${it.r==="CA"?"Qual a advertência? (obrigatório)":"Qual a não conformidade? (obrigatório)"}</label>
      <textarea class="${(it.t||"").trim()?"":"falta"}" ${ro?"disabled":""} oninput="vistTxt(${gi},${ii},this)" placeholder="Descreva...">${vEsc(it.t||"")}</textarea></div>` : ""}
    <div class="vt-fotos">${fotos}${ro?"":`<button type="button" class="vt-addfoto" onclick="vistFotoAdd(${gi},${ii})" aria-label="Adicionar foto">${VIST_ICO.cam}<span>+ Foto</span></button>`}</div>
    ${evFalta ? '<div class="vt-ev-obrig">Este item exige foto de evidência.</div>' : (it.ev && !it.r ? '<div class="vt-ev-obrig" style="color:var(--areia-esc)">Item com evidência obrigatória se C/A ou N/C.</div>' : "")}
  </div>`;
}
function vistReItem(gi, ii){
  const el = document.getElementById("vi-"+gi+"-"+ii); if(!el) return;
  const tmp = document.createElement("div"); tmp.innerHTML = vistItemHtml(gi, ii, vistRO());
  el.replaceWith(tmp.firstElementChild);
  const g = VIST_ATUAL.checklist[gi]; const n = document.getElementById("vg-n-"+gi);
  if(n) n.textContent = g.itens.filter(i=>i.r).length+"/"+g.itens.length;
}
function vistResp(gi, ii, k){
  if(vistRO()) return;
  const it = VIST_ATUAL.checklist[gi].itens[ii];
  it.r = (it.r===k) ? null : k;
  if(it.r==="C"){ /* conforme não exige texto; mantém o que foi digitado */ }
  vistReItem(gi, ii); vistAgendarSalvar();
  if(it.r==="CA"||it.r==="NC"){ const ta = document.querySelector("#vi-"+gi+"-"+ii+" textarea"); if(ta && !ta.value) ta.focus(); }
}
function vistTxt(gi, ii, ta){
  const it = VIST_ATUAL.checklist[gi].itens[ii]; it.t = ta.value;
  ta.classList.toggle("falta", !ta.value.trim());
  vistAgendarSalvar();
}
function vistFotoAdd(gi, ii){
  vistEscolherFoto(url=>{ const it = VIST_ATUAL.checklist[gi].itens[ii]; (it.f = it.f||[]).push(url); vistReItem(gi, ii); vistAgendarSalvar(); });
}
function vistFotoDel(gi, ii, fi){ const it = VIST_ATUAL.checklist[gi].itens[ii]; it.f.splice(fi,1); vistReItem(gi, ii); vistAgendarSalvar(); }
function vistAgendarSalvar(){ vistStatusSave("Salvando…"); clearTimeout(vistSaveTimer); vistSaveTimer = setTimeout(vistSalvarAgora, 700); }
async function vistSalvarAgora(){
  vistSaveTimer = null;
  const r = VIST_ATUAL; if(!r || r.status==="Finalizado") return;
  const c = vistContarResp(r);
  const { error } = await sb.from("vist_relatorios").update({checklist:r.checklist, itens_total:c.t, itens_resp:c.ok, updated_at:new Date().toISOString()}).eq("id", r.id);
  vistStatusSave(error ? "Erro ao salvar" : "Salvo ✓");
  if(error) console.error("[vist] salvar:", error);
}

/* ---------- câmera / foto ---------- */
function vistComprimir(file, max=1000, q=.68){
  return new Promise((res, rej)=>{
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = ()=>{
      let w = img.naturalWidth, h = img.naturalHeight; const k = Math.min(1, max/Math.max(w,h)); w = Math.round(w*k); h = Math.round(h*k);
      const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", q));
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); rej(new Error("img")); };
    img.src = url;
  });
}
function vistEscolherFoto(cb){
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.setAttribute("capture","environment");
  inp.onchange = async ()=>{ const f = inp.files && inp.files[0]; if(!f) return; try{ cb(await vistComprimir(f)); }catch(e){ alert("Não foi possível ler a imagem."); } };
  inp.click();
}

/* ---------- classes GUT ---------- */
function vistClasse(score){
  const cl = VIST_CFG.gutClasses.slice().sort((a,b)=>b.min_score-a.min_score).find(c=>score>=c.min_score);
  return cl || {nome:"—", cor:"#000000", min_score:0};
}
function vistGutLabel(eixo, valor){ const it = VIST_CFG.gutItens.find(x=>x.eixo===eixo && x.valor===Number(valor)); return it ? it.rotulo : ""; }

/* ---------- janela flutuante genérica ---------- */
function vistJanela(id, cor, icone, titulo, sub, corpo, rodape, alta){
  vistFecharJanela(id);
  const bg = document.createElement("div"); bg.className = "vt-jan-bg"+(alta?" alta":""); bg.id = id;
  bg.innerHTML = `<div class="vt-jan" role="dialog" aria-modal="true"><div class="vt-jan-h"><span class="ic" style="background:${cor}">${icone}</span><div><b>${titulo}</b><small>${sub||""}</small></div></div>
    <div class="vt-jan-c" id="${id}-c">${corpo}</div><div class="vt-jan-f">${rodape}</div></div>`;
  document.body.appendChild(bg);
  return bg;
}
function vistFecharJanela(id){ const e = document.getElementById(id); if(e) e.remove(); }

/* ---------- INCONFORMIDADE ---------- */
async function vistAbrirInc(editId){
  const r = VIST_ATUAL; if(!r || vistRO()) return;
  let ed = editId ? r.inc.find(x=>x.id===editId) : null;
  let numero;
  if(ed) numero = ed.numero;
  else { const { data } = await sb.rpc("vist_proximo_numero2", {p_unidade:r.unidade, p_origem:"I"}); numero = data || 1; }
  VIST_JAN = {tipo:"inc", editId:ed?ed.id:null, numero, acoes:[], acoesRem:[],
    d: ed ? {tipo:ed.tipo||"", local:ed.local||"", risco:ed.risco_desvio||"", riscos:(ed.riscos_expostos||[]).slice(), prazo:ed.prazo_dias||"", foto:ed.foto||null, g:ed.gut_g||"", u:ed.gut_u||"", t:ed.gut_t||""}
          : {tipo:"", local:"", risco:"", riscos:[], prazo:"", foto:null, g:"", u:"", t:""}};
  if(ed) VIST_JAN.acoes = r.acoes.filter(a=>a.origem==="inconformidade" && a.origem_id===ed.id).map(a=>({...a, _salva:true}));
  const d = VIST_JAN.d;
  const optG = (eixo, sel)=>'<option value="">Selecione...</option>'+VIST_CFG.gutItens.filter(x=>x.eixo===eixo).sort((a,b)=>b.valor-a.valor).map(x=>`<option value="${x.valor}" ${Number(sel)===x.valor?"selected":""}>${x.valor} · ${vEsc(x.rotulo)}</option>`).join("");
  const corpo = `
    <div class="vt-g2"><div class="vt-campo"><label class="rot">Nº</label><div class="vt-ro num">${vN(numero)}</div></div>
      <div class="vt-campo"><label class="rot">Status</label><div class="vt-ro status">${ed?vEsc(ed.status):"NOTIFICADO"}</div></div></div>
    <div class="vt-campo"><label class="rot">Tipo</label><select id="vi-tipo" onchange="VIST_JAN.d.tipo=this.value">
      <option value="">Selecione...</option>${VIST_CFG.tipos.map(t=>`<option ${d.tipo===t.nome?"selected":""}>${vEsc(t.nome)}</option>`).join("")}</select></div>
    <div class="vt-campo"><label class="rot">Local</label><input type="text" id="vi-local" value="${vEsc(d.local)}" oninput="VIST_JAN.d.local=this.value" placeholder="Onde, dentro da unidade, foi encontrada?"></div>
    <div class="vt-campo"><label class="rot">Risco / desvio encontrado</label><textarea id="vi-risco" rows="3" oninput="VIST_JAN.d.risco=this.value" placeholder="Descreva o que foi encontrado...">${vEsc(d.risco)}</textarea></div>
    <div class="vt-campo"><label class="rot">Risco exposto</label>
      <button type="button" class="vt-multi-b" onclick="vistTogglePan()"><span id="vi-multi-t"></span><span>▾</span></button>
      <div class="vt-multi-pan" id="vi-multi-pan" style="display:none;">${VIST_CFG.riscos.map(x=>`<label><input type="checkbox" value="${vEsc(x.nome)}" ${d.riscos.includes(x.nome)?"checked":""} onchange="vistToggleRisco(this)"> ${vEsc(x.nome)}</label>`).join("")||'<label style="color:#999">Nenhum risco cadastrado (Gestão › Relatório Vistorial).</label>'}</div>
      <div class="vt-chips" id="vi-chips"></div></div>
    <div class="vt-g2"><div class="vt-campo"><label class="rot">Prazo para solução</label><select id="vi-prazo" onchange="VIST_JAN.d.prazo=this.value; vistAtualizaLimite()">
        <option value="">Selecione...</option>${VIST_PRAZOS.map(p=>`<option value="${p}" ${Number(d.prazo)===p?"selected":""}>${p} dia${p>1?"s":""}</option>`).join("")}</select></div>
      <div class="vt-campo"><label class="rot">Data limite</label><div class="vt-ro" id="vi-limite">—</div></div></div>
    <div class="vt-campo"><label class="rot">Evidência</label><div id="vi-foto"></div></div>
    <div class="vt-campo"><label class="rot">Indicador de priorização (matriz GUT)</label><div class="vt-gut">
      <div><label class="rot">Gravidade</label><select id="vi-g" onchange="VIST_JAN.d.g=this.value; vistAtualizaGut()">${optG("G",d.g)}</select></div>
      <div><label class="rot">Urgência</label><select id="vi-u" onchange="VIST_JAN.d.u=this.value; vistAtualizaGut()">${optG("U",d.u)}</select></div>
      <div><label class="rot">Tendência</label><select id="vi-t" onchange="VIST_JAN.d.t=this.value; vistAtualizaGut()">${optG("T",d.t)}</select></div>
      <div class="vt-gut-res" id="vi-gut-res"></div></div></div>
    <div class="vt-campo"><label class="rot">Plano de ação</label><div id="vi-acoes"></div><button type="button" class="vt-acao-add" onclick="vistAbrirAcao()">+ Adicionar plano de ação</button></div>`;
  const rod = `<button type="button" class="vt-btn-x" onclick="vistCancelarJan('vt-jan-inc')" aria-label="Cancelar">×</button><button type="button" class="vt-btn-check" id="vi-check" onclick="vistConfirmarInc()">${VIST_ICO.check} CHECK</button>`;
  vistJanela("vt-jan-inc","#d97706",VIST_ICO.inc, ed?"Editar inconformidade":"Nova inconformidade", vEsc(r.unidade)+" · "+formatarDataBR(r.data), corpo, rod);
  vistRenderChipsRisco(); vistAtualizaLimite(); vistRenderFotoInc(); vistAtualizaGut(); vistRenderAcoesJan();
}
function vistTogglePan(){ const p = document.getElementById("vi-multi-pan"); p.style.display = p.style.display==="none" ? "block" : "none"; }
function vistToggleRisco(cb){
  const a = VIST_JAN.d.riscos; const i = a.indexOf(cb.value);
  if(cb.checked && i<0) a.push(cb.value); if(!cb.checked && i>=0) a.splice(i,1);
  vistRenderChipsRisco();
}
function vistRenderChipsRisco(){
  const a = VIST_JAN.d.riscos;
  document.getElementById("vi-multi-t").textContent = a.length ? a.length+" selecionado"+(a.length>1?"s":"") : "Selecione os riscos expostos...";
  document.getElementById("vi-chips").innerHTML = a.map(x=>`<span>${vEsc(x)}</span>`).join("");
}
function vistAtualizaLimite(){
  const p = Number(VIST_JAN.d.prazo); const el = document.getElementById("vi-limite");
  el.textContent = p ? formatarDataBR(vAddDias(VIST_ATUAL.data, p)) : "—";
}
function vistRenderFotoInc(){
  const f = VIST_JAN.d.foto, el = document.getElementById("vi-foto");
  el.innerHTML = f ? `<div class="vt-fotos"><div class="vt-foto" style="width:110px;height:110px"><img src="${f}" alt=""><button type="button" onclick="VIST_JAN.d.foto=null; vistRenderFotoInc()" aria-label="Remover">×</button></div><button type="button" class="vt-addfoto" onclick="vistFotoInc()">${VIST_ICO.cam}<span>Trocar</span></button></div>`
    : `<button type="button" class="vt-addfoto largo" onclick="vistFotoInc()">${VIST_ICO.cam}<span>+ Evidência (tirar foto)</span></button>`;
}
function vistFotoInc(){ vistEscolherFoto(url=>{ VIST_JAN.d.foto = url; vistRenderFotoInc(); }); }
function vistAtualizaGut(){
  const d = VIST_JAN.d, el = document.getElementById("vi-gut-res");
  if(d.g && d.u && d.t){
    const sc = Number(d.g)*Number(d.u)*Number(d.t), cl = vistClasse(sc);
    el.innerHTML = `<span class="vt-gut-sc">${d.g} × ${d.u} × ${d.t} = ${sc}</span><span class="vt-gut-cl" style="background:${vEsc(cl.cor)}">${vEsc(cl.nome)}</span>`;
  } else el.innerHTML = '<span class="vt-gut-sc" style="font-weight:600;color:var(--areia-esc)">Selecione G, U e T para ver o resultado.</span>';
}
function vistRenderAcoesJan(){
  const el = document.getElementById("vi-acoes") || document.getElementById("vo-acoes"); if(!el) return;
  el.innerHTML = VIST_JAN.acoes.map((a,i)=>`<div class="vt-acao-l"><div><b>${formatarDataBR(a.data)}</b>${vEsc(a.descricao)}</div><button type="button" onclick="vistRemAcao(${i})" aria-label="Remover">×</button></div>`).join("");
}
function vistRemAcao(i){ const a = VIST_JAN.acoes[i]; if(a._salva) VIST_JAN.acoesRem.push(a); VIST_JAN.acoes.splice(i,1); vistRenderAcoesJan(); }
function vistCancelarJan(id){
  const d = VIST_JAN && VIST_JAN.d; const sujo = d && (d.local||d.risco||d.descricao||d.foto||(VIST_JAN.acoes||[]).length) && !VIST_JAN.editId;
  if(sujo && !confirm("Descartar este lançamento?")) return;
  VIST_JAN = null; vistFecharJanela(id);
}
async function vistConfirmarInc(){
  const r = VIST_ATUAL, d = VIST_JAN.d;
  const falta = [];
  if(!d.tipo) falta.push("Tipo"); if(!d.local.trim()) falta.push("Local"); if(!d.risco.trim()) falta.push("Risco / desvio encontrado");
  if(!d.riscos.length) falta.push("Risco exposto"); if(!d.prazo) falta.push("Prazo para solução"); if(!(d.g&&d.u&&d.t)) falta.push("Indicador de priorização (G, U e T)");
  if(falta.length){ alert("Preencha: "+falta.join(", ")+"."); return; }
  const btn = document.getElementById("vi-check"); btn.disabled = true;
  const sc = Number(d.g)*Number(d.u)*Number(d.t), cl = vistClasse(sc);
  const campos = {tipo:d.tipo, local:d.local.trim(), risco_desvio:d.risco.trim(), riscos_expostos:d.riscos, prazo_dias:Number(d.prazo), data_limite:vAddDias(r.data, Number(d.prazo)),
    gut_g:Number(d.g), gut_u:Number(d.u), gut_t:Number(d.t), gut_score:sc, gut_classe:cl.nome,
    gut_rotulos:{G:vistGutLabel("G",d.g), U:vistGutLabel("U",d.u), T:vistGutLabel("T",d.t), cor:cl.cor}, foto:d.foto};
  let linha, erro;
  if(VIST_JAN.editId){
    const res = await sb.from("vist_inconformidades").update(campos).eq("id", VIST_JAN.editId).select().single(); linha = res.data; erro = res.error;
    if(linha){ const i = r.inc.findIndex(x=>x.id===linha.id); r.inc[i] = linha; }
  } else {
    for(let t=0; t<6; t++){
      const { data: n } = await sb.rpc("vist_proximo_numero", {p_unidade:r.unidade});
      const res = await sb.from("vist_inconformidades").insert({...campos, relatorio_id:r.id, unidade:r.unidade, numero:n||1, status:"Notificado"}).select().single();
      linha = res.data; erro = res.error;
      if(!erro || (erro.code!=="23505")) break;
    }
    if(linha){ r.inc.push(linha); r.inc.sort((a,b)=>a.numero-b.numero); }
  }
  if(erro || !linha){ btn.disabled = false; alert("Não foi possível salvar a inconformidade: "+(erro&&erro.message||"")); return; }
  await vistPersistirAcoes("inconformidade", linha.id, "Inconformidade "+vCod("I",linha.numero));
  VIST_JAN = null; vistFecharJanela("vt-jan-inc");
  vistRenderEditor(); mostrarToast("Inconformidade "+vCod("I",linha.numero)+" adicionada.");
}

/* ---------- PLANO DE AÇÃO ---------- */
function vistAbrirAcao(){
  const corpo = `<div class="vt-campo"><label class="rot">Descrição da ação</label><textarea id="va-desc" rows="4" placeholder="O que precisa ser feito?"></textarea></div>
    <div class="vt-campo"><label class="rot">Data</label><input type="date" id="va-data" min="${vHoje()}" value="${vHoje()}"></div>
    <div style="font-size:12px;color:var(--areia-esc);">Ao concluir o lançamento, esta ação vira uma tarefa no seu Início e entra na sua agenda nessa data.</div>`;
  const rod = `<button type="button" class="vt-btn-x" onclick="vistFecharJanela('vt-jan-acao')" aria-label="Cancelar">×</button><button type="button" class="vt-btn-check" onclick="vistConfirmarAcao()">${VIST_ICO.check} ADICIONAR</button>`;
  vistJanela("vt-jan-acao","#00733f",VIST_ICO.check,"Plano de ação","Tarefa vinculada a este item",corpo,rod,true);
}
function vistConfirmarAcao(){
  const desc = document.getElementById("va-desc").value.trim(), data = document.getElementById("va-data").value;
  if(!desc || !data){ alert("Informe a descrição e a data da ação."); return; }
  VIST_JAN.acoes.push({descricao:desc, data}); vistFecharJanela("vt-jan-acao"); vistRenderAcoesJan();
}
async function vistPersistirAcoes(origem, origemId, refTxt){
  const r = VIST_ATUAL;
  for(const a of (VIST_JAN.acoesRem||[])){
    await sb.from("vist_acoes").delete().eq("id", a.id);
    if(a.evento_id){ await sb.from("calendario_eventos").delete().eq("id", a.evento_id); CAL_EVENTOS = CAL_EVENTOS.filter(e=>e.id!==a.evento_id); }
    r.acoes = r.acoes.filter(x=>x.id!==a.id); VIST_ACOES = VIST_ACOES.filter(x=>x.id!==a.id);
  }
  for(const a of VIST_JAN.acoes){
    if(a._salva) continue;
    const ev = {titulo:"Plano de ação: "+a.descricao.slice(0,80), tipo:"Atividade", usuario_id:currentUser.id, criado_por:currentUser.id, criado_por_nome:currentUser.nome,
      data_inicio:a.data, data_fim:a.data, dia_inteiro:true, local:r.unidade, descricao:"Relatório vistorial — "+refTxt+" — "+r.unidade+"\n"+a.descricao, bloqueia:false};
    const re = await sb.from("calendario_eventos").insert(ev).select().single();
    let eventoId = null;
    if(re.data){ eventoId = re.data.id; CAL_EVENTOS.push(mapEventoCalFromDb(re.data)); } else console.error("[vist] evento:", re.error);
    const rr = await sb.from("vist_acoes").insert({relatorio_id:r.id, origem, origem_id:origemId, unidade:r.unidade, descricao:a.descricao, data:a.data,
      responsavel_id:currentUser.id, responsavel_nome:currentUser.nome, evento_id:eventoId}).select().single();
    if(rr.data){ r.acoes.push(rr.data); VIST_ACOES.push({...rr.data, ref:refTxt}); }
    else console.error("[vist] ação:", rr.error);
  }
  VIST_ACOES_TS = 0;
}

/* ---------- OCORRÊNCIA ---------- */
function vistAbrirOc(editId){
  const r = VIST_ATUAL; if(!r || vistRO()) return;
  const ed = editId ? r.oc.find(x=>x.id===editId) : null;
  VIST_JAN = {tipo:"oc", editId:ed?ed.id:null, acoes:[], acoesRem:[],
    d: ed ? {tipo:ed.tipo||"", descricao:ed.descricao||"", acao:ed.acao_realizada||"", colab: ed.colaborador_nome ? {matricula:ed.colaborador_matricula, nome:ed.colaborador_nome, cargo:ed.colaborador_cargo, setor:ed.colaborador_setor} : null}
          : {tipo:"", descricao:"", acao:"", colab:null}};
  if(ed) VIST_JAN.acoes = r.acoes.filter(a=>a.origem==="ocorrencia" && a.origem_id===ed.id).map(a=>({...a, _salva:true}));
  const d = VIST_JAN.d;
  const tipos = OCORRENCIAS_TIPOS.slice().sort((a,b)=>a.ordem-b.ordem);
  const corpo = `
    <div class="vt-campo"><label class="rot">Tipo de ocorrência</label><select onchange="VIST_JAN.d.tipo=this.value"><option value="">Selecione...</option>${tipos.map(t=>`<option ${d.tipo===t.valor?"selected":""}>${vEsc(t.valor)}</option>`).join("")}</select></div>
    <div class="vt-campo"><label class="rot">Colaborador</label><div id="vo-colab"></div></div>
    <div class="vt-campo"><label class="rot">Descrição da ocorrência</label><textarea rows="4" oninput="VIST_JAN.d.descricao=this.value" placeholder="O que aconteceu?">${vEsc(d.descricao)}</textarea></div>
    <div class="vt-campo"><label class="rot">Ação realizada</label><textarea rows="3" oninput="VIST_JAN.d.acao=this.value" placeholder="O que foi feito no momento?">${vEsc(d.acao)}</textarea></div>
    <div class="vt-campo"><label class="rot">Plano de ação</label><div id="vo-acoes"></div><button type="button" class="vt-acao-add" onclick="vistAbrirAcao()">+ Adicionar plano de ação</button></div>`;
  const rod = `<button type="button" class="vt-btn-x" onclick="vistCancelarJan('vt-jan-oc')" aria-label="Cancelar">×</button><button type="button" class="vt-btn-check" id="vo-check" onclick="vistConfirmarOc()">${VIST_ICO.check} CHECK</button>`;
  vistJanela("vt-jan-oc","#2563eb",VIST_ICO.oc, ed?"Editar ocorrência":"Nova ocorrência", vEsc(r.unidade)+" · "+formatarDataBR(r.data), corpo, rod);
  vistRenderColab(); vistRenderAcoesJan();
}
function vistRenderColab(){
  const c = VIST_JAN.d.colab, el = document.getElementById("vo-colab");
  el.innerHTML = c ? `<div class="vt-colab"><div><b>${vEsc(c.nome)}</b><small>Matrícula ${vEsc(c.matricula)} · ${vEsc([c.cargo,c.setor].filter(Boolean).join(" · "))}</small></div><button type="button" class="vt-chip" onclick="vistAbrirBuscaColab()">Trocar</button><button type="button" class="vt-chip" onclick="VIST_JAN.d.colab=null; vistRenderColab()">×</button></div>`
    : `<button type="button" class="vt-acao-add" style="border-color:#2563eb;background:#eef4ff;color:#1d4ed8" onclick="vistAbrirBuscaColab()">+ Adicionar colaborador</button>`;
}
async function vistLojaDaUnidade(unidade){
  if(!VIST_LOJAS){ const { data } = await sb.rpc("vist_lojas"); VIST_LOJAS = (data||[]).map(x=>x.loja); }
  const u = vNorm(unidade).replace(/[^A-Z0-9 ]/g," ").replace(/\s+/g," ").trim();
  let m = VIST_LOJAS.find(l=>vNorm(l).replace(/[^A-Z0-9 ]/g," ").replace(/\s+/g," ").trim()===u);
  if(!m) m = VIST_LOJAS.find(l=>{ const n = vNorm(l).replace(/[^A-Z0-9 ]/g," ").replace(/\s+/g," ").trim(); return n.length>3 && (u.includes(n) || n.includes(u)); });
  return m || null;
}
let vistBuscaTimer = null;
async function vistAbrirBuscaColab(){
  const loja = await vistLojaDaUnidade(VIST_ATUAL.unidade);
  VIST_JAN.loja = loja;
  const corpo = `<div class="vt-campo"><input type="search" id="vb-q" placeholder="Buscar por nome ou matrícula" oninput="vistBuscaDebounce()" autocomplete="off"></div>
    <div id="vb-filtro" style="margin-bottom:6px;"></div><div class="vt-res-colab" id="vb-res"></div>`;
  const rod = `<button type="button" class="vt-btn-x" style="width:100%" onclick="vistFecharJanela('vt-jan-colab')" aria-label="Fechar">×</button>`;
  vistJanela("vt-jan-colab","#2563eb",VIST_ICO.oc,"Buscar colaborador","Base de colaboradores ativos",corpo,rod,true);
  vistRenderFiltroLoja(); vistBuscarColab();
  setTimeout(()=>{ const q = document.getElementById("vb-q"); if(q) q.focus(); }, 120);
}
function vistRenderFiltroLoja(){
  const l = VIST_JAN.loja, el = document.getElementById("vb-filtro");
  el.innerHTML = l ? `<span class="vt-chip on">Loja: ${vEsc(l)} <b style="cursor:pointer;margin-left:6px" onclick="VIST_JAN.loja=null; vistRenderFiltroLoja(); vistBuscarColab()">×</b></span>` : '<span class="vt-chip">Todas as lojas</span>';
}
function vistBuscaDebounce(){ clearTimeout(vistBuscaTimer); vistBuscaTimer = setTimeout(vistBuscarColab, 280); }
async function vistBuscarColab(){
  const q = (document.getElementById("vb-q")||{}).value || "";
  const res = document.getElementById("vb-res"); if(!res) return;
  res.innerHTML = '<div style="color:var(--areia-esc);font-size:13px;padding:8px">Buscando...</div>';
  const { data, error } = await sb.rpc("vist_buscar_colab", {p_q:q, p_loja:VIST_JAN.loja||null, p_lim:40});
  if(error){ res.innerHTML = '<div style="color:#a11d1d;font-size:13px">Erro na busca.</div>'; return; }
  VIST_JAN._res = data||[];
  res.innerHTML = (data||[]).length ? data.map((c,i)=>`<button type="button" onclick="vistEscolherColab(${i})"><b>${vEsc(c.nome)}</b><small>Matrícula ${vEsc(c.matricula)} · ${vEsc([c.cargo,c.setor,c.loja].filter(Boolean).join(" · "))}</small></button>`).join("")
    : '<div style="color:var(--areia-esc);font-size:13px;padding:8px">Nenhum colaborador encontrado.</div>';
}
function vistEscolherColab(i){
  const c = VIST_JAN._res[i];
  if(VIST_JAN.modo==="assin"){
    VIST_JAN = null; vistFecharJanela("vt-jan-colab");
    vistAbrirAssinatura("loja", {matricula:c.matricula, nome:c.nome, cargo:c.cargo||""});
    return;
  }
  VIST_JAN.d.colab = {matricula:c.matricula, nome:c.nome, cargo:c.cargo, setor:c.setor};
  vistFecharJanela("vt-jan-colab"); vistRenderColab();
}
async function vistConfirmarOc(){
  const r = VIST_ATUAL, d = VIST_JAN.d;
  if(!d.tipo || !d.descricao.trim()){ alert("Informe o tipo e a descrição da ocorrência."); return; }
  const btn = document.getElementById("vo-check"); btn.disabled = true;
  const campos = {tipo:d.tipo, colaborador_matricula:d.colab?d.colab.matricula:null, colaborador_nome:d.colab?d.colab.nome:null, colaborador_cargo:d.colab?d.colab.cargo:null, colaborador_setor:d.colab?d.colab.setor:null,
    descricao:d.descricao.trim(), acao_realizada:(d.acao||"").trim()};
  let linha, erro;
  if(VIST_JAN.editId){
    const res = await sb.from("vist_ocorrencias").update(campos).eq("id", VIST_JAN.editId).select().single(); linha = res.data; erro = res.error;
    if(linha){ const i = r.oc.findIndex(x=>x.id===linha.id); r.oc[i] = linha; }
  } else {
    for(let t=0; t<6; t++){
      const { data: n } = await sb.rpc("vist_proximo_numero_oc", {p_unidade:r.unidade});
      const res = await sb.from("vist_ocorrencias").insert({...campos, relatorio_id:r.id, unidade:r.unidade, numero:n||1}).select().single(); linha = res.data; erro = res.error;
      if(!erro || erro.code!=="23505") break;
    }
    if(linha) r.oc.push(linha);
  }
  if(erro || !linha){ btn.disabled = false; alert("Não foi possível salvar a ocorrência: "+(erro&&erro.message||"")); return; }
  await vistPersistirAcoes("ocorrencia", linha.id, "Ocorrência — "+linha.tipo);
  VIST_JAN = null; vistFecharJanela("vt-jan-oc");
  vistRenderEditor(); mostrarToast("Ocorrência "+vCod("O",linha.numero)+" adicionada.");
}

/* ---------- aba de lançamentos ---------- */
function vistRenderLanc(){
  const r = VIST_ATUAL, ro = vistRO(), el = document.getElementById("vt-corpo-in");
  const acoesDe = (o, id)=>r.acoes.filter(a=>a.origem===o && a.origem_id===id);
  const acoesHtml = l=>l.length ? `<div class="vt-lanc-m" style="flex-direction:column;gap:2px;">${l.map(a=>`<span>✓ ${formatarDataBR(a.data)} — ${vEsc(a.descricao)}</span>`).join("")}</div>` : "";
  const incs = r.inc.map(x=>{
    const cor = (x.gut_rotulos&&x.gut_rotulos.cor)||"#000";
    return `<div class="vt-lanc"><div class="vt-lanc-t"><span class="vt-num">${vCod("I",x.numero)}</span><span class="vt-tag-gut" style="background:${vEsc(cor)}">${vEsc(x.gut_classe||"")}</span><span style="font-size:12px;font-weight:700;color:var(--areia-esc)">${vEsc(x.tipo||"")}</span></div>
      <div class="vt-lanc-b"><b>${vEsc(x.local||"")}</b> — ${vEsc(x.risco_desvio||"")}</div>
      <div class="vt-lanc-m"><span>Prazo: ${x.prazo_dias} dia${x.prazo_dias>1?"s":""}</span><span>Limite: ${formatarDataBR(x.data_limite)}</span></div>
      ${(x.riscos_expostos||[]).length?`<div class="vt-chips" style="margin-top:0">${x.riscos_expostos.map(k=>`<span>${vEsc(k)}</span>`).join("")}</div>`:""}
      ${x.foto?`<img src="${x.foto}" alt="Evidência">`:""}${acoesHtml(acoesDe("inconformidade",x.id))}${vistDeclHtml(x)}
      <div class="vt-lanc-a">${ro ? `<span style="font-size:12px;font-weight:800;color:var(--areia-esc)">STATUS</span><select onchange="vistMudarStatus(${x.id}, this.value)">${VIST_STATUS_INC.map(s=>`<option ${x.status===s?"selected":""}>${s}</option>`).join("")}</select>`
        : `<span class="vt-pill" style="background:#e6efff;color:#1d4ed8">${vEsc(x.status)}</span><button type="button" onclick="vistAbrirInc(${x.id})">Editar</button><button type="button" class="del" onclick="vistExcluir('inc',${x.id})">Excluir</button>`}</div></div>`;
  }).join("");
  const ocs = r.oc.map(x=>`<div class="vt-lanc"><div class="vt-lanc-t"><span class="vt-num" style="color:#1d4ed8">${vCod("O",x.numero)}</span><span style="font-size:12px;font-weight:700;color:var(--areia-esc)">${vEsc(x.tipo||"")}</span></div>
      ${x.colaborador_nome?`<div class="vt-lanc-m"><span>👤 ${vEsc(x.colaborador_nome)} · Mat. ${vEsc(x.colaborador_matricula||"")}</span></div>`:""}
      <div class="vt-lanc-b">${vEsc(x.descricao||"")}</div>${x.acao_realizada?`<div class="vt-lanc-m"><span>Ação realizada: ${vEsc(x.acao_realizada)}</span></div>`:""}
      ${acoesHtml(acoesDe("ocorrencia",x.id))}
      ${ro?"":`<div class="vt-lanc-a"><button type="button" onclick="vistAbrirOc(${x.id})">Editar</button><button type="button" class="del" onclick="vistExcluir('oc',${x.id})">Excluir</button></div>`}</div>`).join("");
  const pendHtml = vistPendHtml(r, ro);
  el.innerHTML = `${pendHtml}<div class="vt-sec">Inconformidades (${r.inc.length})</div>${incs||'<div class="vt-vazio" style="padding:22px">Nenhuma inconformidade lançada.'+(ro?"":"<br>Use o botão laranja flutuante.")+"</div>"}
    <div class="vt-sec" style="margin-top:18px">Ocorrências (${r.oc.length})</div>${ocs||'<div class="vt-vazio" style="padding:22px">Nenhuma ocorrência lançada.'+(ro?"":"<br>Use o botão azul flutuante.")+"</div>"}`;
}
function vistDeclHtml(x){
  if(!x.declarado_em) return "";
  return `<div class="vt-ver loja">🏪 Resolvido pela loja em ${vDataHora(x.declarado_em)}, por <b>${vEsc(x.declarado_nome||"")}</b> (matrícula ${vEsc(x.declarado_matricula||"—")}).${x.declarado_obs?"<br>“"+vEsc(x.declarado_obs)+"”":""}${x.declarado_foto?`<br><img src="${x.declarado_foto}" alt="Foto da correção" class="vt-mini">`:""}</div>`;
}
function vistPendNaoVerif(r){ return (r.pend||[]).filter(x=>x.verificado_relatorio_id!==r.id && !(x.status==="Concluído" && x.resolvido_por==="loja")).length; }
async function vistVerificar(id, st){
  const r = VIST_ATUAL;
  const { data, error } = await sb.rpc("vist_verificar", {p_id:id, p_status:st, p_rel:r.id});
  if(error || data!==true){ alert("Não foi possível registrar a verificação."); return; }
  const x = (r.pend||[]).find(i=>i.id===id); if(x){ x.status = st; x.verificado_relatorio_id = r.id; x.verificado_em = new Date().toISOString(); }
  vistRenderEditor(); mostrarToast("Item "+(st==="Concluído"?"confirmado como concluído":"marcado como "+st.toLowerCase())+".");
}
async function vistCiente(id){
  const r = VIST_ATUAL;
  const { data, error } = await sb.rpc("vist_ciente", {p_id:id, p_rel:r.id});
  if(error || data!==true){ alert("Não foi possível registrar a ciência."); return; }
  const x = (r.pend||[]).find(i=>i.id===id); if(x){ x.reportado_relatorio_id = r.id; x.declarado_foto = null; }
  vistRenderEditor(); mostrarToast("Ciente registrado. A foto foi descartada.");
}
async function vistMudarStatus(id, st){
  const concl = st==="Concluído";
  const upd = {status:st, resolvido_por:concl?"tecnico":null, resolvido_em:concl?new Date().toISOString():null, reportado_relatorio_id:null};
  if(!concl) upd.declarado_foto = null;
  const { error } = await sb.from("vist_inconformidades").update(upd).eq("id", id);
  if(error){ alert("Não foi possível alterar o status."); return; }
  const x = VIST_ATUAL.inc.find(i=>i.id===id);
  if(x) Object.assign(x, upd);
  if(VIST_ATUAL.painel){ const a = (VIST_ATUAL.painel.achados||[]).find(i=>i.id===id); if(a){ a.status = st; a.resolvido_por = upd.resolvido_por; a.resolvido_em = upd.resolvido_em; } }
  mostrarToast("Status atualizado para "+st+".");
  if(vistRO()) vistRenderEditor();
}
async function vistExcluir(tipo, id){
  if(!confirm("Excluir este lançamento?")) return;
  const r = VIST_ATUAL, origem = tipo==="inc" ? "inconformidade" : "ocorrencia";
  const acs = r.acoes.filter(a=>a.origem===origem && a.origem_id===id);
  for(const a of acs){ if(a.evento_id){ await sb.from("calendario_eventos").delete().eq("id", a.evento_id); CAL_EVENTOS = CAL_EVENTOS.filter(e=>e.id!==a.evento_id); } await sb.from("vist_acoes").delete().eq("id", a.id); }
  r.acoes = r.acoes.filter(a=>!acs.includes(a)); VIST_ACOES = VIST_ACOES.filter(a=>!acs.some(b=>b.id===a.id));
  const { error } = await sb.from(tipo==="inc"?"vist_inconformidades":"vist_ocorrencias").delete().eq("id", id);
  if(error){ alert("Não foi possível excluir."); return; }
  if(tipo==="inc") r.inc = r.inc.filter(x=>x.id!==id); else r.oc = r.oc.filter(x=>x.id!==id);
  vistRenderEditor();
}

/* ---------- aba assinar e emitir ---------- */
function vistPendencias(r){
  const p = [];
  r.checklist.forEach((g,gi)=>g.itens.forEach((it,ii)=>{
    if(!it.r) p.push({gi, ii, t:"Responder: "+it.titulo});
    else if((it.r==="CA"||it.r==="NC") && !(it.t||"").trim()) p.push({gi, ii, t:"Explicar o "+(it.r==="CA"?"C/A":"N/C")+": "+it.titulo});
    else if(it.ev && (it.r==="CA"||it.r==="NC") && !(it.f||[]).length) p.push({gi, ii, t:"Anexar foto de evidência: "+it.titulo});
  }));
  return p;
}
async function vistRenderEmitir(){
  const r = VIST_ATUAL, el = document.getElementById("vt-corpo-in");
  const pend = vistPendencias(r), c = vistContarResp(r), v = await vistAssinaturasValidas(r);
  if(VIST_ATUAL!==r || VIST_TAB!=="emitir") return;
  const souEu = currentUser.id===r.tecnicoId, L = r.assinaturaLoja;
  const mudou = (v.feitoT && !v.t) || (v.feitoL && !v.l);
  const boxT = !souEu ? '<div style="font-size:13px;color:var(--areia-esc)">Somente o técnico responsável pelo relatório pode assiná-lo.</div>'
    : `${v.feitoT ? `<div class="vt-assin"><img src="${r.assinaturaImg}" alt="Assinatura"><div><b>${vEsc(r.tecnicoNome)}</b><small>${vEsc(r.cargo||"")}${r.registro?" · "+vEsc(r.registro):""}</small></div></div>${r.assinaturaMeta?vistMetaResumo(r.assinaturaMeta):""}
         <div class="${v.t?"vt-ok":"vt-aviso-i"}" style="margin-top:10px">${v.t?"✓ Assinatura válida":"⚠ O conteúdo mudou depois desta assinatura — assine novamente."}</div>` : '<div style="font-size:13px;color:var(--areia-esc);margin-bottom:10px">Assine com o dedo (celular) ou com o mouse (computador). Serão registrados data/hora, localização e aparelho.</div>'}
       <div style="margin-top:12px"><button type="button" class="vt-btn-sec" onclick="vistAbrirAssinatura('tec')">✍ ${v.feitoT ? "Refazer assinatura" : "Assinar como técnico"}</button></div>`;
  const boxL = !souEu ? '<div style="font-size:13px;color:var(--areia-esc)">O técnico responsável colhe a assinatura da loja.</div>'
    : `${v.feitoL ? `<div class="vt-assin"><img src="${L.img}" alt="Assinatura da loja"><div><b>${vEsc(L.nome)}</b><small>${vEsc([L.cargo, L.doc?"Mat. "+L.doc:""].filter(Boolean).join(" · "))}</small></div></div>${vistMetaResumo(L)}
         <div class="${v.l?"vt-ok":"vt-aviso-i"}" style="margin-top:10px">${v.l?"✓ Assinatura válida":"⚠ O conteúdo mudou depois desta assinatura — colha novamente."}</div>` : '<div style="font-size:13px;color:var(--areia-esc);margin-bottom:10px">Obrigatório: um colaborador da loja precisa assinar este relatório. Escolha quem vai assinar e entregue o aparelho para a pessoa assinar na tela.</div>'}
       <div style="margin-top:12px"><button type="button" class="vt-btn-sec" onclick="vistColherAssinaturaLoja()">✍ ${v.feitoL ? "Colher novamente" : "Colher assinatura da loja"}</button></div>`;
  const libera = !pend.length && v.ok;
  el.innerHTML = `
    <div class="vt-box"><h4>Resumo</h4><div class="vt-metr"><span>${c.ok}/${c.t} itens respondidos</span><span class="${r.inc.length?"alerta":""}">${r.inc.length} inconformidade${r.inc.length===1?"":"s"}</span><span>${r.oc.length} ocorrência${r.oc.length===1?"":"s"}</span></div></div>
    <div class="vt-box"><h4>Pendências do checklist</h4>${pend.length ? `<div class="vt-pend">${pend.slice(0,30).map(p=>`<button type="button" onclick="vistIrItem(${p.gi},${p.ii})">${vEsc(p.t)}</button>`).join("")}${pend.length>30?`<small>… e mais ${pend.length-30}</small>`:""}</div>` : '<div class="vt-ok">✓ Checklist completo</div>'}</div>
    <div class="vt-box"><h4>Assinatura do técnico</h4>${boxT}</div>
    <div class="vt-box"><h4>Assinatura da loja (obrigatória)</h4>${boxL}</div>
    ${vistPendNaoVerif(r) ? `<div class="vt-box" style="border-color:#bcd0f5;background:#f4f8ff"><h4>Pendências de relatórios anteriores</h4><div style="font-size:13px">${vistPendNaoVerif(r)} item(ns) ainda sem verificação nesta visita. Confirme na aba Lançamentos (não impede a emissão).</div></div>` : ""}
    <button type="button" class="vt-btn-gr" ${libera ? "" : "disabled"} onclick="vistAbrirPrevia()">Emitir relatório</button>
    ${!libera ? `<div style="text-align:center;font-size:12px;color:var(--areia-esc);margin-top:8px">${pend.length?"Complete o checklist; ":""}${v.t?"":"assinatura do técnico pendente; "}${v.l?"":"assinatura da loja pendente; "}para liberar a emissão.</div>`:""}`;
}
function vistIrItem(gi, ii){
  VIST_TAB = "checklist"; vistRenderEditor();
  const e = document.getElementById("vi-"+gi+"-"+ii); if(e){ const g = e.closest(".vt-grupo"); if(g) g.classList.remove("fechado"); e.scrollIntoView({block:"center"}); e.style.outline = "3px solid #dc2626"; setTimeout(()=>e.style.outline="",1800); }
}
let vistPad = null;
function vistAbrirAssinatura(quem, colab){
  const nome = quem==="loja" ? colab.nome : VIST_ATUAL.tecnicoNome;
  const corpo = `<div style="font-size:12.5px;color:var(--areia-esc);margin-bottom:8px">${quem==="loja"?"<b>"+vEsc(colab.nome)+"</b> (matrícula "+vEsc(colab.matricula)+"), assine":"Assine"} dentro do quadro abaixo. Ao confirmar, a plataforma registra a data/hora, a localização e a identificação do aparelho.</div>
    <div style="border:2px dashed var(--areia-esc);border-radius:14px;background:#fff;position:relative;"><canvas id="vs-cv" width="640" height="260" style="width:100%;height:auto;display:block;touch-action:none;border-radius:12px;"></canvas>
    <div style="position:absolute;left:6%;right:6%;bottom:22%;border-top:1.5px solid #bbb;pointer-events:none"></div></div>
    <button type="button" class="vt-btn-sec" style="margin-top:10px" onclick="vistPadLimpar()">Limpar</button>`;
  const rod = `<button type="button" class="vt-btn-x" onclick="vistFecharJanela('vt-jan-ass')" aria-label="Cancelar">×</button><button type="button" class="vt-btn-check" id="vs-ok" onclick="vistAssinar()">${VIST_ICO.check} CONFIRMAR</button>`;
  vistJanela("vt-jan-ass","#00733f",VIST_ICO.check,quem==="loja"?"Assinatura da loja":"Assinatura do técnico",vEsc(nome),corpo,rod,true);
  const cv = document.getElementById("vs-cv"), ctx = cv.getContext("2d");
  ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b1f3a";
  vistPad = {cv, ctx, desenhou:false, last:null, quem:quem||"tec", colab:colab||null};
  const pos = e=>{ const r = cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*cv.width/r.width, y:(e.clientY-r.top)*cv.height/r.height}; };
  cv.addEventListener("pointerdown", e=>{ e.preventDefault(); cv.setPointerCapture(e.pointerId); vistPad.last = pos(e); ctx.beginPath(); ctx.arc(vistPad.last.x, vistPad.last.y, 1.4, 0, 7); ctx.fillStyle="#0b1f3a"; ctx.fill(); vistPad.desenhou = true; });
  cv.addEventListener("pointermove", e=>{ if(!vistPad.last) return; e.preventDefault(); const p = pos(e); ctx.beginPath(); ctx.moveTo(vistPad.last.x, vistPad.last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); vistPad.last = p; });
  const fim = ()=>{ if(vistPad) vistPad.last = null; };
  cv.addEventListener("pointerup", fim); cv.addEventListener("pointercancel", fim); cv.addEventListener("pointerleave", fim);
}
function vistPadLimpar(){ if(!vistPad) return; vistPad.ctx.clearRect(0,0,vistPad.cv.width,vistPad.cv.height); vistPad.desenhou = false; }
async function vistNovoToken(){
  if(!confirm("Gerar um novo token? O token impresso nos PDFs já emitidos deixa de valer e o prazo recomeça (60 dias).")) return;
  const { data, error } = await sb.rpc("vist_novo_token", {p_rel:VIST_ATUAL.id});
  if(error || !data){ alert("Não foi possível gerar um novo token."); return; }
  VIST_ATUAL.token = data.token; VIST_ATUAL.tokenExpira = data.expira; vistRenderEditor(); mostrarToast("Novo token gerado.");
}
async function vistAssinar(){
  const r = VIST_ATUAL;
  if(!vistPad || !vistPad.desenhou){ alert("Faça a assinatura no quadro antes de confirmar."); return; }
  const btn = document.getElementById("vs-ok"); const rot = btn ? btn.innerHTML : "";
  if(btn){ btn.disabled = true; btn.textContent = "Obtendo localização…"; }
  const quem = vistPad.quem, colab = vistPad.colab, img = vistPad.cv.toDataURL("image/png");
  let meta;
  try{
    const pessoa = quem==="loja" ? {nome:colab.nome, doc:colab.matricula, cargo:colab.cargo} : {nome:currentUser.nome, doc:r.registro||"", cargo:r.cargo||""};
    meta = await vistColetarAssinatura(quem, pessoa, img);
  }catch(e){ if(btn){ btn.disabled = false; btn.innerHTML = rot; } alert(e.message||"Não foi possível validar a assinatura."); return; }
  let error;
  if(quem==="loja"){
    const obj = {...meta, img};
    ({ error } = await sb.from("vist_relatorios").update({assinatura_loja:obj}).eq("id", r.id));
    if(!error) r.assinaturaLoja = obj;
  } else {
    ({ error } = await sb.from("vist_relatorios").update({assinatura_nome:currentUser.nome, assinado_em:meta.em, assinatura_img:img, assinatura_meta:meta}).eq("id", r.id));
    if(!error){ r.assinaturaNome = currentUser.nome; r.assinadoEm = meta.em; r.assinaturaImg = img; r.assinaturaMeta = meta; }
  }
  if(error){ if(btn){ btn.disabled = false; btn.innerHTML = rot; } alert("Não foi possível registrar a assinatura."); return; }
  vistPad = null; vistFecharJanela("vt-jan-ass"); vistRenderEmitir();
}

function vistPendHtml(r, ro){
  const l = r.pend||[]; if(!l.length) return "";
  return `<div class="vt-sec">Pendências de relatórios anteriores (${l.length})</div>`+l.map(x=>{
    const feito = x.verificado_relatorio_id===r.id, cor = x.cor||"#000";
    const lojaOk = x.status==="Concluído" && x.resolvido_por==="loja" && !feito;
    const ver = feito ? `<div class="vt-ver ${x.status==="Concluído"?"ok":"nok"}">Verificado nesta visita: <b>${vEsc(x.status)}</b></div>` : "";
    const decl = x.declarado_em ? vistDeclHtml(x) : "";
    return `<div class="vt-lanc pend"><div class="vt-lanc-t"><span class="vt-num">${vCod(x.origem,x.numero)}</span><span class="vt-tag-gut" style="background:${vEsc(cor)}">${vEsc(x.classe||"")}</span><span style="font-size:12px;font-weight:700;color:var(--areia-esc)">${vEsc(x.tipo||"")} · ${vEsc(x.relatorio||"")}</span></div>
      <div class="vt-lanc-b"><b>${vEsc(x.local||"")}</b> — ${vEsc(x.risco||"")}</div>
      <div class="vt-lanc-m"><span>Limite: ${formatarDataBR(x.limite)}</span><span>Status: <b>${vEsc(x.status)}</b></span></div>${decl}${ver}
      ${lojaOk ? `<div class="vt-ver ok">✓ Já consta como concluído (resolvido pela loja${x.declarado_foto?", com foto":""}).${x.reportado_relatorio_id===r.id?" Ciente registrado.":""}</div>${(ro||x.reportado_relatorio_id===r.id)?"":`<div class="vt-lanc-a"><button type="button" class="verde" onclick="vistCiente(${x.id})">✓ Ciente</button><button type="button" class="verm" onclick="vistVerificar(${x.id},'Não resolvido')">Contestar</button></div>`}` :
        ((ro||feito) ? "" : `<div class="vt-lanc-a"><button type="button" class="verde" onclick="vistVerificar(${x.id},'Concluído')">✓ Concluído</button><button type="button" class="verm" onclick="vistVerificar(${x.id},'Não resolvido')">Não resolvido</button><button type="button" onclick="vistVerificar(${x.id},'Em andamento')">Em andamento</button></div>`)}</div>`;
  }).join("");
}

function vistRenderEstrategica(){
  const r = VIST_ATUAL, el = document.getElementById("vt-corpo-in");
  const ck = vistContarCheck(r), conf = vistConf(ck), hoje = vHoje();
  const incs = r.inc.filter(x=>x.origem!=="C"), cks = r.inc.filter(x=>x.origem==="C");
  const todos = r.inc, conc = todos.filter(x=>x.status==="Concluído").length;
  const taxa = todos.length ? Math.round(conc/todos.length*100) : 100;
  const venc = todos.filter(x=>x.status!=="Concluído" && x.data_limite && x.data_limite < hoje).length;
  const abertas = todos.length - conc;
  const hist = vistHistConf(r, ck);
  const lojaRes = todos.filter(x=>x.resolvido_por==="loja").length;
  const card = x=>{
    const cor = (x.gut_rotulos&&x.gut_rotulos.cor)||"#000", vencido = x.status!=="Concluído" && x.data_limite && x.data_limite < hoje;
    return `<div class="vt-lanc"><div class="vt-lanc-t"><span class="vt-num">${vCod(x.origem,x.numero)}</span><span class="vt-tag-gut" style="background:${vEsc(cor)}">${vEsc(x.gut_classe||"")}</span><span style="font-size:12px;font-weight:700;color:var(--areia-esc)">${vEsc(x.tipo||"")}</span></div>
      <div class="vt-lanc-b"><b>${vEsc(x.local||"")}</b> — ${vEsc(x.risco_desvio||"")}</div>
      <div class="vt-lanc-m"><span>Limite: ${formatarDataBR(x.data_limite)}</span>${vencido?'<span style="color:#b91c1c;font-weight:800">VENCIDO</span>':""}${x.resolvido_por==="loja"?"<span>🏪 Resolvido pela loja</span>":""}</div>
      ${vistDeclHtml(x)}
      <div class="vt-lanc-a"><span style="font-size:12px;font-weight:800;color:var(--areia-esc)">STATUS</span><select onchange="vistMudarStatus(${x.id}, this.value)">${VIST_STATUS_INC.map(s=>`<option ${x.status===s?"selected":""}>${s}</option>`).join("")}</select></div></div>`;
  };
  const ocs = r.oc.map(x=>`<div class="vt-lanc"><div class="vt-lanc-t"><span class="vt-num" style="color:#1d4ed8">${vCod("O",x.numero)}</span><span style="font-size:12px;font-weight:700;color:var(--areia-esc)">${vEsc(x.tipo||"")}</span></div>
      ${x.colaborador_nome?`<div class="vt-lanc-m"><span>👤 ${vEsc(x.colaborador_nome)} · Mat. ${vEsc(x.colaborador_matricula||"")}</span></div>`:""}
      <div class="vt-lanc-b">${vEsc(x.descricao||"")}</div>${x.acao_realizada?`<div class="vt-lanc-m"><span>Ação realizada: ${vEsc(x.acao_realizada)}</span></div>`:""}</div>`).join("");
  const sigBox = (titulo, nome, sub, meta, img)=> `<div class="vt-sigv"><b>${titulo}</b>${img?`<img src="${img}" alt="Assinatura">`:""}<div><b>${vEsc(nome||"—")}</b><small>${vEsc(sub||"")}</small></div>${meta?vistMetaResumo(meta):'<small>Sem dados de validação (relatório emitido antes do registro de aparelho/localização).</small>'}</div>`;
  const L = r.assinaturaLoja;
  el.innerHTML = `
    <div class="vt-travado">🔒 Relatório emitido e travado — o conteúdo não pode ser alterado. Você pode acompanhar o andamento dos itens abaixo.</div>
    <div class="vt-kdonut"><div>${vistDonutSvg(ck.C, ck.CA, ck.NC, 130)}</div><div style="flex:1;min-width:200px"><div class="vt-sec" style="margin:0 0 6px">Conformidade da vistoria</div>${vistLegenda(ck.C, ck.CA, ck.NC)}<div style="font-size:12px;color:var(--areia-esc);margin-top:6px">Conformidade = itens conformes (C) ÷ itens avaliados (${ck.t}).</div></div></div>
    <div class="vt-kgrid">
      <div class="vt-k ok"><b>${taxa}%</b><span>Taxa resolutiva</span></div>
      <div class="vt-k ${abertas?"al":""}"><b>${abertas}</b><span>Itens em aberto</span></div>
      <div class="vt-k ${venc?"al":""}"><b>${venc}</b><span>Vencidos</span></div>
      <div class="vt-k"><b>${incs.length}</b><span>Inconformidades (I)</span></div>
      <div class="vt-k"><b>${cks.length}</b><span>Pontos do checklist (C)</span></div>
      <div class="vt-k"><b>${r.oc.length}</b><span>Ocorrências (O)</span></div>
      <div class="vt-k"><b>${lojaRes}</b><span>Resolvidos pela loja</span></div>
    </div>
    ${hist.length>1?`<div class="vt-box"><h4>Conformidade geral da loja ao longo das vistorias</h4>${vistTendenciaSvg(hist, "100%")}</div>`:""}
    ${vistPendHtml(r, true)}
    <div class="vt-sec">Inconformidades (${incs.length})</div>${incs.map(card).join("")||'<div class="vt-vazio" style="padding:18px">Nenhuma inconformidade nesta vistoria.</div>'}
    <div class="vt-sec" style="margin-top:16px">Pontos do checklist com advertência ou não conformidade (${cks.length})</div>${cks.map(card).join("")||'<div class="vt-vazio" style="padding:18px">Nenhum ponto de atenção no checklist.</div>'}
    <div class="vt-sec" style="margin-top:16px">Ocorrências (${r.oc.length})</div>${ocs||'<div class="vt-vazio" style="padding:18px">Nenhuma ocorrência.</div>'}
    <div class="vt-sec" style="margin-top:16px">Assinaturas e validação</div>
    <div class="vt-box">${sigBox("Técnico responsável", r.tecnicoNome, [r.cargo, r.registro].filter(Boolean).join(" · "), r.assinaturaMeta, r.assinaturaImg)}
      ${sigBox("Representante da loja", L&&L.nome, L?[L.cargo, L.doc?"Mat. "+L.doc:""].filter(Boolean).join(" · "):"", L, L&&L.img)}
      ${r.autenticidade?`<div class="vt-meta" style="margin-top:10px">Código de autenticidade do relatório<br><span class="mono">${vEsc(r.autenticidade)}</span></div>`:""}</div>
    <div class="vt-box"><h4>Documento e acesso da loja</h4>
      <div class="vt-ok">✓ Emitido em ${vDataHora(r.finalizadoEm)}</div>
      <p style="font-size:12.5px;color:var(--areia-esc);margin:8px 0 12px">As fotos foram descartadas da plataforma na emissão (ficam apenas no PDF entregue na hora). O PDF abaixo é regerado sem as imagens.</p>
      <button type="button" class="vt-btn-sec" onclick="vistBaixarSemFotos()">Baixar PDF (sem fotos)</button>
      <div class="vt-tokbox" style="margin-top:14px"><span class="vt-tok" id="vt-tok">${vEsc(r.token||"—")}</span><div style="font-size:12.5px;color:var(--areia-esc)">Token que a loja digita depois de escanear o QR Code.<br>Válido até <b>${r.tokenExpira?formatarDataBR(String(r.tokenExpira).slice(0,10)):"—"}</b></div></div>
      ${ehAdminOuCoordenador() ? `<button type="button" class="vt-btn-sec" style="margin-top:12px" onclick="vistNovoToken()">Gerar novo token (invalida o anterior)</button>` : ""}</div>`;
}

function vistColherAssinaturaLoja(){
  VIST_JAN = {d:{}, modo:"assin"};
  vistAbrirBuscaColab();
}

async function vistReservarCodigosC(rel){
  const { data:n0 } = await sb.rpc("vist_proximo_numero2", {p_unidade:rel.unidade, p_origem:"C"});
  let n = n0 || 1;
  rel.checklist.forEach(g=>g.itens.forEach(it=>{ if(it.r==="CA"||it.r==="NC") it.cod = n++; else delete it.cod; }));
}

async function vistRenderPainel(){
  const el = document.getElementById("vt-painel"); if(!el || !VIST_PUN) return;
  const un = VIST_PUN;
  const topo = `<div class="vt-pn-top"><button type="button" class="vt-chip" onclick="vistVoltarLojas()">← Lojas</button><b>${vEsc(un)}</b><button type="button" class="vt-btn-novo" onclick="vistNovoLoja()">+ Novo relatório</button></div>`;
  const rels = VIST_REL.filter(r=>r.unidade===un).filter(r=>VIST_FILTRO==="rasc" ? r.status!=="Finalizado" : VIST_FILTRO==="fin" ? r.status==="Finalizado" : true);
  const listaRel = `<div class="vt-sec">Relatórios da loja (${rels.length})</div><div class="vt-lista" style="margin-bottom:6px">${rels.map(vistCardRel).join("") || '<div class="vt-vazio" style="padding:18px">Nenhum relatório neste filtro.</div>'}</div>`;
  if(!VIST_PAINEL || VIST_PAINEL.un!==un){
    el.innerHTML = topo+'<div class="vt-vazio">Carregando indicadores…</div>'+listaRel;
    const { data } = await sb.rpc("vist_painel_unidade", {p_unidade:un});
    if(VIST_PUN!==un) return;
    VIST_PAINEL = {un, d:data||{relatorios:[], achados:[], ocorrencias:[]}};
  }
  const d = VIST_PAINEL.d, hoje = vHoje();
  const rl = (d.relatorios||[]), ach = (d.achados||[]);
  const ult = rl.length ? rl[rl.length-1] : null;
  const ck = ult ? {C:ult.c||0, CA:ult.ca||0, NC:ult.nc||0} : {C:0, CA:0, NC:0};
  const hist = rl.map(x=>{ const t=(x.c||0)+(x.ca||0)+(x.nc||0); return {data:x.data, pct:t?Math.round(x.c/t*100):null}; }).filter(x=>x.pct!==null).slice(-8);
  const conc = ach.filter(x=>x.status==="Concluído"), ab = ach.filter(x=>x.status!=="Concluído");
  const venc = ab.filter(x=>x.limite && x.limite < hoje), noPrazo = ab.length - venc.length;
  const taxa = ach.length ? Math.round(conc.length/ach.length*100) : 100;
  const lojaRes = ach.filter(x=>x.resolvido_por==="loja").length;
  const tempos = conc.map(x=>{ const fim = x.resolvido_em||x.verificado_em; return fim ? (new Date(fim)-new Date(x.criado))/86400000 : null; }).filter(t=>t!==null && t>=0);
  const tmed = tempos.length ? (tempos.reduce((s,t)=>s+t,0)/tempos.length) : null;
  const contar = (arr,f)=>{ const m = {}; arr.forEach(x=>{ const k = f(x)||"—"; m[k] = (m[k]||0)+1; }); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
  const barras = (lista, max)=>{ const mx = Math.max(1, ...lista.map(l=>l[1])); return lista.slice(0,max).map(l=>`<div class="vt-barra"><em title="${vEsc(l[0])}">${vEsc(l[0])}</em><div><i style="width:${Math.round(l[1]/mx*100)}%"></i></div><b>${l[1]}</b></div>`).join("") || '<div style="font-size:12.5px;color:var(--areia-esc)">Sem dados.</div>'; };
  const pf = VIST_PFIL;
  const lista = ach.filter(x=> pf==="todas" ? true : pf==="venc" ? (x.status!=="Concluído" && x.limite && x.limite<hoje) : pf==="conc" ? x.status==="Concluído" : x.status!=="Concluído");
  const podeEd = vPodeVerTodos();
  const chip = (k,t)=>`<button type="button" class="vt-chip ${pf===k?"on":""}" onclick="vistPainelFiltro('${k}')">${t}</button>`;
  const cards = lista.map(x=>{
    const cor = x.cor||"#000", vencido = x.status!=="Concluído" && x.limite && x.limite<hoje;
    return `<div class="vt-lanc"><div class="vt-lanc-t"><span class="vt-num">${vCod(x.origem,x.numero)}</span><span class="vt-tag-gut" style="background:${vEsc(cor)}">${vEsc(x.classe||"")}</span><span style="font-size:12px;font-weight:700;color:var(--areia-esc)">${vEsc(x.tipo||"")} · ${vEsc(x.relatorio||"")}</span></div>
      <div class="vt-lanc-b"><b>${vEsc(x.local||"")}</b> — ${vEsc(x.risco||"")}</div>
      <div class="vt-lanc-m"><span>Limite: ${formatarDataBR(x.limite)}</span>${vencido?'<span style="color:#b91c1c;font-weight:800">VENCIDO</span>':""}${x.resolvido_por==="loja"?"<span>🏪 Resolvido pela loja</span>":""}</div>
      <div class="vt-lanc-a">${podeEd ? `<span style="font-size:12px;font-weight:800;color:var(--areia-esc)">STATUS</span><select onchange="vistPainelStatus(${x.id}, this.value)">${VIST_STATUS_INC.map(s=>`<option ${x.status===s?"selected":""}>${s}</option>`).join("")}</select>` : `<span class="vt-pill" style="background:#e6efff;color:#1d4ed8">${vEsc(x.status)}</span>`}</div></div>`;
  }).join("");
  el.innerHTML = topo + (rl.length||ach.length||(d.ocorrencias||[]).length ? `
    <div class="vt-kdonut"><div>${vistDonutSvg(ck.C, ck.CA, ck.NC, 130)}</div><div style="flex:1;min-width:200px"><div class="vt-sec" style="margin:0 0 6px">Conformidade geral${ult?" · última vistoria "+formatarDataBR(ult.data):""}</div>${vistLegenda(ck.C, ck.CA, ck.NC)}</div></div>
    <div class="vt-kgrid">
      <div class="vt-k ok"><b>${taxa}%</b><span>Taxa resolutiva</span></div>
      <div class="vt-k ${ab.length?"al":""}"><b>${ab.length}</b><span>Em aberto</span></div>
      <div class="vt-k"><b>${noPrazo}</b><span>No prazo</span></div>
      <div class="vt-k ${venc.length?"al":""}"><b>${venc.length}</b><span>Vencidos</span></div>
      <div class="vt-k"><b>${conc.length}</b><span>Concluídos</span></div>
      <div class="vt-k"><b>${lojaRes}</b><span>Resolvidos pela loja</span></div>
      <div class="vt-k"><b>${tmed===null?"—":tmed.toFixed(1).replace(".",",")}</b><span>Dias p/ resolver (média)</span></div>
      <div class="vt-k"><b>${(d.ocorrencias||[]).length}</b><span>Ocorrências (O)</span></div>
    </div>
    ${hist.length?`<div class="vt-box"><h4>Evolução da conformidade da loja</h4>${vistTendenciaSvg(hist, "100%")}</div>`:""}
    ${listaRel}
    <div class="vt-pn-cols">
      <div class="vt-box"><h4>Itens por status</h4>${barras(contar(ach,x=>x.status),6)}</div>
      <div class="vt-box"><h4>Itens por classificação</h4>${barras(contar(ach,x=>x.classe),6)}</div>
      <div class="vt-box"><h4>Itens por tipo</h4>${barras(contar(ach,x=>x.tipo),6)}</div>
      <div class="vt-box"><h4>Ocorrências por tipo</h4>${barras(contar(d.ocorrencias||[],x=>x.tipo),6)}</div>
    </div>
    <div class="vt-sec">Inconformidades e pontos do checklist (${lista.length})</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${chip("abertas","Em aberto")}${chip("venc","Vencidas")}${chip("conc","Concluídas")}${chip("todas","Todas")}</div>
    ${cards || '<div class="vt-vazio" style="padding:22px">Nenhum item neste filtro.</div>'}` : listaRel);
}

function vistPainelUn(u){ VIST_PUN = u; VIST_PAINEL = null; vistRenderLista(); }

function vistModo(m){ VIST_MODO = m; vistRenderLista(); }

/* ---------- relatório em folhas A4 ---------- */
function vistFolhaBlocos(r){
  const B = [];
  const sec = t=>B.push({html:`<div class="vr-secao">${t}</div>`, keep:true});
  const ck = vistContarCheck(r), conf = vistConf(ck), hist = vistHistConf(r, ck);
  const incs = (r.inc||[]).filter(x=>x.origem!=="C").slice().sort((a,b)=>(b.gut_score||0)-(a.gut_score||0) || a.numero-b.numero);
  let nSec = 0;
  // ---------- capa ----------
  B.push({capa:true, html:`<div class="vr-capa-in"><div class="vr-capa-band"></div>
    <img class="vr-capa-logo" src="${HORTIFRUTI_LOGO_DATAURL}" alt="">
    <h1>RELATÓRIO VISTORIAL</h1><div class="vr-capa-s">Segurança do Trabalho · Inspeção de unidade</div>
    <div class="vr-capa-un">${vEsc(r.unidade)}</div>
    ${r.codigo?`<div class="vr-capa-cod">Nº ${vEsc(r.codigo)}</div>`:""}
    <div class="vr-capa-meta"><div><span>Data da vistoria</span><b>${formatarDataBR(r.data)}</b></div><div><span>Técnico responsável</span><b>${vEsc(r.tecnicoNome)}</b></div><div><span>Conformidade geral</span><b>${ck.t?conf+"%":"—"}</b></div></div>
    <div class="vr-capa-rod">SESMT · Hortifruti Natural da Terra</div></div>`});
  // ---------- introdução + conformidade geral ----------
  sec("Introdução");
  B.push({html:`<div class="vr-intro"><p>Este relatório registra a vistoria de segurança do trabalho realizada na unidade <b>${vEsc(r.unidade)}</b> em <b>${formatarDataBR(r.data)}</b>, sob responsabilidade do técnico <b>${vEsc(r.tecnicoNome)}</b>. Foram avaliados <b>${ck.t}</b> itens do checklist de inspeção, classificados como <b>C</b> (conforme), <b>C/A</b> (conforme com advertência) ou <b>N/C</b> (não conforme). As inconformidades identificadas foram priorizadas pelo indicador GUT (Gravidade, Urgência e Tendência).</p>
    <p>Cada registro recebe um código próprio dentro da unidade: <b>C0001</b> para pontos do checklist com advertência ou não conformidade, <b>I0001</b> para inconformidades e <b>O0001</b> para ocorrências. O mesmo código é usado no acompanhamento: a loja pode informar a solução de qualquer item, com foto que comprove a correção, pelo QR Code indicado ao final deste documento.</p>
    <p>O relatório é assinado pelo técnico e por um representante da loja. As assinaturas registram data, hora, localização e identificação do aparelho, o que garante a validade do documento.</p></div>`});
  B.push({html:`<table class="vr-t"><tr><td colspan="2"><span class="vr-l">Unidade vistoriada</span><span class="vr-v">${vEsc(r.unidade)}</span></td><td><span class="vr-l">Data</span><span class="vr-v">${formatarDataBR(r.data)}</span></td></tr>
    <tr><td><span class="vr-l">Técnico responsável</span><span class="vr-v">${vEsc(r.tecnicoNome)}</span></td><td><span class="vr-l">Registro</span><span class="vr-v">${vEsc(r.registro||"—")}</span></td><td><span class="vr-l">Cargo</span><span class="vr-v">${vEsc(r.cargo||"—")}</span></td></tr></table>`});
  B.push({html:`<div class="vr-secao">Conformidade geral da loja</div><div class="vr-graf"><div class="vr-graf-d">${vistDonutSvg(ck.C, ck.CA, ck.NC, "42mm")}<div class="vr-leg"><span><i style="background:#16a34a"></i>Conforme (C) — ${ck.C}</span><span><i style="background:#f59e0b"></i>C/ advertência (C/A) — ${ck.CA}</span><span><i style="background:#dc2626"></i>Não conforme (N/C) — ${ck.NC}</span></div></div>
    <div class="vr-graf-t"><div class="vr-l">Evolução da conformidade nas vistorias da unidade</div>${vistTendenciaSvg(hist, "92mm", "40mm")}</div></div>
    <div class="vr-kpis"><div class="vr-kpi"><b>${ck.t}</b><span>Itens avaliados</span></div><div class="vr-kpi"><b class="vr-x-c">${ck.C}</b><span>Conformes</span></div><div class="vr-kpi"><b class="vr-x-ca">${ck.CA}</b><span>C/ advertência</span></div><div class="vr-kpi"><b class="vr-x-nc">${ck.NC}</b><span>Não conformes</span></div><div class="vr-kpi"><b>${incs.length}</b><span>Inconformidades</span></div><div class="vr-kpi"><b>${(r.oc||[]).length}</b><span>Ocorrências</span></div></div>
    <div class="vr-nota">Conformidade = itens conformes (C) ÷ itens avaliados. O gráfico de evolução considera as vistorias emitidas da unidade.</div>`});
  // ---------- checklist ----------
  nSec++; sec(nSec+". Checklist de inspeção");
  const colg = '<colgroup><col style="width:39%"><col style="width:8%"><col style="width:6%"><col style="width:7%"><col style="width:6%"><col style="width:34%"></colgroup>';
  if(!r.checklist.length) B.push({html:'<div class="vr-vazio">Sem itens de checklist neste relatório.</div>'});
  r.checklist.forEach(g=>{
    B.push({html:`<div class="vr-grupo">${vEsc(g.grupo)}</div><table class="vr-t">${colg}<tr><th style="text-align:left">Item</th><th>Cód.</th><th>C</th><th>C/A</th><th>N/C</th><th>Observações</th></tr></table>`, keep:true});
    g.itens.forEach(it=>{
      const x = k=>it.r===k ? `<span class="vr-x-${k.toLowerCase()}">✕</span>` : "";
      B.push({html:`<table class="vr-t">${colg}<tr><td><div class="vr-it-t">${vEsc(it.titulo)}</div>${it.descricao?`<div class="vr-it-d">${vEsc(it.descricao)}</div>`:""}</td><td class="c" style="font-size:7pt">${it.cod?vCod("C",it.cod):""}</td><td class="c">${x("C")}</td><td class="c">${x("CA")}</td><td class="c">${x("NC")}</td>
        <td>${it.t?`<div class="vr-obs">${vEsc(it.t)}</div>`:""}${(it.f||[]).length?`<div class="vr-fotos">${it.f.map(f=>`<img src="${f}" alt="">`).join("")}</div>`:(it.fotos?`<div class="vr-it-d">${it.fotos} foto(s) descartada(s)</div>`:"")}</td></tr></table>`});
    });
  });
  // ---------- inconformidades ----------
  nSec++; sec(nSec+". Inconformidades (por ordem de prioridade)");
  if(!incs.length) B.push({html:'<div class="vr-vazio">Nenhuma inconformidade registrada nesta vistoria.</div>'});
  incs.forEach(x=>{
    const cor = (x.gut_rotulos&&x.gut_rotulos.cor)||"#000";
    const acs = (r.acoes||[]).filter(a=>a.origem==="inconformidade" && a.origem_id===x.id);
    B.push({html:`<table class="vr-t" style="margin-bottom:2.4mm"><colgroup><col style="width:18%"><col style="width:34%"><col style="width:24%"><col style="width:24%"></colgroup>
      <tr><td><span class="vr-l">Código</span><span class="vr-inc-num">${vCod("I",x.numero)}</span></td><td><span class="vr-l">Tipo</span><span class="vr-v">${vEsc(x.tipo||"")}</span></td><td style="text-align:center;vertical-align:middle"><span class="vr-l">Classificação</span><span class="vr-gut-cl" style="background:${vEsc(cor)}">${vEsc(x.gut_classe||"")}</span></td><td><span class="vr-l">Status</span><span class="vr-st">${vEsc(x.status||"Notificado")}</span></td></tr>
      <tr><td colspan="2"><span class="vr-l">Local</span><span class="vr-v">${vEsc(x.local||"")}</span></td><td><span class="vr-l">Prazo p/ solução</span><span class="vr-v">${x.prazo_dias} dia${x.prazo_dias>1?"s":""}</span></td><td><span class="vr-l">Data limite</span><span class="vr-v">${formatarDataBR(x.data_limite)}</span></td></tr>
      <tr><td colspan="4"><span class="vr-l">Risco / desvio encontrado</span><span class="vr-v vr-txt" style="font-weight:500;white-space:pre-wrap">${vEsc(x.risco_desvio||"")}</span></td></tr>
      <tr><td colspan="4"><span class="vr-l">Risco exposto</span><span class="vr-v">${vEsc((x.riscos_expostos||[]).join(" · ")||"—")}</span></td></tr>
      ${x.foto?`<tr><td colspan="4"><span class="vr-l">Evidência</span><img class="vr-ev" src="${x.foto}" alt="Evidência"></td></tr>`:""}
      ${acs.length?`<tr><td colspan="4"><span class="vr-l">Plano de ação</span>${acs.map(a=>`<span class="vr-v" style="font-weight:500">• ${formatarDataBR(a.data)} — ${vEsc(a.descricao)}</span>`).join("")}</td></tr>`:""}</table>`});
  });
  // ---------- ocorrências ----------
  nSec++; sec(nSec+". Ocorrências");
  if(!(r.oc||[]).length) B.push({html:'<div class="vr-vazio">Nenhuma ocorrência registrada nesta vistoria.</div>'});
  (r.oc||[]).forEach(x=>{
    const acs = (r.acoes||[]).filter(a=>a.origem==="ocorrencia" && a.origem_id===x.id);
    B.push({html:`<table class="vr-t" style="margin-bottom:2.4mm"><colgroup><col style="width:16%"><col style="width:26%"><col style="width:58%"></colgroup>
      <tr><td><span class="vr-l">Código</span><span class="vr-inc-num" style="color:#1d4ed8">${vCod("O",x.numero)}</span></td><td><span class="vr-l">Tipo</span><span class="vr-v">${vEsc(x.tipo||"")}</span></td><td><span class="vr-l">Colaborador</span><span class="vr-v">${x.colaborador_nome?vEsc(x.colaborador_nome)+" — Mat. "+vEsc(x.colaborador_matricula||"")+(x.colaborador_cargo?" — "+vEsc(x.colaborador_cargo):""):"—"}</span></td></tr>
      <tr><td colspan="3"><span class="vr-l">Descrição da ocorrência</span><span class="vr-v vr-txt" style="font-weight:500;white-space:pre-wrap">${vEsc(x.descricao||"")}</span></td></tr>
      <tr><td colspan="3"><span class="vr-l">Ação realizada</span><span class="vr-v vr-txt" style="font-weight:500;white-space:pre-wrap">${vEsc(x.acao_realizada||"—")}</span></td></tr>
      ${acs.length?`<tr><td colspan="3"><span class="vr-l">Plano de ação</span>${acs.map(a=>`<span class="vr-v" style="font-weight:500">• ${formatarDataBR(a.data)} — ${vEsc(a.descricao)}</span>`).join("")}</td></tr>`:""}</table>`});
  });
  // ---------- pendências de relatórios anteriores ----------
  const prioCl = x=>{ const i = (VIST_CFG.gutClasses||[]).findIndex(c=>c.nome===x.classe); return i<0 ? 99 : i; };
  const pendPdf = (r.pend||[]).slice().sort((a,b)=>prioCl(a)-prioCl(b) || a.numero-b.numero);
  if(pendPdf.length){
    nSec++; sec(nSec+". Pendências de relatórios anteriores");
    pendPdf.forEach(x=>{
      const feito = x.verificado_relatorio_id===r.id, cor = x.cor||"#000";
      const lojaOk = x.status==="Concluído" && x.resolvido_por==="loja" && !feito;
      B.push({html:`<table class="vr-t" style="margin-bottom:2.4mm"><colgroup><col style="width:16%"><col style="width:40%"><col style="width:20%"><col style="width:24%"></colgroup>
        <tr><td><span class="vr-l">Código</span><span class="vr-inc-num">${vCod(x.origem,x.numero)}</span></td><td><span class="vr-l">Relatório de origem · Tipo</span><span class="vr-v">${vEsc(x.relatorio||"")} · ${vEsc(x.tipo||"")}</span></td><td><span class="vr-l">Data limite</span><span class="vr-v">${formatarDataBR(x.limite)}</span></td><td style="text-align:center"><span class="vr-gut-cl" style="background:${vEsc(cor)}">${vEsc(x.classe||"")}</span></td></tr>
        <tr><td colspan="4"><span class="vr-l">Local / risco / desvio</span><span class="vr-v vr-txt" style="font-weight:500">${vEsc(x.local||"")} — ${vEsc(x.risco||"")}</span></td></tr>
        ${x.declarado_em?`<tr><td colspan="4"><span class="vr-l">Resolvido pela loja</span><span class="vr-v" style="font-weight:500">${vEsc(x.declarado_nome||"")} (mat. ${vEsc(x.declarado_matricula||"—")}) em ${vDataHora(x.declarado_em)}${x.declarado_obs?" — "+vEsc(x.declarado_obs):""}</span>${x.declarado_foto?`<img class="vr-ev" style="margin-top:1mm" src="${x.declarado_foto}" alt="Foto da correção">`:""}</td></tr>`:""}
        <tr><td colspan="4"><span class="vr-l">Situação</span><span class="vr-st">${feito ? "Verificado nesta visita: "+vEsc(x.status) : lojaOk ? "Concluído — resolvido pela loja" : "Não verificado nesta visita ("+vEsc(x.status)+")"}</span></td></tr></table>`});
    });
  }
  // ---------- acompanhamento pela loja ----------
  if(r.token){
    nSec++; sec(nSec+". Acompanhamento pela loja");
    let qrImg = "";
    try{ const q = qrcode(0,"M"); q.addData(VIST_URL_PUBLICA+"?v=1&u="+encodeURIComponent(r.unidade)); q.make(); qrImg = q.createDataURL(8,2); }catch(e){ console.error("[vist] qr:", e); }
    const exp = r.tokenExpira ? formatarDataBR(String(r.tokenExpira).slice(0,10)) : "";
    B.push({html:`<div class="vr-qr">${qrImg?`<img src="${qrImg}" alt="QR Code">`:""}<div><b>Informe que um item foi solucionado</b>
      <small>1. Escaneie o QR Code com a câmera do celular (ou acesse ${vEsc(VIST_URL_PUBLICA)}).<br>2. Digite o token abaixo e a sua matrícula.<br>3. Escolha o item (C, I ou O), tire a foto que comprova a correção e confirme. O item passa a constar como concluído e o técnico responsável é avisado.</small>
      <span class="tk">${vEsc(r.token)}</span><small>Token de acesso${exp?" · válido até <b>"+exp+"</b>":""} · relatório ${vEsc(r.codigo||"")}</small></div></div>`});
  }
  // ---------- assinaturas ----------
  nSec++; sec(nSec+". Assinaturas e validação");
  const L = r.assinaturaLoja, MT = r.assinaturaMeta;
  const val = (m)=> m ? `<div class="vr-val"><div><b>Data/hora:</b> ${vDataHora(m.em)}</div><div><b>Localização:</b> ${m.geo?Number(m.geo.lat).toFixed(5)+", "+Number(m.geo.lng).toFixed(5)+" (±"+m.geo.precisao+" m)":"—"}</div><div><b>ID do aparelho:</b> <span class="mono">${vEsc((m.aparelho&&m.aparelho.id||"").slice(0,36))}</span></div><div><b>Código de validação:</b> <span class="mono">${vEsc(m.hash||"")}</span></div></div>` : '<div class="vr-val"><div>Sem dados de validação.</div></div>';
  B.push({html:`<div class="vr-assin2"><div class="vr-assin-c">${r.assinaturaImg?`<img src="${r.assinaturaImg}" alt="Assinatura">`:'<div style="height:16mm"></div>'}<div class="ln">${vEsc(r.tecnicoNome)}</div><small>Técnico responsável · ${vEsc(r.cargo||"")}${r.registro?" · Reg. "+vEsc(r.registro):""}</small>${val(MT)}</div>
    <div class="vr-assin-c">${L&&L.img?`<img src="${L.img}" alt="Assinatura da loja">`:'<div style="height:16mm"></div>'}<div class="ln">${vEsc((L&&L.nome)||"—")}</div><small>Representante da loja${L&&L.cargo?" · "+vEsc(L.cargo):""}${L&&L.doc?" · Mat. "+vEsc(L.doc):""}</small>${val(L)}</div></div>
    <div class="vr-autent">Emitido em ${vDataHora(r.finalizadoEm||new Date().toISOString())}${r.autenticidade?` · Código de autenticidade do relatório: <span class="mono">${vEsc(r.autenticidade)}</span>`:""}</div>`});
  return B;
}
function vistMontarFolhas(r){
  const blocos = vistFolhaBlocos(r);
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  const wrap = document.createElement("div");
  wrap.className = "vr-medida"; wrap.style.zoom = String(1/zoom);
  document.body.appendChild(wrap);
  const folhas = [];
  const novaFolha = ()=>{
    const f = document.createElement("div"); f.className = "vr-folha";
    f.innerHTML = `<div class="vr-cab"><img src="${HORTIFRUTI_LOGO_DATAURL}" alt=""><div class="vr-cab-t">Relatório Vistorial<small>${r.codigo?vEsc(r.codigo)+" · ":""}${vEsc(r.unidade)} · ${formatarDataBR(r.data)}</small></div><div class="vr-cab-p"></div></div><div class="vr-corpo"></div><div class="vr-rod"><span>SESMT · Relatório vistorial ${r.codigo?vEsc(r.codigo)+" — ":"— "}${vEsc(r.unidade)}</span><span class="pg"></span></div>`;
    wrap.appendChild(f); folhas.push(f); return f;
  };
  const capa = blocos.find(b=>b.capa);
  if(capa){ const f = document.createElement("div"); f.className = "vr-folha vr-capa"; f.innerHTML = capa.html; wrap.appendChild(f); folhas.push(f); }
  const resto = blocos.filter(b=>!b.capa);
  const unidades = []; let acc = [];
  resto.forEach(b=>{ acc.push(b); if(!b.keep){ unidades.push(acc); acc = []; } });
  if(acc.length) unidades.push(acc);
  let folha = novaFolha(), corpo = folha.querySelector(".vr-corpo");
  const cabe = ()=>corpo.scrollHeight <= corpo.clientHeight+1;
  const avisos = [];
  unidades.forEach(u=>{
    const els = u.map(b=>{ const d = document.createElement("div"); d.innerHTML = b.html; return d; });
    els.forEach(e=>corpo.appendChild(e));
    if(!cabe() && corpo.children.length>els.length){
      els.forEach(e=>e.remove()); folha = novaFolha(); corpo = folha.querySelector(".vr-corpo"); els.forEach(e=>corpo.appendChild(e));
    }
    if(!cabe()) els.forEach(e=>e.classList.add("vr-compacto"));
    if(!cabe()) els.forEach(e=>e.querySelectorAll(".vr-txt,.vr-obs").forEach(n=>{ const t = n.textContent; if(t.length>600) n.textContent = t.slice(0,600)+"…"; }));
    if(!cabe()){ avisos.push("bloco maior que a folha"); console.warn("[vist] bloco maior que a folha", u.length); }
  });
  const total = folhas.length;
  folhas.forEach((f,i)=>{ const p = f.querySelector(".vr-cab-p"); if(p) p.textContent = "Folha "+(i+1)+"/"+total; const g = f.querySelector(".pg"); if(g) g.textContent = (i+1)+" / "+total; });
  return {folhas, wrap, avisos};
}

/* ---------- prévia, finalização e PDF ---------- */
async function vistRelatorioParaEmitir(){
  const r = VIST_ATUAL;
  const fim = r.finalizadoEm||new Date().toISOString();
  const exp = r.tokenExpira || new Date(new Date(fim).getTime()+VIST_TOKEN_DIAS*86400000).toISOString();
  const rel = {...r, checklist:JSON.parse(JSON.stringify(r.checklist)), finalizadoEm:fim, tokenExpira:exp};
  await vistReservarCodigosC(rel);
  const atual = await vistHashConteudo(r);
  rel.autenticidade = await vSha(JSON.stringify([(r.assinaturaMeta||{}).hash, (r.assinaturaLoja||{}).hash, atual, fim, r.codigo]));
  return rel;
}
async function vistAbrirPrevia(){
  const r = VIST_ATUAL; if(!r) return;
  const v = await vistAssinaturasValidas(r);
  if(vistPendencias(r).length || !v.ok){ alert("Complete o checklist e colete as duas assinaturas (técnico e loja) antes de emitir."); vistRenderEmitir(); return; }
  if(vistSaveTimer){ clearTimeout(vistSaveTimer); await vistSalvarAgora(); }
  const tela = document.getElementById("vt-previa"); tela.classList.add("aberta"); document.getElementById("vt-fabs").classList.remove("on");
  const corpo = document.getElementById("vt-prev-corpo"); corpo.innerHTML = '<div style="text-align:center;padding:40px;font-weight:700;color:#54412f">Montando o relatório...</div>';
  document.getElementById("vt-prev-sub").textContent = r.unidade+" · "+formatarDataBR(r.data);
  await new Promise(res=>setTimeout(res,60));
  const rel = await vistRelatorioParaEmitir();
  const { folhas, wrap } = vistMontarFolhas(rel);
  const largura = Math.max(280, corpo.clientWidth - 16);
  const pxFolha = folhas[0].offsetWidth || 794;
  const esc = Math.min(1.25, largura/pxFolha);
  corpo.innerHTML = "";
  folhas.forEach(f=>{
    const box = document.createElement("div"); box.className = "vt-prev-pg"; box.style.width = (pxFolha*esc)+"px"; box.style.height = (f.offsetHeight*esc)+"px";
    const c = f.cloneNode(true); c.style.transform = "scale("+esc+")"; box.appendChild(c); corpo.appendChild(box);
  });
  wrap.remove();
}
function vistFecharPrevia(){ document.getElementById("vt-previa").classList.remove("aberta"); if(VIST_ATUAL && !vistRO()) document.getElementById("vt-fabs").classList.add("on"); }
async function vistGerarPdf(rel){
  if(typeof html2canvas!=="function" || !(window.jspdf && window.jspdf.jsPDF)) throw new Error("Biblioteca de PDF indisponível.");
  const { folhas, wrap, avisos } = vistMontarFolhas(rel);
  try{
    const { jsPDF } = window.jspdf; const doc = new jsPDF({unit:"pt", format:"a4", compress:true});
    for(let i=0;i<folhas.length;i++){
      const canvas = await html2canvas(folhas[i], {scale:2, backgroundColor:"#ffffff", useCORS:true, logging:false});
      if(i) doc.addPage();
      doc.addImage(canvas.toDataURL("image/jpeg",.9), "JPEG", 0, 0, 595.28, 841.89);
    }
    const slug = String(rel.unidade).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase();
    return {blob:doc.output("blob"), nome:(rel.codigo ? "relatorio-vistorial_"+rel.codigo : "relatorio-vistorial_"+slug+"_"+rel.data)+".pdf", avisos};
  } finally { wrap.remove(); }
}
async function vistFinalizar(){
  const r = VIST_ATUAL; if(!r) return;
  if(!confirm("Finalizar o relatório? Depois de emitido não poderá mais ser editado e as fotos serão descartadas da plataforma (elas ficam apenas no PDF).")) return;
  const btn = document.getElementById("vt-prev-fin"); btn.disabled = true; btn.textContent = "Gerando PDF...";
  const volta = ()=>{ btn.disabled = false; btn.textContent = "Finalizar e gerar PDF"; };
  const v = await vistAssinaturasValidas(r);
  if(!v.ok){ alert("As assinaturas não estão válidas para o conteúdo atual. Colete-as novamente."); volta(); return; }
  let rel, pdf;
  try{ rel = await vistRelatorioParaEmitir(); pdf = await vistGerarPdf(rel); }
  catch(e){ console.error(e); alert("Não foi possível gerar o PDF: "+e.message); volta(); return; }
  // pontos do checklist (C/A e N/C) viram itens rastreáveis C####
  const linhasC = [];
  rel.checklist.forEach(g=>g.itens.forEach(it=>{ if(it.cod) linhasC.push({relatorio_id:r.id, unidade:r.unidade, origem:"C", numero:it.cod, tipo:g.grupo, local:g.grupo, risco_desvio:it.titulo+(it.t?" — "+it.t.trim():""), riscos_expostos:[], prazo_dias:30, data_limite:vAddDias(r.data,30),
    gut_classe:it.r==="NC"?"N/C":"C/A", gut_rotulos:{cor:it.r==="NC"?"#b91c1c":"#b45309"}, status:"Notificado"}); }));
  await sb.from("vist_inconformidades").delete().eq("relatorio_id", r.id).eq("origem", "C");
  if(linhasC.length){
    const ins = await sb.from("vist_inconformidades").insert(linhasC);
    if(ins.error){ alert("O PDF foi gerado, mas não foi possível registrar os pontos do checklist: "+ins.error.message); volta(); return; }
  }
  const check = JSON.parse(JSON.stringify(rel.checklist));
  check.forEach(g=>g.itens.forEach(i=>{ if((i.f||[]).length){ i.fotos = i.f.length; } i.f = []; }));
  const c = vistContarResp(r), ck = vistContarCheck(r);
  const agora = rel.finalizadoEm;
  const { error } = await sb.from("vist_relatorios").update({status:"Finalizado", finalizado_em:agora, token_expira:rel.tokenExpira, checklist:check, itens_total:c.t, itens_resp:c.ok, n_c:ck.C, n_ca:ck.CA, n_nc:ck.NC, autenticidade:rel.autenticidade}).eq("id", r.id);
  if(error){ alert("O PDF foi gerado, mas não foi possível finalizar o relatório: "+error.message); volta(); return; }
  await sb.from("vist_inconformidades").update({foto:null}).eq("relatorio_id", r.id);
  const idsLoja = (r.pend||[]).filter(x=>x.status==="Concluído" && x.resolvido_por==="loja" && x.verificado_relatorio_id!==r.id).map(x=>x.id);
  if(idsLoja.length) await sb.rpc("vist_encerrar_pendencias", {p_rel:r.id, p_ids:idsLoja});
  await sb.rpc("vist_descartar_fotos_verificadas", {p_rel:r.id});
  VIST_PDF = pdf;
  volta(); vistFecharPrevia();
  await vistAbrir(r.id);
  vistMostrarEntrega();
}
function vistMostrarEntrega(){
  const corpo = `<div style="text-align:center;padding:6px 0 14px"><div style="font-size:42px;line-height:1">✅</div><div style="font-weight:800;font-size:17px;color:var(--verde-esc);margin:8px 0 4px">Relatório emitido</div>
    <div style="font-size:13px;color:var(--areia-esc)">As fotos foram descartadas da plataforma. Guarde o PDF agora: compartilhe ou salve em downloads.</div></div>
    <div style="display:flex;flex-direction:column;gap:10px"><button type="button" class="vt-btn-gr" onclick="vistCompartilhar()">Compartilhar PDF</button><button type="button" class="vt-btn-sec" onclick="vistBaixar()">Salvar em downloads</button></div>`;
  vistJanela("vt-jan-entrega","#00733f",VIST_ICO.check,"Relatório vistorial",vEsc(VIST_ATUAL.unidade),corpo,`<button type="button" class="vt-btn-x" style="width:100%;color:var(--marrom-esc);border-color:var(--areia-esc);font-size:15px" onclick="vistFecharJanela('vt-jan-entrega')">Fechar</button>`,true);
}
function vistBaixar(){
  if(!VIST_PDF) return; const a = document.createElement("a"); a.href = URL.createObjectURL(VIST_PDF.blob); a.download = VIST_PDF.nome; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 4000); mostrarToast("PDF salvo em downloads.");
}
async function vistCompartilhar(){
  if(!VIST_PDF) return;
  const file = new File([VIST_PDF.blob], VIST_PDF.nome, {type:"application/pdf"});
  try{
    if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:"Relatório vistorial — "+VIST_ATUAL.unidade}); return; }
  }catch(e){ if(e && e.name==="AbortError") return; }
  vistBaixar(); mostrarToast("Compartilhamento indisponível neste aparelho; o PDF foi baixado.");
}
async function vistBaixarSemFotos(){
  const r = VIST_ATUAL; mostrarToast("Gerando PDF...");
  try{ VIST_PDF = await vistGerarPdf({...r}); vistBaixar(); }
  catch(e){ console.error(e); alert("Não foi possível gerar o PDF."); }
}

/* ---------- check-out só depois do relatório finalizado ---------- */
async function vistBloqueiaCheckout(visitaId){
  const vv = AGENDA.find(x=>x.id===visitaId); if(vv && calEhLocalTrabalho(vv.unidade)) return false;
  const { data, error } = await sb.from("vist_relatorios").select("id,status").eq("agenda_id", visitaId);
  if(error) return false;           // se não der para consultar, não trava o usuário
  const rels = data||[];
  if(rels.some(x=>x.status==="Finalizado")) return false;
  const rasc = rels.find(x=>x.status!=="Finalizado");
  if(rasc){ if(confirm("Este check-out só é liberado depois de finalizar o relatório vistorial da visita.\n\nAbrir o relatório agora?")){ irParaView("inspecoes"); setTimeout(()=>vistAbrir(rasc.id), 250); } }
  else { if(confirm("Este check-out só é liberado depois de emitir o relatório vistorial da visita.\n\nIniciar o relatório agora?")){ irParaView("inspecoes"); setTimeout(()=>vistNovo(), 400); } }
  return true;
}

/* ---------- Início: card de planos de ação ---------- */
async function vistCarregarAcoes(){
  if(!currentUser) return;
  const { data, error } = await sb.from("vist_acoes").select("*").eq("responsavel_id", currentUser.id).eq("concluida", false).order("data").limit(100);
  if(error){ return; }
  VIST_ACOES = data||[]; VIST_ACOES_TS = Date.now();
}
async function renderInicioPlanos(){
  const el = document.getElementById("inicio-planos"); if(!el) return;
  if(Date.now()-VIST_ACOES_TS > 30000) await vistCarregarAcoes();
  const l = VIST_ACOES.filter(a=>!a.concluida).sort((a,b)=>a.data<b.data?-1:1).slice(0,8);
  if(!l.length){ el.innerHTML = vazioInicio("Nenhum plano de ação pendente."); return; }
  const h = vHoje();
  el.innerHTML = l.map(a=>{
    const atras = a.data < h, hoje = a.data===h;
    const cor = atras ? "#c62828" : hoje ? "#e08a00" : "#2e7d32";
    const rot = atras ? "Atrasada" : hoje ? "Hoje" : formatarDataBR(a.data).slice(0,5);
    return `<div class="vp-it"><button type="button" class="vp-ck" title="Marcar como concluída" onclick="vistConcluirAcao(${a.id})">✓</button>
      <div class="vp-tx"><b>${vEsc(a.descricao.slice(0,90))}</b><small>${vEsc(a.ref||(a.origem==="ocorrencia"?"Ocorrência":"Inconformidade"))} · ${vEsc(a.unidade||"")}</small></div><span class="vp-dt" style="color:${cor}">${rot}</span></div>`;
  }).join("");
}
async function vistConcluirAcao(id){
  const { error } = await sb.from("vist_acoes").update({concluida:true, concluida_em:new Date().toISOString()}).eq("id", id);
  if(error){ alert("Não foi possível concluir a ação."); return; }
  VIST_ACOES = VIST_ACOES.filter(a=>a.id!==id); renderInicioPlanos(); mostrarToast("Plano de ação concluído.");
}


