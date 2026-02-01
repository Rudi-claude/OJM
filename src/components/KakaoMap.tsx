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

const KAKAO_JS_KEY = '0b4baef74ef93426d887551e72d6868f';

export default function KakaoMap({ restaurants, center, selectedRestaurant }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const currentInfowindowRef = useRef<any>(null);
  const selectedInfowindowRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              <strong style="font-size:14px;color:#2563eb;">📍 우리 회사</strong>
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

    // 회사 위치도 bounds에 포함
    if (center) {
      bounds.extend(new window.kakao.maps.LatLng(center.lat, center.lng));
    }

    restaurantList.forEach((restaurant) => {
      if (!restaurant.x || !restaurant.y) return;

      const position = new window.kakao.maps.LatLng(restaurant.y, restaurant.x);
      bounds.extend(position);

      const marker = new window.kakao.maps.Marker({ position, map });

      const walkingTime = Math.ceil(restaurant.distance / 67);
      const infoContent = `
        <div style="padding:10px 14px;min-width:180px;font-family:sans-serif;">
          <strong style="font-size:14px;color:#333;">${restaurant.name}</strong>
          <p style="margin:6px 0 0;font-size:12px;color:#666;">${restaurant.category} · ${restaurant.distance}m</p>
          <p style="margin:4px 0 0;font-size:11px;color:#f97316;">🚶 도보 ${walkingTime}분</p>
        </div>
      `;

      const infowindow = new window.kakao.maps.InfoWindow({ content: infoContent });
      let isOpen = false;

      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 다른 인포윈도우 닫기
        if (currentInfowindowRef.current && currentInfowindowRef.current !== infowindow) {
          currentInfowindowRef.current.close();
        }

        // 토글
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

  // 선택된 맛집 경로 표시
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.kakao || !center) return;

    const map = mapInstanceRef.current;

    // 기존 경로선 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // 기존 선택 마커 제거
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
      selectedMarkerRef.current = null;
    }

    if (selectedRestaurant && selectedRestaurant.x && selectedRestaurant.y) {
      const companyPosition = new window.kakao.maps.LatLng(center.lat, center.lng);
      const restaurantPosition = new window.kakao.maps.LatLng(selectedRestaurant.y, selectedRestaurant.x);

      // 경로선 그리기 (점선)
      const polyline = new window.kakao.maps.Polyline({
        path: [companyPosition, restaurantPosition],
        strokeWeight: 4,
        strokeColor: '#f97316',
        strokeOpacity: 0.8,
        strokeStyle: 'shortdash',
      });

      polyline.setMap(map);
      polylineRef.current = polyline;

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

      // 도보 시간 계산
      const walkingTime = Math.ceil(selectedRestaurant.distance / 67);

      // 경로 중간에 도보 시간 표시
      const midLat = (center.lat + selectedRestaurant.y) / 2;
      const midLng = (center.lng + selectedRestaurant.x) / 2;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(midLat, midLng),
        content: `
          <div style="padding:8px 12px;background:#f97316;color:white;border-radius:20px;font-size:13px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
            🚶 ${walkingTime}분
          </div>
        `,
        yAnchor: 1,
      });

      customOverlay.setMap(map);

      // cleanup에 포함
      const originalPolyline = polylineRef.current;
      polylineRef.current = { polyline, overlay: customOverlay };

      // 선택된 맛집 인포윈도우 자동 열기
      const infoContent = `
        <div style="padding:12px 16px;min-width:200px;font-family:sans-serif;">
          <strong style="font-size:15px;color:#f97316;">🎯 ${selectedRestaurant.name}</strong>
          <p style="margin:6px 0 0;font-size:12px;color:#666;">${selectedRestaurant.category} · ${selectedRestaurant.distance}m</p>
          <p style="margin:6px 0 0;font-size:13px;color:#f97316;font-weight:bold;">🚶 도보 약 ${walkingTime}분</p>
        </div>
      `;

      const infowindow = new window.kakao.maps.InfoWindow({ content: infoContent });
      infowindow.open(map, selectedMarker);
      selectedInfowindowRef.current = infowindow;
      let selectedInfoOpen = true;

      window.kakao.maps.event.addListener(selectedMarker, 'click', () => {
        // 다른 인포윈도우 닫기
        if (currentInfowindowRef.current) {
          currentInfowindowRef.current.close();
          currentInfowindowRef.current = null;
        }

        // 토글
        if (selectedInfoOpen) {
          infowindow.close();
          selectedInfoOpen = false;
        } else {
          infowindow.open(map, selectedMarker);
          selectedInfoOpen = true;
        }
      });

      // 지도 범위 조정
      const bounds = new window.kakao.maps.LatLngBounds();
      bounds.extend(companyPosition);
      bounds.extend(restaurantPosition);
      map.setBounds(bounds);
    }

    return () => {
      if (polylineRef.current) {
        if (polylineRef.current.polyline) {
          polylineRef.current.polyline.setMap(null);
        }
        if (polylineRef.current.overlay) {
          polylineRef.current.overlay.setMap(null);
        }
        if (polylineRef.current.setMap) {
          polylineRef.current.setMap(null);
        }
      }
    };
  }, [selectedRestaurant, center, isLoaded]);

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
      {selectedRestaurant && (
        <div className="bg-orange-50 p-3 text-center text-sm text-orange-700">
          🎯 <strong>{selectedRestaurant.name}</strong>까지 경로가 표시되었습니다!
        </div>
      )}
    </div>
  );
}
