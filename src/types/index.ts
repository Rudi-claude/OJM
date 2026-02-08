// 맛집 정보 타입
export interface Restaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: number; // 미터 단위
  rating?: number;
  phone?: string;
  placeUrl?: string;
  x?: number; // 경도
  y?: number; // 위도
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

// 카테고리 타입
export type Category = '전체' | '한식' | '중식' | '일식' | '양식' | '분식' | '아시안' | '패스트푸드';

// 검색 결과 타입
export interface SearchResult {
  restaurants: Restaurant[];
  totalCount: number;
}

// 식사 기록 타입
export interface MealLog {
  id: string;
  restaurantId: string;
  restaurantName: string;
  category: string;
  ateAt: Date;
  weather?: string;
  mood?: string;
}

// 날씨 타입
export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow" | "hot" | "cold";

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  description: string;
  recommendations: string[];
}

// 점수화된 맛집 타입
export interface ScoredRestaurant extends Restaurant {
  score: number;
  reasons: string[];
}

// 기분 타입
export type MoodType = "hearty" | "light" | "special" | "quick";

export interface MoodOption {
  type: MoodType;
  label: string;
  description: string;
  icon: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    type: "hearty",
    label: "든든하게",
    description: "배부르게 먹고 싶어요",
    icon: "🍖",
  },
  {
    type: "light",
    label: "가볍게",
    description: "건강하게 가볍게",
    icon: "🥗",
  },
  {
    type: "special",
    label: "특별하게",
    description: "오늘은 좀 특별한 날",
    icon: "✨",
  },
  {
    type: "quick",
    label: "빠르게",
    description: "시간이 없어요",
    icon: "⚡",
  },
];

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: Date;
  component?: "mood-chips" | "recommend-card" | "weather-badge";
  data?: unknown;
}

// 추천 요청/응답 타입
export interface RecommendRequest {
  userId?: string;
  latitude: number;
  longitude: number;
  mood?: MoodType;
  weather?: WeatherData;
}

export interface RecommendResponse {
  restaurants: ScoredRestaurant[];
  message: string;
}

// 팀 타입
export interface Team {
  id: string;
  name: string;
  code: string;
  createdBy: string | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  nickname: string | null;
  joinedAt: string;
}

export interface TeamRoulette {
  id: string;
  teamId: string;
  startedBy: string | null;
  restaurant: {
    id: string | null;
    name: string | null;
    category: string | null;
    address: string | null;
    distance: number | null;
    placeUrl: string | null;
  };
  status: string;
  createdAt: string;
}

export interface TeamVoteOption {
  id: string;
  voteId: string;
  restaurant: {
    id: string;
    name: string;
    category: string | null;
    address: string | null;
    distance: number | null;
    placeUrl: string | null;
  };
  pickCount: number;
  pickedByMe: boolean;
}

export interface TeamVote {
  id: string;
  teamId: string;
  title: string;
  createdBy: string | null;
  status: string;
  options: TeamVoteOption[];
  createdAt: string;
}
