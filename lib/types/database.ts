export type Role = 'teacher' | 'student'
export type QuestionType = 'multiple' | 'short'
export type SessionStatus = 'waiting' | 'active' | 'revealed' | 'finished'

export interface Class {
  id: string
  name: string
  created_at: string
}

export interface User {
  id: string
  name: string
  role: Role
  pin_hash: string | null
  class_id: string | null
  total_points: number
  created_at: string
  auth_id: string | null
}

export interface Quiz {
  id: string
  title: string
  created_at: string
}

export interface Question {
  id: string
  quiz_id: string
  type: QuestionType
  content: string
  options: string[] | null
  answer: string
  points: number
  order_index: number
}

export interface Session {
  id: string
  quiz_id: string
  code: string
  status: SessionStatus
  current_question_index: number
  created_at: string
}

export interface SessionParticipant {
  session_id: string
  student_id: string
  joined_at: string
}

export interface Answer {
  id: string
  session_id: string
  question_id: string
  student_id: string
  content: string
  is_correct: boolean | null
  submitted_at: string
}

export interface PointsHistory {
  id: string
  student_id: string
  delta: number
  reason: string
  created_at: string
}

// API 응답 공통 타입
export interface ApiResponse<T = undefined> {
  success: boolean
  data?: T
  error?: string
}
