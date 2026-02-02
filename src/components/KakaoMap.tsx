'use client';

import { useEffect, useRef, useState } from 'react';
import { Restaurant } from '@/types';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  restaurants: Restaurant[];
  center?: { lat: number; lng: number };
  selectedRestaurant?: Restaurant | null;
}

interface WalkingRoute {
  route: { lat: number; lng: number }[];
  totalDistance: number;
  totalTimeMinutes: number;
}

const KAKAO_JS_KEY = '0b4baef74ef93426d887551e72d6868f';

export default function KakaoMap({ restaurants, center, selectedRestaurant }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const currentInfowindowRef = useRef<any>(null);
  const selectedInfowindowRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walkingRoute, setWalkingRoute] = useState<WalkingRoute | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    script.async = true;

    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          initMap();
        });
      } else {
        setError('지도 로드 실패');
      }
    };

    script.onerror = () => {
      setError('localhost에서는 지도가 제한됩니다. 배포 후 이용 가능해요!');
    };

    document.head.appendChild(script);
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;

    try {
      const options = {
        center: new window.kakao.maps.LatLng(
          center?.lat || 37.5447,
          center?.lng || 127.0556
        ),
        level: 4,
      };

      const map = new window.kakao.maps.Map(mapRef.current, options);
      mapInstanceRef.current = map;

      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

      setIsLoaded(true);

      // 지도 클릭 시 모든 인포윈도우 닫기
      window.kakao.maps.event.addListener(map, 'click', () => {
        if (currentInfowindowRef.current) {
          currentInfowindowRef.current.close();
          currentInfowindowRef.current = null;
        }
        if (selectedInfowindowRef.current) {
          selectedInfowindowRef.current.close();
          selectedInfowindowRef.current = null;
        }
      });

      // 회사 위치 마커
      if (center) {
        const centerPosition = new window.kakao.maps.LatLng(center.lat, center.lng);
        const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
        const imageSize = new window.kakao.maps.Size(24, 35);
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

        const centerMarker = new window.kakao.maps.Marker({
          position: centerPosition,
          map,
          image: markerImage,
          zIndex: 10,
        });

        const centerInfo = new window.kakao.maps.InfoWindow({
          content: `
            <div style="padding:10px 14px;min-width:120px;font-family:sans-serif;text-align:center;">
              <strong style="font-size:14px;color:#6B77E8;">📍 우리 회사</strong>
            </div>
          `,
        });

        window.kakao.maps.event.addListener(centerMarker, 'click', () => {
          centerInfo.open(map, centerMarker);
        });
      }

      addMarkers(map, restaurants);
    } catch (err) {
      setError('지도 초기화 실패');
    }
  };

  const addMarkers = (map: any, restaurantList: Restaurant[]) => {
    markersRef.current.forEach((item) => {
      if (item.marker) item.marker.setMap(null);
      if (item.infowindow) item.infowindow.close();
    });
    markersRef.current = [];
    currentInfowindowRef.current = null;

    if (restaurantList.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    if (center) {
      bounds.extend(new window.kakao.maps.LatLng(center.lat, center.lng));
    }

    restaurantList.forEach((restaurant) => {
      if (!restaurant.x || !restaurant.y) return;

      const position = new window.kakao.maps.LatLng(restaurant.y, restaurant.x);
      bounds.extend(position);

      const marker = new window.kakao.maps.Marker({ position, map });

      const infoContent = `
        <div style="padding:10px 14px;min-width:180px;font-family:sans-serif;">
          <strong style="font-size:14px;color:#333;">${restaurant.name}</strong>
          <p style="margin:6px 0 0;font-size:12px;color:#666;">${restaurant.category}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#888;">직선거리 ${restaurant.distance}m</p>
        </div>
      `;

      const infowindow = new window.kakao.maps.InfoWindow({ content: infoContent });
      let isOpen = false;

      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (currentInfowindowRef.current && currentInfowindowRef.current !== infowindow) {
          currentInfowindowRef.current.close();
        }

        if (isOpen) {
          infowindow.close();
          isOpen = false;
          currentInfowindowRef.current = null;
        } else {
          infowindow.open(map, marker);
          isOpen = true;
          currentInfowindowRef.current = infowindow;
        }
      });

      markersRef.current.push({ marker, infowindow, isOpen: () => isOpen, setOpen: (v: boolean) => { isOpen = v; } });
    });

    if (restaurantList.length > 0) {
      map.setBounds(bounds);
    }
  };

  // 도보 경로 가져오기
  const fetchWalkingRoute = async () => {
    if (!center || !selectedRestaurant?.x || !selectedRestaurant?.y) return;

    setIsRouteLoading(true);
    try {
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startX: center.lng,
          startY: center.lat,
          endX: selectedRestaurant.x,
          endY: selectedRestaurant.y,
          startName: '우리회사',
          endName: selectedRestaurant.name,
        }),
      });

      const data = await response.json();

      if (data.success && data.route && data.route.length > 0) {
        setWalkingRoute({
          route: data.route,
          totalDistance: data.totalDistance,
          totalTimeMinutes: data.totalTimeMinutes,
        });
      } else {
        setWalkingRoute(null);
      }
    } catch (error) {
      console.error('경로 조회 실패:', error);
      setWalkingRoute(null);
    } finally {
      setIsRouteLoading(false);
    }
  };

  // 선택된 맛집 경로 표시
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.kakao || !center) return;

    const map = mapInstanceRef.current;

    // 기존 경로선 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // 기존 오버레이 제거
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    // 기존 선택 마커 제거
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
      selectedMarkerRef.current = null;
    }

    // 기존 인포윈도우 닫기
    if (selectedInfowindowRef.current) {
      selectedInfowindowRef.current.close();
      selectedInfowindowRef.current = null;
    }

    setWalkingRoute(null);

    if (selectedRestaurant && selectedRestaurant.x && selectedRestaurant.y) {
      // 도보 경로 가져오기
      fetchWalkingRoute();

      const restaurantPosition = new window.kakao.maps.LatLng(selectedRestaurant.y, selectedRestaurant.x);

      // 선택된 맛집에 특별 마커
      const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
      const imageSize = new window.kakao.maps.Size(40, 42);
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

      const selectedMarker = new window.kakao.maps.Marker({
        position: restaurantPosition,
        map,
        image: markerImage,
        zIndex: 20,
      });

      selectedMarkerRef.current = selectedMarker;

      // 지도 범위 조정
      const bounds = new window.kakao.maps.LatLngBounds();
      bounds.extend(new window.kakao.maps.LatLng(center.lat, center.lng));
      bounds.extend(restaurantPosition);
      map.setBounds(bounds);
    }
  }, [selectedRestaurant, center, isLoaded]);

  // 도보 경로 그리기
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.kakao || !center || !selectedRestaurant) return;

    const map = mapInstanceRef.current;

    // 기존 경로선 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // 기존 오버레이 제거
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (walkingRoute && walkingRoute.route.length > 0) {
      // 실제 도보 경로 그리기
      const path = walkingRoute.route.map(
        (coord) => new window.kakao.maps.LatLng(coord.lat, coord.lng)
      );

      const polyline = new window.kakao.maps.Polyline({
        path,
        strokeWeight: 5,
        strokeColor: '#6B77E8',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
      });

      polyline.setMap(map);
      polylineRef.current = polyline;

      // 경로 중간에 시간/거리 표시
      const midIndex = Math.floor(walkingRoute.route.length / 2);
      const midPoint = walkingRoute.route[midIndex];

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(midPoint.lat, midPoint.lng),
        content: `
          <div style="padding:10px 14px;background:linear-gradient(135deg,#6B77E8,#8B95FF);color:white;border-radius:12px;font-size:12px;font-weight:bold;box-shadow:0 4px 12px rgba(107,119,232,0.4);text-align:center;">
            <div>🚶 도보 ${walkingRoute.totalTimeMinutes}분</div>
            <div style="font-size:11px;opacity:0.9;margin-top:2px;">${walkingRoute.totalDistance}m</div>
          </div>
        `,
        yAnchor: 1.2,
      });

      customOverlay.setMap(map);
      overlayRef.current = customOverlay;

      // 선택된 맛집 인포윈도우
      if (selectedMarkerRef.current) {
        const infoContent = `
          <div style="padding:12px 16px;min-width:200px;font-family:sans-serif;">
            <strong style="font-size:15px;color:#6B77E8;">🎯 ${selectedRestaurant.name}</strong>
            <p style="margin:6px 0 0;font-size:12px;color:#666;">${selectedRestaurant.category}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#6B77E8;font-weight:bold;">
              🚶 도보 ${walkingRoute.totalTimeMinutes}분 (${walkingRoute.totalDistance}m)
            </p>
          </div>
        `;

        const infowindow = new window.kakao.maps.InfoWindow({ content: infoContent });
        infowindow.open(map, selectedMarkerRef.current);
        selectedInfowindowRef.current = infowindow;

        // 마커 클릭 시 인포윈도우 토글
        window.kakao.maps.event.addListener(selectedMarkerRef.current, 'click', () => {
          if (selectedInfowindowRef.current) {
            selectedInfowindowRef.current.close();
            selectedInfowindowRef.current = null;
          } else {
            infowindow.open(map, selectedMarkerRef.current);
            selectedInfowindowRef.current = infowindow;
          }
        });
      }

      // 경로 전체가 보이도록 지도 조정
      const bounds = new window.kakao.maps.LatLngBounds();
      path.forEach((p: any) => bounds.extend(p));
      map.setBounds(bounds);

    } else if (selectedRestaurant && selectedRestaurant.x && selectedRestaurant.y && !isRouteLoading) {
      // 도보 경로가 없으면 직선으로 표시 (폴백)
      const companyPosition = new window.kakao.maps.LatLng(center.lat, center.lng);
      const restaurantPosition = new window.kakao.maps.LatLng(selectedRestaurant.y, selectedRestaurant.x);

      const polyline = new window.kakao.maps.Polyline({
        path: [companyPosition, restaurantPosition],
        strokeWeight: 4,
        strokeColor: '#6B77E8',
        strokeOpacity: 0.6,
        strokeStyle: 'shortdash',
      });

      polyline.setMap(map);
      polylineRef.current = polyline;

      // 직선 거리 표시
      const midLat = (center.lat + selectedRestaurant.y) / 2;
      const midLng = (center.lng + selectedRestaurant.x) / 2;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(midLat, midLng),
        content: `
          <div style="padding:8px 12px;background:#888;color:white;border-radius:12px;font-size:11px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
            📍 직선 ${selectedRestaurant.distance}m
          </div>
        `,
        yAnchor: 1,
      });

      customOverlay.setMap(map);
      overlayRef.current = customOverlay;

      // 선택된 맛집 인포윈도우
      if (selectedMarkerRef.current) {
        const infoContent = `
          <div style="padding:12px 16px;min-width:200px;font-family:sans-serif;">
            <strong style="font-size:15px;color:#6B77E8;">🎯 ${selectedRestaurant.name}</strong>
            <p style="margin:6px 0 0;font-size:12px;color:#666;">${selectedRestaurant.category}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#888;">직선거리 ${selectedRestaurant.distance}m</p>
          </div>
        `;

        const infowindow = new window.kakao.maps.InfoWindow({ content: infoContent });
        infowindow.open(map, selectedMarkerRef.current);
        selectedInfowindowRef.current = infowindow;

        // 마커 클릭 시 인포윈도우 토글
        window.kakao.maps.event.addListener(selectedMarkerRef.current, 'click', () => {
          if (selectedInfowindowRef.current) {
            selectedInfowindowRef.current.close();
            selectedInfowindowRef.current = null;
          } else {
            infowindow.open(map, selectedMarkerRef.current);
            selectedInfowindowRef.current = infowindow;
          }
        });
      }
    }
  }, [walkingRoute, isRouteLoading, selectedRestaurant, center, isLoaded]);

  useEffect(() => {
    if (isLoaded && mapInstanceRef.current && window.kakao) {
      addMarkers(mapInstanceRef.current, restaurants);
    }
  }, [restaurants, isLoaded]);

  useEffect(() => {
    if (isLoaded && mapInstanceRef.current && center && window.kakao) {
      const newCenter = new window.kakao.maps.LatLng(center.lat, center.lng);
      mapInstanceRef.current.setCenter(newCenter);
    }
  }, [center, isLoaded]);

  if (error) {
    return (
      <div className="w-full rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(restaurants[0]?.address || '성수동 맛집')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-yellow-400 text-gray-800 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
          >
            카카오맵에서 보기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg">
      <div ref={mapRef} className="w-full h-[400px] bg-gray-100">
        {!isLoaded && (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500">지도 로딩 중...</p>
          </div>
        )}
      </div>
      {selectedRestaurant && center && (
        <div className="bg-[#F5F6FF] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isRouteLoading ? (
            <div className="text-sm text-[#6B77E8] flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              경로 계산 중...
            </div>
          ) : walkingRoute ? (
            <div className="text-sm text-[#6B77E8]">
              🎯 <strong>{selectedRestaurant.name}</strong>까지{' '}
              <span className="font-bold">도보 {walkingRoute.totalTimeMinutes}분</span>{' '}
              ({walkingRoute.totalDistance}m)
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              🎯 <strong>{selectedRestaurant.name}</strong> - 직선거리 {selectedRestaurant.distance}m
            </div>
          )}
          <a
            href={`https://map.kakao.com/link/from/우리회사,${center.lat},${center.lng}/to/${encodeURIComponent(selectedRestaurant.name)},${selectedRestaurant.y},${selectedRestaurant.x}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#6B77E8]/25 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            카카오맵에서 보기
          </a>
        </div>
      )}
    </div>
  );
}
