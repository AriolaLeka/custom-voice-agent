const fs = require('fs').promises;
const path = require('path');

// Load data files
let salonData = null;
let intents = null;
let scheduleData = null;

async function loadData() {
  if (!salonData) {
    try {
      const dataPath = path.join(__dirname, '..', 'data', 'products.json');
      const data = await fs.readFile(dataPath, 'utf8');
      salonData = JSON.parse(data);
    } catch (error) {
      console.error('Error loading salon data:', error);
      salonData = { services: [] };
    }
  }
  
  if (!scheduleData) {
    try {
      const schedulePath = path.join(__dirname, '..', 'data', 'schedule.json');
      const data = await fs.readFile(schedulePath, 'utf8');
      scheduleData = JSON.parse(data);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      scheduleData = { business_hours: {}, location: {} };
    }
  }
  
  if (!intents) {
    try {
      const intentsPath = path.join(__dirname, '..', 'data', 'intents.json');
      const data = await fs.readFile(intentsPath, 'utf8');
      const intentsData = JSON.parse(data);
      
      // Convert the intents.json structure to the expected format
      intents = {
        patterns: {},
        responses: {}
      };
      
      // Convert intents.intents to intents.patterns
      if (intentsData.intents) {
        for (const [intentType, intentData] of Object.entries(intentsData.intents)) {
          intents.patterns[intentType] = intentData.patterns || [];
          intents.responses[intentType] = intentData.responses || {};
        }
      }
    } catch (error) {
      console.error('Error loading intents:', error);
      intents = getDefaultIntents();
    }
  }
  
  return { salonData, intents, scheduleData };
}

function getDefaultIntents() {
  return {
    patterns: {
      'service_inquiry': [
        'what services do you offer',
        'what services do you have',
        'tell me about your services',
        'what do you do',
        'services',
        'qué servicios ofrecen',
        'qué servicios tienen',
        'cuéntame sobre sus servicios',
        'qué hacen'
      ],
      'price_inquiry': [
        'how much',
        'what is the price',
        'cost',
        'price',
        'pricing',
        'rates',
        'cuánto cuesta',
        'cuál es el precio',
        'precio',
        'costos',
        'tarifas'
      ],
      'hours_inquiry': [
        'what are your hours',
        'when are you open',
        'business hours',
        'schedule',
        'opening times',
        'cuáles son sus horarios',
        'cuándo están abiertos',
        'horarios',
        'horario de atención'
      ],
      'location_inquiry': [
        'where are you located',
        'address',
        'location',
        'directions',
        'how to get there',
        'dónde están ubicados',
        'dirección',
        'ubicación',
        'cómo llegar'
      ],
      'appointment_booking': [
        'book an appointment',
        'make an appointment',
        'schedule',
        'reserve',
        'booking',
        'reservar una cita',
        'hacer una cita',
        'agendar',
        'reserva'
      ],
      'greeting': [
        'hello',
        'hi',
        'good morning',
        'good afternoon',
        'good evening',
        'hola',
        'buenos días',
        'buenas tardes',
        'buenas noches'
      ],
      'goodbye': [
        'goodbye',
        'bye',
        'thank you',
        'thanks',
        'see you',
        'see you later',
        'adiós',
        'hasta luego',
        'gracias',
        'nos vemos',
        'hasta la vista'
      ]
    },
    responses: {
      'greeting': {
        en: 'Hello! Welcome to Hera\'s Nails and Lashes. How can I help you today?',
        es: '¡Hola! Bienvenido a Hera\'s Nails and Lashes. ¿En qué puedo ayudarte hoy?'
      },
      'goodbye': {
        en: 'Thank you for calling Hera\'s Nails and Lashes. Have a wonderful day!',
        es: 'Gracias por llamar a Hera\'s Nails and Lashes. ¡Que tengas un buen día!'
      }
    }
  };
}

