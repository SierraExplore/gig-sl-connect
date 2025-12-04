export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null
          cover_letter: string | null
          gig_id: string
          id: string
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          applied_at?: string | null
          cover_letter?: string | null
          gig_id: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          applied_at?: string | null
          cover_letter?: string | null
          gig_id?: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_decision: string | null
          admin_id: string | null
          created_at: string | null
          evidence: string[] | null
          id: string
          initiator_id: string
          job_instance_id: string
          reason: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
          updated_at: string | null
        }
        Insert: {
          admin_decision?: string | null
          admin_id?: string | null
          created_at?: string | null
          evidence?: string[] | null
          id?: string
          initiator_id: string
          job_instance_id: string
          reason: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string | null
        }
        Update: {
          admin_decision?: string | null
          admin_id?: string | null
          created_at?: string | null
          evidence?: string[] | null
          id?: string
          initiator_id?: string
          job_instance_id?: string
          reason?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_job_instance_id_fkey"
            columns: ["job_instance_id"]
            isOneToOne: false
            referencedRelation: "job_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      employers: {
        Row: {
          created_at: string | null
          id: string
          org_name: string | null
          org_type: Database["public"]["Enums"]["org_type"] | null
          registration_docs: string[] | null
          updated_at: string | null
          user_id: string
          verification_level: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_name?: string | null
          org_type?: Database["public"]["Enums"]["org_type"] | null
          registration_docs?: string[] | null
          updated_at?: string | null
          user_id: string
          verification_level?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          org_name?: string | null
          org_type?: Database["public"]["Enums"]["org_type"] | null
          registration_docs?: string[] | null
          updated_at?: string | null
          user_id?: string
          verification_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      gigs: {
        Row: {
          attachments: string[] | null
          category_id: string | null
          city: string
          coords: Json | null
          created_at: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"] | null
          description: string | null
          duration_hours: number | null
          employer_id: string
          full_address: string | null
          gig_id: string
          id: string
          max_applicants: number | null
          pay_amount: number
          payment_method: string | null
          posted_at: string | null
          proof_required: Database["public"]["Enums"]["proof_type"] | null
          skill_requirements: string[] | null
          start_time: string | null
          status: Database["public"]["Enums"]["gig_status"] | null
          subcategory: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          category_id?: string | null
          city: string
          coords?: Json | null
          created_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          description?: string | null
          duration_hours?: number | null
          employer_id: string
          full_address?: string | null
          gig_id: string
          id?: string
          max_applicants?: number | null
          pay_amount: number
          payment_method?: string | null
          posted_at?: string | null
          proof_required?: Database["public"]["Enums"]["proof_type"] | null
          skill_requirements?: string[] | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["gig_status"] | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          category_id?: string | null
          city?: string
          coords?: Json | null
          created_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          description?: string | null
          duration_hours?: number | null
          employer_id?: string
          full_address?: string | null
          gig_id?: string
          id?: string
          max_applicants?: number | null
          pay_amount?: number
          payment_method?: string | null
          posted_at?: string | null
          proof_required?: Database["public"]["Enums"]["proof_type"] | null
          skill_requirements?: string[] | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["gig_status"] | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gigs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gig_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_instances: {
        Row: {
          created_at: string | null
          current_location: Json | null
          employer_confirmed_payment: boolean | null
          end_at: string | null
          gig_id: string
          id: string
          live_location_allowed: boolean | null
          qr_expires_at: string | null
          qr_token: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["job_instance_status"] | null
          updated_at: string | null
          verification_mode:
            | Database["public"]["Enums"]["verification_mode"]
            | null
          worker_confirmed_payment: boolean | null
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          current_location?: Json | null
          employer_confirmed_payment?: boolean | null
          end_at?: string | null
          gig_id: string
          id?: string
          live_location_allowed?: boolean | null
          qr_expires_at?: string | null
          qr_token?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["job_instance_status"] | null
          updated_at?: string | null
          verification_mode?:
            | Database["public"]["Enums"]["verification_mode"]
            | null
          worker_confirmed_payment?: boolean | null
          worker_id: string
        }
        Update: {
          created_at?: string | null
          current_location?: Json | null
          employer_confirmed_payment?: boolean | null
          end_at?: string | null
          gig_id?: string
          id?: string
          live_location_allowed?: boolean | null
          qr_expires_at?: string | null
          qr_token?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["job_instance_status"] | null
          updated_at?: string | null
          verification_mode?:
            | Database["public"]["Enums"]["verification_mode"]
            | null
          worker_confirmed_payment?: boolean | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_instances_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_instances_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          payload: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          payload?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          payload?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          coords: Json | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          nin_encrypted: string | null
          nin_image_url: string | null
          phone: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          selfie_url: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          coords?: Json | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          nin_encrypted?: string | null
          nin_image_url?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          selfie_url?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          address?: string | null
          city?: string | null
          coords?: Json | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          nin_encrypted?: string | null
          nin_image_url?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          selfie_url?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          id: string
          job_instance_id: string
          rated_id: string
          rater_id: string
          review: string | null
          score: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_instance_id: string
          rated_id: string
          rater_id: string
          review?: string | null
          score: number
        }
        Update: {
          created_at?: string | null
          id?: string
          job_instance_id?: string
          rated_id?: string
          rater_id?: string
          review?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_job_instance_id_fkey"
            columns: ["job_instance_id"]
            isOneToOne: false
            referencedRelation: "job_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          id: string
          level: string | null
          skill_id: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: string | null
          skill_id: string
          user_id: string
        }
        Update: {
          id?: string
          level?: string | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_logs: {
        Row: {
          actor_id: string
          created_at: string | null
          gps: Json | null
          id: string
          job_instance_id: string
          media_url: string | null
          metadata: Json | null
          qr_scanned: boolean | null
          type: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          gps?: Json | null
          id?: string
          job_instance_id: string
          media_url?: string | null
          metadata?: Json | null
          qr_scanned?: boolean | null
          type: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          gps?: Json | null
          id?: string
          job_instance_id?: string
          media_url?: string | null
          metadata?: Json | null
          qr_scanned?: boolean | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_job_instance_id_fkey"
            columns: ["job_instance_id"]
            isOneToOne: false
            referencedRelation: "job_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_action: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      delivery_type: "onsite" | "remote"
      dispute_status: "open" | "under_review" | "resolved" | "closed"
      gig_status:
        | "draft"
        | "posted"
        | "matched"
        | "in_progress"
        | "verification_pending"
        | "completed"
        | "disputed"
        | "cancelled"
      job_instance_status:
        | "scheduled"
        | "in_progress"
        | "verification_pending"
        | "completed"
        | "disputed"
        | "cancelled"
      org_type: "individual" | "sme" | "ngo" | "government"
      proof_type: "photo" | "qr" | "physical"
      user_role: "worker" | "employer" | "admin"
      verification_mode: "upload_proof" | "qr_confirmation"
      verification_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      application_status: ["pending", "accepted", "rejected", "withdrawn"],
      delivery_type: ["onsite", "remote"],
      dispute_status: ["open", "under_review", "resolved", "closed"],
      gig_status: [
        "draft",
        "posted",
        "matched",
        "in_progress",
        "verification_pending",
        "completed",
        "disputed",
        "cancelled",
      ],
      job_instance_status: [
        "scheduled",
        "in_progress",
        "verification_pending",
        "completed",
        "disputed",
        "cancelled",
      ],
      org_type: ["individual", "sme", "ngo", "government"],
      proof_type: ["photo", "qr", "physical"],
      user_role: ["worker", "employer", "admin"],
      verification_mode: ["upload_proof", "qr_confirmation"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
