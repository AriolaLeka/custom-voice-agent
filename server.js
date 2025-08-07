const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const voiceRoutes = require('./routes/voice');
const nlpRoutes = require('./routes/nlp');
const calendarRoutes = require('./routes/calendar');

// Routes
app.use('/api/voice', voiceRoutes);
app.use('/api/nlp', nlpRoutes);
app.use('/api/calendar', calendarRoutes);

// Serve static files
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Hera Voice Bot'
  });
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎯 Hera Voice Bot Server running on port ${PORT}`);
  console.log(`📞 Twilio Voice Integration: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🗓️ Google Calendar: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}`);
});

module.exports = app; 