'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'teacher_tutorial_seen'

const slides = [
  {
    emoji: '👋',
    title: '환영합니다!',
    body: '영어퀴즈 사이트를 처음 방문하셨네요. 잠깐만 시간을 내어 사용 방법을 살펴봐 주세요.',
  },
  {
    emoji: '👥',
    title: '1. 학생부터 추가하세요',
    body: '왼쪽 메뉴 "학생 관리"에서 학생 이름과 PIN(4자리 비밀번호)을 등록합니다. 학생들은 이걸로 로그인합니다.',
  },
  {
    emoji: '📝',
    title: '2. 퀴즈를 만드세요',
    body: '"퀴즈 관리"에서 퀴즈를 만들고 문제를 추가합니다. 엑셀 파일로 한꺼번에 업로드도 가능합니다.',
  },
  {
    emoji: '▶️',
    title: '3. 수업 시간에 세션을 시작하세요',
    body: '"세션 진행"에서 퀴즈를 골라 시작하면 6자리 코드가 나옵니다. 학생들에게 그 코드를 알려주면 됩니다.',
  },
  {
    emoji: '❓',
    title: '막히면 도움말을 보세요',
    body: '왼쪽 메뉴의 "도움말"에 사용법, 학생 질문 대응, 문제 해결 방법이 정리되어 있습니다.',
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
