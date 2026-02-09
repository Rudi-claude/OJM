import { NextRequest, NextResponse } from "next/server";

// Tmap 보행자 경로 API (SK Open API)
const TMAP_API_URL = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1";

interface TmapFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][];
  };
  properties: {
    totalDistance?: number;
    totalTime?: number;
    index?: number;
    pointIndex?: number;
    name?: string;
    description?: string;
    direction?: string;
    nearPoiName?: string;
    nearPoiX?: string;
    nearPoiY?: string;
    intersectionName?: string;
    facilityType?: string;
    facilityName?: string;
    turnType?: number;
    pointType?: string;
  };
}

interface TmapResponse {
  type: string;
  features: TmapFeature[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startX, startY, endX, endY, startName, endName } = body;

    const TMAP_APP_KEY = process.env.TMAP_APP_KEY;

    if (!TMAP_APP_KEY) {
      return NextResponse.json(
        { error: "Tmap API 키가 설정되지 않았습니다.", success: false },
        { status: 500 }
      );
    }

    if (!startX || !startY || !endX || !endY) {
      return NextResponse.json(
        { error: "출발지와 도착지 좌표가 필요합니다.", success: false },
        { status: 400 }
      );
    }

    const requestBody = {
      startX: String(startX),
      startY: String(startY),
      endX: String(endX),
      endY: String(endY),
      startName: encodeURIComponent(startName || "출발지"),
      endName: encodeURIComponent(endName || "도착지"),
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
      searchOption: "0",
    };

    const response = await fetch(TMAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "appKey": TMAP_APP_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Tmap API 오류: ${response.status}`, details: errorText, success: false },
        { status: response.status }
      );
    }

    const data: TmapResponse = await response.json();

    // 경로 좌표 추출
    const routeCoordinates: { lat: number; lng: number }[] = [];
    let totalDistance = 0;
    let totalTime = 0;

    if (data.features && data.features.length > 0) {
      data.features.forEach((feature) => {
        // 전체 정보 (첫 번째 feature)
        if (feature.properties.totalDistance) {
          totalDistance = feature.properties.totalDistance;
          totalTime = feature.properties.totalTime || 0;
        }

        // LineString 타입의 geometry에서 좌표 추출
        if (feature.geometry.type === "LineString") {
          const coords = feature.geometry.coordinates as number[][];
          coords.forEach((coord) => {
            routeCoordinates.push({
              lng: coord[0],
              lat: coord[1],
            });
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      route: routeCoordinates,
      totalDistance,
      totalTime,
      totalTimeMinutes: Math.ceil(totalTime / 60),
    });
  } catch {
    return NextResponse.json(
      { error: "경로 조회 중 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}
