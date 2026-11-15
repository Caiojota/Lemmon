/* =====================================================================
   INÍCIO — página inicial do usuário (check-in do dia, resumo, avisos e planos)
   ===================================================================== */

// Função do módulo: saudacao inicio
/* =====================================================================
   INÍCIO — página inicial do usuário (check-in do dia, resumo e avisos)
   ===================================================================== */
function saudacaoInicio(){ const h = new Date().getHours(); return h<12 ? "Bom dia" : h<18 ? "Boa tarde" : "Boa noite"; }

// Abre: abrir modulo inicio
function abrirModuloInicio(view, sub){
  if(view==="agenda"){
    irParaView("calendario");
    if(sub==="minha"){
      if(!currentUser || !(currentUser.modulos||[]).includes("agenda")){ mostrarToast("Você não tem acesso ao agendamento de visitas."); return; }
      abrirModalVisitaAgenda();
    } else { calModo = sub==="mensal" ? "mes" : "semana"; renderCalendario(); }
    return;
  }
  if(!currentUser || !currentUser.modulos.includes(view)){ mostrarToast("Você não tem acesso a este módulo."); return; }
  irParaView(view);
}

// Abre: abrir demanda inicio
function abrirDemandaInicio(id){
  if(!currentUser || !currentUser.modulos.includes("demandas")){ mostrarToast("Você não tem acesso a este módulo."); return; }
  irParaView("demandas");
  setTimeout(()=>abrirModalDemanda(id), 250);
}

// Desenha na tela: render inicio
function renderInicio(){
  if(!currentUser || !document.getElementById("inicio-hero")) return;
  renderInicioHero();
  renderInicioSessao();
  renderCheckinHoje();
  renderInicioCalendario();
  carregarReunioesParaCalendario();
  renderInicioKpis();
  renderInicioProximas();
  renderInicioDemandas();
  renderInicioAtencao();
  renderInicioEquipe();
  renderInicioAvisos();
  renderInicioPlanos();
}

