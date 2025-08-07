# 🗓️ Google Calendar Setup Guide

## 🎯 **Step 1: Create Google Cloud Project**

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Create a new project** or select existing one
3. **Enable Google Calendar API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

## 🎯 **Step 2: Create Service Account**

1. **Go to "IAM & Admin" → "Service Accounts"**
2. **Click "Create Service Account"**
3. **Fill in details:**
   - **Name**: `hera-voice-bot`
   - **Description**: `Service account for Hera's Voice Bot calendar integration`
4. **Click "Create and Continue"**

## 🎯 **Step 3: Grant Permissions**

1. **Add roles:**
   - **Calendar API Admin** (for full calendar access)
   - **Service Account Token Creator** (if needed)
2. **Click "Continue"**
3. **Click "Done"**

## 🎯 **Step 4: Create and Download Credentials**

1. **Click on your service account**
2. **Go to "Keys" tab**
3. **Click "Add Key" → "Create new key"**
4. **Choose "JSON" format**
5. **Download the JSON file**
6. **Save as `credentials.json` in your project root**

## 🎯 **Step 5: Share Calendar with Service Account**

1. **Open Google Calendar**
2. **Find your calendar settings**
3. **Add the service account email** (found in credentials.json)
4. **Grant "Make changes to events" permission**

## 🎯 **Step 6: Update Environment Variables**

Edit your `.env` file:

```env
# Google Calendar Configuration
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
SALON_EMAIL=your_salon_email@gmail.com
```

## 🎯 **Step 7: Test Calendar Integration**

```bash
# Test calendar functionality
curl -X POST http://localhost:3000/api/calendar/book \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "service": "manicure",
    "date": "2024-01-15",
    "time": "14:00",
    "email": "test@example.com"
  }'
```

## 🎯 **Troubleshooting**

### **Common Issues:**

1. **"Service accounts cannot invite attendees"**
   - Solution: Remove attendees from calendar events
   - Already implemented in our code

2. **"Permission denied"**
   - Check service account has Calendar API Admin role
   - Verify calendar is shared with service account email

3. **"Invalid credentials"**
   - Check credentials.json path is correct
   - Verify JSON file is valid

## 🎯 **Security Best Practices**

1. **Never commit credentials.json to git**
2. **Use environment variables in production**
3. **Rotate service account keys regularly**
4. **Limit service account permissions**

## 🎯 **Production Deployment**

For production, use environment variables instead of file:

```env
# Instead of file path, use JSON content
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
```

Then update `utils/calendar.js` to use environment variable. 