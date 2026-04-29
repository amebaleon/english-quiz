// 영어퀴즈 서비스 워커 — 오프라인 지원 없음, PWA 설치만 지원
const CACHE_NAME = 'english-quiz-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// 네트워크 우선 — 오프라인 시 아무것도 캐시하지 않음
self.addEventListener('fetch', (event) => {
  // API 요청은 항상 네트워크
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('오프라인 상태입니다. 인터넷에 연결해 주세요.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    })
  )
})