// Desenha na tela: render inicio hero
function renderInicioHero(){
  const el = document.getElementById("inicio-hero");
  const dataTxt = maiusc1(new Date().toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long", year:"numeric"}));
  const foto = currentUser.foto
    ? `<img src="${escHtml(currentUser.foto)}" alt="">`
    : escHtml(iniciaisTexto(currentUser.nome));
  el.innerHTML = `
    <div class="in-hero-id">
      <span class="in-foto" aria-hidden="true">${foto}</span>
      <div>
        <span class="in-data-hoje">${escHtml(dataTxt)}</span>
        <h3>${saudacaoInicio()}, ${escHtml(primeiroNomeAgenda(currentUser.nome))}!</h3>
      </div>
    </div>
    <span class="in-perfil">${escHtml(currentUser.perfil)}</span>`;
}

// Desenha na tela: render checkin hoje
// Check-in / check-out: um único card, que segue a agenda do dia (manhã primeiro; ao concluir, aparece a tarde)
function renderCheckinHoje(){
  const wrap = document.getElementById("checkin-hoje");
  if(!wrap || !currentUser) return;
  const hojeISO = dataISOLocal(new Date());
  const hoje = AGENDA.filter(v=>v.usuarioId===currentUser.id && v.data===hojeISO && v.status!=="Rejeitado")
    .sort((a,b)=>(ORDEM_PERIODO_AGENDA[a.periodo]??9)-(ORDEM_PERIODO_AGENDA[b.periodo]??9));
  if(!hoje.length){
    wrap.innerHTML = '<div class="ck-vazio"><b>Sem visita para hoje.</b><span>Quando você tiver uma visita agendada para o dia, o check-in aparece aqui.</span></div>';
    return;
  }
  const v = hoje.find(x=>!x.checkout) || hoje[hoje.length-1];
  const hora = reg => escHtml(horaDoRegistroAgenda(reg) || (reg && reg.hora) || "");
  const aprovada = v.status==="Aprovado";
  const todasConcluidas = hoje.every(x=>x.checkout);
  const passo = (cls, rotulo, sub)=>`<div class="ck-passo ${cls}"><i></i><b>${rotulo}</b><small>${sub||"&nbsp;"}</small></div>`;
  const passos =
    passo(aprovada ? "feito" : "aviso", aprovada ? "Agendada" : "Aguardando", aprovada ? "aprovada" : "aprovação")
    + passo(v.checkin ? "feito" : (aprovada ? "atual" : ""), "Check-in", v.checkin ? hora(v.checkin)+linkGeo(v.checkin.geo, "Ver local do check-in no mapa") : "")
    + passo(v.checkout ? "feito saida" : (v.checkin ? "atual" : ""), "Check-out", v.checkout ? hora(v.checkout)+linkGeo(v.checkout.geo, "Ver local do check-out no mapa") : "");
  let acao;
  if(!aprovada) acao = '<div class="ck-msg">O check-in é liberado depois que o organizador aprovar a visita.</div>';
  else if(!v.checkin) acao = `<button type="button" class="btn-primary ck-btn" onclick="fazerCheckin(${v.id})">Fazer check-in</button>`;
  else if(!v.checkout) acao = `<button type="button" class="btn-secondary ck-btn" onclick="fazerCheckout(${v.id})">Fazer check-out</button>`;
  else acao = '<div class="ck-msg ok">✓ '+(hoje.length>1 && todasConcluidas ? "Todas as visitas de hoje concluídas" : "Visita concluída")+'</div>';
  const seq = hoje.length>1 ? `<span class="ck-seq">Visita ${hoje.indexOf(v)+1} de ${hoje.length}</span>` : "";
  wrap.innerHTML = `<div class="ck-grid"><div class="ck-card ${aprovada?"":"pendente"} ${v.checkout?"concluida":""}">
      <div class="ck-topo"><span class="ck-un">${escHtml(v.unidade)}</span><span style="display:flex; gap:6px; align-items:center;">${seq}<span class="ck-per">${escHtml(v.periodo)}</span></span></div>
      <div class="ck-mot">${escHtml(v.motivo||"")}</div>
      <div class="ck-passos">${passos}</div>
      ${acao}
    </div></div>`;
}

// Função do módulo: demandas abertas do usuario
function demandasAbertasDoUsuario(){
  return DEMANDAS.filter(d=>d.responsavelUsuarioId===currentUser.id && !d.entregueEm)
    .sort((a,b)=>{ if(!a.dataLimite) return 1; if(!b.dataLimite) return -1; return a.dataLimite<b.dataLimite?-1:a.dataLimite>b.dataLimite?1:0; });
}

// Desenha na tela: render inicio kpis
function renderInicioKpis(){
  const el = document.getElementById("inicio-kpis");
  const seg = segundaDaSemana(0), sex = new Date(seg); sex.setDate(seg.getDate()+4);
  const iniSem = dataISOLocal(seg), fimSem = dataISOLocal(sex);
  const minhasSemana = AGENDA.filter(v=>v.usuarioId===currentUser.id && v.status!=="Rejeitado" && v.data>=iniSem && v.data<=fimSem).length;
  const abertas = demandasAbertasDoUsuario();
  const atrasadas = abertas.filter(d=>calcularControlePrazo(d.dataLimite, d.entregueEm).label==="Atrasado").length;
  const organizador = podeAprovarAgenda(currentUser);
  const pendentes = AGENDA.filter(v=>v.status==="Pendente" && (organizador || v.usuarioId===currentUser.id)).length;
  const avisos = avisosPendentes().length;
  const tile = (cor, rotulo, valor, rodape, clique)=>`
    <button type="button" class="in-kpi ${cor}" onclick="${clique}">
      <span class="in-kpi-lbl">${rotulo}</span><span class="in-kpi-val">${valor}</span><span class="in-kpi-foot">${rodape}</span>
    </button>`;
  el.innerHTML =
      tile("k-verde", "Minhas visitas na semana", minhasSemana, dataBR(iniSem).slice(0,5)+" a "+dataBR(fimSem).slice(0,5), "abrirModuloInicio('agenda','semanal')")
    + tile(atrasadas ? "k-vermelho" : "k-terracota", "Demandas em aberto", abertas.length, atrasadas ? atrasadas+" atrasada(s)" : "nenhuma atrasada", "abrirModuloInicio('demandas')")
    + tile(pendentes ? "k-laranja" : "k-areia", organizador ? "Visitas para aprovar" : "Visitas aguardando aprovação", pendentes, organizador ? "da equipe toda" : "suas visitas", organizador ? "abrirAprovacoesInicio()" : "abrirModuloInicio('agenda','semanal')")
    + tile(avisos ? "k-laranja" : "k-areia", "Avisos pendentes", avisos, avisos ? "clique para ver" : "tudo em dia", "document.getElementById('inicio-avisos').scrollIntoView({behavior:'smooth',block:'center'})");
}

// Função do módulo: inicio cal navegar
function inicioCalNavegar(d){ inicioCalOffset += d; renderInicioCalendario(); }

// Função do módulo: inicio cal hoje
function inicioCalHoje(){ inicioCalOffset = 0; renderInicioCalendario(); }

// Função do módulo: carga dia inicio
function cargaDiaInicio(uid, iso){
  const it = calItensDoDia(uid, iso);
  const eventos = it.eventos.filter(e=>!CAL_AUSENCIAS.includes(e.tipo));
  const aus = it.eventos.filter(e=>CAL_AUSENCIAS.includes(e.tipo));
  return {total: eventos.length + it.reunioes.length + it.demandas.length + it.visitas.length, eventos:eventos.length + it.reunioes.length, demandas:it.demandas.length, visitas:it.visitas.length, aus};
}

// Função do módulo: nivel carga dia
function nivelCargaDia(n){ return n<=0 ? 0 : n<=2 ? 1 : n<=4 ? 2 : n<=6 ? 3 : 4; }

// Desenha na tela: render inicio calendario
function renderInicioCalendario(){
  const el = document.getElementById("inicio-cal");
  if(!el || !currentUser) return;
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth()+inicioCalOffset);
  const ano = base.getFullYear(), mes = base.getMonth();
  document.getElementById("in-cal-titulo").textContent = maiusc1(base.toLocaleDateString("pt-BR", {month:"long", year:"numeric"}));
  const hojeISO = dataISOLocal(new Date());
  const ultimo = new Date(ano, mes+1, 0);
  let seg = new Date(ano, mes, 1); seg.setDate(seg.getDate() - ((seg.getDay()+6)%7));      // segunda-feira da semana do dia 1
  let html = ["Seg","Ter","Qua","Qui","Sex"].map(s=>`<div class="icm-sem">${s}</div>`).join("");
  while(seg <= ultimo){
    const dias = [];
    for(let i=0;i<5;i++){ const d = new Date(seg); d.setDate(seg.getDate()+i); dias.push(d); }
    if(dias.some(d=>d.getMonth()===mes)){
      dias.forEach(d=>{
        if(d.getMonth()!==mes){ html += '<div class="icm-d vazio"><b>·</b></div>'; return; }
        const iso = dataISOLocal(d), c = cargaDiaInicio(currentUser.id, iso);
        let cls = "", dica = dataBR(iso)+" — livre";
        if(c.aus.length){ cls = "aus"; dica = dataBR(iso)+" — ausente: "+c.aus.map(e=>e.tipo).join(", "); }
        else if(c.total){
          cls = "n"+nivelCargaDia(c.total);
          const partes = [c.visitas && c.visitas+" visita"+(c.visitas>1?"s":""), c.eventos && c.eventos+" evento"+(c.eventos>1?"s":""), c.demandas && c.demandas+" demanda"+(c.demandas>1?"s":"")].filter(Boolean);
          dica = dataBR(iso)+" — "+c.total+" atividade"+(c.total>1?"s":"")+" ("+partes.join(", ")+")";
        }
        html += `<div class="icm-d ${cls} ${iso===hojeISO?"hoje":""}"><b title="${escHtml(dica)}" onclick="inicioCalAbrirDia('${iso}')">${d.getDate()}</b></div>`;
      });
    }
    seg.setDate(seg.getDate()+7);
  }
  el.innerHTML = `<div class="icm">${html}</div>
    <div class="icm-leg"><span><i class="n1"></i>Leve</span><span><i class="n2"></i>Médio</span><span><i class="n3"></i>Alto</span><span><i class="n4"></i>Muito alto</span><span><i class="aus"></i>Ausente</span></div>`;
}

