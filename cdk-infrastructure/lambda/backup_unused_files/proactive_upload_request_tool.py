"""
Proactive Upload Request Tool
Allows the agent to request specific types of image uploads from users
"""
import json
import logging
from typing import Dict, Any
from strands import tool

logger = logging.getLogger()
logger.setLevel(logging.INFO)

@tool
def request_vin_upload(agent, reason: str = "enhanced diagnostics") -> Dict[str, Any]:
    """
    Request VIN image upload from user for enhanced diagnostics
    
    Args:
        agent: Strands agent instance
        reason: Reason for requesting VIN (e.g., "enhanced diagnostics", "vehicle identification")
    
    Returns:
        Message requesting VIN upload with clear instructions
    """
    try:
        logger.info(f"🔍 Requesting VIN upload for: {reason}")
        
        return {
            "success": True,
            "request_type": "vin_upload",
            "reason": reason,
            "message": f"📸 **I need your VIN for {reason}**\n\n🔍 **Please upload an image of your VIN:**\n• 📱 **Dashboard VIN** - Usually visible through windshield\n• 🚪 **Door frame VIN** - On driver's side door frame\n• 📋 **Registration document** - VIN printed on paperwork\n\n⬆️ **Click the upload button** and select your VIN image. I'll automatically extract it and upgrade your diagnostic accuracy to 95%!\n\n💡 **Tip:** Make sure all 17 characters are clearly visible in good lighting."
        }
        
    except Exception as e:
        logger.error(f"❌ Error requesting VIN upload: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "❌ **Upload request failed**\n\nPlease try again or contact support."
        }

@tool
def request_damage_upload(agent, area: str = "affected area") -> Dict[str, Any]:
    """
    Request damage assessment image upload from user
    
    Args:
        agent: Strands agent instance
        area: Specific area to photograph (e.g., "front bumper", "engine bay")
    
    Returns:
        Message requesting damage image upload with instructions
    """
    try:
        logger.info(f"🔍 Requesting damage upload for: {area}")
        
        return {
            "success": True,
            "request_type": "damage_upload",
            "area": area,
            "message": f"📸 **I need photos of the {area} for damage assessment**\n\n📷 **Please upload clear images showing:**\n• 💥 **Damage extent** - All affected areas\n• 🔍 **Close-up details** - Scratches, dents, cracks\n• 📐 **Reference scale** - Include nearby objects for size\n• 💡 **Good lighting** - Natural light works best\n\n⬆️ **Click the upload button** and select your damage photos. I'll analyze them and provide repair cost estimates!\n\n🎯 **Multiple angles help** - Feel free to upload several photos."
        }
        
    except Exception as e:
        logger.error(f"❌ Error requesting damage upload: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "❌ **Upload request failed**\n\nPlease try again or contact support."
        }

@tool
def request_part_upload(agent, part_description: str = "unknown component") -> Dict[str, Any]:
    """
    Request part identification image upload from user
    
    Args:
        agent: Strands agent instance
        part_description: Description of the part to identify
    
    Returns:
        Message requesting part image upload with instructions
    """
    try:
        logger.info(f"🔍 Requesting part upload for: {part_description}")
        
        return {
            "success": True,
            "request_type": "part_upload", 
            "part_description": part_description,
            "message": f"📸 **I need a photo of the {part_description} for identification**\n\n🔧 **Please upload a clear image showing:**\n• 🏷️ **Part numbers** - Any visible labels or markings\n• 📏 **Size reference** - Include your hand or a coin for scale\n• 🔍 **Multiple angles** - Top, side, and connection points\n• 💡 **Good lighting** - Avoid shadows on important details\n\n⬆️ **Click the upload button** and select your part photo. I'll identify it and help you find replacement options!\n\n🎯 **Pro tip:** Clean the part first to make markings more visible."
        }
        
    except Exception as e:
        logger.error(f"❌ Error requesting part upload: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "❌ **Upload request failed**\n\nPlease try again or contact support."
        }
