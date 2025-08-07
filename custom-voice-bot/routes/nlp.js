const express = require('express');
const router = express.Router();
const { processVoiceInput, generateResponse, loadData } = require('../utils/nlp');

// POST /api/nlp/process - Process voice input and generate response
router.post('/process', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    console.log(`🔍 Processing NLP request: "${text}" (${language})`);
    
    // Process the input to determine intent
    const intent = await processVoiceInput(text, language);
    
    // Generate response based on intent
    const response = await generateResponse(intent, language);
    
    console.log(`✅ Generated response: "${response}"`);
    
    res.json({
      success: true,
      response: response,
      intent: intent.type,
      confidence: intent.confidence,
      language: language,
      entities: intent.entities || []
    });
    
  } catch (error) {
    console.error('Error processing NLP request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
      message: error.message
    });
  }
});

// GET /api/nlp/intents - Get available intents
router.get('/intents', async (req, res) => {
  try {
    const { intents } = await loadData();
    
    res.json({
      success: true,
      intents: Object.keys(intents.patterns),
      patterns: intents.patterns
    });
    
  } catch (error) {
    console.error('Error fetching intents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch intents'
    });
  }
});

// GET /api/nlp/services - Get all available services
router.get('/services', async (req, res) => {
  try {
    const { salonData } = await loadData();
    
    const services = salonData.services.map(service => ({
      category: service.category,
      url: service.url,
      variants: service.variants || [],
      price_original_eur: service.price_original_eur,
      price_discounted_eur: service.price_discounted_eur,
      duration: service.duration
    }));
    
    res.json({
      success: true,
      services: services,
      total_services: services.length
    });
    
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
});

// GET /api/nlp/services/:category - Get specific service category
router.get('/services/:category', async (req, res) => {
  try {
    const { salonData } = await loadData();
    const category = req.params.category.toLowerCase();
    
    const service = salonData.services.find(s => 
      s.category.toLowerCase().includes(category) ||
      s.category.toLowerCase().replace(/\s+/g, '-').includes(category)
    );
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service category not found'
      });
    }
    
    res.json({
      success: true,
      service: service
    });
    
  } catch (error) {
    console.error('Error fetching service category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service category'
    });
  }
});

// GET /api/nlp/schedule - Get business hours and location
router.get('/schedule', async (req, res) => {
  try {
    const { scheduleData } = await loadData();
    
    res.json({
      success: true,
      business_hours: scheduleData.business_hours || {},
      location: scheduleData.location || {},
      parking: scheduleData.parking || {}
    });
    
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule'
    });
  }
});

// POST /api/nlp/search - Search services by keyword
router.post('/search', async (req, res) => {
  try {
    const { query, language = 'en' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const { salonData } = await loadData();
    const searchTerm = query.toLowerCase();
    const results = [];
    
    // Search through all services and variants
    salonData.services.forEach(service => {
      // Check category name
      if (service.category.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'category',
          service: service,
          match: service.category
        });
      }
      
      // Check variants
      if (service.variants) {
        service.variants.forEach(variant => {
          if (variant.name.toLowerCase().includes(searchTerm) ||
              variant.description.toLowerCase().includes(searchTerm)) {
            results.push({
              type: 'variant',
              service: service,
              variant: variant,
              match: variant.name
            });
          }
        });
      }
    });
    
    res.json({
      success: true,
      query: query,
      results: results,
      total_results: results.length
    });
    
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search services'
    });
  }
});

// POST /api/nlp/test - Test intent recognition
router.post('/test', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    // Process the input
    const intent = await processVoiceInput(text, language);
    const response = await generateResponse(intent, language);
    
    res.json({
      success: true,
      input: text,
      intent: intent,
      response: response,
      language: language
    });
    
  } catch (error) {
    console.error('Error testing NLP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test NLP',
      message: error.message
    });
  }
});

// POST /api/nlp/conversation - Handle multi-turn conversations
router.post('/conversation', async (req, res) => {
  try {
    const { messages, language = 'en' } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }
    
    // Get the latest message
    const latestMessage = messages[messages.length - 1];
    const intent = await processVoiceInput(latestMessage.text, language);
    const response = await generateResponse(intent, language);
    
    // Add context from previous messages if available
    const context = messages.length > 1 ? messages.slice(-3) : [];
    
    res.json({
      success: true,
      response: response,
      intent: intent.type,
      confidence: intent.confidence,
      language: language,
      context: context,
      entities: intent.entities || []
    });
    
  } catch (error) {
    console.error('Error processing conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process conversation',
      message: error.message
    });
  }
});

// GET /api/nlp/health - Health check for NLP service
router.get('/health', async (req, res) => {
  try {
    const { salonData, intents, scheduleData } = await loadData();
    
    res.json({
      success: true,
      status: 'healthy',
      data_loaded: {
        services: salonData.services.length,
        intents: Object.keys(intents.patterns).length,
        schedule: !!scheduleData.business_hours
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking NLP health:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router; 