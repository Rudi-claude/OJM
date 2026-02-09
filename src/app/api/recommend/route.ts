import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  scoreAndSortRestaurants,
  generateRecommendMessage,
} from "@/lib/scoring";
import type { Restaurant, WeatherData, MealLog, MoodType } from "@/types";
import type { Database } from "@/types/database";

type MealLogRow = Database["public"]["Tables"]["meal_logs"]["Row"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      mood,
      weather,
      restaurants: requestRestaurants,
    }: {
      userId?: string;
      mood?: MoodType;
      weather?: WeatherData;
      restaurants?: Restaurant[];
      lat?: number;
      lng?: number;
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

    // 전달받은 레스토랑 목록 사용 (없으면 빈 배열)
    const restaurants = requestRestaurants || [];

    if (restaurants.length === 0) {
      return NextResponse.json({
        restaurants: [],
        message: "주변에 식당이 없습니다.",
      });
    }

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
  } catch {
    return NextResponse.json(
      { error: "추천을 생성할 수 없습니다." },
      { status: 500 }
    );
  }
}
