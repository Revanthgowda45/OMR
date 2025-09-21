/**
 * API Service for Integrated OMR Evaluation System
 * Handles communication between React frontend and Express backend
 * For Code4Edtech Hackathon - Innomatics Research Labs
 */

// Detect environment and set appropriate API base URL
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // Use relative path for production (Netlify)
  : 'http://localhost:3001/api';  // Use localhost for development

// API Response Types
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface UploadResponse {
  message: string;
  files: Array<{
    id: string;
    filename: string;
    originalname: string;
    path: string;
    size: number;
    mimetype: string;
    examId: string;
  }>;
}

export interface ProcessingJobResponse {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export interface SystemInfo {
  service: string;
  version: string;
  hackathon: string;
  organization: string;
  capabilities: string[];
  subjects: string[];
  totalQuestions: number;
  questionsPerSubject: number;
  supportedFormats: string[];
  maxFileSize: string;
}

export interface ProcessingStats {
  processing: {
    totalJobs: number;
    completed: number;
    failed: number;
    active: number;
    successRate: string;
  };
  results: {
    totalStudents: number;
    averageScore: string;
    subjectStatistics: {
      [subject: string]: {
        totalStudents: number;
        averageScore: number;
        maxScore: number;
        minScore: number;
      };
    };
  };
  timestamp: string;
}

// HTTP Client with error handling
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFiles(endpoint: string, formData: FormData): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`File upload failed: ${endpoint}`, error);
      throw error;
    }
  }
}

// Initialize API client
const apiClient = new ApiClient(API_BASE_URL);

// API Service Functions
export const apiService = {
  // System endpoints
  async getHealth() {
    return apiClient.get('/health');
  },

  async getSystemInfo(): Promise<SystemInfo> {
    return apiClient.get<SystemInfo>('/system/info');
  },

  async getProcessingStats(): Promise<ProcessingStats> {
    return apiClient.get<ProcessingStats>('/stats/processing');
  },

  // File upload and processing
  async uploadFiles(files: FileList, examId: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('examId', examId);
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    return apiClient.uploadFiles('/upload', formData);
  },

  async startProcessing(examId: string, files: any[]): Promise<{
    message: string;
    jobs: ProcessingJobResponse[];
  }> {
    return apiClient.post('/process', { examId, files });
  },

  async getJobStatus(jobId: string) {
    return apiClient.get(`/process/${jobId}/status`);
  },

  async getAllJobs() {
    return apiClient.get('/process/jobs');
  },

  // Direct OMR processing (for testing)
  async processImageDirect(file: File, examSet: string = 'setA') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('examSet', examSet);

    return apiClient.uploadFiles('/omr/process-direct', formData);
  },

  // Results management
  async getResults(examId?: string) {
    const endpoint = examId ? `/results/${examId}` : '/results';
    return apiClient.get(endpoint);
  },

  async exportResults(format: 'csv' | 'json', examId?: string) {
    return apiClient.post('/results/export', { format, examId });
  },

  // Exam management
  async getExams() {
    return apiClient.get('/exams');
  },

  async createExam(examData: {
    name: string;
    subject: string;
    totalQuestions: number;
    status?: string;
  }) {
    return apiClient.post('/exams', examData);
  },

  async updateExam(id: string, updates: any) {
    return apiClient.put(`/exams/${id}`, updates);
  },

  async deleteExam(id: string) {
    return apiClient.delete(`/exams/${id}`);
  },

  async updateAnswerKey(examId: string, answerKey: string[]) {
    return apiClient.put(`/exams/${examId}/answerkey`, { answerKey });
  },

  async getExamStats(examId: string) {
    return apiClient.get(`/exams/${examId}/stats`);
  },

  // Admin dashboard
  async getAdminDashboard() {
    return apiClient.get('/admin/dashboard');
  },
};

// Utility functions for API integration
export const apiUtils = {
  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format processing time
  formatProcessingTime(startTime: string, endTime?: string): string {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s`;
    const diffMins = Math.round(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.round(diffMins / 60);
    return `${diffHours}h`;
  },

  // Validate file type
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return validTypes.includes(file.type);
  },

  // Check file size limit
  isFileSizeValid(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  // Generate subject color for charts
  getSubjectColor(subject: string): string {
    const colors: { [key: string]: string } = {
      'Python': '#3B82F6',
      'EDA': '#10B981',
      'SQL': '#F59E0B',
      'PowerBI': '#EF4444',
      'Statistics': '#8B5CF6',
    };
    return colors[subject] || '#6B7280';
  },

  // Calculate overall grade
  calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  },

  // Format percentage with color
  getPercentageColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  },
};

// Error handling utilities
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// React hooks for API integration
export const useApi = () => {
  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      const result = await apiCall();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      onError?.(apiError);
      console.error('API call failed:', apiError);
      return null;
    }
  };

  return { handleApiCall, apiService, apiUtils };
};

export default apiService;
