/* ☀️ 햇당 Service Worker v1.0 */
const CACHE = 'haetdang-v1';

/* 오프라인에서도 쓸 파일들 */
const PRECACHE = [
  './haetdang_webapp.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Gowun+Dodum&display=swap'
];

/* ─── 설치: 핵심 파일 미리 캐시 ─── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

/* ─── 활성화: 이전 캐시 정리 ─── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ─── 요청 가로채기: Cache-first (이미지/폰트), Network-first (API) ─── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Gemini API는 캐시하지 않음 */
  if (url.hostname.includes('generativelanguage.googleapis.com')) return;

  /* 폰트·이미지: 캐시 우선 */
  if (e.request.destination === 'font' || e.request.destination === 'image') {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  /* 나머지: 네트워크 우선, 실패 시 캐시 */
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
