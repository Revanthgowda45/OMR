import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Users, Settings, Trash2, Edit, Eye, Upload, FileText, Download, Info } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import FileUploadDemo from '../components/Admin/FileUploadDemo';
import '../styles/modal-scroll.css';

const Admin: React.FC = () => {
  const { exams, addExam, updateExam } = useApp();
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [newExam, setNewExam] = useState({
    name: '',
    subject: '',
    totalQuestions: 50,
    status: 'draft' as 'active' | 'completed' | 'draft'
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [createMethod, setCreateMethod] = useState<'manual' | 'upload'>('manual');
  const [answerKeyData, setAnswerKeyData] = useState<string[]>([]);

  // File processing functions
  const parseCSV = (text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const answers: string[] = [];
    
    lines.forEach((line, index) => {
      if (index === 0) return; // Skip header
      const columns = line.split(',');
      if (columns.length >= 2) {
        const answer = columns[1].trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(answer)) {
          answers.push(answer);
        }
      }
    });
    
    return answers;
  };

  const parseExcel = async (file: File): Promise<string[]> => {
    // For demo purposes, we'll simulate Excel parsing
    // In a real app, you'd use a library like xlsx
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Simple CSV-like parsing for demo
        const answers = parseCSV(text);
        resolve(answers);
      };
      reader.readAsText(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    
    try {
      let answers: string[] = [];
      
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        answers = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        answers = await parseExcel(file);
      }
      
      if (answers.length > 0) {
        setAnswerKeyData(answers);
        setNewExam(prev => ({ 
          ...prev, 
          totalQuestions: answers.length,
          name: prev.name || file.name.replace(/\.[^/.]+$/, "")
        }));
        toast.success(`Loaded ${answers.length} answers from ${file.name}`);
      } else {
        toast.error('No valid answer data found in file');
      }
    } catch (error) {
      toast.error('Error processing file');
      console.error(error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    // Create comprehensive template based on hackathon requirements
    let csvContent = "Question,Answer,Subject\n";
    
    // Python (Questions 1-20)
    for (let i = 1; i <= 20; i++) {
      csvContent += `${i},A,Python\n`;
    }
    
    // EDA (Questions 21-40)
    for (let i = 21; i <= 40; i++) {
      csvContent += `${i},B,EDA\n`;
    }
    
    // SQL (Questions 41-60)
    for (let i = 41; i <= 60; i++) {
      csvContent += `${i},C,SQL\n`;
    }
    
    // Power BI (Questions 61-80)
    for (let i = 61; i <= 80; i++) {
      csvContent += `${i},D,Power BI\n`;
    }
    
    // Statistics (Questions 81-100)
    for (let i = 81; i <= 100; i++) {
      csvContent += `${i},A,Statistics\n`;
    }
    
    // Add special cases as comments
    csvContent += "# Special Cases:\n";
    csvContent += "# Question 16: Multiple answers (A,B,C,D)\n";
    csvContent += "# Question 59: Multiple answers (A,B)\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omr_answer_key_template_100q.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded! 100 questions with 5 subjects structure');
  };

  const handleCreateExam = () => {
    if (!newExam.name || !newExam.subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (createMethod === 'upload' && answerKeyData.length === 0) {
      toast.error('Please upload a valid answer key file');
      return;
    }

    if (createMethod === 'manual' && (!newExam.totalQuestions || newExam.totalQuestions <= 0)) {
      toast.error('Please enter a valid number of questions');
      return;
    }

    const finalAnswerKey = createMethod === 'upload' && answerKeyData.length > 0 
      ? answerKeyData 
      : Array.from({ length: newExam.totalQuestions }, () => 'A');

    addExam({
      ...newExam,
      answerKey: finalAnswerKey,
    });

    toast.success('Exam created successfully');
    setNewExam({ name: '', subject: '', totalQuestions: 50, status: 'draft' });
    setUploadedFile(null);
    setAnswerKeyData([]);
    setCreateMethod('manual');
    setShowCreateExam(false);
  };

  const handleDeleteExam = (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      // In a real app, this would call a delete function
      console.log('Deleting exam:', examId);
      toast.success('Exam deleted successfully');
    }
  };

  const handleUpdateExamStatus = (examId: string, status: 'active' | 'completed' | 'draft') => {
    updateExam(examId, { status });
    toast.success(`Exam status updated to ${status}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage exams, answer keys, and system settings
          </p>
        </div>

        <button
          onClick={() => setShowCreateExam(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Exam</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Exams', value: exams.length, icon: BookOpen, color: 'blue' },
          { label: 'Active Exams', value: exams.filter(e => e.status === 'active').length, icon: Settings, color: 'green' },
          { label: 'Total Students', value: '156', icon: Users, color: 'purple' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-500`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Exam Modal */}
      {showCreateExam && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto"
          onClick={() => setShowCreateExam(false)}
        >
          <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Exam</h3>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 modal-scroll">
            
            {/* Creation Method Toggle */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setCreateMethod('manual')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                    createMethod === 'manual'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  onClick={() => setCreateMethod('upload')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                    createMethod === 'upload'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exam Name
                </label>
                <input
                  type="text"
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Mathematics Final Exam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Questions
                </label>
                <input
                  type="number"
                  value={newExam.totalQuestions || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? 0 : parseInt(value);
                    setNewExam({ ...newExam, totalQuestions: isNaN(numValue) ? 0 : numValue });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="200"
                  disabled={createMethod === 'upload' && answerKeyData.length > 0}
                />
              </div>

              {/* File Upload Section */}
              {createMethod === 'upload' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Answer Key (CSV/Excel)
                    </label>
                    
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
                        isDragActive
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      {uploadedFile ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ {answerKeyData.length} answers loaded
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isDragActive ? 'Drop the file here...' : 'Drag & drop a CSV/Excel file here, or click to select'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Supports .csv, .xlsx, .xls files
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Template</span>
                    </button>
                    
                    {answerKeyData.length > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                        <FileText className="w-4 h-4" />
                        <span>{answerKeyData.length} questions loaded</span>
                      </div>
                    )}
                  </div>

                  {/* File Upload Guide */}
                  <FileUploadDemo />

                  {/* Hackathon Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-300">
                          Code4Edtech Hackathon Format
                        </p>
                        <p className="text-blue-700 dark:text-blue-400 mt-1">
                          Upload answer keys for 100-question exams with 5 subjects: 
                          Python (1-20), EDA (21-40), SQL (41-60), Power BI (61-80), Statistics (81-100)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={newExam.status}
                  onChange={(e) => setNewExam({ ...newExam, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateExam(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateExam}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Create Exam
                </button>
              </div>
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}

      {/* Exams List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exam Management</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Exam Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{exam.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">ID: {exam.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {exam.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {exam.totalQuestions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={exam.status}
                        onChange={(e) => handleUpdateExamStatus(exam.id, e.target.value as any)}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                          exam.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : exam.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(exam.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors duration-200">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Admin;