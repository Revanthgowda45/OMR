import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExamService, OMRResultService, ProcessingSessionService, AnalyticsService } from '../services/database';
import type { Exam, OMRResult, ProcessingSession } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface ExamData {
  id: string;
  name: string;
  subject: string;
  totalQuestions: number;
  answerKey: string[];
  createdAt: string;
  status: 'active' | 'completed' | 'draft';
}

export interface ProcessingJob {
  id: string;
  examId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
}

export interface SubjectScore {
  correct: number;
  total: number;
  percentage: number;
  questions: Array<{
    questionNumber: number;
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswer: string;
  }>;
}

export interface StudentResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  fileName?: string;
  answers: string[];
  score: number;
  percentage: number;
  subjectScores: {
    [subject: string]: SubjectScore;
  };
  submittedAt: string;
  imageUrl?: string;
  processingMethod?: string;
  processingTime?: string;
  evaluation?: any[];
  detailedResults?: any[];
  summary?: any;
  visualizations?: any;
}

interface AppContextType {
  exams: ExamData[];
  processingJobs: ProcessingJob[];
  results: StudentResult[];
  loading: boolean;
  systemStats: {
    total_exams: number;
    total_results: number;
    total_sessions: number;
    average_score: number;
    average_processing_time: number;
  };
  addExam: (exam: Omit<ExamData, 'id' | 'createdAt'>) => Promise<void>;
  updateExam: (id: string, updates: Partial<ExamData>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  addProcessingJob: (job: Omit<ProcessingJob, 'id' | 'startTime'>) => void;
  updateProcessingJob: (id: string, updates: Partial<ProcessingJob>) => void;
  addResult: (result: Omit<StudentResult, 'id'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [exams, setExams] = useState<ExamData[]>([]);
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    total_exams: 0,
    total_results: 0,
    total_sessions: 0,
    average_score: 0,
    average_processing_time: 0
  });

  // Load data from Supabase on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Load exams
      const examsData = await ExamService.getAllExams();
      const formattedExams: ExamData[] = examsData.map(exam => ({
        id: exam.id,
        name: exam.name,
        subject: exam.subject,
        totalQuestions: exam.total_questions,
        answerKey: exam.answer_key,
        createdAt: exam.created_at,
        status: exam.status
      }));
      setExams(formattedExams);

      // Load results
      const resultsData = await OMRResultService.getAllResults();
      const formattedResults: StudentResult[] = resultsData.map(result => ({
        id: result.id,
        examId: result.exam_id,
        studentId: result.student_id || 'Unknown',
        studentName: result.student_name || 'Anonymous',
        fileName: result.image_path || undefined,
        answers: Object.values(result.student_responses).flat().map(String),
        score: Math.round(result.total_score),
        percentage: result.total_score,
        subjectScores: result.subject_scores as any,
        submittedAt: result.processed_at,
        processingTime: `${result.processing_time}s`
      }));
      setResults(formattedResults);

      // Load system stats
      const stats = await AnalyticsService.getSystemStats();
      setSystemStats(stats);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data from database');
    } finally {
      setLoading(false);
    }
  };

  const addExam = async (examData: Omit<ExamData, 'id' | 'createdAt'>) => {
    try {
      const newExam = await ExamService.createExam({
        name: examData.name,
        subject: examData.subject,
        total_questions: examData.totalQuestions,
        answer_key: examData.answerKey,
        status: examData.status
      });

      const formattedExam: ExamData = {
        id: newExam.id,
        name: newExam.name,
        subject: newExam.subject,
        totalQuestions: newExam.total_questions,
        answerKey: newExam.answer_key,
        createdAt: newExam.created_at,
        status: newExam.status
      };

      setExams(prev => [...prev, formattedExam]);
      
      // Record analytics
      await AnalyticsService.recordMetric('exam_created', 1, {
        exam_name: examData.name,
        total_questions: examData.totalQuestions
      });
      
    } catch (error) {
      console.error('Error adding exam:', error);
      throw error;
    }
  };

  const updateExam = async (id: string, updates: Partial<ExamData>) => {
    try {
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.subject) supabaseUpdates.subject = updates.subject;
      if (updates.totalQuestions) supabaseUpdates.total_questions = updates.totalQuestions;
      if (updates.answerKey) supabaseUpdates.answer_key = updates.answerKey;
      if (updates.status) supabaseUpdates.status = updates.status;

      await ExamService.updateExam(id, supabaseUpdates);
      
      setExams(prev => prev.map(exam => 
        exam.id === id ? { ...exam, ...updates } : exam
      ));
    } catch (error) {
      console.error('Error updating exam:', error);
      throw error;
    }
  };

  const deleteExam = async (id: string) => {
    try {
      await ExamService.deleteExam(id);
      setExams(prev => prev.filter(exam => exam.id !== id));
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw error;
    }
  };

  const addProcessingJob = (jobData: Omit<ProcessingJob, 'id' | 'startTime'>) => {
    const newJob: ProcessingJob = {
      ...jobData,
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
    };
    setProcessingJobs(prev => [...prev, newJob]);
  };

  const updateProcessingJob = (id: string, updates: Partial<ProcessingJob>) => {
    setProcessingJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...updates } : job
    ));
  };

  const addResult = async (resultData: Omit<StudentResult, 'id'>) => {
    try {
      // Convert to Supabase format
      const supabaseResult = await OMRResultService.saveResult({
        exam_id: resultData.examId,
        student_name: resultData.studentName,
        student_id: resultData.studentId,
        student_responses: resultData.answers.reduce((acc, answer, index) => {
          acc[index + 1] = [answer];
          return acc;
        }, {} as Record<number, string[]>),
        confidence_scores: {},
        quality_metrics: {},
        detected_set: 'A',
        subject_scores: resultData.subjectScores,
        total_score: resultData.percentage,
        processing_time: parseFloat(resultData.processingTime?.replace('s', '') || '0'),
        image_path: resultData.fileName
      });

      const newResult: StudentResult = {
        ...resultData,
        id: supabaseResult.id,
      };
      
      setResults(prev => [...prev, newResult]);

      // Record analytics
      await AnalyticsService.recordMetric('omr_processed', 1, {
        score: resultData.percentage,
        processing_time: resultData.processingTime
      });

    } catch (error) {
      console.error('Error adding result:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      exams,
      processingJobs,
      results,
      loading,
      systemStats,
      addExam,
      updateExam,
      deleteExam,
      addProcessingJob,
      updateProcessingJob,
      addResult,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
};