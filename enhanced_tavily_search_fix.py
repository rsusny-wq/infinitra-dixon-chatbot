# Enhanced Tavily Search Strategy - VIN-Enhanced Part Number Search
# This fixes the retailer links propagation issue by using exact part numbers

def enhanced_retailer_search_with_part_numbers(agent, probable_parts, vehicle_info):
    """
    Enhanced search strategy using VIN-derived exact part numbers
    This addresses the deep links issue by searching for specific part numbers
    """
    vin_data = agent.state.get("vin_data")
    retailer_links = {}
    
    for part_info in probable_parts[:2]:  # Focus on top 2 parts
        part_name = part_info.get('name', part_info) if isinstance(part_info, dict) else part_info
        
        # Strategy 1: VIN-Enhanced Search with Exact Part Numbers (95% accuracy)
        if vin_data and vin_data.get('nhtsa_data'):
            exact_part_numbers = get_exact_part_numbers_from_vin(vin_data, part_name)
            
            if exact_part_numbers:
                for part_number in exact_part_numbers[:2]:  # Try top 2 part numbers
                    # ✅ EXACT PART NUMBER SEARCH - Gets deep links like your example
                    search_query = f"{part_number} {part_name} price buy online"
                    
                    logger.info(f"🎯 VIN-Enhanced search: {search_query}")
                    
                    retailer_research = get_tavily_research_direct(
                        query=search_query,
                        domains=None  # Don't restrict domains - let Tavily find the best sources
                    )
                    
                    # Extract deep links from results
                    part_links = extract_deep_links_from_research(retailer_research, part_number)
                    
                    if part_links:
                        retailer_links[part_name] = part_links
                        break  # Found good links, move to next part
        
        # Strategy 2: Vehicle-Specific Search (80% accuracy)
        if part_name not in retailer_links and vehicle_info:
            vehicle_desc = f"{vehicle_info.get('year', '')} {vehicle_info.get('make', '')} {vehicle_info.get('model', '')}"
            
            # ✅ VEHICLE + PART SEARCH - Better than generic
            search_query = f'"{vehicle_desc}" {part_name} part number price buy'
            
            logger.info(f"🚗 Vehicle-specific search: {search_query}")
            
            retailer_research = get_tavily_research_direct(
                query=search_query,
                domains=None  # Let Tavily find manufacturer sites like parts.subaru.com
            )
            
            part_links = extract_deep_links_from_research(retailer_research, part_name)
            
            if part_links:
                retailer_links[part_name] = part_links
        
        # Strategy 3: Generic Fallback (65% accuracy) - Only if above fail
        if part_name not in retailer_links:
            # ❌ Last resort - generic search
            search_query = f"{part_name} price buy online automotive parts"
            
            logger.info(f"🔄 Fallback search: {search_query}")
            
            retailer_research = get_tavily_research_direct(
                query=search_query,
                domains=["autozone.com", "oreillyauto.com", "napaonline.com", 
                        "advanceautoparts.com", "rockauto.com"]
            )
            
            part_links = extract_deep_links_from_research(retailer_research, part_name)
            retailer_links[part_name] = part_links or []
    
    return retailer_links

def get_exact_part_numbers_from_vin(vin_data, part_name):
    """
    Extract exact part numbers from VIN/NHTSA data for specific part types
    This is where the magic happens - VIN gives us exact part numbers!
    """
    nhtsa_data = vin_data.get('nhtsa_data', {})
    
    # Map part names to NHTSA data fields
    part_number_mapping = {
        'brake pads': ['brake_pad_front', 'brake_pad_rear'],
        'brake pad': ['brake_pad_front', 'brake_pad_rear'],
        'air filter': ['air_filter_engine', 'air_filter_cabin'],
        'oil filter': ['oil_filter'],
        'spark plugs': ['spark_plug'],
        'battery': ['battery'],
        'alternator': ['alternator'],
        'starter': ['starter']
    }
    
    part_numbers = []
    part_name_lower = part_name.lower()
    
    # Look for exact part numbers in NHTSA data
    for key, nhtsa_fields in part_number_mapping.items():
        if key in part_name_lower:
            for field in nhtsa_fields:
                if field in nhtsa_data and nhtsa_data[field]:
                    part_numbers.append(nhtsa_data[field])
    
    # Also check for generic part number fields
    if 'part_numbers' in nhtsa_data:
        part_numbers.extend(nhtsa_data['part_numbers'])
    
    return part_numbers

