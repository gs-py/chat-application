export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          daily_message_limit: number;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          daily_message_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          daily_message_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      daily_message_counts: {
        Row: {
          user_id: string;
          date: string;
          count: number;
        };
        Insert: {
          user_id: string;
          date: string;
          count?: number;
        };
        Update: {
          user_id?: string;
          date?: string;
          count?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_or_create_1v1_conversation: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_or_create_1v1_conversation_with: {
        Args: { p_other_user_id: string };
        Returns: string;
      };
      list_profiles: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type DailyMessageCount = Database['public']['Tables']['daily_message_counts']['Row'];
