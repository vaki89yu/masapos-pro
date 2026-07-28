// MasaPOS Pro - Service Worker Offline
const CACHE_NAME = 'masapos-v1';

// Archivos esenciales para que funcione offline
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/images/masa-hero.jpg',
  '/images/masa-fresca.jpg',
  '/images/masa-tienda.jpg',
  '/images/masa-moto.jpg',
  '/images/billetes-mexicanos.jpg',
  '/images/billete-100.jpg',
  '/images/billete-200.jpg',
  '/images/billete-500.jpg',
  '/images/billete-1000.jpg',
  '/images/monedas-mexicanas.jpg',
];

// Instalación: guardar archivos estáticos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network First, fallback a cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones del mismo origen
  if (url.origin !== self.location.origin) return;

  // Siempre usar red para APIs (con fallback a cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Para assets estáticos: cache first
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Para la página principal: network first
  event.respondWith(networkFirstWithCache(request));
});

// Estrategia: Cache First
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Estrategia: Network First (intenta red, si falla usa cache)
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Para API, devolver respuesta vacía si no hay cache
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ products: [], sales: [], customers: [], openShift: null, shifts: [], stats: null }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return caches.match('/');
  }
}
