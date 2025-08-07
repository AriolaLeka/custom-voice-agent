#!/usr/bin/env node

const { processVoiceInput, generateResponse, loadData } = require('../utils/nlp');

class AISystemTester {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting AI Agent System Tests...\n');
    
    await this.testDataLoading();
    await this.testIntentRecognition();
    await this.testServiceQueries();
    await this.testPriceQueries();
    await this.testScheduleQueries();
    await this.testLocationQueries();
    await this.testMultilingualSupport();
    await this.testErrorHandling();
    await this.testConversationFlow();
    
    this.printResults();
  }

  async testDataLoading() {
    console.log('📊 Testing Data Loading...');
    
    try {
      const { salonData, intents, scheduleData } = await loadData();
      
      this.assert(salonData && salonData.services, 'Salon data loaded');
      this.assert(intents && intents.patterns, 'Intents data loaded');
      this.assert(scheduleData && scheduleData.business_hours, 'Schedule data loaded');
      
      console.log(`✅ Services loaded: ${salonData.services.length}`);
      console.log(`✅ Intent patterns: ${Object.keys(intents.patterns).length}`);
      console.log(`✅ Business hours: ${Object.keys(scheduleData.business_hours).length}\n`);
      
    } catch (error) {
      this.fail('Data loading failed: ' + error.message);
    }
  }

  async testIntentRecognition() {
    console.log('🎯 Testing Intent Recognition...');
    
    const testCases = [
      { input: 'hello', expected: 'greeting' },
      { input: 'what services do you offer', expected: 'service_inquiry' },
      { input: 'how much does a manicure cost', expected: 'price_inquiry' },
      { input: 'what are your hours', expected: 'hours_inquiry' },
      { input: 'where are you located', expected: 'location_inquiry' },
      { input: 'book an appointment', expected: 'appointment_booking' },
      { input: 'goodbye', expected: 'goodbye' },
      { input: 'hola', expected: 'greeting' },
      { input: '¿qué servicios ofrecen?', expected: 'service_inquiry' },
      { input: '¿cuánto cuesta?', expected: 'price_inquiry' }
    ];

    for (const testCase of testCases) {
      try {
        const intent = await processVoiceInput(testCase.input);
        this.assert(
          intent.type === testCase.expected,
          `Intent recognition: "${testCase.input}" -> ${intent.type}`
        );
      } catch (error) {
        this.fail(`Intent recognition failed for "${testCase.input}": ${error.message}`);
      }
    }
    
    console.log('✅ Intent recognition tests completed\n');
  }

  async testServiceQueries() {
    console.log('🎨 Testing Service Queries...');
    
    const serviceTests = [
      'what services do you offer',
      'tell me about manicures',
      'what about pedicures',
      'eyebrow services',
      'facial treatments',
      'nail extensions',
      'micropigmentation',
      'spa services'
    ];

    for (const query of serviceTests) {
      try {
        const intent = await processVoiceInput(query);
        const response = await generateResponse(intent, 'en');
        
        this.assert(
          response && response.length > 0,
          `Service query: "${query}" -> Response generated`
        );
        
        this.assert(
          !response.includes('sorry') || !response.includes('error'),
          `Service query: "${query}" -> Valid response`
        );
        
        } catch (error) {
        this.fail(`Service query failed for "${query}": ${error.message}`);
      }
    }
    
    console.log('✅ Service query tests completed\n');
  }

  async testPriceQueries() {
    console.log('💰 Testing Price Queries...');
    
    const priceTests = [
      'how much do you charge',
      'what are your prices',
      'cost of manicure',
      'pedicure price',
      'facial cost',
      'eyebrow treatment price'
    ];

    for (const query of priceTests) {
      try {
        const intent = await processVoiceInput(query);
        const response = await generateResponse(intent, 'en');
        
        this.assert(
          response && response.length > 0,
          `Price query: "${query}" -> Response generated`
        );
        
        // Check if response contains price information
        const hasPriceInfo = response.includes('€') || response.includes('price') || response.includes('cost');
        this.assert(hasPriceInfo, `Price query: "${query}" -> Contains price information`);
        
      } catch (error) {
        this.fail(`Price query failed for "${query}": ${error.message}`);
      }
    }
    
    console.log('✅ Price query tests completed\n');
  }

  async testScheduleQueries() {
    console.log('🕒 Testing Schedule Queries...');
    
    const scheduleTests = [
      'what are your hours',
      'when are you open',
      'business hours',
      'opening times',
      '¿cuáles son sus horarios?'
    ];

    for (const query of scheduleTests) {
      try {
        const intent = await processVoiceInput(query);
        const response = await generateResponse(intent, 'en');
        
        this.assert(
          response && response.length > 0,
          `Schedule query: "${query}" -> Response generated`
        );
        
        // Check if response contains time information
        const hasTimeInfo = response.includes('AM') || response.includes('PM') || response.includes('hours');
        this.assert(hasTimeInfo, `Schedule query: "${query}" -> Contains time information`);
        
      } catch (error) {
        this.fail(`Schedule query failed for "${query}": ${error.message}`);
      }
    }
    
    console.log('✅ Schedule query tests completed\n');
  }

  async testLocationQueries() {
    console.log('📍 Testing Location Queries...');
    
    const locationTests = [
      'where are you located',
      'what is your address',
      'how do I get there',
      'directions to your salon',
      '¿dónde están ubicados?'
    ];

    for (const query of locationTests) {
      try {
        const intent = await processVoiceInput(query);
        const response = await generateResponse(intent, 'en');
        
        this.assert(
          response && response.length > 0,
          `Location query: "${query}" -> Response generated`
        );
        
        // Check if response contains address information
        const hasAddressInfo = response.includes('Calle') || response.includes('Valencia') || response.includes('address');
        this.assert(hasAddressInfo, `Location query: "${query}" -> Contains address information`);
        
      } catch (error) {
        this.fail(`Location query failed for "${query}": ${error.message}`);
      }
    }
    
    console.log('✅ Location query tests completed\n');
  }

  async testMultilingualSupport() {
    console.log('🌍 Testing Multilingual Support...');
    
    const spanishTests = [
      'hola',
      '¿qué servicios ofrecen?',
      '¿cuánto cuesta una manicura?',
      '¿cuáles son sus horarios?',
      '¿dónde están ubicados?',
      'quiero reservar una cita',
      '¿tienen estacionamiento?',
      '¿cómo llego ahí?'
    ];

    for (const query of spanishTests) {
      try {
        const intent = await processVoiceInput(query, 'es');
        const response = await generateResponse(intent, 'es');
        
        this.assert(
          response && response.length > 0,
          `Spanish query: "${query}" -> Response generated`
        );
        
        // Check if response is in Spanish
        const isSpanish = response.includes('¿') || response.includes('á') || response.includes('é') || 
                         response.includes('í') || response.includes('ó') || response.includes('ú') ||
                         response.includes('ñ');
        this.assert(isSpanish, `Spanish query: "${query}" -> Spanish response`);
        
      } catch (error) {
        this.fail(`Spanish query failed for "${query}": ${error.message}`);
      }
    }
    
    console.log('✅ Multilingual support tests completed\n');
  }

  async testErrorHandling() {
    console.log('⚠️ Testing Error Handling...');
    
    const errorTests = [
      '', // Empty input
      'xyz123', // Nonsense input
      'this is a very long query that might cause issues with the system', // Long input
      '!@#$%^&*()', // Special characters
    ];

    for (const query of errorTests) {
      try {
        const intent = await processVoiceInput(query);
        const response = await generateResponse(intent, 'en');
        
        this.assert(
          response && response.length > 0,
          `Error handling: "${query}" -> Response generated`
        );
        
        // Should not crash or return empty response
        this.assert(
          response !== 'undefined' && response !== 'null',
          `Error handling: "${query}" -> Valid response`
        );
        
      } catch (error) {
        this.fail(`Error handling failed for "${query}": ${error.message}`);
      }
    }
    
    console.log('✅ Error handling tests completed\n');
  }

  async testConversationFlow() {
    console.log('💬 Testing Conversation Flow...');
    
    const conversationFlow = [
      { input: 'hello', expectedIntent: 'greeting' },
      { input: 'what services do you offer', expectedIntent: 'service_inquiry' },
      { input: 'tell me about manicures', expectedIntent: 'specific_service' },
      { input: 'how much does it cost', expectedIntent: 'price_inquiry' },
      { input: 'what are your hours', expectedIntent: 'hours_inquiry' },
      { input: 'where are you located', expectedIntent: 'location_inquiry' },
      { input: 'goodbye', expectedIntent: 'goodbye' }
    ];

    for (let i = 0; i < conversationFlow.length; i++) {
      const step = conversationFlow[i];
      try {
        const intent = await processVoiceInput(step.input);
        const response = await generateResponse(intent, 'en');
        
        this.assert(
          intent.type === step.expectedIntent,
          `Conversation step ${i + 1}: "${step.input}" -> ${intent.type}`
        );
        
        this.assert(
          response && response.length > 0,
          `Conversation step ${i + 1}: Response generated`
        );
        
    } catch (error) {
        this.fail(`Conversation step ${i + 1} failed: ${error.message}`);
      }
    }
    
    console.log('✅ Conversation flow tests completed\n');
  }

  assert(condition, message) {
    this.totalTests++;
    if (condition) {
      this.passedTests++;
      console.log(`✅ ${message}`);
    } else {
      console.log(`❌ ${message}`);
    }
  }

  fail(message) {
    this.totalTests++;
    console.log(`❌ ${message}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    if (this.passedTests === this.totalTests) {
      console.log('\n🎉 All tests passed! The AI agent is fully functional.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the issues above.');
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new AISystemTester();
  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = AISystemTester; 