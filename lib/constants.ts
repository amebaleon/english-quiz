import type { SessionStatus } from './types/database'

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  waiting: '대기 중',
  active: '진행 중',
  revealed: '정답 공개',
  finished: '완료',
}

export const SESSION_STATUS_COLOR: Record<SessionStatus, string> = {
  waiting: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  revealed: 'bg-amber-100 text-amber-700',
  finished: 'bg-gray-100 text-gray-500',
}
