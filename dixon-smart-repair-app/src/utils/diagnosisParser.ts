/**
 * Diagnosis Parser Utility - Dixon Smart Repair
 * GAP 4: Enhanced Diagnosis Display (US-005)
 * Parses backend diagnosis responses into structured data for enhanced display
 */

import { DiagnosisData, DiagnosisIssue } from '../components/chat/EnhancedDiagnosisDisplay';

export interface BackendDiagnosisResponse {
  vehicle_info?: {
    year?: number;
    make?: string;
    model?: string;
    vin?: string;
  };
  analysis?: {
    potential_causes?: Array<{
      cause: string;
      likelihood: 'high' | 'medium' | 'low';
      urgency: 'high' | 'medium' | 'low';
      vehicle_specific?: boolean;
      vin_verified?: boolean;
    }>;
    safety_concerns?: string[];
    professional_needed?: boolean;
  };
  diagnostic_accuracy?: string;
  recommendations?: any;
}

/**
 * Attempts to parse a backend message response to extract structured diagnosis data
 * @param messageText - The raw message text from the backend
 * @returns Parsed diagnosis data or null if not a diagnosis response
 */
export const parseDiagnosisResponse = (messageText: string): DiagnosisData | null => {
  try {
    // Try to find JSON-like structure in the message
    // Look for patterns that indicate this is a diagnosis response
    const diagnosisKeywords = [
      'potential_causes',
      'diagnostic_accuracy',
      'safety_concerns',
      'professional_needed',
      'analysis'
    ];

    // Check if this looks like a diagnosis response
    const isDiagnosisResponse = diagnosisKeywords.some(keyword => 
      messageText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!isDiagnosisResponse) {
      return null;
    }

    // Try to extract JSON from the message
    let parsedData: BackendDiagnosisResponse | null = null;

    // Look for JSON blocks in the message
    const jsonMatches = messageText.match(/\{[\s\S]*\}/g);
    if (jsonMatches) {
      for (const jsonMatch of jsonMatches) {
        try {
          const parsed = JSON.parse(jsonMatch);
          if (parsed.analysis || parsed.potential_causes || parsed.diagnostic_accuracy) {
            parsedData = parsed;
            break;
          }
        } catch (e) {
          // Continue trying other matches
        }
      }
    }

    // If no JSON found, try to parse from text patterns
    if (!parsedData) {
      parsedData = parseFromTextPatterns(messageText);
    }

    if (!parsedData) {
      return null;
    }

    // Convert to DiagnosisData format
    const diagnosisData: DiagnosisData = {
      potentialCauses: [],
      diagnosticAccuracy: parsedData.diagnostic_accuracy || '65%',
      safetyConcerns: parsedData.analysis?.safety_concerns || [],
      professionalNeeded: parsedData.analysis?.professional_needed || false,
      vehicleInfo: parsedData.vehicle_info
    };

    // Process potential causes
    if (parsedData.analysis?.potential_causes) {
      diagnosisData.potentialCauses = parsedData.analysis.potential_causes.map((cause, index) => ({
        cause: cause.cause,
        likelihood: cause.likelihood,
        urgency: cause.urgency,
        confidence: 0, // Will be calculated in the component
        rank: index + 1,
        vehicleSpecific: cause.vehicle_specific,
        vinVerified: cause.vin_verified
      }));
    }

    return diagnosisData;

  } catch (error) {
    console.warn('Error parsing diagnosis response:', error);
    return null;
  }
};

/**
 * Attempts to parse diagnosis data from text patterns when JSON parsing fails
 * @param messageText - The message text to parse
 * @returns Parsed data or null
 */
