const express = require('express');
const router = express.Router();
const { createCalendarEvent } = require('../utils/calendar');

// POST /api/calendar/book - Book an appointment
router.post('/book', async (req, res) => {
  try {
    const { clientName, service, date, time, email, phone, language = 'en' } = req.body;
    
    if (!clientName || !service || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientName, service, date, time'
      });
    }
    
    console.log(`📅 Booking appointment: ${clientName} - ${service} on ${date} at ${time}`);
    
    // Create calendar event
    const calendarResult = await createCalendarEvent({
      clientName,
      service,
      date,
      time,
      email: email || 'Not provided',
      phone: phone || 'Not provided'
    });
    
    if (calendarResult.success) {
      const response = language === 'es' 
        ? `¡Perfecto ${clientName}! Tu cita para ${service} está confirmada para ${date} a las ${time}. Te enviaremos un recordatorio por email. ¿Hay algo más en lo que pueda ayudarte?`
        : `Perfect ${clientName}! Your appointment for ${service} is confirmed for ${date} at ${time}. We'll send you an email reminder. Is there anything else I can help you with?`;
      
      res.json({
        success: true,
        response: response,
        appointment: {
          clientName,
          service,
          date,
          time,
          email,
          phone,
          calendarEventId: calendarResult.eventId
        }
      });
    } else {
      const errorResponse = language === 'es'
        ? 'Lo siento, hubo un error al procesar tu cita. Por favor, intenta de nuevo o llámanos directamente.'
        : 'I\'m sorry, there was an error processing your appointment. Please try again or call us directly.';
      
      res.json({
        success: false,
        response: errorResponse,
        error: calendarResult.error
      });
    }
    
  } catch (error) {
    console.error('Error booking appointment:', error);
    
    const errorResponse = req.body.language === 'es'
      ? 'Lo siento, hubo un error al procesar tu cita. Por favor, intenta de nuevo.'
      : 'I\'m sorry, there was an error processing your appointment. Please try again.';
    
    res.status(500).json({
      success: false,
      response: errorResponse,
      error: error.message
    });
  }
});

// GET /api/calendar/available - Get available times for a date
router.get('/available', async (req, res) => {
  try {
    const { date, language = 'en' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }
    
    // This would integrate with Google Calendar to check availability
    // For now, return default business hours
    const availableTimes = [
      '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30'
    ];
    
    const response = language === 'es'
      ? `Para ${date}, tenemos horarios disponibles: ${availableTimes.join(', ')}. ¿Qué horario prefieres?`
      : `For ${date}, we have available times: ${availableTimes.join(', ')}. What time would you prefer?`;
    
    res.json({
      success: true,
      response: response,
      date: date,
      availableTimes: availableTimes
    });
    
  } catch (error) {
    console.error('Error getting available times:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available times'
    });
  }
});

// POST /api/calendar/parse-datetime - Parse date and time from natural language
router.post('/parse-datetime', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    // Parse date and time from natural language
    const parsedDateTime = parseDateTimeFromText(text);
    
    if (parsedDateTime.date && parsedDateTime.time) {
      const response = language === 'es'
        ? `Perfecto, entiendo que quieres una cita para ${parsedDateTime.date} a las ${parsedDateTime.time}. ¿Cuál es tu nombre y qué servicio te gustaría?`
        : `Perfect, I understand you want an appointment for ${parsedDateTime.date} at ${parsedDateTime.time}. What's your name and what service would you like?`;
      
      res.json({
        success: true,
        response: response,
        parsedDateTime: parsedDateTime
      });
    } else {
      const errorResponse = language === 'es'
        ? 'Lo siento, no pude entender la fecha y hora. Por favor, dime algo como "mañana a las 2 de la tarde" o "el viernes a las 10 de la mañana".'
        : 'Sorry, I couldn\'t understand the date and time. Please tell me something like "tomorrow at 2 PM" or "Friday at 10 AM".';
      
      res.json({
        success: false,
        response: errorResponse,
        needsClarification: true
      });
    }
    
  } catch (error) {
    console.error('Error parsing date/time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse date/time'
    });
  }
});

// Helper function to parse date and time from text
function parseDateTimeFromText(text) {
  const normalizedText = text.toLowerCase();
  
  // Date patterns
  const datePatterns = {
    'tomorrow': () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    },
    'today': () => {
      return new Date().toISOString().split('T')[0];
    },
    'friday': () => {
      const friday = new Date();
      const daysUntilFriday = (5 - friday.getDay() + 7) % 7;
      friday.setDate(friday.getDate() + daysUntilFriday);
      return friday.toISOString().split('T')[0];
    },
    'monday': () => {
      const monday = new Date();
      const daysUntilMonday = (1 - monday.getDay() + 7) % 7;
      monday.setDate(monday.getDate() + daysUntilMonday);
      return monday.toISOString().split('T')[0];
    }
  };
  
  // Time patterns
  const timePatterns = {
    '2 pm': '14:00',
    '2:00 pm': '14:00',
    '2:30 pm': '14:30',
    '10 am': '10:00',
    '10:00 am': '10:00',
    '10:30 am': '10:30',
    '3 pm': '15:00',
    '3:00 pm': '15:00',
    '3:30 pm': '15:30',
    '4 pm': '16:00',
    '4:00 pm': '16:00',
    '4:30 pm': '16:30',
    '5 pm': '17:00',
    '5:00 pm': '17:00',
    '5:30 pm': '17:30'
  };
  
  let date = null;
  let time = null;
  
  // Extract date
  for (const [pattern, handler] of Object.entries(datePatterns)) {
    if (normalizedText.includes(pattern)) {
      date = handler();
      break;
    }
  }
  
  // Extract time
  for (const [pattern, timeStr] of Object.entries(timePatterns)) {
    if (normalizedText.includes(pattern)) {
      time = timeStr;
      break;
    }
  }
  
  return { date, time };
}

module.exports = router; 