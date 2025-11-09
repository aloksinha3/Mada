import os
import yaml
from typing import Dict, Optional
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from database import Database

class TwilioService:
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize Twilio Service
        
        Credentials are loaded from:
        1. Environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)
        2. config.yaml file (twilio.account_sid, twilio.auth_token, twilio.from_number)
        
        Configured credentials:
        - Account SID: ACd2ed65282f924c5637f277f7f5160336
        - From Number: +19199180358
        """
        self.config = self._load_config(config_path)
        self.db = Database()
        
        # Twilio credentials - check environment variables first, then config file
        account_sid = os.getenv("TWILIO_ACCOUNT_SID") or self.config.get("twilio", {}).get("account_sid")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN") or self.config.get("twilio", {}).get("auth_token")
        self.from_number = os.getenv("TWILIO_FROM_NUMBER") or self.config.get("twilio", {}).get("from_number")
        
        if account_sid and auth_token:
            try:
                self.client = Client(account_sid, auth_token)
                print(f"✅ Twilio service initialized successfully")
                print(f"   From Number: {self.from_number}")
            except Exception as e:
                print(f"⚠️ Error initializing Twilio client: {e}")
                self.client = None
        else:
            print("⚠️ Twilio credentials not found. Some features will be disabled.")
            print("   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER")
            print("   or configure them in config.yaml")
            self.client = None
    
    def _load_config(self, config_path: str) -> dict:
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        return {}
    
    def make_call(self, to_number: str, message_text: str, patient_id: int = None, use_twiml: bool = False) -> Optional[str]:
        """Make a phone call using Twilio
        
        Args:
            to_number: Phone number to call (E.164 format, e.g., +1234567890)
            message_text: Message to deliver during the call
            patient_id: Optional patient ID for tracking
            use_twiml: If True, use TwiML directly instead of webhook URL (for testing)
            
        Returns:
            Call SID if successful, None otherwise
            
        Note:
            For local testing, either:
            1. Set SERVER_URL to your ngrok URL: export SERVER_URL=https://your-ngrok-url.ngrok.io
            2. Or use use_twiml=True to generate TwiML directly (simpler for testing)
        """
        if not self.client:
            print("⚠️ Twilio client not initialized. Cannot make call.")
            print("   Check that Twilio credentials are configured in config.yaml or environment variables.")
            return None
        
        if not self.from_number:
            print("⚠️ Twilio from_number not configured. Cannot make call.")
            return None
        
        try:
            print(f"📞 Making call to {to_number} from {self.from_number}")
            
            if use_twiml:
                # Generate TwiML directly for testing (no webhook needed)
                # Simple message delivery - no user interaction
                response = VoiceResponse()
                # Remove "Press 1" text if present in message
                clean_message = message_text.split("\n\nPress 1")[0].strip()
                response.say(clean_message, voice="alice", language="en-US")
                response.hangup()
                twiml = str(response)
                
                print(f"   Using TwiML directly (no webhook required)")
                call = self.client.calls.create(
                    to=to_number,
                    from_=self.from_number,
                    twiml=twiml
                )
            else:
                # Use webhook URL (requires publicly accessible server)
                server_url = os.getenv("SERVER_URL", "http://localhost:8000")
                webhook_url = f"{server_url}/twilio/voice"
                
                print(f"   Webhook URL: {webhook_url}")
                call = self.client.calls.create(
                    to=to_number,
                    from_=self.from_number,
                    url=webhook_url,
                    method="POST"
                )
            
            print(f"✅ Call initiated: {call.sid}")
            return call.sid
        except Exception as e:
            print(f"❌ Error making call: {e}")
            if not use_twiml:
                print(f"   Try using use_twiml=True for testing, or set SERVER_URL to a publicly accessible URL (use ngrok)")
            return None
    
    def handle_inbound_call(self, request: Dict) -> str:
        """Handle inbound Twilio call and generate TwiML response
        
        Simplified version: Only delivers the message and hangs up.
        No user interaction or message recording.
        """
        response = VoiceResponse()
        
        # Get caller's phone number
        caller_number = request.get("From", "")
        
        # Find patient by phone number
        patients = self.db.get_all_patients()
        patient = next((p for p in patients if p.get("phone") == caller_number), None)
        
        if patient:
            # Get the next scheduled call message for this patient
            import json
            call_schedule_str = patient.get("call_schedule") or "[]"
            try:
                call_schedule = json.loads(call_schedule_str) if isinstance(call_schedule_str, str) else call_schedule_str
            except (json.JSONDecodeError, TypeError):
                call_schedule = []
            
            if call_schedule:
                # Get the next scheduled message
                from datetime import datetime
                now = datetime.now()
                upcoming_calls = [
                    c for c in call_schedule
                    if isinstance(c, dict) and c.get("scheduled_time") and datetime.fromisoformat(c["scheduled_time"]) > now
                ]
                
                if upcoming_calls:
                    next_call = upcoming_calls[0]
                    message_text = next_call.get("message_text", "Hello, this is SabCare.")
                else:
                    message_text = f"Hello {patient.get('name', 'Patient')}, this is SabCare. Thank you for your call."
            else:
                message_text = f"Hello {patient.get('name', 'Patient')}, this is SabCare. Thank you for your call."
        else:
            message_text = "Hello, this is SabCare. Thank you for calling."
        
        # Say the message and hang up (no user interaction)
        response.say(message_text, voice="alice", language="en-US")
        response.say("Thank you for calling SabCare. Goodbye.", voice="alice")
        response.hangup()
        
        return str(response)
    
    def handle_key_press(self, request: Dict) -> str:
        """Handle key press during call (DISABLED - feature removed)
        
        This method is kept for backward compatibility but is no longer used.
        All calls now simply deliver the message and hang up.
        """
        response = VoiceResponse()
        response.say("This feature is no longer available. Thank you for calling. Goodbye.", voice="alice")
        response.hangup()
        return str(response)
    
    def handle_recording(self, request: Dict) -> str:
        """Handle recorded message (DISABLED - feature removed)
        
        This method is kept for backward compatibility but is no longer used.
        Message recording functionality has been removed.
        """
        response = VoiceResponse()
        response.say("This feature is no longer available. Thank you for calling. Goodbye.", voice="alice")
        response.hangup()
        return str(response)
    
    def send_sms(self, to_number: str, message: str) -> Optional[str]:
        """Send SMS using Twilio"""
        if not self.client:
            print("⚠️ Twilio client not initialized. Cannot send SMS.")
            return None
        
        try:
            message = self.client.messages.create(
                to=to_number,
                from_=self.from_number,
                body=message
            )
            return message.sid
        except Exception as e:
            print(f"❌ Error sending SMS: {e}")
            return None