const parseFromTextPatterns = (messageText: string): BackendDiagnosisResponse | null => {
  try {
    const result: BackendDiagnosisResponse = {
      analysis: {
        potential_causes: [],
        safety_concerns: [],
        professional_needed: false
      }
    };

    // Extract diagnostic accuracy from common patterns
    const accuracyMatch = messageText.match(/diagnostic[_\s]accuracy[:\s]*(\d+%)/i);
    if (accuracyMatch) {
      result.diagnostic_accuracy = accuracyMatch[1];
    } else {
      // Default to 65% if not specified
      result.diagnostic_accuracy = '65%';
    }

    // Enhanced cause extraction for automotive issues
    const automotiveCauses = [
      // Brake issues
      { pattern: /brake\s*pad/gi, cause: 'Worn brake pads', likelihood: 'high', urgency: 'medium' },
      { pattern: /brake\s*rotor/gi, cause: 'Warped brake rotors', likelihood: 'medium', urgency: 'medium' },
      { pattern: /brake\s*fluid/gi, cause: 'Low brake fluid', likelihood: 'medium', urgency: 'high' },
      { pattern: /squealing.*brake|brake.*squeal/gi, cause: 'Worn brake pads', likelihood: 'high', urgency: 'medium' },
      
      // Engine issues - Enhanced patterns for current responses
      { pattern: /air\s*filter/gi, cause: 'Dirty air filter', likelihood: 'high', urgency: 'low' },
      { pattern: /spark\s*plug/gi, cause: 'Faulty spark plugs', likelihood: 'high', urgency: 'medium' },
      { pattern: /fuel\s*system/gi, cause: 'Fuel system problems', likelihood: 'medium', urgency: 'medium' },
      { pattern: /engine.*knock|knock.*engine/gi, cause: 'Engine knock (carbon buildup or timing)', likelihood: 'high', urgency: 'high' },
      { pattern: /rough\s*idle/gi, cause: 'Rough idle (spark plugs or air filter)', likelihood: 'medium', urgency: 'medium' },
      { pattern: /engine.*noise|noise.*engine/gi, cause: 'Engine noise (air filter or spark plugs)', likelihood: 'high', urgency: 'medium' },
      { pattern: /making.*noise/gi, cause: 'Mechanical noise (requires inspection)', likelihood: 'medium', urgency: 'medium' },
      { pattern: /lot.*noise|lots.*noise/gi, cause: 'Excessive engine noise (air filter or spark plugs)', likelihood: 'high', urgency: 'medium' },
      
      // Starting issues
      { pattern: /battery/gi, cause: 'Dead or weak battery', likelihood: 'high', urgency: 'medium' },
      { pattern: /starter/gi, cause: 'Faulty starter motor', likelihood: 'medium', urgency: 'medium' },
      { pattern: /alternator/gi, cause: 'Alternator problems', likelihood: 'medium', urgency: 'medium' },
      { pattern: /won't\s*start|wont\s*start/gi, cause: 'Starting system failure', likelihood: 'high', urgency: 'high' },
      
      // Transmission
      { pattern: /transmission.*slip|slip.*transmission/gi, cause: 'Transmission slipping', likelihood: 'high', urgency: 'high' },
      { pattern: /clutch/gi, cause: 'Clutch problems', likelihood: 'medium', urgency: 'medium' },
      
      // Generic diagnostic patterns from current responses
      { pattern: /could\s*be\s*due\s*to/gi, cause: 'Multiple possible causes (professional diagnosis needed)', likelihood: 'medium', urgency: 'medium' },
      { pattern: /probable\s*issue/gi, cause: 'Identified probable issue (professional confirmation needed)', likelihood: 'medium', urgency: 'medium' }
    ];

    // Check for automotive causes in the message
    for (const autoCause of automotiveCauses) {
      if (autoCause.pattern.test(messageText)) {
        result.analysis!.potential_causes!.push({
          cause: autoCause.cause,
          likelihood: autoCause.likelihood as 'high' | 'medium' | 'low',
          urgency: autoCause.urgency as 'high' | 'medium' | 'low'
        });
      }
    }

    // Extract safety concerns from common patterns
    const safetyPatterns = [
      /safety[_\s]concern/gi,
      /professional.*inspect/gi,
      /bring.*professional/gi,
      /safety.*affect/gi,
      /dangerous/gi,
      /unsafe/gi
    ];

    for (const pattern of safetyPatterns) {
      if (pattern.test(messageText)) {
        result.analysis!.safety_concerns!.push('Professional inspection recommended for safety');
        break;
      }
    }

    // Determine if professional service is needed
    const professionalKeywords = [
      'professional',
      'mechanic',
      'service',
      'inspection',
      'repair shop',
      'dixon smart repair',
      'call us',
      'schedule',
      'bring your car'
    ];

    result.analysis!.professional_needed = professionalKeywords.some(keyword =>
      messageText.toLowerCase().includes(keyword.toLowerCase())
    );

    // Only return if we found some useful data
    if (result.analysis!.potential_causes!.length > 0 || 
        result.analysis!.safety_concerns!.length > 0 ||
        result.analysis!.professional_needed) {
      return result;
    }

    return null;

  } catch (error) {
    console.warn('Error parsing text patterns:', error);
    return null;
  }
};

/**
 * Checks if a message appears to be a diagnosis response
 * @param messageText - The message text to check
 * @returns True if this looks like a diagnosis response
 */
export const isDiagnosisMessage = (messageText: string): boolean => {
  const diagnosisIndicators = [
    // Direct diagnosis terms
    'potential causes',
    'likely issues',
    'diagnostic accuracy',
    'safety concern',
    'professional needed',
    
    // Automotive parts and systems
    'brake pad',
    'brake rotor',
    'brake fluid',
    'air filter',
    'spark plug',
    'engine problem',
    'transmission',
    'battery',
    'alternator',
    'starter',
    'fuel system',
    'clutch',
    
    // Automotive symptoms and diagnostic language
    'squealing',
    'grinding',
    'knocking',
    'rough idle',
    'won\'t start',
    'slipping',
    'overheating',
    'engine noise',
    'making noise',
    'could be due to',
    'might be',
    'sounds like',
    'inspection',
    'troubleshooting',
    'repair',
    'diagnosis',
    'probable issue',
    'probable cause',
    
    // Professional service indicators
    'dixon smart repair',
    'professional inspection',
    'bring your car',
    'schedule',
    'call us',
    'visit dixon',
    '555) 123-DIXON'
  ];

  const lowerText = messageText.toLowerCase();
  
  // Check for multiple indicators to increase confidence
  const matchCount = diagnosisIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  // Strong indicators that definitely indicate a diagnosis message
  const strongIndicators = [
    'brake pad',
    'spark plug',
    'air filter',
    'squealing',
    'knocking',
    'professional inspection',
    'dixon smart repair',
    'could be due to',
    'engine noise',
    'probable issue',
    'probable cause',
    'call us at (555) 123-dixon'
  ];
  
  const hasStrongIndicator = strongIndicators.some(indicator => 
    lowerText.includes(indicator)
  );
  
  // Also check for automotive context + professional recommendation pattern
  const hasAutomotiveContext = [
    'engine', 'brake', 'transmission', 'battery', 'alternator', 'starter',
    'clutch', 'fuel', 'oil', 'coolant', 'tire', 'wheel', 'suspension'
  ].some(term => lowerText.includes(term));
  
  const hasProfessionalRecommendation = [
    'dixon smart repair', 'call us', 'schedule', 'visit', 'professional'
  ].some(term => lowerText.includes(term));
  
  // Debug logging
  console.log('🔍 Diagnosis Detection Debug:', {
    messageText: messageText.substring(0, 100) + '...',
    matchCount,
    hasStrongIndicator,
    hasAutomotiveContext,
    hasProfessionalRecommendation,
    shouldTrigger: matchCount >= 2 || hasStrongIndicator || (hasAutomotiveContext && hasProfessionalRecommendation)
  });
  
  return matchCount >= 2 || hasStrongIndicator || (hasAutomotiveContext && hasProfessionalRecommendation);
};

/**
 * Creates mock diagnosis data for testing purposes
 * @param diagnosticAccuracy - The diagnostic accuracy level
 * @returns Mock diagnosis data
 */
export const createMockDiagnosisData = (diagnosticAccuracy: string = '65%'): DiagnosisData => {
  return {
    potentialCauses: [
      {
        cause: 'Worn brake pads',
        likelihood: 'high',
        urgency: 'medium',
        confidence: 0,
        rank: 1,
        vehicleSpecific: true,
        vinVerified: diagnosticAccuracy === '95%'
      },
      {
        cause: 'Warped brake rotors',
        likelihood: 'medium',
        urgency: 'medium',
        confidence: 0,
        rank: 2,
        vehicleSpecific: true
      },
      {
        cause: 'Low brake fluid',
        likelihood: 'medium',
        urgency: 'high',
        confidence: 0,
        rank: 3
      }
    ],
    diagnosticAccuracy,
    safetyConcerns: ['Brake issues can affect vehicle safety - professional inspection recommended'],
    professionalNeeded: true,
    vehicleInfo: {
      year: 2019,
      make: 'Honda',
      model: 'Civic'
    }
  };
};
