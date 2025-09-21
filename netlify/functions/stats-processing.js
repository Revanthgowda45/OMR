// Netlify Function for Processing Statistics
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Generate mock statistics for demo
  const stats = {
    processing: {
      totalJobs: Math.floor(Math.random() * 100) + 50,
      completed: Math.floor(Math.random() * 80) + 40,
      failed: Math.floor(Math.random() * 5),
      active: Math.floor(Math.random() * 10),
      successRate: "95.2%"
    },
    results: {
      totalStudents: Math.floor(Math.random() * 200) + 100,
      averageScore: "76.8%",
      subjectStatistics: {
        "Python": {
          totalStudents: Math.floor(Math.random() * 200) + 100,
          averageScore: Math.floor(Math.random() * 30) + 60,
          maxScore: Math.floor(Math.random() * 10) + 90,
          minScore: Math.floor(Math.random() * 40) + 20
        },
        "EDA": {
          totalStudents: Math.floor(Math.random() * 200) + 100,
          averageScore: Math.floor(Math.random() * 30) + 60,
          maxScore: Math.floor(Math.random() * 10) + 90,
          minScore: Math.floor(Math.random() * 40) + 20
        },
        "SQL": {
          totalStudents: Math.floor(Math.random() * 200) + 100,
          averageScore: Math.floor(Math.random() * 30) + 60,
          maxScore: Math.floor(Math.random() * 10) + 90,
          minScore: Math.floor(Math.random() * 40) + 20
        },
        "PowerBI": {
          totalStudents: Math.floor(Math.random() * 200) + 100,
          averageScore: Math.floor(Math.random() * 30) + 60,
          maxScore: Math.floor(Math.random() * 10) + 90,
          minScore: Math.floor(Math.random() * 40) + 20
        },
        "Statistics": {
          totalStudents: Math.floor(Math.random() * 200) + 100,
          averageScore: Math.floor(Math.random() * 30) + 60,
          maxScore: Math.floor(Math.random() * 10) + 90,
          minScore: Math.floor(Math.random() * 40) + 20
        }
      }
    },
    timestamp: new Date().toISOString()
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(stats),
  };
};
