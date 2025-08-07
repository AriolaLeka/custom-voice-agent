const { generateResponse } = require('./nlp');

// Generate voice response based on intent
async function generateVoiceResponse(intent, language = 'en') {
  try {
    const response = await generateResponse(intent, language);
    
    return {
      text: response,
      language: language,
      intent: intent.type,
      confidence: intent.confidence
    };
    
  } catch (error) {
    console.error('Error generating voice response:', error);
    
    const fallbackResponse = language === 'es' 
      ? 'Lo siento, hubo un error procesando tu solicitud. ¿Podrías intentar de nuevo?'
      : 'I\'m sorry, there was an error processing your request. Could you please try again?';
    
    return {
      text: fallbackResponse,
      language: language,
      intent: 'error',
      confidence: 0
    };
  }
}

// Format text for speech synthesis
function formatForSpeech(text, language = 'en') {
  // Remove special characters that might cause TTS issues
  let formatted = text
    .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Add pauses for better speech flow
  formatted = formatted
    .replace(/\./g, ' . ')
    .replace(/,/g, ' , ')
    .replace(/!/g, ' ! ')
    .replace(/\?/g, ' ? ');
  
  // Clean up extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
}

// Generate appointment booking response
async function generateAppointmentResponse(appointmentData, language = 'en') {
  const { clientName, service, date, time, email } = appointmentData;
  
  if (language === 'es') {
    return {
      text: `Perfecto ${clientName}! Tu cita para ${service} está confirmada para ${date} a las ${time}. Te enviaremos un recordatorio por email. ¿Hay algo más en lo que pueda ayudarte?`,
      completed: true
    };
  } else {
    return {
      text: `Perfect ${clientName}! Your appointment for ${service} is confirmed for ${date} at ${time}. We'll send you an email reminder. Is there anything else I can help you with?`,
      completed: true
    };
  }
}

// Generate hours response
function generateHoursResponse(language = 'en') {
  const hours = {
    monday: '10:00 AM - 6:00 PM',
    tuesday: '10:00 AM - 6:00 PM',
    wednesday: '10:00 AM - 6:00 PM',
    thursday: '10:00 AM - 6:00 PM',
    friday: '10:00 AM - 6:00 PM',
    saturday: 'Closed',
    sunday: 'Closed'
  };
  
  if (language === 'es') {
    return {
      text: `Nuestros horarios son de lunes a viernes de 10:00 AM a 6:00 PM. Estamos cerrados los sábados y domingos. ¿Te gustaría hacer una cita?`,
      hours: hours
    };
  } else {
    return {
      text: `Our hours are Monday through Friday from 10:00 AM to 6:00 PM. We are closed on Saturdays and Sundays. Would you like to make an appointment?`,
      hours: hours
    };
  }
}

// Generate location response
function generateLocationResponse(language = 'en') {
  const address = 'Calle Santos Justo y Pastor 72, Valencia, Spain';
  
  if (language === 'es') {
    return {
      text: `Estamos ubicados en ${address}. Estamos cerca de la zona de la salud y de la iglesia de Santos Justo y Pastor. ¿Te gustaría que te ayude con las direcciones?`,
      address: address
    };
  } else {
    return {
      text: `We are located at ${address}. We are near the health district and the Santos Justo y Pastor church. Would you like help with directions?`,
      address: address
    };
  }
}

// Generate price response
async function generatePriceResponse(service, language = 'en') {
  // This would integrate with your existing service data
  const priceInfo = await getServicePrice(service);
  
  if (language === 'es') {
    return {
      text: `Para ${service}, los precios varían desde ${priceInfo.minPrice}€ hasta ${priceInfo.maxPrice}€. ¿Te gustaría más información sobre las opciones específicas?`,
      prices: priceInfo
    };
  } else {
    return {
      text: `For ${service}, prices range from ${priceInfo.minPrice}€ to ${priceInfo.maxPrice}€. Would you like more information about specific options?`,
      prices: priceInfo
    };
  }
}

// Get service price information
async function getServicePrice(service) {
  // This would integrate with your existing products.json
  // For now, return default values
  return {
    minPrice: 15,
    maxPrice: 50,
    currency: 'EUR'
  };
}

// Process appointment input
async function processAppointmentInput(text, language = 'en') {
  const normalizedText = text.toLowerCase();
  
  // Extract date and time
  const dateTime = extractDateTime(normalizedText);
  
  // Extract service
  const service = extractService(normalizedText);
  
  // Extract name (this would be more sophisticated in a real implementation)
  const name = extractName(normalizedText);
  
  return {
    date: dateTime.date,
    time: dateTime.time,
    service: service,
    clientName: name,
    language: language
  };
}

// Extract date and time from text
function extractDateTime(text) {
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
    }
  };
  
  const timePatterns = {
    '2 pm': '14:00',
    '2:00 pm': '14:00',
    '10 am': '10:00',
    '10:00 am': '10:00',
    '3 pm': '15:00',
    '3:00 pm': '15:00'
  };
  
  let date = null;
  let time = null;
  
  // Extract date
  for (const [pattern, handler] of Object.entries(datePatterns)) {
    if (text.includes(pattern)) {
      date = handler();
      break;
    }
  }
  
  // Extract time
  for (const [pattern, timeStr] of Object.entries(timePatterns)) {
    if (text.includes(pattern)) {
      time = timeStr;
      break;
    }
  }
  
  return { date, time };
}

// Extract service from text
function extractService(text) {
  const services = ['manicure', 'pedicure', 'eyelashes', 'eyebrows', 'facial'];
  
  for (const service of services) {
    if (text.includes(service)) {
      return service;
    }
  }
  
  return 'general service';
}

// Extract name from text
function extractName(text) {
  // This is a simplified name extraction
  // In a real implementation, you'd use more sophisticated NLP
  const namePatterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /call me (\w+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return 'Guest';
}

// Handle appointment booking
async function handleAppointmentBooking(appointmentData, language = 'en') {
  try {
    // Here you would integrate with Google Calendar
    // For now, we'll just return a success response
    
    const response = await generateAppointmentResponse(appointmentData, language);
    return response;
    
  } catch (error) {
    console.error('Error handling appointment booking:', error);
    
    if (language === 'es') {
      return {
        text: 'Lo siento, hubo un error al procesar tu cita. Por favor, intenta de nuevo o llámanos directamente.',
        completed: false
      };
    } else {
      return {
        text: 'I\'m sorry, there was an error processing your appointment. Please try again or call us directly.',
        completed: false
      };
    }
  }
}

module.exports = {
  generateVoiceResponse,
  formatForSpeech,
  generateAppointmentResponse,
  generateHoursResponse,
  generateLocationResponse,
  generatePriceResponse,
  processAppointmentInput,
  handleAppointmentBooking
}; 