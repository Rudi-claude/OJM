import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, restaurantId, restaurantName, category } = body;

    if (!teamId || !restaurantId || !restaurantName || !category) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 팀 멤버 조회
    const { data: members, error: membersError } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    if (membersError || !members || members.length === 0) {
      return NextResponse.json(
        { error: "팀 멤버를 조회할 수 없습니다." },
        { status: 500 }
      );
    }

    // 오늘 날짜 범위 (중복 방지)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 오늘 이미 해당 식당으로 팀 기록이 있는지 확인
    const memberIds = members.map((m) => m.user_id);
    const { data: existing } = await supabase
      .from("meal_logs")
      .select("user_id")
      .in("user_id", memberIds)
      .eq("restaurant_id", restaurantId)
      .gte("ate_at", todayStart.toISOString())
      .lte("ate_at", todayEnd.toISOString());

    const alreadyLoggedUserIds = new Set((existing || []).map((e: any) => e.user_id));

    // 아직 기록이 없는 멤버만 insert
    const rows = members
      .filter((m) => !alreadyLoggedUserIds.has(m.user_id))
      .map((m) => ({
        user_id: m.user_id,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        category: category,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "이미 기록되었습니다." });
    }

    const { error: insertError } = await supabase
      .from("meal_logs")
      .insert(rows);

    if (insertError) {
      return NextResponse.json(
        { error: "팀 식사 기록을 저장할 수 없습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
