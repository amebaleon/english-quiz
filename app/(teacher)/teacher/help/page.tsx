'use client'

import { useState, useMemo } from 'react'

type Tab = 'guide' | 'session' | 'students' | 'quiz' | 'troubleshoot' | 'student-questions'

interface HelpItem {
  tab: Tab
  q: string
  body: string
}

const HELP_ITEMS: HelpItem[] = [
  // 시작 가이드
  { tab: 'guide', q: '처음 시작 순서', body: '학생 추가 → 반 만들기(선택) → 퀴즈 만들기 → 세션 시작' },
  { tab: 'guide', q: '학생 추가하기', body: '학생 관리 > + 학생 추가. 이름과 4~6자리 PIN을 설정합니다. PIN은 학생이 기억하기 쉬운 숫자로 설정해 주세요.' },
  { tab: 'guide', q: '반 만들기', body: '학생 관리 > 반 관리 버튼으로 반을 추가합니다. 학생 목록에서 드롭다운으로 반을 배정할 수 있습니다.' },
  { tab: 'guide', q: '퀴즈 만들기', body: '퀴즈 관리 > + 퀴즈 만들기. 제목과 카테고리를 설정하면 퀴즈가 생성됩니다. 이후 문제 편집에서 문제를 추가합니다.' },
  { tab: 'guide', q: '세션 시작하기', body: '세션 진행 > 퀴즈를 선택하고 세션 시작. 화면에 표시되는 6자리 코드 또는 QR코드를 학생에게 알려줍니다.' },
  { tab: 'guide', q: '학생 일괄 등록 (CSV/엑셀)', body: '학생 관리 > 일괄 등록. CSV 파일이나 텍스트를 붙여넣어 여러 명을 한 번에 등록합니다. 형식: 이름,PIN,반이름(선택). 최대 200명.' },
  { tab: 'guide', q: '로그인 유지', body: '선생님 계정은 브라우저를 닫아도 로그인이 유지됩니다(Supabase 세션). 학생은 7일간 쿠키로 로그인 상태가 유지됩니다.' },
  { tab: 'guide', q: 'QR코드로 학생 입장', body: '세션 진행 화면의 QR코드를 학생이 스캔하면 자동으로 입장 코드 입력 페이지로 이동합니다. 학생이 로그인 상태라면 바로 참여됩니다.' },

  // 세션 진행
  { tab: 'session', q: '세션 진행 흐름', body: '세션 시작 → 학생 입장 대기 → 퀴즈 시작! → 문제 표시 → 정답 공개 → 다음 문제 반복 → 세션 종료' },
  { tab: 'session', q: '키보드 단축키', body: 'Space 또는 → 키로 [정답 공개] 또는 [다음 문제]를 바로 누를 수 있습니다. 입력창에 포커스가 없을 때만 작동합니다.' },
  { tab: 'session', q: '객관식 자동 채점', body: '정답 공개 시 정답을 맞힌 학생에게 자동으로 포인트가 지급됩니다. 선생님이 따로 채점할 필요가 없습니다.' },
  { tab: 'session', q: '주관식 수동 채점', body: '정답 공개 후 학생 답변 옆의 ⭕/❌ 버튼으로 직접 채점합니다. 정답으로 채점하면 포인트가 즉시 지급됩니다.' },
  { tab: 'session', q: '답변 현황 확인', body: '문제 진행 중 제출/미제출 탭으로 학생을 구분해서 볼 수 있습니다. 정답 공개 후에는 정답/오답/미제출 탭으로 분류됩니다.' },
  { tab: 'session', q: '현재 랭킹 확인', body: '세션 진행 중 참가자 카드 아래 "현재 랭킹 확인" 버튼을 누르면 실시간 점수 순위를 볼 수 있습니다.' },
  { tab: 'session', q: '문제 건너뛰기', body: '채점 없이 다음 문제로 넘어가려면 정답 공개 전 건너뛰기 버튼을 누릅니다.' },
  { tab: 'session', q: '세션 강제 종료', body: '대기 중이거나 진행 중인 세션을 중단하려면 왼쪽 하단 세션 종료 버튼을 누릅니다.' },
  { tab: 'session', q: '이미 진행 중인 세션 복원', body: '페이지를 새로고침하거나 다시 접속해도 진행 중인 세션이 자동으로 복원됩니다.' },
  { tab: 'session', q: '참가자가 0명으로 보여요', body: '페이지를 새로고침해보세요. 실시간 연결이 지연될 경우 3초 폴링으로 자동 보완됩니다.' },

  // 학생 관리
  { tab: 'students', q: '학생 PIN 초기화', body: '학생 관리 > 학생 옆 PIN 버튼 > 새 PIN 설정. 잠긴 계정도 PIN을 재설정하면 즉시 잠금이 해제됩니다.' },
  { tab: 'students', q: '학생이 직접 PIN 변경', body: '학생이 자기 프로필 페이지에서 현재 PIN을 입력하고 새 PIN으로 변경할 수 있습니다.' },
  { tab: 'students', q: '포인트 직접 조정', body: '학생 관리 > 포인트 버튼으로 포인트를 직접 추가하거나 차감할 수 있습니다. 음수 입력도 가능합니다.' },
  { tab: 'students', q: '반 전체 포인트 초기화', body: '학생 관리 > 반 필터 선택 후 반 포인트 초기화 버튼 클릭. 또는 반 관리 모달에서 포인트 초기화를 누릅니다.' },
  { tab: 'students', q: '학생 통계 보기', body: '학생 옆 통계 버튼으로 해당 학생의 정답률, 참여 세션 수, 획득 포인트 히스토리를 확인할 수 있습니다.' },
  { tab: 'students', q: '학생 삭제', body: '학생 삭제는 되돌릴 수 없습니다. 삭제 시 해당 학생의 모든 답변 기록과 포인트도 삭제됩니다. 확인 메시지를 꼭 확인하세요.' },
  { tab: 'students', q: '반 삭제 시 학생은?', body: '반을 삭제해도 학생은 삭제되지 않습니다. 해당 학생들의 반이 "없음"으로 변경됩니다.' },

  // 퀴즈 관리
  { tab: 'quiz', q: '엑셀로 문제 일괄 추가', body: '퀴즈 편집 > 엑셀 업로드 버튼. A열: 문제, B열: 선지수(1=주관식, 2이상=객관식, 비우면 자동인식), 그 뒤로 선지 → 정답 → 포인트 순서.' },
  { tab: 'quiz', q: '엑셀 — 선지수 명시 방식', body: 'B열에 선지 개수를 적습니다. 1이면 주관식, 2이상이면 그 수만큼 선지가 이어집니다.\n\n예) 3선지 객관식: "사과는?" | 3 | apple | banana | cherry | 1 | 10\n예) 주관식: "apple의 뜻은?" | 1 | 사과 | 10' },
  { tab: 'quiz', q: '엑셀 — 자동인식 방식 (B열 비워두기)', body: 'B열을 비워두면 마지막 2열(정답, 포인트)을 제외한 나머지를 선지로 자동 인식합니다.\n\n예) 자동 주관식: "dog의 뜻은?" | (빈칸) | 개 | 10\n예) 자동 2선지: "O/X?" | (빈칸) | O | X | 1 | 10\n예) 자동 3선지: "수도는?" | (빈칸) | 서울 | 도쿄 | 베이징 | 1 | 10' },
  { tab: 'quiz', q: '기존 엑셀 파일은 어떻게 되나요?', body: '기존 형식(B~E에 4개 선지 고정)은 B열이 텍스트(선지 내용)이므로 자동인식 모드로 처리됩니다. 마지막 2열이 정답 번호와 포인트로 인식되어 정상 임포트됩니다.' },
  { tab: 'quiz', q: '선지 개수를 다르게 만들 수 있나요?', body: '문제 편집 폼에서 "+ 선지 추가" 버튼으로 선지를 늘리거나, 각 선지 옆 ✕로 줄일 수 있습니다. 최소 2개, 제한 없이 추가 가능합니다.' },
  { tab: 'quiz', q: '선지 순서 변경', body: '문제 편집 폼에서 각 선지 왼쪽 ⠿ 핸들을 드래그해서 순서를 바꿉니다. 정답 표시(파란 번호)가 자동으로 따라옵니다.' },
  { tab: 'quiz', q: '퀴즈 카테고리', body: '퀴즈 생성 시 카테고리를 설정하면 퀴즈 목록에서 탭으로 필터링됩니다. 카테고리: 문법, 어휘, 독해, 듣기, 회화, 쓰기, 기타 또는 직접 입력.' },
  { tab: 'quiz', q: '퀴즈 복제', body: '퀴즈 카드의 복제 버튼으로 퀴즈와 모든 문제를 복사합니다. 비슷한 퀴즈를 빠르게 만들 때 유용합니다.' },
  { tab: 'quiz', q: '문제 삭제는 되돌릴 수 없음', body: '문제 삭제 시 복구가 불가능합니다. 해당 문제의 답변 기록도 함께 삭제됩니다.' },

  // 학생 질문 대응
  { tab: 'student-questions', q: '"제 이름이 안 보여요"', body: '학생 추가가 안 됐을 가능성이 큽니다. 학생 관리에서 목록 확인. 없으면 + 학생 추가로 추가해 주세요.' },
  { tab: 'student-questions', q: '"PIN을 모르겠어요 / 까먹었어요"', body: '학생 관리 > 해당 학생 PIN 버튼 > 새 PIN 설정 후 알려주기. 학생 본인이 프로필에서 변경할 수도 있습니다.' },
  { tab: 'student-questions', q: '"PIN 5번 틀려서 잠겼어요"', body: '15분 대기하거나, 선생님이 PIN을 재설정해 주면 바로 해제됩니다. 학생 관리 > PIN 버튼 > 새 PIN 설정.' },
  { tab: 'student-questions', q: '"세션 코드가 안 들어가져요"', body: '① 세션이 시작된 상태인지 확인 ② 코드 6자리 정확히 입력 ③ 이미 종료된 세션이면 새 세션 시작' },
  { tab: 'student-questions', q: '"답이 제출이 안 돼요"', body: '① 인터넷 연결 확인 ② 화면 새로고침(위에서 아래로 당기기) ③ 로그아웃 후 재로그인' },
  { tab: 'student-questions', q: '"이미 답을 냈어요" 메시지가 떠요', body: '한 문제당 한 번만 답할 수 있습니다. 다음 문제로 넘어갈 때까지 대기하면 됩니다.' },
  { tab: 'student-questions', q: '"포인트가 이상해요"', body: '학생 관리 > 통계 버튼으로 포인트 변동 내역 확인. 잘못된 부분은 포인트 버튼으로 직접 수정 가능.' },
  { tab: 'student-questions', q: '"랭킹에 제가 안 보여요"', body: '반이 배정된 학생들만 랭킹에 표시됩니다. 학생 관리에서 반을 배정해 주세요.' },
  { tab: 'student-questions', q: '"QR코드가 작동 안 해요"', body: '① QR 앱이 아닌 기본 카메라 앱으로 스캔 ② 와이파이/데이터 연결 확인 ③ 코드 숫자를 직접 입력하게 안내' },

  // 문제 해결
  { tab: 'troubleshoot', q: '페이지가 안 열려요 / 로딩이 너무 오래 걸려요', body: '① 인터넷 연결 확인 ② F5로 새로고침 ③ 크롬 브라우저 사용 권장 ④ 1~2주 이상 사용 안 했다면 DB 절전 모드 가능 → 1~2분 후 다시 시도' },
  { tab: 'troubleshoot', q: '선생님 로그인이 안 돼요', body: '이메일/비밀번호 확인. 비밀번호를 잊은 경우 Supabase 대시보드에서 리셋하거나 개발자에게 문의하세요.' },
  { tab: 'troubleshoot', q: '학생 추가했는데 목록에 안 보여요', body: '화면을 새로고침해보세요. 그래도 안 보이면 다시 추가해주세요.' },
  { tab: 'troubleshoot', q: '엑셀 업로드가 안 됐어요', body: '형식이 안 맞는 행은 오류 메시지로 표시됩니다. 흔한 실수: 자동인식 모드에서 마지막 열이 숫자(포인트)가 아닌 경우, 또는 정답 번호가 선지 수 범위를 벗어난 경우.' },
  { tab: 'troubleshoot', q: '세션 시작했는데 학생이 못 들어와요', body: '① 6자리 코드가 정확한지 확인 ② 학생이 먼저 로그인했는지 확인 ③ 세션이 대기 중인지 확인 (이미 active면 입장 가능)' },
  { tab: 'troubleshoot', q: '실시간 업데이트가 안 돼요', body: '3초마다 자동 폴링이 작동하니 잠시 기다리면 됩니다. 아예 안 보이면 새로고침 후 세션이 복원됩니다.' },
  { tab: 'troubleshoot', q: '실수로 학생/퀴즈를 삭제했어요', body: '삭제는 되돌릴 수 없습니다. 학생은 다시 추가, 퀴즈는 다시 만들어야 합니다. ⚠ 삭제 전 확인 메시지를 꼭 확인하세요.' },
  { tab: 'troubleshoot', q: '모바일에서 화면이 깨져요', body: '이 서비스는 PC 화면 선생님 / 모바일 학생 구조입니다. 선생님 페이지는 PC 또는 태블릿에서 사용을 권장합니다.' },
  { tab: 'troubleshoot', q: '여전히 해결이 안 된다면', body: '개발자에게 ① 어떤 화면에서 ② 무슨 버튼을 눌렀을 때 ③ 어떤 메시지가 떴는지(캡처 권장) ④ 발생 시각을 알려주세요.' },
]

