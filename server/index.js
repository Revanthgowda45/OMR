import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for visualizations
app.use('/visualizations', express.static(join(__dirname, 'visualizations')));

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// In-memory storage for demo (replace with database in production)
let processingJobs = [];
let results = [];
// Load hackathon answer keys
const loadAnswerKeys = () => {
  try {
    const answerKeysPath = path.join(__dirname, '..', 'answer_keys.json');
    const answerKeysData = JSON.parse(fs.readFileSync(answerKeysPath, 'utf8'));
    return answerKeysData.setA.rawAnswers;
  } catch (error) {
    console.error('Failed to load answer keys:', error);
    // Fallback to default answer key
    return Array.from({ length: 100 }, (_, i) => String.fromCharCode(65 + (i % 4)));
  }
};

let exams = [
  {
    id: '1',
    name: 'Innomatics Placement Assessment - Set A',
    subject: 'Data Science & AI/ML',
    totalQuestions: 100,
    answerKey: loadAnswerKeys(),
    subjects: {
      'Python': { start: 1, end: 20, count: 20 },
      'EDA': { start: 21, end: 40, count: 20 },
      'SQL': { start: 41, end: 60, count: 20 },
      'PowerBI': { start: 61, end: 80, count: 20 },
      'Statistics': { start: 81, end: 100, count: 20 }
    },
    createdAt: new Date().toISOString(),
    status: 'active'
  }
];

// Image processing functions
const preprocessImage = async (imagePath) => {
  try {
    const processedPath = imagePath.replace('.', '-processed.');
    
    await sharp(imagePath)
      .resize(2000, 2000, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .normalize()
      .sharpen()
      .jpeg({ quality: 95 })
      .toFile(processedPath);
    
    return processedPath;
  } catch (error) {
    throw new Error(`Image preprocessing failed: ${error.message}`);
  }
};

const detectOMRBubbles = async (imagePath, examSet = 'setA') => {
  // Use OMR2 integrated API service for maximum accuracy
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'omr_api_service.py');
    const pythonProcess = spawn('python', [pythonScript, imagePath, '--exam-set', examSet, '--method', 'perfect']);
    
    let outputData = '';
    let errorData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const results = JSON.parse(outputData);
          if (results.success) {
            // Convert to expected format for React frontend
            const bubbles = results.detectedResponses.map((answer, index) => ({
              questionNumber: index + 1,
              detectedAnswer: answer.toUpperCase(),
              confidence: 0.9,
              subject: getSubjectForQuestion(index + 1)
            }));
            
            // Store full results for detailed analysis
            results.bubbles = bubbles;
            resolve(results);
          } else {
            reject(new Error(results.error || 'OMR processing failed'));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse OMR results: ${parseError.message}`));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorData}`));
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('OMR processing timeout'));
    }, 30000);
  });
};

// Helper function to get subject for question number
const getSubjectForQuestion = (questionNum) => {
  if (questionNum >= 1 && questionNum <= 20) return 'Python';
  if (questionNum >= 21 && questionNum <= 40) return 'EDA';
  if (questionNum >= 41 && questionNum <= 60) return 'SQL';
  if (questionNum >= 61 && questionNum <= 80) return 'PowerBI';
  if (questionNum >= 81 && questionNum <= 100) return 'Statistics';
  return 'Unknown';
};

const evaluateAnswers = (detectedAnswers, answerKey, exam) => {
  let correctAnswers = 0;
  const subjectScores = {};
  
  // Initialize subject scores
  Object.keys(exam.subjects).forEach(subject => {
    subjectScores[subject] = {
      correct: 0,
      total: exam.subjects[subject].count,
      percentage: 0,
      questions: []
    };
  });
  
  const evaluation = detectedAnswers.map((detected, index) => {
    const isCorrect = detected.detectedAnswer.toLowerCase() === answerKey[index].toLowerCase();
    if (isCorrect) correctAnswers++;
    
    // Determine subject for this question
    const questionNum = detected.questionNumber;
    let subject = 'Unknown';
    for (const [subjectName, subjectInfo] of Object.entries(exam.subjects)) {
      if (questionNum >= subjectInfo.start && questionNum <= subjectInfo.end) {
        subject = subjectName;
        break;
      }
    }
    
    // Update subject score
    if (subject !== 'Unknown') {
      subjectScores[subject].questions.push({
        questionNumber: questionNum,
        isCorrect,
        studentAnswer: detected.detectedAnswer,
        correctAnswer: answerKey[index]
      });
      
      if (isCorrect) {
        subjectScores[subject].correct++;
      }
    }
    
    return {
      questionNumber: detected.questionNumber,
      subject: subject,
      studentAnswer: detected.detectedAnswer,
      correctAnswer: answerKey[index],
      isCorrect,
      confidence: detected.confidence
    };
  });

  // Calculate subject percentages
  Object.keys(subjectScores).forEach(subject => {
    const subjectData = subjectScores[subject];
    subjectData.percentage = (subjectData.correct / subjectData.total) * 100;
  });

  const score = correctAnswers;
  const percentage = (correctAnswers / answerKey.length) * 100;

  return {
    score,
    percentage,
    totalQuestions: answerKey.length,
    correctAnswers,
    subjectScores,
    evaluation
  };
};

