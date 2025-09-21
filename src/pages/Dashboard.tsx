import React from 'react';
import { BarChart3, Users, TrendingUp, Upload, Award, Target, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../contexts/AppContext';
import SystemStatus from '../components/Dashboard/SystemStatus';
import ResponsiveStatsGrid from '../components/UI/ResponsiveStatsGrid';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { results } = useApp();
  const navigate = useNavigate();

  const statsData = [
    {
      id: 'students',
      title: 'Total Students',
      value: results.length,
      subtitle: 'Processed OMR sheets',
      icon: Users,
      color: 'blue' as const,
      trend: { value: 12, isPositive: true },
      onClick: () => navigate('/results')
    },
    {
      id: 'upload',
      title: 'Upload OMR',
      value: 'Ready',
      subtitle: 'Process new sheets',
      icon: Upload,
      color: 'green' as const,
      onClick: () => navigate('/upload')
    },
    {
      id: 'accuracy',
      title: 'Accuracy Rate',
      value: '95.8%',
      subtitle: 'Detection accuracy',
      icon: Target,
      color: 'purple' as const,
      trend: { value: 2.3, isPositive: true }
    },
    {
      id: 'performance',
      title: 'Performance',
      value: 'Excellent',
      subtitle: 'System status',
      icon: Activity,
      color: 'orange' as const,
      trend: { value: 5.1, isPositive: true }
    }
  ];

  const gradeDistribution = [
    { name: 'A+', value: 15, color: '#10B981' },
    { name: 'A', value: 25, color: '#3B82F6' },
    { name: 'B', value: 30, color: '#F59E0B' },
    { name: 'C', value: 20, color: '#EF4444' },
    { name: 'F', value: 10, color: '#6B7280' }
  ];

  const performanceData = [
    { subject: 'Math', average: 85, students: 120 },
    { subject: 'Physics', average: 78, students: 95 },
    { subject: 'Chemistry', average: 82, students: 110 },
    { subject: 'Biology', average: 90, students: 88 },
    { subject: 'English', average: 88, students: 130 }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            OMR Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Code4Edtech Hackathon - Innomatics Research Labs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Responsive Stats Grid */}
      <ResponsiveStatsGrid stats={statsData} columns={4} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subject Performance</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="subject" 
                tick={{ fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tick={{ fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: '1px solid rgb(75 85 99)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar dataKey="average" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Grade Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grade Distribution</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: '1px solid rgb(75 85 99)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex flex-wrap justify-center mt-4 space-x-4">
            {gradeDistribution.map((grade) => (
              <div key={grade.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: grade.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {grade.name}: {grade.value}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        
        <div className="space-y-4">
          {[
            { action: 'New exam created', detail: 'Mathematics Final Exam', time: '2 hours ago', type: 'success' },
            { action: 'Processing completed', detail: '45 OMR sheets processed successfully', time: '4 hours ago', type: 'info' },
            { action: 'Results exported', detail: 'Physics Midterm results exported to CSV', time: '6 hours ago', type: 'neutral' },
            { action: 'Error resolved', detail: 'Fixed processing issue with batch #127', time: '1 day ago', type: 'warning' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'success' ? 'bg-green-500' :
                activity.type === 'info' ? 'bg-blue-500' :
                activity.type === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.detail}</p>
              </div>
              <div className="text-xs text-gray-400">{activity.time}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* System Status Integration */}
      <div className="mt-8">
        <SystemStatus />
      </div>
    </div>
  );
};

export default Dashboard;