// Enhanced intent detection with better pattern matching
async function processVoiceInput(text, language = 'en') {
  const { intents } = await loadData();
  const normalizedText = text.toLowerCase().trim();
  
  console.log(`🔍 Processing: "${normalizedText}" (${language})`);
  
  // Detect language if not specified
  const detectedLanguage = language === 'auto' ? detectLanguage(normalizedText) : language;
  
  // Enhanced intent detection with priority order
  const intentsToCheck = [
    'greeting',
    'goodbye',
    'specific_appointment',
    'appointment_booking',
    'service_inquiry',
    'specific_service',
    'price_inquiry',
    'hours_inquiry',
    'location_inquiry',
    'parking_inquiry',
    'transport_inquiry',
    'detailed_service_info',
    'general_inquiry'
  ];
  
  for (const intentType of intentsToCheck) {
    const intent = await checkIntent(normalizedText, intentType, detectedLanguage);
    if (intent) {
      return intent;
    }
  }
  
  // Default to general inquiry
  console.log(`❓ No specific intent detected, defaulting to general inquiry`);
  return {
    type: 'general_inquiry',
    confidence: 0.5,
    language: detectedLanguage,
    originalText: text,
    entities: extractEntities(normalizedText, 'general_inquiry')
  };
}

// Check specific intent with enhanced pattern matching
async function checkIntent(text, intentType, language) {
  const { intents } = await loadData();
  
  // Get patterns for this intent
  const patterns = intents.patterns[intentType] || [];
  
  // Check for exact matches first
  for (const pattern of patterns) {
    if (text.includes(pattern.toLowerCase())) {
      console.log(`✅ Intent detected: ${intentType} (matched: ${pattern})`);
      return {
        type: intentType,
        confidence: 0.9,
        language: language,
        originalText: text,
        entities: extractEntities(text, intentType)
      };
    }
  }
  
  // Check for service-specific intents
  if (intentType === 'specific_service') {
    const serviceIntent = await detectServiceIntent(text, language);
    if (serviceIntent) {
      return serviceIntent;
    }
  }
  
  // Check for detailed service information requests
  if (intentType === 'detailed_service_info') {
    const detailedIntent = await detectDetailedServiceIntent(text, language);
    if (detailedIntent) {
      return detailedIntent;
    }
  }
  
  // Check for specific appointment requests
  if (intentType === 'specific_appointment') {
    const appointmentIntent = await detectSpecificAppointmentIntent(text, language);
    if (appointmentIntent) {
      return appointmentIntent;
    }
  }
  
  // Check for parking and transport inquiries
  if (intentType === 'parking_inquiry') {
    if (text.includes('parking') || text.includes('estacionamiento') || text.includes('aparcamiento')) {
      return {
        type: 'parking_inquiry',
        confidence: 0.8,
        language: language,
        originalText: text,
        entities: []
      };
    }
  }
  
  if (intentType === 'transport_inquiry') {
    if (text.includes('transport') || text.includes('bus') || text.includes('metro') || 
        text.includes('transporte') || text.includes('autobús') || text.includes('metro')) {
      return {
        type: 'transport_inquiry',
        confidence: 0.8,
        language: language,
        originalText: text,
        entities: []
      };
    }
  }
  
  return null;
}

// Detect language from text
function detectLanguage(text) {
  const spanishWords = ['hola', 'gracias', 'por', 'qué', 'cómo', 'dónde', 'cuándo', 'cuánto', 'servicios', 'precio', 'horarios'];
  const hasSpanishWords = spanishWords.some(word => text.includes(word));
  
  return hasSpanishWords ? 'es' : 'en';
}

// Enhanced entity extraction
function extractEntities(text, intentType) {
  const entities = [];
  
  // Extract service names with comprehensive mappings
  const serviceMappings = {
    'manicure': ['manicure', 'manicuras', 'manicura', 'manicures'],
    'pedicure': ['pedicure', 'pedicuras', 'pedicura', 'pedicures'],
    'eyebrows': ['eyebrows', 'cejas', 'ceja', 'eyebrow'],
    'eyelashes': ['eyelashes', 'pestañas', 'pestaña', 'eyelash', 'lash', 'lashes'],
    'facial': ['facial', 'faciales', 'facials'],
    'nails': ['nails', 'uñas', 'uña', 'nail'],
    'micropigmentation': ['micropigmentación', 'micropigmentation'],
    'pack': ['pack', 'packs', 'paquete', 'paquetes'],
    'spa': ['spa', 'spa manos', 'spa de pies'],
    'lifting': ['lifting', 'lifting de pestañas'],
    'laminado': ['laminado', 'laminado de cejas'],
    'diseño': ['diseño', 'diseños', 'francesa'],
    'semipermanente': ['semipermanente', 'semi-permanente'],
    'gel': ['gel', 'uñas gel', 'extensiones gel'],
    'depilación': ['depilación', 'depilacion', 'depilación con hilo'],
    'tinte': ['tinte', 'tinte de pestañas', 'tinte de cejas']
  };
  
  for (const [englishTerm, terms] of Object.entries(serviceMappings)) {
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) {
        entities.push({ type: 'service', value: englishTerm });
        break;
      }
    }
  }
  
  // Extract time references
  const timeKeywords = ['tomorrow', 'today', 'friday', 'monday', 'next week', 'mañana', 'hoy', 'viernes', 'lunes', 'próxima semana'];
  for (const time of timeKeywords) {
    if (text.includes(time.toLowerCase())) {
      entities.push({ type: 'time', value: time });
    }
  }
  
  // Extract price-related terms
  const priceKeywords = ['price', 'cost', 'how much', 'precio', 'costo', 'cuánto'];
  for (const price of priceKeywords) {
    if (text.includes(price.toLowerCase())) {
      entities.push({ type: 'price', value: price });
    }
  }
  
  return entities;
}

