/* =====================================================================
   PÁGINA PÚBLICA DA LOJA (QR Code) — confirmação de token e resolução de pendências pela loja
   ===================================================================== */

// Função do módulo: pub esc
function pubEsc(s){ return vEsc(s); }

// Função do módulo: pub iniciar
function pubIniciar(){
  const q = new URLSearchParams(location.search);
  PUB.un = (q.get("u")||"").trim();
  const root = document.createElement("div"); root.id = "pub-root";
  root.innerHTML = `<div class="pub-topo"><img src="${HORTIFRUTI_LOGO_DATAURL}" alt=""><b>Verificação de inconformidades</b></div><div class="pub-corpo" id="pub-corpo"></div>`;
  document.body.appendChild(root); pubTelaToken();
}

// Função do módulo: pub tela token
function pubTelaToken(msg){
  document.getElementById("pub-corpo").innerHTML = `<div class="pub-box"><h2>${PUB.un?pubEsc(PUB.un):"Acompanhamento do relatório"}</h2>
    <p>Digite o <b>token</b> impresso no relatório vistorial para ver as inconformidades e informar o que já foi solucionado.</p>
    <input class="pub-in tok" id="pub-tok" maxlength="8" placeholder="TOKEN" autocomplete="off" autocapitalize="characters" spellcheck="false" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')" onkeydown="if(event.key==='Enter')pubEntrar()">
    <button type="button" class="pub-btn" id="pub-ok" onclick="pubEntrar()">Acessar</button>
    ${msg?`<div class="pub-erro">${pubEsc(msg)}</div>`:""}</div><div class="pub-rod">Segurança do Trabalho · Hortifruti Natural da Terra</div>`;
}

// Função do módulo: pub entrar
async function pubEntrar(){
  const tok = (document.getElementById("pub-tok").value||"").trim();
  if(tok.length<8){ pubTelaToken("O token tem 8 caracteres."); return; }
  const btn = document.getElementById("pub-ok"); btn.disabled = true; btn.textContent = "Verificando...";
  const { data, error } = await sb.rpc("vist_publico_consultar", {p_token:tok, p_unidade:PUB.un||null});
  if(error || !data){ pubTelaToken("Não foi possível consultar agora. Tente novamente."); return; }
  if(!data.ok){ pubTelaToken(PUB_ERROS[data.erro]||"Não foi possível acessar."); return; }
  PUB.token = tok; PUB.dados = data; pubTelaLista();
}

// Função do módulo: pub tela lista
function pubTelaLista(aviso){
  const d = PUB.dados, k = d.kpi || {};
  const tot = (k.c||0)+(k.ca||0)+(k.nc||0), conf = tot ? Math.round(k.c/tot*100) : null;
  const taxa = k.total ? Math.round((k.concluidas||0)/k.total*100) : 100;
  const ord = d.itens.slice().sort((a,b)=>((a.status==="Concluído")-(b.status==="Concluído")) || String(a.origem).localeCompare(String(b.origem)) || a.numero-b.numero);
  const cards = ord.map(i=>{
    const fim = i.status==="Concluído", cod = vCod(i.origem, i.numero);
    return `<div class="pub-it ${fim?"fim":"aberta"}" id="pub-it-${i.id}"><div class="pub-it-t"><span class="pub-num">${cod}</span><span class="pub-cl" style="background:${pubEsc(i.cor||"#000")}">${pubEsc(i.classe||"")}</span><span class="pub-st">${pubEsc(i.status)}</span></div>
      <div class="pub-it-b"><b>${pubEsc(i.local||"")}</b> — ${pubEsc(i.risco||"")}</div>
      <div class="pub-it-m">${pubEsc(i.tipo||"")} · Prazo: ${formatarDataBR(i.limite)} · Relatório ${pubEsc(i.relatorio||"")}</div>
      ${fim && i.resolvido_por==="loja" ? `<div class="pub-it-m" style="color:#15803d">✓ Resolvido pela loja${i.declarado_nome?" por "+pubEsc(i.declarado_nome):""}.</div>` : ""}
      ${!fim ? `<button type="button" class="pub-btn sec" onclick="pubAbrirForm(${i.id})">Informar que foi solucionado</button><div id="pub-f-${i.id}"></div>` : ""}</div>`;
  }).join("");
  document.getElementById("pub-corpo").innerHTML = `<div class="pub-box"><h2>${pubEsc(d.unidade)}</h2><p>Relatório <b>${pubEsc(d.codigo||"")}</b> · ${formatarDataBR(d.data)} · token válido até ${formatarDataBR(String(d.expira).slice(0,10))}.<br>Toque no item que já foi resolvido na loja e envie a foto da correção.</p>
    <div class="pub-kpis"><div><b>${conf===null?"—":conf+"%"}</b><span>Conformidade</span></div><div><b>${taxa}%</b><span>Taxa resolutiva</span></div><div><b>${k.abertas||0}</b><span>Em aberto</span></div><div><b style="${k.vencidas?"color:#b91c1c":""}">${k.vencidas||0}</b><span>Vencidos</span></div></div>
    <div class="pub-barra"><i style="width:${taxa}%"></i></div>${aviso?`<div class="pub-ok">${pubEsc(aviso)}</div>`:""}</div>
    ${cards||'<div class="pub-box" style="margin-top:12px">Nenhum item registrado.</div>'}<div class="pub-rod">Os itens resolvidos aqui constam como concluídos e o técnico responsável é avisado.</div>`;
}

