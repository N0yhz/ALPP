import asyncio
import sys
from src.services.mail_service import mail_service
from src.config.settings import settings

async def test_email():
    print("--- SMTP Diagnostic Start ---")
    print(f"Server:   {settings.mail_server}")
    print(f"Port:     {settings.mail_port}")
    print(f"Username: {settings.mail_username}")
    print(f"From:     {settings.mail_from}")
    print(f"SSL/TLS:  {settings.mail_ssl_tls}")
    print(f"StartTLS: {settings.mail_starttls}")
    print("-----------------------------")
    
    recipient = "smthboutna@gmail.com" # Using your email from the logs
    print(f"Attempting to send a test email to: {recipient}...")
    
    try:
        # Adding a timeout so it doesn't hang forever
        await asyncio.wait_for(
            mail_service.send_otp_email(recipient, "999999"),
            timeout=15.0
        )
        print("\n✅ SUCCESS: Email sent successfully!")
        print("Check your inbox (and spam folder).")
    except asyncio.TimeoutError:
        print("\n❌ ERROR: Connection timed out. Is your internet okay? Or is the SMTP port blocked?")
    except Exception as e:
        print(f"\n❌ ERROR: Failed to send email.")
        print(f"Details: {type(e).__name__}: {str(e)}")
        
    print("\n--- Diagnostic Finished ---")

if __name__ == "__main__":
    try:
        asyncio.run(test_email())
    except KeyboardInterrupt:
        print("\nStopped by user.")
        sys.exit(0)
