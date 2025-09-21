import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Database {
  public: {
    Tables: {
      exams: {
        Row: {
          id: string
          name: string
          subject: string
          total_questions: number
          answer_key: string[]
          status: 'draft' | 'active' | 'completed'
          created_at: string
          updated_at: string
          created_by?: string
          exam_set?: 'A' | 'B'
          subject_mapping?: Record<string, number[]>
        }
        Insert: {
          id?: string
          name: string
          subject: string
          total_questions: number
          answer_key: string[]
          status?: 'draft' | 'active' | 'completed'
          created_at?: string
          updated_at?: string
          created_by?: string
          exam_set?: 'A' | 'B'
          subject_mapping?: Record<string, number[]>
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          total_questions?: number
          answer_key?: string[]
          status?: 'draft' | 'active' | 'completed'
          updated_at?: string
          exam_set?: 'A' | 'B'
          subject_mapping?: Record<string, number[]>
        }
      }
      omr_results: {
        Row: {
          id: string
          exam_id: string
          student_name?: string
          student_id?: string
          student_responses: Record<number, string[]>
          confidence_scores: Record<number, number>
          quality_metrics: Record<string, any>
          detected_set: 'A' | 'B'
          subject_scores: Record<string, any>
          total_score: number
          processing_time: number
          image_path?: string
          processed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_name?: string
          student_id?: string
          student_responses: Record<number, string[]>
          confidence_scores: Record<number, number>
          quality_metrics: Record<string, any>
          detected_set: 'A' | 'B'
          subject_scores: Record<string, any>
          total_score: number
          processing_time: number
          image_path?: string
          processed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          student_name?: string
          student_id?: string
          student_responses?: Record<number, string[]>
          confidence_scores?: Record<number, number>
          quality_metrics?: Record<string, any>
          subject_scores?: Record<string, any>
          total_score?: number
        }
      }
      processing_sessions: {
        Row: {
          id: string
          session_name: string
          exam_id: string
          total_images: number
          processed_images: number
          successful_images: number
          failed_images: number
          average_quality_score: number
          total_processing_time: number
          status: 'processing' | 'completed' | 'failed'
          created_at: string
          completed_at?: string
        }
        Insert: {
          id?: string
          session_name: string
          exam_id: string
          total_images: number
          processed_images?: number
          successful_images?: number
          failed_images?: number
          average_quality_score?: number
          total_processing_time?: number
          status?: 'processing' | 'completed' | 'failed'
          created_at?: string
          completed_at?: string
        }
        Update: {
          id?: string
          processed_images?: number
          successful_images?: number
          failed_images?: number
          average_quality_score?: number
          total_processing_time?: number
          status?: 'processing' | 'completed' | 'failed'
          completed_at?: string
        }
      }
      system_analytics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          metric_data: Record<string, any>
          recorded_at: string
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          metric_data?: Record<string, any>
          recorded_at?: string
        }
        Update: {
          metric_value?: number
          metric_data?: Record<string, any>
        }
      }
    }
  }
}

export type Exam = Database['public']['Tables']['exams']['Row']
export type OMRResult = Database['public']['Tables']['omr_results']['Row']
export type ProcessingSession = Database['public']['Tables']['processing_sessions']['Row']
export type SystemAnalytics = Database['public']['Tables']['system_analytics']['Row']