// Função do módulo: inicio cal abrir dia
function inicioCalAbrirDia(iso){
  calModo = "semana"; calPessoas = [currentUser.id];
  calSemanaOffset = Math.round(diasEntreISO(dataISOLocal(segundaDaSemana(0)), dataISOLocal(segundaDoDia(iso)))/7);
  irParaView("calendario");
}

// Função do módulo: vazio inicio
function vazioInicio(txt){ return `<div class="in-vazio">${txt}</div>`; }

// Desenha na tela: render inicio proximas
function renderInicioProximas(){
  const el = document.getElementById("inicio-proximas");
  const hojeISO = dataISOLocal(new Date());
  const lista = AGENDA.filter(v=>v.usuarioId===currentUser.id && v.status!=="Rejeitado" && v.data>=hojeISO)
    .sort((a,b)=> a.data<b.data?-1:a.data>b.data?1:(ORDEM_PERIODO_AGENDA[a.periodo]??9)-(ORDEM_PERIODO_AGENDA[b.periodo]??9)).slice(0,6);
  if(!lista.length){ el.innerHTML = vazioInicio("Nenhuma visita agendada. Use “Agendar” para lançar novas visitas."); return; }
  el.innerHTML = '<ul class="in-lista">' + lista.map(v=>{
    const d = new Date(v.data+"T00:00:00");
    return `<li class="in-item">
      <div class="in-dia ${v.data===hojeISO?"hoje":""}"><b>${String(d.getDate()).padStart(2,"0")}</b><span>${v.data===hojeISO?"hoje":DIAS_SEMANA_ABREV[d.getDay()]}</span></div>
      <div class="in-item-corpo"><span class="in-item-tit">${calAvsHtml([v.usuarioId])}${escHtml(v.unidade)} <small>· ${escHtml(v.periodo)}</small></span><span class="in-item-sub">${escHtml(v.motivo||"")}</span></div>
      ${v.status==="Aprovado" ? "" : tagStatusAgenda(v.status)}
    </li>`;
  }).join("") + '</ul>';
}

