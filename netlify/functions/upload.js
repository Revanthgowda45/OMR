// Netlify Function for File Upload
const multipart = require('lambda-multipart-parser');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

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
    const result = await multipart.parse(event);
    
    // Simulate file processing
    const files = result.files || [];
    const examId = result.examId || 'default-exam';
    
    const processedFiles = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      filename: file.filename || `uploaded-file-${index}.jpg`,
      originalname: file.filename || `uploaded-file-${index}.jpg`,
      path: `/uploads/${file.filename || `uploaded-file-${index}.jpg`}`,
      size: file.content ? file.content.length : 0,
      mimetype: file.contentType || 'image/jpeg',
      examId: examId
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Successfully uploaded ${processedFiles.length} file(s)`,
        files: processedFiles,
        examId: examId,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Upload error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        message: 'File upload failed',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
