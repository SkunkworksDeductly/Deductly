"""
Shared authentication middleware for Flask routes.
Extracts and verifies Firebase authentication tokens.
"""
from flask import request
import firebase_admin
from firebase_admin import auth as firebase_auth


def get_user_id_from_token():
    """
    Extract user_id from Firebase auth token in request headers.

    Returns:
        str: User ID if authentication successful, None otherwise
    """
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        print(f"[AUTH DEBUG] No Bearer token found. Header: {auth_header[:50] if auth_header else 'empty'}")
        return None

    token = auth_header.split('Bearer ')[1]

    try:
        if not firebase_admin._apps:
            print("[AUTH DEBUG] Firebase not initialized")
            return None

        decoded_token = firebase_auth.verify_id_token(token)
        print(f"[AUTH DEBUG] Token verified successfully for uid: {decoded_token['uid']}")
        return decoded_token['uid']
    except Exception as e:
        print(f"[AUTH DEBUG] Token verification failed: {type(e).__name__}: {str(e)}")
        return None