// Desenha na tela: render inicio demandas
function renderInicioDemandas(){
  const el = document.getElementById("inicio-demandas");
  const abertas = demandasAbertasDoUsuario().slice(0,6);
  if(!abertas.length){ el.innerHTML = vazioInicio("Você não tem demandas em aberto."); return; }
  el.innerHTML = '<ul class="in-lista">' + abertas.map(d=>{
    const p = calcularControlePrazo(d.dataLimite, d.entregueEm);
    return `<li class="in-item clicavel" onclick="abrirDemandaInicio(${d.id})">
      <span class="in-ponto" style="background:${p.cor};"></span>
      <div class="in-item-corpo"><span class="in-item-tit">${escHtml((d.demanda||"").slice(0,70))}</span><span class="in-item-sub">${escHtml([d.unidade, d.prioridade&&("Prioridade "+d.prioridade)].filter(Boolean).join(" · "))}</span></div>
      <span class="in-prazo" style="color:${p.cor};">${escHtml(p.label)}</span>
    </li>`;
  }).join("") + '</ul>';
}

// Desenha na tela: render inicio equipe
// Onde está a equipe hoje: todos os outros usuários, com a visita do dia (local de trabalho) ou a ausência registrada no calendário
function renderInicioEquipe(){
  const el = document.getElementById("inicio-equipe");
  const hojeISO = dataISOLocal(new Date());
  const outros = usuariosAtivosOrdenados().filter(u=>u.id!==currentUser.id);
  if(!outros.length){ el.innerHTML = vazioInicio("Não há outros usuários cadastrados."); return; }
  const linhas = linhasDiaAgenda(hojeISO);
  const html = outros.map(u=>{
    const nome = `<span class="ag-linha-nome lg" title="${escHtml(u.nome)}">${escHtml(primeiroNomeAgenda(u.nome))}</span>`;
    const av = avatarMiniAgenda(u.id, u.nome);
    const aus = (typeof ausenciasDoUsuarioNoDia==="function") ? ausenciasDoUsuarioNoDia(u.id, hojeISO) : [];
    if(aus.length){
      const t = aus.map(e=>e.tipo).join(" · ");
      return `<div class="ag-linha">${av}${nome}<div class="ag-fatias"><div class="ag-fatia inteira aus" title="${escHtml(t)}"><span class="ag-un">${escHtml(t)}</span></div></div></div>`;
    }
    const minhas = linhas.filter(l=>l.usuarioId===u.id);
    if(!minhas.length) return `<div class="ag-linha">${av}${nome}<div class="ag-fatias"><div class="ag-fatia inteira vazia"><span class="ag-un" style="font-weight:500; opacity:.65;">Sem visita hoje</span></div></div></div>`;
    return minhas.map(l=>{
      const fatias = l.inteira ? fatiaAgendaHtml([l.inteira, l.par], "inteira", false, false)
                               : fatiaAgendaHtml([l.manha], "manha", false, false) + fatiaAgendaHtml([l.tarde], "tarde", false, false);
      return `<div class="ag-linha">${av}${nome}<div class="ag-fatias">${fatias}</div></div>`;
    }).join("");
  }).join("");
  el.innerHTML = '<div class="ag-linhas in-equipe">'+html+'</div>';
}

// Função do módulo: unidades do usuario inicio
function unidadesDoUsuarioInicio(){
  return ehAdminOuCoordenador() ? UNIDADES : UNIDADES.filter(u=>lojasSobResponsabilidade().includes(u.nome));
}