// Enhanced service intent detection
async function detectServiceIntent(text, language) {
  const { salonData } = await loadData();
  
  // Create comprehensive search mappings
  const searchMappings = {
    'manicure': ['manicuras', 'manicura', 'manicure', 'manicures', 'manicura completa', 'manicura semipermanente'],
    'pedicure': ['pedicuras', 'pedicura', 'pedicure', 'pedicures', 'pedicura completa', 'pedicura semipermanente'],
    'eyebrows': ['cejas', 'ceja', 'eyebrows', 'eyebrow', 'depilación de cejas', 'diseño de cejas'],
    'eyelashes': ['pestañas', 'pestaña', 'eyelashes', 'eyelash', 'lash', 'lashes', 'lifting de pestañas'],
    'facial': ['faciales', 'facial', 'facials', 'tratamiento facial'],
    'nails': ['uñas', 'uña', 'nails', 'nail', 'extensiones de uñas'],
    'micropigmentation': ['micropigmentación', 'micropigmentation'],
    'pack': ['pack', 'packs', 'paquete', 'paquetes'],
    'spa': ['spa', 'spa manos', 'spa de pies'],
    'lifting': ['lifting', 'lifting de pestañas'],
    'laminado': ['laminado', 'laminado de cejas'],
    'diseño': ['diseño', 'diseños', 'francesa'],
    'semipermanente': ['semipermanente', 'semi-permanente'],
    'gel': ['gel', 'uñas gel', 'extensiones gel'],
    'depilación': ['depilación', 'depilacion', 'depilación con hilo'],
    'tinte': ['tinte', 'tinte de pestañas', 'tinte de cejas']
  };
  
  console.log(`🔍 Checking service mappings for: "${text}"`);
  
  // Check for service-specific keywords
  for (const [englishTerm, terms] of Object.entries(searchMappings)) {
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) {
        console.log(`✅ Found service: ${englishTerm} (matched: ${term})`);
        return {
          type: 'specific_service',
          confidence: 0.8,
          language: language,
          originalText: text,
          entities: [{ type: 'service', value: englishTerm }],
          service: englishTerm
        };
      }
    }
  }
  
  // Check for general service inquiry patterns
  const serviceInquiryPatterns = [
    'what services', 'tell me about', 'information about', 'details about',
    'qué servicios', 'cuéntame sobre', 'información sobre', 'detalles sobre',
    'options', 'opciones', 'offer', 'ofrecen', 'have', 'tienen'
  ];
  
  for (const pattern of serviceInquiryPatterns) {
    if (text.includes(pattern.toLowerCase())) {
      console.log(`✅ Service inquiry detected (matched: ${pattern})`);
      return {
        type: 'service_inquiry',
        confidence: 0.7,
        language: language,
        originalText: text,
        entities: []
      };
    }
  }
  
  console.log(`❌ No service found for: "${text}"`);
  return null;
}

