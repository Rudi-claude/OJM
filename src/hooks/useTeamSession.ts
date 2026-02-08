"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Restaurant, TeamSession, TeamCandidate, CandidateSource, SessionStatus } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useTeamSession() {
  const [session, setSession] = useState<TeamSession | null>(null);
  const [candidates, setCandidates] = useState<TeamCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const fetchActiveSession = useCallback(async (teamId: string) => {
    setIsLoading(true);
    try {
      // collecting 또는 deciding 상태의 최신 세션 조회
      const { data: sessionData, error: sessionError } = await supabase
        .from("team_sessions")
        .select("id, team_id, started_by, status, created_at")
        .eq("team_id", teamId)
        .in("status", ["collecting", "deciding"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !sessionData) {
        setSession(null);
        setCandidates([]);
        setIsLoading(false);
        return;
      }

      const currentSession: TeamSession = {
        id: sessionData.id,
        teamId: sessionData.team_id,
        startedBy: sessionData.started_by,
        status: sessionData.status as SessionStatus,
        createdAt: sessionData.created_at,
      };
      setSession(currentSession);

      // 후보 조회
      const { data: candidatesData } = await supabase
        .from("team_candidates")
        .select("id, session_id, added_by, source, restaurant_id, restaurant_name, restaurant_category, restaurant_address, restaurant_distance, restaurant_rating, restaurant_phone, restaurant_place_url, restaurant_x, restaurant_y, added_at")
        .eq("session_id", sessionData.id)
        .order("added_at", { ascending: true });

      const mapped: TeamCandidate[] = (candidatesData || []).map((c: any) => ({
        id: c.id,
        sessionId: c.session_id,
        addedBy: c.added_by,
        source: c.source as CandidateSource,
        restaurant: {
          id: c.restaurant_id,
          name: c.restaurant_name,
          category: c.restaurant_category || "",
          address: c.restaurant_address || "",
          distance: c.restaurant_distance || 0,
          rating: c.restaurant_rating || undefined,
          phone: c.restaurant_phone || undefined,
          placeUrl: c.restaurant_place_url || undefined,
          x: c.restaurant_x || undefined,
          y: c.restaurant_y || undefined,
        },
        addedAt: c.added_at,
      }));

      setCandidates(mapped);
    } catch (err) {
      console.error("세션 조회 실패:", err);
      setSession(null);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startSession = useCallback(
    async (teamId: string, userId: string): Promise<TeamSession | null> => {
      setIsLoading(true);
      try {
        // 기존 활성 세션을 done으로 전환
        await supabase
          .from("team_sessions")
          .update({ status: "done" })
          .eq("team_id", teamId)
          .in("status", ["collecting", "deciding"]);

        const { data, error } = await supabase
          .from("team_sessions")
          .insert({
            team_id: teamId,
            started_by: userId,
            status: "collecting",
          })
          .select("id, team_id, started_by, status, created_at")
          .single();

        if (error || !data) throw error || new Error("세션 생성 실패");

        const newSession: TeamSession = {
          id: data.id,
          teamId: data.team_id,
          startedBy: data.started_by,
          status: data.status as SessionStatus,
          createdAt: data.created_at,
        };

        setSession(newSession);
        setCandidates([]);
        return newSession;
      } catch (err) {
        console.error("세션 시작 실패:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const advanceToDeciding = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("team_sessions")
          .update({ status: "deciding" })
          .eq("id", sessionId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("세션 상태 변경 실패:", err);
        return false;
      }
    },
    []
  );

  const closeSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("team_sessions")
          .update({ status: "done" })
          .eq("id", sessionId);

        if (error) throw error;
        setSession(null);
        setCandidates([]);
        return true;
      } catch (err) {
        console.error("세션 종료 실패:", err);
        return false;
      }
    },
    []
  );

  const addCandidate = useCallback(
    async (
      sessionId: string,
      restaurant: Restaurant,
      userId: string,
      source: CandidateSource
    ): Promise<boolean> => {
      try {
        const { error } = await supabase.from("team_candidates").insert({
          session_id: sessionId,
          added_by: userId,
          source,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          restaurant_category: restaurant.category || null,
          restaurant_address: restaurant.address || null,
          restaurant_distance: restaurant.distance || null,
          restaurant_rating: restaurant.rating || null,
          restaurant_phone: restaurant.phone || null,
          restaurant_place_url: restaurant.placeUrl || null,
          restaurant_x: restaurant.x || null,
          restaurant_y: restaurant.y || null,
        });

        if (error) {
          if (error.code === "23505") {
            // UNIQUE violation - 이미 추가된 식당
            return false;
          }
          throw error;
        }
        return true;
      } catch (err) {
        console.error("후보 추가 실패:", err);
        return false;
      }
    },
    []
  );

  const ensureSessionAndAddCandidate = useCallback(
    async (
      teamId: string,
      restaurant: Restaurant,
      userId: string,
      source: CandidateSource
    ): Promise<{ success: boolean; isNew: boolean }> => {
      try {
        // 활성 세션(collecting 또는 deciding)이 있는지 확인
        const { data: existingSession } = await supabase
          .from("team_sessions")
          .select("id, team_id, started_by, status, created_at")
          .eq("team_id", teamId)
          .in("status", ["collecting", "deciding"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let sessionId: string;
        let isNew = false;

        if (existingSession) {
          sessionId = existingSession.id;
        } else {
          // 세션 없으면 자동 생성
          const newSession = await startSession(teamId, userId);
          if (!newSession) {
            return { success: false, isNew: false };
          }
          sessionId = newSession.id;
          isNew = true;
        }

        const success = await addCandidate(sessionId, restaurant, userId, source);
        return { success, isNew };
      } catch (err) {
        console.error("세션 확보 및 후보 추가 실패:", err);
        return { success: false, isNew: false };
      }
    },
    [startSession, addCandidate]
  );

  const removeCandidate = useCallback(
    async (candidateId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("team_candidates")
          .delete()
          .eq("id", candidateId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("후보 삭제 실패:", err);
        return false;
      }
    },
    []
  );

  const subscribeToSession = useCallback(
    (teamId: string) => {
      unsubscribe();

      const channel = supabase
        .channel(`team-session:${teamId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "team_candidates",
          },
          () => {
            fetchActiveSession(teamId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "team_sessions",
          },
          () => {
            fetchActiveSession(teamId);
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    [unsubscribe, fetchActiveSession]
  );

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    session,
    candidates,
    isLoading,
    startSession,
    advanceToDeciding,
    closeSession,
    addCandidate,
    ensureSessionAndAddCandidate,
    removeCandidate,
    subscribeToSession,
    unsubscribe,
    fetchActiveSession,
  };
}