// Função do módulo: lojas em atencao
function lojasEmAtencao(){
  const hojeISO = dataISOLocal(new Date());
  const tem = m => (currentUser.modulos||[]).includes(m);
  const lista = [];
  unidadesDoUsuarioInicio().forEach(u=>{
    const motivos = [];
    let peso = 0;
    // acidentes (módulo Acidentes)
    if(tem("lancamento")){
      const acid = ACIDENTES.filter(a=>a.loja===u.nome && a.data).map(a=>({...a, atras:diasEntreISO(a.data, hojeISO)})).filter(a=>a.atras>=0);
      const recentes = acid.filter(a=>a.atras<=ATENCAO_ACID_RECENTE_DIAS).sort((a,b)=>a.atras-b.atras);
      const janela = acid.filter(a=>a.atras<=ATENCAO_ACID_JANELA_DIAS);
      if(recentes.length){ motivos.push({tipo:"recente", cor:"vermelho", txt: recentes[0].atras===0 ? "Acidente hoje" : "Acidente há "+recentes[0].atras+" dia"+(recentes[0].atras===1?"":"s")}); peso += 100; }
      if(janela.length>=ATENCAO_ACID_MUITOS){ motivos.push({tipo:"muitos", cor:"laranja", txt: janela.length+" acidentes em "+ATENCAO_ACID_JANELA_DIAS+" dias"}); peso += 40+janela.length; }
    }
    // demandas atrasadas da unidade (módulo Demandas)
    if(tem("demandas")){
      const atras = DEMANDAS.filter(d=>d.unidade===u.nome && !d.entregueEm && calcularControlePrazo(d.dataLimite, d.entregueEm).label==="Atrasado").length;
      if(atras){ motivos.push({tipo:"demanda", cor:"vermelho", txt: atras+" demanda"+(atras===1?"":"s")+" atrasada"+(atras===1?"":"s")}); peso += 30+atras; }
    }
    // atestados recentes (módulo Saúde)
    if(tem("saude")){
      const n = ATESTADOS.filter(a=>a.loja===u.nome && a.dataAtestado && diasEntreISO(a.dataAtestado, hojeISO)>=0 && diasEntreISO(a.dataAtestado, hojeISO)<=ATENCAO_ATEST_JANELA_DIAS).length;
      if(n>=ATENCAO_ATEST_MUITOS){ motivos.push({tipo:"atestados", cor:"laranja", txt: n+" atestados em "+ATENCAO_ATEST_JANELA_DIAS+" dias"}); peso += 20+n; }
    }
    // fichas de EPI de novos admitidos aguardando download (módulo Ficha de EPI)
    if(tem("fichaEpi")){
      const n = EPI_NOVOS.filter(r=>normalizarTextoComparacao(r.loja)===normalizarTextoComparacao(u.nome)).length;
      if(n){ motivos.push({tipo:"epi", cor:"laranja", txt: n+" ficha"+(n===1?"":"s")+" de EPI para baixar"}); peso += 10+n; }
    }
    if(!motivos.length) return;
    lista.push({nome:u.nome, regional:u.regional||"", motivos, peso});
  });
  lista.sort((a,b)=> (b.peso-a.peso) || a.nome.localeCompare(b.nome,"pt-BR"));
  return lista;
}

// Função do módulo: agendar unidade inicio
function agendarUnidadeInicio(nome){
  if(!currentUser || !(currentUser.modulos||[]).includes("agenda")){ mostrarToast("Você não tem acesso ao agendamento de visitas."); return; }
  irParaView("calendario");
  abrirModalVisitaAgenda();
  const sel = document.getElementById("ag-unidade");
  if(sel){ sel.value = nome; mostrarUltimaVisitaUnidade(); renderLocaisTrabalhoAgenda(); }
}

// Função do módulo: ir para insight unidade
// leva direto ao item que gerou o alerta da unidade
function irParaInsightUnidade(nome, tipo){
  const tem = m=>(currentUser.modulos||[]).includes(m);
  const setar = (id, v, ev)=>{ const el = document.getElementById(id); if(el){ el.value = v; el.dispatchEvent(new Event(ev||"change",{bubbles:true})); } };
  if(tipo==="recente" || tipo==="muitos"){
    if(!tem("lancamento")) return;
    irParaView("lancamento");
    setTimeout(()=>{ setar("todos-ac-unidade", nome); try{ renderTodosAcidentes(); }catch(e){} }, 300);
  } else if(tipo==="demanda"){
    if(!tem("demandas")) return;
    irParaView("demandas");
    setTimeout(()=>{ setar("dem-f-unidade", nome); try{ renderVisaoAtivaDemandas(); }catch(e){} }, 300);
  } else if(tipo==="atestados"){
    if(!tem("saude")) return;
    irParaView("saude");
    setTimeout(()=>{ try{ mostrarSubSaude("registros"); }catch(e){} setar("sd-busca", nome, "input"); try{ renderSaudeRegistros(); }catch(e){} }, 350);
  } else if(tipo==="epi"){
    if(!tem("fichaEpi")) return;
    irParaView("fichaEpi");
  }
}

// Alterna (mostra/esconde): alternar atencao inicio
function alternarAtencaoInicio(){ inicioAtencaoExpandido = !inicioAtencaoExpandido; renderInicioAtencao(); }

