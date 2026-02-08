"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Restaurant } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseTeamRouletteReturn {
  displayRestaurant: Restaurant | null;
  isSpinning: boolean;
  spinnerName: string | null;
  startRoulette: (restaurants: Restaurant[], userId: string, nickname: string, teamId: string) => Promise<void>;
  subscribeToRoulette: (teamId: string) => void;
  unsubscribe: () => void;
}

export function useTeamRoulette(): UseTeamRouletteReturn {
  const [displayRestaurant, setDisplayRestaurant] = useState<Restaurant | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinnerName, setSpinnerName] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const unsubscribe = useCallback(() => {
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const subscribeToRoulette = useCallback(
    (teamId: string) => {
      unsubscribe();

      const channel = supabase.channel(`team-roulette:${teamId}`, {
        config: { broadcast: { self: true } },
      });

      channel
        .on("broadcast", { event: "roulette_start" }, (payload) => {
          setIsSpinning(true);
          setDisplayRestaurant(null);
          setSpinnerName(payload.payload.nickname || null);
        })
        .on("broadcast", { event: "roulette_tick" }, (payload) => {
          const r = payload.payload.restaurant;
          if (r) {
            setDisplayRestaurant(r);
          }
        })
        .on("broadcast", { event: "roulette_result" }, (payload) => {
          const r = payload.payload.restaurant;
          if (r) {
            setDisplayRestaurant(r);
          }
          setSpinnerName(payload.payload.nickname || null);
          setIsSpinning(false);
        })
        .subscribe();

      channelRef.current = channel;
    },
    [unsubscribe]
  );

  const startRoulette = useCallback(
    async (restaurants: Restaurant[], userId: string, nickname: string, teamId: string) => {
      if (restaurants.length === 0 || isSpinning || !channelRef.current) return;

      // broadcast start
      channelRef.current.send({
        type: "broadcast",
        event: "roulette_start",
        payload: { nickname },
      });

      // send ticks
      let count = 0;
      const maxCount = 20;
      const finalIndex = Math.floor(Math.random() * restaurants.length);

      tickTimerRef.current = setInterval(() => {
        count++;
        if (count < maxCount) {
          const randomIndex = Math.floor(Math.random() * restaurants.length);
          channelRef.current?.send({
            type: "broadcast",
            event: "roulette_tick",
            payload: { restaurant: restaurants[randomIndex] },
          });
        } else {
          // final result
          const finalRestaurant = restaurants[finalIndex];
          channelRef.current?.send({
            type: "broadcast",
            event: "roulette_result",
            payload: { restaurant: finalRestaurant, nickname },
          });

          if (tickTimerRef.current) {
            clearInterval(tickTimerRef.current);
            tickTimerRef.current = null;
          }

          // Save result to DB
          supabase
            .from("team_roulettes")
            .insert({
              team_id: teamId,
              started_by: userId,
              restaurant_id: finalRestaurant.id,
              restaurant_name: finalRestaurant.name,
              restaurant_category: finalRestaurant.category,
              restaurant_address: finalRestaurant.address,
              restaurant_distance: finalRestaurant.distance,
              restaurant_place_url: finalRestaurant.placeUrl || null,
              status: "done",
            })
            .then(() => {});
        }
      }, 100);
    },
    [isSpinning]
  );

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    displayRestaurant,
    isSpinning,
    spinnerName,
    startRoulette,
    subscribeToRoulette,
    unsubscribe,
  };
}
