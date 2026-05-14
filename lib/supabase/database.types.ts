// Auto-generated from supabase/migrations/0001_initial_schema.sql
// Run: npx supabase gen types typescript --project-id $PROJECT_ID > lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "mentor" | "mentee" | "admin";

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "session_completed"
  | "cancelled_by_mentor"
  | "cancelled_by_mentee"
  | "cancelled_late"
  | "archived";

export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "refunded"
  | "partially_refunded"
  | "failed";

export type SessionTypeKey =
  | "cna"
  | "provas"
  | "ordem"
  | "curso"
  | "equiv"
  | "tutor"
  | "vida"
  | "intl";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          photo_url: string | null;
          role: UserRole;
          terms_accepted_at: string | null;
          tos_version: string | null;
          gdpr_consent_at: string | null;
          age_confirmed: boolean;
          email_verified: boolean;
          institutional_email: string | null;
          institutional_verified: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          role: UserRole;
          terms_accepted_at?: string | null;
          tos_version?: string | null;
          gdpr_consent_at?: string | null;
          age_confirmed?: boolean;
          email_verified?: boolean;
          institutional_email?: string | null;
          institutional_verified?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          role?: UserRole;
          terms_accepted_at?: string | null;
          tos_version?: string | null;
          gdpr_consent_at?: string | null;
          age_confirmed?: boolean;
          email_verified?: boolean;
          institutional_email?: string | null;
          institutional_verified?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      mentor_profiles: {
        Row: {
          id: string;
          user_id: string;
          slug: string | null;
          bio: string | null;
          university: string | null;
          faculty: string | null;
          course: string | null;
          year: number | null;
          languages: string[];
          photo_url: string | null;
          is_active: boolean;
          stripe_account_id: string | null;
          stripe_payouts_enabled: boolean;
          cal_user_id: string | null;
          cal_event_type_id: string | null;
          avg_rating: number;
          session_count: number;
          bayesian_score: number;
          onboarding_step: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug?: string | null;
          bio?: string | null;
          university?: string | null;
          faculty?: string | null;
          course?: string | null;
          year?: number | null;
          languages?: string[];
          photo_url?: string | null;
          is_active?: boolean;
          stripe_account_id?: string | null;
          stripe_payouts_enabled?: boolean;
          cal_user_id?: string | null;
          cal_event_type_id?: string | null;
          avg_rating?: number;
          session_count?: number;
          bayesian_score?: number;
          onboarding_step?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string | null;
          bio?: string | null;
          university?: string | null;
          faculty?: string | null;
          course?: string | null;
          year?: number | null;
          languages?: string[];
          photo_url?: string | null;
          is_active?: boolean;
          stripe_account_id?: string | null;
          stripe_payouts_enabled?: boolean;
          cal_user_id?: string | null;
          cal_event_type_id?: string | null;
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      session_types: {
        Row: {
          id: string;
          mentor_profile_id: string;
          type_key: SessionTypeKey;
          is_enabled: boolean;
          description: string | null;
          price_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mentor_profile_id: string;
          type_key: SessionTypeKey;
          is_enabled?: boolean;
          description?: string | null;
          price_cents: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mentor_profile_id?: string;
          type_key?: SessionTypeKey;
          is_enabled?: boolean;
          description?: string | null;
          price_cents?: number;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          mentee_id: string;
          mentor_id: string;
          mentor_profile_id: string;
          session_type_id: string;
          cal_booking_uid: string | null;
          daily_room_url: string | null;
          status: BookingStatus;
          scheduled_at: string;
          duration_minutes: number;
          price_cents: number;
          mentee_context: string | null;
          current_situation: string | null;
          outcome_report_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mentee_id: string;
          mentor_id: string;
          mentor_profile_id: string;
          session_type_id: string;
          cal_booking_uid?: string | null;
          daily_room_url?: string | null;
          status?: BookingStatus;
          scheduled_at: string;
          duration_minutes?: number;
          price_cents: number;
          mentee_context?: string | null;
          current_situation?: string | null;
          outcome_report_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mentee_id?: string;
          mentor_id?: string;
          mentor_profile_id?: string;
          session_type_id?: string;
          cal_booking_uid?: string | null;
          daily_room_url?: string | null;
          status?: BookingStatus;
          scheduled_at?: string;
          duration_minutes?: number;
          price_cents?: number;
          mentee_context?: string | null;
          current_situation?: string | null;
          outcome_report_id?: string | null;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          mentee_id: string;
          mentor_profile_id: string;
          rating: number;
          body: string | null;
          reviewer_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          mentee_id: string;
          mentor_profile_id: string;
          rating: number;
          body?: string | null;
          reviewer_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rating?: number;
          body?: string | null;
          reviewer_type?: string | null;
          updated_at?: string;
        };
      };
      outcome_reports: {
        Row: {
          id: string;
          booking_id: string;
          mentor_id: string;
          summary: string;
          next_steps: string | null;
          resources: Json;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          mentor_id: string;
          summary: string;
          next_steps?: string | null;
          resources?: Json;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          summary?: string;
          next_steps?: string | null;
          resources?: Json;
          sent_at?: string | null;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          stripe_payment_intent_id: string;
          stripe_charge_id: string | null;
          amount_total_cents: number;
          amount_fee_cents: number;
          amount_mentor_cents: number;
          currency: string;
          status: PaymentStatus;
          refunded_at: string | null;
          payment_released_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          stripe_payment_intent_id: string;
          stripe_charge_id?: string | null;
          amount_total_cents: number;
          amount_fee_cents: number;
          amount_mentor_cents: number;
          currency?: string;
          status?: PaymentStatus;
          refunded_at?: string | null;
          payment_released_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stripe_charge_id?: string | null;
          status?: PaymentStatus;
          refunded_at?: string | null;
          payment_released_at?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          read_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      session_type_key: SessionTypeKey;
    };
  };
}

// Convenience row types
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type MentorProfileRow =
  Database["public"]["Tables"]["mentor_profiles"]["Row"];
export type SessionTypeRow =
  Database["public"]["Tables"]["session_types"]["Row"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
export type OutcomeReportRow =
  Database["public"]["Tables"]["outcome_reports"]["Row"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];
