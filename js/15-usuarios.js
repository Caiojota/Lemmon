/* =====================================================================
   USUÁRIOS & MÓDULOS
   ===================================================================== */

// Desenha na tela: render usuarios
/* =====================================================================
   7) USUÁRIOS & MÓDULOS
   ===================================================================== */
function renderUsuarios(){
  const tb = document.getElementById("tbl-usuarios");
  tb.innerHTML="";
  const nomesModulo = {lancamento:"Acidentes", inspecoes:"Relatório Vistorial", agenda:"Agenda", demandas:"Demandas", reunioes:"Reuniões", saude:"Saúde (Tarefas)", absenteismo:"Absenteísmo (Tarefas)", fichaEpi:"Ficha de EPI (Tarefas)", auditoriaEpi:"Auditoria EPI", gestao:"Gestão"};
  USUARIOS.forEach(u=>{
    tb.innerHTML += `<tr>
      <td>${u.foto? `<img src="${u.foto}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">` : `<div style="width:32px;height:32px;border-radius:50%;background:var(--areia-cla);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--marrom-esc);font-size:13px;">${u.nome.charAt(0).toUpperCase()}</div>`}</td>
      <td>${u.nome}</td>
      <td>${u.login}</td>
      <td><span class="perfil-tag ${u.perfil.replace(' ','')}" style="background:${u.perfil==='Administrador'?'#981b22':u.perfil==='Coordenador'?'#a15a33':'#00733f'}">${u.perfil}</span></td>
      <td>${(u.modulos||[]).map(m=>nomesModulo[m]||m).join(", ")}</td>
      <td><span class="status-dot ${u.ativo?'on':'off'}"></span>${u.ativo?'Ativo':'Inativo'}</td>
      <td>
        <button class="small-btn" onclick="abrirModalUsuario('${u.id}')">Editar</button>
        <button class="small-btn danger" onclick="alternarStatusUsuario('${u.id}')">${u.ativo?'Desativar':'Ativar'}</button>
      </td>
    </tr>`;
  });
}

// Abre: abrir modal usuario
function abrirModalUsuario(id){
  document.getElementById("form-usuario").reset();
  document.querySelectorAll(".us-mod").forEach(cb=>cb.checked=false);
  document.querySelectorAll(".us-notif").forEach(cb=>cb.checked=false);
  assinaturaTemp = null;
  fotoUsuarioTemp = null;
  document.getElementById("us-assinatura-preview").style.display="none";
  document.getElementById("us-assinatura-remover").style.display="none";
  document.getElementById("us-foto-preview").style.display="none";
  document.getElementById("us-foto-remover").style.display="none";
  if(id){
    const u = USUARIOS.find(x=>x.id===id);
    document.getElementById("modal-title").textContent = "Editar usuário";
    document.getElementById("us-id").value = u.id;
    document.getElementById("us-nome").value = u.nome;
    document.getElementById("us-login").value = u.login;
    document.getElementById("us-login").disabled = true;
    document.getElementById("us-senha").value = "";
    document.getElementById("us-senha").disabled = true;
    document.getElementById("us-senha").placeholder = "Senha não pode ser alterada por aqui";
    document.getElementById("us-registro").value = u.registro||"";
    document.getElementById("us-cargo").value = u.cargo||"";
    document.getElementById("us-carga-horaria").value = u.cargaHorariaDiaria!=null ? u.cargaHorariaDiaria : 8;
    document.getElementById("us-perfil").value = u.perfil;
    document.getElementById("us-ativo").checked = u.ativo;
    document.querySelectorAll(".us-mod").forEach(cb=>{ cb.checked = u.modulos.includes(cb.value); });
    document.querySelectorAll(".us-notif").forEach(cb=>{ cb.checked = (u.notificacoesAtivas||[]).includes(cb.value); });
    if(u.assinatura){
      assinaturaTemp = u.assinatura;
      const prev = document.getElementById("us-assinatura-preview");
      prev.src = u.assinatura; prev.style.display="inline-block";
      document.getElementById("us-assinatura-remover").style.display="inline-block";
    }
    if(u.foto){
      fotoUsuarioTemp = u.foto;
      const prevF = document.getElementById("us-foto-preview");
      prevF.src = u.foto; prevF.style.display="inline-block";
      document.getElementById("us-foto-remover").style.display="inline-block";
    }
  } else {
    document.getElementById("modal-title").textContent = "Novo usuário";
    document.getElementById("us-id").value = "";
    document.getElementById("us-login").disabled = false;
    document.getElementById("us-senha").disabled = false;
    document.getElementById("us-senha").placeholder = "defina uma senha";
    document.querySelectorAll(".us-notif").forEach(cb=>cb.checked=true);
    aplicarModulosPadrao();
  }
  document.getElementById("modal-usuario").style.display="flex";
}

