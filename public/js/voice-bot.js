class VoiceBot {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.conversationHistory = [];
    this.currentLanguage = 'en';
    this.isProcessing = false;
    
    this.initializeSpeechRecognition();
    this.setupEventListeners();
    this.loadConversationHistory();
  }

  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        this.updateUI('listening');
      };
      
      this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
        console.log('🎤 Heard:', transcript);
        this.processUserInput(transcript);
      };
      
      this.recognition.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        this.updateUI('error');
        this.showMessage('Error: ' + event.error, 'error');
      };
      
      this.recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        this.updateUI('idle');
        };
    } else {
      console.warn('Speech recognition not supported');
      this.showMessage('Speech recognition not supported in this browser', 'warning');
    }
  }

  setupEventListeners() {
    // Microphone button
    const micButton = document.getElementById('micButton');
    if (micButton) {
      micButton.addEventListener('click', () => this.toggleListening());
    }

    // Text input
    const textInput = document.getElementById('textInput');
    if (textInput) {
      textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.processUserInput(textInput.value);
          textInput.value = '';
        }
      });
    }

    // Send button
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        const textInput = document.getElementById('textInput');
        if (textInput && textInput.value.trim()) {
          this.processUserInput(textInput.value);
          textInput.value = '';
        }
      });
    }

    // Language toggle
    const languageToggle = document.getElementById('languageToggle');
    if (languageToggle) {
      languageToggle.addEventListener('change', (e) => {
        this.currentLanguage = e.target.checked ? 'es' : 'en';
        this.updateLanguageUI();
      });
    }

    // Clear conversation
    const clearButton = document.getElementById('clearButton');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearConversation());
    }

    // Quick action buttons
    this.setupQuickActions();
  }

  setupQuickActions() {
    const quickActions = [
      { text: 'Services', action: 'What services do you offer?' },
      { text: 'Prices', action: 'What are your prices?' },
      { text: 'Hours', action: 'What are your business hours?' },
      { text: 'Location', action: 'Where are you located?' },
      { text: 'Appointment', action: 'I want to book an appointment' },
      { text: 'Parking', action: 'Do you have parking?' },
      { text: 'Transport', action: 'How do I get there?' }
    ];

    const quickActionsContainer = document.getElementById('quickActions');
    if (quickActionsContainer) {
      quickActions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'quick-action-btn';
        button.textContent = action.text;
        button.addEventListener('click', () => {
          this.processUserInput(action.action);
        });
        quickActionsContainer.appendChild(button);
      });
    }
  }

  toggleListening() {
    if (!this.recognition) {
      this.showMessage('Speech recognition not available', 'error');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      this.recognition.lang = this.currentLanguage === 'es' ? 'es-ES' : 'en-US';
      this.recognition.start();
      this.isListening = true;
    }
  }

  async processUserInput(input) {
    if (!input.trim() || this.isProcessing) return;

    this.isProcessing = true;
    this.addMessage(input, 'user');
    
    try {
      const response = await this.sendToAPI(input);
      this.addMessage(response.response, 'bot');
      
      // Auto-speak the response
      this.speak(response.response);
      
      // Update conversation history
      this.conversationHistory.push({
        user: input,
        bot: response.response,
        timestamp: new Date().toISOString(),
        intent: response.intent,
        confidence: response.confidence
      });
      
      this.saveConversationHistory();
      
    } catch (error) {
      console.error('Error processing input:', error);
      this.addMessage('Sorry, I encountered an error. Please try again.', 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  async sendToAPI(text) {
        const response = await fetch('/api/nlp/process', {
            method: 'POST',
            headers: {
        'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
        language: this.currentLanguage
            })
        });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  addMessage(text, sender) {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(timestamp);
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `system-message ${type}`;
    messageDiv.textContent = text;
    
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.appendChild(messageDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      
      // Auto-remove system messages after 5 seconds
      setTimeout(() => {
        messageDiv.remove();
      }, 5000);
    }
  }

  speak(text) {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
        
        const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.currentLanguage === 'es' ? 'es-ES' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
    this.synthesis.speak(utterance);
  }

  updateUI(state) {
    const micButton = document.getElementById('micButton');
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (micButton) {
      micButton.className = `mic-button ${state}`;
    }
    
    if (statusIndicator) {
      statusIndicator.textContent = this.getStatusText(state);
      statusIndicator.className = `status-indicator ${state}`;
    }
  }

  getStatusText(state) {
    const statusTexts = {
      'idle': this.currentLanguage === 'es' ? 'Listo para escuchar' : 'Ready to listen',
      'listening': this.currentLanguage === 'es' ? 'Escuchando...' : 'Listening...',
      'processing': this.currentLanguage === 'es' ? 'Procesando...' : 'Processing...',
      'error': this.currentLanguage === 'es' ? 'Error' : 'Error'
    };
    return statusTexts[state] || statusTexts['idle'];
  }

  updateLanguageUI() {
    const languageLabel = document.getElementById('languageLabel');
    if (languageLabel) {
      languageLabel.textContent = this.currentLanguage === 'es' ? 'Español' : 'English';
    }
    
    // Update quick actions language
    this.updateQuickActionsLanguage();
  }

  updateQuickActionsLanguage() {
    const quickActions = {
      'en': [
        { text: 'Services', action: 'What services do you offer?' },
        { text: 'Prices', action: 'What are your prices?' },
        { text: 'Hours', action: 'What are your business hours?' },
        { text: 'Location', action: 'Where are you located?' },
        { text: 'Appointment', action: 'I want to book an appointment' },
        { text: 'Parking', action: 'Do you have parking?' },
        { text: 'Transport', action: 'How do I get there?' }
      ],
      'es': [
        { text: 'Servicios', action: '¿Qué servicios ofrecen?' },
        { text: 'Precios', action: '¿Cuáles son sus precios?' },
        { text: 'Horarios', action: '¿Cuáles son sus horarios?' },
        { text: 'Ubicación', action: '¿Dónde están ubicados?' },
        { text: 'Cita', action: 'Quiero reservar una cita' },
        { text: 'Estacionamiento', action: '¿Tienen estacionamiento?' },
        { text: 'Transporte', action: '¿Cómo llego ahí?' }
      ]
    };

    const quickActionsContainer = document.getElementById('quickActions');
    if (quickActionsContainer) {
      quickActionsContainer.innerHTML = '';
      quickActions[this.currentLanguage].forEach(action => {
        const button = document.createElement('button');
        button.className = 'quick-action-btn';
        button.textContent = action.text;
        button.addEventListener('click', () => {
          this.processUserInput(action.action);
        });
        quickActionsContainer.appendChild(button);
      });
    }
  }

  clearConversation() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.innerHTML = '';
    }
    
    this.conversationHistory = [];
    this.saveConversationHistory();
    
    this.showMessage(
      this.currentLanguage === 'es' 
        ? 'Conversación borrada' 
        : 'Conversation cleared', 
      'info'
    );
  }

  saveConversationHistory() {
    try {
      localStorage.setItem('heraVoiceBotHistory', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  loadConversationHistory() {
    try {
      const saved = localStorage.getItem('heraVoiceBotHistory');
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  }

  // Advanced features
  async searchServices(query) {
    try {
      const response = await fetch('/api/nlp/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          language: this.currentLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error searching services:', error);
      throw error;
    }
  }

  async getServiceDetails(category) {
    try {
      const response = await fetch(`/api/nlp/services/${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting service details:', error);
      throw error;
    }
  }

  async getSchedule() {
    try {
      const response = await fetch('/api/nlp/schedule');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting schedule:', error);
      throw error;
    }
  }

  // Initialize the bot
  init() {
    console.log('🤖 Hera Voice Bot initialized');
    this.showMessage(
      this.currentLanguage === 'es' 
        ? '¡Hola! Soy el asistente virtual de Hera\'s Nails and Lashes. ¿En qué puedo ayudarte?' 
        : 'Hello! I\'m the virtual assistant for Hera\'s Nails and Lashes. How can I help you?',
      'info'
    );
    
    // Auto-detect language based on browser
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('es')) {
      this.currentLanguage = 'es';
      const languageToggle = document.getElementById('languageToggle');
      if (languageToggle) {
        languageToggle.checked = true;
      }
      this.updateLanguageUI();
    }
  }
}

// Initialize the voice bot when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.voiceBot = new VoiceBot();
  window.voiceBot.init();
}); 