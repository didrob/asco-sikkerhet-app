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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          company: string | null
          email: string
          full_name: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requested_at: string
          status: string
        }
        Insert: {
          company?: string | null
          email: string
          full_name?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_at?: string
          status?: string
        }
        Update: {
          company?: string | null
          email?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_at?: string
          status?: string
        }
        Relationships: []
      }
      ai_access: {
        Row: {
          enabled: boolean | null
          features: string[] | null
          granted_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          enabled?: boolean | null
          features?: string[] | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          enabled?: boolean | null
          features?: string[] | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      procedure_attachments: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          procedure_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          procedure_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          procedure_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_attachments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_comments: {
        Row: {
          block_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          procedure_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          block_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          procedure_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          block_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          procedure_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "procedure_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_comments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_completions: {
        Row: {
          completed_at: string
          expires_at: string | null
          id: string
          procedure_id: string
          signature_storage_path: string | null
          signature_text: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          expires_at?: string | null
          id?: string
          procedure_id: string
          signature_storage_path?: string | null
          signature_text?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          expires_at?: string | null
          id?: string
          procedure_id?: string
          signature_storage_path?: string | null
          signature_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_completions_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_progress: {
        Row: {
          checkpoint_answers: Json | null
          current_block_index: number
          id: string
          last_activity_at: string
          procedure_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          checkpoint_answers?: Json | null
          current_block_index?: number
          id?: string
          last_activity_at?: string
          procedure_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          checkpoint_answers?: Json | null
          current_block_index?: number
          id?: string
          last_activity_at?: string
          procedure_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_progress_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_revisions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          content_snapshot: Json
          created_at: string | null
          id: string
          procedure_id: string
          version: string
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          content_snapshot: Json
          created_at?: string | null
          id?: string
          procedure_id: string
          version: string
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          content_snapshot?: Json
          created_at?: string | null
          id?: string
          procedure_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_revisions_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_views: {
        Row: {
          completed_read: boolean | null
          duration_seconds: number | null
          id: string
          procedure_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          completed_read?: boolean | null
          duration_seconds?: number | null
          id?: string
          procedure_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          completed_read?: boolean | null
          duration_seconds?: number | null
          id?: string
          procedure_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_views_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string | null
          category: string | null
          content_blocks: Json
          created_at: string
          created_by: string | null
          description: string | null
          document_number: string | null
          due_date: string | null
          id: string
          recurrence_interval: unknown
          required_for_roles: string[] | null
          review_date: string | null
          site_id: string
          status: Database["public"]["Enums"]["procedure_status"]
          tags: string[] | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          category?: string | null
          content_blocks?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_number?: string | null
          due_date?: string | null
          id?: string
          recurrence_interval?: unknown
          required_for_roles?: string[] | null
          review_date?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["procedure_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          category?: string | null
          content_blocks?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_number?: string | null
          due_date?: string | null
          id?: string
          recurrence_interval?: unknown
          required_for_roles?: string[] | null
          review_date?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["procedure_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedures_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_site_id: string | null
          department: string | null
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_site_id?: string | null
          department?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_site_id?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_site_id_fkey"
            columns: ["current_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempted_at: string
          id: string
          is_correct: boolean
          procedure_id: string
          question_id: string
          selected_answer: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          is_correct: boolean
          procedure_id: string
          question_id: string
          selected_answer: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          is_correct?: boolean
          procedure_id?: string
          question_id?: string
          selected_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          location: string | null
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      training_assignments: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          due_date: string | null
          group_id: string | null
          id: string
          passed: boolean | null
          score: number | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          passed?: boolean | null
          score?: number | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          passed?: boolean | null
          score?: number | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "training_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          content_blocks: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          pass_threshold: number | null
          procedure_ids: string[]
          required_for_roles: string[] | null
          site_id: string
          status: Database["public"]["Enums"]["procedure_status"] | null
          title: string
          training_type: Database["public"]["Enums"]["training_type"] | null
          updated_at: string | null
        }
        Insert: {
          content_blocks?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          pass_threshold?: number | null
          procedure_ids?: string[]
          required_for_roles?: string[] | null
          site_id: string
          status?: Database["public"]["Enums"]["procedure_status"] | null
          title: string
          training_type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string | null
        }
        Update: {
          content_blocks?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          pass_threshold?: number | null
          procedure_ids?: string[]
          required_for_roles?: string[] | null
          site_id?: string
          status?: Database["public"]["Enums"]["procedure_status"] | null
          title?: string
          training_type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      training_group_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "training_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      training_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          site_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          site_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_groups_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      training_progress: {
        Row: {
          answers: Json | null
          assignment_id: string
          current_block_index: number | null
          id: string
          last_activity_at: string | null
          started_at: string | null
        }
        Insert: {
          answers?: Json | null
          assignment_id: string
          current_block_index?: number | null
          id?: string
          last_activity_at?: string | null
          started_at?: string | null
        }
        Update: {
          answers?: Json | null
          assignment_id?: string
          current_block_index?: number | null
          id?: string
          last_activity_at?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "training_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_reminders: {
        Row: {
          assignment_id: string
          id: string
          reminder_type: string
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          assignment_id: string
          id?: string
          reminder_type?: string
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          assignment_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_reminders_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "training_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          activated_at: string | null
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_at: string
          invited_by: string | null
          site_id: string | null
          status: string
          temporary_password: string
        }
        Insert: {
          activated_at?: string | null
          email: string
          expires_at: string
          full_name?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          site_id?: string | null
          status?: string
          temporary_password: string
        }
        Update: {
          activated_at?: string | null
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          site_id?: string | null
          status?: string
          temporary_password?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_site_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          site_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          site_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_site_assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_procedures: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_sites: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _site_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      has_site_access: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "operator"
        | "supervisor"
        | "viewer"
        | "external_client"
        | "auditor"
      completion_status: "not_started" | "in_progress" | "completed" | "expired"
      procedure_status: "draft" | "published" | "archived"
      training_type: "theoretical" | "practical" | "video" | "mixed"
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
      app_role: [
        "admin",
        "operator",
        "supervisor",
        "viewer",
        "external_client",
        "auditor",
      ],
      completion_status: ["not_started", "in_progress", "completed", "expired"],
      procedure_status: ["draft", "published", "archived"],
      training_type: ["theoretical", "practical", "video", "mixed"],
    },
  },
} as const
