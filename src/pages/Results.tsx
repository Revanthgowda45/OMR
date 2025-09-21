import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Filter } from 'lucide-react';
import ResultsTable from '../components/Results/ResultsTable';
import VisualizationModal from '../components/Results/VisualizationModal';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

const Results: React.FC = () => {
  const { results, exams } = useApp();
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [visualizationModal, setVisualizationModal] = useState<{
    isOpen: boolean;
    resultId: string;
    studentName: string;
  }>({
    isOpen: false,
    resultId: '',
    studentName: ''
  });

  const filteredResults = selectedExam 
    ? results.filter(result => result.examId === selectedExam)
    : results;

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    // Placeholder for export functionality
    toast.success(`Exporting results as ${format.toUpperCase()}...`);
  };

  const handleViewDetails = (result: any) => {
    // Open visualization modal
    setVisualizationModal({
      isOpen: true,
      resultId: result.id,
      studentName: result.studentName
    });
  };

  const handleEditResult = (result: any) => {
    // Placeholder for editing results
    toast.success(`Editing result for ${result.studentName}`);
  };

  // Generate sample results if none exist
  React.useEffect(() => {
    if (results.length === 0 && exams.length > 0) {
      // This would normally be handled by the processing pipeline
      // Adding sample data for demonstration
    }
  }, [results, exams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Results Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage OMR evaluation results
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Exams</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: filteredResults.length, color: 'blue' },
          { label: 'Average Score', value: filteredResults.length > 0 ? `${(filteredResults.reduce((acc, r) => acc + r.percentage, 0) / filteredResults.length).toFixed(1)}%` : '0%', color: 'green' },
          { label: 'Pass Rate', value: filteredResults.length > 0 ? `${Math.round((filteredResults.filter(r => r.percentage >= 50).length / filteredResults.length) * 100)}%` : '0%', color: 'purple' },
          { label: 'Highest Score', value: filteredResults.length > 0 ? `${Math.max(...filteredResults.map(r => r.percentage)).toFixed(1)}%` : '0%', color: 'yellow' }
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
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Results Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Student Results</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <ResultsTable
          results={filteredResults}
          onExport={handleExport}
          onViewDetails={handleViewDetails}
          onEditResult={handleEditResult}
        />
      </motion.div>

      {/* Visualization Modal */}
      <VisualizationModal
        isOpen={visualizationModal.isOpen}
        onClose={() => setVisualizationModal({ isOpen: false, resultId: '', studentName: '' })}
        resultId={visualizationModal.resultId}
        studentName={visualizationModal.studentName}
      />
    </div>
  );
};

export default Results;