// API Routes

// File upload endpoint
app.post('/api/upload', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { examId } = req.body;
    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const uploadedFiles = req.files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      examId
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start processing endpoint
app.post('/api/process', async (req, res) => {
  try {
    const { examId, files } = req.body;
    
    if (!examId || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const exam = exams.find(e => e.id === examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Create processing jobs
    const jobs = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      examId,
      fileName: file.originalname || file.filename,
      filePath: file.path,
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString()
    }));

    processingJobs.push(...jobs);

    // Start processing each file asynchronously
    jobs.forEach(job => processOMRFile(job, exam));

    res.json({
      message: 'Processing started',
      jobs: jobs.map(job => ({
        id: job.id,
        fileName: job.fileName,
        status: job.status,
        progress: job.progress
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process OMR file function
const processOMRFile = async (job, exam) => {
  try {
    // Update job status to processing
    const jobIndex = processingJobs.findIndex(j => j.id === job.id);
    if (jobIndex === -1) return;

    processingJobs[jobIndex].status = 'processing';
    processingJobs[jobIndex].progress = 10;

    // Step 1: Preprocess image
    const processedImagePath = await preprocessImage(job.filePath);
    processingJobs[jobIndex].progress = 30;

    // Step 2: Process OMR with integrated service
    const omrResults = await detectOMRBubbles(processedImagePath, 'setA');
    processingJobs[jobIndex].progress = 90;

    // Step 3: Create comprehensive result from integrated service
    const result = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      examId: exam.id,
      studentId: `ST${Date.now().toString().slice(-6)}`,
      studentName: `Student ${results.length + 1}`,
      
      // From integrated service
      answers: omrResults.detectedResponses,
      score: omrResults.evaluation.totalScore,
      percentage: omrResults.evaluation.percentage,
      subjectScores: omrResults.evaluation.subjectScores,
      
      // Additional metadata
      submittedAt: new Date().toISOString(),
      imageUrl: processedImagePath,
      processingMethod: omrResults.processingMethod,
      
      // Detailed results
      evaluation: omrResults.evaluation.detailedResults,
      detailedResults: omrResults.evaluation.detailedResults,
      summary: omrResults.evaluation.summary,
      
      // Full OMR results for advanced analysis
      fullOMRResults: omrResults,
      
      // Visualizations (if available)
      visualizations: omrResults.visualizations || {},
      fileName: req.file.originalname,
      processingTime: omrResults.processingTime || '< 1s'
    };

    results.push(result);

    // Complete job
    processingJobs[jobIndex].status = 'completed';
    processingJobs[jobIndex].progress = 100;
    processingJobs[jobIndex].endTime = new Date().toISOString();

  } catch (error) {
    // Mark job as failed
    const jobIndex = processingJobs.findIndex(j => j.id === job.id);
    if (jobIndex !== -1) {
      processingJobs[jobIndex].status = 'failed';
      processingJobs[jobIndex].error = error.message;
      processingJobs[jobIndex].endTime = new Date().toISOString();
    }
  }
};

// Get processing status
app.get('/api/process/:jobId/status', (req, res) => {
  const { jobId } = req.params;
  const job = processingJobs.find(j => j.id === jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

// Get all processing jobs
app.get('/api/process/jobs', (req, res) => {
  res.json(processingJobs);
});

// Get results for an exam
app.get('/api/results/:examId', (req, res) => {
  const { examId } = req.params;
  const examResults = results.filter(r => r.examId === examId);
  res.json(examResults);
});

// Get all results
app.get('/api/results', (req, res) => {
  res.json(results);
});

// Export results
app.post('/api/results/export', (req, res) => {
  const { format, examId } = req.body;
  
  let exportResults = results;
  if (examId) {
    exportResults = results.filter(r => r.examId === examId);
  }

  // Placeholder for actual export functionality
  res.json({
    message: `Results exported in ${format} format`,
    count: exportResults.length,
    downloadUrl: `/api/downloads/results-${Date.now()}.${format}`
  });
});

// Exam management endpoints
app.get('/api/exams', (req, res) => {
  res.json(exams);
});

app.post('/api/exams', (req, res) => {
  const { name, subject, totalQuestions, status = 'draft' } = req.body;
  
  if (!name || !subject || !totalQuestions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newExam = {
    id: Date.now().toString(),
    name,
    subject,
    totalQuestions,
    answerKey: Array.from({ length: totalQuestions }, () => 'A'), // Default answer key
    createdAt: new Date().toISOString(),
    status
  };

  exams.push(newExam);
  res.status(201).json(newExam);
});

app.put('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  const examIndex = exams.findIndex(e => e.id === id);
  
  if (examIndex === -1) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  exams[examIndex] = { ...exams[examIndex], ...req.body };
  res.json(exams[examIndex]);
});

app.delete('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  const examIndex = exams.findIndex(e => e.id === id);
  
  if (examIndex === -1) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  exams.splice(examIndex, 1);
  res.json({ message: 'Exam deleted successfully' });
});

// Update answer key
app.put('/api/exams/:id/answerkey', (req, res) => {
  const { id } = req.params;
  const { answerKey } = req.body;
  
  const examIndex = exams.findIndex(e => e.id === id);
  if (examIndex === -1) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  if (!Array.isArray(answerKey)) {
    return res.status(400).json({ error: 'Answer key must be an array' });
  }

  exams[examIndex].answerKey = answerKey;
  res.json({ message: 'Answer key updated successfully' });
});

// Get exam statistics
app.get('/api/exams/:id/stats', (req, res) => {
  const { id } = req.params;
  const examResults = results.filter(r => r.examId === id);
  
  if (examResults.length === 0) {
    return res.json({
      totalStudents: 0,
      averageScore: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: 0
    });
  }

  const scores = examResults.map(r => r.percentage);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const passRate = (examResults.filter(r => r.percentage >= 50).length / examResults.length) * 100;

  res.json({
    totalStudents: examResults.length,
    averageScore: Math.round(averageScore * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores)
  });
});

// Admin dashboard stats
app.get('/api/admin/dashboard', (req, res) => {
  const totalExams = exams.length;
  const activeExams = exams.filter(e => e.status === 'active').length;
  const totalStudents = results.length;
  const totalProcessingJobs = processingJobs.length;
  const completedJobs = processingJobs.filter(j => j.status === 'completed').length;

  res.json({
    totalExams,
    activeExams,
    totalStudents,
    totalProcessingJobs,
    completedJobs,
    successRate: totalProcessingJobs > 0 ? (completedJobs / totalProcessingJobs) * 100 : 0
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Integrated OMR Evaluation System',
    hackathon: 'Code4Edtech Challenge - Theme 1'
  });
});

// Get system information
app.get('/api/system/info', (req, res) => {
  res.json({
    service: 'Integrated OMR Evaluation System',
    version: '1.0.0',
    hackathon: 'Code4Edtech Challenge - Theme 1',
    organization: 'Innomatics Research Labs',
    capabilities: [
      'React Frontend Integration',
      'Express.js API Server',
      'Python OMR Processing',
      'Subject-wise Scoring',
      'Real-time Processing',
      'Batch Upload Support'
    ],
    subjects: ['Python', 'EDA', 'SQL', 'PowerBI', 'Statistics'],
    totalQuestions: 100,
    questionsPerSubject: 20,
    supportedFormats: ['JPG', 'PNG', 'JPEG'],
    maxFileSize: '10MB'
  });
});

// Direct OMR processing endpoint (for testing)
app.post('/api/omr/process-direct', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const examSet = req.body.examSet || 'setA';
    const pythonScript = path.join(__dirname, 'integrated_omr_service.py');
    
    // Process directly with integrated service using fast method
    const pythonProcess = spawn('python', [pythonScript, req.file.path, '--exam-set', examSet, '--method', 'fast']);
    
    let outputData = '';
    let errorData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      // Clean up uploaded file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('Failed to clean up uploaded file:', e.message);
      }
      
      if (code === 0) {
        try {
          const results = JSON.parse(outputData);
          res.json(results);
        } catch (parseError) {
          res.status(500).json({ error: 'Failed to parse OMR results' });
        }
      } else {
        res.status(500).json({ error: `Processing failed: ${errorData}` });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get visualization for a specific result
app.get('/api/visualization/:resultId', (req, res) => {
  try {
    const resultId = req.params.resultId;
    const result = results.find(r => r.id === resultId);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    // Return visualization URLs if available
    if (result.visualizations && Object.keys(result.visualizations).length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const visualizationUrls = {};
      
      Object.keys(result.visualizations).forEach(key => {
        const vizPath = result.visualizations[key];
        if (vizPath && typeof vizPath === 'string') {
          // Convert absolute path to relative URL
          const relativePath = vizPath.replace(__dirname, '').replace(/\\/g, '/');
          visualizationUrls[key] = `${baseUrl}${relativePath}`;
        }
      });
      
      res.json({
        success: true,
        resultId: resultId,
        visualizations: visualizationUrls,
        metadata: {
          studentId: result.studentId,
          fileName: result.fileName || 'Unknown',
          processingTime: result.processingTime || '< 1s',
          totalScore: result.score || 0,
          percentage: result.percentage || 0
        }
      });
    } else {
      // Generate visualization on-demand if not available
      res.json({
        success: true,
        resultId: resultId,
        visualizations: {
          detection_overlay: `/api/visualization/${resultId}/generate/overlay`,
          subject_chart: `/api/visualization/${resultId}/generate/chart`
        },
        metadata: {
          studentId: result.studentId,
          fileName: result.fileName || 'Unknown',
          processingTime: result.processingTime || '< 1s',
          totalScore: result.score || 0,
          percentage: result.percentage || 0
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate visualization on-demand
app.get('/api/visualization/:resultId/generate/:type', async (req, res) => {
  try {
    const { resultId, type } = req.params;
    const result = results.find(r => r.id === resultId);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    // Create mock visualization data for now
    const mockVisualizationData = {
      success: true,
      resultId: resultId,
      type: type,
      data: {
        totalScore: result.score || 0,
        percentage: result.percentage || 0,
        subjectScores: result.subjectScores || {},
        detectedResponses: result.answers || []
      },
      message: `${type} visualization generated successfully`
    };
    
    res.json(mockVisualizationData);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get processing statistics
app.get('/api/stats/processing', (req, res) => {
  const totalJobs = processingJobs.length;
  const completedJobs = processingJobs.filter(j => j.status === 'completed').length;
  const failedJobs = processingJobs.filter(j => j.status === 'failed').length;
  const processingJobs_active = processingJobs.filter(j => j.status === 'processing').length;
  
  const totalResults = results.length;
  const avgScore = totalResults > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / totalResults : 0;
  
  // Subject-wise statistics
  const subjectStats = {};
  ['Python', 'EDA', 'SQL', 'PowerBI', 'Statistics'].forEach(subject => {
    const subjectScores = results
      .filter(r => r.subjectScores && r.subjectScores[subject])
      .map(r => r.subjectScores[subject].percentage);
    
    subjectStats[subject] = {
      totalStudents: subjectScores.length,
      averageScore: subjectScores.length > 0 ? subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length : 0,
      maxScore: subjectScores.length > 0 ? Math.max(...subjectScores) : 0,
      minScore: subjectScores.length > 0 ? Math.min(...subjectScores) : 0
    };
  });
  
  res.json({
    processing: {
      totalJobs,
      completed: completedJobs,
      failed: failedJobs,
      active: processingJobs_active,
      successRate: totalJobs > 0 ? (completedJobs / totalJobs * 100).toFixed(1) : 0
    },
    results: {
      totalStudents: totalResults,
      averageScore: avgScore.toFixed(1),
      subjectStatistics: subjectStats
    },
    timestamp: new Date().toISOString()
  });
});

// Root route for server health check
app.get('/', (req, res) => {
  res.json({
    message: 'OMR Evaluation Server is running',
    status: 'healthy',
    version: '2.1.0',
    endpoints: {
      health: '/api/health',
      exams: '/api/exams',
      process: '/api/process',
      results: '/api/results',
      stats: '/api/stats/processing',
      visualization: '/api/visualization/:resultId'
    },
    timestamp: new Date().toISOString()
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`OMR Evaluation Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});