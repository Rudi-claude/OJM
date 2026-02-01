import { Restaurant } from '@/types';

const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local';

// 카테고리 코드 매핑
const categoryCodeMap: Record<string, string> = {
  '한식': 'FD6', // 음식점 전체에서 필터링
  '중식': 'FD6',
  '일식': 'FD6',
  '양식': 'FD6',
  '분식': 'FD6',
  '카페': 'CE7', // 카페
};

// 카테고리 키워드 매핑
const categoryKeywordMap: Record<string, string> = {
  '한식': '한식',
  '중식': '중식 중국집',
  '일식': '일식 초밥',
  '양식': '양식 파스타',
  '분식': '분식 떡볶이',
  '카페': '카페',
};

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  distance: string;
  x: string; // 경도
  y: string; // 위도
}

interface KakaoSearchResponse {
  documents: KakaoPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

// 주소를 좌표로 변환
export async function addressToCoords(address: string): Promise<{ x: string; y: string } | null> {
  if (!KAKAO_API_KEY) {
    console.error('카카오 API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    const response = await fetch(
      `${KAKAO_API_URL}/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      return {
        x: data.documents[0].x,
        y: data.documents[0].y,
      };
    }

    // 주소 검색 실패시 키워드 검색 시도
    const keywordResponse = await fetch(
      `${KAKAO_API_URL}/search/keyword.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    const keywordData = await keywordResponse.json();

    if (keywordData.documents && keywordData.documents.length > 0) {
      return {
        x: keywordData.documents[0].x,
        y: keywordData.documents[0].y,
      };
    }

    return null;
  } catch (error) {
    console.error('주소 변환 오류:', error);
    return null;
  }
}

// 주변 음식점 검색
export async function searchRestaurants(
  x: string,
  y: string,
  category?: string,
  radius: number = 500
): Promise<Restaurant[]> {
  if (!KAKAO_API_KEY) {
    console.error('카카오 API 키가 설정되지 않았습니다.');
    return [];
  }

  try {
    let url: string;

    if (category && category !== '전체') {
      // 카테고리별 키워드 검색
      const keyword = categoryKeywordMap[category] || '맛집';
      url = `${KAKAO_API_URL}/search/keyword.json?query=${encodeURIComponent(keyword)}&x=${x}&y=${y}&radius=${radius}&sort=distance`;
    } else {
      // 전체 음식점 검색 (카테고리 코드 FD6 = 음식점)
      url = `${KAKAO_API_URL}/search/category.json?category_group_code=FD6&x=${x}&y=${y}&radius=${radius}&sort=distance`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    });

    const data: KakaoSearchResponse = await response.json();

    if (!data.documents) {
      return [];
    }

    // 카카오 응답을 Restaurant 타입으로 변환
    const restaurants: Restaurant[] = data.documents.map((place) => {
      // 카테고리 추출 (예: "음식점 > 한식 > 국밥" -> "한식")
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
      };
    });

    return restaurants;
  } catch (error) {
    console.error('음식점 검색 오류:', error);
    return [];
  }
}

// 통합 검색 함수: 주소 입력 -> 좌표 변환 -> 음식점 검색
export async function searchRestaurantsByAddress(
  address: string,
  category?: string,
  radius: number = 500
): Promise<Restaurant[]> {
  const coords = await addressToCoords(address);

  if (!coords) {
    console.error('주소를 찾을 수 없습니다.');
    return [];
  }

  return searchRestaurants(coords.x, coords.y, category, radius);
}
