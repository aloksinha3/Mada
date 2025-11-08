# SabCare Quick Start Guide

## ✅ Twilio Configuration Complete!

Your Twilio credentials have been configured in `backend/config.yaml`:
- **Account SID**: [Configure in config.yaml]
- **Auth Token**: [Configure in config.yaml]
- **Phone Number**: [Configure in config.yaml]

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd /Users/aloksinha/SabCare

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ..
npm install
```

### 2. Initialize Database

```bash
cd backend
python init_db.py
```

### 3. Test Twilio Connection

```bash
cd backend
python test_twilio.py
```

### 4. Start the Backend Server

```bash
cd backend
export KMP_DUPLICATE_LIB_OK=TRUE
python -c "import sys; sys.path.append('.'); from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

Or use the run script:
```bash
./backend/run.sh
```

### 5. Start the Frontend (in a new terminal)

```bash
cd /Users/aloksinha/SabCare
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📞 Setting Up Twilio Webhooks

### For Local Testing (using ngrok):

1. **Install ngrok**: Download from https://ngrok.com/

2. **Start ngrok** (in a new terminal):
   ```bash
   ngrok http 8000
   ```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

4. **Configure in Twilio Dashboard**:
   - Go to https://console.twilio.com/
   - Navigate to **Phone Numbers** > **Manage** > **Active Numbers**
   - Click on your Twilio phone number
   - Under **Voice & Fax**, set:
     - **A CALL COMES IN**: `https://your-ngrok-url.ngrok.io/twilio/voice`
     - **HTTP Method**: POST

### For Production:

Use your production server URL instead of ngrok.

## 🧪 Testing the System

### 1. Add a Patient

1. Go to http://localhost:5173/patients
2. Click "Add New Patient"
3. Fill in patient details:
   - Name: Test Patient
   - Phone: Your test phone number (E.164 format: +1234567890)
   - Gestational Age: 20 weeks
   - Risk Category: Low
   - Risk Factors: (optional)
   - Medications: (optional)
4. Click "Create"

### 2. Generate IVR Schedule

1. In the patient list, click "Generate Schedule" for your patient
2. The system will automatically create a comprehensive call schedule
3. View the schedule in the Call Queue page

### 3. Test a Call

You can test making a call programmatically:

```python
from twilio_integration import TwilioService

ts = TwilioService()
call_sid = ts.make_call("+1234567890", "Hello, this is a test call from SabCare")
print(f"Call initiated: {call_sid}")
```

## 📋 Key Features

- ✅ **Patient Management**: Add, edit, and manage patients
- ✅ **IVR Scheduling**: Automatic schedule generation based on patient profile
- ✅ **AI-Powered Messages**: Personalized messages using Gemma AI
- ✅ **Call Queue**: Monitor upcoming calls in real-time
- ✅ **Analytics**: View patient statistics and metrics
- ✅ **Two-Way Communication**: Patients can leave voice messages

## 🔧 Configuration Files

- **Backend Config**: `backend/config.yaml` (Twilio credentials)
- **Environment Variables**: `backend/.env` (optional)
- **Database**: `backend/patients.db` (auto-created)

## 📚 Documentation

- **README.md**: Main project documentation
- **SETUP.md**: Detailed setup instructions
- **TWILIO_SETUP.md**: Twilio-specific setup guide
- **PROJECT_SUMMARY.md**: Complete project overview

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.8+)
- Install dependencies: `pip install -r backend/requirements.txt`
- Check for port conflicts: Ensure port 8000 is available

### Twilio not working
- Verify credentials in `backend/config.yaml`
- Test connection: `python backend/test_twilio.py`
- Check webhook configuration in Twilio dashboard
- For local testing, use ngrok to expose your server

### Frontend won't start
- Check Node.js version: `node --version` (should be 16+)
- Install dependencies: `npm install`
- Check for port conflicts: Ensure port 5173 is available

### Database errors
- Initialize database: `python backend/init_db.py`
- Check file permissions on `backend/patients.db`

## 🎉 Next Steps

1. ✅ Twilio is configured
2. ⏭️ Install dependencies
3. ⏭️ Initialize database
4. ⏭️ Start backend server
5. ⏭️ Start frontend
6. ⏭️ Set up Twilio webhooks (use ngrok for local testing)
7. ⏭️ Add a test patient
8. ⏭️ Generate IVR schedule
9. ⏭️ Test the system!

## 💡 Tips

- Use ngrok for local webhook testing
- Test with your own phone number first
- Check Twilio console for call logs and debugging
- Monitor the backend logs for errors
- Use the API documentation at `/docs` for testing endpoints

---

**Ready to start?** Run the setup commands above and begin testing your SabCare IVR system! 🚀

