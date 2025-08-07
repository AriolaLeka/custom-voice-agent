# 🚀 Custom Voice Bot Setup Guide

## 📋 **Overview**

This custom voice bot system replaces Vapi.ai with a complete, self-hosted solution using:
- **Twilio Voice API** for phone calls
- **Web Speech API** for speech recognition
- **Custom NLP** for intent recognition
- **Google Calendar** for appointment booking
- **Multilingual support** (English/Spanish)

## 🛠️ **Prerequisites**

### **1. Twilio Account**
- Sign up at [twilio.com](https://www.twilio.com)
- Get your Account SID and Auth Token
- Purchase a phone number for voice calls

### **2. Google Calendar API**
- Set up Google Cloud Project
- Enable Google Calendar API
- Create Service Account credentials
- Download credentials.json file

### **3. Node.js Environment**
- Node.js 16+ installed
- npm or yarn package manager

## 📦 **Installation**

### **Step 1: Clone and Install**
```bash
cd custom-voice-bot
npm install
```

### **Step 2: Environment Configuration**
```bash
cp env.example .env
```

Edit `.env` with your credentials:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Google Calendar Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json
SALON_EMAIL=your_salon_email@gmail.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

### **Step 3: Data Files**
Copy your existing data files:
```bash
cp ../products.json ./data/
cp ../schedule.json ./data/
```

## 🔧 **Configuration**

### **1. Twilio Setup**

#### **A. Get Twilio Credentials**
1. Go to [Twilio Console](https://console.twilio.com)
2. Copy your Account SID and Auth Token
3. Purchase a phone number for voice calls

#### **B. Configure Webhook URLs**
In your Twilio phone number settings:
- **Voice Webhook**: `https://your-domain.com/api/voice/incoming`
- **Status Callback**: `https://your-domain.com/api/voice/status`

### **2. Google Calendar Setup**

#### **A. Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Calendar API

#### **B. Create Service Account**
1. Go to "IAM & Admin" > "Service Accounts"
2. Create new service account
3. Download JSON credentials file
4. Share your calendar with the service account email

#### **C. Configure Credentials**
1. Place credentials.json in project root
2. Update `.env` with correct path
3. Ensure calendar sharing permissions

## 🚀 **Deployment**

### **Option 1: Local Development**
```bash
npm run dev
```
Access web interface at: `http://localhost:3000`

### **Option 2: Render Deployment**
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Web Service

### **Option 3: Vercel Deployment**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Configure environment variables

## 🧪 **Testing**

### **1. Web Interface Testing**
1. Open `http://localhost:3000`
2. Click microphone button
3. Test with sample queries:
   - "What services do you offer?"
   - "Tell me about manicures"
   - "What are your hours?"
   - "I want to book an appointment"

### **2. Twilio Call Testing**
1. Call your Twilio phone number
2. Test voice interactions
3. Verify appointment booking flow

### **3. API Testing**
```bash
# Test NLP processing
curl -X POST http://localhost:3000/api/nlp/process \
  -H "Content-Type: application/json" \
  -d '{"text":"What services do you offer?","language":"en"}'

# Test appointment booking
curl -X POST http://localhost:3000/api/calendar/book \
  -H "Content-Type: application/json" \
  -d '{"clientName":"John","service":"manicure","date":"2024-01-15","time":"14:00"}'
```

## 📞 **Phone Call Flow**

### **1. Incoming Call**
```
Customer calls → Twilio → /api/voice/incoming → Welcome message
```

### **2. Speech Processing**
```
Customer speaks → Twilio Speech Recognition → /api/voice/process → NLP processing
```

### **3. Response Generation**
```
NLP intent → Response generation → Twilio TTS → Customer hears response
```

### **4. Appointment Booking**
```
Booking intent → Date/time parsing → Google Calendar → Confirmation
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Twilio Webhook Errors**
- Check webhook URLs are correct
- Ensure HTTPS endpoints
- Verify Twilio credentials

#### **2. Google Calendar Errors**
- Check service account permissions
- Verify credentials.json path
- Ensure calendar sharing

#### **3. Speech Recognition Issues**
- Test microphone permissions
- Check browser compatibility
- Verify language settings

#### **4. NLP Processing Errors**
- Check data files exist
- Verify intent patterns
- Review console logs

### **Debug Commands**
```bash
# Check server status
curl http://localhost:3000/health

# Test NLP directly
curl -X POST http://localhost:3000/api/nlp/test \
  -H "Content-Type: application/json" \
  -d '{"text":"What services do you offer?"}'

# Check calendar integration
curl http://localhost:3000/api/calendar/available?date=2024-01-15
```

## 📊 **Monitoring**

### **1. Call Analytics**
- Check Twilio Console for call logs
- Monitor call duration and success rates
- Review error logs

### **2. Application Logs**
```bash
# View real-time logs
npm run dev

# Check error logs
tail -f logs/error.log
```

### **3. Performance Monitoring**
- Monitor response times
- Track intent recognition accuracy
- Measure appointment booking success

## 🔄 **Updates and Maintenance**

### **1. Adding New Intents**
Edit `utils/nlp.js`:
```javascript
// Add new intent patterns
'service_inquiry': [
  'what services do you offer',
  'tell me about your services',
  // Add new patterns here
]
```

### **2. Updating Responses**
Edit `utils/speech.js`:
```javascript
// Update response generation
function generateServiceResponse(language) {
  // Customize responses here
}
```

### **3. Calendar Integration**
Edit `utils/calendar.js`:
```javascript
// Customize calendar event creation
const event = {
  summary: `${service} - ${clientName}`,
  // Add custom fields
}
```

## 💰 **Cost Analysis**

### **Twilio Costs**
- **Voice Calls**: $0.0085/minute (US)
- **Phone Numbers**: $1/month per number
- **Call Recording**: $0.0025/minute

### **Estimated Monthly Costs**
- **100 calls/month**: ~$10-15
- **500 calls/month**: ~$40-50
- **1000 calls/month**: ~$80-100

### **Savings vs Vapi.ai**
- **Vapi.ai**: $50-200/month
- **Custom System**: $10-100/month
- **Savings**: 50-80% cost reduction

## 🎯 **Next Steps**

1. **Set up Twilio account** and configure phone number
2. **Configure Google Calendar** with service account
3. **Deploy to production** environment
4. **Test with real calls** and customers
5. **Monitor and optimize** performance

## 📞 **Support**

For issues or questions:
1. Check troubleshooting section above
2. Review console logs for errors
3. Test individual components
4. Contact development team

This custom voice bot system gives you complete control, better performance, and significant cost savings compared to Vapi.ai! 🚀 