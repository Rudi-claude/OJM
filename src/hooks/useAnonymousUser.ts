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
  retryInit: () => Promise<void>;
}

// nickname 컬럼 포함 쿼리 시도, 실패하면 없이 시도
async function fetchUserByAnonymousId(anonymousId: string) {
  // 1차: nickname 포함
  const { data: d1, error: e1 } = await supabase
    .from("users")
    .select("id, anonymous_id, nickname")
    .eq("anonymous_id", anonymousId)
    .single();

  if (!e1) return { data: d1, notFound: false };
  if (e1.code === "PGRST116") return { data: null, notFound: true };

  // 2차: nickname 없이 (컬럼이 없을 수 있음)
  const { data: d2, error: e2 } = await supabase
    .from("users")
    .select("id, anonymous_id")
    .eq("anonymous_id", anonymousId)
    .single();

  if (!e2) return { data: { ...d2, nickname: null }, notFound: false };
  if (e2.code === "PGRST116") return { data: null, notFound: true };

  throw e2;
}

async function createUser(anonymousId: string) {
  // 1차: nickname 포함 반환
  const { data: d1, error: e1 } = await supabase
    .from("users")
    .insert({ anonymous_id: anonymousId })
    .select("id, anonymous_id, nickname")
    .single();

  if (!e1 && d1) return d1;

  // 2차: nickname 없이 반환
  const { data: d2, error: e2 } = await supabase
    .from("users")
    .insert({ anonymous_id: anonymousId })
    .select("id, anonymous_id")
    .single();

  if (e2) throw e2;
  return { ...d2, nickname: null };
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

      const { data: existingUser, notFound } = await fetchUserByAnonymousId(anonymousId);

      if (existingUser) {
        const nickname = existingUser.nickname || getNickname();
        setUser({
          id: existingUser.id,
          anonymousId: existingUser.anonymous_id,
          nickname,
        });
      } else if (notFound) {
        const newUser = await createUser(anonymousId);
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
      const errMsg = (err as any)?.message || (err instanceof Error ? err.message : "사용자 초기화에 실패했습니다.");
      setError(errMsg);

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

  // user.id가 비어있을 때 DB에서 복구 시도
  const recoverUserId = useCallback(async (): Promise<string | null> => {
    const anonymousId = getAnonymousId();
    if (!anonymousId) return null;

    try {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("anonymous_id", anonymousId)
        .single();
      if (data?.id) {
        setUser((prev) => (prev ? { ...prev, id: data.id } : null));
        return data.id;
      }
    } catch {}
    return null;
  }, []);

  const updateNickname = useCallback(
    async (nickname: string): Promise<boolean> => {
      let userId = user?.id;

      // user.id가 비어있으면 복구 시도
      if (!userId) {
        userId = (await recoverUserId()) || undefined;
      }

      // localStorage에는 항상 저장
      setNicknameStorage(nickname);
      setUser((prev) => (prev ? { ...prev, nickname } : null));

      if (!userId) {
        // DB에 저장 못하지만 로컬에는 저장됨
        return true;
      }

      try {
        const { error: updateError } = await supabase
          .from("users")
          .update({ nickname })
          .eq("id", userId);

        if (updateError) {
          console.error("닉네임 DB 업데이트 실패:", updateError);
          // DB 실패해도 로컬에는 저장됨
        }
        return true;
      } catch (err) {
        console.error("닉네임 업데이트 실패:", err);
        return true;
      }
    },
    [user?.id, recoverUserId]
  );

  const retryInit = useCallback(async () => {
    await initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  return { user, isLoading, error, updateNickname, retryInit };
}
