import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type MealLogRow = Database["public"]["Tables"]["meal_logs"]["Row"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const days = parseInt(searchParams.get("days") || "7", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("ate_at", fromDate.toISOString())
      .order("ate_at", { ascending: false });

    if (error) {
      console.error("식사 기록 조회 실패:", error);
      return NextResponse.json(
        { error: "식사 기록을 조회할 수 없습니다." },
        { status: 500 }
      );
    }

    const mealLogs = (data as MealLogRow[]).map((log) => ({
      id: log.id,
      restaurantId: log.restaurant_id,
      restaurantName: log.restaurant_name,
      category: log.category,
      ateAt: new Date(log.ate_at),
      weather: log.weather,
      mood: log.mood,
    }));

    return NextResponse.json({ mealLogs });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, restaurantId, restaurantName, category, weather, mood } =
      body;

    if (!userId || !restaurantId || !restaurantName || !category) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("meal_logs")
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        category: category,
        weather: weather || null,
        mood: mood || null,
      })
      .select()
      .single();

    if (error) {
      console.error("식사 기록 저장 실패:", error);
      return NextResponse.json(
        { error: "식사 기록을 저장할 수 없습니다." },
        { status: 500 }
      );
    }

    const mealLog = data as MealLogRow;
    return NextResponse.json({
      success: true,
      mealLog: {
        id: mealLog.id,
        restaurantId: mealLog.restaurant_id,
        restaurantName: mealLog.restaurant_name,
        category: mealLog.category,
        ateAt: new Date(mealLog.ate_at),
        weather: mealLog.weather,
        mood: mealLog.mood,
      },
    });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
