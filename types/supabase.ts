export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          zip_code: string | null
          display_name: string | null
          industry: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          zip_code?: string | null
          display_name?: string | null
          industry?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          zip_code?: string | null
          display_name?: string | null
          industry?: string | null
          created_at?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          id: string
          user_id: string
          type: string
          template_id: string | null
          config: Json
          position: number
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          template_id?: string | null
          config?: Json
          position?: number
          enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          template_id?: string | null
          config?: Json
          position?: number
          enabled?: boolean
          created_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          external_id: string
          headline: string
          summary: string | null
          image_url: string | null
          source_name: string | null
          source_url: string | null
          published_at: string | null
          urgency_score: number
          zone_type: string | null
          tags: Json
          created_at: string
        }
        Insert: {
          id?: string
          external_id: string
          headline: string
          summary?: string | null
          image_url?: string | null
          source_name?: string | null
          source_url?: string | null
          published_at?: string | null
          urgency_score?: number
          zone_type?: string | null
          tags?: Json
          created_at?: string
        }
        Update: {
          id?: string
          external_id?: string
          headline?: string
          summary?: string | null
          image_url?: string | null
          source_name?: string | null
          source_url?: string | null
          published_at?: string | null
          urgency_score?: number
          zone_type?: string | null
          tags?: Json
          created_at?: string
        }
        Relationships: []
      }
      user_saves: {
        Row: {
          id: string
          user_id: string
          article_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_tracks: {
        Row: {
          id: string
          user_id: string
          topic: string
          zone_id: string | null
          deadline_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          zone_id?: string | null
          deadline_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          zone_id?: string | null
          deadline_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      zone_quicklook: {
        Row: {
          id: string
          zone_type: string
          label: string
          value: string
          sub: string | null
          position: number
          updated_at: string
        }
        Insert: {
          id?: string
          zone_type: string
          label: string
          value: string
          sub?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          id?: string
          zone_type?: string
          label?: string
          value?: string
          sub?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