// Desenha na tela: render inicio atencao
function renderInicioAtencao(){
  const el = document.getElementById("inicio-atencao");
  if(!el) return;
  const minhas = unidadesDoUsuarioInicio();
  if(!minhas.length){
    el.innerHTML = vazioInicio("Nenhuma unidade está vinculada a você como técnico responsável. Peça a um administrador para vincular em Gestão › Unidades.");
    return;
  }
  const lista = lojasEmAtencao();
  if(!lista.length){ el.innerHTML = vazioInicio("✓ Tudo em dia: nenhuma das "+minhas.length+" unidade(s) precisa de atenção agora."); return; }
  const visiveis = inicioAtencaoExpandido ? lista : lista.slice(0, ATENCAO_LINHAS);
  el.innerHTML = '<div class="at-grid">' + visiveis.map(l=>{
    const q = JSON.stringify(l.nome).replace(/"/g,"&quot;");
    return `<div class="at-item" role="button" tabindex="0" title="Abrir o item que gerou o alerta" onclick="irParaInsightUnidade(${q},'${l.motivos[0].tipo}')">
      <span class="at-nome">${escHtml(l.nome)}${l.regional?` <small>${escHtml(l.regional)}</small>`:""}</span>
      <span class="at-motivos">${l.motivos.map(m=>`<span class="at-chip ${m.cor} clicavel" onclick="event.stopPropagation(); irParaInsightUnidade(${q},'${m.tipo}')">${escHtml(m.txt)} ›</span>`).join("")}</span>
      ${(currentUser.modulos||[]).includes("agenda") ? `<button type="button" class="at-agendar" onclick="event.stopPropagation(); agendarUnidadeInicio(${q})" title="Agendar visita nesta unidade">+ agendar visita</button>` : ""}
    </div>`; }).join("") + '</div>'
    + (lista.length>ATENCAO_LINHAS ? `<button type="button" class="in-link" style="margin-top:10px;" onclick="alternarAtencaoInicio()">${inicioAtencaoExpandido ? "Mostrar menos" : "Ver todas ("+lista.length+")"}</button>` : "");
}

// Função do módulo: avisos visiveis
// avisos que o usuário enxerga: para todos, para ele, ou os manuais que ele mesmo enviou
function avisosVisiveis(){
  return AVISOS.filter(a=> !a.destinatarios || a.destinatarios.includes(currentUser.id) || (a.tipo==="manual" && a.criadoPor===currentUser.id));
}

// Função do módulo: avisos pendentes
function avisosPendentes(){ return avisosVisiveis().filter(a=>!AVISOS_RESOLVIDOS.has(a.id)); }

// Desenha na tela: render inicio avisos
function renderInicioAvisos(){
  const el = document.getElementById("inicio-avisos");
  const acoes = document.getElementById("inicio-avisos-acoes");
  if(!el) return;
  const todos = avisosVisiveis();
  const pend = todos.filter(a=>!AVISOS_RESOLVIDOS.has(a.id));
  const res = todos.filter(a=>AVISOS_RESOLVIDOS.has(a.id));
  if(acoes){
    acoes.innerHTML =
      (ehAdminOuCoordenador() ? '<button type="button" class="in-link" onclick="abrirModalAviso()">+ Novo aviso</button>' : "")
      + (res.length ? `<button type="button" class="in-link" onclick="alternarResolvidosInicio()">${inicioMostrarResolvidos ? "Ocultar resolvidos" : "Resolvidos ("+res.length+")"}</button>` : "");
  }
  const lista = inicioMostrarResolvidos ? pend.concat(res.slice(0,30)) : pend;
  if(!lista.length){ el.innerHTML = vazioInicio(todos.length ? "✓ Nenhum aviso pendente." : "Nenhum aviso por enquanto."); return; }
  el.innerHTML = '<ul class="in-lista">' + lista.map(a=>{
    const resolvido = AVISOS_RESOLVIDOS.has(a.id);
    const meta = [a.tipo==="manual" ? (a.criadoPor===currentUser.id ? "enviado por você" : "de "+(a.criadoPorNome||"—")) : "plataforma", tempoRelativoNotif(a.criadoEm)].filter(Boolean).join(" · ");
    const acao = a.referenciaTipo ? ` clicavel" onclick="abrirAviso(${a.id})` : "";
    const podeExcluir = a.tipo==="manual" && (a.criadoPor===currentUser.id || ehAdministrador());
    return `<li class="in-item av-item ${resolvido?"resolvido":""}">
      <label class="av-check" title="${resolvido?"Marcar como pendente":"Marcar como resolvido"}"><input type="checkbox" ${resolvido?"checked":""} onchange="alternarAvisoResolvido(${a.id})" aria-label="Marcar aviso como resolvido"><span></span></label>
      <div class="in-item-corpo av-corpo${acao}">
        <span class="av-tit">${escHtml(a.titulo)}</span>
        ${a.mensagem ? `<span class="av-msg">${escHtml(a.mensagem)}</span>` : ""}
        ${a.referenciaTipo && ROTULO_REF_AVISO[a.referenciaTipo] ? `<span class="av-link">Abrir ${escHtml(ROTULO_REF_AVISO[a.referenciaTipo])} →</span>` : ""}
        <span class="av-meta">${escHtml(meta)}</span>
      </div>
      ${podeExcluir ? `<button type="button" class="av-del" title="Excluir aviso" onclick="excluirAviso(${a.id})">×</button>` : ""}
    </li>`;
  }).join("") + '</ul>';
}

// Alterna (mostra/esconde): alternar resolvidos inicio
function alternarResolvidosInicio(){ inicioMostrarResolvidos = !inicioMostrarResolvidos; renderInicioAvisos(); }

// Alterna (mostra/esconde): alternar aviso resolvido
async function alternarAvisoResolvido(id){
  const jaResolvido = AVISOS_RESOLVIDOS.has(id);
  if(jaResolvido) AVISOS_RESOLVIDOS.delete(id); else AVISOS_RESOLVIDOS.add(id);
  renderInicio();
  const { error } = jaResolvido
    ? await sb.from("avisos_resolvidos").delete().eq("aviso_id", id).eq("usuario_id", currentUser.id)
    : await sb.from("avisos_resolvidos").insert({aviso_id:id, usuario_id:currentUser.id});
  if(error){
    console.error("[Supabase] avisos_resolvidos:", error);
    if(jaResolvido) AVISOS_RESOLVIDOS.add(id); else AVISOS_RESOLVIDOS.delete(id);
    renderInicio(); mostrarToast("Não foi possível salvar. Tente de novo.");
  }
}

// Abre: abrir aviso
function abrirAviso(id){
  const a = AVISOS.find(x=>x.id===id);
  if(!a) return;
  const tem = m => (currentUser.modulos||[]).includes(m);
  const t = a.referenciaTipo, rid = a.referenciaId;
  if(t==="acidente" && tem("lancamento")) irParaView("lancamento");
  else if(t==="epi_admitidos" && tem("fichaEpi") && typeof abrirFichaEpiNovosAdmitidos==="function") abrirFichaEpiNovosAdmitidos();
  else if(t==="agenda" && tem("agenda")){
    abrirModuloInicio("agenda","semanal");
    const v = AGENDA.find(x=>String(x.id)===String(rid));
    if(v){ semanaAgendaOffset = offsetSemanaDeData(v.data); renderGradeSemanal(); }
  }
  else if(t==="demanda" && tem("demandas")) abrirDemandaInicio(Number(rid));
  else if(t==="reuniao" && tem("reunioes")){ irParaView("reunioes"); setTimeout(()=>abrirModalReuniao(Number(rid)), 400); }
  else if(t==="calendario"){
    const ev = CAL_EVENTOS.find(e=>String(e.id)===String(rid));
    if(ev){ calModo = "semana"; calSemanaOffset = Math.round(diasEntreISO(dataISOLocal(segundaDaSemana(0)), dataISOLocal(segundaDoDia(ev.dataInicio)))/7); }
    irParaView("calendario");
  }
  else if(t) mostrarToast("Você não tem acesso a este módulo.");
}

// Preenche: preencher ref aviso
// lista de itens para relacionar a um aviso
function preencherRefAviso(){
  const tipo = document.getElementById("av-ref-tipo").value, sel = document.getElementById("av-ref-id");
  const hojeISO = dataISOLocal(new Date()), d14 = new Date(); d14.setDate(d14.getDate()-14); const corte = dataISOLocal(d14);
  let itens = [];
  if(tipo==="agenda") itens = AGENDA.filter(v=>v.status!=="Rejeitado" && v.data>=corte).sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:0).slice(0,300)
    .map(v=>({id:v.id, txt: dataBR(v.data).slice(0,5)+" · "+(v.usuarioNome||"")+" · "+v.unidade+" · "+v.periodo}));
  else if(tipo==="demanda") itens = DEMANDAS.filter(d=>!d.entregueEm).slice(0,300).map(d=>({id:d.id, txt:"#"+d.id+" · "+String(d.demanda||"").slice(0,70)+(d.responsavel ? " · "+d.responsavel : "")}));
  else if(tipo==="reuniao") itens = REUNIOES.slice().sort((a,b)=>String(b.data).localeCompare(String(a.data))).slice(0,150).map(r=>({id:r.id, txt:(r.data ? formatarDataBR(r.data).slice(0,5)+" · " : "")+r.titulo}));
  else if(tipo==="calendario") itens = CAL_EVENTOS.filter(e=>e.dataFim>=corte).sort((a,b)=>a.dataInicio<b.dataInicio?-1:1).slice(0,300)
    .map(e=>({id:e.id, txt: dataBR(e.dataInicio).slice(0,5)+" · "+e.titulo+" · "+((USUARIOS.find(u=>u.id===e.usuarioId)||{}).nome||"")}));
  else if(tipo==="acidente") itens = ACIDENTES.slice().sort((a,b)=>String(b.data).localeCompare(String(a.data))).slice(0,80).map(a=>({id:a.id, txt:(a.data ? dataBR(a.data)+" · " : "")+a.loja+" · "+(a.motivo||"")}));
  sel.disabled = !tipo;
  sel.innerHTML = tipo ? '<option value="">Selecione...</option>'+itens.map(i=>`<option value="${i.id}">${escHtml(i.txt)}</option>`).join("") : '<option value="">—</option>';
}

