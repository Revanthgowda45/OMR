import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService, apiUtils } from '../../services/api';

interface ProcessingJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
  result?: any;
}

interface RealTimeProcessorProps {
  examId: string;
  files: File[];
  onComplete?: (results: any[]) => void;
  onError?: (error: string) => void;
}

const RealTimeProcessor: React.FC<RealTimeProcessorProps> = ({
  examId,
  files,
  onComplete,
  onError
}) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Initialize jobs from files
  useEffect(() => {
    if (files.length > 0 && jobs.length === 0) {
      const initialJobs = files.map((file, index) => ({
        id: `job-${Date.now()}-${index}`,
        fileName: file.name,
        status: 'pending' as const,
        progress: 0,
        startTime: new Date().toISOString()
      }));
      setJobs(initialJobs);
    }
  }, [files, jobs.length]);

  // Calculate overall progress
  useEffect(() => {
    if (jobs.length > 0) {
      const totalProgress = jobs.reduce((sum, job) => sum + job.progress, 0);
      setOverallProgress(totalProgress / jobs.length);
    }
  }, [jobs]);

  // Start processing all files
  const startProcessing = useCallback(async () => {
    if (!examId || files.length === 0) {
      toast.error('No files to process');
      return;
    }

    setIsProcessing(true);
    const processingResults: any[] = [];

    try {
      // Upload files first
      await apiService.uploadFiles(files as any, examId);
      
      // Process each file individually for real-time updates
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const jobId = jobs[i]?.id;

        if (!jobId) continue;

        // Update job status to processing
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'processing', progress: 10 }
            : job
        ));

        try {
          // Process individual file
          const result = await apiService.processImageDirect(file, 'setA');
          
          // Simulate progress updates for better UX
          for (let progress = 20; progress <= 90; progress += 20) {
            setJobs(prev => prev.map(job => 
              job.id === jobId 
                ? { ...job, progress }
                : job
            ));
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Complete the job
          setJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { 
                  ...job, 
                  status: 'completed', 
                  progress: 100,
                  endTime: new Date().toISOString(),
                  result
                }
              : job
          ));

          processingResults.push(result);
          toast.success(`Processed ${file.name}`);

        } catch (error) {
          // Mark job as failed
          setJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { 
                  ...job, 
                  status: 'failed', 
                  endTime: new Date().toISOString(),
                  error: error instanceof Error ? error.message : 'Processing failed'
                }
              : job
          ));

          toast.error(`Failed to process ${file.name}`);
        }
      }

      setResults(processingResults);
      onComplete?.(processingResults);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [examId, files, jobs, onComplete, onError]);

  // Auto-start processing when component mounts
  useEffect(() => {
    if (files.length > 0 && jobs.length > 0 && !isProcessing) {
      startProcessing();
    }
  }, [files.length, jobs.length, isProcessing, startProcessing]);

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Processing Progress
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {completedJobs.length + failedJobs.length} / {jobs.length} files processed
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {completedJobs.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {failedJobs.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {overallProgress.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Progress</div>
          </div>
        </div>
      </motion.div>

      {/* Individual Job Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          File Processing Status
        </h3>

        <div className="space-y-3">
          <AnimatePresence>
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {job.fileName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {job.status === 'processing' && `Processing... ${job.progress}%`}
                      {job.status === 'completed' && 
                        `Completed in ${apiUtils.formatProcessingTime(job.startTime, job.endTime)}`
                      }
                      {job.status === 'failed' && `Failed: ${job.error}`}
                      {job.status === 'pending' && 'Waiting to process...'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                  
                  {job.status === 'processing' && (
                    <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Results Summary */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Processing Results
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {/* Navigate to results page */}}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {/* Export results */}}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {jobs[index]?.fileName || `File ${index + 1}`}
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {result.evaluation?.percentage?.toFixed(1) || 0}%
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Score: {result.evaluation?.totalScore || 0}/100
                </div>
                
                {result.evaluation?.subjectScores && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(result.evaluation.subjectScores).map(([subject, scores]: [string, any]) => (
                      <div key={subject} className="flex justify-between text-xs">
                        <span>{subject}:</span>
                        <span>{scores.correct}/{scores.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RealTimeProcessor;
