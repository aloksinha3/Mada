#!/usr/bin/env python3
"""Test script to create a patient and execute a test call at 7:31"""

import sys
import os
from datetime import datetime, timedelta

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Database
from twilio_integration import TwilioService

def format_phone_number(phone: str) -> str:
    """Convert phone number to E.164 format"""
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # If it's 10 digits, assume US number and add +1
    if len(digits) == 10:
        return f"+1{digits}"
    # If it's 11 digits and starts with 1, add +
    elif len(digits) == 11 and digits[0] == '1':
        return f"+{digits}"
    # Otherwise, assume it's already in correct format or add +
    elif not phone.startswith('+'):
        return f"+{digits}"
    return phone

def create_test_patient_and_call():
    """Create a test patient and schedule a call for 7:31"""
    
    # Initialize services
    db = Database()
    twilio_service = TwilioService()
    
    # Phone number: 443-622-2793
    phone_number = format_phone_number("443-622-2793")
    print(f"📞 Phone number formatted: {phone_number}")
    
    # Check if patient already exists
    patients = db.get_all_patients()
    existing_patient = next((p for p in patients if p.get('phone') == phone_number), None)
    
    if existing_patient:
        print(f"✅ Patient already exists: {existing_patient['name']} (ID: {existing_patient['id']})")
        patient_id = existing_patient['id']
    else:
        # Create test patient
        print("📝 Creating test patient...")
        patient_id = db.create_patient(
            name="Test Patient",
            phone=phone_number,
            gestational_age_weeks=20,
            risk_factors=[],
            medications=[],
            risk_category="low"
        )
        print(f"✅ Created test patient with ID: {patient_id}")
    
    # Calculate call time: 7:31 AM today (or tomorrow if past 7:31)
    now = datetime.now()
    call_time = now.replace(hour=7, minute=31, second=0, microsecond=0)
    
    # If 7:31 AM has passed today, schedule for tomorrow
    if call_time < now:
        call_time = call_time + timedelta(days=1)
        print(f"⏰ 7:31 AM has passed today, scheduling for tomorrow")
    else:
        print(f"⏰ Scheduling for today at 7:31 AM")
    
    print(f"📅 Call scheduled for: {call_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Create call log
    message_text = "Hello, this is a test call from SabCare. This is your weekly pregnancy check-in. How are you feeling today?"
    
    print("📋 Creating call log...")
    db.create_call_log(
        patient_id=patient_id,
        call_type="test_call",
        status="scheduled",
        message_text=message_text,
        scheduled_time=call_time
    )
    
    # Get the call ID we just created
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id FROM call_logs 
        WHERE patient_id = ? AND scheduled_time = ?
        ORDER BY id DESC LIMIT 1
    """, (patient_id, call_time.isoformat()))
    call_row = cursor.fetchone()
    conn.close()
    
    if call_row:
        call_id = call_row['id']
        print(f"✅ Call log created with ID: {call_id}")
        
        # Execute the call immediately (for testing)
        print("\n🚀 Executing call now (for testing)...")
        print(f"   To: {phone_number}")
        print(f"   From: {twilio_service.from_number}")
        print(f"   Message: {message_text[:50]}...")
        
        # Use TwiML directly for testing (no webhook URL needed)
        call_sid = twilio_service.make_call(
            to_number=phone_number,
            message_text=message_text,
            patient_id=patient_id,
            use_twiml=True  # Use TwiML directly instead of webhook
        )
        
        if call_sid:
            print(f"\n✅ Call initiated successfully!")
            print(f"   Call SID: {call_sid}")
            print(f"   Check Twilio dashboard for call status")
            
            # Update call status
            db.update_call_status(call_id, 'completed', datetime.now())
            print(f"   Call status updated to 'completed'")
        else:
            print(f"\n❌ Failed to initiate call")
            print(f"   Check SERVER_URL is set to a publicly accessible URL (use ngrok)")
            print(f"   Example: export SERVER_URL=https://your-ngrok-url.ngrok.io")
    else:
        print("❌ Failed to retrieve call ID")
    
    print("\n" + "="*60)
    print("Test setup complete!")
    print("="*60)

if __name__ == "__main__":
    try:
        create_test_patient_and_call()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

