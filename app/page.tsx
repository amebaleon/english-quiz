import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-emerald-50 p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-3">영어퀴즈</h1>
        <p className="text-gray-500 text-lg">누구로 접속할까요?</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
        <Link
          href="/teacher/login"
          className="flex-1 flex flex-col items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl py-10 px-6 shadow-lg transition-colors"
        >
          <span className="text-5xl">👩‍🏫</span>
          <span className="text-2xl font-bold">선생님</span>
          <span className="text-indigo-200 text-sm">PC / 태블릿</span>
        </Link>

        <Link
          href="/student/login"
          className="flex-1 flex flex-col items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-2xl py-10 px-6 shadow-lg transition-colors"
        >
          <span className="text-5xl">🎓</span>
          <span className="text-2xl font-bold">학생</span>
          <span className="text-emerald-100 text-sm">스마트폰</span>
        </Link>
      </div>
    </main>
  )
}
