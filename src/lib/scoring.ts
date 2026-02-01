import type {
  Restaurant,
  ScoredRestaurant,
  WeatherData,
  MealLog,
  MoodType,
  WeatherCondition,
} from "@/types";

// 점수 가중치 상수
const WEIGHTS = {
  WEATHER: 30,
  RECENT_MEAL: -50,
  MOOD: 25,
  DISTANCE: 15,
};

// 날씨 기반 카테고리 매핑
const WEATHER_CATEGORY_BONUS: Record<WeatherCondition, string[]> = {
  rain: ["국밥", "한식", "칼국수", "수제비", "라면", "우동", "탕류"],
  snow: ["국밥", "한식", "설렁탕", "찌개", "탕류"],
  hot: ["냉면", "일식", "회", "샐러드", "초밥"],
  cold: ["국밥", "한식", "설렁탕", "탕류", "찌개"],
  clear: [],
  cloudy: [],
};

// 기분 기반 카테고리 매핑
const MOOD_CATEGORY_BONUS: Record<MoodType, string[]> = {
  hearty: ["고기", "한식", "국밥", "삼겹살", "치킨", "돈까스", "중식"],
  light: ["샐러드", "일식", "베트남", "분식", "김밥"],
  special: ["양식", "스테이크", "이탈리안", "일식", "퓨전"],
  quick: ["분식", "패스트푸드", "김밥", "햄버거", "샌드위치"],
};

// 카테고리 유사도 그룹
const CATEGORY_GROUPS: Record<string, string[]> = {
  한식: ["한식", "국밥", "찌개", "비빔밥", "백반", "정식"],
  일식: ["일식", "초밥", "라멘", "우동", "돈까스", "회"],
  중식: ["중식", "짜장면", "짬뽕", "탕수육"],
  양식: ["양식", "스테이크", "파스타", "이탈리안", "피자"],
  분식: ["분식", "김밥", "떡볶이", "라면"],
  고기: ["고기", "삼겹살", "소고기", "갈비", "불고기", "삼겹살"],
  치킨: ["치킨", "통닭", "양념치킨"],
  패스트푸드: ["패스트푸드", "햄버거", "버거"],
};

// 카테고리 그룹 찾기
function findCategoryGroup(category: string): string[] {
  for (const [, group] of Object.entries(CATEGORY_GROUPS)) {
    if (group.some((c) => category.includes(c) || c.includes(category))) {
      return group;
    }
  }
  return [category];
}

// 날씨 점수 계산
function calculateWeatherScore(
  category: string,
  weather?: WeatherData
): { score: number; reason?: string } {
  if (!weather || weather.condition === "clear" || weather.condition === "cloudy") {
    return { score: 0 };
  }

  const bonusCategories = WEATHER_CATEGORY_BONUS[weather.condition];
  const categoryMatch = bonusCategories.some(
    (c) => category.includes(c) || c.includes(category)
  );

  if (categoryMatch) {
    const reasonMap: Record<WeatherCondition, string> = {
      rain: "비 오는 날엔 따뜻한 국물이 딱!",
      snow: "눈 오는 날 뜨끈한 음식 추천",
      hot: "더운 날엔 시원한 음식이 최고",
      cold: "추운 날엔 몸을 녹여줄 음식",
      clear: "",
      cloudy: "",
    };
    return {
      score: WEIGHTS.WEATHER,
      reason: reasonMap[weather.condition],
    };
  }

  return { score: 0 };
}

