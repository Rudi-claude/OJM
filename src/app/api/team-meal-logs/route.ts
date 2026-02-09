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
      console.error("팀 멤버 조회 실패:", membersError);
      return NextResponse.json(
        { error: "팀 멤버를 조회할 수 없습니다." },
        { status: 500 }
      );
    }

    // 각 멤버에 대해 meal_logs bulk insert
    const rows = members.map((m) => ({
      user_id: m.user_id,
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      category: category,
    }));

    const { error: insertError } = await supabase
      .from("meal_logs")
      .insert(rows);

    if (insertError) {
      console.error("팀 식사 기록 저장 실패:", insertError);
      return NextResponse.json(
        { error: "팀 식사 기록을 저장할 수 없습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
