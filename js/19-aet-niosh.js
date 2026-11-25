/* =====================================================================
   AET > MÉTODO NIOSH — equação de levantamento de carga do NIOSH
   ===================================================================== */

let AET_NIOSH = [];
let AET_NIOSH_CARREGADO = false;

// Converte do formato do banco para o do app:: map aet niosh from db
function mapAetNioshFromDb(r){
  return {
    id:r.id, criadoEm:r.created_at, criadoPor:r.criado_por,
    nome:r.nome_trabalhador||"", empresa:r.empresa||"", unidade:r.unidade||"",
    setor:r.setor||"", funcao:r.funcao||"", peca:r.peca_levantada||"",
    h:r.h, v:r.v, d:r.d, a:r.a, frequencia:r.frequencia, duracao:r.duracao, pega:r.pega,
    f:r.f, qp:r.qp, p:r.p, lpr:r.lpr, il:r.il, classificacao:r.classificacao||""
  };
}

// Tabela do Fator Frequência (F): [levantamentos/min, até1h V<75, até1h V≥75, até2h V<75, até2h V≥75, até8h V<75, até8h V≥75]
const AET_TABELA_F = [
  [0.2, 1.00,1.00, 0.95,0.95, 0.85,0.85],
  [0.5, 0.97,0.97, 0.92,0.92, 0.81,0.81],
  [1,   0.94,0.94, 0.88,0.88, 0.75,0.75],
  [2,   0.91,0.91, 0.84,0.84, 0.65,0.65],
  [3,   0.88,0.88, 0.79,0.79, 0.55,0.55],
  [4,   0.84,0.84, 0.72,0.72, 0.45,0.45],
  [5,   0.80,0.80, 0.60,0.60, 0.35,0.35],
  [6,   0.75,0.75, 0.50,0.50, 0.27,0.27],
  [7,   0.70,0.70, 0.42,0.42, 0.22,0.22],
  [8,   0.60,0.60, 0.35,0.35, 0.18,0.18],
  [9,   0.52,0.52, 0.30,0.30, 0.00,0.15],
  [10,  0.45,0.45, 0.26,0.26, 0.00,0.13],
  [11,  0.41,0.41, 0.23,0.23, 0.00,0.00],
  [12,  0.37,0.37, 0.00,0.21, 0.00,0.00],
  [13,  0.00,0.34, 0.00,0.00, 0.00,0.00],
  [14,  0.00,0.31, 0.00,0.00, 0.00,0.00],
  [15,  0.00,0.28, 0.00,0.00, 0.00,0.00],
];
const AET_TABELA_QP = { "Boa":[1.00,1.00], "Razoável":[0.95,1.00], "Pobre":[0.90,0.90] };

// Calcula o Fator Frequência: arredonda a frequência informada pra cima, pro
// próximo valor da tabela oficial do NIOSH (mais conservador do que
// interpolar) — e escolhe a coluna certa conforme a duração e o V informado.
function aetFatorFrequencia(freq, duracaoHoras, v){
  if(freq==null || isNaN(freq) || freq<0) return null;
  const colBase = duracaoHoras===1 ? 1 : duracaoHoras===2 ? 3 : 5; // índice da coluna "V<75" de cada bloco
  const col = colBase + (v>=75 ? 1 : 0);
  if(freq>15) return 0;
  const linha = AET_TABELA_F.find(l=>freq<=l[0]);
  if(!linha) return 0;
  return linha[col];
}

// Calcula o fator da Qualidade da Pega (QP) conforme a pega escolhida e o V informado
function aetFatorQp(pega, v){
  const par = AET_TABELA_QP[pega];
  if(!par) return null;
  return v>=75 ? par[1] : par[0];
}

// Fatores de H, V, D e A da fórmula do LPR, já com os limites do método NIOSH aplicados
function aetFatorH(h){ if(h<=25) return 1; if(h>63) return 0; return 25/h; }
function aetFatorV(v){ if(v>175) return 0; return 1 - (0.003*Math.abs(v-75)); }
function aetFatorD(d){ if(d<=25) return 1; if(d>175) return 0; return 0.82 + (4.5/d); }
function aetFatorA(a){ if(a>135) return 0; return 1 - (0.0032*a); }

