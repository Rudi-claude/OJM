import { NextRequest, NextResponse } from 'next/server';

const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local';

// 주소를 좌표로 변환
async function addressToCoords(address: string) {
  console.log('=== 주소 검색 시작 ===');
  console.log('검색 주소:', address);
  console.log('API 키:', KAKAO_API_KEY ? `${KAKAO_API_KEY.substring(0, 5)}...` : '없음');

  // 주소 검색 시도
  const addressUrl = `${KAKAO_API_URL}/search/address.json?query=${encodeURIComponent(address)}`;
  console.log('주소 검색 URL:', addressUrl);

  const addressResponse = await fetch(addressUrl, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_API_KEY}`,
    },
  });

  const addressData = await addressResponse.json();
  console.log('주소 검색 응답:', JSON.stringify(addressData, null, 2));

  if (addressData.documents && addressData.documents.length > 0) {
    return {
      x: addressData.documents[0].x,
      y: addressData.documents[0].y,
    };
  }

  // 주소 검색 실패시 키워드 검색 시도
  const keywordUrl = `${KAKAO_API_URL}/search/keyword.json?query=${encodeURIComponent(address)}`;
  console.log('키워드 검색 URL:', keywordUrl);

  const keywordResponse = await fetch(keywordUrl, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_API_KEY}`,
    },
  });

  const keywordData = await keywordResponse.json();
  console.log('키워드 검색 응답:', JSON.stringify(keywordData, null, 2));

  if (keywordData.documents && keywordData.documents.length > 0) {
    return {
      x: keywordData.documents[0].x,
      y: keywordData.documents[0].y,
    };
  }

  return null;
}

// 주변 음식점 검색
async function searchRestaurants(x: string, y: string, radius: number = 500) {
  const url = `${KAKAO_API_URL}/search/category.json?category_group_code=FD6&x=${x}&y=${y}&radius=${radius}&sort=distance`;
  console.log('음식점 검색 URL:', url);

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_API_KEY}`,
    },
  });

  const data = await response.json();
  console.log('음식점 검색 결과 수:', data.documents?.length || 0);

  if (!data.documents) {
    return [];
  }

  return data.documents.map((place: any) => {
    // 카테고리 추출
    const categoryParts = place.category_name.split(' > ');
    let categoryName = '기타';

    if (categoryParts.length >= 2) {
      const subCategory = categoryParts[1];
      if (subCategory.includes('한식')) categoryName = '한식';
      else if (subCategory.includes('중식') || subCategory.includes('중국')) categoryName = '중식';
      else if (subCategory.includes('일식') || subCategory.includes('초밥')) categoryName = '일식';
      else if (subCategory.includes('양식') || subCategory.includes('이탈리안')) categoryName = '양식';
      else if (subCategory.includes('분식')) categoryName = '분식';
      else if (subCategory.includes('카페') || subCategory.includes('커피')) categoryName = '카페';
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
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const radius = parseInt(searchParams.get('radius') || '500');

  console.log('\n========== API 요청 시작 ==========');
  console.log('요청 주소:', address);
  console.log('검색 반경:', radius);

  if (!address) {
    return NextResponse.json({ error: '주소를 입력해주세요.' }, { status: 400 });
  }

  if (!KAKAO_API_KEY) {
    console.log('ERROR: API 키가 없습니다!');
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    // 1. 주소 -> 좌표 변환
    const coords = await addressToCoords(address);

    if (!coords) {
      console.log('ERROR: 좌표 변환 실패');
      return NextResponse.json({ error: '주소를 찾을 수 없습니다.' }, { status: 404 });
    }

    console.log('좌표:', coords);

    // 2. 주변 음식점 검색
    const restaurants = await searchRestaurants(coords.x, coords.y, radius);

    console.log('검색된 음식점 수:', restaurants.length);
    console.log('========== API 요청 완료 ==========\n');

    return NextResponse.json({
      success: true,
      restaurants,
      totalCount: restaurants.length,
      center: {
        lat: parseFloat(coords.y),
        lng: parseFloat(coords.x),
      },
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