// Reage ao evento:: on foto usuario change
function onFotoUsuarioChange(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    fotoUsuarioTemp = e.target.result;
    const prev = document.getElementById("us-foto-preview");
    prev.src = fotoUsuarioTemp; prev.style.display="inline-block";
    document.getElementById("us-foto-remover").style.display="inline-block";
  };
  reader.readAsDataURL(file);
}

// Remove/cancela: remover foto usuario
function removerFotoUsuario(){
  fotoUsuarioTemp = null;
  document.getElementById("us-foto-preview").style.display="none";
  document.getElementById("us-foto-remover").style.display="none";
}

// Reage ao evento:: on assinatura change
function onAssinaturaChange(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    assinaturaTemp = e.target.result;
    const prev = document.getElementById("us-assinatura-preview");
    prev.src = assinaturaTemp; prev.style.display="inline-block";
    document.getElementById("us-assinatura-remover").style.display="inline-block";
  };
  reader.readAsDataURL(file);
}

// Remove/cancela: remover assinatura usuario
function removerAssinaturaUsuario(){
  assinaturaTemp = null;
  document.getElementById("us-assinatura-preview").style.display="none";
  document.getElementById("us-assinatura-remover").style.display="none";
}

// Fecha: fechar modal usuario
function fecharModalUsuario(){ document.getElementById("modal-usuario").style.display="none"; }

// Aplica: aplicar modulos padrao
function aplicarModulosPadrao(){
  const perfil = document.getElementById("us-perfil").value;
  const padrao = MODULOS_PADRAO[perfil]||[];
  document.querySelectorAll(".us-mod").forEach(cb=>{ cb.checked = padrao.includes(cb.value); });
}

// Salva no banco: salvar usuario
async function salvarUsuario(ev){
  ev.preventDefault();
  const id = document.getElementById("us-id").value;
  const modulos = [...document.querySelectorAll(".us-mod")].filter(cb=>cb.checked).map(cb=>cb.value);
  const notificacoesAtivas = [...document.querySelectorAll(".us-notif")].filter(cb=>cb.checked).map(cb=>cb.value);
  const dadosPerfil = {
    nome: document.getElementById("us-nome").value.trim(),
    registro: document.getElementById("us-registro").value.trim(),
    cargo: document.getElementById("us-cargo").value.trim(),
    assinatura: assinaturaTemp,
    foto: fotoUsuarioTemp,
    perfil: document.getElementById("us-perfil").value,
    modulos,
    notificacoesAtivas,
    cargaHorariaDiaria: Number(document.getElementById("us-carga-horaria").value) || 8,
    ativo: document.getElementById("us-ativo").checked
  };
  const payloadDb = {...dadosPerfil, notificacoes_ativas: notificacoesAtivas, carga_horaria_diaria: dadosPerfil.cargaHorariaDiaria};
  delete payloadDb.notificacoesAtivas;
  delete payloadDb.cargaHorariaDiaria;
  if(id){
    const { error } = await sb.from("profiles").update(payloadDb).eq("id", id);
    if(error){ alert("Erro ao atualizar usuário: "+error.message); return false; }
    const u = USUARIOS.find(x=>x.id===id);
    Object.assign(u, dadosPerfil);
    if(currentUser && currentUser.id===id) currentUser = u;
    acaoPlataforma("Usuário atualizado", (u&&u.nome)||"", null, null);
    mostrarToast("Usuário atualizado com sucesso.");
  } else {
    const email = document.getElementById("us-login").value.trim();
    const senha = document.getElementById("us-senha").value;
    const { data, error } = await sb.auth.signUp({
      email, password: senha,
      options: { data: { nome: dadosPerfil.nome, perfil: dadosPerfil.perfil } }
    });
    if(error || !data.user){ alert("Erro ao criar usuário: "+(error?.message||"")); return false; }
    const { error: err2 } = await sb.from("profiles").update(payloadDb).eq("id", data.user.id);
    if(err2) console.error("[Supabase] erro ao completar perfil:", err2);
    USUARIOS.push({ id:data.user.id, login:email, ...dadosPerfil });
    mostrarToast("Usuário criado. Se a confirmação de e-mail estiver ativa no projeto Supabase, ele precisa confirmar antes do 1º login.");
  }
  fecharModalUsuario();
  renderUsuarios();
  return false;
}

// Alterna (mostra/esconde): alternar status usuario
async function alternarStatusUsuario(id){
  const u = USUARIOS.find(x=>x.id===id);
  const novoStatus = !u.ativo;
  const { error } = await sb.from("profiles").update({ativo: novoStatus}).eq("id", id);
  if(error){ alert("Erro ao alterar status: "+error.message); return; }
  u.ativo = novoStatus;
  renderUsuarios();
  acaoPlataforma(u.ativo ? "Usuário reativado" : "Usuário desativado", u.nome, null, null);
  mostrarToast(u.ativo? "Usuário reativado.":"Usuário desativado.");
}

