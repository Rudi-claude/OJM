"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Restaurant } from "@/types";
import type { Database } from "@/types/database";

type FavoriteRow = Database["public"]["Tables"]["user_favorites"]["Row"];

interface UseFavoritesReturn {
  favorites: Restaurant[];
  favoriteIds: string[];
  isLoading: boolean;
  toggleFavorite: (restaurant: Restaurant) => Promise<boolean>;
  addFavorite: (restaurant: Restaurant) => Promise<void>;
  isFavorite: (restaurantId: string) => boolean;
}

export function useFavorites(userId: string | undefined): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const favoriteIds = favorites.map((r) => r.id);

  // DB에서 즐겨찾기 로드
  const loadFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });

      if (error) {
        console.error("즐겨찾기 로드 실패:", error);
        setFavorites([]);
      } else {
        const rows = (data || []) as FavoriteRow[];
        setFavorites(
          rows.map((row) => ({
            id: row.restaurant_id,
            name: row.restaurant_name,
            category: row.restaurant_category || "",
            address: row.restaurant_address || "",
            distance: 0,
            rating: row.restaurant_rating ?? undefined,
            phone: row.restaurant_phone ?? undefined,
            placeUrl: row.restaurant_place_url ?? undefined,
            x: row.restaurant_x ?? undefined,
            y: row.restaurant_y ?? undefined,
          }))
        );
      }
    } catch (err) {
      console.error("즐겨찾기 로드 실패:", err);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (restaurantId: string) => favoriteIds.includes(restaurantId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (restaurant: Restaurant): Promise<boolean> => {
      if (!userId) return false;

      const exists = favoriteIds.includes(restaurant.id);

      if (exists) {
        // 제거
        setFavorites((prev) => prev.filter((r) => r.id !== restaurant.id));
        await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("restaurant_id", restaurant.id);
        return false;
      } else {
        // 추가
        setFavorites((prev) => [restaurant, ...prev]);
        await supabase.from("user_favorites").insert({
          user_id: userId,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          restaurant_category: restaurant.category || null,
          restaurant_address: restaurant.address || null,
          restaurant_rating: restaurant.rating ?? null,
          restaurant_phone: restaurant.phone ?? null,
          restaurant_place_url: restaurant.placeUrl ?? null,
          restaurant_x: restaurant.x ?? null,
          restaurant_y: restaurant.y ?? null,
        });
        return true;
      }
    },
    [userId, favoriteIds]
  );

  const addFavorite = useCallback(
    async (restaurant: Restaurant) => {
      if (!userId || favoriteIds.includes(restaurant.id)) return;

      setFavorites((prev) => [restaurant, ...prev]);
      await supabase.from("user_favorites").insert({
        user_id: userId,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_category: restaurant.category || null,
        restaurant_address: restaurant.address || null,
        restaurant_rating: restaurant.rating ?? null,
        restaurant_phone: restaurant.phone ?? null,
        restaurant_place_url: restaurant.placeUrl ?? null,
        restaurant_x: restaurant.x ?? null,
        restaurant_y: restaurant.y ?? null,
      });
    },
    [userId, favoriteIds]
  );

  return { favorites, favoriteIds, isLoading, toggleFavorite, addFavorite, isFavorite };
}