// 최근 식사 감점 계산
function calculateRecentMealPenalty(
  category: string,
  restaurantId: string,
  recentMeals: MealLog[]
): { score: number; reason?: string } {
  const now = new Date();
  const categoryGroup = findCategoryGroup(category);

  for (const meal of recentMeals) {
    const daysDiff = Math.floor(
      (now.getTime() - new Date(meal.ateAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // 같은 가게는 큰 감점
    if (meal.restaurantId === restaurantId) {
      if (daysDiff <= 1) {
        return { score: WEIGHTS.RECENT_MEAL, reason: "어제/오늘 다녀온 곳" };
      }
      if (daysDiff <= 3) {
        return { score: WEIGHTS.RECENT_MEAL * 0.6, reason: "최근 다녀온 곳" };
      }
    }

    // 같은 카테고리도 감점
    const mealCategoryGroup = findCategoryGroup(meal.category);
    const isSameCategory = categoryGroup.some((c) =>
      mealCategoryGroup.includes(c)
    );

    if (isSameCategory) {
      if (daysDiff <= 1) {
        return { score: WEIGHTS.RECENT_MEAL * 0.4, reason: "어제/오늘 비슷한 음식을 드셨어요" };
      }
      if (daysDiff <= 3) {
        return { score: WEIGHTS.RECENT_MEAL * 0.2, reason: "최근 비슷한 음식을 드셨어요" };
      }
    }
  }

  return { score: 0 };
}

// 기분 점수 계산
function calculateMoodScore(
  category: string,
  mood?: MoodType
): { score: number; reason?: string } {
  if (!mood) return { score: 0 };

  const bonusCategories = MOOD_CATEGORY_BONUS[mood];
  const categoryMatch = bonusCategories.some(
    (c) => category.includes(c) || c.includes(category)
  );

  if (categoryMatch) {
    const reasonMap: Record<MoodType, string> = {
      hearty: "든든하게 배 채우기 좋아요",
      light: "가볍고 건강하게",
      special: "특별한 날에 어울려요",
      quick: "빠르게 먹기 좋아요",
    };
    return {
      score: WEIGHTS.MOOD,
      reason: reasonMap[mood],
    };
  }

  return { score: 0 };
}

// 거리 점수 계산
function calculateDistanceScore(
  distance?: number
): { score: number; reason?: string } {
  if (distance === undefined) return { score: 0 };

  if (distance <= 300) {
    return { score: WEIGHTS.DISTANCE, reason: "가까워서 금방 갈 수 있어요" };
  }
  if (distance <= 500) {
    return { score: WEIGHTS.DISTANCE * 0.7, reason: "적당한 거리예요" };
  }
  if (distance <= 1000) {
    return { score: WEIGHTS.DISTANCE * 0.3 };
  }

  return { score: 0 };
}

// 전체 점수 계산
export function calculateScore(
  restaurant: Restaurant,
  options: {
    weather?: WeatherData;
    recentMeals?: MealLog[];
    mood?: MoodType;
  }
): ScoredRestaurant {
  const { weather, recentMeals = [], mood } = options;
  let totalScore = 50; // 기본 점수
  const reasons: string[] = [];

  // 날씨 점수
  const weatherResult = calculateWeatherScore(restaurant.category, weather);
  totalScore += weatherResult.score;
  if (weatherResult.reason) reasons.push(weatherResult.reason);

  // 최근 식사 감점
  const recentMealResult = calculateRecentMealPenalty(
    restaurant.category,
    restaurant.id,
    recentMeals
  );
  totalScore += recentMealResult.score;
  if (recentMealResult.reason) reasons.push(recentMealResult.reason);

  // 기분 점수
  const moodResult = calculateMoodScore(restaurant.category, mood);
  totalScore += moodResult.score;
  if (moodResult.reason) reasons.push(moodResult.reason);

  // 거리 점수
  const distanceResult = calculateDistanceScore(restaurant.distance);
  totalScore += distanceResult.score;
  if (distanceResult.reason) reasons.push(distanceResult.reason);

  return {
    ...restaurant,
    score: Math.max(0, Math.min(100, totalScore)),
    reasons,
  };
}

// 레스토랑 목록 점수화 및 정렬
export function scoreAndSortRestaurants(
  restaurants: Restaurant[],
  options: {
    weather?: WeatherData;
    recentMeals?: MealLog[];
    mood?: MoodType;
    limit?: number;
  }
): ScoredRestaurant[] {
  const { limit = 3, ...scoringOptions } = options;

  const scored = restaurants.map((r) => calculateScore(r, scoringOptions));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

// 추천 메시지 생성
export function generateRecommendMessage(
  scoredRestaurants: ScoredRestaurant[],
  options: {
    weather?: WeatherData;
    mood?: MoodType;
  }
): string {
  const { weather, mood } = options;

  if (scoredRestaurants.length === 0) {
    return "주변에 추천할 만한 식당을 찾지 못했어요. 검색 범위를 넓혀볼까요?";
  }

  const parts: string[] = [];

  if (weather && weather.condition !== "clear" && weather.condition !== "cloudy") {
    const weatherMessages: Record<WeatherCondition, string> = {
      rain: "비 오는 날이네요! 따뜻한 국물 요리는 어떨까요?",
      snow: "눈이 오는 날이에요! 뜨끈한 음식으로 몸을 녹여보세요.",
      hot: "덥네요! 시원한 음식이 땡기지 않나요?",
      cold: "추운 날씨예요! 몸을 녹여줄 따뜻한 음식 추천드려요.",
      clear: "",
      cloudy: "",
    };
    parts.push(weatherMessages[weather.condition]);
  }

  if (mood) {
    const moodMessages: Record<MoodType, string> = {
      hearty: "든든하게 드시고 싶으시군요!",
      light: "가볍게 드시고 싶으시군요!",
      special: "특별한 식사를 원하시군요!",
      quick: "빠르게 드셔야 하시군요!",
    };
    parts.push(moodMessages[mood]);
  }

  const top = scoredRestaurants[0];
  parts.push(`${top.name}(${top.category}) 어떠세요?`);

  return parts.join(" ");
}