const TABS: { key: Tab; label: string }[] = [
  { key: 'guide', label: '시작 가이드' },
  { key: 'session', label: '세션 진행' },
  { key: 'students', label: '학생 관리' },
  { key: 'quiz', label: '퀴즈 관리' },
  { key: 'student-questions', label: '학생 질문 대응' },
  { key: 'troubleshoot', label: '문제 해결' },
]

export default function HelpPage() {
  const [tab, setTab] = useState<Tab>('guide')
  const [search, setSearch] = useState('')

  const isSearching = search.trim().length > 0
  const searchLower = search.trim().toLowerCase()

  const searchResults = useMemo(() => {
    if (!isSearching) return []
    return HELP_ITEMS.filter(
      item =>
        item.q.toLowerCase().includes(searchLower) ||
        item.body.toLowerCase().includes(searchLower)
    )
  }, [searchLower, isSearching])

  const tabItems = HELP_ITEMS.filter(item => item.tab === tab)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">도움말</h2>
        <p className="text-gray-400 text-sm mt-0.5">사이트 이용 방법과 자주 묻는 질문</p>
      </div>

      {/* 검색 */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="궁금한 내용을 검색해보세요... (예: PIN, 세션, 엑셀)"
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* 검색 결과 */}
      {isSearching ? (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            <span className="font-semibold text-indigo-600">"{search}"</span> 검색 결과{' '}
            {searchResults.length > 0 ? `${searchResults.length}건` : '없음'}
          </p>
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-400 text-sm">검색 결과가 없습니다.</p>
              <p className="text-gray-300 text-xs mt-1">다른 키워드로 검색해보세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((item, i) => {
                const tabInfo = TABS.find(t => t.key === item.tab)
                return (
                  <FAQCard key={i} q={item.q} badge={tabInfo?.label}>
                    <BodyText text={item.body} />
                  </FAQCard>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 탭 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tab === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          {tab === 'guide' && <GuideTab />}

          {tab !== 'guide' && (
            <div className="space-y-3">
              {tabItems.map((item, i) => (
                <FAQCard key={i} q={item.q}>
                  <BodyText text={item.body} />
                </FAQCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function GuideTab() {
  return (
    <div className="space-y-6">
      {/* 빠른 시작 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span>🚀</span> 처음 시작 순서
        </h3>
        <div className="space-y-4">
          {[
            { n: '1', title: '학생 추가하기', desc: '학생 관리 > + 학생 추가. 이름과 4~6자리 PIN을 설정합니다.', tip: '일괄 등록 버튼으로 CSV/엑셀 파일을 사용하면 여러 명을 한 번에 추가할 수 있습니다.' },
            { n: '2', title: '반 만들기 (선택)', desc: '학생을 반별로 묶고 싶다면 반 관리 버튼에서 반을 추가한 뒤, 학생 드롭다운에서 반을 배정합니다.' },
            { n: '3', title: '퀴즈 만들기', desc: '퀴즈 관리 > + 퀴즈 만들기. 카테고리를 정하고, 문제 편집 또는 엑셀 업로드로 문제를 추가합니다.' },
            { n: '4', title: '세션 시작!', desc: '세션 진행 > 퀴즈 선택 > 세션 시작. 6자리 코드 또는 QR코드를 학생에게 알려주면 바로 시작됩니다.' },
          ].map(({ n, title, desc, tip }) => (
            <div key={n} className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
                {n}
              </div>
              <div className="flex-1 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <p className="font-semibold text-gray-800 mb-1">{title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                {tip && (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">💡 {tip}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 엑셀 문제 추가 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span>📑</span> 엑셀로 문제 일괄 추가
        </h3>
        <p className="text-sm text-gray-500 mb-4">퀴즈 편집 창 우측 상단 <Bold>엑셀 업로드</Bold> 버튼 → .xlsx 파일 선택</p>

        {/* 열 구조 설명 */}
        <div className="overflow-x-auto mb-5">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-indigo-50">
                <th className="border border-gray-200 px-3 py-2 text-indigo-700 font-semibold text-left">열</th>
                <th className="border border-gray-200 px-3 py-2 text-indigo-700 font-semibold text-left">내용</th>
                <th className="border border-gray-200 px-3 py-2 text-indigo-700 font-semibold text-left">비고</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              <tr className="bg-white">
                <td className="border border-gray-200 px-3 py-2 font-semibold">A열</td>
                <td className="border border-gray-200 px-3 py-2">문제 내용</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-400">필수</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-2 font-semibold">B열</td>
                <td className="border border-gray-200 px-3 py-2">선지 수</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-500">1=주관식 · 2이상=객관식 · <span className="text-indigo-500">비우면 자동인식</span></td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-3 py-2 font-semibold">C~열</td>
                <td className="border border-gray-200 px-3 py-2">선지 내용</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-400">객관식일 때 선지 수만큼</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-2 font-semibold">다음 열</td>
                <td className="border border-gray-200 px-3 py-2">정답</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-400">객관식: 1부터 시작하는 번호 · 주관식: 정답 텍스트</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-3 py-2 font-semibold">마지막 열</td>
                <td className="border border-gray-200 px-3 py-2">포인트</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-400">생략 시 기본 10점</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 예시 */}
        <div className="space-y-4">
          <ExcelExample
            title="B열 명시 — 주관식 (B=1)"
            color="emerald"
            rows={[
              ['apple의 뜻은?', '1', '사과', '10'],
              ['dog의 뜻은?', '1', '개', '5'],
            ]}
            headers={['A: 문제', 'B: 선지수', 'C: 정답', 'D: 포인트']}
          />
          <ExcelExample
            title="B열 명시 — 2선지 객관식 (B=2)"
            color="sky"
            rows={[
              ['파리는 어느 나라 수도?', '2', 'France', 'Germany', '1', '10'],
            ]}
            headers={['A: 문제', 'B: 선지수', 'C: 선지1', 'D: 선지2', 'E: 정답번호', 'F: 포인트']}
          />
          <ExcelExample
            title="B열 명시 — 4선지 객관식 (B=4)"
            color="violet"
            rows={[
              ['사과의 영어는?', '4', 'apple', 'banana', 'cherry', 'grape', '1', '10'],
            ]}
            headers={['A: 문제', 'B: 선지수', 'C~F: 선지', '', '', '', 'G: 정답번호', 'H: 포인트']}
          />
          <ExcelExample
            title="B열 비워두기 — 자동인식"
            color="amber"
            rows={[
              ['apple의 뜻은?', '', '사과', '10', '', '', '', ''],
              ['수도는?', '', '서울', '도쿄', '베이징', '1', '10', ''],
              ['What is 2+2?', '', 'A:1', 'B:2', 'C:4', 'D:8', '3', '5'],
            ]}
            headers={['A: 문제', 'B: (빈칸)', 'C~: 선지들 or 정답', '...', '...', '...', '끝에서2번째: 정답', '마지막: 포인트']}
            note="B열이 비면 마지막 2열을 정답·포인트로 보고, 그 앞이 선지. 선지 0개면 주관식."
          />
        </div>

        <p className="mt-4 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          💡 형식이 맞지 않는 행은 오류 메시지로 표시되고 해당 행만 건너뜁니다. 나머지는 정상 추가됩니다.
        </p>
      </section>

      {/* 학생 일괄 등록 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>👥</span> 학생 일괄 등록
        </h3>
        <p className="text-sm text-gray-600 mb-3">학생 관리 {'>'} <Bold>일괄 등록</Bold>. CSV 파일, 엑셀 파일, 또는 텍스트 직접 붙여넣기를 지원합니다.</p>
        <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm text-gray-700 space-y-1">
          <p className="text-xs text-gray-400 mb-2 font-sans font-semibold">형식: 이름,PIN,반이름(선택)</p>
          <p>홍길동,1234,3학년A반</p>
          <p>이순신,5678,3학년B반</p>
          <p>강감찬,0000</p>
        </div>
        <ul className="mt-3 space-y-1 text-sm text-gray-600">
          <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">✓</span><span>반 이름은 없어도 됩니다. 새 반 이름이면 자동 생성됩니다</span></li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">✓</span><span>한 번에 최대 200명 등록 가능</span></li>
        </ul>
      </section>

      {/* 키보드 단축키 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⌨️</span> 세션 키보드 단축키
        </h3>
        <div className="space-y-3">
          {[
            { keys: ['Space', '→'], action: '정답 공개 / 다음 문제로 이동', note: '입력창에 포커스가 없을 때만 작동' },
          ].map(({ keys, action, note }) => (
            <div key={action} className="flex items-center gap-4">
              <div className="flex gap-1">
                {keys.map(k => (
                  <kbd key={k} className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono font-semibold text-gray-700 shadow-sm">
                    {k}
                  </kbd>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{action}</p>
                {note && <p className="text-xs text-gray-400">{note}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

type ExColor = 'emerald' | 'sky' | 'violet' | 'amber'
const COLOR_MAP: Record<ExColor, { header: string; row: string; badge: string }> = {
  emerald: { header: 'bg-emerald-50 text-emerald-700', row: 'bg-white', badge: 'bg-emerald-100 text-emerald-700' },
  sky:     { header: 'bg-sky-50 text-sky-700',         row: 'bg-white', badge: 'bg-sky-100 text-sky-700' },
  violet:  { header: 'bg-violet-50 text-violet-700',   row: 'bg-white', badge: 'bg-violet-100 text-violet-700' },
  amber:   { header: 'bg-amber-50 text-amber-700',     row: 'bg-white', badge: 'bg-amber-100 text-amber-700' },
}

function ExcelExample({ title, color, rows, headers, note }: {
  title: string
  color: ExColor
  rows: string[][]
  headers: string[]
  note?: string
}) {
  const c = COLOR_MAP[color]
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className={`px-4 py-2 text-xs font-semibold ${c.badge}`}>{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className={c.header}>
              {headers.map((h, i) => (
                <th key={i} className="border border-gray-200 px-2 py-1.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={c.row}>
                {row.map((cell, ci) => (
                  <td key={ci} className={`border border-gray-100 px-2 py-1.5 text-center font-mono ${cell === '' ? 'text-gray-200' : 'text-gray-700'}`}>
                    {cell === '' ? '—' : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">{note}</p>}
    </div>
  )
}

function FAQCard({ q, children, badge }: { q: string; children: React.ReactNode; badge?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {badge && (
            <span className="text-xs bg-indigo-50 text-indigo-500 font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">{badge}</span>
          )}
          <span className="font-semibold text-gray-800 text-sm">{q}</span>
        </div>
        <span className={`text-gray-400 text-sm transition-transform shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

function BodyText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').map((block, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {block.split('\n').map((line, j) => (
            <span key={j}>{line}{j < block.split('\n').length - 1 && <br />}</span>
          ))}
        </p>
      ))}
    </>
  )
}

function Bold({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-indigo-600">{children}</span>
}
