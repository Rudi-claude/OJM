"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";
import { setNickname as setNicknameStorage } from "@/lib/storage";

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  kakaoName: string | null;
  debugLog: string[];
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kakaoName, setKakaoName] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const initializedRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  // users 테이블에 upsert (기존 닉네임이 있으면 유지)
  const upsertUser = useCallback(
    async (authUser: { id: string; user_metadata: Record<string, unknown> }) => {
      const kakaoName =
        (authUser.user_metadata?.full_name as string) ||
        (authUser.user_metadata?.name as string) ||
        null;
      const avatarUrl =
        (authUser.user_metadata?.avatar_url as string) ||
        (authUser.user_metadata?.picture as string) ||
        null;

      try {
        // 먼저 기존 사용자 확인
        const { data: existing } = await supabase
          .from("users")
          .select("id, nickname, avatar_url")
          .eq("id", authUser.id)
          .single();

        if (existing) {
          // 기존 사용자: avatar_url만 업데이트, nickname은 유지
          await supabase
            .from("users")
            .update({ avatar_url: avatarUrl })
            .eq("id", authUser.id);

          return {
            id: existing.id,
            nickname: existing.nickname,
            avatarUrl: avatarUrl || existing.avatar_url,
            kakaoName,
          };
        }

        // 신규 사용자: insert (nickname은 null - NicknameModal에서 설정)
        const { data, error } = await supabase
          .from("users")
          .insert({
            id: authUser.id,
            avatar_url: avatarUrl,
          })
          .select("id, nickname, avatar_url")
          .single();

        if (error) {
          console.error("사용자 insert 실패:", error);
          return { id: authUser.id, nickname: null, avatarUrl, kakaoName };
        }

        return {
          id: data.id,
          nickname: data.nickname,
          avatarUrl: data.avatar_url,
          kakaoName,
        };
      } catch (err) {
        console.error("upsertUser 실패:", err);
        return { id: authUser.id, nickname: null, avatarUrl: null, kakaoName };
      }
    },
    []
  );

  // 세션에서 사용자 로드
  const handleSession = useCallback(
    async (session: { user: { id: string; user_metadata: Record<string, unknown> } } | null) => {
      try {
        if (!session?.user) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const sessionKakaoName =
          (session.user.user_metadata?.full_name as string) ||
          (session.user.user_metadata?.name as string) ||
          null;
        setKakaoName(sessionKakaoName);

        const userData = await upsertUser(session.user);
        setUser(userData);
      } catch (err) {
        console.error("handleSession 실패:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [upsertUser]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 안전장치: 3초 후에도 로딩 중이면 강제 해제
    const timeout = setTimeout(() => {
      addLog("타임아웃: 3초 초과");
      setIsLoading(false);
    }, 3000);

    // 1. 기존 세션 확인
    addLog("getSession 호출 시작");

    // getSession에 자체 타임아웃 적용
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("getSession 2초 타임아웃")), 2000)
    );

    Promise.race([sessionPromise, timeoutPromise])
      .then((result) => {
        const session = (result as { data: { session: any } }).data.session;
        clearTimeout(timeout);
        addLog(`getSession 완료: ${session ? "세션 있음" : "세션 없음"}`);
        handleSession(session);
      })
      .catch((err) => {
        addLog(`getSession 실패/타임아웃: ${err}`);
        clearTimeout(timeout);
        setUser(null);
        setIsLoading(false);
      });

    // 2. 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      addLog(`onAuthStateChange: ${event}`);
      if (event === "SIGNED_IN" && session?.user) {
        setIsLoading(true);
        await handleSession(session);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signInWithKakao = useCallback(async () => {
    // Supabase JS 클라이언트 우회 - 직접 OAuth URL로 이동
    const supabaseUrl = "https://xxhresiqpggsbkbrened.supabase.co";
    const redirectTo = encodeURIComponent(window.location.origin);
    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=kakao&redirect_to=${redirectTo}`;
    window.location.href = authUrl;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("로그아웃 실패:", error);
    }
    setUser(null);
  }, []);

  const updateNickname = useCallback(
    async (nickname: string): Promise<boolean> => {
      if (!user?.id) return false;

      // localStorage에도 저장 (호환)
      setNicknameStorage(nickname);
      setUser((prev) => (prev ? { ...prev, nickname } : null));

      try {
        const { error } = await supabase
          .from("users")
          .update({ nickname })
          .eq("id", user.id);

        if (error) {
          console.error("닉네임 DB 업데이트 실패:", error);
        }
        return true;
      } catch (err) {
        console.error("닉네임 업데이트 실패:", err);
        return true;
      }
    },
    [user?.id]
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    kakaoName,
    debugLog,
    signInWithKakao,
    signOut,
    updateNickname,
  };
}
