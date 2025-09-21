// Netlify Function for System Information
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

  const systemInfo = {
    service: "OMR Evaluation System",
    version: "1.0.0",
    hackathon: "Code4Edtech",
    organization: "Innomatics Research Labs",
    capabilities: [
      "Automated OMR Processing",
      "Multi-Subject Evaluation",
      "Real-time Results",
      "Export Functionality",
      "Statistical Analysis"
    ],
    subjects: ["Python", "EDA", "SQL", "PowerBI", "Statistics"],
    totalQuestions: 100,
    questionsPerSubject: 20,
    supportedFormats: ["JPG", "PNG", "JPEG"],
    maxFileSize: "10MB",
    processingMethod: "JavaScript Simulation",
    deployment: "Netlify Functions",
    timestamp: new Date().toISOString()
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(systemInfo),
  };
};
