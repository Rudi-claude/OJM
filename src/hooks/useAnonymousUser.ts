"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getAnonymousId,
  setAnonymousId,
  generateAnonymousId,
} from "@/lib/storage";

interface AnonymousUser {
  id: string;
  anonymousId: string;
}

interface UseAnonymousUserReturn {
  user: AnonymousUser | null;
  isLoading: boolean;
  error: string | null;
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
        .select("id, anonymous_id")
        .eq("anonymous_id", anonymousId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingUser) {
        setUser({
          id: existingUser.id,
          anonymousId: existingUser.anonymous_id,
        });
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ anonymous_id: anonymousId })
          .select("id, anonymous_id")
          .single();

        if (insertError) throw insertError;

        if (newUser) {
          setUser({
            id: newUser.id,
            anonymousId: newUser.anonymous_id,
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
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  return { user, isLoading, error };
}