// Remove/cancela: excluir aviso
async function excluirAviso(id){
  const a = AVISOS.find(x=>x.id===id);
  if(!a || !confirm("Excluir este aviso para todos os destinatários?")) return;
  const { error } = await sb.from("avisos").delete().eq("id", id);
  if(error){ alert("Erro ao excluir o aviso: "+error.message); return; }
  AVISOS = AVISOS.filter(x=>x.id!==id);
  renderInicio();
}

// Função do módulo: criar aviso plataforma
// cria um aviso (manual ou automático); "destinatarios" null = todos
async function criarAvisoPlataforma({tipo, titulo, mensagem, destinatarios, referenciaTipo, referenciaId}){
  const { data, error } = await sb.from("avisos").insert({
    tipo: tipo||"manual", titulo, mensagem: mensagem||"", destinatarios: destinatarios||null,
    referencia_tipo: referenciaTipo||null, referencia_id: referenciaId!=null ? String(referenciaId) : null,
    criado_por: currentUser.id, criado_por_nome: currentUser.nome
  }).select().single();
  if(error){ console.error("[Supabase] avisos:", error); return null; }
  const a = mapAvisoFromDb(data);
  const paraMim = !a.destinatarios || a.destinatarios.includes(currentUser.id);
  if(paraMim || a.tipo==="manual") AVISOS.unshift(a);
  return a;
}

