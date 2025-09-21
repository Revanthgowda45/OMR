import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Database,
  Cpu,
  Wifi
} from 'lucide-react';
import { apiService } from '../../services/api';

interface SystemStatusProps {
  className?: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ className = '' }) => {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [processingStats, setProcessingStats] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        // Check if backend is online
        const health = await apiService.getHealth();
        setSystemHealth(health);
        setIsOnline(true);

        // Get system information
        const info = await apiService.getSystemInfo();
        setSystemInfo(info);

        // Get processing statistics
        const stats = await apiService.getProcessingStats();
        setProcessingStats(stats);

      } catch (error) {
        console.error('Failed to fetch system status:', error);
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    };

    checkSystemStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>System Status</span>
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${getStatusColor(isOnline)}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* System Components Status */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backend API */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Wifi className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Backend API
              </span>
            </div>
            {getStatusIcon(isOnline)}
          </motion.div>

          {/* Python OMR Service */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Cpu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                OMR Processing
              </span>
            </div>
            {getStatusIcon(isOnline)}
          </motion.div>

          {/* Database */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Database className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Data Storage
              </span>
            </div>
            {getStatusIcon(isOnline)}
          </motion.div>

          {/* File Upload */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                File Processing
              </span>
            </div>
            {getStatusIcon(isOnline)}
          </motion.div>
        </div>

        {/* System Information */}
        {systemInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
              System Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-700 dark:text-blue-300">
              <div>
                <span className="font-medium">Service:</span> {systemInfo.service}
              </div>
              <div>
                <span className="font-medium">Version:</span> {systemInfo.version}
              </div>
              <div>
                <span className="font-medium">Organization:</span> {systemInfo.organization}
              </div>
              <div>
                <span className="font-medium">Questions:</span> {systemInfo.totalQuestions}
              </div>
            </div>
          </motion.div>
        )}

        {/* Processing Statistics */}
        {processingStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3">
              Processing Statistics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {processingStats.processing?.completed || 0}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Completed
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {processingStats.processing?.active || 0}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Active
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {processingStats.processing?.successRate || 0}%
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  Success Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {processingStats.results?.totalStudents || 0}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300">
                  Total Results
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* System Health */}
        {systemHealth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Last Updated
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(systemHealth.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SystemStatus;
