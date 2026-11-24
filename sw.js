/* =====================================================================
   Service Worker da Lemmon — existe só para a plataforma poder ser
   "instalada" no celular (ganhar ícone, abrir em tela cheia). Ele NÃO
   guarda dados do Supabase (ponto, acidentes, EPI etc.) para uso offline:
   isso exige rede (geolocalização, câmera aprovada pelo admin, etc.) e
   não deve parecer funcionar sem internet. Só a "casca" estática
   (HTML/CSS/JS/ícones) fica em cache, pra abrir rápido e não quebrar
   numa instabilidade momentânea de rede.
   ===================================================================== */

const CACHE_NOME = "lemmon-shell-v11";

const ARQUIVOS_PARA_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (ev) => {
  self.skipWaiting();
  ev.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE).catch(() => {}))
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Nunca intercepta chamadas pro Supabase (ou qualquer outra origem): sempre direto na rede.
  if (url.origin !== self.location.origin) return;

  // Casca estática do app (html/css/js/lib/icons): tenta a rede primeiro (pra sempre
  // pegar a versão mais nova depois de um deploy) e só usa o cache se a rede falhar.
  ev.respondWith(
    fetch(req)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE_NOME).then((cache) => cache.put(req, copia)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req).then((resp) => resp || caches.match("./index.html")))
  );
});