// Detect detailed service information requests
async function detectDetailedServiceIntent(text, language) {
  const detailedPatterns = [
    'tell me more about', 'more details', 'what includes', 'what is included',
    'más detalles', 'qué incluye', 'qué contiene', 'descripción',
    'duration', 'duración', 'how long', 'cuánto tiempo'
  ];
  
  for (const pattern of detailedPatterns) {
    if (text.includes(pattern.toLowerCase())) {
      return {
        type: 'detailed_service_info',
        confidence: 0.8,
        language: language,
        originalText: text,
        entities: extractEntities(text, 'detailed_service_info')
      };
    }
  }
  
  return null;
}

// Enhanced appointment intent detection
async function detectSpecificAppointmentIntent(text, language) {
  const { salonData } = await loadData();
  
  // Check for appointment keywords first (before service detection)
  const appointmentKeywords = [
    'appointment', 'book', 'booking', 'reserve', 'reservation', 'schedule',
    'cita', 'reservar', 'reserva', 'agendar', 'agenda', 'programar'
  ];
  
  const hasAppointmentKeyword = appointmentKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
  
  if (!hasAppointmentKeyword) {
    return null; // Not an appointment request
  }
  
  // Create comprehensive search mappings for appointment terms
  const appointmentMappings = {
    'manicure': ['manicura', 'manicuras', 'manicure', 'manicures', 'manicura completa', 'manicura semipermanente'],
    'pedicure': ['pedicura', 'pedicuras', 'pedicure', 'pedicures', 'pedicura completa', 'pedicura semipermanente'],
    'eyebrows': ['ceja', 'cejas', 'depilación de cejas', 'diseño de cejas'],
    'eyelashes': ['pestaña', 'pestañas', 'lifting de pestañas'],
    'facial': ['tratamiento facial'],
    'nails': ['extensiones de uñas'],
    'micropigmentation': ['micropigmentación', 'micropigmentation'],
    'pack': ['pack', 'packs', 'paquete', 'paquetes'],
    'spa': ['spa manos', 'spa de pies'],
    'lifting': ['lifting de pestañas'],
    'laminado': ['laminado de cejas'],
    'diseño': ['francesa'],
    'semipermanente': ['semi-permanente'],
    'gel': ['uñas gel', 'extensiones gel'],
    'depilación': ['depilación con hilo'],
    'tinte': ['tinte de pestañas', 'tinte de cejas']
  };
  
  console.log(`🔍 Checking appointment mappings for: "${text}"`);
  
  // Check for specific appointment keywords
  for (const [englishTerm, terms] of Object.entries(appointmentMappings)) {
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) {
        console.log(`✅ Found appointment: ${englishTerm} (matched: ${term})`);
        return {
          type: 'specific_appointment',
          confidence: 0.9,
          language: language,
          originalText: text,
          entities: [{ type: 'service', value: englishTerm }],
          service: englishTerm
        };
      }
    }
  }
  
  // If no specific service found, return general appointment
  console.log(`✅ Appointment request detected (no specific service)`);
  return {
    type: 'appointment_booking',
    confidence: 0.8,
    language: language,
    originalText: text,
    entities: []
  };
}

// Enhanced response generation
async function generateResponse(intent, language) {
  const { intents, salonData, scheduleData } = await loadData();
  
  // Handle null intent
  if (!intent || !intent.type) {
    return language === 'es' 
      ? 'Lo siento, no entendí eso. ¿Podrías repetir?'
      : 'I\'m sorry, I didn\'t understand that. Could you please repeat?';
  }
  
  switch (intent.type) {
    case 'service_inquiry':
      return generateServiceResponse(language);
      
    case 'specific_service':
      return generateSpecificServiceResponse(intent.entities[0]?.value, language);
      
    case 'detailed_service_info':
      return generateDetailedServiceResponse(intent.entities[0]?.value, language);
      
    case 'price_inquiry':
      return generatePriceResponse(intent.entities[0]?.value, language);
      
    case 'hours_inquiry':
      return generateHoursResponse(language);
      
    case 'location_inquiry':
      return generateLocationResponse(language);
      
    case 'parking_inquiry':
      return generateParkingResponse(language);
      
    case 'transport_inquiry':
      return generateTransportResponse(language);
      
    case 'specific_appointment':
      return generateAppointmentResponse(language, intent.service);
      
    case 'appointment_booking':
      return generateAppointmentResponse(language, intent.service);
      
    case 'greeting':
      return intents.responses.greeting[language] || intents.responses.greeting.en;
      
    case 'goodbye':
      return intents.responses.goodbye[language] || intents.responses.goodbye.en;
      
    default:
      return generateGeneralResponse(language);
  }
}

