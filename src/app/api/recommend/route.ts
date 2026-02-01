import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  scoreAndSortRestaurants,
  generateRecommendMessage,
} from "@/lib/scoring";
import type { Restaurant, WeatherData, MealLog, MoodType } from "@/types";
import type { Database } from "@/types/database";

type MealLogRow = Database["public"]["Tables"]["meal_logs"]["Row"];

// 임시 레스토랑 데이터 (실제로는 카카오 API나 DB에서 가져옴)
const SAMPLE_RESTAURANTS: Restaurant[] = [
  {
    id: "1",
    name: "신선설농탕",
    category: "한식",
    address: "서울시 강남구 테헤란로 123",
    distance: 200,
  },
  {
    id: "2",
    name: "옛날칼국수",
    category: "칼국수",
    address: "서울시 강남구 역삼로 45",
    distance: 350,
  },
  {
    id: "3",
    name: "맛있는 냉면",
    category: "냉면",
    address: "서울시 강남구 삼성로 67",
    distance: 400,
  },
  {
    id: "4",
    name: "황금돈까스",
    category: "돈까스",
    address: "서울시 강남구 봉은사로 89",
    distance: 150,
  },
  {
    id: "5",
    name: "진짜스테이크",
    category: "양식",
    address: "서울시 강남구 영동대로 101",
    distance: 500,
  },
  {
    id: "6",
    name: "엄마손김밥",
    category: "분식",
    address: "서울시 강남구 논현로 23",
    distance: 100,
  },
  {
    id: "7",
    name: "삼겹살파티",
    category: "고기",
    address: "서울시 강남구 학동로 56",
    distance: 300,
  },
  {
    id: "8",
    name: "베트남쌀국수",
    category: "베트남",
    address: "서울시 강남구 도산대로 78",
    distance: 250,
  },
  {
    id: "9",
    name: "오마카세스시",
    category: "일식",
    address: "서울시 강남구 선릉로 90",
    distance: 600,
  },
  {
    id: "10",
    name: "즉석떡볶이",
    category: "분식",
    address: "서울시 강남구 테헤란로 111",
    distance: 180,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      mood,
      weather,
    }: {
      userId?: string;
      latitude?: number;
      longitude?: number;
      mood?: MoodType;
      weather?: WeatherData;
    } = body;

    // 최근 식사 기록 조회
    let recentMeals: MealLog[] = [];

    if (userId) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);

      const { data, error } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("ate_at", fromDate.toISOString())
        .order("ate_at", { ascending: false });

      if (!error && data) {
        recentMeals = (data as MealLogRow[]).map((log) => ({
          id: log.id,
          restaurantId: log.restaurant_id,
          restaurantName: log.restaurant_name,
          category: log.category,
          ateAt: new Date(log.ate_at),
          weather: log.weather || undefined,
          mood: log.mood || undefined,
        }));
      }
    }

    // TODO: 실제로는 카카오 API를 통해 주변 레스토랑 검색
    // 여기서는 샘플 데이터 사용
    const restaurants = SAMPLE_RESTAURANTS;

    // 점수 계산 및 정렬
    const scoredRestaurants = scoreAndSortRestaurants(restaurants, {
      weather,
      recentMeals,
      mood,
      limit: 3,
    });

    // 추천 메시지 생성
    const message = generateRecommendMessage(scoredRestaurants, {
      weather,
      mood,
    });

    return NextResponse.json({
      restaurants: scoredRestaurants,
      message,
      debug: {
        totalRestaurants: restaurants.length,
        recentMealsCount: recentMeals.length,
        weatherCondition: weather?.condition,
        mood,
      },
    });
  } catch (error) {
    console.error("추천 API 오류:", error);
    return NextResponse.json(
      { error: "추천을 생성할 수 없습니다." },
      { status: 500 }
    );
  }
}
