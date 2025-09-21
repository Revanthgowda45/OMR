import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProcessingSuccessProps {
  processedCount: number;
  onClose: () => void;
}

const ProcessingSuccess: React.FC<ProcessingSuccessProps> = ({ 
  processedCount, 
  onClose 
}) => {
  const navigate = useNavigate();

  const handleViewResults = () => {
    navigate('/results');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Complete!
          </h2>
          <p className="text-gray-600">
            Successfully processed <span className="font-semibold text-green-600">{processedCount}</span> OMR sheet{processedCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Processing Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Files Processed:</span>
              <span className="font-medium">{processedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Method:</span>
              <span className="font-medium">OMR2 Advanced</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">Completed</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-3">
          <button
            onClick={handleViewResults}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span>View Results & Scores</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Process More OMR Sheets
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            📊 Your results have been saved and are ready for review in the Results page.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProcessingSuccess;
