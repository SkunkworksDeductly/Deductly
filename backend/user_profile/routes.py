from flask import Blueprint, request, jsonify
from .logic import get_geolocation_from_ip

user_profile_bp = Blueprint('user_profile', __name__, url_prefix='/api/user-profile')

@user_profile_bp.route('/geolocation', methods=['GET'])
def get_geolocation():
    """Get geolocation data based on client IP address"""
    # Get client IP from request headers (handles proxies)
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    if client_ip:
        # X-Forwarded-For can contain multiple IPs, take the first one
        client_ip = client_ip.split(',')[0].strip()

    geo_data = get_geolocation_from_ip(client_ip)
    return jsonify(geo_data)