// Função do módulo: pub abrir form
function pubAbrirForm(id){
  PUB.foto = null;
  document.querySelectorAll("[id^=pub-f-]").forEach(e=>e.innerHTML="");
  document.getElementById("pub-f-"+id).innerHTML = `<div class="pub-form"><label>Sua matrícula</label><input class="pub-in" id="pub-mat" inputmode="numeric" placeholder="Matrícula" autocomplete="off">
    <label style="margin-top:12px">Foto da correção (opcional)</label><div id="pub-foto"><button type="button" class="pub-btn sec" style="margin-top:0" onclick="pubFoto()">📷 Tirar foto da correção</button></div>
    <textarea id="pub-obs" placeholder="O que foi feito? (opcional)"></textarea><button type="button" class="pub-btn" id="pub-conf" onclick="pubDeclarar(${id})">Confirmar</button><div id="pub-msg"></div></div>`;
  document.getElementById("pub-mat").focus();
}

// Função do módulo: pub foto
function pubFoto(){
  vistEscolherFoto(url=>{ PUB.foto = url; document.getElementById("pub-foto").innerHTML = `<img src="${url}" alt="Foto" style="max-width:100%;max-height:220px;border-radius:12px;border:2px solid #e3d5bf;display:block"><button type="button" class="pub-btn sec" style="margin-top:8px" onclick="pubFoto()">Trocar foto</button>`; });
}

// Função do módulo: pub declarar
async function pubDeclarar(id){
  const mat = (document.getElementById("pub-mat").value||"").trim(), obs = document.getElementById("pub-obs").value;
  const msg = document.getElementById("pub-msg");
  if(!mat){ msg.innerHTML = '<div class="pub-erro">Informe a sua matrícula.</div>'; return; }
  const btn = document.getElementById("pub-conf"); btn.disabled = true; btn.textContent = "Enviando...";
  const { data, error } = await sb.rpc("vist_publico_declarar", {p_token:PUB.token, p_unidade:PUB.un||null, p_matricula:mat, p_inc_id:id, p_obs:obs, p_foto:PUB.foto||null});
  if(error || !data || !data.ok){ btn.disabled = false; btn.textContent = "Confirmar"; msg.innerHTML = '<div class="pub-erro">'+pubEsc((data&&PUB_ERROS[data.erro])||"Não foi possível enviar. Tente novamente.")+'</div>'; return; }
  const it = PUB.dados.itens.find(i=>i.id===id);
  if(it){ it.status = "Concluído"; it.resolvido_por = "loja"; it.declarado_nome = data.nome; const k = PUB.dados.kpi; if(k){ k.concluidas = (k.concluidas||0)+1; k.abertas = Math.max(0,(k.abertas||0)-1); if(it.limite && it.limite < vHoje()) k.vencidas = Math.max(0,(k.vencidas||0)-1); } }
  PUB.foto = null;
  pubTelaLista("Obrigado, "+data.nome+". O item foi registrado como concluído e o técnico de segurança foi avisado.");
  window.scrollTo(0,0);
}

