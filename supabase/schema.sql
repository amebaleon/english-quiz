-- ============================================================
-- 영어학원 퀴즈 앱 — Supabase Schema
-- Supabase SQL Editor에 전체 복붙하여 실행
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. 테이블 생성 (함수보다 먼저!)
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.classes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  role         text NOT NULL CHECK (role IN ('teacher', 'student')),
  pin_hash     text,
  class_id     uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  total_points integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  auth_id      uuid UNIQUE
);

CREATE TABLE IF NOT EXISTS public.quizzes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('multiple', 'short')),
  content     text NOT NULL,
  options     jsonb,
  answer      text NOT NULL,
  points      integer NOT NULL DEFAULT 10,
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id                uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  code                   text NOT NULL UNIQUE,
  status                 text NOT NULL DEFAULT 'waiting'
                           CHECK (status IN ('waiting', 'active', 'revealed', 'finished')),
  current_question_index integer NOT NULL DEFAULT -1,
  exam_mode              boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_participants (
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_id  uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  student_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      text NOT NULL,
  is_correct   boolean,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.points_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delta      integer NOT NULL,
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- 2. 인덱스
-- ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_class_id         ON public.users(class_id);
CREATE INDEX IF NOT EXISTS idx_users_role             ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id      ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order        ON public.questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_sessions_code          ON public.sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_status        ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sp_session_id          ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_sp_student_id          ON public.session_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_session_id     ON public.answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id    ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_student_id     ON public.answers(student_id);
CREATE INDEX IF NOT EXISTS idx_points_history_student ON public.points_history(student_id);

-- ──────────────────────────────────────────────────────────
-- 3. 헬퍼 함수 (테이블 생성 후에!)
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

-- ──────────────────────────────────────────────────────────
-- 4. RLS 활성화
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.classes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history       ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────
-- 5. RLS 정책
-- ──────────────────────────────────────────────────────────

-- classes
CREATE POLICY "teacher_all_classes" ON public.classes
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

CREATE POLICY "authenticated_read_classes" ON public.classes
  FOR SELECT USING (auth.role() = 'authenticated');

-- users
CREATE POLICY "teacher_all_users" ON public.users
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

CREATE POLICY "teacher_read_own_profile" ON public.users
  FOR SELECT USING (auth_id = auth.uid());

-- quizzes
CREATE POLICY "teacher_all_quizzes" ON public.quizzes
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

CREATE POLICY "authenticated_read_quizzes" ON public.quizzes
  FOR SELECT USING (auth.role() = 'authenticated');

-- questions
CREATE POLICY "teacher_all_questions" ON public.questions
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

CREATE POLICY "authenticated_read_questions" ON public.questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- sessions
CREATE POLICY "teacher_all_sessions" ON public.sessions
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

CREATE POLICY "anyone_read_sessions" ON public.sessions
  FOR SELECT USING (true);

-- session_participants
CREATE POLICY "teacher_all_participants" ON public.session_participants
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- answers
CREATE POLICY "teacher_all_answers" ON public.answers
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- points_history
CREATE POLICY "teacher_all_points_history" ON public.points_history
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- ──────────────────────────────────────────────────────────
-- 6. Realtime 활성화
-- ──────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;

-- ──────────────────────────────────────────────────────────
-- 7. 포인트 자동 갱신 트리거
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_total_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET total_points = total_points + NEW.delta
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_total_points
AFTER INSERT ON public.points_history
FOR EACH ROW EXECUTE FUNCTION public.update_total_points();

-- ──────────────────────────────────────────────────────────
-- 완료!
-- 다음: Authentication > Users 에서 선생님 계정 생성 후
-- INSERT INTO public.users (name, role, auth_id)
-- VALUES ('선생님이름', 'teacher', '복사한UUID');
-- ──────────────────────────────────────────────────────────