// Lê os campos do formulário e calcula LPR/IL — devolve null (e mostra alerta)
// se algum campo obrigatório estiver vazio ou inválido
function aetLerELcular(){
  const num = id=>{ const v = document.getElementById(id).value; return v===""? NaN : parseFloat(v); };
  const h = num("an-h"), v = num("an-v"), d = num("an-d"), a = num("an-a"), p = num("an-p"), freq = num("an-freq");
  const duracao = parseInt(document.getElementById("an-duracao").value, 10);
  const pega = document.getElementById("an-pega").value;

  const campos = {H:h, V:v, D:d, A:a, "Peso (P)":p, "Frequência":freq};
  const faltando = Object.keys(campos).filter(k=>isNaN(campos[k]));
  if(faltando.length){ alert("Preencha os campos: "+faltando.join(", ")+"."); return null; }
  if(a<0 || a>135){ alert('O ângulo "A" deve estar entre 0° e 135° (veja "Como usar").'); return null; }

  const fatorH = aetFatorH(h), fatorV = aetFatorV(v), fatorD = aetFatorD(d), fatorA = aetFatorA(a);
  const f = aetFatorFrequencia(freq, duracao, v);
  const qp = aetFatorQp(pega, v);
  const lpr = 23 * fatorH * fatorV * fatorD * fatorA * f * qp;
  const il = lpr>0 ? (p/lpr) : (p>0 ? Infinity : 0);

  return { h,v,d,a,p,freq,duracao,pega, f, qp, lpr:Math.round(lpr*100)/100, il:Number.isFinite(il)?Math.round(il*100)/100:il };
}

// Calcula e mostra: calcular niosh
function aetCalcularNiosh(){
  const r = aetLerELcular();
  if(!r) return;
  const bom = r.il<=1;
  const wrap = document.getElementById("an-resultado");
  wrap.style.display = "block";
  wrap.classList.toggle("aet-ruim", !bom);
  document.getElementById("an-out-lpr").textContent = Number.isFinite(r.lpr) ? r.lpr.toLocaleString("pt-BR") : "0";
  document.getElementById("an-out-il").textContent = Number.isFinite(r.il) ? r.il.toLocaleString("pt-BR") : "∞";
  const classWrap = document.getElementById("an-out-classificacao-wrap");
  classWrap.classList.toggle("bom", bom); classWrap.classList.toggle("ruim", !bom);
  document.getElementById("an-out-emoji").textContent = bom ? "🙂" : "🙁";
  document.getElementById("an-out-classificacao").textContent = bom ? "Bom" : "Ruim";
  document.getElementById("an-out-msg").textContent = r.lpr<=0
    ? "Com essas medidas, o método considera esse levantamento inviável com segurança — revise a postura, a distância ou o ângulo antes de tudo."
    : bom ? "Não há riscos elevados de desenvolver dor na região lombar com essas condições."
          : "Risco elevado de dor lombar. Quanto mais o IL se afasta de 1, maior o risco — o ideal é redesenhar a tarefa.";
  wrap.scrollIntoView({behavior:"smooth", block:"nearest"});
  wrap.dataset.ultimoCalculo = JSON.stringify(r);
}

// Salva: salvar niosh
async function aetSalvarNiosh(){
  const r = aetLerELcular();
  if(!r) return;
  aetCalcularNiosh();
  const nome = document.getElementById("an-nome").value.trim();
  if(!nome){ alert("Informe o nome do colaborador antes de salvar."); return; }

  const linha = {
    criado_por: currentUser ? currentUser.id : null,
    nome_trabalhador: nome,
    empresa: document.getElementById("an-empresa").value.trim() || null,
    unidade: document.getElementById("an-unidade").value || null,
    setor: document.getElementById("an-setor").value || null,
    funcao: document.getElementById("an-funcao").value || null,
    peca_levantada: document.getElementById("an-peca").value.trim() || null,
    h:r.h, v:r.v, d:r.d, a:r.a, frequencia:r.freq, duracao:String(r.duracao), pega:r.pega,
    f:r.f, qp:r.qp, p:r.p, lpr:r.lpr, il:Number.isFinite(r.il) ? r.il : 9999,
    classificacao: r.il<=1 ? "Bom" : "Ruim"
  };
  const { data, error } = await sb.from("aet_niosh").insert(linha).select().single();
  if(error){ alert("Não foi possível salvar: "+error.message); return; }
  AET_NIOSH.unshift(mapAetNioshFromDb(data));
  mostrarToast("Avaliação salva.");
  aetRenderHistorico();
}

