"""
ElevenLabs Telephony Service
Handles integration with ElevenLabs Conversational AI for voice calls
"""
import os
import yaml
from typing import Optional, Dict
from elevenlabs import ElevenLabs

class ElevenLabsService:
    """Service for interacting with ElevenLabs Conversational AI"""
    
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize ElevenLabs service
        
        Args:
            config_path: Path to config.yaml file
        """
        self.config = self._load_config(config_path)
        self.client = None
        self.api_key = None
        self.agent_id = None
        self.phone_number_id = None
        self.enabled = False
        
        # Load ElevenLabs configuration
        elevenlabs_config = self.config.get("elevenlabs", {})
        self.api_key = os.getenv("ELEVEN_API_KEY") or elevenlabs_config.get("api_key")
        self.agent_id = elevenlabs_config.get("agent_id")
        self.phone_number_id = elevenlabs_config.get("phone_number_id")
        self.enabled = elevenlabs_config.get("enabled", False)
        
        if self.enabled and self.api_key:
            try:
                # Initialize ElevenLabs client
                self.client = ElevenLabs(api_key=self.api_key)
                print(f"✅ ElevenLabs service initialized successfully")
                print(f"   Agent ID: {self.agent_id}")
                print(f"   Phone Number ID: {self.phone_number_id}")
            except Exception as e:
                print(f"⚠️ Error initializing ElevenLabs client: {e}")
                self.client = None
                self.enabled = False
        else:
            if not self.enabled:
                print("ℹ️  ElevenLabs is disabled in config")
            else:
                print("⚠️ ElevenLabs API key not found. Set ELEVEN_API_KEY or configure in config.yaml")
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file"""
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        return {}
    
    def make_outbound_call(self, to_number: str, patient_id: Optional[int] = None, 
                          user_name: Optional[str] = None, medication_name: Optional[str] = None,
                          call_type: Optional[str] = None, custom_message: Optional[str] = None) -> Optional[str]:
        """Make an outbound call using ElevenLabs agent
        
        Args:
            to_number: Phone number to call (E.164 format)
            patient_id: Optional patient ID for tracking
            user_name: Patient's name for personalized greeting
            medication_name: Medication name for medication reminders
            call_type: Type of call (medication_reminder, weekly_checkin, etc.)
            custom_message: Custom message to use (if provided, overrides template)
            
        Returns:
            Call SID if successful, None otherwise
        """
        if not self.enabled or not self.client:
            return None
        
        if not self.agent_id or not self.phone_number_id:
            print("⚠️ ElevenLabs agent_id or phone_number_id not configured")
            return None
        
        try:
            # Generate the custom prompt based on call type
            if custom_message:
                prompt = custom_message
            elif call_type == "medication_reminder" and user_name and medication_name:
                # Medication check-in template
                prompt = f"Hello {user_name}, this is your health assistant. Please remember to take your {medication_name} today."
            elif call_type in ["weekly_checkin", "general_checkin"] and user_name:
                # General check-in template
                prompt = f"Hello {user_name}, this is your health assistant. How are you feeling today? I'm calling to check in on your health and see if you have any questions or concerns."
            elif user_name:
                # Default personalized greeting
                prompt = f"Hello {user_name}, this is your health assistant. How can I help you today?"
            else:
                # Generic greeting
                prompt = "Hello, this is your health assistant. How can I help you today?"
            
            # Make outbound call through ElevenLabs with metadata.custom_prompt
            call_params = {
                "agent_id": self.agent_id,
                "agent_phone_number_id": self.phone_number_id,
                "to_number": to_number,
                "metadata": {
                    "custom_prompt": prompt
                }
            }
            
            print(f"📝 Using custom prompt: {prompt[:100]}...")
            
            response = self.client.conversational_ai.twilio.outbound_call(**call_params)
            
            # Extract call SID from response
            call_sid = None
            if hasattr(response, 'call_sid'):
                call_sid = response.call_sid
            elif isinstance(response, dict):
                call_sid = response.get('call_sid')
            
            if call_sid:
                print(f"✅ ElevenLabs outbound call initiated: {call_sid}")
                print(f"📝 Custom prompt: {prompt[:100]}...")
                return call_sid
            else:
                print(f"⚠️ ElevenLabs call initiated but no call_sid returned")
                return "elevenlabs_call"
        except Exception as e:
            print(f"❌ Error making ElevenLabs outbound call: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_inbound_call_twiml(self, from_number: str, initial_message: Optional[str] = None) -> str:
        """Generate TwiML to connect inbound call to ElevenLabs agent
        
        For ElevenLabs telephony with Twilio, we redirect the call to ElevenLabs'
        webhook endpoint which handles the conversation with the AI agent.
        The initial_message will be passed as the first prompt to the agent.
        
        Args:
            from_number: Phone number of the caller
            initial_message: Template message to use as the agent's first prompt
            
        Returns:
            TwiML XML string to connect call to ElevenLabs
        """
        if not self.enabled or not self.agent_id or not self.phone_number_id:
            # Fallback to basic TwiML if ElevenLabs not available
            from twilio.twiml.voice_response import VoiceResponse
            response = VoiceResponse()
            if initial_message:
                response.say(initial_message, voice="alice")
            else:
                response.say("Sorry, the voice agent is not available at this time.", voice="alice")
            response.hangup()
            return str(response)
        
        # Generate TwiML to redirect call to ElevenLabs
        # ElevenLabs provides a webhook endpoint that handles the conversation
        from twilio.twiml.voice_response import VoiceResponse, Redirect
        import urllib.parse
        
        response = VoiceResponse()
        
        # Build the ElevenLabs webhook URL with agent and phone number IDs
        webhook_url = (
            f"https://api.elevenlabs.io/v1/convai/twilio/inbound-call"
            f"?agent_id={self.agent_id}"
            f"&phone_number_id={self.phone_number_id}"
        )
        
        # If we have an initial message, pass it to the agent
        # ElevenLabs agents can receive context through webhook parameters
        # We'll pass it as 'context' or 'initial_message' parameter
        if initial_message:
            # URL encode the initial message
            encoded_message = urllib.parse.quote(initial_message)
            # Try multiple parameter names that ElevenLabs might support
            webhook_url += f"&context={encoded_message}"
            webhook_url += f"&initial_message={encoded_message}"
        
        # Redirect the call to ElevenLabs
        # ElevenLabs will handle the conversation, starting with the initial message if provided
        response.redirect(url=webhook_url, method="POST")
        
        return str(response)

