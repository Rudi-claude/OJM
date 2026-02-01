import type { WeatherCondition, WeatherData } from "@/types";

// 기상청 격자 좌표 변환 (위경도 -> 격자)
// Lambert Conformal Conic Projection
export function convertToGrid(lat: number, lng: number): { nx: number; ny: number } {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

// 기상청 API 기준 시간 계산
export function getBaseTime(): { baseDate: string; baseTime: string } {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // 기상청 단기예보 발표시각: 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300
  // API 제공 시간은 발표시각 + 10분
  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseHour = 23;
  let baseDate = new Date(now);

  for (let i = baseTimes.length - 1; i >= 0; i--) {
    if (hours > baseTimes[i] || (hours === baseTimes[i] && minutes >= 10)) {
      baseHour = baseTimes[i];
      break;
    }
  }

  // 가장 이른 시간(0200) 이전이면 전날 2300 사용
  if (hours < 2 || (hours === 2 && minutes < 10)) {
    baseDate.setDate(baseDate.getDate() - 1);
    baseHour = 23;
  }

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getDate()).padStart(2, "0");

  return {
    baseDate: `${year}${month}${day}`,
    baseTime: String(baseHour).padStart(2, "0") + "00",
  };
}

// 날씨 상태 판단
export function determineWeatherCondition(
  sky: number,
  pty: number,
  temperature: number
): WeatherCondition {
  // PTY (강수형태): 0=없음, 1=비, 2=비/눈, 3=눈, 4=소나기
  // SKY (하늘상태): 1=맑음, 3=구름많음, 4=흐림

  if (pty === 1 || pty === 4) return "rain";
  if (pty === 3 || pty === 2) return "snow";

  if (temperature >= 28) return "hot";
  if (temperature <= 5) return "cold";

  if (sky === 1) return "clear";
  return "cloudy";
}

// 날씨 기반 음식 추천
export function getWeatherRecommendations(condition: WeatherCondition): string[] {
  const recommendations: Record<WeatherCondition, string[]> = {
    rain: ["국밥", "칼국수", "수제비", "라면", "우동", "부침개"],
    snow: ["국밥", "설렁탕", "순두부찌개", "김치찌개", "매운탕"],
    hot: ["냉면", "콩국수", "냉모밀", "샐러드", "회", "초밥"],
    cold: ["국밥", "설렁탕", "갈비탕", "순대국", "찌개류"],
    clear: ["모든 음식이 좋아요!"],
    cloudy: ["모든 음식이 좋아요!"],
  };

  return recommendations[condition];
}

// 날씨 설명 텍스트
export function getWeatherDescription(
  condition: WeatherCondition,
  temperature: number
): string {
  const descriptions: Record<WeatherCondition, string> = {
    rain: `비가 오고 있어요 (${temperature}°C)`,
    snow: `눈이 오고 있어요 (${temperature}°C)`,
    hot: `오늘 덥네요! (${temperature}°C)`,
    cold: `오늘 춥네요 (${temperature}°C)`,
    clear: `맑은 날씨예요 (${temperature}°C)`,
    cloudy: `구름이 있는 날씨예요 (${temperature}°C)`,
  };

  return descriptions[condition];
}

// WeatherData 객체 생성
export function createWeatherData(
  sky: number,
  pty: number,
  temperature: number
): WeatherData {
  const condition = determineWeatherCondition(sky, pty, temperature);
  return {
    condition,
    temperature,
    description: getWeatherDescription(condition, temperature),
    recommendations: getWeatherRecommendations(condition),
  };
}
