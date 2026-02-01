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
          created_at: string;
        };
        Insert: {
          id?: string;
          anonymous_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          anonymous_id?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
