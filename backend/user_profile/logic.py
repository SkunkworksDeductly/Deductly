import requests

def get_geolocation_from_ip(ip_address):
    """
    Get geographical information from IP address using ip-api.com (free, no API key required)

    Args:
        ip_address: The IP address to lookup

    Returns:
        Dictionary with geolocation data including country, region, city, timezone, etc.
    """
    # Handle localhost/private IPs
    if ip_address in ['127.0.0.1', 'localhost', '::1'] or ip_address.startswith('192.168.') or ip_address.startswith('10.'):
        return {
            'ip': ip_address,
            'country': 'Local',
            'countryCode': 'LC',
            'region': 'N/A',
            'regionName': 'Local Network',
            'city': 'Local',
            'zip': 'N/A',
            'lat': 0,
            'lon': 0,
            'timezone': 'UTC',
            'isp': 'Local',
            'org': 'Local Network',
            'as': 'N/A',
            'query': ip_address,
            'status': 'success'
        }

    try:
        # Use ip-api.com free API (no key required, 45 requests/minute limit)
        response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=5)

        if response.status_code == 200:
            data = response.json()

            if data.get('status') == 'success':
                return {
                    'ip': ip_address,
                    'country': data.get('country'),
                    'countryCode': data.get('countryCode'),
                    'region': data.get('region'),
                    'regionName': data.get('regionName'),
                    'city': data.get('city'),
                    'zip': data.get('zip'),
                    'lat': data.get('lat'),
                    'lon': data.get('lon'),
                    'timezone': data.get('timezone'),
                    'isp': data.get('isp'),
                    'org': data.get('org'),
                    'as': data.get('as'),
                    'query': data.get('query'),
                    'status': 'success'
                }
            else:
                return {
                    'ip': ip_address,
                    'status': 'fail',
                    'message': data.get('message', 'Failed to get geolocation')
                }
        else:
            return {
                'ip': ip_address,
                'status': 'fail',
                'message': 'Geolocation service unavailable'
            }

    except Exception as e:
        return {
            'ip': ip_address,
            'status': 'fail',
            'message': f'Error fetching geolocation: {str(e)}'
        }