// Generate comprehensive service overview response
async function generateServiceResponse(language) {
  const { salonData } = await loadData();
  const categories = salonData.services.map(service => service.category);
  
  if (language === 'es') {
    return `Ofrecemos ${categories.length} categorías de servicios: ${categories.join(', ')}. ¿Qué servicio te interesa más? Puedo darte información detallada sobre precios, duración y lo que incluye cada servicio.`;
  } else {
    return `We offer ${categories.length} service categories: ${categories.join(', ')}. What service interests you most? I can provide detailed information about prices, duration, and what each service includes.`;
  }
}

// Generate specific service response with detailed information
async function generateSpecificServiceResponse(service, language) {
  const { salonData } = await loadData();
  
  // Map English terms to Spanish categories
  const serviceMappings = {
    'manicure': 'manicuras',
    'pedicure': 'pedicuras',
    'eyebrows': 'cejas',
    'eyelashes': 'pestañas',
    'facial': 'faciales',
    'nails': 'manicuras',
    'micropigmentation': 'micropigmentación',
    'pack': 'pack',
    'spa': 'spa',
    'lifting': 'lifting',
    'laminado': 'laminado',
    'diseño': 'diseño',
    'semipermanente': 'semipermanente',
    'gel': 'gel',
    'depilación': 'depilación',
    'tinte': 'tinte'
  };
  
  const mappedService = serviceMappings[service] || service;
  
  // Find matching service
  const serviceData = salonData.services.find(s => 
    s.category.toLowerCase().includes(mappedService.toLowerCase()) ||
    (s.variants && s.variants.some(v => 
      v.name.toLowerCase().includes(mappedService.toLowerCase())
    ))
  );
  
  if (!serviceData) {
    return language === 'es' 
      ? `Lo siento, no encontramos información específica sobre ${service}. ¿Te gustaría ver todos nuestros servicios?`
      : `Sorry, we couldn't find specific information about ${service}. Would you like to see all our services?`;
  }
  
  const variants = serviceData.variants || [];
  const priceRange = await getPriceRange(serviceData);
  
  if (language === 'es') {
    let response = `Para ${serviceData.category}, tenemos ${variants.length} opciones disponibles. ${priceRange}. `;
    
    if (variants.length > 0) {
      response += `Algunas opciones incluyen: ${variants.slice(0, 3).map(v => v.name).join(', ')}. `;
    }
    
    response += `¿Te gustaría más información sobre alguna opción específica o sobre precios?`;
    return response;
  } else {
    let response = `For ${serviceData.category}, we have ${variants.length} options available. ${priceRange}. `;
    
    if (variants.length > 0) {
      response += `Some options include: ${variants.slice(0, 3).map(v => v.name).join(', ')}. `;
    }
    
    response += `Would you like more information about any specific option or pricing?`;
    return response;
  }
}

// Generate detailed service information response
async function generateDetailedServiceResponse(service, language) {
  const { salonData } = await loadData();
  
  // Find the specific service
  let serviceData = null;
  let variantData = null;
  
  for (const category of salonData.services) {
    if (category.variants) {
      for (const variant of category.variants) {
        if (variant.name.toLowerCase().includes(service.toLowerCase())) {
          serviceData = category;
          variantData = variant;
          break;
        }
      }
    }
    if (serviceData) break;
  }
  
  if (!serviceData || !variantData) {
    return language === 'es'
      ? `Lo siento, no encontré información detallada sobre ese servicio específico. ¿Podrías ser más específico?`
      : `Sorry, I couldn't find detailed information about that specific service. Could you be more specific?`;
  }
  
  const price = variantData.price_discounted_eur || variantData.price_original_eur;
  const duration = variantData.duration || 'Variable';
  
  if (language === 'es') {
    return `${variantData.name}: ${variantData.description}. Precio: ${price}€. Duración: ${duration}. ¿Te gustaría hacer una cita para este servicio?`;
  } else {
    return `${variantData.name}: ${variantData.description}. Price: ${price}€. Duration: ${duration}. Would you like to book an appointment for this service?`;
  }
}

