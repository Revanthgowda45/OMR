import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, CheckCircle, AlertCircle, Upload } from 'lucide-react';

interface FileUploadDemoProps {
  onFileProcessed?: (data: any) => void;
}

const FileUploadDemo: React.FC<FileUploadDemoProps> = ({ onFileProcessed }) => {
  const [showDemo, setShowDemo] = useState(false);

  const sampleCSVData = `Question,Answer,Subject
1,A,Python
2,B,Python
3,C,Python
4,D,Python
5,A,Python
6,B,Python
7,C,Python
8,D,Python
9,A,Python
10,B,Python
11,C,Python
12,D,Python
13,A,Python
14,B,Python
15,C,Python
16,A,Python
17,B,Python
18,C,Python
19,D,Python
20,A,Python
21,B,EDA
22,C,EDA
23,D,EDA
24,A,EDA
25,B,EDA
26,C,EDA
27,D,EDA
28,A,EDA
29,B,EDA
30,C,EDA
31,D,EDA
32,A,EDA
33,B,EDA
34,C,EDA
35,D,EDA
36,A,EDA
37,B,EDA
38,C,EDA
39,D,EDA
40,A,EDA
41,C,SQL
42,D,SQL
43,A,SQL
44,B,SQL
45,C,SQL
46,D,SQL
47,A,SQL
48,B,SQL
49,C,SQL
50,D,SQL
51,A,SQL
52,B,SQL
53,C,SQL
54,D,SQL
55,A,SQL
56,B,SQL
57,C,SQL
58,D,SQL
59,A,SQL
60,B,SQL
61,D,Power BI
62,A,Power BI
63,B,Power BI
64,C,Power BI
65,D,Power BI
66,A,Power BI
67,B,Power BI
68,C,Power BI
69,D,Power BI
70,A,Power BI
71,B,Power BI
72,C,Power BI
73,D,Power BI
74,A,Power BI
75,B,Power BI
76,C,Power BI
77,D,Power BI
78,A,Power BI
79,B,Power BI
80,C,Power BI
81,A,Statistics
82,B,Statistics
83,C,Statistics
84,D,Statistics
85,A,Statistics
86,B,Statistics
87,C,Statistics
88,D,Statistics
89,A,Statistics
90,B,Statistics
91,C,Statistics
92,D,Statistics
93,A,Statistics
94,B,Statistics
95,C,Statistics
96,D,Statistics
97,A,Statistics
98,B,Statistics
99,C,Statistics
100,D,Statistics`;

  const downloadSampleFile = () => {
    const blob = new Blob([sampleCSVData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_answer_key_100q.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const fileFormatExamples = [
    {
      format: 'CSV Format',
      description: 'Comma-separated values with headers',
      example: 'Question,Answer,Subject\n1,A,Python\n2,B,Python\n...',
      icon: FileText,
      color: 'green'
    },
    {
      format: 'Excel Format',
      description: 'Excel spreadsheet (.xlsx, .xls)',
      example: 'Same structure as CSV but in Excel format',
      icon: FileText,
      color: 'blue'
    }
  ];

  const requirements = [
    {
      text: 'Headers: Question, Answer, Subject',
      status: 'required',
      icon: CheckCircle
    },
    {
      text: 'Answers: A, B, C, or D (case insensitive)',
      status: 'required',
      icon: CheckCircle
    },
    {
      text: 'Questions: Sequential numbering (1, 2, 3...)',
      status: 'required',
      icon: CheckCircle
    },
    {
      text: 'Subjects: Python, EDA, SQL, Power BI, Statistics',
      status: 'optional',
      icon: AlertCircle
    }
  ];

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowDemo(!showDemo)}
        className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
      >
        <FileText className="w-4 h-4" />
        <span>{showDemo ? 'Hide' : 'Show'} File Format Guide</span>
      </button>

      {showDemo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white">File Upload Requirements</h4>
          
          {/* Requirements */}
          <div className="space-y-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center space-x-2">
                <req.icon className={`w-4 h-4 ${
                  req.status === 'required' 
                    ? 'text-green-500' 
                    : 'text-yellow-500'
                }`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{req.text}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  req.status === 'required'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>

          {/* Supported Formats */}
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Supported Formats</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fileFormatExamples.map((format, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <format.icon className={`w-4 h-4 text-${format.color}-500`} />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {format.format}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {format.description}
                  </p>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                    {format.example}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Sample File Download */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Code4Edtech Hackathon Template
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                100 questions • 5 subjects • Ready to use
              </p>
            </div>
            <button
              onClick={downloadSampleFile}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Download Sample</span>
            </button>
          </div>

          {/* Subject Structure */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Hackathon Subject Structure
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              {[
                { subject: 'Python', range: '1-20', color: 'blue' },
                { subject: 'EDA', range: '21-40', color: 'green' },
                { subject: 'SQL', range: '41-60', color: 'purple' },
                { subject: 'Power BI', range: '61-80', color: 'orange' },
                { subject: 'Statistics', range: '81-100', color: 'red' }
              ].map((item, index) => (
                <div key={index} className={`p-2 rounded bg-${item.color}-50 dark:bg-${item.color}-900/20`}>
                  <div className={`font-medium text-${item.color}-700 dark:text-${item.color}-300`}>
                    {item.subject}
                  </div>
                  <div className={`text-${item.color}-600 dark:text-${item.color}-400`}>
                    Q{item.range}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Cases */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <h5 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
              Special Cases (Hackathon Requirements)
            </h5>
            <div className="space-y-1 text-xs text-yellow-700 dark:text-yellow-400">
              <div>• Question 16: Multiple correct answers (A,B,C,D)</div>
              <div>• Question 59: Multiple correct answers (A,B)</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FileUploadDemo;
