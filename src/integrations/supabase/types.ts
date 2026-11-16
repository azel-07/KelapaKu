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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          city_regency: string
          created_at: string
          district: string
          id: string
          is_default: boolean
          notes: string | null
          phone: string
          postal_code: string | null
          province: string
          recipient_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          city_regency: string
          created_at?: string
          district: string
          id?: string
          is_default?: boolean
          notes?: string | null
          phone: string
          postal_code?: string | null
          province: string
          recipient_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city_regency?: string
          created_at?: string
          district?: string
          id?: string
          is_default?: boolean
          notes?: string | null
          phone?: string
          postal_code?: string | null
          province?: string
          recipient_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_type_snapshot: string
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          subtotal: number
          unit_price_snapshot: number
          unit_snapshot: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_type_snapshot?: string
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          subtotal: number
          unit_price_snapshot: number
          unit_snapshot: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_type_snapshot?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          subtotal?: number
          unit_price_snapshot?: number
          unit_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          admin_note: string | null
          created_at: string
          customer_email_snapshot: string | null
          customer_name_snapshot: string
          customer_note: string | null
          customer_phone_snapshot: string
          id: string
          idempotency_key: string | null
          order_number: string
          order_status: Database["public"]["Enums"]["order_status"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address_snapshot: Json
          shipping_cost: number
          shipping_method: string | null
          shipping_rate_id: string | null
          shipping_rate_snapshot: Json
          subtotal: number
          total_amount: number
          total_weight_gram: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_id?: string | null
          admin_note?: string | null
          created_at?: string
          customer_email_snapshot?: string | null
          customer_name_snapshot: string
          customer_note?: string | null
          customer_phone_snapshot: string
          id?: string
          idempotency_key?: string | null
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address_snapshot: Json
          shipping_cost?: number
          shipping_method?: string | null
          shipping_rate_id?: string | null
          shipping_rate_snapshot?: Json
          subtotal?: number
          total_amount?: number
          total_weight_gram?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_id?: string | null
          admin_note?: string | null
          created_at?: string
          customer_email_snapshot?: string | null
          customer_name_snapshot?: string
          customer_note?: string | null
          customer_phone_snapshot?: string
          id?: string
          idempotency_key?: string | null
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address_snapshot?: Json
          shipping_cost?: number
          shipping_method?: string | null
          shipping_rate_id?: string | null
          shipping_rate_snapshot?: Json
          subtotal?: number
          total_amount?: number
          total_weight_gram?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_rate_fk"
            columns: ["shipping_rate_id"]
            isOneToOne: false
            referencedRelation: "shipping_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          paid_at: string | null
          payment_reference: string | null
          proof_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id: string
          paid_at?: string | null
          payment_reference?: string | null
          proof_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          paid_at?: string | null
          payment_reference?: string | null
          proof_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_tiers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_quantity: number | null
          min_quantity: number
          product_id: string
          tier_name: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          min_quantity: number
          product_id: string
          tier_name?: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          min_quantity?: number
          product_id?: string
          tier_name?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          freshness_info: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          label: string | null
          min_retail_quantity: number
          name: string
          package_info: string | null
          retail_price: number
          slug: string
          stock_quantity: number
          storage_info: string | null
          unit: string
          updated_at: string
          weight_gram: number | null
          wholesale_min_quantity: number
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          freshness_info?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          label?: string | null
          min_retail_quantity?: number
          name: string
          package_info?: string | null
          retail_price?: number
          slug: string
          stock_quantity?: number
          storage_info?: string | null
          unit: string
          updated_at?: string
          weight_gram?: number | null
          wholesale_min_quantity?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          freshness_info?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          label?: string | null
          min_retail_quantity?: number
          name?: string
          package_info?: string | null
          retail_price?: number
          slug?: string
          stock_quantity?: number
          storage_info?: string | null
          unit?: string
          updated_at?: string
          weight_gram?: number | null
          wholesale_min_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_active: boolean
          account_type: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          account_active?: boolean
          account_type?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          account_active?: boolean
          account_type?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          created_at: string
          id: string
          offered_unit_price: number | null
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          quotation_id: string
          requested_unit_price: number | null
          unit_snapshot: string
        }
        Insert: {
          created_at?: string
          id?: string
          offered_unit_price?: number | null
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          quotation_id: string
          requested_unit_price?: number | null
          unit_snapshot: string
        }
        Update: {
          created_at?: string
          id?: string
          offered_unit_price?: number | null
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          quotation_id?: string
          requested_unit_price?: number | null
          unit_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          admin_quote_notes: string | null
          business_name: string | null
          business_type: string | null
          created_at: string
          delivery_schedule: string | null
          id: string
          quoted_total: number | null
          request_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          admin_quote_notes?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          delivery_schedule?: string | null
          id?: string
          quoted_total?: number | null
          request_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          admin_quote_notes?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          delivery_schedule?: string | null
          id?: string
          quoted_total?: number | null
          request_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          city_regency: string | null
          created_at: string
          flat_cost: number | null
          id: string
          is_active: boolean
          minimum_cost: number
          province: string
          rate_per_kg: number | null
          shipping_method: string
          updated_at: string
        }
        Insert: {
          city_regency?: string | null
          created_at?: string
          flat_cost?: number | null
          id?: string
          is_active?: boolean
          minimum_cost?: number
          province: string
          rate_per_kg?: number | null
          shipping_method: string
          updated_at?: string
        }
        Update: {
          city_regency?: string | null
          created_at?: string
          flat_cost?: number | null
          id?: string
          is_active?: boolean
          minimum_cost?: number
          province?: string
          rate_per_kg?: number | null
          shipping_method?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: number
          instagram: string | null
          maps_url: string | null
          operating_hours: string | null
          phone: string | null
          store_name: string
          tagline: string | null
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
          instagram?: string | null
          maps_url?: string | null
          operating_hours?: string | null
          phone?: string | null
          store_name?: string
          tagline?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
          instagram?: string | null
          maps_url?: string | null
          operating_hours?: string | null
          phone?: string | null
          store_name?: string
          tagline?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      wholesale_applications: {
        Row: {
          business_address: string
          business_name: string
          business_type: string
          created_at: string
          email: string
          estimated_purchase_quantity: string | null
          full_name: string
          id: string
          notes: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["wholesale_application_status"]
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          business_address: string
          business_name: string
          business_type: string
          created_at?: string
          email: string
          estimated_purchase_quantity?: string | null
          full_name: string
          id?: string
          notes?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["wholesale_application_status"]
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          business_address?: string
          business_name?: string
          business_type?: string
          created_at?: string
          email?: string
          estimated_purchase_quantity?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["wholesale_application_status"]
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wholesale_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_from_cart: {
        Args: { p_address_id: string; p_customer_note?: string }
        Returns: {
          address_id: string | null
          admin_note: string | null
          created_at: string
          customer_email_snapshot: string | null
          customer_name_snapshot: string
          customer_note: string | null
          customer_phone_snapshot: string
          id: string
          idempotency_key: string | null
          order_number: string
          order_status: Database["public"]["Enums"]["order_status"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address_snapshot: Json
          shipping_cost: number
          shipping_method: string | null
          shipping_rate_id: string | null
          shipping_rate_snapshot: Json
          subtotal: number
          total_amount: number
          total_weight_gram: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_order_from_cart_v2: {
        Args: {
          p_address_id: string
          p_customer_note?: string
          p_idempotency_key?: string
          p_shipping_method?: string
        }
        Returns: {
          address_id: string | null
          admin_note: string | null
          created_at: string
          customer_email_snapshot: string | null
          customer_name_snapshot: string
          customer_note: string | null
          customer_phone_snapshot: string
          id: string
          idempotency_key: string | null
          order_number: string
          order_status: Database["public"]["Enums"]["order_status"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address_snapshot: Json
          shipping_cost: number
          shipping_method: string | null
          shipping_rate_id: string | null
          shipping_rate_snapshot: Json
          subtotal: number
          total_amount: number
          total_weight_gram: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_approved_wholesale: { Args: never; Returns: boolean }
      submit_qris_gopay_proof: {
        Args: { p_order_id: string; p_proof_path: string }
        Returns: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          paid_at: string | null
          payment_reference: string | null
          proof_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      order_status:
        | "awaiting_payment"
        | "payment_confirmed"
        | "processing"
        | "ready_to_ship"
        | "shipped"
        | "completed"
        | "cancelled"
      payment_method: "bank_transfer" | "other" | "manual" | "qris_gopay"
      payment_status:
        | "unpaid"
        | "pending_confirmation"
        | "confirmed"
        | "rejected"
        | "refunded"
      quotation_status:
        | "waiting"
        | "processing"
        | "quote_sent"
        | "approved"
        | "rejected"
      wholesale_application_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      order_status: [
        "awaiting_payment",
        "payment_confirmed",
        "processing",
        "ready_to_ship",
        "shipped",
        "completed",
        "cancelled",
      ],
      payment_method: ["bank_transfer", "other", "manual", "qris_gopay"],
      payment_status: [
        "unpaid",
        "pending_confirmation",
        "confirmed",
        "rejected",
        "refunded",
      ],
      quotation_status: [
        "waiting",
        "processing",
        "quote_sent",
        "approved",
        "rejected",
      ],
      wholesale_application_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
      ],
    },
  },
} as const
