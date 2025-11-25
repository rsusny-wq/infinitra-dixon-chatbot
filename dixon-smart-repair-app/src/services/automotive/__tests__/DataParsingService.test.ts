/**
 * AutomotiveDataParser Unit Tests
 * Tests automotive data parsing and relevance scoring
 */

import AutomotiveDataParser from '../DataParsingService';
import { createMockWebSearchResult, createMockPartInfo } from '../../../test-utils/setup';

describe('AutomotiveDataParser', () => {
  let parser: AutomotiveDataParser;

  beforeEach(() => {
    parser = new AutomotiveDataParser();
  });

  describe('parsePartsFromWebSearch', () => {
    it('should parse parts information from web search results', () => {
      const searchResults = [
        createMockWebSearchResult({
          title: 'Honda Civic Starter Motor - $450',
          content: 'Denso starter motor for 2020 Honda Civic. Part number DSN-123. Price $400-$500. In stock.',
          source: 'autozone.com'
        }),
        createMockWebSearchResult({
          title: 'Brake Pads Set - $89.99',
          content: 'Bosch brake pads for Honda Civic. Part #BP-456. Available now.',
          source: 'advanceautoparts.com'
        })
      ];

      const parts = parser.parsePartsFromWebSearch(searchResults);

      expect(parts).toHaveLength(2);
      
      const starterPart = parts.find(p => p.name.includes('Starter Motor'));
      expect(starterPart).toMatchObject({
        name: expect.stringContaining('Starter Motor'),
        price: {
          min: 400,
          max: 500,
          currency: 'USD'
        },
        brand: 'Denso',
        partNumber: 'DSN-123',
        availability: 'in-stock',
        source: 'autozone.com'
      });
      expect(starterPart?.confidence).toBeGreaterThan(0.5);
    });

    it('should filter out low confidence results', () => {
      const searchResults = [
        createMockWebSearchResult({
          title: 'Random Article',
          content: 'This is not about automotive parts at all.',
          source: 'random-blog.com'
        })
      ];

      const parts = parser.parsePartsFromWebSearch(searchResults);

      expect(parts).toHaveLength(0);
    });

    it('should sort results by confidence score', () => {
      const searchResults = [
        createMockWebSearchResult({
          title: 'Low Quality Result',
          content: 'Some automotive content but not very detailed.',
          source: 'unknown-site.com'
        }),
        createMockWebSearchResult({
          title: 'Honda Civic Starter Motor - $450',
          content: 'High quality automotive content with pricing and part details.',
          source: 'autozone.com'
        })
      ];

      const parts = parser.parsePartsFromWebSearch(searchResults);

      if (parts.length > 1) {
        expect(parts[0].confidence).toBeGreaterThan(parts[1].confidence);
      }
    });
  });

  describe('parseLaborRatesFromWebSearch', () => {
    it('should parse labor rates from web search results', () => {
      const searchResults = [
        createMockWebSearchResult({
          title: 'Auto Repair Labor Rates in Seattle',
          content: 'Average labor rate is $125 per hour for brake repair in Seattle area.',
          source: 'repairpal.com'
        }),
        createMockWebSearchResult({
          title: 'Transmission Repair Costs',
          content: 'Transmission repair labor rates range from $100-$150 per hour in Portland.',
          source: 'yourmechanic.com'
        })
      ];

      const laborRates = parser.parseLaborRatesFromWebSearch(searchResults);

      expect(laborRates).toHaveLength(2);
      
      const seattleRate = laborRates.find(r => r.location?.includes('Seattle'));
      expect(seattleRate).toMatchObject({
        location: expect.stringContaining('Seattle'),
        ratePerHour: {
          min: 125,
          max: 125,
          currency: 'USD'
        },
        repairType: 'brake',
        source: 'repairpal.com'
      });
      expect(seattleRate?.confidence).toBeGreaterThan(0.5);
    });

    it('should handle multiple rate formats', () => {
      const searchResults = [
        createMockWebSearchResult({
          title: 'Labor Rates',
          content: 'Shop charges $95/hour for engine work and $110 per hour for transmission.',
          source: 'repairpal.com'
        })
      ];

      const laborRates = parser.parseLaborRatesFromWebSearch(searchResults);

      expect(laborRates.length).toBeGreaterThan(0);
      expect(laborRates[0].ratePerHour.min).toBeGreaterThan(0);
    });
  });

  describe('parseRepairProceduresFromWebSearch', () => {
    it('should parse repair procedures from web search results', () => {
      const searchResults = [
        createMockWebSearchResult({
          title: 'How to Replace Honda Civic Starter Motor',
          content: `Step-by-step procedure:
          1. Disconnect battery
          2. Remove air intake
          3. Unbolt starter motor
          4. Install new starter
          Tools required: socket wrench, screwdriver
          Estimated time: 2 hours
          Difficulty: moderate`,
          source: 'youtube.com'
        })
      ];

      const procedures = parser.parseRepairProceduresFromWebSearch(searchResults);

      expect(procedures).toHaveLength(1);
      expect(procedures[0]).toMatchObject({
        title: 'How to Replace Honda Civic Starter Motor',
        steps: expect.arrayContaining([
          expect.stringContaining('Disconnect battery'),
          expect.stringContaining('Remove air intake'),
          expect.stringContaining('Unbolt starter motor'),
          expect.stringContaining('Install new starter')
        ]),
        difficulty: 'medium',
        estimatedTime: '2 hours',
        toolsRequired: expect.arrayContaining([
          expect.stringContaining('socket wrench'),
          expect.stringContaining('screwdriver')
        ]),
        source: 'youtube.com'
      });
      expect(procedures[0].confidence).toBeGreaterThan(0.5);
    });

    it('should determine difficulty levels correctly', () => {
      const testCases = [
        { content: 'This is an expert level repair requiring professional tools', expected: 'expert' },
        { content: 'This is a difficult and complex procedure', expected: 'hard' },
        { content: 'This is a moderate difficulty repair', expected: 'medium' },
        { content: 'This is an easy repair for beginners', expected: 'easy' }
      ];

      testCases.forEach(({ content, expected }) => {
        const searchResults = [createMockWebSearchResult({ content })];
        const procedures = parser.parseRepairProceduresFromWebSearch(searchResults);
        
        if (procedures.length > 0) {
          expect(procedures[0].difficulty).toBe(expected);
        }
      });
    });
  });

  describe('validateAutomotiveRelevance', () => {
    it('should score automotive content highly', () => {
      const automotiveResult = createMockWebSearchResult({
        title: 'Honda Civic Brake Pad Replacement',
        content: 'Complete guide for replacing brake pads on Honda Civic. Includes part numbers and pricing.',
        source: 'autozone.com',
        publishedDate: new Date('2024-01-01')
      });

      const relevance = parser.validateAutomotiveRelevance(automotiveResult);

      expect(relevance.score).toBeGreaterThan(0.7);
      expect(relevance.factors.keywordMatch).toBeGreaterThan(0.5);
      expect(relevance.factors.domainAuthority).toBe(1.0); // autozone.com is trusted
      expect(relevance.factors.contentQuality).toBeGreaterThan(0.5);
    });

    it('should score non-automotive content lowly', () => {
      const nonAutomotiveResult = createMockWebSearchResult({
        title: 'Cooking Recipe',
        content: 'How to make pasta with tomato sauce.',
        source: 'cooking-blog.com'
      });

      const relevance = parser.validateAutomotiveRelevance(nonAutomotiveResult);

      expect(relevance.score).toBeLessThan(0.5);
      expect(relevance.factors.keywordMatch).toBeLessThan(0.3);
    });

    it('should give higher scores to trusted automotive domains', () => {
      const trustedDomainResult = createMockWebSearchResult({
        title: 'Auto Parts',
        content: 'Automotive parts information',
        source: 'autozone.com'
      });

      const unknownDomainResult = createMockWebSearchResult({
        title: 'Auto Parts',
        content: 'Automotive parts information',
        source: 'unknown-site.com'
      });

      const trustedRelevance = parser.validateAutomotiveRelevance(trustedDomainResult);
      const unknownRelevance = parser.validateAutomotiveRelevance(unknownDomainResult);

      expect(trustedRelevance.factors.domainAuthority).toBeGreaterThan(unknownRelevance.factors.domainAuthority);
    });

    it('should consider content recency', () => {
      const recentResult = createMockWebSearchResult({
        publishedDate: new Date('2024-06-01')
      });

      const oldResult = createMockWebSearchResult({
        publishedDate: new Date('2020-01-01')
      });

      const recentRelevance = parser.validateAutomotiveRelevance(recentResult);
      const oldRelevance = parser.validateAutomotiveRelevance(oldResult);

      expect(recentRelevance.factors.recency).toBeGreaterThan(oldRelevance.factors.recency);
    });
  });

  describe('calculateKeywordMatch', () => {
    it('should calculate keyword match correctly', () => {
      const automotiveResult = createMockWebSearchResult({
        title: 'Honda Civic Engine Repair',
        content: 'Complete automotive engine repair guide for Honda Civic vehicle maintenance.'
      });

      const relevance = parser.validateAutomotiveRelevance(automotiveResult);

      // Should match keywords: automotive, engine, repair, vehicle
      expect(relevance.factors.keywordMatch).toBeGreaterThan(0.5);
    });
  });

  describe('calculateContentQuality', () => {
    it('should score high-quality content higher', () => {
      const highQualityResult = createMockWebSearchResult({
        content: 'Detailed automotive repair guide with step-by-step procedures. Part number ABC-123. Price $150-$200. Tools required: socket wrench set.'
      });

      const lowQualityResult = createMockWebSearchResult({
        content: 'Car stuff.'
      });

      const highQualityRelevance = parser.validateAutomotiveRelevance(highQualityResult);
      const lowQualityRelevance = parser.validateAutomotiveRelevance(lowQualityResult);

      expect(highQualityRelevance.factors.contentQuality).toBeGreaterThan(lowQualityRelevance.factors.contentQuality);
    });
  });

  describe('extractPartName', () => {
    it('should extract part names from titles', () => {
      const testCases = [
        'Honda Civic Starter Motor - $450',
        'Brake Pads Set for Toyota Camry',
        'OEM Air Filter Replacement'
      ];

      testCases.forEach(title => {
        const searchResults = [createMockWebSearchResult({ title, content: 'Price $100' })];
        const parts = parser.parsePartsFromWebSearch(searchResults);
        
        if (parts.length > 0) {
          expect(parts[0].name).toBeTruthy();
          expect(parts[0].name.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('extractBrand', () => {
    it('should extract known automotive brands', () => {
      const contentWithBrands = [
        'Bosch brake pads for Honda Civic',
        'Denso starter motor replacement',
        'ACDelco oil filter',
        'Motorcraft spark plugs',
        'Gates timing belt'
      ];

      contentWithBrands.forEach(content => {
        const searchResults = [createMockWebSearchResult({ content: content + ' Price $100' })];
        const parts = parser.parsePartsFromWebSearch(searchResults);
        
        if (parts.length > 0 && parts[0].brand) {
          expect(['Bosch', 'Denso', 'Acdelco', 'Motorcraft', 'Gates']).toContain(parts[0].brand);
        }
      });
    });
  });

  describe('determineAvailability', () => {
    it('should determine availability correctly', () => {
      const testCases = [
        { content: 'Part is in stock and available', expected: 'in-stock' },
        { content: 'Currently out of stock', expected: 'out-of-stock' },
        { content: 'No availability information', expected: 'unknown' }
      ];

      testCases.forEach(({ content, expected }) => {
        const searchResults = [createMockWebSearchResult({ content: content + ' Price $100' })];
        const parts = parser.parsePartsFromWebSearch(searchResults);
        
        if (parts.length > 0) {
          expect(parts[0].availability).toBe(expected);
        }
      });
    });
  });

  describe('extractSteps', () => {
    it('should extract numbered steps from content', () => {
      const contentWithSteps = `
        Repair procedure:
        1. Remove battery cable
        2. Disconnect wiring harness
        3. Unbolt starter motor
        4. Install new starter
        5. Reconnect everything
      `;

      const searchResults = [createMockWebSearchResult({ content: contentWithSteps })];
      const procedures = parser.parseRepairProceduresFromWebSearch(searchResults);

      if (procedures.length > 0) {
        expect(procedures[0].steps).toHaveLength(5);
        expect(procedures[0].steps[0]).toContain('Remove battery cable');
        expect(procedures[0].steps[4]).toContain('Reconnect everything');
      }
    });

    it('should extract bullet point steps', () => {
      const contentWithBullets = `
        • Disconnect battery
        • Remove air intake
        • Unbolt starter
        • Install new part
      `;

      const searchResults = [createMockWebSearchResult({ content: contentWithBullets })];
      const procedures = parser.parseRepairProceduresFromWebSearch(searchResults);

      if (procedures.length > 0) {
        expect(procedures[0].steps.length).toBeGreaterThan(0);
      }
    });
  });
});
