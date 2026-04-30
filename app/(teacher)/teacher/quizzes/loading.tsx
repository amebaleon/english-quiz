export default function Loading() {
  return (
    <div className="p-8">
      {/* 헤더: 제목+부제목 왼쪽, 검색+버튼 오른쪽 */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-12 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-40 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 w-28 bg-indigo-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[48, 40, 44, 40, 48].map((w, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded-full animate-pulse" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* 퀴즈 카드 그리드 (2열) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 animate-pulse">
            {/* 카테고리 뱃지 + 문제수 */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="h-6 w-14 bg-gray-100 rounded-full" />
              <div className="h-6 w-12 bg-gray-100 rounded-full" />
            </div>
            {/* 제목 */}
            <div className="h-5 w-36 bg-gray-200 rounded mt-2 mb-1" />
            {/* 날짜 */}
            <div className="h-3 w-24 bg-gray-100 rounded mb-4" />
            {/* 액션 버튼 4개 */}
            <div className="flex gap-2 flex-wrap">
              <div className="h-9 flex-1 bg-indigo-50 rounded-xl" />
              <div className="h-9 w-16 bg-gray-100 rounded-xl" />
              <div className="h-9 w-12 bg-amber-50 rounded-xl" />
              <div className="h-9 w-12 bg-red-50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
