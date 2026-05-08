export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type FranchiseCategory = "game" | "anime" | "vtuber" | "idol" | "other";
type EventType =
  | "goods_release"
  | "preorder"
  | "cafe"
  | "popup"
  | "concert"
  | "broadcast"
  | "birthday"
  | "other";
type CrawlSourceType = "naver_lounge" | "dc" | "official";
type SuggestionStatus = "pending" | "accepted" | "ignored";
type ReminderStatus = "pending" | "sent" | "dismissed";
type CrawlRunStatus = "success" | "partial" | "failed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      franchises: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: FranchiseCategory;
          color_code: string;
          icon_url: string | null;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category: FranchiseCategory;
          color_code?: string;
          icon_url?: string | null;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          category?: FranchiseCategory;
          color_code?: string;
          icon_url?: string | null;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_franchises: {
        Row: {
          id: string;
          user_id: string;
          franchise_id: string;
          priority: number;
          nickname: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          franchise_id: string;
          priority?: number;
          nickname?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          franchise_id?: string;
          priority?: number;
          nickname?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          franchise_id: string;
          type: EventType;
          title: string;
          start_date: string;
          end_date: string | null;
          location: string | null;
          source_url: string | null;
          is_verified: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          franchise_id: string;
          type: EventType;
          title: string;
          start_date: string;
          end_date?: string | null;
          location?: string | null;
          source_url?: string | null;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          franchise_id?: string;
          type?: EventType;
          title?: string;
          start_date?: string;
          end_date?: string | null;
          location?: string | null;
          source_url?: string | null;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_events: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          remind_days: number[];
          is_attending: boolean;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          remind_days?: number[];
          is_attending?: boolean;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          event_id?: string;
          remind_days?: number[];
          is_attending?: boolean;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          franchise_id: string | null;
          item_name: string;
          price: number;
          is_wishlist: boolean;
          bought_at: string | null;
          image_url: string | null;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id?: string | null;
          franchise_id?: string | null;
          item_name: string;
          price?: number;
          is_wishlist?: boolean;
          bought_at?: string | null;
          image_url?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          event_id?: string | null;
          franchise_id?: string | null;
          item_name?: string;
          price?: number;
          is_wishlist?: boolean;
          bought_at?: string | null;
          image_url?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      crawl_sources: {
        Row: {
          id: string;
          franchise_id: string | null;
          source_type: CrawlSourceType;
          name: string;
          url: string;
          keywords: string[];
          is_active: boolean;
          last_crawled_at: string | null;
          last_error: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          franchise_id?: string | null;
          source_type: CrawlSourceType;
          name: string;
          url: string;
          keywords?: string[];
          is_active?: boolean;
          last_crawled_at?: string | null;
          last_error?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          franchise_id?: string | null;
          source_type?: CrawlSourceType;
          name?: string;
          url?: string;
          keywords?: string[];
          is_active?: boolean;
          last_crawled_at?: string | null;
          last_error?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      crawled_posts: {
        Row: {
          id: string;
          franchise_id: string | null;
          crawl_source_id: string | null;
          source: CrawlSourceType;
          title: string;
          content: string;
          original_url: string;
          content_hash: string | null;
          event_id: string | null;
          crawled_at: string;
        };
        Insert: {
          id?: string;
          franchise_id?: string | null;
          crawl_source_id?: string | null;
          source: CrawlSourceType;
          title: string;
          content: string;
          original_url: string;
          content_hash?: string | null;
          event_id?: string | null;
          crawled_at?: string;
        };
        Update: {
          franchise_id?: string | null;
          crawl_source_id?: string | null;
          source?: CrawlSourceType;
          title?: string;
          content?: string;
          original_url?: string;
          content_hash?: string | null;
          event_id?: string | null;
          crawled_at?: string;
        };
        Relationships: [];
      };
      event_suggestions: {
        Row: {
          id: string;
          crawled_post_id: string;
          franchise_id: string | null;
          title: string;
          event_type: EventType;
          start_date: string;
          end_date: string | null;
          location: string | null;
          source_url: string;
          confidence: number;
          warnings: string[];
          status: SuggestionStatus;
          raw_ai: Json | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          crawled_post_id: string;
          franchise_id?: string | null;
          title: string;
          event_type: EventType;
          start_date: string;
          end_date?: string | null;
          location?: string | null;
          source_url: string;
          confidence?: number;
          warnings?: string[];
          status?: SuggestionStatus;
          raw_ai?: Json | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          crawled_post_id?: string;
          franchise_id?: string | null;
          title?: string;
          event_type?: EventType;
          start_date?: string;
          end_date?: string | null;
          location?: string | null;
          source_url?: string;
          confidence?: number;
          warnings?: string[];
          status?: SuggestionStatus;
          raw_ai?: Json | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          remind_at: string;
          status: ReminderStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          remind_at: string;
          status?: ReminderStatus;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          event_id?: string;
          remind_at?: string;
          status?: ReminderStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      crawl_runs: {
        Row: {
          id: string;
          source_id: string | null;
          status: CrawlRunStatus;
          posts_found: number;
          suggestions_created: number;
          error: string | null;
          started_at: string;
          finished_at: string;
        };
        Insert: {
          id?: string;
          source_id?: string | null;
          status: CrawlRunStatus;
          posts_found?: number;
          suggestions_created?: number;
          error?: string | null;
          started_at?: string;
          finished_at?: string;
        };
        Update: {
          source_id?: string | null;
          status?: CrawlRunStatus;
          posts_found?: number;
          suggestions_created?: number;
          error?: string | null;
          started_at?: string;
          finished_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
