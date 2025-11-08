# Twilio Setup Guide

## ✅ Configuration Complete

Your Twilio credentials should be configured in `backend/config.yaml`:
- **Account SID**: [Your Twilio Account SID]
- **Auth Token**: [Your Twilio Auth Token]
- **Phone Number**: [Your Twilio Phone Number]

**Note**: Copy `backend/config.yaml.example` to `backend/config.yaml` and add your credentials.

## 🔧 Next Steps

### 1. Test Twilio Connection

You can test your Twilio connection by running:

```bash
cd backend
python -c "from twilio_integration import TwilioService; ts = TwilioService(); print('✅ Twilio configured successfully!' if ts.client else '❌ Twilio not configured')"
```

### 2. Set Up Twilio Webhooks

For the IVR system to work, you need to configure webhooks in your Twilio dashboard:

1. Go to https://console.twilio.com/
2. Navigate to **Phone Numbers** > **Manage** > **Active Numbers**
3. Click on your Twilio phone number
4. Scroll to **Voice & Fax** section
5. Configure the webhook URLs:
   - **A CALL COMES IN**: `http://your-server-url/twilio/voice`
   - **STATUS CALLBACK URL**: `http://your-server-url/twilio/status` (optional)

### 3. For Local Development

If testing locally, use **ngrok** to expose your local server:

```bash
# Install ngrok (if not already installed)
# Download from https://ngrok.com/

# Start your backend server
cd backend
python -c "import sys; sys.path.append('.'); from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"

# In another terminal, start ngrok
ngrok http 8000

# Use the ngrok URL (e.g., https://abc123.ngrok.io) in Twilio webhooks
```

### 4. Test the Integration

#### Test 1: Make a Test Call
```python
from twilio_integration import TwilioService

ts = TwilioService()
# Replace with a test number you can answer
call_sid = ts.make_call("+1234567890", "Hello, this is a test call from SabCare")
print(f"Call SID: {call_sid}")
```

#### Test 2: Send a Test SMS
```python
from twilio_integration import TwilioService

ts = TwilioService()
message_sid = ts.send_sms("+1234567890", "Hello from SabCare!")
print(f"Message SID: {message_sid}")
```

### 5. Webhook Endpoints

Your backend provides these Twilio webhook endpoints:

- **POST /twilio/voice** - Handles inbound voice calls
- **POST /twilio/handle_key** - Handles keypress during calls (Press 1)
- **POST /twilio/handle_recording** - Handles recorded messages

### 6. Security Notes

⚠️ **Important Security Reminders**:

1. **Never commit credentials to Git**: The `.gitignore` file excludes `config.yaml` and `.env` files
2. **Use environment variables in production**: Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` as environment variables
3. **Rotate tokens regularly**: Change your Auth Token periodically for security
4. **Use HTTPS in production**: Always use HTTPS for webhook URLs in production

### 7. Troubleshooting

#### Issue: "Twilio client not initialized"
- **Solution**: Check that credentials are correctly set in `config.yaml`
- Verify the file is in the `backend/` directory
- Check for typos in Account SID or Auth Token

#### Issue: "Webhook not receiving calls"
- **Solution**: 
  - Ensure your server is publicly accessible (use ngrok for local testing)
  - Verify webhook URLs are correctly configured in Twilio dashboard
  - Check server logs for incoming requests

#### Issue: "Call fails to connect"
- **Solution**:
  - Verify your Twilio phone number is active
  - Check that you have sufficient Twilio credits
  - Verify the recipient number format is correct (E.164 format: +1234567890)

### 8. Production Deployment

For production deployment:

1. **Set environment variables** instead of using config.yaml:
   ```bash
   export TWILIO_ACCOUNT_SID="your_twilio_account_sid"
   export TWILIO_AUTH_TOKEN="your_twilio_auth_token"
   export TWILIO_FROM_NUMBER="your_twilio_phone_number"
   export SERVER_URL="https://your-production-domain.com"
   ```

2. **Update webhook URLs** in Twilio dashboard to point to your production server

3. **Enable HTTPS** on your production server (required by Twilio)

4. **Monitor usage** in Twilio dashboard to track costs

## 📞 Testing the IVR System

1. **Add a patient** through the web interface with a phone number
2. **Generate an IVR schedule** for the patient
3. **The system will automatically schedule calls** based on the patient's profile
4. **When a call is made**, the patient will:
   - Hear a personalized message
   - Be prompted to "Press 1" to leave a message
   - Leave a voice message if they press 1
   - Receive a callback with AI-generated response

## 🎉 You're All Set!

Your Twilio integration is now configured and ready to use. Start your backend server and begin testing the IVR system!

```bash
cd backend
export KMP_DUPLICATE_LIB_OK=TRUE
python -c "import sys; sys.path.append('.'); from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

For questions or issues, refer to the main README.md or check the Twilio console for call logs and debugging information.

