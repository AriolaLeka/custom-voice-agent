#!/bin/bash

# 🚀 Custom Voice Bot Deployment Script
# This script helps you deploy your custom voice bot system

echo "🎯 Custom Voice Bot Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: Please run this script from the custom-voice-bot directory"
    exit 1
fi

# Step 1: Check dependencies
echo ""
echo "📦 Step 1: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Step 2: Check environment file
echo ""
echo "🔧 Step 2: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your credentials:"
    echo "   - TWILIO_ACCOUNT_SID"
    echo "   - TWILIO_AUTH_TOKEN"
    echo "   - TWILIO_PHONE_NUMBER"
    echo "   - GOOGLE_APPLICATION_CREDENTIALS"
    echo "   - SALON_EMAIL"
else
    echo "✅ .env file exists"
fi

# Step 3: Check data files
echo ""
echo "📊 Step 3: Checking data files..."
if [ -f "data/products.json" ] && [ -f "data/schedule.json" ]; then
    echo "✅ Data files found"
else
    echo "⚠️  Warning: Data files not found in data/ directory"
    echo "   Please ensure products.json and schedule.json are present"
fi

# Step 4: Test local server
echo ""
echo "🧪 Step 4: Testing local server..."
echo "Starting server for testing..."

# Start server in background
node server.js > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server is running and healthy"
else
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Test NLP endpoint
echo "Testing NLP processing..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/nlp/process \
  -H "Content-Type: application/json" \
  -d '{"text":"What services do you offer?","language":"en"}')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ NLP processing working"
else
    echo "❌ NLP processing failed"
    echo "Response: $RESPONSE"
fi

# Stop test server
kill $SERVER_PID 2>/dev/null

# Step 5: Deployment options
echo ""
echo "🌐 Step 5: Deployment Options"
echo "============================="
echo "1. Deploy to Render (Recommended)"
echo "2. Deploy to Vercel"
echo "3. Deploy to Railway"
echo "4. Manual deployment"
echo "5. Exit"
echo ""

read -p "Choose deployment option (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to Render..."
        echo "Please follow these steps:"
        echo ""
        echo "1. Create GitHub repository:"
        echo "   git init"
        echo "   git add ."
        echo "   git commit -m 'Initial commit: Custom Voice Bot System'"
        echo "   git branch -M main"
        echo "   git remote add origin https://github.com/yourusername/hera-voice-bot.git"
        echo "   git push -u origin main"
        echo ""
        echo "2. Go to https://render.com"
        echo "3. Create new Web Service"
        echo "4. Connect your GitHub repository"
        echo "5. Configure environment variables"
        echo "6. Deploy!"
        echo ""
        echo "📖 See RENDER_DEPLOYMENT.md for detailed instructions"
        ;;
    2)
        echo ""
        echo "🚀 Deploying to Vercel..."
        echo "Please follow these steps:"
        echo ""
        echo "1. Install Vercel CLI:"
        echo "   npm i -g vercel"
        echo ""
        echo "2. Deploy:"
        echo "   vercel"
        echo ""
        echo "3. Configure environment variables in Vercel dashboard"
        ;;
    3)
        echo ""
        echo "🚀 Deploying to Railway..."
        echo "Please follow these steps:"
        echo ""
        echo "1. Go to https://railway.app"
        echo "2. Create new project"
        echo "3. Connect GitHub repository"
        echo "4. Configure environment variables"
        echo "5. Deploy!"
        ;;
    4)
        echo ""
        echo "🔧 Manual Deployment"
        echo "==================="
        echo "1. Set up your own server"
        echo "2. Install Node.js and npm"
        echo "3. Clone repository"
        echo "4. Install dependencies: npm install"
        echo "5. Configure environment variables"
        echo "6. Start server: node server.js"
        echo "7. Set up reverse proxy (nginx)"
        echo "8. Configure SSL certificate"
        ;;
    5)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

# Step 6: Next steps
echo ""
echo "🎯 Next Steps"
echo "============="
echo "1. 📞 Set up Twilio (see TWILIO_SETUP_GUIDE.md)"
echo "2. 🗓️  Set up Google Calendar (see GOOGLE_CALENDAR_SETUP.md)"
echo "3. 🌐 Deploy to production"
echo "4. 📞 Test with real phone calls (see PHONE_TESTING_GUIDE.md)"
echo ""
echo "📚 Documentation:"
echo "- TWILIO_SETUP_GUIDE.md"
echo "- GOOGLE_CALENDAR_SETUP.md"
echo "- RENDER_DEPLOYMENT.md"
echo "- PHONE_TESTING_GUIDE.md"
echo "- SETUP_GUIDE.md"
echo ""
echo "🎉 Your custom voice bot system is ready for production!" 