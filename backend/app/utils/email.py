import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings

logger = logging.getLogger(__name__)

def send_email(subject: str, recipient: str, body: str):
    """
    Sends an email using SMTP settings from the configuration.
    
    If MAIL_USERNAME or MAIL_PASSWORD are not set, it logs the email content 
    to the console for debugging purposes.
    """
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        logger.warning(f"Email not sent to {recipient}: SMTP credentials not configured.")
        print(f"\n{'='*60}")
        print(f"DEBUG EMAIL SENT TO: {recipient}")
        print(f"SUBJECT: {subject}")
        print(f"BODY:\n{body}")
        print(f"{'='*60}\n")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg['To'] = recipient
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    try:
        logger.info(f"Connecting to SMTP server {settings.MAIL_SERVER}:{settings.MAIL_PORT}...")
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=15) as server:
            server.starttls()
            logger.info(f"Logging in to SMTP as {settings.MAIL_USERNAME}...")
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            logger.info(f"Sending email to {recipient}...")
            server.send_message(msg)
            logger.info(f"Email sent successfully to {recipient}")
    except smtplib.SMTPAuthenticationError:
        logger.error(f"SMTP Authentication failed for {settings.MAIL_USERNAME}. Please check App Password.")
        raise Exception("Email authentication failed. Please contact administrator.")
    except smtplib.SMTPConnectError:
        logger.error(f"Could not connect to SMTP server {settings.MAIL_SERVER}.")
        raise Exception("Failed to connect to email server. Please try again later.")
    except Exception as e:
        logger.error(f"Unexpected error sending email to {recipient}: {str(e)}")
        raise Exception(f"Failed to send verification email: {str(e)}")

def send_otp_email(recipient: str, otp: str):
    """Convenience helper to send an OTP for password reset."""
    subject = f"Your OTP for {settings.APP_NAME}"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password for your <strong>{settings.APP_NAME}</strong> account.</p>
                <p>Your One-Time Password (OTP) is:</p>
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3498db;">{otp}</span>
                </div>
                <p>This OTP is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
                <p>Best regards,<br>The {settings.MAIL_FROM_NAME} Team</p>
            </div>
        </body>
    </html>
    """
    send_email(subject, recipient, body)

def send_registration_otp_email(recipient: str, otp: str):
    """Convenience helper to send an OTP for account verification."""
    subject = f"Verify Your Account - {settings.APP_NAME}"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Welcome to {settings.APP_NAME}!</h2>
                <p>Hello,</p>
                <p>Thank you for registering. To complete your account setup, please verify your email address using the following One-Time Password (OTP):</p>
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2ecc71;">{otp}</span>
                </div>
                <p>This OTP is valid for 10 minutes.</p>
                <p>Best regards,<br>The {settings.MAIL_FROM_NAME} Team</p>
            </div>
        </body>
    </html>
    """
    send_email(subject, recipient, body)
