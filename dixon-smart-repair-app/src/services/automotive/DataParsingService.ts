/**
 * AutomotiveDataParser - Parse web search results into structured automotive data
 * Extracts parts information, labor rates, and repair procedures from web search results
 */

import { WebSearchResult } from './WebSearchService';

export interface PartInfo {
  name: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  brand?: string;
  partNumber?: string;
  availability: 'in-stock' | 'out-of-stock' | 'unknown';
  source: string;
  confidence: number;
}

export interface LaborRateInfo {
  location: string;
  ratePerHour: {
    min: number;
    max: number;
    currency: string;
  };
  repairType: string;
  source: string;
  confidence: number;
}

export interface RepairProcedure {
  title: string;
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  estimatedTime: string;
  toolsRequired: string[];
  source: string;
  confidence: number;
}

export interface RelevanceScore {
  score: number;
  factors: {
    keywordMatch: number;
    domainAuthority: number;
    contentQuality: number;
    recency: number;
  };
}

export class AutomotiveDataParser {
  private automotiveKeywords = [
    'automotive', 'car', 'vehicle', 'auto', 'motor', 'engine', 'brake', 'transmission',
    'suspension', 'exhaust', 'battery', 'alternator', 'starter', 'radiator', 'oil',
    'filter', 'spark plug', 'tire', 'wheel', 'repair', 'maintenance', 'service'
  ];

  private trustedDomains = [
    'autozone.com', 'advanceautoparts.com', 'rockauto.com', 'partsgeek.com',
    'repairpal.com', 'yourmechanic.com', 'identifix.com', 'mechanicbase.com'
  ];

