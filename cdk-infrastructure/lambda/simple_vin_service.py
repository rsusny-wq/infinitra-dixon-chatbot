"""
Simple VIN Service - Direct NHTSA API Integration
A simplified version that actually calls the NHTSA API and returns real data
"""

import requests
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def validate_vin_format(vin: str) -> bool:
    """
    Basic VIN format validation (17 chars, no I/O/Q)
    """
    if not vin or len(vin) != 17:
        return False
    
    # VIN format: 17 characters, no I, O, or Q
    vin_pattern = r'^[A-HJ-NPR-Z0-9]{17}$'
    return bool(re.match(vin_pattern, vin.upper()))

def call_nhtsa_api(vin: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Call NHTSA VPIC API directly and return results
    """
    try:
        logger.info(f"🔍 Calling NHTSA API for VIN: {vin[:8]}...")
        
        # NHTSA VPIC API endpoint
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json"
        logger.info(f"🔍 API URL: {url}")
        
        # Make the API call
        response = requests.get(url, timeout=timeout)
        logger.info(f"🔍 NHTSA API response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('Results', [])
            
            if results:
                result = results[0]
                error_code = result.get('ErrorCode', '1')
                
                logger.info(f"🔍 NHTSA Error Code: {error_code}")
                
                if error_code == '0':
                    # Success - extract vehicle data
                    vehicle_data = {
                        'make': result.get('Make', ''),
                        'model': result.get('Model', ''),
                        'year': result.get('ModelYear', ''),
                        'engine': result.get('EngineModel', ''),
                        'transmission': result.get('TransmissionStyle', ''),
                        'body_class': result.get('BodyClass', ''),
                        'fuel_type': result.get('FuelTypePrimary', ''),
                        'drive_type': result.get('DriveType', ''),
                        'brake_system': result.get('BrakeSystemType', ''),
                        'plant_country': result.get('PlantCountry', ''),
                        'manufacturer': result.get('Manufacturer', ''),
                        'vehicle_type': result.get('VehicleType', '')
                    }
                    
                    logger.info(f"✅ NHTSA API success: {vehicle_data['year']} {vehicle_data['make']} {vehicle_data['model']}")
                    
                    return {
                        'success': True,
                        'valid': True,
                        'nhtsa_verified': True,
                        'vehicle_data': vehicle_data,
                        'raw_result': result,
                        'error': None
                    }
                elif error_code == '8':
                    # Partial data available - extract what we can
                    vehicle_data = {
                        'make': result.get('Make', ''),
                        'model': result.get('Model', '') or 'Unknown Model',
                        'year': result.get('ModelYear', ''),
                        'engine': result.get('EngineModel', ''),
                        'transmission': result.get('TransmissionStyle', ''),
                        'body_class': result.get('BodyClass', ''),
                        'fuel_type': result.get('FuelTypePrimary', ''),
                        'drive_type': result.get('DriveType', ''),
                        'brake_system': result.get('BrakeSystemType', ''),
                        'plant_country': result.get('PlantCountry', ''),
                        'manufacturer': result.get('Manufacturer', ''),
                        'vehicle_type': result.get('VehicleType', '')
                    }
                    
                    logger.info(f"✅ NHTSA API partial success: {vehicle_data['year']} {vehicle_data['make']} {vehicle_data['model']}")
                    logger.info("ℹ️ Limited data available - some vehicle specifications may be missing")
                    
                    return {
                        'success': True,
                        'valid': True,
                        'nhtsa_verified': True,
                        'partial_data': True,
                        'vehicle_data': vehicle_data,
                        'raw_result': result,
                        'error': None,
                        'note': 'Limited data available from NHTSA - some specifications may be missing'
                    }
                else:
                    error_text = result.get('ErrorText', 'Unknown error')
                    logger.warning(f"⚠️ NHTSA API error: {error_text}")
                    
                    return {
                        'success': False,
                        'valid': False,
                        'nhtsa_verified': True,
                        'error': f"NHTSA validation failed: {error_text}",
                        'error_code': error_code
                    }
            else:
                logger.error("❌ No results in NHTSA API response")
                return {
                    'success': False,
                    'valid': False,
                    'nhtsa_verified': False,
                    'error': 'No results from NHTSA API'
                }
        else:
            logger.error(f"❌ NHTSA API HTTP error: {response.status_code}")
            return {
                'success': False,
                'valid': False,
                'nhtsa_verified': False,
                'error': f'NHTSA API HTTP error: {response.status_code}'
            }
            
    except requests.exceptions.Timeout:
        logger.error("❌ NHTSA API timeout")
        return {
            'success': False,
            'valid': False,
            'nhtsa_verified': False,
            'error': 'NHTSA API timeout'
        }
    except Exception as e:
        logger.error(f"❌ NHTSA API error: {e}")
        return {
            'success': False,
            'valid': False,
            'nhtsa_verified': False,
            'error': f'NHTSA API error: {str(e)}'
        }

def process_vin(vin: str) -> Dict[str, Any]:
    """
    Complete VIN processing: validation + NHTSA API call
    """
    logger.info(f"🔍 Processing VIN: {vin}")
    
    # Step 1: Format validation
    if not validate_vin_format(vin):
        logger.warning(f"⚠️ Invalid VIN format: {vin}")
        return {
            'success': False,
            'valid': False,
            'nhtsa_verified': False,
            'error': f'Invalid VIN format. VIN must be exactly 17 characters with no I, O, or Q.',
            'vin': vin
        }
    
    # Step 2: NHTSA API call
    result = call_nhtsa_api(vin.upper())
    result['vin'] = vin.upper()
    
    return result

def extract_vin_from_message(message: str) -> Optional[str]:
    """
    Extract VIN from user message
    """
    # Look for 17-character VIN pattern
    vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
    matches = re.findall(vin_pattern, message.upper())
    
    if matches:
        return matches[0]
    
    return None

# Test function for debugging
def test_vin_processing():
    """
    Test VIN processing with a known VIN
    """
    test_vin = "19XFB2F50EE204959"  # 2014 Honda Civic
    
    print(f"Testing VIN: {test_vin}")
    result = process_vin(test_vin)
    print(f"Result: {result}")
    
    return result

if __name__ == "__main__":
    # Run test if executed directly
    test_vin_processing()