// Função do módulo: avisar novo acidente
// aviso automático: novo acidente → quem acompanha acidentes
async function avisarNovoAcidente(ac){
  if(!currentUser) return;
  const dest = USUARIOS.filter(u=>u.ativo!==false && u.id!==currentUser.id && (u.perfil==="Administrador" || u.perfil==="Coordenador" || (u.modulos||[]).includes("lancamento"))).map(u=>u.id);
  if(!dest.length) return;
  await criarAvisoPlataforma({tipo:"acidente", titulo:"Novo acidente registrado", mensagem:[ac.loja, ac.motivo, dataBR(ac.data)].filter(Boolean).join(" · "), destinatarios:dest, referenciaTipo:"acidente", referenciaId:ac.id});
  renderInicio();
}

// Abre: abrir modal aviso
// envio manual (Administrador / Coordenador)
function abrirModalAviso(){
  if(!ehAdminOuCoordenador()) return;
  document.getElementById("form-aviso").reset();
  document.getElementById("av-lista-usuarios").innerHTML = usuariosAtivosOrdenados().filter(u=>u.id!==currentUser.id)
    .map(u=>`<label><input type="checkbox" class="av-dest-user" value="${u.id}"> ${escHtml(u.nome)}</label>`).join("");
  alternarDestinatariosAviso();
  preencherRefAviso();
  document.getElementById("modal-aviso").style.display = "flex";
  setTimeout(()=>document.getElementById("av-titulo").focus(), 50);
}

// Fecha: fechar modal aviso
function fecharModalAviso(){ document.getElementById("modal-aviso").style.display = "none"; }

// Alterna (mostra/esconde): alternar destinatarios aviso
function alternarDestinatariosAviso(){
  document.getElementById("av-lista-usuarios").style.display = document.getElementById("av-dest-alguns").checked ? "flex" : "none";
}

// Função do módulo: enviar aviso
async function enviarAviso(ev){
  if(ev) ev.preventDefault();
  if(!ehAdminOuCoordenador()) return false;
  const titulo = document.getElementById("av-titulo").value.trim();
  const mensagem = document.getElementById("av-mensagem").value.trim();
  if(!titulo) return false;
  const alguns = document.getElementById("av-dest-alguns").checked;
  const escolhidos = [...document.querySelectorAll(".av-dest-user")].filter(c=>c.checked).map(c=>c.value);
  if(alguns && !escolhidos.length){ alert("Escolha pelo menos uma pessoa ou selecione “Todos os usuários”."); return false; }
  const refTipo = document.getElementById("av-ref-tipo").value, refId = document.getElementById("av-ref-id").value;
  if(refTipo && !refId){ alert("Escolha o item relacionado ou selecione “Nada”."); return false; }
  const a = await criarAvisoPlataforma({tipo:"manual", titulo, mensagem, destinatarios: alguns ? escolhidos : null, referenciaTipo: refTipo||null, referenciaId: refTipo ? refId : null});
  if(!a){ alert("Não foi possível enviar o aviso. Tente novamente."); return false; }
  const quem = alguns ? escolhidos : usuariosAtivosOrdenados().filter(u=>u.id!==currentUser.id).map(u=>u.id);
  for(const uid of quem){ await criarNotificacao(uid, "aviso", "Novo aviso: "+titulo, mensagem.slice(0,120), "aviso", a.id); }
  fecharModalAviso();
  renderInicio();
  mostrarToast("Aviso enviado para "+(alguns ? escolhidos.length+" pessoa"+(escolhidos.length===1?"":"s") : "todos os usuários")+".");
  return false;
}

// Desenha na tela: render inicio planos
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

