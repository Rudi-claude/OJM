import { NextRequest, NextResponse } from "next/server";
import { convertToGrid, getBaseTime, createWeatherData } from "@/lib/weather";

const KMA_API_KEY = process.env.KMA_API_KEY;
const KMA_API_URL =
  "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";

interface KMAItem {
  category: string;
  fcstValue: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get("lat") || "37.5665");
    const lng = parseFloat(searchParams.get("lng") || "126.9780");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "유효하지 않은 좌표입니다." },
        { status: 400 }
      );
    }

    // API 키가 없으면 기본값 반환
    if (!KMA_API_KEY) {
      console.warn("KMA_API_KEY가 설정되지 않았습니다. 기본 날씨 정보를 반환합니다.");
      return NextResponse.json({
        weather: createWeatherData(1, 0, 20),
        source: "default",
      });
    }

    const { nx, ny } = convertToGrid(lat, lng);
    const { baseDate, baseTime } = getBaseTime();

    const params = new URLSearchParams({
      serviceKey: KMA_API_KEY,
      numOfRows: "60",
      pageNo: "1",
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: String(nx),
      ny: String(ny),
    });

    const response = await fetch(`${KMA_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`기상청 API 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    if (data.response?.header?.resultCode !== "00") {
      console.error("기상청 API 오류:", data.response?.header?.resultMsg);
      return NextResponse.json({
        weather: createWeatherData(1, 0, 20),
        source: "fallback",
        error: data.response?.header?.resultMsg,
      });
    }

    const items: KMAItem[] = data.response?.body?.items?.item || [];

    let temperature = 20;
    let sky = 1;
    let pty = 0;

    items.forEach((item) => {
      switch (item.category) {
        case "T1H": // 기온
          temperature = parseFloat(item.fcstValue);
          break;
        case "SKY": // 하늘상태
          sky = parseInt(item.fcstValue, 10);
          break;
        case "PTY": // 강수형태
          pty = parseInt(item.fcstValue, 10);
          break;
      }
    });

    const weatherData = createWeatherData(sky, pty, temperature);

    return NextResponse.json({
      weather: weatherData,
      source: "kma",
      grid: { nx, ny },
    });
  } catch (error) {
    console.error("날씨 API 오류:", error);
    return NextResponse.json({
      weather: createWeatherData(1, 0, 20),
      source: "error",
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    });
  }
}
