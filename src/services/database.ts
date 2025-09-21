import { supabase, type Exam, type OMRResult, type ProcessingSession, type SystemAnalytics } from '../lib/supabase'
import toast from 'react-hot-toast'

// Exam Management
export class ExamService {
  static async createExam(examData: {
    name: string
    subject: string
    total_questions: number
    answer_key: string[]
    status?: 'draft' | 'active' | 'completed'
    exam_set?: 'A' | 'B'
  }) {
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert([{
          ...examData,
          subject_mapping: this.generateSubjectMapping(examData.total_questions),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      toast.success('Exam created successfully!')
      return data
    } catch (error) {
      console.error('Error creating exam:', error)
      toast.error('Failed to create exam')
      throw error
    }
  }

  static async getAllExams() {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to load exams')
      return []
    }
  }

  static async getExamById(id: string) {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching exam:', error)
      toast.error('Failed to load exam')
      throw error
    }
  }

  static async updateExam(id: string, updates: Partial<Exam>) {
    try {
      const { data, error } = await supabase
        .from('exams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      toast.success('Exam updated successfully!')
      return data
    } catch (error) {
      console.error('Error updating exam:', error)
      toast.error('Failed to update exam')
      throw error
    }
  }

  static async deleteExam(id: string) {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Exam deleted successfully!')
      return true
    } catch (error) {
      console.error('Error deleting exam:', error)
      toast.error('Failed to delete exam')
      throw error
    }
  }

  private static generateSubjectMapping(totalQuestions: number) {
    if (totalQuestions === 100) {
      // Code4Edtech Hackathon format
      return {
        'Python': Array.from({ length: 20 }, (_, i) => i + 1),
        'EDA': Array.from({ length: 20 }, (_, i) => i + 21),
        'SQL': Array.from({ length: 20 }, (_, i) => i + 41),
        'Power BI': Array.from({ length: 20 }, (_, i) => i + 61),
        'Statistics': Array.from({ length: 20 }, (_, i) => i + 81)
      }
    }
    // Default: single subject
    return {
      'General': Array.from({ length: totalQuestions }, (_, i) => i + 1)
    }
  }
}

// OMR Results Management
export class OMRResultService {
  static async saveResult(resultData: {
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
  }) {
    try {
      const { data, error } = await supabase
        .from('omr_results')
        .insert([{
          ...resultData,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      toast.success('OMR result saved successfully!')
      return data
    } catch (error) {
      console.error('Error saving OMR result:', error)
      toast.error('Failed to save OMR result')
      throw error
    }
  }

  static async getResultsByExam(examId: string) {
    try {
      const { data, error } = await supabase
        .from('omr_results')
        .select('*')
        .eq('exam_id', examId)
        .order('processed_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Failed to load results')
      return []
    }
  }

  static async getAllResults() {
    try {
      const { data, error } = await supabase
        .from('omr_results')
        .select(`
          *,
          exams (
            name,
            subject
          )
        `)
        .order('processed_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all results:', error)
      toast.error('Failed to load results')
      return []
    }
  }

  static async getResultById(id: string) {
    try {
      const { data, error } = await supabase
        .from('omr_results')
        .select(`
          *,
          exams (
            name,
            subject,
            answer_key
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching result:', error)
      toast.error('Failed to load result')
      throw error
    }
  }

  static async updateResult(id: string, updates: Partial<OMRResult>) {
    try {
      const { data, error } = await supabase
        .from('omr_results')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      toast.success('Result updated successfully!')
      return data
    } catch (error) {
      console.error('Error updating result:', error)
      toast.error('Failed to update result')
      throw error
    }
  }

  static async deleteResult(id: string) {
    try {
      const { error } = await supabase
        .from('omr_results')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Result deleted successfully!')
      return true
    } catch (error) {
      console.error('Error deleting result:', error)
      toast.error('Failed to delete result')
      throw error
    }
  }
}

// Processing Session Management
export class ProcessingSessionService {
  static async createSession(sessionData: {
    session_name: string
    exam_id: string
    total_images: number
  }) {
    try {
      const { data, error } = await supabase
        .from('processing_sessions')
        .insert([{
          ...sessionData,
          status: 'processing',
          processed_images: 0,
          successful_images: 0,
          failed_images: 0,
          average_quality_score: 0,
          total_processing_time: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  static async updateSession(id: string, updates: Partial<ProcessingSession>) {
    try {
      const { data, error } = await supabase
        .from('processing_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating session:', error)
      throw error
    }
  }

  static async completeSession(id: string, finalStats: {
    successful_images: number
    failed_images: number
    average_quality_score: number
    total_processing_time: number
  }) {
    try {
      const { data, error } = await supabase
        .from('processing_sessions')
        .update({
          ...finalStats,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error completing session:', error)
      throw error
    }
  }

  static async getAllSessions() {
    try {
      const { data, error } = await supabase
        .from('processing_sessions')
        .select(`
          *,
          exams (
            name,
            subject
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sessions:', error)
      return []
    }
  }
}

// Analytics Service
export class AnalyticsService {
  static async recordMetric(metricName: string, value: number, data?: Record<string, any>) {
    try {
      const { error } = await supabase
        .from('system_analytics')
        .insert([{
          metric_name: metricName,
          metric_value: value,
          metric_data: data || {},
          recorded_at: new Date().toISOString()
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error recording metric:', error)
    }
  }

  static async getSystemStats() {
    try {
      // Get total counts
      const [examsResult, resultsResult, sessionsResult] = await Promise.all([
        supabase.from('exams').select('id', { count: 'exact' }),
        supabase.from('omr_results').select('id', { count: 'exact' }),
        supabase.from('processing_sessions').select('id', { count: 'exact' })
      ])

      // Get recent activity
      const { data: recentResults } = await supabase
        .from('omr_results')
        .select('total_score, processing_time, processed_at')
        .order('processed_at', { ascending: false })
        .limit(100)

      const stats = {
        total_exams: examsResult.count || 0,
        total_results: resultsResult.count || 0,
        total_sessions: sessionsResult.count || 0,
        average_score: recentResults?.length ? 
          recentResults.reduce((sum, r) => sum + r.total_score, 0) / recentResults.length : 0,
        average_processing_time: recentResults?.length ?
          recentResults.reduce((sum, r) => sum + r.processing_time, 0) / recentResults.length : 0
      }

      return stats
    } catch (error) {
      console.error('Error fetching system stats:', error)
      return {
        total_exams: 0,
        total_results: 0,
        total_sessions: 0,
        average_score: 0,
        average_processing_time: 0
      }
    }
  }

  static async getPerformanceMetrics(examId?: string) {
    try {
      let query = supabase
        .from('omr_results')
        .select('total_score, subject_scores, processing_time, quality_metrics, processed_at')

      if (examId) {
        query = query.eq('exam_id', examId)
      }

      const { data, error } = await query
        .order('processed_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching performance metrics:', error)
      return []
    }
  }
}
