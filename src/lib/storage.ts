// 최근 검색 주소
const RECENT_ADDRESSES_KEY = "ojm_recent_addresses";
const MAX_RECENT_ADDRESSES = 5;

export function getRecentAddresses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentAddress(address: string): void {
  if (typeof window === "undefined") return;
  const addresses = getRecentAddresses().filter((a) => a !== address);
  addresses.unshift(address);
  localStorage.setItem(
    RECENT_ADDRESSES_KEY,
    JSON.stringify(addresses.slice(0, MAX_RECENT_ADDRESSES))
  );
}

export function removeRecentAddress(address: string): void {
  if (typeof window === "undefined") return;
  const addresses = getRecentAddresses().filter((a) => a !== address);
  localStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(addresses));
}

// 좋아요 (Restaurant 객체로 저장)
const FAVORITES_KEY = "ojm_favorites";

interface FavoriteRestaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: number;
  rating?: number;
  phone?: string;
  placeUrl?: string;
  x?: number;
  y?: number;
}

export function getFavorites(): FavoriteRestaurant[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // 마이그레이션: 기존 string[] 형식이면 빈 배열로 초기화
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function getFavoriteIds(): string[] {
  return getFavorites().map((r) => r.id);
}

export function toggleFavorite(restaurant: FavoriteRestaurant): boolean {
  if (typeof window === "undefined") return false;
  const favorites = getFavorites();
  const index = favorites.findIndex((r) => r.id === restaurant.id);
  if (index >= 0) {
    favorites.splice(index, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return false;
  } else {
    favorites.push({
      id: restaurant.id,
      name: restaurant.name,
      category: restaurant.category,
      address: restaurant.address,
      distance: restaurant.distance,
      rating: restaurant.rating,
      phone: restaurant.phone,
      placeUrl: restaurant.placeUrl,
      x: restaurant.x,
      y: restaurant.y,
    });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  }
}

export function addFavorite(restaurant: FavoriteRestaurant): void {
  if (typeof window === "undefined") return;
  const favorites = getFavorites();
  if (favorites.some((r) => r.id === restaurant.id)) return;
  favorites.push({
    id: restaurant.id,
    name: restaurant.name,
    category: restaurant.category,
    address: restaurant.address,
    distance: restaurant.distance,
    rating: restaurant.rating,
    phone: restaurant.phone,
    placeUrl: restaurant.placeUrl,
    x: restaurant.x,
    y: restaurant.y,
  });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// 닉네임
const NICKNAME_KEY = "ojm_nickname";

export function getNickname(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NICKNAME_KEY);
}

export function setNickname(nickname: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICKNAME_KEY, nickname);
}

// 현재 팀
const CURRENT_TEAM_KEY = "ojm_current_team";

interface StoredTeam {
  id: string;
  name: string;
  code: string;
}

export function getCurrentTeam(): StoredTeam | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_TEAM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentTeam(team: StoredTeam): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_TEAM_KEY, JSON.stringify(team));
}

export function removeCurrentTeam(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_TEAM_KEY);
}

// 제외 목록
const EXCLUDES_KEY = "ojm_excludes";

export function getExcludes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EXCLUDES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleExclude(restaurantId: string): boolean {
  if (typeof window === "undefined") return false;
  const excludes = getExcludes();
  const index = excludes.indexOf(restaurantId);
  if (index >= 0) {
    excludes.splice(index, 1);
    localStorage.setItem(EXCLUDES_KEY, JSON.stringify(excludes));
    return false;
  } else {
    excludes.push(restaurantId);
    localStorage.setItem(EXCLUDES_KEY, JSON.stringify(excludes));
    return true;
  }
}

export function clearExcludes(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EXCLUDES_KEY);
}
