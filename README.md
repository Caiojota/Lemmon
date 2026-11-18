# Lemmon — Plataforma SESMT

Estrutura do projeto:

- `index.html` — página principal (só a estrutura; carrega os demais arquivos)
- `css/` — estilos, em ordem numérica
- `js/` — código da plataforma, **um arquivo por módulo do app** (veja a lista abaixo).
  Cada função tem um comentário acima explicando o que ela faz na tela.
- `lib/` — bibliotecas de terceiros (não editar)

## Mapa dos módulos (js/)

| Arquivo | O que tem dentro |
|---|---|
| `01-nucleo.js` | Unidades (cadastro), login/sessão, conversão de dados do banco, menu e utilitários gerais |
| `02-dashboard-acidentes.js` | Dashboard de acidentes: filtros, KPIs, gráficos, lançamento manual, upload de Excel |
| `03-inspecoes-checklist.js` | Inspeções: checklist, GUT, ocorrências, pendências, PDF |
| `04-demandas.js` | Quadro de Demandas (kanban) |
| `05-reunioes-dailys.js` | Reuniões e Dailys |
| `06-gestao-config.js` | Tela de Gestão/Configurações (EPI por função, tipos, checklist, agenda, ocorrências) |
| `07-notificacoes.js` | Sino de notificações |
| `08-saude.js` | Módulo Saúde (atestados) |
| `09-ficha-epi.js` | Ficha de EPI (marcação, lote, novos admitidos, auditoria) |
| `10-absenteismo.js` | Absenteísmo |
| `11-agenda.js` | Agenda da equipe (visitas, check-in/out, aprovação, exportação) |
| `12-inicio.js` | Página Início (resumo do dia, avisos, planos) |
| `13-calendario.js` | Calendário unificado |
| `14-convites-ausencias.js` | Convites e ausências |
| `15-usuarios.js` | Cadastro de usuários |
| `16-vistoria.js` | Relatório Vistorial (visão do técnico) |
| `17-vistoria-publica.js` | Página pública da loja (QR Code) |
| `18-entrega-epi.js` | Entrega de EPIs (com assinatura do colaborador) e controle de estoque por loja |
| `19-ponto.js` | Registro de ponto (entrada/saída) do usuário logado, com localização e foto |
| `99-inicializacao.js` | Código que roda ao carregar a página (não mude a ordem interna dele) |

**Importante:** não mude a ordem dos `<script>` no `index.html` — o arquivo `99-inicializacao.js` precisa ser sempre o último.

## Rodar no seu computador
Dê duplo clique no `index.html` (abre no seu navegador), ou abra a pasta no VS Code e use a extensão Live Server se preferir.

## Publicar (GitHub Pages)
```
git init
git add .
git commit -m "mensagem"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/lemmon.git
git push -u origin main
```
No GitHub: Settings > Pages > Branch `main` / pasta `/ (root)`.
