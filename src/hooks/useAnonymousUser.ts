"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getAnonymousId,
  setAnonymousId,
  generateAnonymousId,
  getNickname,
  setNickname as setNicknameStorage,
} from "@/lib/storage";

interface AnonymousUser {
  id: string;
  anonymousId: string;
  nickname: string | null;
}

interface UseAnonymousUserReturn {
  user: AnonymousUser | null;
  isLoading: boolean;
  error: string | null;
  updateNickname: (nickname: string) => Promise<boolean>;
}

export function useAnonymousUser(): UseAnonymousUserReturn {
  const [user, setUser] = useState<AnonymousUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let anonymousId = getAnonymousId();

      if (!anonymousId) {
        anonymousId = generateAnonymousId();
        setAnonymousId(anonymousId);
      }

      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id, anonymous_id, nickname")
        .eq("anonymous_id", anonymousId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingUser) {
        const nickname = existingUser.nickname || getNickname();
        setUser({
          id: existingUser.id,
          anonymousId: existingUser.anonymous_id,
          nickname,
        });
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ anonymous_id: anonymousId })
          .select("id, anonymous_id, nickname")
          .single();

        if (insertError) throw insertError;

        if (newUser) {
          setUser({
            id: newUser.id,
            anonymousId: newUser.anonymous_id,
            nickname: newUser.nickname || getNickname(),
          });
        }
      }
    } catch (err) {
      console.error("익명 사용자 초기화 실패:", err);
      setError(
        err instanceof Error ? err.message : "사용자 초기화에 실패했습니다."
      );

      const anonymousId = getAnonymousId();
      if (anonymousId) {
        setUser({
          id: "",
          anonymousId,
          nickname: getNickname(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateNickname = useCallback(
    async (nickname: string): Promise<boolean> => {
      if (!user?.id) return false;
      try {
        const { error: updateError } = await supabase
          .from("users")
          .update({ nickname })
          .eq("id", user.id);

        if (updateError) throw updateError;

        setNicknameStorage(nickname);
        setUser((prev) => (prev ? { ...prev, nickname } : null));
        return true;
      } catch (err) {
        console.error("닉네임 업데이트 실패:", err);
        return false;
      }
    },
    [user?.id]
  );

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  return { user, isLoading, error, updateNickname };
}
