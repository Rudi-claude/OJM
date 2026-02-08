"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Restaurant, TeamVote, TeamVoteOption } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useTeamVote() {
  const [activeVote, setActiveVote] = useState<TeamVote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentUserIdRef = useRef<string>("");

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const fetchActiveVote = useCallback(
    async (teamId: string, userId: string) => {
      currentUserIdRef.current = userId;
      setIsLoading(true);
      try {
        // 최신 open 투표 조회
        const { data: voteData, error: voteError } = await supabase
          .from("team_votes")
          .select("id, team_id, title, created_by, status, created_at")
          .eq("team_id", teamId)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (voteError || !voteData) {
          setActiveVote(null);
          setIsLoading(false);
          return;
        }

        // 옵션 조회
        const { data: optionsData } = await supabase
          .from("team_vote_options")
          .select("id, vote_id, restaurant_id, restaurant_name, restaurant_category, restaurant_address, restaurant_distance, restaurant_place_url, sort_order")
          .eq("vote_id", voteData.id)
          .order("sort_order", { ascending: true });

        // 투표 현황 조회
        const { data: picksData } = await supabase
          .from("team_vote_picks")
          .select("id, vote_id, option_id, user_id")
          .eq("vote_id", voteData.id);

        const options: TeamVoteOption[] = (optionsData || []).map((opt: any) => {
          const picks = (picksData || []).filter((p: any) => p.option_id === opt.id);
          return {
            id: opt.id,
            voteId: opt.vote_id,
            restaurant: {
              id: opt.restaurant_id,
              name: opt.restaurant_name,
              category: opt.restaurant_category,
              address: opt.restaurant_address,
              distance: opt.restaurant_distance,
              placeUrl: opt.restaurant_place_url,
            },
            pickCount: picks.length,
            pickedByMe: picks.some((p: any) => p.user_id === userId),
          };
        });

        setActiveVote({
          id: voteData.id,
          teamId: voteData.team_id,
          title: voteData.title,
          createdBy: voteData.created_by,
          status: voteData.status,
          options,
          createdAt: voteData.created_at,
        });
      } catch (err) {
        console.error("투표 조회 실패:", err);
        setActiveVote(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createVote = useCallback(
    async (teamId: string, title: string, restaurants: Restaurant[], userId: string): Promise<TeamVote | null> => {
      setIsLoading(true);
      try {
        const { data: voteData, error: voteError } = await supabase
          .from("team_votes")
          .insert({
            team_id: teamId,
            title: title || "오늘 점심 투표",
            created_by: userId,
            status: "open",
          })
          .select("id, team_id, title, created_by, status, created_at")
          .single();

        if (voteError || !voteData) throw voteError || new Error("투표 생성 실패");

        // 옵션 추가
        const optionInserts = restaurants.map((r, i) => ({
          vote_id: voteData.id,
          restaurant_id: r.id,
          restaurant_name: r.name,
          restaurant_category: r.category,
          restaurant_address: r.address,
          restaurant_distance: r.distance,
          restaurant_place_url: r.placeUrl || null,
          sort_order: i,
        }));

        const { data: optionsData, error: optionsError } = await supabase
          .from("team_vote_options")
          .insert(optionInserts)
          .select("id, vote_id, restaurant_id, restaurant_name, restaurant_category, restaurant_address, restaurant_distance, restaurant_place_url, sort_order");

        if (optionsError) throw optionsError;

        const options: TeamVoteOption[] = (optionsData || []).map((opt: any) => ({
          id: opt.id,
          voteId: opt.vote_id,
          restaurant: {
            id: opt.restaurant_id,
            name: opt.restaurant_name,
            category: opt.restaurant_category,
            address: opt.restaurant_address,
            distance: opt.restaurant_distance,
            placeUrl: opt.restaurant_place_url,
          },
          pickCount: 0,
          pickedByMe: false,
        }));

        const vote: TeamVote = {
          id: voteData.id,
          teamId: voteData.team_id,
          title: voteData.title,
          createdBy: voteData.created_by,
          status: voteData.status,
          options,
          createdAt: voteData.created_at,
        };

        setActiveVote(vote);
        return vote;
      } catch (err) {
        console.error("투표 생성 실패:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const castVote = useCallback(
    async (voteId: string, optionId: string, userId: string): Promise<boolean> => {
      try {
        // 기존 투표 삭제 (1인 1표)
        await supabase
          .from("team_vote_picks")
          .delete()
          .eq("vote_id", voteId)
          .eq("user_id", userId);

        // 새 투표
        const { error: insertError } = await supabase
          .from("team_vote_picks")
          .insert({ vote_id: voteId, option_id: optionId, user_id: userId });

        if (insertError) throw insertError;
        return true;
      } catch (err) {
        console.error("투표 실패:", err);
        return false;
      }
    },
    []
  );

  const closeVote = useCallback(
    async (voteId: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from("team_votes")
          .update({ status: "closed" })
          .eq("id", voteId);

        if (updateError) throw updateError;
        return true;
      } catch (err) {
        console.error("투표 마감 실패:", err);
        return false;
      }
    },
    []
  );

  const subscribeToVotes = useCallback(
    (teamId: string, userId: string) => {
      unsubscribe();
      currentUserIdRef.current = userId;

      const channel = supabase
        .channel(`team-votes:${teamId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "team_vote_picks",
          },
          () => {
            // 변경 감지 시 리페치
            fetchActiveVote(teamId, currentUserIdRef.current);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "team_votes",
          },
          () => {
            fetchActiveVote(teamId, currentUserIdRef.current);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "team_votes",
          },
          () => {
            fetchActiveVote(teamId, currentUserIdRef.current);
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    [unsubscribe, fetchActiveVote]
  );

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    activeVote,
    isLoading,
    createVote,
    castVote,
    closeVote,
    fetchActiveVote,
    subscribeToVotes,
    unsubscribe,
  };
}
