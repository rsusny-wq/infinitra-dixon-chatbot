/**
 * WebSearchService Unit Tests
 * Tests Tavily web search integration for automotive information
 */

import axios from 'axios';
import WebSearchService from '../WebSearchService';
import { createMockWebSearchResult, createMockVehicle } from '../../../test-utils/setup';

// Mock axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebSearchService', () => {
  let webSearchService: WebSearchService;

  beforeEach(() => {
    webSearchService = new WebSearchService();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(webSearchService).toBeInstanceOf(WebSearchService);
    });

    it('should warn when API key is missing', () => {
      const originalEnv = process.env.TAVILY_WEB_SEARCH_API_KEY;
      delete process.env.TAVILY_WEB_SEARCH_API_KEY;
      
      const consoleSpy = jest.spyOn(console, 'warn');
      new WebSearchService();
      
      expect(consoleSpy).toHaveBeenCalledWith('Tavily API key not found in environment variables');
      
      process.env.TAVILY_WEB_SEARCH_API_KEY = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('searchAutomotiveParts', () => {
    const mockVehicle = createMockVehicle();
    const mockResponse = {
      data: {
        results: [
          {
            title: 'Honda Civic Starter Motor - $450',
            content: 'Starter motor for 2020 Honda Civic. Price range $400-$500.',
            url: 'https://autozone.com/starter-motor-honda-civic',
            score: 0.95
          },
          {
            title: 'Civic Starter Replacement Parts',
            content: 'OEM and aftermarket starter motors for Honda Civic 2020.',
            url: 'https://advanceautoparts.com/honda-civic-starter',
            score: 0.88
          }
        ]
      }
    };

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue(mockResponse);
    });

    it('should search for automotive parts successfully', async () => {
      const results = await webSearchService.searchAutomotiveParts('starter motor', mockVehicle);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.tavily.com/search',
        {
          api_key: 'test-api-key',
          query: '2020 Honda Civic starter motor parts price',
          max_results: 5,
          include_domains: ['autozone.com', 'advanceautoparts.com', 'rockauto.com', 'partsgeek.com']
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        title: 'Honda Civic Starter Motor - $450',
        content: 'Starter motor for 2020 Honda Civic. Price range $400-$500.',
        url: 'https://autozone.com/starter-motor-honda-civic',
        relevanceScore: 0.95,
        source: 'autozone.com'
      });
    });

    it('should search without vehicle info when not provided', async () => {
      await webSearchService.searchAutomotiveParts('brake pads');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          query: 'brake pads automotive parts price'
        }),
        expect.any(Object)
      );
    });

    it('should handle API timeout errors', async () => {
      const timeoutError = { code: 'ECONNABORTED' };
      mockedAxios.post.mockRejectedValue(timeoutError);

      await expect(webSearchService.searchAutomotiveParts('starter motor'))
        .rejects
        .toMatchObject({
          code: 'TIMEOUT',
          message: 'Search request timed out',
          provider: 'tavily',
          fallbackStrategy: 'cached_data'
        });
    });

    it('should handle rate limiting errors', async () => {
      const rateLimitError = { response: { status: 429 } };
      mockedAxios.post.mockRejectedValue(rateLimitError);

      await expect(webSearchService.searchAutomotiveParts('starter motor'))
        .rejects
        .toMatchObject({
          code: 'RATE_LIMITED',
          message: 'API rate limit exceeded',
          provider: 'tavily',
          fallbackStrategy: 'cached_data'
        });
    });

    it('should handle server errors', async () => {
      const serverError = { response: { status: 500 } };
      mockedAxios.post.mockRejectedValue(serverError);

      await expect(webSearchService.searchAutomotiveParts('starter motor'))
        .rejects
        .toMatchObject({
          code: 'CONNECTION_FAILED',
          message: 'Search service unavailable',
          provider: 'tavily',
          fallbackStrategy: 'llm_knowledge'
        });
    });
  });

  describe('searchLaborRates', () => {
    const mockResponse = {
      data: {
        results: [
          {
            title: 'Auto Repair Labor Rates in Seattle',
            content: 'Average labor rate is $125 per hour for brake repair in Seattle area.',
            url: 'https://repairpal.com/seattle-labor-rates',
            score: 0.92
          }
        ]
      }
    };

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue(mockResponse);
    });

    it('should search for labor rates successfully', async () => {
      const results = await webSearchService.searchLaborRates('Seattle', 'brake repair');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.tavily.com/search',
        {
          api_key: 'test-api-key',
          query: 'automotive repair labor rates brake repair Seattle per hour 2024',
          max_results: 3,
          include_domains: ['repairpal.com', 'yourmechanic.com', 'identifix.com']
        },
        expect.any(Object)
      );

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Auto Repair Labor Rates in Seattle');
    });
  });

  describe('searchRepairProcedures', () => {
    const mockVehicle = createMockVehicle();
    const mockResponse = {
      data: {
        results: [
          {
            title: 'How to Replace Honda Civic Starter Motor',
            content: 'Step-by-step guide for replacing starter motor on 2020 Honda Civic.',
            url: 'https://youtube.com/honda-civic-starter-replacement',
            score: 0.89
          }
        ]
      }
    };

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue(mockResponse);
    });

    it('should search for repair procedures successfully', async () => {
      const results = await webSearchService.searchRepairProcedures(mockVehicle, 'starter motor replacement');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.tavily.com/search',
        {
          api_key: 'test-api-key',
          query: '2020 Honda Civic starter motor replacement repair procedure steps',
          max_results: 4,
          include_domains: ['youtube.com', 'reddit.com', 'mechanicbase.com', 'repairsmith.com']
        },
        expect.any(Object)
      );

      expect(results).toHaveLength(1);
      expect(results[0].source).toBe('youtube.com');
    });
  });

  describe('searchVINInformation', () => {
    const mockResponse = {
      data: {
        results: [
          {
            title: 'VIN Decoder - 1HGBH41JXMN109186',
            content: 'Vehicle information for VIN 1HGBH41JXMN109186: 2020 Honda Civic',
            url: 'https://vindecoderz.com/decode/1HGBH41JXMN109186',
            score: 0.96
          }
        ]
      }
    };

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue(mockResponse);
    });

    it('should search for VIN information successfully', async () => {
      const vin = '1HGBH41JXMN109186';
      const results = await webSearchService.searchVINInformation(vin);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.tavily.com/search',
        {
          api_key: 'test-api-key',
          query: `VIN ${vin} vehicle information decode`,
          max_results: 3,
          include_domains: ['vindecoderz.com', 'vehiclehistory.com', 'carfax.com']
        },
        expect.any(Object)
      );

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain(vin);
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });

      const result = await webSearchService.testConnection();

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.tavily.com/search',
        {
          api_key: 'test-api-key',
          query: 'test connection',
          max_results: 1
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should return false when connection fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Connection failed'));

      const result = await webSearchService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('parseSearchResults', () => {
    it('should parse search results correctly', async () => {
      const mockResults = [
        {
          title: 'Test Result 1',
          content: 'Test content 1',
          url: 'https://example.com/1',
          score: 0.9
        },
        {
          title: 'Test Result 2',
          content: 'Test content 2',
          url: 'https://test.com/2',
          score: 0.8
        }
      ];

      mockedAxios.post.mockResolvedValue({ data: { results: mockResults } });

      const results = await webSearchService.searchAutomotiveParts('test');

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        title: 'Test Result 1',
        content: 'Test content 1',
        url: 'https://example.com/1',
        relevanceScore: 0.9,
        source: 'example.com'
      });
      expect(results[1]).toMatchObject({
        title: 'Test Result 2',
        content: 'Test content 2',
        url: 'https://test.com/2',
        relevanceScore: 0.8,
        source: 'test.com'
      });
    });

    it('should handle results with missing data', async () => {
      const mockResults = [
        {
          // Missing title and content
          url: 'https://example.com/incomplete'
        }
      ];

      mockedAxios.post.mockResolvedValue({ data: { results: mockResults } });

      const results = await webSearchService.searchAutomotiveParts('test');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        title: 'No title',
        content: 'No content',
        url: 'https://example.com/incomplete',
        source: 'example.com'
      });
    });
  });

  describe('extractDomain', () => {
    it('should extract domain correctly', async () => {
      const mockResults = [
        {
          title: 'Test',
          content: 'Test',
          url: 'https://www.autozone.com/parts/starter'
        }
      ];

      mockedAxios.post.mockResolvedValue({ data: { results: mockResults } });

      const results = await webSearchService.searchAutomotiveParts('test');

      expect(results[0].source).toBe('autozone.com');
    });

    it('should handle invalid URLs', async () => {
      const mockResults = [
        {
          title: 'Test',
          content: 'Test',
          url: 'invalid-url'
        }
      ];

      mockedAxios.post.mockResolvedValue({ data: { results: mockResults } });

      const results = await webSearchService.searchAutomotiveParts('test');

      expect(results[0].source).toBe('unknown');
    });
  });
});
