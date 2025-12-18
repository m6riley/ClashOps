"""
Azure Function for sending email verification codes.

This function generates a unique verification code, sends it via email using
Azure Communication Services, and returns the code to the caller.
"""
import logging
import random
import string
import os
import azure.functions as func
from azure.functions import Blueprint
from azure.communication.email import EmailClient

from shared.http_utils import (
    parse_json_body,
    validate_email,
    validate_required_fields,
    create_error_response,
    create_success_response
)

# Azure Functions Blueprint
send_verification_code_bp = Blueprint()


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@send_verification_code_bp.route(route="send_verification_code", auth_level=func.AuthLevel.FUNCTION)
def send_verification_code(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for sending email verification codes.
    
    Generates a unique 6-digit verification code, sends it to the provided
    email address via Azure Communication Services, and returns the code.
    
    Request body should contain:
        - email: Email address to send verification code to
    
    Returns:
        HTTP response with verification code on success, or error response
    """
    logging.info("Send verification code request received")

    # Parse and validate request body
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response

    # Validate required fields
    error_response, fields = validate_required_fields(body, ["email"])
    if error_response:
        return error_response
    
    email = fields["email"]

    # Validate and normalize email address
    email, error_response = validate_email(email)
    if error_response:
        return error_response

    # Generate 6-digit verification code
    verification_code = ''.join(random.choices(string.digits, k=6))
    
    # Get Azure Communication Services connection string from environment
    connection_string = os.environ.get("AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING")
    if not connection_string:
        logging.error("AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING not found in environment variables")
        return create_error_response(
            "Email service configuration error",
            status_code=500
        )

    try:
        # Initialize email client
        client = EmailClient.from_connection_string(connection_string)

        # Create email message
        message = {
            "senderAddress": "DoNotReply@clashops.net",
            "recipients": {
                "to": [{"address": email}]
            },
            "content": {
                "subject": "ClashOps Email Verification Code",
                "plainText": f"Your ClashOps verification code is: {verification_code}\n\nThis code will expire in 10 minutes.",
                "html": f"""
                <html>
                    <body>
                        <h1>ClashOps Email Verification</h1>
                        <p>Your verification code is:</p>
                        <h2 style="font-size: 32px; letter-spacing: 8px; color: #4CAF50; margin: 20px 0;">{verification_code}</h2>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                    </body>
                </html>
                """
            }
        }

        # Send email
        poller = client.begin_send(message)
        result = poller.result()
        
        # Handle result - it may be a dict or object depending on SDK version
        try:
            if isinstance(result, dict):
                message_id = result.get('message_id') or result.get('messageId', 'N/A')
            else:
                message_id = getattr(result, 'message_id', getattr(result, 'messageId', 'N/A'))
            logging.info(f"Verification email sent to {email}. Message ID: {message_id}")
        except Exception as log_error:
            # Log but don't fail if we can't extract message ID
            logging.info(f"Verification email sent to {email} (message ID unavailable: {log_error})")

        # Return verification code to caller
        return create_success_response({
            "message": "Verification code sent successfully",
            "verification_code": verification_code
        })

    except Exception as e:
        logging.error(f"Error sending verification email: {e}")
        return create_error_response(f"Failed to send verification email: {str(e)}")

