export default function Loading() {
  return (
    <div className="p-8 max-w-2xl">
      {/* 제목 */}
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />

      {/* 퀴즈 선택 카드 목록 */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-gray-200 bg-white animate-pulse">
            <div>
              <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        ))}

        {/* 세션 시작 버튼 */}
        <div className="h-14 bg-indigo-200 rounded-2xl animate-pulse mt-2" />
      </div>
    </div>
  )
}
