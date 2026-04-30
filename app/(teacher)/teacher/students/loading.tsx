export default function Loading() {
  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-16 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 w-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 w-28 bg-indigo-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex gap-3 mb-5">
        <div className="h-10 flex-1 max-w-xs bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      {/* 학생 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="flex items-center gap-6 px-6 py-3 border-b border-gray-100 bg-gray-50">
          {[80, 60, 72, 60].map((w, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${w}px` }} />
          ))}
          <div className="ml-auto h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-4 border-b border-gray-50 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-4 w-14 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="flex gap-2 ml-auto">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-7 w-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
