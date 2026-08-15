// Workaround for Chromium 466790291 — ServiceWorkerAutoPreload regression
// PWA blank screen on cold start when the service worker is not running at
// navigation time. Opt out of ServiceWorkerAutoPreload via the Static Routing API.
// https://issues.chromium.org/issues/466790291
// https://github.com/WICG/service-worker-auto-preload#opt-out
self.addEventListener('install', function (e) {
  if (typeof e.addRoutes !== 'function' || typeof URLPattern !== 'function') return;

  e.addRoutes({
    condition: { urlPattern: new URLPattern({}) },
    source: 'fetch-event',
  });
});
