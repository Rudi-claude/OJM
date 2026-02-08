-- users에 닉네임 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(20);

-- 팀
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(6) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팀 멤버
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 팀 룰렛 (결과만 저장, 애니메이션은 Broadcast)
CREATE TABLE team_roulettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  started_by UUID REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id VARCHAR(50),
  restaurant_name VARCHAR(200),
  restaurant_category VARCHAR(50),
  restaurant_address VARCHAR(300),
  restaurant_distance INTEGER,
  restaurant_place_url TEXT,
  status VARCHAR(20) DEFAULT 'done',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팀 투표
CREATE TABLE team_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 투표 옵션 (후보 식당)
CREATE TABLE team_vote_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID REFERENCES team_votes(id) ON DELETE CASCADE NOT NULL,
  restaurant_id VARCHAR(50) NOT NULL,
  restaurant_name VARCHAR(200) NOT NULL,
  restaurant_category VARCHAR(50),
  restaurant_address VARCHAR(300),
  restaurant_distance INTEGER,
  restaurant_place_url TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 투표 선택 (1인 1표)
CREATE TABLE team_vote_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID REFERENCES team_votes(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES team_vote_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  picked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vote_id, user_id)
);

-- RLS 정책 (anon key 사용이므로 전체 허용)
-- + Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE team_vote_picks;
ALTER PUBLICATION supabase_realtime ADD TABLE team_votes;
