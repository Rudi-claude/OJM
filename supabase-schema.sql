-- 오점뭐 서비스 Supabase 스키마
-- https://supabase.com 에서 프로젝트 생성 후 SQL Editor에서 실행하세요

-- 익명 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 식사 기록 테이블
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id VARCHAR(50) NOT NULL,
  restaurant_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  ate_at TIMESTAMPTZ DEFAULT NOW(),
  weather VARCHAR(50),
  mood VARCHAR(50)
);

-- 인덱스 생성
CREATE INDEX idx_meal_logs_user ON meal_logs(user_id, ate_at DESC);
CREATE INDEX idx_meal_logs_category ON meal_logs(category);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- 익명 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own meal logs" ON meal_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own meal logs" ON meal_logs
  FOR INSERT WITH CHECK (true);

-- 예제 데이터 (선택사항)
-- INSERT INTO users (anonymous_id) VALUES ('test-user-123');
