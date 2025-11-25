"""
VIN Context Manager - Cross-Conversation VIN Data Persistence
Manages VIN data sharing between VIN processing conversations and main diagnostic conversations
"""

import boto3
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class VINContextManager:
    def __init__(self, s3_bucket: str, region_name: str = 'us-west-2'):
        """
        Initialize VIN Context Manager
        
        Args:
            s3_bucket: S3 bucket for storing VIN context data
            region_name: AWS region name
        """
        self.s3_bucket = s3_bucket
        self.s3_client = boto3.client('s3', region_name=region_name)
        self.vin_prefix = "vin-context/"
        self.expiry_hours = 24  # VIN context expires after 24 hours
        
    def store_vin_context(self, user_id: str, vin_data: Dict[str, Any]) -> bool:
        """
        Store VIN context data for a user
        
        Args:
            user_id: User identifier (can be anonymous user ID)
            vin_data: VIN and vehicle information to store
            
        Returns:
            bool: Success status
        """
        try:
            # Create context object with expiry
            context_data = {
                "vin_data": vin_data,
                "stored_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(hours=self.expiry_hours)).isoformat(),
                "user_id": user_id
            }
            
            # Store in S3
            key = f"{self.vin_prefix}{user_id}.json"
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=key,
                Body=json.dumps(context_data),
                ContentType='application/json'
            )
            
            logger.info(f"✅ VIN context stored for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store VIN context for user {user_id}: {e}")
            return False
    
    def get_vin_context(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve VIN context data for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            Dict with VIN data or None if not found/expired
        """
        try:
            key = f"{self.vin_prefix}{user_id}.json"
            
            # Try to get the object
            response = self.s3_client.get_object(Bucket=self.s3_bucket, Key=key)
            context_data = json.loads(response['Body'].read().decode('utf-8'))
            
            # Check if expired
            expires_at = datetime.fromisoformat(context_data['expires_at'])
            if datetime.utcnow() > expires_at:
                logger.info(f"⏰ VIN context expired for user: {user_id}")
                # Clean up expired context
                self.clear_vin_context(user_id)
                return None
            
            logger.info(f"✅ VIN context retrieved for user: {user_id}")
            return context_data['vin_data']
            
        except self.s3_client.exceptions.NoSuchKey:
            logger.info(f"🔍 No VIN context found for user: {user_id}")
            return None
        except Exception as e:
            logger.error(f"❌ Failed to retrieve VIN context for user {user_id}: {e}")
            return None
    
    def clear_vin_context(self, user_id: str) -> bool:
        """
        Clear VIN context data for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            bool: Success status
        """
        try:
            key = f"{self.vin_prefix}{user_id}.json"
            self.s3_client.delete_object(Bucket=self.s3_bucket, Key=key)
            logger.info(f"🗑️ VIN context cleared for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to clear VIN context for user {user_id}: {e}")
            return False
    
    def extract_vin_from_message(self, message: str) -> Optional[str]:
        """
        Extract VIN from conversational message
        
        Args:
            message: Message content to search for VIN
            
        Returns:
            Extracted VIN or None
        """
        import re
        
        # VIN patterns
        vin_patterns = [
            r'VIN[:\s]*([A-HJ-NPR-Z0-9]{17})',
            r'Vehicle Identification Number[:\s]*([A-HJ-NPR-Z0-9]{17})',
            r'\b([A-HJ-NPR-Z0-9]{17})\b'
        ]
        
        for pattern in vin_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                potential_vin = match.group(1) if match.groups() else match.group(0)
                if len(potential_vin) == 17 and self.validate_vin_format(potential_vin):
                    return potential_vin.upper()
        
        return None
    
    def validate_vin_format(self, vin: str) -> bool:
        """
        Validate VIN format
        
        Args:
            vin: VIN string to validate
            
        Returns:
            bool: True if valid format
        """
        if len(vin) != 17:
            return False
        
        # VINs don't contain I, O, or Q
        if any(char in vin.upper() for char in ['I', 'O', 'Q']):
            return False
        
        # Should be alphanumeric
        if not vin.isalnum():
            return False
        
        return True
    
    def extract_vehicle_info_from_message(self, message: str) -> Optional[Dict[str, str]]:
        """
        Extract vehicle information from conversational message
        
        Args:
            message: Message content to search for vehicle info
            
        Returns:
            Dict with vehicle info or None
        """
        import re
        
        # Look for vehicle information patterns
        patterns = [
            r'(\d{4})\s+([A-Za-z]+)\s+([A-Za-z]+)',  # "2024 Honda Civic"
            r'your\s+(\d{4})\s+([A-Za-z]+)\s+([A-Za-z]+)',  # "your 2024 Honda Civic"
            r'for\s+your\s+(\d{4})\s+([A-Za-z]+)\s+([A-Za-z]+)'  # "for your 2024 Honda Civic"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match and len(match.groups()) >= 3:
                return {
                    "year": match.group(1),
                    "make": match.group(2),
                    "model": match.group(3),
                    "full_info": f"{match.group(1)} {match.group(2)} {match.group(3)}"
                }
        
        return None
