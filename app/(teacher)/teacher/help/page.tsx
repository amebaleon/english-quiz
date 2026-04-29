'use client'

import { useState } from 'react'

type Tab = 'guide' | 'troubleshoot' | 'student-questions'

export default function HelpPage() {
  const [tab, setTab] = useState<Tab>('guide')

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">도움말</h2>
        <p className="text-gray-400 text-sm mt-0.5">사이트 이용 방법과 자주 묻는 질문</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {([
          ['guide', '📖 사용법'],
          ['student-questions', '🙋 학생 질문 대응'],
          ['troubleshoot', '🔧 문제 해결'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'guide' && (
        <div className="space-y-8">
          <Section title="처음 시작할 때 순서" emoji="🚀">
            <Step n="1" title="학생 추가하기">
              왼쪽 메뉴의 <Bold>학생 관리</Bold>로 들어갑니다.
              <br />
              <Bold>+ 학생 추가</Bold> 버튼을 누르고 이름과 4자리 PIN(비밀번호)을 정합니다.
              <br />
              <Tip>PIN은 학생이 외우기 쉬운 숫자 4자리로 정해주세요. (예: 1234)</Tip>
            </Step>
            <Step n="2" title="반 만들기 (선택)">
              학생을 반별로 묶고 싶을 때 <Bold>반 관리</Bold> 버튼을 누르고 반 이름을 추가합니다.
              <br />
              학생 옆 드롭다운에서 반을 골라주면 학생이 그 반에 들어갑니다.
            </Step>
            <Step n="3" title="퀴즈 만들기">
              왼쪽 메뉴 <Bold>퀴즈 관리</Bold>로 들어가서 <Bold>+ 퀴즈 추가</Bold>로 새 퀴즈를 만듭니다.
              <br />
              퀴즈 안에 문제를 하나씩 추가할 수도 있고, <Bold>엑셀 업로드</Bold>로 한 번에 여러 문제를 넣을 수도 있습니다.
            </Step>
            <Step n="4" title="세션 시작 (학생들이 풀게 하기)">
              왼쪽 메뉴 <Bold>세션 진행</Bold>으로 가서 풀 퀴즈를 고르고 시작합니다.
              <br />
              화면에 나오는 <Bold>6자리 코드</Bold>를 학생들에게 알려주면 학생이 코드 입력 후 참여합니다.
            </Step>
          </Section>

          <Section title="엑셀로 퀴즈 만들기" emoji="📑">
            <p>퀴즈 편집 창 우측 상단의 <Bold>엑셀 업로드</Bold> 버튼을 누르고 .xlsx 파일을 선택합니다.</p>
            <div className="bg-gray-50 rounded-xl p-4 mt-3">
              <p className="font-semibold text-gray-700 mb-2">엑셀 작성 방법</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="border border-gray-200 px-2 py-1">A열</th>
                    <th className="border border-gray-200 px-2 py-1">B열</th>
                    <th className="border border-gray-200 px-2 py-1">C열</th>
                    <th className="border border-gray-200 px-2 py-1">D열</th>
                    <th className="border border-gray-200 px-2 py-1">E열</th>
                    <th className="border border-gray-200 px-2 py-1">F열</th>
                    <th className="border border-gray-200 px-2 py-1">G열</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  <tr>
                    <td className="border border-gray-200 px-2 py-1.5">문제</td>
                    <td className="border border-gray-200 px-2 py-1.5">선택지1<br/><span className="text-xs text-gray-400">/주관식정답</span></td>
                    <td className="border border-gray-200 px-2 py-1.5">선택지2</td>
                    <td className="border border-gray-200 px-2 py-1.5">선택지3</td>
                    <td className="border border-gray-200 px-2 py-1.5">선택지4</td>
                    <td className="border border-gray-200 px-2 py-1.5">정답번호<br/><span className="text-xs text-gray-400">(1~4)</span></td>
                    <td className="border border-gray-200 px-2 py-1.5">포인트</td>
                  </tr>
                </tbody>
              </table>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li>• <Bold>주관식</Bold>: A에 문제, B에 정답, G에 포인트 (C~F 비움)</li>
                <li>• <Bold>객관식</Bold>: A에 문제, B~E에 4개 선택지, F에 정답 번호(1~4), G에 포인트</li>
                <li>• 포인트(G열) 비우면 자동으로 10점</li>
                <li>• 형식이 안 맞는 행은 업로드 후 어떤 행이 잘못됐는지 빨간 글씨로 알려줍니다</li>
              </ul>
            </div>
          </Section>

          <Section title="세션 진행하기" emoji="▶️">
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• 세션 시작 후 학생들이 들어오면 화면에 참가자 목록이 나타납니다.</li>
              <li>• <Bold>다음 문제</Bold> 버튼을 누르면 학생 화면에 문제가 표시됩니다.</li>
              <li>• 학생들이 답을 제출하면 실시간으로 보입니다.</li>
              <li>• <Bold>객관식</Bold>은 자동으로 채점되고 정답자에게 포인트가 들어갑니다.</li>
              <li>• <Bold>주관식</Bold>은 답변 옆에 ⭕/❌ 버튼을 눌러 직접 채점합니다.</li>
              <li>• 모든 문제가 끝나면 <Bold>세션 종료</Bold>를 누릅니다.</li>
            </ul>
          </Section>

          <Section title="포인트 관리" emoji="💎">
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• 퀴즈 정답으로 포인트가 자동으로 쌓입니다.</li>
              <li>• 수동으로 포인트를 더하거나 뺄 때: 학생 관리 → 학생 옆 <Bold>포인트</Bold> 버튼</li>
              <li>• 반 전체 포인트 초기화: 학생 관리 → 반 관리 → 해당 반 <Bold>포인트 초기화</Bold></li>
              <li>• 학생별 통계 보기: 학생 옆 <Bold>통계</Bold> 버튼</li>
            </ul>
          </Section>
        </div>
      )}

      {tab === 'student-questions' && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">학생들이 자주 물어보는 질문과 대응 방법입니다.</p>

          <FAQ q='"제 이름이 안 보여요"'>
            <p>학생 추가가 안 됐을 가능성이 큽니다.</p>
            <p className="mt-1"><Bold>해결</Bold>: 학생 관리에서 그 학생이 목록에 있는지 확인. 없으면 <Bold>+ 학생 추가</Bold>로 추가해주세요.</p>
          </FAQ>

          <FAQ q='"PIN을 모르겠어요" / "비밀번호 까먹었어요"'>
            <p><Bold>해결</Bold>: 학생 관리 → 그 학생 옆 <Bold>PIN</Bold> 버튼 → 새 PIN 4자리 설정 → 학생에게 알려주기</p>
          </FAQ>

          <FAQ q='"PIN 5번 틀려서 잠겼대요"'>
            <p>15분 기다리거나 선생님이 PIN을 리셋해주면 바로 풀립니다.</p>
            <p className="mt-1"><Bold>해결</Bold>: 학생 관리 → <Bold>PIN</Bold> 버튼 → 새 PIN 설정 (잠금이 자동 해제됩니다)</p>
          </FAQ>

          <FAQ q='"세션 코드가 안 들어가져요"'>
            <ol className="list-decimal pl-5 space-y-1">
              <li>현재 세션이 시작 상태인지 확인 (세션 진행 화면에서 6자리 코드가 보여야 함)</li>
              <li>학생이 코드를 정확히 입력했는지 확인 (대소문자 X, 숫자만)</li>
              <li>이미 종료된 세션 코드를 입력하고 있을 수 있음 → 새로 시작</li>
            </ol>
          </FAQ>

          <FAQ q='"답이 제출이 안 돼요"'>
            <ol className="list-decimal pl-5 space-y-1">
              <li>학생 폰의 인터넷 연결 확인</li>
              <li>화면을 한 번 새로고침 (위에서 아래로 당기기)</li>
              <li>로그아웃 후 다시 로그인</li>
            </ol>
          </FAQ>

          <FAQ q='"이미 답을 냈어요" 메시지가 떠요'>
            <p>그 문제는 한 번만 답할 수 있습니다. 다음 문제로 넘어갈 때까지 기다리면 됩니다.</p>
          </FAQ>

          <FAQ q='"포인트가 이상해요"'>
            <p><Bold>해결</Bold>: 학생 관리 → <Bold>통계</Bold> 버튼으로 최근 포인트 변동 내역 확인 가능. 잘못된 부분은 <Bold>포인트</Bold> 버튼으로 직접 +/-</p>
          </FAQ>
        </div>
      )}

      {tab === 'troubleshoot' && (
        <div className="space-y-4">
          <FAQ q="페이지가 안 열려요 / 로딩이 너무 오래 걸려요">
            <ol className="list-decimal pl-5 space-y-1">
              <li>인터넷 연결 확인</li>
              <li>브라우저 새로고침 (F5 또는 Ctrl+R)</li>
              <li>다른 브라우저로 시도 (크롬 권장)</li>
              <li>일주일 이상 사이트를 안 썼다면 데이터베이스가 일시정지됐을 수 있음 — 1~2분 후 다시 시도</li>
            </ol>
          </FAQ>

          <FAQ q="로그인이 안 돼요">
            <p>이메일/비밀번호 확인. 비밀번호 까먹었으면 자녀에게 문의하세요 (Supabase 대시보드에서 리셋 가능).</p>
          </FAQ>

          <FAQ q="학생 추가했는데 목록에 안 보여요">
            <p>화면을 새로고침해보세요. 그래도 안 보이면 학생을 다시 추가해주세요.</p>
          </FAQ>

          <FAQ q="엑셀 업로드를 했는데 문제가 안 들어갔어요">
            <ul className="list-disc pl-5 space-y-1">
              <li>형식이 안 맞는 행은 빨간 글씨로 표시됩니다 (어떤 행이 왜 안 됐는지 나옴)</li>
              <li>형식이 맞는 행만 정상 추가되고, 안 맞는 행은 무시됩니다</li>
              <li>가장 흔한 실수: 객관식인데 정답 번호(F열) 안 적음, 또는 1~4가 아닌 숫자 적음</li>
            </ul>
          </FAQ>

          <FAQ q="세션을 시작했는데 학생들이 못 들어와요">
            <ol className="list-decimal pl-5 space-y-1">
              <li>학생들에게 알려준 6자리 코드가 정확한지 확인</li>
              <li>학생들이 먼저 자기 이름으로 로그인을 했는지 확인</li>
              <li>세션이 정말 시작된 상태인지 확인 (대기 중이 아닌)</li>
            </ol>
          </FAQ>

          <FAQ q="실수로 학생/퀴즈를 삭제했어요">
            <p>삭제는 되돌릴 수 없습니다. 학생은 다시 추가, 퀴즈는 다시 만들어야 합니다.</p>
            <p className="mt-1 text-amber-600">⚠ 삭제 버튼 누를 때 항상 한 번 더 확인 메시지가 뜨니 주의해주세요.</p>
          </FAQ>

          <FAQ q="여전히 안 되면">
            <p>자녀(개발자)에게 다음 정보와 함께 연락:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>어떤 화면에서 무슨 버튼을 눌렀을 때 문제가 생겼는지</li>
              <li>화면에 어떤 메시지가 떴는지 (캡처하면 가장 좋음)</li>
              <li>몇 시쯤 발생했는지</li>
            </ul>
          </FAQ>
        </div>
      )}
    </div>
  )
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h3>
      <div className="space-y-3 text-gray-700">{children}</div>
    </section>
  )
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
        {n}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800 mb-1">{title}</p>
        <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="font-semibold text-gray-800 mb-2">Q. {q}</p>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  )
}

function Bold({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-indigo-600">{children}</span>
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
      💡 {children}
    </p>
  )
}
