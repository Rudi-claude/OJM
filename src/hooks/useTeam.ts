"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Team, TeamMember } from "@/types";
import { getCurrentTeam, setCurrentTeam, removeCurrentTeam } from "@/lib/storage";

// 모호하지 않은 문자 (I/O/0/1 제외)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateTeamCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function useTeam() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (teamId?: string) => {
    const id = teamId || team?.id;
    if (!id) return;

    const { data, error: fetchError } = await supabase
      .from("team_members")
      .select("id, team_id, user_id, joined_at, users(nickname)")
      .eq("team_id", id)
      .order("joined_at", { ascending: true });

    if (fetchError) {
      console.error("멤버 조회 실패:", fetchError);
      return;
    }

    if (data) {
      const mapped: TeamMember[] = data.map((m: any) => ({
        id: m.id,
        teamId: m.team_id,
        userId: m.user_id,
        nickname: m.users?.nickname || null,
        joinedAt: m.joined_at,
      }));
      setMembers(mapped);
    }
  }, [team?.id]);

  const createTeam = useCallback(
    async (name: string, userId: string): Promise<Team | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const code = generateTeamCode();

        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .insert({ name, code, created_by: userId })
          .select("id, name, code, created_by, created_at")
          .single();

        if (teamError) throw teamError;
        if (!teamData) throw new Error("팀 생성 실패");

        // 자동 가입
        const { error: memberError } = await supabase
          .from("team_members")
          .insert({ team_id: teamData.id, user_id: userId });

        if (memberError) throw memberError;

        const newTeam: Team = {
          id: teamData.id,
          name: teamData.name,
          code: teamData.code,
          createdBy: teamData.created_by,
          createdAt: teamData.created_at,
        };

        setTeam(newTeam);
        setCurrentTeam({ id: newTeam.id, name: newTeam.name, code: newTeam.code });
        await fetchMembers(newTeam.id);
        return newTeam;
      } catch (err) {
        console.error("팀 생성 실패:", err);
        setError("팀 생성에 실패했어요. 다시 시도해주세요.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchMembers]
  );

  const joinTeam = useCallback(
    async (code: string, userId: string): Promise<Team | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const upperCode = code.toUpperCase().trim();

        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("id, name, code, created_by, created_at")
          .eq("code", upperCode)
          .single();

        if (teamError || !teamData) {
          setError("팀 코드를 찾을 수 없어요. 다시 확인해주세요.");
          return null;
        }

        // 이미 멤버인지 확인
        const { data: existing } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", teamData.id)
          .eq("user_id", userId)
          .single();

        if (!existing) {
          const { error: memberError } = await supabase
            .from("team_members")
            .insert({ team_id: teamData.id, user_id: userId });

          if (memberError) throw memberError;
        }

        const joinedTeam: Team = {
          id: teamData.id,
          name: teamData.name,
          code: teamData.code,
          createdBy: teamData.created_by,
          createdAt: teamData.created_at,
        };

        setTeam(joinedTeam);
        setCurrentTeam({ id: joinedTeam.id, name: joinedTeam.name, code: joinedTeam.code });
        await fetchMembers(joinedTeam.id);
        return joinedTeam;
      } catch (err) {
        console.error("팀 참여 실패:", err);
        setError("팀 참여에 실패했어요. 다시 시도해주세요.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchMembers]
  );

  const leaveTeam = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!team) return false;
      setIsLoading(true);
      try {
        const { error: deleteError } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", team.id)
          .eq("user_id", userId);

        if (deleteError) throw deleteError;

        setTeam(null);
        setMembers([]);
        removeCurrentTeam();
        return true;
      } catch (err) {
        console.error("팀 나가기 실패:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [team]
  );

  const refreshTeam = useCallback(
    async (userId: string) => {
      setIsLoading(true);
      try {
        const stored = getCurrentTeam();
        if (!stored) {
          setTeam(null);
          setMembers([]);
          setIsLoading(false);
          return;
        }

        // DB에서 멤버십 검증
        const { data: membership } = await supabase
          .from("team_members")
          .select("id, teams(id, name, code, created_by, created_at)")
          .eq("team_id", stored.id)
          .eq("user_id", userId)
          .single();

        if (!membership || !(membership as any).teams) {
          removeCurrentTeam();
          setTeam(null);
          setMembers([]);
          setIsLoading(false);
          return;
        }

        const t = (membership as any).teams;
        const verified: Team = {
          id: t.id,
          name: t.name,
          code: t.code,
          createdBy: t.created_by,
          createdAt: t.created_at,
        };

        setTeam(verified);
        setCurrentTeam({ id: verified.id, name: verified.name, code: verified.code });
        await fetchMembers(verified.id);
      } catch (err) {
        console.error("팀 정보 갱신 실패:", err);
        removeCurrentTeam();
        setTeam(null);
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchMembers]
  );

  return {
    team,
    members,
    isLoading,
    error,
    createTeam,
    joinTeam,
    leaveTeam,
    fetchMembers,
    refreshTeam,
  };
}
