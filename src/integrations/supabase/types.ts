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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_gigs: {
        Row: {
          agent_id: string
          category: string
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          rejection_reason: string | null
          slug: string
          status: Database["public"]["Enums"]["gig_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          category: string
          cover_image_url?: string | null
          created_at?: string
          description: string
          id?: string
          rejection_reason?: string | null
          slug: string
          status?: Database["public"]["Enums"]["gig_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          rejection_reason?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["gig_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_wallets: {
        Row: {
          agent_id: string
          available_balance: number
          lifetime_earnings: number
          pending_balance: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          available_balance?: number
          lifetime_earnings?: number
          pending_balance?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          available_balance?: number
          lifetime_earnings?: number
          pending_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          id_proof_url: string | null
          phone: string
          pincode: string
          rating: number
          service_areas: string[]
          service_ids: string[]
          total_jobs: number
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          id_proof_url?: string | null
          phone: string
          pincode: string
          rating?: number
          service_areas?: string[]
          service_ids?: string[]
          total_jobs?: number
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_proof_url?: string | null
          phone?: string
          pincode?: string
          rating?: number
          service_areas?: string[]
          service_ids?: string[]
          total_jobs?: number
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          agent_id: string | null
          created_at: string
          customer_id: string
          gig_id: string | null
          id: string
          notes: string | null
          package_tier: Database["public"]["Enums"]["gig_tier"] | null
          payment_status: Database["public"]["Enums"]["payment_status_t"]
          pincode: string
          price: number
          request_id: string | null
          scheduled_at: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id: string
          gig_id?: string | null
          id?: string
          notes?: string | null
          package_tier?: Database["public"]["Enums"]["gig_tier"] | null
          payment_status?: Database["public"]["Enums"]["payment_status_t"]
          pincode: string
          price?: number
          request_id?: string | null
          scheduled_at?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id?: string
          gig_id?: string | null
          id?: string
          notes?: string | null
          package_tier?: Database["public"]["Enums"]["gig_tier"] | null
          payment_status?: Database["public"]["Enums"]["payment_status_t"]
          pincode?: string
          price?: number
          request_id?: string | null
          scheduled_at?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "agent_gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_packages: {
        Row: {
          created_at: string
          delivery_days: number
          description: string
          gig_id: string
          id: string
          price: number
          revisions: number
          tier: Database["public"]["Enums"]["gig_tier"]
          title: string
        }
        Insert: {
          created_at?: string
          delivery_days?: number
          description: string
          gig_id: string
          id?: string
          price: number
          revisions?: number
          tier: Database["public"]["Enums"]["gig_tier"]
          title: string
        }
        Update: {
          created_at?: string
          delivery_days?: number
          description?: string
          gig_id?: string
          id?: string
          price?: number
          revisions?: number
          tier?: Database["public"]["Enums"]["gig_tier"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_packages_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "agent_gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          agent_amount: number
          amount: number
          booking_id: string
          commission: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method_t"]
          status: Database["public"]["Enums"]["payment_record_status"]
          stripe_session_id: string | null
          updated_at: string
          upi_screenshot_url: string | null
          upi_utr: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          agent_amount?: number
          amount: number
          booking_id: string
          commission?: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method_t"]
          status?: Database["public"]["Enums"]["payment_record_status"]
          stripe_session_id?: string | null
          updated_at?: string
          upi_screenshot_url?: string | null
          upi_utr?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          agent_amount?: number
          amount?: number
          booking_id?: string
          commission?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method_t"]
          status?: Database["public"]["Enums"]["payment_record_status"]
          stripe_session_id?: string | null
          updated_at?: string
          upi_screenshot_url?: string | null
          upi_utr?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          commission_pct: number
          id: number
          min_withdrawal: number
          updated_at: string
          upi_id: string | null
          upi_payee_name: string | null
          upi_qr_url: string | null
        }
        Insert: {
          commission_pct?: number
          id?: number
          min_withdrawal?: number
          updated_at?: string
          upi_id?: string | null
          upi_payee_name?: string | null
          upi_qr_url?: string | null
        }
        Update: {
          commission_pct?: number
          id?: number
          min_withdrawal?: number
          updated_at?: string
          upi_id?: string | null
          upi_payee_name?: string | null
          upi_qr_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          pincode: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          pincode?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          pincode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      request_proposals: {
        Row: {
          agent_id: string
          created_at: string
          delivery_days: number
          id: string
          message: string | null
          quote_price: number
          request_id: string
          status: Database["public"]["Enums"]["proposal_status"]
        }
        Insert: {
          agent_id: string
          created_at?: string
          delivery_days?: number
          id?: string
          message?: string | null
          quote_price: number
          request_id: string
          status?: Database["public"]["Enums"]["proposal_status"]
        }
        Update: {
          agent_id?: string
          created_at?: string
          delivery_days?: number
          id?: string
          message?: string | null
          quote_price?: number
          request_id?: string
          status?: Database["public"]["Enums"]["proposal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          agent_id: string
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
        }
        Insert: {
          agent_id: string
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
        }
        Update: {
          agent_id?: string
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string
          created_at: string
          customer_id: string
          deadline: string | null
          description: string
          id: string
          pincode: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category: string
          created_at?: string
          customer_id: string
          deadline?: string | null
          description: string
          id?: string
          pincode?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          created_at?: string
          customer_id?: string
          deadline?: string | null
          description?: string
          id?: string
          pincode?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          ai_generated: boolean
          base_price: number
          category: string
          created_at: string
          description: string
          eta_minutes: number
          icon: string | null
          id: string
          required_documents: Json
          slug: string
          title: string
        }
        Insert: {
          active?: boolean
          ai_generated?: boolean
          base_price?: number
          category: string
          created_at?: string
          description: string
          eta_minutes?: number
          icon?: string | null
          id?: string
          required_documents?: Json
          slug: string
          title: string
        }
        Update: {
          active?: boolean
          ai_generated?: boolean
          base_price?: number
          category?: string
          created_at?: string
          description?: string
          eta_minutes?: number
          icon?: string | null
          id?: string
          required_documents?: Json
          slug?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          agent_id: string
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          note: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          withdrawal_id: string | null
        }
        Insert: {
          agent_id: string
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          withdrawal_id?: string | null
        }
        Update: {
          agent_id?: string
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          withdrawal_id?: string | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          agent_id: string
          amount: number
          bank_account: string | null
          created_at: string
          id: string
          ifsc: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          admin_note?: string | null
          agent_id: string
          amount: number
          bank_account?: string | null
          created_at?: string
          id?: string
          ifsc?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          admin_note?: string | null
          agent_id?: string
          amount?: number
          bank_account?: string | null
          created_at?: string
          id?: string
          ifsc?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "agent" | "admin"
      booking_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      gig_status: "draft" | "pending" | "approved" | "rejected" | "paused"
      gig_tier: "basic" | "standard" | "premium"
      payment_method_t: "stripe" | "upi_manual"
      payment_record_status: "pending" | "paid" | "failed" | "refunded"
      payment_status_t: "unpaid" | "paid" | "refunded"
      proposal_status: "pending" | "accepted" | "rejected" | "withdrawn"
      request_status: "open" | "assigned" | "completed" | "cancelled"
      wallet_tx_type:
        | "credit_booking"
        | "release_to_available"
        | "debit_withdrawal"
        | "adjustment"
      withdrawal_status: "pending" | "approved" | "paid" | "rejected"
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
      app_role: ["customer", "agent", "admin"],
      booking_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      gig_status: ["draft", "pending", "approved", "rejected", "paused"],
      gig_tier: ["basic", "standard", "premium"],
      payment_method_t: ["stripe", "upi_manual"],
      payment_record_status: ["pending", "paid", "failed", "refunded"],
      payment_status_t: ["unpaid", "paid", "refunded"],
      proposal_status: ["pending", "accepted", "rejected", "withdrawn"],
      request_status: ["open", "assigned", "completed", "cancelled"],
      wallet_tx_type: [
        "credit_booking",
        "release_to_available",
        "debit_withdrawal",
        "adjustment",
      ],
      withdrawal_status: ["pending", "approved", "paid", "rejected"],
    },
  },
} as const
