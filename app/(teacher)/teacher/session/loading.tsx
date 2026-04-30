export default function Loading() {
  return (
    <div className="p-6 flex gap-6 h-full animate-pulse">
      {/* 왼쪽 사이드바 */}
      <div className="w-72 shrink-0 space-y-4">
        {/* 코드 카드 */}
        <div className="bg-indigo-100 rounded-2xl p-6 text-center">
          <div className="h-3 w-20 bg-indigo-200 rounded mx-auto mb-3" />
          <div className="h-10 w-40 bg-indigo-200 rounded-xl mx-auto mb-3" />
          <div className="h-3 w-32 bg-indigo-200 rounded mx-auto mb-4" />
          <div className="w-[124px] h-[124px] bg-indigo-200 rounded-xl mx-auto" />
        </div>
        {/* 진행 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-24 bg-gray-100 rounded" />
        </div>
        {/* 참가자 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex justify-between mb-3">
            <div className="h-3 w-12 bg-gray-200 rounded" />
            <div className="h-3 w-8 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-200 rounded-full" />
                <div className="h-3 bg-gray-100 rounded flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 메인 */}
      <div className="flex-1 space-y-4">
        {/* 문제 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex gap-2 mb-5">
            <div className="h-6 w-16 bg-indigo-100 rounded-full" />
            <div className="h-6 w-12 bg-amber-100 rounded-full" />
            <div className="h-6 w-14 bg-gray-100 rounded-full" />
            <div className="ml-auto h-6 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-1/2 bg-gray-100 rounded mb-5" />
          <div className="grid grid-cols-2 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
        {/* 답변 현황 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
          <div className="h-2.5 bg-gray-100 rounded-full mb-4" />
          <div className="space-y-2">
            {[1,2].map(i => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl border border-gray-100" />
            ))}
          </div>
        </div>
        {/* 버튼 */}
        <div className="h-14 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}
