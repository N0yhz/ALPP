from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from src.config.settings import settings
from datetime import datetime
from pathlib import Path

class MailService:
    def __init__(self):
        # Default to settings, but override based on standard ports for safety
        use_starttls = settings.mail_starttls
        use_ssl = settings.mail_ssl_tls
        
        if settings.mail_port == 587:
            use_starttls = True
            use_ssl = False
        elif settings.mail_port == 465:
            use_ssl = True
            use_starttls = False
        
        # Log port configuration on initialization (useful for Railway logs)
        print(f"INFO: Initializing MailService on port {settings.mail_port} (STARTTLS: {use_starttls}, SSL: {use_ssl})")

        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.mail_username,
            MAIL_PASSWORD=settings.mail_password,
            MAIL_FROM=settings.mail_from,
            MAIL_PORT=settings.mail_port,
            MAIL_SERVER=settings.mail_server,
            MAIL_FROM_NAME=settings.mail_from_name,
            MAIL_STARTTLS=use_starttls,
            MAIL_SSL_TLS=use_ssl,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
            TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates'
        )
        self.fastmail = FastMail(self.conf)

    async def send_otp_email(self, email: str, otp_code: str):
        try:
            message = MessageSchema(
                subject="Your Verification Code",
                recipients=[email],
                template_body={
                    "otp_code": otp_code,
                    "year": datetime.now().year
                },
                subtype=MessageType.html
            )
            await self.fastmail.send_message(message, template_name="otp_verification.html")
            print(f"INFO: Email sent successfully to {email}")
        except Exception as e:
            print(f"ERROR: Failed to send email to {email}: {str(e)}")
            # For debugging, let's also print the config (careful with password)
            print(f"DEBUG: Mail Config - Server: {settings.mail_server}, Port: {settings.mail_port}, User: {settings.mail_username}")

    async def send_reset_email(self, email: str, otp_code: str):
        message = MessageSchema(
            subject="Your Password Reset Code",
            recipients=[email],
            template_body={
                "otp_code": otp_code,
                "year": datetime.now().year
            },
            subtype=MessageType.html
        )
        await self.fastmail.send_message(message, template_name="password_reset.html")

mail_service = MailService()
