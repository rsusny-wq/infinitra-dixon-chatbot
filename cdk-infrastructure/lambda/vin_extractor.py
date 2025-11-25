"""
VIN Extractor - Amazon Textract Integration
Extracts VIN numbers from images using Amazon Textract OCR
"""

import boto3
import base64
import re
import time
import logging
from typing import Dict, Any, Optional, List
from io import BytesIO

logger = logging.getLogger(__name__)

class VINExtractor:
    def __init__(self, region_name: str = 'us-west-2'):
        """Initialize VIN extractor with Textract client"""
        self.textract = boto3.client('textract', region_name=region_name)
        # FIXED: More flexible VIN patterns - removed word boundaries and added multiple patterns
        self.vin_patterns = [
            r'[A-HJ-NPR-Z0-9]{17}',  # Basic 17-character pattern
            r'[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}[A-HJ-NPR-Z0-9]{1,3}',  # Spaced pattern
            r'VIN[:\s]*([A-HJ-NPR-Z0-9]{17})',  # VIN: prefix
            r'Vehicle\s+Identification\s+Number[:\s]*([A-HJ-NPR-Z0-9]{17})',  # Full name prefix
        ]
        self.max_image_size = 10 * 1024 * 1024  # 10MB limit for Textract
        
    def validate_image_size(self, image_bytes: bytes) -> Dict[str, Any]:
        """Validate image size for Textract processing"""
        if len(image_bytes) > self.max_image_size:
            return {
                "valid": False,
                "error": f"Image too large ({len(image_bytes)} bytes). Maximum size is {self.max_image_size} bytes.",
                "fallback_message": "Please try a smaller image or enter VIN manually."
            }
        return {"valid": True}
    
    def extract_vin_from_image(self, image_base64: str) -> Dict[str, Any]:
        """
        Extract VIN from image using Amazon Textract
        
        Args:
            image_base64: Base64 encoded image string
            
        Returns:
            Dict with extraction results
        """
        start_time = time.time()
        
        try:
            logger.info("🔍 Starting VIN extraction from image using Textract")
            
            # Decode base64 image
            try:
                # Handle data URL format (data:image/jpeg;base64,...)
                if image_base64.startswith('data:image'):
                    image_base64 = image_base64.split(',')[1]
                
                image_bytes = base64.b64decode(image_base64)
                logger.info(f"🔍 Image decoded: {len(image_bytes)} bytes")
            except Exception as e:
                logger.error(f"❌ Base64 decode error: {e}")
                return {
                    "vin_found": False,
                    "error": "Invalid image format",
                    "fallback_message": "Image format not supported. Please try another image or enter VIN manually.",
                    "manual_entry_available": True
                }
            
            # Validate image size
            size_check = self.validate_image_size(image_bytes)
            if not size_check["valid"]:
                return {
                    "vin_found": False,
                    **size_check,
                    "manual_entry_available": True
                }
            
            # Call Amazon Textract
            logger.info("🔍 Calling Amazon Textract DetectDocumentText...")
            response = self.textract.detect_document_text(
                Document={'Bytes': image_bytes}
            )
            
            processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            logger.info(f"🔍 Textract processing completed in {processing_time:.0f}ms")
            
            # Log raw Textract response for debugging
            logger.info(f"🔍 RAW TEXTRACT RESPONSE: {response}")
            
            # Extract text and confidence scores
            extracted_text = ""
            confidence_scores = []
            text_blocks = []
            
            for block in response.get('Blocks', []):
                if block['BlockType'] == 'LINE':
                    line_text = block.get('Text', '')
                    line_confidence = block.get('Confidence', 0)
                    
                    # Log each line of text found
                    logger.info(f"📝 TEXTRACT LINE: '{line_text}' (confidence: {line_confidence:.1f}%)")
                    
                    extracted_text += line_text + " "
                    confidence_scores.append(line_confidence)
                    text_blocks.append({
                        "text": line_text,
                        "confidence": line_confidence
                    })
            
            # Log complete extracted text in multiple formats
            logger.info(f"🔍 COMPLETE EXTRACTED TEXT: '{extracted_text.strip()}'")
            logger.info(f"🔍 TEXT BLOCKS FOUND: {[block['text'] for block in text_blocks]}")
            logger.info(f"🔍 AVERAGE CONFIDENCE: {sum(confidence_scores)/len(confidence_scores) if confidence_scores else 0:.1f}%")
            logger.info(f"🔍 Extracted text: {extracted_text[:200]}...")
            logger.info(f"🔍 Found {len(text_blocks)} text blocks")
            logger.info(f"🔍 FULL EXTRACTED TEXT: {extracted_text}")
            
            # Find VIN patterns in extracted text
            vin_matches = self._find_vin_patterns(extracted_text)
            logger.info(f"🔍 VIN pattern matches found: {vin_matches}")
            
            if vin_matches:
                # Get the best VIN match
                best_vin = self._select_best_vin(vin_matches, text_blocks)
                avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
                
                logger.info(f"✅ VIN found: {best_vin['vin'][:8]}... with confidence {best_vin['confidence']:.1f}%")
                
                return {
                    "vin_found": True,
                    "vin": best_vin['vin'],
                    "confidence": best_vin['confidence'] / 100,  # Convert to 0-1 scale
                    "textract_confidence": avg_confidence / 100,
                    "extracted_text": extracted_text.strip(),
                    "processing_time_ms": processing_time,
                    "text_blocks_found": len(text_blocks),
                    "extraction_method": "amazon_textract"
                }
            else:
                logger.warning("⚠️ No VIN pattern found in extracted text")
                return {
                    "vin_found": False,
                    "extracted_text": extracted_text.strip(),
                    "processing_time_ms": processing_time,
                    "text_blocks_found": len(text_blocks),
                    "fallback_message": "No VIN detected in image. VIN should be 17 characters (letters and numbers, no I/O/Q).",
                    "manual_entry_available": True,
                    "extraction_method": "amazon_textract",
                    "suggestions": [
                        "Try taking a clearer photo of the VIN",
                        "Ensure good lighting on the VIN area",
                        "VIN is usually on dashboard or driver's door frame",
                        "You can also enter the VIN manually"
                    ]
                }
                
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            logger.error(f"❌ Textract processing error: {e}")
            
            return {
                "vin_found": False,
                "error": str(e),
                "processing_time_ms": processing_time,
                "fallback_message": "VIN extraction failed. Please try manual VIN entry.",
                "manual_entry_available": True,
                "extraction_method": "amazon_textract",
                "error_type": "textract_error"
            }
    
    def _find_vin_patterns(self, text: str) -> List[str]:
        """Find all potential VIN patterns in text with improved flexibility"""
        logger.info(f"🔍 Searching for VIN patterns in text: {text}")
        
        all_matches = []
        
        # Try multiple text processing approaches
        text_variations = [
            text.upper(),  # Original text uppercase
            text.upper().replace(' ', ''),  # Remove spaces
            text.upper().replace('-', '').replace('_', '').replace(' ', ''),  # Remove all separators
            ''.join(text.upper().split()),  # Remove all whitespace
        ]
        
        # Try each pattern on each text variation
        for text_var in text_variations:
            logger.info(f"🔍 Trying text variation: {text_var[:100]}...")
            
            for pattern in self.vin_patterns:
                try:
                    matches = re.findall(pattern, text_var)
                    if matches:
                        logger.info(f"🔍 Pattern '{pattern}' found matches: {matches}")
                        # Handle both direct matches and group matches
                        for match in matches:
                            if isinstance(match, tuple):
                                # Group match from patterns with parentheses
                                for group in match:
                                    if group and len(group) >= 15:  # At least 15 chars for potential VIN
                                        all_matches.append(group)
                            else:
                                # Direct match
                                if len(match) >= 15:  # At least 15 chars for potential VIN
                                    all_matches.append(match)
                except Exception as e:
                    logger.warning(f"⚠️ Pattern matching error for '{pattern}': {e}")
        
        # Also try to find any 17-character sequences that look like VINs
        # This is a fallback for cases where the regex patterns don't work
        words = text.upper().replace('-', '').replace('_', '').split()
        for word in words:
            # Remove any remaining non-alphanumeric characters
            clean_word = ''.join(c for c in word if c.isalnum())
            if len(clean_word) == 17 and self._basic_vin_check(clean_word):
                logger.info(f"🔍 Found potential VIN in word: {clean_word}")
                all_matches.append(clean_word)
        
        # Remove duplicates and filter
        unique_matches = list(set(all_matches))
        logger.info(f"🔍 Unique matches before validation: {unique_matches}")
        
        # Filter with improved validation
        valid_matches = []
        for match in unique_matches:
            if self._is_likely_vin(match):
                valid_matches.append(match)
                logger.info(f"✅ Valid VIN found: {match}")
            else:
                logger.info(f"❌ Invalid VIN rejected: {match}")
        
        return valid_matches
    
    def _basic_vin_check(self, candidate: str) -> bool:
        """Basic check if a string could be a VIN"""
        if len(candidate) != 17:
            return False
        
        # VINs don't contain I, O, or Q
        if any(char in candidate for char in ['I', 'O', 'Q']):
            return False
        
        # Should be alphanumeric
        if not candidate.isalnum():
            return False
        
        # Should have some letters and some numbers
        has_letter = any(c.isalpha() for c in candidate)
        has_digit = any(c.isdigit() for c in candidate)
        
        return has_letter and has_digit
    
    def _is_likely_vin(self, candidate: str) -> bool:
        """Check if candidate string is likely a real VIN - made less restrictive"""
        if len(candidate) != 17:
            return False
        
        # VINs don't contain I, O, or Q
        if any(char in candidate for char in ['I', 'O', 'Q']):
            return False
        
        # Should be alphanumeric
        if not candidate.isalnum():
            return False
        
        # VINs should have a mix of letters and numbers - made less restrictive
        letter_count = sum(1 for c in candidate if c.isalpha())
        digit_count = sum(1 for c in candidate if c.isdigit())
        
        # FIXED: Less restrictive - just need at least 1 letter and 1 number
        if letter_count < 1 or digit_count < 1:
            return False
        
        # REMOVED: Overly restrictive checks about first character and position 10
        # Real VINs can vary more than our original validation allowed
        
        logger.info(f"✅ VIN validation passed: {candidate} (letters: {letter_count}, digits: {digit_count})")
        return True
    
    def _select_best_vin(self, vin_matches: List[str], text_blocks: List[Dict]) -> Dict[str, Any]:
        """Select the best VIN from multiple matches"""
        if len(vin_matches) == 1:
            # Find confidence for this VIN
            vin = vin_matches[0]
            confidence = self._get_vin_confidence(vin, text_blocks)
            return {"vin": vin, "confidence": confidence}
        
        # Multiple matches - select best based on confidence and position
        best_vin = None
        best_score = 0
        
        for vin in vin_matches:
            confidence = self._get_vin_confidence(vin, text_blocks)
            
            # Score based on confidence and VIN quality
            score = confidence
            
            # Bonus for VINs that appear in high-confidence text blocks
            if confidence > 90:
                score += 10
            
            # Bonus for VINs that match common manufacturer patterns
            if self._matches_common_patterns(vin):
                score += 5
            
            if score > best_score:
                best_score = score
                best_vin = {"vin": vin, "confidence": confidence}
        
        return best_vin or {"vin": vin_matches[0], "confidence": 80}
    
    def _get_vin_confidence(self, vin: str, text_blocks: List[Dict]) -> float:
        """Get confidence score for a specific VIN based on text blocks"""
        confidences = []
        
        for block in text_blocks:
            if vin in block["text"].upper().replace(' ', ''):
                confidences.append(block["confidence"])
        
        if confidences:
            return sum(confidences) / len(confidences)
        
        # Default confidence if not found in specific blocks
        return 85.0
    
    def _matches_common_patterns(self, vin: str) -> bool:
        """Check if VIN matches common manufacturer patterns"""
        # Common World Manufacturer Identifiers
        common_wmi = [
            '1HG', '2HG', '3HG',  # Honda
            '4T1', '5Y2', 'JTD',  # Toyota
            '1FA', '1FB', '1FC',  # Ford
            '1G1', '1G6', '2G1',  # GM
            'WBA', 'WBS', 'WBY',  # BMW
            'WDB', 'WDC', 'WDD',  # Mercedes
            'JHM', 'JH4',         # Acura
            'KNA', 'KMH',         # Hyundai/Kia
        ]
        
        return any(vin.startswith(wmi) for wmi in common_wmi)

# Test function for debugging
def test_vin_extraction():
    """Test VIN extraction with sample data"""
    extractor = VINExtractor()
    
    # This would be a base64 encoded image in real usage
    test_image_b64 = "test_image_data"
    
    print("Testing VIN extraction...")
    result = extractor.extract_vin_from_image(test_image_b64)
    print(f"Result: {result}")
    
    return result

if __name__ == "__main__":
    test_vin_extraction()
