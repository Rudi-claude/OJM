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

    const init = async () => {
      try {
        // 1. URL 해시에서 OAuth 토큰 확인 (카카오 로그인 후 리다이렉트)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          addLog("URL에서 토큰 발견, setSession 시도");
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            // URL 해시 제거
            window.history.replaceState(null, "", window.location.pathname);

            if (error) {
              addLog(`setSession 실패: ${error.message}`);
            } else if (data.session?.user) {
              addLog("setSession 성공");
              await handleSession(data.session);
              return;
            }
          }
        }

        // 2. 기존 세션 확인 (타임아웃 적용)
        addLog("getSession 호출 시작");
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("2초 타임아웃")), 2000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const session = (result as { data: { session: any } }).data.session;
        addLog(`getSession 완료: ${session ? "세션 있음" : "세션 없음"}`);
        await handleSession(session);
      } catch (err) {
        addLog(`초기화 실패: ${err}`);
        setUser(null);
        setIsLoading(false);
      }
    };

    init();

    // 인증 상태 변경 리스너
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
      subscription.unsubscribe();
    };
  }, [handleSession, addLog]);

  const signInWithKakao = useCallback(async () => {
    // Supabase JS 클라이언트 우회 - 직접 OAuth URL로 이동
    const supabaseUrl = "https://xxhresiqpggsbkbrened.supabase.co";
    const redirectTo = encodeURIComponent(window.location.origin);
    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=kakao&redirect_to=${redirectTo}`;
    window.location.href = authUrl;
  }, []);

  const signOut = useCallback(async () => {
    // Supabase 세션 정리 시도 (타임아웃 적용)
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject("timeout"), 2000)),
      ]);
    } catch {
      // signOut 실패해도 로컬 정리 진행
    }
    // 로컬 스토리지에서 Supabase 토큰 직접 제거
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-")) localStorage.removeItem(key);
    });
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
