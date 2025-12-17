// Types générés automatiquement depuis le schéma Supabase
// Ces types correspondent aux tables créées dans SUPABASE_SCHEMA.sql

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    name: string
                    role: string
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    role?: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    role?: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            documents: {
                Row: {
                    id: number
                    title: string
                    type_id: number | null
                    user_id: string | null
                    content: string | null
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    title: string
                    type_id?: number | null
                    user_id?: string | null
                    content?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    title?: string
                    type_id?: number | null
                    user_id?: string | null
                    content?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            signatures: {
                Row: {
                    id: number
                    document_id: number | null
                    user_id: string | null
                    signed_at: string
                    signature_data: string | null
                    ip_address: string | null
                }
                Insert: {
                    id?: number
                    document_id?: number | null
                    user_id?: string | null
                    signed_at?: string
                    signature_data?: string | null
                    ip_address?: string | null
                }
                Update: {
                    id?: number
                    document_id?: number | null
                    user_id?: string | null
                    signed_at?: string
                    signature_data?: string | null
                    ip_address?: string | null
                }
            }
            document_types: {
                Row: {
                    id: number
                    type_name: string
                    color: string
                    created_at: string
                }
                Insert: {
                    id?: number
                    type_name: string
                    color?: string
                    created_at?: string
                }
                Update: {
                    id?: number
                    type_name?: string
                    color?: string
                    created_at?: string
                }
            }
            activities: {
                Row: {
                    id: number
                    day_of_week: number
                    letters_count: number
                    signatures_count: number
                    week_start_date: string
                    created_at: string
                }
                Insert: {
                    id?: number
                    day_of_week: number
                    letters_count?: number
                    signatures_count?: number
                    week_start_date: string
                    created_at?: string
                }
                Update: {
                    id?: number
                    day_of_week?: number
                    letters_count?: number
                    signatures_count?: number
                    week_start_date?: string
                    created_at?: string
                }
            }
            templates: {
                Row: {
                    id: number
                    name: string
                    type: string
                    size_label: string
                    file_url: string
                    description: string | null
                    download_count: number
                    created_at: string
                }
                Insert: {
                    id?: number
                    name: string
                    type: string
                    size_label: string
                    file_url: string
                    description?: string | null
                    download_count?: number
                    created_at?: string
                }
                Update: {
                    id?: number
                    name?: string
                    type?: string
                    size_label?: string
                    file_url?: string
                    description?: string | null
                    download_count?: number
                    created_at?: string
                }
            }
            bookmarks: {
                Row: {
                    id: number
                    user_id: string
                    item_id: number
                    item_type: string
                    title: string
                    url: string | null
                    subtitle: string | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    item_id: number
                    item_type: string
                    title: string
                    url?: string | null
                    subtitle?: string | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    item_id?: number
                    item_type?: string
                    title?: string
                    url?: string | null
                    subtitle?: string | null
                    created_at?: string
                }
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
    }
}
