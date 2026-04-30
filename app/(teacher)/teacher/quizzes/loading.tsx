export default function Loading() {
  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-indigo-200 rounded-xl animate-pulse" />
      </div>

      {/* 검색창 */}
      <div className="h-10 w-72 bg-gray-100 rounded-xl animate-pulse mb-4" />

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-6">
        {[40, 32, 44, 36, 40].map((w, i) => (
          <div key={i} className={`h-8 w-${w} bg-gray-100 rounded-full animate-pulse`} style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      {/* 퀴즈 카드 목록 */}
      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between animate-pulse">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-44 bg-gray-200 rounded" />
                <div className="h-5 w-12 bg-gray-100 rounded-full" />
              </div>
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
            <div className="flex gap-2 ml-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-8 w-14 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