// Limpa: limpar niosh
function aetLimparNiosh(){
  ["an-nome","an-empresa","an-peca","an-h","an-v","an-d","an-a","an-p","an-freq"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("an-unidade").value = "";
  document.getElementById("an-setor").value = "";
  document.getElementById("an-funcao").value = "";
  document.getElementById("an-duracao").value = "8";
  document.getElementById("an-pega").value = "Razoável";
  document.getElementById("an-resultado").style.display = "none";
}

// Exclui: excluir niosh
async function aetExcluirNiosh(id){
  if(!confirm("Excluir essa avaliação do histórico?")) return;
  const { error } = await sb.from("aet_niosh").delete().eq("id", id);
  if(error){ alert("Não foi possível excluir: "+error.message); return; }
  AET_NIOSH = AET_NIOSH.filter(x=>x.id!==id);
  mostrarToast("Avaliação excluída.");
  aetRenderHistorico();
}

// Preenche os selects de Unidade/Setor/Função e a datalist de Empresas
function aetPopularFiltros(){
  const fill = (id, arr, placeholder)=>{
    const sel = document.getElementById(id);
    if(!sel) return;
    const atual = sel.value;
    sel.innerHTML = `<option value="">${placeholder}</option>` + arr.map(v=>`<option>${escHtml(v)}</option>`).join("");
    if(arr.includes(atual)) sel.value = atual;
  };
  fill("an-unidade", (typeof UNIDADES!=="undefined"?UNIDADES:[]).map(u=>u.nome).sort((a,b)=>cmpPtBr(a,b)), "Selecione...");
  const estrutura = (typeof ESTRUTURA!=="undefined" && ESTRUTURA) ? ESTRUTURA : {setores:[], funcoes:[]};
  fill("an-setor", (estrutura.setores||[]).slice().sort((a,b)=>cmpPtBr(a,b)), "Selecione...");
  fill("an-funcao", (estrutura.funcoes||[]).slice().sort((a,b)=>cmpPtBr(a,b)), "Selecione...");

  const unidadesHist = document.getElementById("an-hist-unidade");
  if(unidadesHist){
    const atual = unidadesHist.value;
    const vistas = [...new Set(AET_NIOSH.map(x=>x.unidade).filter(Boolean))].sort((a,b)=>cmpPtBr(a,b));
    unidadesHist.innerHTML = '<option value="">Todas</option>' + vistas.map(v=>`<option>${escHtml(v)}</option>`).join("");
    if(vistas.includes(atual)) unidadesHist.value = atual;
  }

  const dl = document.getElementById("aet-dl-empresas");
  if(dl){
    const empresas = [...new Set(AET_NIOSH.map(x=>x.empresa).filter(Boolean))].sort((a,b)=>cmpPtBr(a,b));
    dl.innerHTML = empresas.map(e=>`<option value="${escHtml(e)}">`).join("");
  }
}

// Desenha na tela: render historico aet niosh
function aetRenderHistorico(){
  const tb = document.getElementById("tbl-aet-niosh");
  if(!tb) return;
  const unidade = document.getElementById("an-hist-unidade").value;
  const busca = normalizarTextoComparacao(document.getElementById("an-hist-busca").value);
  const lista = AET_NIOSH.filter(x=>{
    if(unidade && x.unidade!==unidade) return false;
    if(busca && !normalizarTextoComparacao(x.nome).includes(busca)) return false;
    return true;
  });
  if(!lista.length){
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--areia-esc);padding:16px;">Nenhuma avaliação encontrada.</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(x=>`<tr>
    <td>${formatarDataBR(x.criadoEm)}</td>
    <td>${escHtml(x.nome)}</td>
    <td>${escHtml(x.unidade||"—")}</td>
    <td>${escHtml(x.peca||"—")}</td>
    <td>${x.p!=null ? x.p.toLocaleString("pt-BR") : "—"}</td>
    <td>${x.lpr!=null ? x.lpr.toLocaleString("pt-BR") : "—"}</td>
    <td>${x.il!=null ? (x.il>=9999? "∞" : x.il.toLocaleString("pt-BR")) : "—"}</td>
    <td><span class="tag-status ${x.classificacao==="Bom"?"concluido":"notificado"}">${escHtml(x.classificacao||"—")}</span></td>
    <td><button type="button" class="small-btn danger" onclick="aetExcluirNiosh(${x.id})">Excluir</button></td>
  </tr>`).join("");
}

// Abre: abrir ajuda aet
function aetAbrirAjuda(){
  document.getElementById("modal-aet-ajuda").style.display = "flex";
  aetIrParaAjuda("ah-intro");
}
// Fecha: fechar ajuda aet
function aetFecharAjuda(){ document.getElementById("modal-aet-ajuda").style.display = "none"; }
// Vai para a seção clicada na navegação da ajuda
function aetIrParaAjuda(secId){
  const sec = document.getElementById(secId);
  if(sec) sec.scrollIntoView({block:"start"});
  document.querySelectorAll(".aet-help-nav button").forEach(b=>b.classList.remove("ativo"));
  const idx = ["ah-intro","ah-h","ah-v","ah-d","ah-a","ah-f","ah-qp","ah-p","ah-lpr","ah-il"].indexOf(secId);
  const btn = document.querySelectorAll(".aet-help-nav button")[idx];
  if(btn) btn.classList.add("ativo");
}

// Inicializa o módulo AET > Método NIOSH (chamado toda vez que o painel abre)
async function initAetNiosh(){
  aetPopularFiltros();
  if(!AET_NIOSH_CARREGADO){
    const { data, error } = await sb.from("aet_niosh").select("*").order("id", {ascending:false}).limit(500);
    if(!error){ AET_NIOSH = (data||[]).map(mapAetNioshFromDb); AET_NIOSH_CARREGADO = true; aetPopularFiltros(); }
  }
  aetRenderHistorico();
}
