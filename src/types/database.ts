export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          anonymous_id: string;
          nickname: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          anonymous_id: string;
          nickname?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          anonymous_id?: string;
          nickname?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          restaurant_name: string;
          category: string;
          ate_at: string;
          weather: string | null;
          mood: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id: string;
          restaurant_name: string;
          category: string;
          ate_at?: string;
          weather?: string | null;
          mood?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          restaurant_id?: string;
          restaurant_name?: string;
          category?: string;
          ate_at?: string;
          weather?: string | null;
          mood?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meal_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      team_roulettes: {
        Row: {
          id: string;
          team_id: string;
          started_by: string | null;
          restaurant_id: string | null;
          restaurant_name: string | null;
          restaurant_category: string | null;
          restaurant_address: string | null;
          restaurant_distance: number | null;
          restaurant_place_url: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          started_by?: string | null;
          restaurant_id?: string | null;
          restaurant_name?: string | null;
          restaurant_category?: string | null;
          restaurant_address?: string | null;
          restaurant_distance?: number | null;
          restaurant_place_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          started_by?: string | null;
          restaurant_id?: string | null;
          restaurant_name?: string | null;
          restaurant_category?: string | null;
          restaurant_address?: string | null;
          restaurant_distance?: number | null;
          restaurant_place_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_roulettes_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_roulettes_started_by_fkey";
            columns: ["started_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      team_votes: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          created_by: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          created_by?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          created_by?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_votes_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_votes_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      team_vote_options: {
        Row: {
          id: string;
          vote_id: string;
          restaurant_id: string;
          restaurant_name: string;
          restaurant_category: string | null;
          restaurant_address: string | null;
          restaurant_distance: number | null;
          restaurant_place_url: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          vote_id: string;
          restaurant_id: string;
          restaurant_name: string;
          restaurant_category?: string | null;
          restaurant_address?: string | null;
          restaurant_distance?: number | null;
          restaurant_place_url?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          vote_id?: string;
          restaurant_id?: string;
          restaurant_name?: string;
          restaurant_category?: string | null;
          restaurant_address?: string | null;
          restaurant_distance?: number | null;
          restaurant_place_url?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "team_vote_options_vote_id_fkey";
            columns: ["vote_id"];
            referencedRelation: "team_votes";
            referencedColumns: ["id"];
          }
        ];
      };
      team_vote_picks: {
        Row: {
          id: string;
          vote_id: string;
          option_id: string;
          user_id: string;
          picked_at: string;
        };
        Insert: {
          id?: string;
          vote_id: string;
          option_id: string;
          user_id: string;
          picked_at?: string;
        };
        Update: {
          id?: string;
          vote_id?: string;
          option_id?: string;
          user_id?: string;
          picked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_vote_picks_vote_id_fkey";
            columns: ["vote_id"];
            referencedRelation: "team_votes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_vote_picks_option_id_fkey";
            columns: ["option_id"];
            referencedRelation: "team_vote_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_vote_picks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
