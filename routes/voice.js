const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { processVoiceInput } = require('../utils/nlp');
const { generateVoiceResponse } = require('../utils/speech');

// Initialize Twilio client (optional for development)
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio client initialized');
  } else {
    console.log('⚠️  Twilio credentials not found or invalid, voice calls disabled');
  }
} catch (error) {
  console.log('⚠️  Twilio initialization failed:', error.message);
}

// POST /api/voice/incoming - Handle incoming Twilio calls
router.post('/incoming', async (req, res) => {
  try {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Welcome message
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Hello! Welcome to Hera\'s Nails and Lashes beauty salon in Valencia. I\'m here to help you with our services, hours, location, and appointments. How can I assist you today?');
    
    // Start speech recognition
    twiml.gather({
      input: 'speech',
      language: 'en-US',
      speechTimeout: 'auto',
      action: '/api/voice/process',
      method: 'POST',
      enhanced: true
    });
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error handling incoming call:', error);
    res.status(500).send('Error processing call');
  }
});

// POST /api/voice/process - Process speech input
router.post('/process', async (req, res) => {
  try {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const language = req.body.Language || 'en-US';
    
    console.log(`📞 Processing call ${callSid}: "${speechResult}"`);
    
    // Process the speech input
    const intent = await processVoiceInput(speechResult, language);
    const response = await generateVoiceResponse(intent, language);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Speak the response
    twiml.say({
      voice: 'alice',
      language: language
    }, response.text);
    
    // If this is an appointment booking, continue the flow
    if (intent.type === 'appointment_booking') {
      twiml.gather({
        input: 'speech',
        language: language,
        speechTimeout: 'auto',
        action: '/api/voice/appointment',
        method: 'POST',
        enhanced: true
      });
    } else {
      // End call or ask for more input
      twiml.gather({
        input: 'speech',
        language: language,
        speechTimeout: 'auto',
        action: '/api/voice/process',
        method: 'POST',
        enhanced: true
      });
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error processing speech:', error);
    
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'I\'m sorry, I didn\'t understand that. Could you please repeat?');
    
    twiml.gather({
      input: 'speech',
      language: 'en-US',
      speechTimeout: 'auto',
      action: '/api/voice/process',
      method: 'POST',
      enhanced: true
    });
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// POST /api/voice/appointment - Handle appointment booking flow
router.post('/appointment', async (req, res) => {
  try {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const language = req.body.Language || 'en-US';
    
    console.log(`📅 Appointment booking: "${speechResult}"`);
    
    // Process appointment details
    const appointmentData = await processAppointmentInput(speechResult, language);
    const response = await handleAppointmentBooking(appointmentData, language);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'alice',
      language: language
    }, response.text);
    
    // End call or continue
    if (response.completed) {
      twiml.say('Thank you for calling Hera\'s Nails and Lashes. Have a wonderful day!');
      twiml.hangup();
    } else {
      twiml.gather({
        input: 'speech',
        language: language,
        speechTimeout: 'auto',
        action: '/api/voice/appointment',
        method: 'POST',
        enhanced: true
      });
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error processing appointment:', error);
    
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'I\'m sorry, there was an error processing your appointment. Please try again or call us directly.');
    
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// POST /api/voice/status - Handle call status updates
router.post('/status', (req, res) => {
  const callStatus = req.body.CallStatus;
  const callSid = req.body.CallSid;
  
  console.log(`📞 Call ${callSid} status: ${callStatus}`);
  
  // Log call analytics
  if (callStatus === 'completed') {
    console.log(`✅ Call ${callSid} completed successfully`);
  } else if (callStatus === 'failed') {
    console.log(`❌ Call ${callSid} failed`);
  }
  
  res.sendStatus(200);
});

// GET /api/voice/calls - Get call history
router.get('/calls', async (req, res) => {
  try {
    const calls = await twilioClient.calls.list({
      limit: 20
    });
    
    res.json({
      success: true,
      calls: calls.map(call => ({
        sid: call.sid,
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        from: call.from,
        to: call.to
      }))
    });
    
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch call history'
    });
  }
});

module.exports = router; 