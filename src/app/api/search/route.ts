import { NextRequest, NextResponse } from 'next/server';

const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local';

// 주소를 좌표로 변환
async function addressToCoords(address: string) {
  // 주소 검색 시도
  const addressUrl = `${KAKAO_API_URL}/search/address.json?query=${encodeURIComponent(address)}`;

  const addressResponse = await fetch(addressUrl, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_API_KEY}`,
    },
  });

  const addressData = await addressResponse.json();

  if (addressData.documents && addressData.documents.length > 0) {
    return {
      x: addressData.documents[0].x,
      y: addressData.documents[0].y,
    };
  }

  // 주소 검색 실패시 키워드 검색 시도
  const keywordUrl = `${KAKAO_API_URL}/search/keyword.json?query=${encodeURIComponent(address)}`;

  const keywordResponse = await fetch(keywordUrl, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_API_KEY}`,
    },
  });

  const keywordData = await keywordResponse.json();

  if (keywordData.documents && keywordData.documents.length > 0) {
    return {
      x: keywordData.documents[0].x,
      y: keywordData.documents[0].y,
    };
  }

  return null;
}

// 카페, 술집 제외 키워드
const excludeKeywords = ['카페', '커피', '술집', '주점', '호프', '바', '포장마차', '와인', '칵테일', '이자카야'];

// 카카오 API 결과를 식당 객체로 변환
function mapPlace(place: any) {
  const categoryParts = place.category_name.split(' > ');
  let categoryName = '기타';

  if (categoryParts.length >= 2) {
    const subCategory = categoryParts[1];
    if (subCategory.includes('한식')) categoryName = '한식';
    else if (subCategory.includes('중식') || subCategory.includes('중국')) categoryName = '중식';
    else if (subCategory.includes('일식') || subCategory.includes('초밥')) categoryName = '일식';
    else if (subCategory.includes('양식') || subCategory.includes('이탈리안')) categoryName = '양식';
    else if (subCategory.includes('분식')) categoryName = '분식';
    else if (subCategory.includes('패스트푸드') || subCategory.includes('햄버거') || subCategory.includes('피자')) categoryName = '패스트푸드';
    else if (subCategory.includes('아시안') || subCategory.includes('베트남') || subCategory.includes('태국')) categoryName = '아시안';
    else categoryName = subCategory;
  }

  return {
    id: place.id,
    name: place.place_name,
    category: categoryName,
    address: place.road_address_name || place.address_name,
    distance: parseInt(place.distance) || 0,
    phone: place.phone || undefined,
    placeUrl: place.place_url,
    x: parseFloat(place.x),
    y: parseFloat(place.y),
  };
}

// 주변 음식점 검색 (페이지네이션으로 최대 45개까지)
async function searchRestaurants(x: string, y: string, radius: number = 500) {
  const allPlaces: any[] = [];
  const seenIds = new Set<string>();

  // 카카오 API는 페이지당 최대 15개, 최대 3페이지(45개)
  for (let page = 1; page <= 3; page++) {
    const url = `${KAKAO_API_URL}/search/category.json?category_group_code=FD6&x=${x}&y=${y}&radius=${radius}&sort=distance&page=${page}&size=15`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    });

    const data = await response.json();
    const docs = data.documents || [];

    for (const place of docs) {
      if (!seenIds.has(place.id)) {
        seenIds.add(place.id);
        const categoryName = place.category_name.toLowerCase();
        if (!excludeKeywords.some(keyword => categoryName.includes(keyword))) {
          allPlaces.push(mapPlace(place));
        }
      }
    }

    // 더 이상 결과가 없으면 중단
    if (data.meta?.is_end) break;
  }

  return allPlaces;
}

// 좌표를 주소로 변환 (역지오코딩)
async function coordsToAddress(x: string, y: string): Promise<string> {
  const url = `${KAKAO_API_URL}/geo/coord2address.json?x=${x}&y=${y}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    });

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      // 도로명 주소 우선, 없으면 지번 주소
      if (doc.road_address) {
        return doc.road_address.address_name;
      }
      if (doc.address) {
        return doc.address.address_name;
      }
    }
  } catch {
    // 역지오코딩 실패 시 기본값
  }

  return '현재 위치';
}

// 키워드로 음식점 검색 (식당명 검색)
async function searchByKeyword(keyword: string) {
  const allPlaces: any[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= 3; page++) {
    const url = `${KAKAO_API_URL}/search/keyword.json?query=${encodeURIComponent(keyword)}&category_group_code=FD6&page=${page}&size=15`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    });

    const data = await response.json();
    const docs = data.documents || [];

    for (const place of docs) {
      if (!seenIds.has(place.id)) {
        seenIds.add(place.id);
        allPlaces.push(mapPlace(place));
      }
    }

    if (data.meta?.is_end) break;
  }

  return allPlaces;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const keyword = searchParams.get('keyword');
  const radius = parseInt(searchParams.get('radius') || '500');

  if (!address && (!lat || !lng) && !keyword) {
    return NextResponse.json({ error: '주소, 좌표 또는 키워드를 입력해주세요.' }, { status: 400 });
  }

  if (!KAKAO_API_KEY) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    // 키워드 검색 모드
    if (keyword) {
      const restaurants = await searchByKeyword(keyword);
      return NextResponse.json({
        success: true,
        restaurants,
        totalCount: restaurants.length,
      });
    }

    let x: string;
    let y: string;
    let resolvedAddress: string | undefined;

    if (lat && lng) {
      // 좌표가 직접 제공된 경우 (현재 위치 검색)
      x = lng;
      y = lat;
      resolvedAddress = await coordsToAddress(x, y);
    } else {
      // 주소 검색
      const coords = await addressToCoords(address!);

      if (!coords) {
        return NextResponse.json({ error: '주소를 찾을 수 없습니다.' }, { status: 404 });
      }

      x = coords.x;
      y = coords.y;
    }

    // 주변 음식점 검색 (20개 미만이면 반경 자동 확장)
    const MIN_RESULTS = 20;
    const radiusSteps = [radius, 1500, 2000, 3000, 5000];
    let restaurants: any[] = [];
    let usedRadius = radius;

    for (const r of radiusSteps) {
      if (r < radius) continue;
      restaurants = await searchRestaurants(x, y, r);
      usedRadius = r;
      if (restaurants.length >= MIN_RESULTS) break;
    }

    const expanded = usedRadius > radius;

    return NextResponse.json({
      success: true,
      restaurants,
      totalCount: restaurants.length,
      center: {
        lat: parseFloat(y),
        lng: parseFloat(x),
      },
      ...(resolvedAddress && { address: resolvedAddress }),
      ...(expanded && { expandedRadius: usedRadius }),
    });
  } catch {
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