  /**
   * Parse parts information from web search results
   */
  parsePartsFromWebSearch(searchResults: WebSearchResult[]): PartInfo[] {
    const parts: PartInfo[] = [];

    for (const result of searchResults) {
      const partInfo = this.extractPartInfo(result);
      if (partInfo && partInfo.confidence > 0.5) {
        parts.push(partInfo);
      }
    }

    return parts.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Parse labor rates from web search results
   */
  parseLaborRatesFromWebSearch(searchResults: WebSearchResult[]): LaborRateInfo[] {
    const laborRates: LaborRateInfo[] = [];

    for (const result of searchResults) {
      const laborInfo = this.extractLaborRateInfo(result);
      if (laborInfo && laborInfo.confidence > 0.5) {
        laborRates.push(laborInfo);
      }
    }

    return laborRates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Parse repair procedures from web search results
   */
  parseRepairProceduresFromWebSearch(searchResults: WebSearchResult[]): RepairProcedure[] {
    const procedures: RepairProcedure[] = [];

    for (const result of searchResults) {
      const procedure = this.extractRepairProcedure(result);
      if (procedure && procedure.confidence > 0.5) {
        procedures.push(procedure);
      }
    }

    return procedures.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate automotive relevance of search result
   */
  validateAutomotiveRelevance(searchResult: WebSearchResult): RelevanceScore {
    const keywordMatch = this.calculateKeywordMatch(searchResult);
    const domainAuthority = this.calculateDomainAuthority(searchResult.source);
    const contentQuality = this.calculateContentQuality(searchResult);
    const recency = this.calculateRecency(searchResult.publishedDate);

    const score = (keywordMatch * 0.4) + (domainAuthority * 0.3) + (contentQuality * 0.2) + (recency * 0.1);

    return {
      score: Math.min(score, 1.0),
      factors: {
        keywordMatch,
        domainAuthority,
        contentQuality,
        recency
      }
    };
  }

  /**
   * Extract part information from search result
   */
  private extractPartInfo(result: WebSearchResult): PartInfo | null {
    try {
      const content = `${result.title} ${result.content}`.toLowerCase();
      
      // Extract price information
      const priceMatch = content.match(/\$(\d+(?:\.\d{2})?)/g);
      if (!priceMatch) return null;

      const prices = priceMatch.map(p => parseFloat(p.replace('$', '')));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Extract part name
      const partName = this.extractPartName(result.title);
      if (!partName) return null;

      // Extract brand if available
      const brand = this.extractBrand(content);

      // Extract part number if available
      const partNumber = this.extractPartNumber(content);

      // Determine availability
      const availability = this.determineAvailability(content);

      const relevance = this.validateAutomotiveRelevance(result);

      return {
        name: partName,
        price: {
          min: minPrice,
          max: maxPrice,
          currency: 'USD'
        },
        brand,
        partNumber,
        availability,
        source: result.source,
        confidence: relevance.score
      };
    } catch (error) {
      console.error('Error extracting part info:', error);
      return null;
    }
  }

  /**
   * Extract labor rate information from search result
   */
  private extractLaborRateInfo(result: WebSearchResult): LaborRateInfo | null {
    try {
      const content = `${result.title} ${result.content}`.toLowerCase();
      
      // Extract hourly rate
      const rateMatch = content.match(/\$(\d+(?:\.\d{2})?)\s*(?:per\s*hour|\/hour|hr)/gi);
      if (!rateMatch) return null;

      const rates = rateMatch.map(r => {
        const match = r.match(/\$(\d+(?:\.\d{2})?)/);
        return match ? parseFloat(match[1]) : 0;
      }).filter(r => r > 0);

      if (rates.length === 0) return null;

      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);

      // Extract location
      const location = this.extractLocation(content);

      // Extract repair type
      const repairType = this.extractRepairType(content);

      const relevance = this.validateAutomotiveRelevance(result);

      return {
        location: location || 'Unknown',
        ratePerHour: {
          min: minRate,
          max: maxRate,
          currency: 'USD'
        },
        repairType: repairType || 'General',
        source: result.source,
        confidence: relevance.score
      };
    } catch (error) {
      console.error('Error extracting labor rate info:', error);
      return null;
    }
  }

  /**
   * Extract repair procedure from search result
   */
  private extractRepairProcedure(result: WebSearchResult): RepairProcedure | null {
    try {
      const content = result.content;
      
      // Extract steps (look for numbered lists or bullet points)
      const steps = this.extractSteps(content);
      if (steps.length === 0) return null;

      // Determine difficulty
      const difficulty = this.determineDifficulty(content);

      // Extract estimated time
      const estimatedTime = this.extractEstimatedTime(content);

      // Extract tools required
      const toolsRequired = this.extractToolsRequired(content);

      const relevance = this.validateAutomotiveRelevance(result);

      return {
        title: result.title,
        steps,
        difficulty,
        estimatedTime: estimatedTime || 'Unknown',
        toolsRequired,
        source: result.source,
        confidence: relevance.score
      };
    } catch (error) {
      console.error('Error extracting repair procedure:', error);
      return null;
    }
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordMatch(result: WebSearchResult): number {
    const content = `${result.title} ${result.content}`.toLowerCase();
    const matchedKeywords = this.automotiveKeywords.filter(keyword => 
      content.includes(keyword)
    );
    return Math.min(matchedKeywords.length / 5, 1.0); // Normalize to max 1.0
  }

  /**
   * Calculate domain authority score
   */
  private calculateDomainAuthority(domain: string): number {
    if (this.trustedDomains.includes(domain)) {
      return 1.0;
    }
    
    // Give partial credit to automotive-related domains
    if (domain.includes('auto') || domain.includes('car') || domain.includes('repair')) {
      return 0.7;
    }
    
    return 0.3;
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQuality(result: WebSearchResult): number {
    const content = result.content;
    
    // Check for structured information
    let score = 0.3; // Base score
    
    if (content.includes('$')) score += 0.2; // Has pricing info
    if (content.match(/\d+/)) score += 0.2; // Has numbers/specs
    if (content.length > 100) score += 0.2; // Substantial content
    if (content.includes('step') || content.includes('procedure')) score += 0.1; // Has instructions
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate recency score
   */
  private calculateRecency(publishedDate?: Date): number {
    if (!publishedDate) return 0.5; // Default for unknown dates
    
    const now = new Date();
    const daysDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 30) return 1.0;
    if (daysDiff <= 90) return 0.8;
    if (daysDiff <= 365) return 0.6;
    return 0.3;
  }

  // Helper methods for extraction
  private extractPartName(title: string): string | null {
    // Simple extraction - could be enhanced with ML
    const cleanTitle = title.replace(/\$[\d,]+(\.\d{2})?/g, '').trim();
    return cleanTitle.length > 0 ? cleanTitle : null;
  }

  private extractBrand(content: string): string | undefined {
    const brands = ['bosch', 'denso', 'acdelco', 'motorcraft', 'gates', 'dayco'];
    const foundBrand = brands.find(brand => content.includes(brand));
    return foundBrand ? foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1) : undefined;
  }

  private extractPartNumber(content: string): string | undefined {
    const partNumberMatch = content.match(/(?:part\s*#|part\s*number|p\/n)\s*:?\s*([a-z0-9\-]+)/i);
    return partNumberMatch ? partNumberMatch[1] : undefined;
  }

  private determineAvailability(content: string): 'in-stock' | 'out-of-stock' | 'unknown' {
    if (content.includes('in stock') || content.includes('available')) return 'in-stock';
    if (content.includes('out of stock') || content.includes('unavailable')) return 'out-of-stock';
    return 'unknown';
  }

  private extractLocation(content: string): string | undefined {
    // Simple location extraction - could be enhanced
    const locationMatch = content.match(/(?:in|near|around)\s+([a-z\s]+(?:,\s*[a-z]{2})?)/i);
    return locationMatch ? locationMatch[1].trim() : undefined;
  }

  private extractRepairType(content: string): string | undefined {
    const repairTypes = ['brake', 'engine', 'transmission', 'suspension', 'electrical', 'exhaust'];
    return repairTypes.find(type => content.includes(type));
  }

  private extractSteps(content: string): string[] {
    // Extract numbered steps or bullet points
    const stepMatches = content.match(/(?:\d+\.|•|\*)\s*([^\n\r]+)/g);
    return stepMatches ? stepMatches.map(step => step.replace(/^\d+\.|•|\*/, '').trim()) : [];
  }

  private determineDifficulty(content: string): 'easy' | 'medium' | 'hard' | 'expert' {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('expert') || lowerContent.includes('professional')) return 'expert';
    if (lowerContent.includes('difficult') || lowerContent.includes('complex')) return 'hard';
    if (lowerContent.includes('moderate') || lowerContent.includes('intermediate')) return 'medium';
    return 'easy';
  }

  private extractEstimatedTime(content: string): string | undefined {
    const timeMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|minutes?|mins?)/i);
    return timeMatch ? timeMatch[0] : undefined;
  }

  private extractToolsRequired(content: string): string[] {
    const toolsSection = content.match(/tools?\s*(?:required|needed):?\s*([^\n\r.]+)/i);
    if (toolsSection) {
      return toolsSection[1].split(/[,;]/).map(tool => tool.trim()).filter(tool => tool.length > 0);
    }
    return [];
  }
}

export default AutomotiveDataParser;
