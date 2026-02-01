"use client";

import { useState, useCallback } from "react";
import type { MealLog, MoodType } from "@/types";

interface UseMealLogsReturn {
  mealLogs: MealLog[];
  isLoading: boolean;
  error: string | null;
  fetchMealLogs: (userId: string, days?: number) => Promise<void>;
  addMealLog: (params: AddMealLogParams) => Promise<boolean>;
  getCategoryStats: () => CategoryStats[];
  getRecentCategories: (days?: number) => string[];
}

interface AddMealLogParams {
  userId: string;
  restaurantId: string;
  restaurantName: string;
  category: string;
  weather?: string;
  mood?: MoodType;
}

interface CategoryStats {
  category: string;
  count: number;
  lastAte: Date;
}

export function useMealLogs(): UseMealLogsReturn {
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMealLogs = useCallback(async (userId: string, days = 7) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/meal-logs?userId=${userId}&days=${days}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "식사 기록을 불러올 수 없습니다.");
      }

      setMealLogs(
        data.mealLogs.map((log: MealLog & { ateAt: string }) => ({
          ...log,
          ateAt: new Date(log.ateAt),
        }))
      );
    } catch (err) {
      console.error("식사 기록 조회 실패:", err);
      setError(
        err instanceof Error ? err.message : "식사 기록을 불러올 수 없습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMealLog = useCallback(
    async (params: AddMealLogParams): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/meal-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "식사 기록을 저장할 수 없습니다.");
        }

        const newLog: MealLog = {
          ...data.mealLog,
          ateAt: new Date(data.mealLog.ateAt),
        };

        setMealLogs((prev) => [newLog, ...prev]);
        return true;
      } catch (err) {
        console.error("식사 기록 저장 실패:", err);
        setError(
          err instanceof Error ? err.message : "식사 기록을 저장할 수 없습니다."
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getCategoryStats = useCallback((): CategoryStats[] => {
    const statsMap = new Map<
      string,
      { count: number; lastAte: Date }
    >();

    mealLogs.forEach((log) => {
      const existing = statsMap.get(log.category);
      if (existing) {
        existing.count += 1;
        if (log.ateAt > existing.lastAte) {
          existing.lastAte = log.ateAt;
        }
      } else {
        statsMap.set(log.category, {
          count: 1,
          lastAte: log.ateAt,
        });
      }
    });

    return Array.from(statsMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        lastAte: stats.lastAte,
      }))
      .sort((a, b) => b.count - a.count);
  }, [mealLogs]);

  const getRecentCategories = useCallback(
    (days = 3): string[] => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return [
        ...new Set(
          mealLogs
            .filter((log) => log.ateAt >= cutoffDate)
            .map((log) => log.category)
        ),
      ];
    },
    [mealLogs]
  );

  return {
    mealLogs,
    isLoading,
    error,
    fetchMealLogs,
    addMealLog,
    getCategoryStats,
    getRecentCategories,
  };
}
