export default function Loading() {
  return (
    <div className="p-8 max-w-4xl">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse mb-1" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* 검색창 */}
      <div className="h-11 bg-gray-100 rounded-2xl animate-pulse mb-6" />

      {/* 탭 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[64, 72, 64, 72, 88, 72].map((w, i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-full animate-pulse" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* 콘텐츠 카드들 */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center justify-between animate-pulse">
            <div className="h-4 w-56 bg-gray-200 rounded" />
            <div className="h-4 w-4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
