export default function Loading() {
  return (
    <div className="p-8 max-w-4xl">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse mb-1.5" />
        <div className="h-4 w-52 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* 검색창 */}
      <div className="h-11 w-full bg-gray-100 rounded-2xl animate-pulse mb-6" />

      {/* 탭 버튼들 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[72, 64, 64, 72, 88, 72].map((w, i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-full animate-pulse" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* FAQ 카드들 — FAQCard 구조와 동일: 좌 텍스트 + 우 ▼ */}
      <div className="space-y-3">
        {[200, 160, 220, 180, 240].map((w, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center justify-between animate-pulse">
            <div className="h-4 bg-gray-200 rounded" style={{ width: `${w}px` }} />
            <div className="h-3 w-3 bg-gray-100 rounded shrink-0 ml-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
