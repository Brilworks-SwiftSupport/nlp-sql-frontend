// pages/api/chatbot-widget.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Read the widget JS file from the public directory
    const filePath = path.join(process.cwd(), 'public', 'chatbot-widget.js');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Set the correct content type
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(fileContents);
  } catch (error) {
    console.error('Error serving chatbot-widget.js:', error);
    res.status(500).json({ error: 'Failed to serve widget script' });
  }
}