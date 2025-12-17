"""
HTTP request and response utilities for Azure Functions.

This module provides common functions for handling HTTP requests, parsing JSON,
validating input, and creating standardized HTTP responses.
"""
import logging
import json
import azure.functions as func
from typing import Any, Optional


def parse_json_body(req: func.HttpRequest) -> tuple[Optional[dict[str, Any]], Optional[func.HttpResponse]]:
    """
    Parse JSON body from HTTP request with error handling.
    
    Args:
        req: Azure Function HTTP request object
    
    Returns:
        Tuple of (parsed body dictionary, error response).
        If parsing succeeds, returns (body_dict, None).
        If parsing fails, returns (None, error_response).
    """
    try:
        body = req.get_json()
        return body, None
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        error_response = func.HttpResponse(
            "Invalid JSON",
            status_code=400,
            mimetype="text/plain"
        )
        return None, error_response


def validate_email(email: Optional[str]) -> tuple[Optional[str], Optional[func.HttpResponse]]:
    """
    Validate and normalize email address.
    
    Args:
        email: Email address string (may be None)
    
    Returns:
        Tuple of (normalized_email, error_response).
        If validation succeeds, returns (normalized_email, None).
        If validation fails, returns (None, error_response).
    """
    if not email:
        logging.warning("Missing email field in request")
        error_response = func.HttpResponse(
            "Missing 'email' field in request body",
            status_code=400,
            mimetype="text/plain"
        )
        return None, error_response
    
    # Normalize email: strip whitespace and convert to lowercase
    normalized_email = email.strip().lower()
    
    # Basic email validation
    if not normalized_email or "@" not in normalized_email:
        logging.warning(f"Invalid email address provided: {email}")
        error_response = func.HttpResponse(
            "Invalid email address format",
            status_code=400,
            mimetype="text/plain"
        )
        return None, error_response
    
    return normalized_email, None


def validate_required_fields(
    body: dict[str, Any],
    required_fields: list[str]
) -> tuple[Optional[func.HttpResponse], dict[str, Any]]:
    """
    Validate that required fields are present in request body.
    
    Args:
        body: Request body dictionary
        required_fields: List of required field names
    
    Returns:
        Tuple of (error_response, extracted_fields_dict).
        If validation succeeds, returns (None, extracted_fields_dict).
        If validation fails, returns (error_response, {}).
    """
    missing_fields = [field for field in required_fields if not body.get(field)]
    
    if missing_fields:
        field_names = ", ".join([f"'{field}'" for field in missing_fields])
        logging.warning(f"Missing required fields in request: {field_names}")
        error_response = func.HttpResponse(
            f"Missing required fields: {field_names}",
            status_code=400,
            mimetype="text/plain"
        )
        return error_response, {}
    
    extracted_fields = {field: body.get(field) for field in required_fields}
    return None, extracted_fields


def create_error_response(
    message: str,
    status_code: int = 500,
    log_error: bool = True
) -> func.HttpResponse:
    """
    Create a standardized error HTTP response.
    
    Args:
        message: Error message to return
        status_code: HTTP status code (default: 500)
        log_error: Whether to log the error (default: True)
    
    Returns:
        HTTP response with error message
    """
    if log_error:
        logging.error(message)
    
    return func.HttpResponse(
        message,
        status_code=status_code,
        mimetype="text/plain"
    )


def create_success_response(
    data: Any = None,
    message: Optional[str] = None,
    status_code: int = 200
) -> func.HttpResponse:
    """
    Create a standardized success HTTP response.
    
    Args:
        data: Data to return in JSON response (if None, returns plain text)
        message: Success message (used if data is None)
        status_code: HTTP status code (default: 200)
    
    Returns:
        HTTP response with JSON data or plain text message
    """
    if data is not None:
        return func.HttpResponse(
            json.dumps(data),
            status_code=status_code,
            mimetype="application/json"
        )
    else:
        return func.HttpResponse(
            message or "Success",
            status_code=status_code,
            mimetype="text/plain"
        )


def build_table_query(partition_key: str, filters: dict[str, str]) -> str:
    """
    Build an Azure Table Storage query string.
    
    Args:
        partition_key: Partition key value
        filters: Dictionary of field names to values for filtering
    
    Returns:
        Query string for Azure Table Storage
    """
    query_parts = [f"PartitionKey eq '{partition_key}'"]
    
    for field, value in filters.items():
        query_parts.append(f" and {field} eq '{value}'")
    
    return "".join(query_parts)

