'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'teacher_tutorial_seen'

const slides = [
  {
    emoji: '👋',
    title: '환영합니다!',
    body: '영어 학원용 실시간 퀴즈 앱입니다. 딱 1분만 읽으면 바로 사용할 수 있어요.',
  },
  {
    emoji: '👥',
    title: '1. 학생부터 추가하세요',
    body: '"학생 관리"에서 학생 이름·반·PIN(4자리)을 등록합니다. 엑셀 파일로 한꺼번에 올릴 수도 있어요. 학생들은 PIN으로 로그인합니다.',
  },
  {
    emoji: '📝',
    title: '2. 퀴즈를 만드세요',
    body: '"퀴즈 관리"에서 객관식·주관식 문제를 추가하세요. 엑셀 업로드, 미리보기, 퀴즈 복제 기능도 있습니다.',
  },
  {
    emoji: '▶️',
    title: '3. 세션을 시작하고 진행하세요',
    body: '"세션 진행"에서 퀴즈를 선택하면 6자리 코드와 QR코드가 생성됩니다. 문제마다 건너뛰기, 정답 공개 후 다음 문제로 넘어가세요.',
  },
  {
    emoji: '📊',
    title: '4. 결과를 확인하고 저장하세요',
    body: '세션 종료 후 대시보드에서 참가자별 정답률·점수를 확인하고 엑셀로 저장할 수 있습니다. 도움말 메뉴에 자세한 사용법이 있어요.',
  },
]

export default function Tutorial() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setShow(true)
    }
  }, [])

  function close() {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  function next() {
    if (step < slides.length - 1) setStep(step + 1)
    else close()
  }

  if (!show) return null

  const slide = slides[step]
  const last = step === slides.length - 1

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={close}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">{slide.emoji}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">{slide.title}</h3>
          <p className="text-gray-600 leading-relaxed">{slide.body}</p>
        </div>

        <div className="flex justify-center gap-1.5 pb-5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={close}
            className="flex-1 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
          >
            건너뛰기
          </button>
          {last ? (
            <Link
              href="/teacher/help"
              onClick={close}
              className="flex-1 py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-center"
            >
              도움말 보기
            </Link>
          ) : (
            <button
              onClick={next}
              className="flex-1 py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
            >
              다음 →
            </button>
          )}
        </div>

        {last && (
          <button
            onClick={close}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 pb-4"
          >
            나중에 보기
          </button>
        )}
      </div>
    </div>
  )
}
