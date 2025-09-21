import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Settings, Camera, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/Upload/ImageUploader';
import RealTimeProcessor from '../components/Processing/RealTimeProcessor';
import ProcessingSuccess from '../components/Upload/ProcessingSuccess';
import { useApp } from '../contexts/AppContext';
import { apiUtils } from '../services/api';

const Upload: React.FC = () => {
  const { exams, addResult } = useApp();
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'file' | 'camera'>('file');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showProcessor, setShowProcessor] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleStartProcessing = async () => {
    if (!selectedExam) {
      toast.error('Please select an exam');
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one OMR sheet');
      return;
    }

    // Validate files
    const invalidFiles = uploadedFiles.filter(file => 
      !apiUtils.isValidImageFile(file) || !apiUtils.isFileSizeValid(file)
    );

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files detected. Please check file types and sizes.`);
      return;
    }

    // Show real-time processor
    setShowProcessor(true);
    toast.success(`Starting real-time processing of ${uploadedFiles.length} OMR sheet(s)`);
  };

  const handleProcessingComplete = (results: any[]) => {
    // Add results to app context
    results.forEach((result, index) => {
      if (result.success) {
        addResult({
          examId: selectedExam,
          studentId: `ST${Date.now()}-${index}`,
          studentName: `Student ${index + 1}`,
          fileName: uploadedFiles[index]?.name || `OMR_Sheet_${index + 1}`,
          answers: result.detectedResponses || [],
          score: result.evaluation?.totalScore || 0,
          percentage: result.evaluation?.percentage || 0,
          subjectScores: result.evaluation?.subjectScores || {},
          submittedAt: new Date().toISOString(),
          processingMethod: result.processingMethod,
          processingTime: typeof result.processingTime === 'string' 
            ? result.processingTime 
            : `${result.processingTime || 0.2}s`,
          evaluation: result.evaluation?.detailedResults || [],
          detailedResults: result.evaluation?.detailedResults || [],
          summary: result.evaluation?.summary || {},
          visualizations: result.visualizations || {}
        });
      }
    });

    // Show success modal instead of immediate redirect
    setProcessedCount(results.length);
    setShowProcessor(false);
    setShowSuccess(true);
    
    toast.success(`Successfully processed ${results.length} OMR sheets!`);
  };

  const handleProcessingError = (error: string) => {
    toast.error(`Processing failed: ${error}`);
    setShowProcessor(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setUploadedFiles([]);
    setSelectedExam('');
    setProcessedCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload OMR Sheets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Upload scanned OMR sheets for automated evaluation
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUploadMode('file')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
              uploadMode === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <FileImage className="w-4 h-4" />
            <span>File Upload</span>
          </button>
          
          <button
            onClick={() => setUploadMode('camera')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
              uploadMode === 'camera'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Choose an exam...</option>
                {exams.filter(exam => exam.status === 'active').map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.totalQuestions} questions)
                  </option>
                ))}
              </select>
            </div>

            {selectedExam && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-2">Exam Details:</p>
                  {(() => {
                    const exam = exams.find(e => e.id === selectedExam);
                    return exam ? (
                      <ul className="space-y-1">
                        <li>Subject: {exam.subject}</li>
                        <li>Questions: {exam.totalQuestions}</li>
                        <li>Created: {new Date(exam.createdAt).toLocaleDateString()}</li>
                      </ul>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Guidelines</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Use high-quality scans (300 DPI minimum)</li>
                <li>• Ensure OMR sheets are flat and well-lit</li>
                <li>• Avoid shadows and reflections</li>
                <li>• Maximum file size: 10MB per image</li>
                <li>• Supported formats: JPEG, PNG, JPG</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <UploadIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {uploadMode === 'file' ? 'File Upload' : 'Camera Capture'}
              </h3>
            </div>

            {uploadMode === 'file' ? (
              <ImageUploader 
                onFilesSelected={handleFilesSelected}
                maxFiles={20}
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Camera Capture
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Use your device camera to capture OMR sheets directly
                </p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 mx-auto">
                  <Camera className="w-5 h-5" />
                  <span>Open Camera</span>
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  Feature coming soon - Please use file upload for now
                </p>
              </div>
            )}
          </div>

          {/* Processing Controls */}
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ready to Process
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {uploadedFiles.length} file(s) uploaded and ready for processing
                  </p>
                </div>

                <button
                  onClick={handleStartProcessing}
                  disabled={!selectedExam || showProcessor}
                  className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
                    selectedExam && !showProcessor
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <UploadIcon className={`w-5 h-5 ${showProcessor ? 'animate-spin' : ''}`} />
                  <span>{showProcessor ? 'Processing...' : 'Start Real-time Processing'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Real-time Processing Component */}
      {showProcessor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <RealTimeProcessor
            examId={selectedExam}
            files={uploadedFiles}
            onComplete={handleProcessingComplete}
            onError={handleProcessingError}
          />
        </motion.div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <ProcessingSuccess
          processedCount={processedCount}
          onClose={handleCloseSuccess}
        />
      )}
    </div>
  );
};

export default Upload;