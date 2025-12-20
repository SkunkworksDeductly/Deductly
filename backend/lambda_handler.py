"""
AWS Lambda Handler for Deductly Backend
Uses Mangum with WsgiToAsgi to adapt Flask app for Lambda execution
"""
from mangum import Mangum
from asgiref.wsgi import WsgiToAsgi
from app import app

# Convert Flask WSGI app to ASGI
asgi_app = WsgiToAsgi(app)

# Mangum handler wraps ASGI app for AWS Lambda
handler = Mangum(asgi_app, lifespan="off")

# AWS Lambda will call this handler function
def lambda_handler(event, context):
    """
    Lambda entry point

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    return handler(event, context)