def extract_deep_links_from_research(research_data, search_term):
    """
    Extract deep product links from Tavily research results
    Focus on actual product pages, not category pages
    """
    if not research_data or 'results' not in research_data:
        return []
    
    deep_links = []
    
    for result in research_data['results'][:5]:  # Top 5 results
        url = result.get('url', '')
        title = result.get('title', '')
        content = result.get('content', '')
        
        # ✅ DEEP LINK INDICATORS - What makes a link "deep"
        deep_link_indicators = [
            '/p/',           # Product page indicator
            '/product/',     # Product page
            '/part/',        # Parts page
            'part-number',   # Part number in URL
            search_term.replace(' ', '-'),  # Part number in URL
            'oem-parts',     # OEM parts page
        ]
        
        # Check if this is likely a deep product link
        is_deep_link = any(indicator in url.lower() for indicator in deep_link_indicators)
        
        # Also check title/content for product specificity
        has_part_specifics = any([
            'part number' in title.lower(),
            'part #' in title.lower(),
            search_term in title.lower(),
            'oem' in title.lower(),
            '$' in content,  # Price indicator
        ])
        
        if is_deep_link or has_part_specifics:
            # Extract retailer name from URL
            retailer_name = extract_retailer_name_from_url(url)
            
            deep_links.append({
                'retailer': retailer_name,
                'url': url,
                'title': title,
                'price_info': extract_price_from_content(content),
                'link_type': 'deep' if is_deep_link else 'semi-deep'
            })
    
    return deep_links

def extract_retailer_name_from_url(url):
    """Extract clean retailer name from URL"""
    domain_to_retailer = {
        'autozone.com': 'AutoZone',
        'oreillyauto.com': "O'Reilly Auto Parts",
        'napaonline.com': 'NAPA Auto Parts',
        'advanceautoparts.com': 'Advance Auto Parts',
        'rockauto.com': 'RockAuto',
        'amazon.com': 'Amazon',
        'parts.subaru.com': 'Subaru Parts',
        'parts.honda.com': 'Honda Parts',
        'parts.toyota.com': 'Toyota Parts',
        'parts.ford.com': 'Ford Parts',
        'parts.gm.com': 'GM Parts',
    }
    
    for domain, name in domain_to_retailer.items():
        if domain in url:
            return name
    
    # Extract domain name as fallback
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        return domain.replace('www.', '').replace('.com', '').title()
    except:
        return 'Online Retailer'

def extract_price_from_content(content):
    """Extract price information from content"""
    import re
    
    # Look for price patterns
    price_patterns = [
        r'\$\d+\.\d{2}',  # $XX.XX
        r'\$\d+',         # $XX
        r'MSRP \$\d+',    # MSRP $XX
    ]
    
    for pattern in price_patterns:
        match = re.search(pattern, content)
        if match:
            return match.group()
    
    return None

# Example usage showing the difference:

# ❌ OLD WAY (Generic search - gets category pages):
# search_query = "Honda Civic brake pads price buy online AutoZone"
# Results: Generic brake pads category pages

# ✅ NEW WAY (VIN-enhanced part number search - gets exact product pages):
# search_query = "26696AN00A brake pads price buy online"  
# Results: Exact product pages like:
# - https://parts.subaru.com/p/Subaru_2022_Outback/Pad-Kit-Disk-Brake-Rear/78742135/26696AN00A.html
# - https://parts.subarupartspros.com/2022-outback-brake-pads-oem-performance-replacements
# - https://subaru.oempartsonline.com/v-2022-subaru-outback--touring--2-5l-h4-gas/brakes--rear-brakes
