/**
 * WebSearchService - Tavily web search integration for automotive information
 * Handles web search queries and returns structured automotive data
 */

import axios from 'axios';

export interface WebSearchResult {
  title: string;
  content: string;
  url: string;
  relevanceScore: number;
  source: string;
  publishedDate?: Date;
}

export interface WebSearchError {
  code: 'CONNECTION_FAILED' | 'RATE_LIMITED' | 'INVALID_RESPONSE' | 'TIMEOUT' | 'NO_RESULTS';
  message: string;
  provider: 'tavily';
  fallbackStrategy: 'llm_knowledge' | 'cached_data' | 'user_notification';
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  vin?: string;
}

export class WebSearchService {
  private apiKey: string;
  private baseUrl: string = 'https://api.tavily.com/search';
  private timeout: number = 10000;

  constructor() {
    // Get API key from environment variables
    this.apiKey = process.env.TAVILY_WEB_SEARCH_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Tavily API key not found in environment variables');
    }
  }

  /**
   * Search for automotive parts information
   */
  async searchAutomotiveParts(
    query: string, 
    vehicleInfo?: VehicleInfo
  ): Promise<WebSearchResult[]> {
    try {
      const enhancedQuery = vehicleInfo 
        ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} ${query} parts price`
        : `${query} automotive parts price`;

      const response = await axios.post(this.baseUrl, {
        api_key: this.apiKey,
        query: enhancedQuery,
        max_results: 5,
        include_domains: ['autozone.com', 'advanceautoparts.com', 'rockauto.com', 'partsgeek.com']
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return this.parseSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching automotive parts:', error);
      throw this.handleSearchError(error);
    }
  }

  /**
   * Search for labor rates information
   */
  async searchLaborRates(
    location: string, 
    repairType: string
  ): Promise<WebSearchResult[]> {
    try {
      const query = `automotive repair labor rates ${repairType} ${location} per hour 2024`;

      const response = await axios.post(this.baseUrl, {
        api_key: this.apiKey,
        query: query,
        max_results: 3,
        include_domains: ['repairpal.com', 'yourmechanic.com', 'identifix.com']
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return this.parseSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching labor rates:', error);
      throw this.handleSearchError(error);
    }
  }

  /**
   * Search for repair procedures
   */
  async searchRepairProcedures(
    vehicleInfo: VehicleInfo, 
    repairType: string
  ): Promise<WebSearchResult[]> {
    try {
      const query = `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} ${repairType} repair procedure steps`;

      const response = await axios.post(this.baseUrl, {
        api_key: this.apiKey,
        query: query,
        max_results: 4,
        include_domains: ['youtube.com', 'reddit.com', 'mechanicbase.com', 'repairsmith.com']
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return this.parseSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching repair procedures:', error);
      throw this.handleSearchError(error);
    }
  }

  /**
   * Search for VIN information
   */
  async searchVINInformation(vin: string): Promise<WebSearchResult[]> {
    try {
      const query = `VIN ${vin} vehicle information decode`;

      const response = await axios.post(this.baseUrl, {
        api_key: this.apiKey,
        query: query,
        max_results: 3,
        include_domains: ['vindecoderz.com', 'vehiclehistory.com', 'carfax.com']
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return this.parseSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching VIN information:', error);
      throw this.handleSearchError(error);
    }
  }

  /**
   * Test connection to Tavily API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.post(this.baseUrl, {
        api_key: this.apiKey,
        query: 'test connection',
        max_results: 1
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Parse and structure search results
   */
  private parseSearchResults(results: any[]): WebSearchResult[] {
    return results.map((result, index) => ({
      title: result.title || 'No title',
      content: result.content || result.snippet || 'No content',
      url: result.url || '',
      relevanceScore: result.score || (1 - index * 0.1), // Decreasing relevance
      source: this.extractDomain(result.url || ''),
      publishedDate: result.published_date ? new Date(result.published_date) : undefined
    }));
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Handle search errors and provide appropriate fallback strategies
   */
  private handleSearchError(error: any): WebSearchError {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        code: 'TIMEOUT',
        message: 'Search request timed out',
        provider: 'tavily',
        fallbackStrategy: 'cached_data'
      };
    }

    if (error.response?.status === 429) {
      return {
        code: 'RATE_LIMITED',
        message: 'API rate limit exceeded',
        provider: 'tavily',
        fallbackStrategy: 'cached_data'
      };
    }

    if (error.response?.status >= 500) {
      return {
        code: 'CONNECTION_FAILED',
        message: 'Search service unavailable',
        provider: 'tavily',
        fallbackStrategy: 'llm_knowledge'
      };
    }

    return {
      code: 'INVALID_RESPONSE',
      message: error.message || 'Unknown search error',
      provider: 'tavily',
      fallbackStrategy: 'user_notification'
    };
  }
}

export default WebSearchService;
