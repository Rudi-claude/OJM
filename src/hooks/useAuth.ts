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

// JWT 디코딩 (supabase.auth 완전 우회)
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "ojm_access_token",
  REFRESH_TOKEN: "ojm_refresh_token",
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kakaoName, setKakaoName] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const initializedRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    setDebugLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${msg}`,
    ]);
  }, []);

  // users 테이블에 upsert (기존 닉네임이 있으면 유지)
  const upsertUser = useCallback(
    async (authUser: {
      id: string;
      user_metadata: Record<string, unknown>;
    }) => {
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
        return {
          id: authUser.id,
          nickname: null,
          avatarUrl: null,
          kakaoName,
        };
      }
    },
    []
  );

  // JWT에서 사용자 정보 추출 후 로그인 처리
  const loginFromToken = useCallback(
    async (accessToken: string) => {
      const payload = decodeJWT(accessToken);
      if (!payload) {
        addLog("JWT 디코딩 실패");
        return false;
      }

      // 토큰 만료 확인
      const exp = payload.exp as number;
      if (exp && Date.now() / 1000 > exp) {
        addLog("토큰 만료됨");
        return false;
      }

      const userId = payload.sub as string;
      if (!userId) {
        addLog("JWT에 사용자 ID 없음");
        return false;
      }

      const userMetadata =
        (payload.user_metadata as Record<string, unknown>) || {};

      addLog(`JWT 디코딩 성공: ${userId.substring(0, 8)}...`);

      const name =
        (userMetadata.full_name as string) ||
        (userMetadata.name as string) ||
        null;
      setKakaoName(name);

      const userData = await upsertUser({
        id: userId,
        user_metadata: userMetadata,
      });
      setUser(userData);
      addLog("로그인 성공");
      return true;
    },
    [upsertUser, addLog]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        // 1. URL 해시에서 OAuth 토큰 확인 (카카오 로그인 후 리다이렉트)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          addLog("URL에서 토큰 발견");
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          // URL 해시 제거
          window.history.replaceState(null, "", window.location.pathname);

          if (accessToken) {
            // localStorage에 토큰 저장
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            if (refreshToken) {
              localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            }

            const success = await loginFromToken(accessToken);
            if (success) {
              setIsLoading(false);
              return;
            }
          }
        }

        // 2. localStorage에서 저장된 토큰 확인
        const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (storedToken) {
          addLog("저장된 토큰 발견");
          const success = await loginFromToken(storedToken);
          if (success) {
            setIsLoading(false);
            return;
          }
          // 실패 시 (만료 등) 토큰 제거
          addLog("저장된 토큰 무효 - 제거");
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        }

        // 3. 세션 없음
        addLog("세션 없음 - 로그인 필요");
        setUser(null);
        setIsLoading(false);
      } catch (err) {
        addLog(`초기화 실패: ${err}`);
        setUser(null);
        setIsLoading(false);
      }
    };

    init();
  }, [loginFromToken, addLog]);

  const signInWithKakao = useCallback(async () => {
    const supabaseUrl = "https://xxhresiqpggsbkbrened.supabase.co";
    const redirectTo = encodeURIComponent(window.location.origin);
    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=kakao&redirect_to=${redirectTo}`;
    window.location.href = authUrl;
  }, []);

  const signOut = useCallback(async () => {
    // 커스텀 토큰 제거
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    // Supabase 토큰도 제거
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-")) localStorage.removeItem(key);
    });
    setUser(null);
    setKakaoName(null);
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