// Generate comprehensive price response
async function generatePriceResponse(service, language) {
  const { salonData } = await loadData();
  
  if (!service) {
    // General price inquiry
    const allPrices = [];
    salonData.services.forEach(category => {
      if (category.variants) {
        category.variants.forEach(variant => {
          const price = variant.price_discounted_eur || variant.price_original_eur;
          allPrices.push(price);
        });
      } else if (category.price_discounted_eur) {
        allPrices.push(category.price_discounted_eur);
      }
    });
    
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    return language === 'es'
      ? `Nuestros precios varían desde ${minPrice}€ hasta ${maxPrice}€ dependiendo del servicio. ¿Qué servicio específico te interesa para darte información más detallada?`
      : `Our prices range from ${minPrice}€ to ${maxPrice}€ depending on the service. What specific service interests you for more detailed information?`;
  }
  
  // Specific service price inquiry
  const serviceData = await findServiceData(service);
  if (!serviceData) {
    return language === 'es'
      ? `Lo siento, no encontré información de precios para ${service}. ¿Podrías ser más específico?`
      : `Sorry, I couldn't find pricing information for ${service}. Could you be more specific?`;
  }
  
  const priceRange = await getPriceRange(serviceData);
  
  return language === 'es'
    ? `Para ${serviceData.category}: ${priceRange}. ¿Te gustaría más información sobre las opciones específicas?`
    : `For ${serviceData.category}: ${priceRange}. Would you like more information about specific options?`;
}

// Generate comprehensive hours response
async function generateHoursResponse(language) {
  const { scheduleData } = await loadData();
  
  if (!scheduleData.business_hours) {
    return language === 'es'
      ? `Nuestros horarios son de lunes a viernes de 9:30 AM a 8:30 PM, sábados de 9:30 AM a 2:30 PM, y cerrados los domingos. ¿Te gustaría hacer una cita?`
      : `Our hours are Monday through Friday from 9:30 AM to 8:30 PM, Saturdays from 9:30 AM to 2:30 PM, and closed on Sundays. Would you like to make an appointment?`;
  }
  
  const hours = scheduleData.business_hours;
  const hoursList = Object.entries(hours).map(([day, time]) => `${day}: ${time}`).join(', ');
  
  return language === 'es'
    ? `Nuestros horarios son: ${hoursList}. ¿Te gustaría hacer una cita?`
    : `Our hours are: ${hoursList}. Would you like to make an appointment?`;
}

// Generate comprehensive location response
async function generateLocationResponse(language) {
  const { scheduleData } = await loadData();
  
  if (!scheduleData.location) {
    return language === 'es'
      ? `Estamos ubicados en Calle Santos Justo y Pastor 72, Valencia, España. Estamos cerca de la zona de la salud y de la iglesia de Santos Justo y Pastor. ¿Te gustaría ayuda con las direcciones o el transporte?`
      : `We are located at Calle Santos Justo y Pastor 72, Valencia, Spain. We are near the health district and the Santos Justo y Pastor church. Would you like help with directions or transportation?`;
  }
  
  const location = scheduleData.location;
  const address = location.address || 'Calle Santos Justo y Pastor 72, Valencia';
  const directions = location.directions || 'Estamos en el centro de Valencia, cerca de la zona de La Salud.';
  
  return language === 'es'
    ? `Estamos ubicados en ${address}. ${directions} ¿Te gustaría información sobre transporte público o estacionamiento?`
    : `We are located at ${address}. ${directions} Would you like information about public transportation or parking?`;
}

// Generate parking information response
async function generateParkingResponse(language) {
  const { scheduleData } = await loadData();
  
  if (!scheduleData.parking) {
    return language === 'es'
      ? `Tenemos opciones de estacionamiento cercanas. Hay parking privado a 5-7 minutos caminando y zona azul/blanca en las calles cercanas. ¿Te gustaría más información?`
      : `We have nearby parking options. There's private parking 5-7 minutes walking distance and blue/white zone parking on nearby streets. Would you like more information?`;
  }
  
  const parking = scheduleData.parking;
  const options = parking.options || [];
  
  if (language === 'es') {
    let response = `Opciones de estacionamiento: `;
    options.forEach((option, index) => {
      response += `${option.type} en ${option.location} (${option.distance}, ${option.cost}). `;
    });
    response += `¿Te gustaría información sobre transporte público como alternativa?`;
    return response;
  } else {
    let response = `Parking options: `;
    options.forEach((option, index) => {
      response += `${option.type} at ${option.location} (${option.distance}, ${option.cost}). `;
    });
    response += `Would you like information about public transportation as an alternative?`;
    return response;
  }
}

