# 🚀 SabCare - Ready to Start!

## ✅ Setup Complete!

Your SabCare installation is complete and ready to use:

- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed  
- ✅ Database initialized
- ✅ Twilio configured and tested
- ✅ All systems ready

## 🎯 Quick Start

### Option 1: Start Everything (Recommended)

**Terminal 1 - Backend:**
```bash
cd /Users/aloksinha/SabCare/backend
./start_server.sh
```

**Terminal 2 - Frontend:**
```bash
cd /Users/aloksinha/SabCare
npm run dev
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd /Users/aloksinha/SabCare/backend
export KMP_DUPLICATE_LIB_OK=TRUE
python -c "import sys; sys.path.append('.'); from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

**Terminal 2 - Frontend:**
```bash
cd /Users/aloksinha/SabCare
npm run dev
```

## 🌐 Access the Application

Once both servers are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📋 What You Can Do Now

### 1. Add a Patient
1. Go to http://localhost:5173/patients
2. Click "Add New Patient"
3. Fill in patient details:
   - Name: Test Patient
   - Phone: Your phone number (E.164 format: +1234567890)
   - Gestational Age: 20 weeks
   - Risk Category: Low
4. Click "Create"

### 2. Generate IVR Schedule
1. In the patient list, click "Generate Schedule"
2. View the schedule in the Call Queue page

### 3. Test Twilio (Optional)
For local testing, you'll need ngrok to expose your server:
```bash
# Install ngrok from https://ngrok.com/
ngrok http 8000

# Then configure the ngrok URL in Twilio dashboard:
# Phone Numbers > [Your Twilio Number] > Voice & Fax
# A CALL COMES IN: https://your-ngrok-url.ngrok.io/twilio/voice
```

## 🔧 Configuration

### Twilio Webhooks Setup

1. **Install ngrok** (for local testing):
   ```bash
   # Download from https://ngrok.com/
   ngrok http 8000
   ```

2. **Configure in Twilio Dashboard**:
   - Go to https://console.twilio.com/
   - Navigate to **Phone Numbers** > **Manage** > **Active Numbers**
   - Click on your Twilio phone number
   - Under **Voice & Fax**, set:
     - **A CALL COMES IN**: `https://your-ngrok-url.ngrok.io/twilio/voice`
     - **HTTP Method**: POST

3. **Test a Call**:
   - Call your Twilio phone number
   - You should hear the IVR message

## 📊 Features Available

- ✅ **Patient Management**: Add, edit, view patients
- ✅ **IVR Scheduling**: Automatic schedule generation
- ✅ **Call Queue**: Monitor upcoming calls
- ✅ **Analytics**: View patient statistics
- ✅ **Twilio Integration**: Ready for voice calls
- ✅ **Personalized Messages**: Fallback text generation (works without AI)

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8000 is available
- Verify Python version: `python --version` (should be 3.8+)
- Check for errors in the terminal

### Frontend won't start
- Check if port 5173 is available
- Verify Node.js version: `node --version` (should be 16+)
- Try: `npm install` again

### Database errors
- Database is already initialized
- If needed, delete `backend/patients.db` and run `python init_db.py` again

### Twilio not working
- Verify credentials in `backend/config.yaml`
- Test connection: `python backend/test_twilio.py`
- For local testing, use ngrok for webhooks

## 📚 Documentation

- **QUICK_START.md**: Quick start guide
- **SETUP.md**: Detailed setup instructions
- **TWILIO_SETUP.md**: Twilio configuration guide
- **INSTALL.md**: Installation guide
- **API Docs**: http://localhost:8000/docs (when backend is running)

## 🎉 You're All Set!

Your SabCare system is ready to use. Start the servers and begin managing patients!

---

**Next Steps:**
1. Start backend server
2. Start frontend server
3. Open http://localhost:5173
4. Add a test patient
5. Generate IVR schedule
6. (Optional) Set up Twilio webhooks for testing calls

Happy coding! 🚀

