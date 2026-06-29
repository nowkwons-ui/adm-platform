export type UserRole = 'ADMIN' | 'BUYER' | 'SELLER'
export type ProductStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Profile {
  id: string
  email: string | null
  manager_name: string | null
  company_name: string | null
  role: UserRole
  company_type: string[]
}

export interface Product {
  id: string
  seller_id: string
  name: string
  cas_no: string | null
  dmf_no: string | null
  manufacturer: string | null
  supplier_name: string | null
  standard: string | null
  price_info: string | null
  document_path: string | null
  notes: string | null
  status: ProductStatus
  rejection_reason: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'company_name' | 'manager_name'>
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          manager_name: string | null
          company_name: string | null
          role: UserRole
          company_type: string[]
        }
        Insert: {
          id: string
          email?: string | null
          manager_name?: string | null
          company_name?: string | null
          role?: UserRole
          company_type?: string[]
        }
        Update: {
          id?: string
          email?: string | null
          manager_name?: string | null
          company_name?: string | null
          role?: UserRole
          company_type?: string[]
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          seller_id: string
          name: string
          cas_no: string | null
          dmf_no: string | null
          manufacturer: string | null
          supplier_name: string | null
          standard: string | null
          price_info: string | null
          document_path: string | null
          notes: string | null
          status: ProductStatus
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          name: string
          cas_no?: string | null
          dmf_no?: string | null
          manufacturer?: string | null
          supplier_name?: string | null
          standard?: string | null
          price_info?: string | null
          document_path?: string | null
          notes?: string | null
          status?: ProductStatus
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          name?: string
          cas_no?: string | null
          dmf_no?: string | null
          manufacturer?: string | null
          supplier_name?: string | null
          standard?: string | null
          price_info?: string | null
          document_path?: string | null
          notes?: string | null
          status?: ProductStatus
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      product_status: ProductStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
