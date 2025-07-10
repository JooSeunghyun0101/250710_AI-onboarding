export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      department: {
        Row: {
          email: string
          id: number
          name: string
        }
        Insert: {
          email: string
          id?: number
          name: string
        }
        Update: {
          email?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      department2: {
        Row: {
          created_at: string | null
          id: number
          manager_email: string
          manager_name: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          manager_email: string
          manager_name: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          manager_email?: string
          manager_name?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_log: {
        Row: {
          email_type: string
          hire_id: string
          id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          email_type: string
          hire_id: string
          id?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          email_type?: string
          hire_id?: string
          id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_hire_id_fkey"
            columns: ["hire_id"]
            isOneToOne: false
            referencedRelation: "hire"
            referencedColumns: ["id"]
          },
        ]
      }
      hire: {
        Row: {
          contact: string | null
          created_at: string | null
          deleted_at: string | null
          department: string
          email: string | null
          id: string
          manager: string
          name: string
          probation_end: string | null
          start_date: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department: string
          email?: string | null
          id?: string
          manager: string
          name: string
          probation_end?: string | null
          start_date: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department?: string
          email?: string | null
          id?: string
          manager?: string
          name?: string
          probation_end?: string | null
          start_date?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      personal_info: {
        Row: {
          created_at: string | null
          health_date: string | null
          health_hospital: string | null
          hire_id: string
          id: string
          insurance_dependents: Json | null
          survey_good: string | null
          survey_pain: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          health_date?: string | null
          health_hospital?: string | null
          hire_id: string
          id?: string
          insurance_dependents?: Json | null
          survey_good?: string | null
          survey_pain?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          health_date?: string | null
          health_hospital?: string | null
          hire_id?: string
          id?: string
          insurance_dependents?: Json | null
          survey_good?: string | null
          survey_pain?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_info_hire_id_fkey"
            columns: ["hire_id"]
            isOneToOne: true
            referencedRelation: "hire"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role: {
        Row: {
          description: string | null
          role_id: number
        }
        Insert: {
          description?: string | null
          role_id?: number
        }
        Update: {
          description?: string | null
          role_id?: number
        }
        Relationships: []
      }
      webhook_event: {
        Row: {
          created_at: string | null
          endpoint: string
          hire_id: string
          id: string
          payload: Json
          response_status: number | null
          retries: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          hire_id: string
          id?: string
          payload: Json
          response_status?: number | null
          retries?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          hire_id?: string
          id?: string
          payload?: Json
          response_status?: number | null
          retries?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_event_hire_id_fkey"
            columns: ["hire_id"]
            isOneToOne: false
            referencedRelation: "hire"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const 