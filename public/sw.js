const CACHE_NAME = "casa-check-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/image/Casa Check logo.webp",
  "/image/favicon-16x16.png",
  "/image/favicon-32x32.png",
  "/image/android-chrome-192x192.png",
  "/image/android-chrome-512x512.png",
  "/image/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalando...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Cache aberto");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("Service Worker: Instalado com sucesso");
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativando...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Removendo cache antigo:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Ativado com sucesso");
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== "GET") {
    return;
  }

  // Ignorar requisições para APIs externas
  if (
    event.request.url.includes("supabase") ||
    event.request.url.includes("api") ||
    event.request.url.includes("_next")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retornar do cache se disponível
      if (response) {
        return response;
      }

      // Buscar da rede
      return fetch(event.request)
        .then((response) => {
          // Verificar se a resposta é válida
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clonar a resposta
          const responseToCache = response.clone();

          // Adicionar ao cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Em caso de erro, retornar página offline se for uma navegação
          if (event.request.destination === "document") {
            return caches.match("/");
          }
        });
    })
  );
});
