export type UserRole = 'BUYER' | 'SELLER' | 'AGENT' | 'ADMIN'
export type CompanyType = 'PHARMACEUTICAL' | 'MANUFACTURER' | 'AGENT' | 'DISTRIBUTOR'
export type DocumentType = 'MV' | 'MANUFACTURING_PROCESS' | 'IMPURITY_ASSESSMENT' | 'COA' | 'CTD' | 'SPEC' | 'OTHER'
export type AccessType = 'FREE' | 'PAID' | 'APPROVAL_REQUIRED'
export type InquiryStatus = 'PENDING' | 'IN_CONSULTATION' | 'MATCHED' | 'REJECTED' | 'COMPLETED'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          business_registration_number: string | null
          country: string
          company_type: CompanyType
          is_gmp_certified: boolean
          gmp_certificate_number: string | null
          gmp_expiry_date: string | null
          is_foreign_manufacturer_reg: boolean
          foreign_manufacturer_reg_number: string | null
          website: string | null
          description: string | null
          logo_url: string | null
          ai_metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          business_registration_number?: string | null
          country?: string
          company_type: CompanyType
          is_gmp_certified?: boolean
          gmp_certificate_number?: string | null
          gmp_expiry_date?: string | null
          is_foreign_manufacturer_reg?: boolean
          foreign_manufacturer_reg_number?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          ai_metadata?: Record<string, unknown>
        }
        Update: {
          name?: string
          business_registration_number?: string | null
          country?: string
          company_type?: CompanyType
          is_gmp_certified?: boolean
          gmp_certificate_number?: string | null
          gmp_expiry_date?: string | null
          is_foreign_manufacturer_reg?: boolean
          website?: string | null
          description?: string | null
          logo_url?: string | null
          ai_metadata?: Record<string, unknown>
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          company_id: string | null
          role: UserRole
          full_name: string | null
          phone: string | null
          is_approved: boolean
          ai_metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id?: string | null
          role?: UserRole
          full_name?: string | null
          phone?: string | null
          is_approved?: boolean
          ai_metadata?: Record<string, unknown>
        }
        Update: {
          company_id?: string | null
          role?: UserRole
          full_name?: string | null
          phone?: string | null
          is_approved?: boolean
          ai_metadata?: Record<string, unknown>
        }
        Relationships: []
      }
      apis: {
        Row: {
          id: string
          company_id: string
          generic_name: string
          brand_name: string | null
          cas_number: string | null
          molecular_formula: string | null
          molecular_weight: number | null
          therapeutic_category: string | null
          standards: string[]
          dmf_number: string | null
          dmf_type: string | null
          dmf_country: string | null
          description: string | null
          is_available: boolean
          ai_metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          generic_name: string
          brand_name?: string | null
          cas_number?: string | null
          molecular_formula?: string | null
          molecular_weight?: number | null
          therapeutic_category?: string | null
          standards?: string[]
          dmf_number?: string | null
          dmf_type?: string | null
          dmf_country?: string | null
          description?: string | null
          is_available?: boolean
          ai_metadata?: Record<string, unknown>
        }
        Update: {
          generic_name?: string
          brand_name?: string | null
          cas_number?: string | null
          standards?: string[]
          dmf_number?: string | null
          description?: string | null
          is_available?: boolean
          ai_metadata?: Record<string, unknown>
        }
        Relationships: []
      }
      data_room: {
        Row: {
          id: string
          api_id: string | null
          company_id: string
          document_type: DocumentType
          title: string
          description: string | null
          file_path: string | null
          sample_file_path: string | null
          price: number | null
          currency: string
          access_type: AccessType
          is_active: boolean
          ai_metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_id?: string | null
          company_id: string
          document_type: DocumentType
          title: string
          description?: string | null
          file_path?: string | null
          sample_file_path?: string | null
          price?: number | null
          currency?: string
          access_type?: AccessType
          is_active?: boolean
          ai_metadata?: Record<string, unknown>
        }
        Update: {
          title?: string
          description?: string | null
          file_path?: string | null
          sample_file_path?: string | null
          price?: number | null
          access_type?: AccessType
          is_active?: boolean
          ai_metadata?: Record<string, unknown>
        }
        Relationships: []
      }
      data_room_access: {
        Row: {
          id: string
          data_room_id: string
          user_id: string
          payment_id: string | null
          granted_by: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          data_room_id: string
          user_id: string
          payment_id?: string | null
          granted_by?: string | null
          expires_at?: string | null
        }
        Update: {
          expires_at?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          api_id: string | null
          data_room_id: string | null
          subject: string
          status: InquiryStatus
          ai_metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          api_id?: string | null
          data_room_id?: string | null
          subject: string
          status?: InquiryStatus
          ai_metadata?: Record<string, unknown>
        }
        Update: {
          status?: InquiryStatus
          ai_metadata?: Record<string, unknown>
        }
        Relationships: []
      }
      inquiry_messages: {
        Row: {
          id: string
          inquiry_id: string
          sender_id: string
          message: string
          attachments: Record<string, unknown>[]
          created_at: string
        }
        Insert: {
          id?: string
          inquiry_id: string
          sender_id: string
          message: string
          attachments?: Record<string, unknown>[]
        }
        Update: Record<string, never>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      company_type: CompanyType
      document_type: DocumentType
      access_type: AccessType
      inquiry_status: InquiryStatus
    }
    CompositeTypes: Record<string, never>
  }
}