// Generate transport information response
async function generateTransportResponse(language) {
  const { scheduleData } = await loadData();
  
  if (!scheduleData.location || !scheduleData.location.public_transport) {
    return language === 'es'
      ? `Tenemos fácil acceso en transporte público. Hay múltiples opciones de autobús y metro cerca. ¿Te gustaría información específica sobre las líneas?`
      : `We have easy access by public transportation. There are multiple bus and metro options nearby. Would you like specific information about the lines?`;
  }
  
  const transport = scheduleData.location.public_transport;
  
  if (language === 'es') {
    let response = `Opciones de transporte público: `;
    
    if (transport.bus) {
      response += `Autobús líneas ${transport.bus.map(b => b.line).join(', ')}. `;
    }
    
    if (transport.metro) {
      response += `Metro líneas ${transport.metro.map(m => m.line).join(', ')}. `;
    }
    
    response += `¿Te gustaría información sobre estacionamiento también?`;
    return response;
  } else {
    let response = `Public transportation options: `;
    
    if (transport.bus) {
      response += `Bus lines ${transport.bus.map(b => b.line).join(', ')}. `;
    }
    
    if (transport.metro) {
      response += `Metro lines ${transport.metro.map(m => m.line).join(', ')}. `;
    }
    
    response += `Would you like information about parking as well?`;
    return response;
  }
}

// Generate appointment response
async function generateAppointmentResponse(language, service = null) {
  if (service) {
    // Specific service appointment
    return language === 'es'
      ? `¡Excelente! Puedo ayudarte a reservar una cita para ${service}. ¿Qué fecha y hora prefieres? Estamos disponibles de lunes a viernes de 9:30 AM a 8:30 PM, y sábados de 9:30 AM a 2:30 PM. ¿Te gustaría reservarlo ahora?`
      : `Excellent! I can help you book an appointment for ${service}. What date and time would you prefer? We're available Monday through Friday from 9:30 AM to 8:30 PM, and Saturdays from 9:30 AM to 2:30 PM. Would you like to book it now?`;
  }
  
  return language === 'es'
    ? `Perfecto, entiendo que quieres reservar una cita. ¿Para qué servicio específico te gustaría reservar? Puedo ayudarte con manicuras, pedicuras, faciales, servicios de cejas y más. ¿Qué fecha y hora prefieres?`
    : `Perfect, I understand you want to book an appointment. What specific service would you like to book? I can help you with manicures, pedicures, facials, eyebrow services, and more. What date and time would you prefer?`;
}

// Generate general response for unrecognized queries
async function generateGeneralResponse(language) {
  return language === 'es'
    ? `Puedo ayudarte con información sobre nuestros servicios, precios, horarios, ubicación, transporte y citas. ¿Qué te gustaría saber?`
    : `I can help you with information about our services, prices, hours, location, transportation, and appointments. What would you like to know?`;
}

// Helper functions
async function findServiceData(service) {
  const { salonData } = await loadData();
  
  const serviceMappings = {
    'manicure': 'manicuras',
    'pedicure': 'pedicuras',
    'eyebrows': 'cejas',
    'eyelashes': 'pestañas',
    'facial': 'faciales',
    'nails': 'manicuras'
  };
  
  const mappedService = serviceMappings[service] || service;
  
  return salonData.services.find(s => 
    s.category.toLowerCase().includes(mappedService.toLowerCase())
  );
}

async function getPriceRange(serviceData) {
  if (!serviceData.variants || serviceData.variants.length === 0) {
    if (serviceData.price_discounted_eur) {
      return `Precio: ${serviceData.price_discounted_eur}€`;
    }
    return 'Precio disponible bajo consulta';
  }
  
  const prices = serviceData.variants.map(v => v.price_discounted_eur || v.price_original_eur);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  if (minPrice === maxPrice) {
    return `Precio: ${minPrice}€`;
  } else {
    return `Precios desde ${minPrice}€ hasta ${maxPrice}€`;
  }
}

module.exports = {
  processVoiceInput,
  generateResponse,
  detectLanguage,
  extractEntities,
  loadData
}; 