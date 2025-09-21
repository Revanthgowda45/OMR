// Netlify Function for OMR Processing
// This replaces the Python backend with JavaScript for web deployment

const multipart = require('lambda-multipart-parser');

// Mock answer keys - in production, load from external source
const answerKeys = {
  setA: {
    rawAnswers: [
      // Python (1-20)
      "b", "a", "c", "d", "b", "a", "c", "b", "d", "a",
      "c", "b", "d", "a", "c", "a", "d", "b", "c", "a",
      // EDA (21-40)
      "a", "c", "b", "d", "a", "c", "b", "a", "d", "c",
      "b", "a", "d", "c", "b", "a", "c", "d", "b", "a",
      // SQL (41-60)
      "c", "a", "b", "d", "c", "a", "b", "c", "d", "a",
      "b", "c", "a", "d", "b", "c", "a", "d", "b", "a",
      // PowerBI (61-80)
      "d", "b", "a", "c", "d", "b", "a", "d", "c", "b",
      "a", "d", "c", "b", "a", "d", "c", "b", "a", "d",
      // Statistics (81-100)
      "a", "d", "c", "b", "a", "d", "c", "a", "b", "d",
      "c", "a", "b", "d", "c", "a", "b", "d", "c", "a"
    ],
    specialCases: {
      "16": { acceptedAnswers: ["a", "b", "c", "d"] },
      "59": { acceptedAnswers: ["a", "b"] }
    }
  },
  setB: {
    rawAnswers: [
      // Python (1-20)
      "c", "b", "d", "a", "c", "b", "d", "c", "a", "b",
      "d", "c", "a", "b", "d", "b", "a", "c", "d", "b",
      // EDA (21-40)
      "b", "d", "c", "a", "b", "d", "c", "b", "a", "d",
      "c", "b", "a", "d", "c", "b", "d", "a", "c", "b",
      // SQL (41-60)
      "d", "b", "c", "a", "d", "b", "c", "d", "a", "b",
      "c", "d", "b", "a", "c", "d", "b", "a", "c", "b",
      // PowerBI (61-80)
      "a", "c", "b", "d", "a", "c", "b", "a", "d", "c",
      "b", "a", "d", "c", "b", "a", "d", "c", "b", "a",
      // Statistics (81-100)
      "b", "a", "d", "c", "b", "a", "d", "b", "c", "a",
      "d", "b", "c", "a", "d", "b", "c", "a", "d", "b"
    ],
    specialCases: {
      "16": { acceptedAnswers: ["a", "b", "c", "d"] },
      "59": { acceptedAnswers: ["a", "b"] }
    }
  }
};

function simulateOMRProcessing(examSet = 'setA') {
  const correctAnswers = answerKeys[examSet]?.rawAnswers || answerKeys.setA.rawAnswers;
  const responses = [];
  
  // Simulate 85% accuracy for demo
  for (let i = 0; i < 100; i++) {
    const correctAnswer = correctAnswers[i];
    if (Math.random() < 0.85) {
      responses.push(correctAnswer);
    } else {
      // Random wrong answer
      const options = ['a', 'b', 'c', 'd'];
      const wrongOptions = options.filter(opt => opt !== correctAnswer);
      responses.push(wrongOptions[Math.floor(Math.random() * wrongOptions.length)]);
    }
  }
  
  return responses;
}

function getSubjectForQuestion(questionNum) {
  if (questionNum >= 1 && questionNum <= 20) return "Python";
  if (questionNum >= 21 && questionNum <= 40) return "EDA";
  if (questionNum >= 41 && questionNum <= 60) return "SQL";
  if (questionNum >= 61 && questionNum <= 80) return "PowerBI";
  if (questionNum >= 81 && questionNum <= 100) return "Statistics";
  return "Unknown";
}

function evaluateResponses(responses, examSet) {
  const answerKey = answerKeys[examSet] || answerKeys.setA;
  const correctAnswers = answerKey.rawAnswers;
  const specialCases = answerKey.specialCases || {};
  
  const results = {
    totalQuestions: 100,
    totalScore: 0,
    percentage: 0.0,
    subjectScores: {},
    detailedResults: [],
    summary: {
      correct: 0,
      incorrect: 0,
      unanswered: 0
    }
  };
  
  // Initialize subject scores
  const subjects = ["Python", "EDA", "SQL", "PowerBI", "Statistics"];
  subjects.forEach(subject => {
    results.subjectScores[subject] = {
      correct: 0,
      total: 20,
      percentage: 0.0,
      questions: []
    };
  });
  
  // Evaluate each question
  for (let i = 0; i < 100; i++) {
    const questionNum = i + 1;
    const subject = getSubjectForQuestion(questionNum);
    const studentAnswer = responses[i] || "";
    const correctAnswer = correctAnswers[i];
    
    let isCorrect = false;
    let status = "incorrect";
    
    if (!studentAnswer || studentAnswer.trim() === "") {
      status = "unanswered";
      results.summary.unanswered++;
    } else {
      // Handle special cases
      if (specialCases[questionNum.toString()]) {
        const acceptedAnswers = specialCases[questionNum.toString()].acceptedAnswers;
        isCorrect = acceptedAnswers.includes(studentAnswer.toLowerCase());
      } else {
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
      }
      
      if (isCorrect) {
        status = "correct";
        results.totalScore++;
        results.summary.correct++;
        results.subjectScores[subject].correct++;
      } else {
        results.summary.incorrect++;
      }
    }
    
    // Add to detailed results
    results.detailedResults.push({
      questionNumber: questionNum,
      subject: subject,
      studentAnswer: studentAnswer,
      correctAnswer: correctAnswer,
      isCorrect: isCorrect,
      status: status
    });
    
    // Add to subject questions
    results.subjectScores[subject].questions.push({
      questionNumber: questionNum,
      isCorrect: isCorrect,
      status: status
    });
  }
  
  // Calculate percentages
  results.percentage = (results.totalScore / 100) * 100;
  
  Object.keys(results.subjectScores).forEach(subject => {
    const subjectData = results.subjectScores[subject];
    subjectData.percentage = (subjectData.correct / subjectData.total) * 100;
  });
  
  return results;
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse multipart form data
    const result = await multipart.parse(event);
    
    // Get exam set from form data
    const examSet = result.examSet || 'setA';
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate OMR detection
    const detectedResponses = simulateOMRProcessing(examSet);
    
    // Evaluate responses
    const evaluation = evaluateResponses(detectedResponses, examSet);
    
    // Generate results
    const processingResults = {
      success: true,
      imageProcessed: result.files?.[0]?.filename || 'uploaded-image.jpg',
      examSet: examSet,
      detectedResponses: detectedResponses,
      evaluation: evaluation,
      processingMethod: "JavaScript Simulation",
      processingTime: 2.0,
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(processingResults),
    };

  } catch (error) {
    console.error('Processing error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
