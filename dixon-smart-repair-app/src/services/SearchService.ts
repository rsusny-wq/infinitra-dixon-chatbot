/**
 * Enhanced Search & Filtering Service
 * Intelligent search and organization for sessions and vehicles
 * Phase 4.3: Advanced Session Management Enhancements
 */

import { SessionInfo, VehicleInfo } from '../stores/sessionStore';

interface SearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  diagnosticAccuracy?: {
    min: number;
    max: number;
  };
  vinEnhanced?: boolean;
  vehicleTypes?: string[]; // ['Honda Civic', 'Toyota Camry']
  problemTypes?: string[]; // ['brake', 'engine', 'transmission']
  messageCountRange?: {
    min: number;
    max: number;
  };
}

interface SearchResult<T> {
  item: T;
  score: number;
  matchedFields: string[];
  highlights: Record<string, string>;
}

interface SearchSuggestion {
  type: 'recent' | 'popular' | 'vehicle' | 'problem';
  text: string;
  count?: number;
  icon: string;
}

class SearchService {
  private searchHistory: string[] = [];
  private readonly MAX_HISTORY = 20;

  constructor() {
    this.loadSearchHistory();
  }

  /**
   * Search sessions with intelligent ranking
   */
  searchSessions(
    query: string,
    sessions: SessionInfo[],
    filters?: SearchFilters
  ): SearchResult<SessionInfo>[] {
    // Apply filters first
    let filteredSessions = this.applySessionFilters(sessions, filters);

    if (!query.trim()) {
      return filteredSessions.map(session => ({
        item: session,
        score: 1,
        matchedFields: [],
        highlights: {}
      }));
    }

    const results: SearchResult<SessionInfo>[] = [];
    const queryTerms = this.tokenizeQuery(query);

    filteredSessions.forEach(session => {
      const searchableText = this.getSessionSearchableText(session);
      const score = this.calculateSessionScore(queryTerms, searchableText, session);
      
      if (score > 0) {
        const matchedFields = this.getMatchedFields(queryTerms, session);
        const highlights = this.generateHighlights(queryTerms, session);
        
        results.push({
          item: session,
          score,
          matchedFields,
          highlights
        });
      }
    });

    // Sort by score (descending) and recency
    results.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.1) {
        // If scores are similar, prefer more recent
        return new Date(b.item.lastAccessed).getTime() - new Date(a.item.lastAccessed).getTime();
      }
      return b.score - a.score;
    });

    this.addToSearchHistory(query);
    return results;
  }

  /**
   * Search vehicles with intelligent ranking
   */
  searchVehicles(
    query: string,
    vehicles: VehicleInfo[],
    filters?: Partial<VehicleInfo>
  ): SearchResult<VehicleInfo>[] {
    // Apply filters first
    let filteredVehicles = vehicles.filter(vehicle => {
      if (filters?.make && vehicle.make !== filters.make) return false;
      if (filters?.year && vehicle.year !== filters.year) return false;
      if (filters?.verified !== undefined && vehicle.verified !== filters.verified) return false;
      return true;
    });

    if (!query.trim()) {
      return filteredVehicles.map(vehicle => ({
        item: vehicle,
        score: 1,
        matchedFields: [],
        highlights: {}
      }));
    }

    const results: SearchResult<VehicleInfo>[] = [];
    const queryTerms = this.tokenizeQuery(query);

    filteredVehicles.forEach(vehicle => {
      const searchableText = this.getVehicleSearchableText(vehicle);
      const score = this.calculateVehicleScore(queryTerms, searchableText, vehicle);
      
      if (score > 0) {
        const matchedFields = this.getVehicleMatchedFields(queryTerms, vehicle);
        const highlights = this.generateVehicleHighlights(queryTerms, vehicle);
        
        results.push({
          item: vehicle,
          score,
          matchedFields,
          highlights
        });
      }
    });

    // Sort by score and usage
    results.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.1) {
        // If scores are similar, prefer more frequently used
        return b.item.usageCount - a.item.usageCount;
      }
      return b.score - a.score;
    });

    this.addToSearchHistory(query);
    return results;
  }

  /**
   * Generate search suggestions
   */
  generateSearchSuggestions(
    sessions: SessionInfo[],
    vehicles: VehicleInfo[],
    currentQuery?: string
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Recent searches
    if (currentQuery) {
      const matchingHistory = this.searchHistory
        .filter(term => term.toLowerCase().includes(currentQuery.toLowerCase()))
        .slice(0, 3);
      
      matchingHistory.forEach(term => {
        suggestions.push({
          type: 'recent',
          text: term,
          icon: 'time-outline'
        });
      });
    }

    // Popular vehicle types
    const vehicleTypes = this.getPopularVehicleTypes(vehicles);
    vehicleTypes.slice(0, 3).forEach(({ type, count }) => {
      if (!currentQuery || type.toLowerCase().includes(currentQuery.toLowerCase())) {
        suggestions.push({
          type: 'vehicle',
          text: type,
          count,
          icon: 'car-outline'
        });
      }
    });

    // Common problems
    const commonProblems = this.getCommonProblems(sessions);
    commonProblems.slice(0, 3).forEach(({ problem, count }) => {
      if (!currentQuery || problem.toLowerCase().includes(currentQuery.toLowerCase())) {
        suggestions.push({
          type: 'problem',
          text: problem,
          count,
          icon: 'construct-outline'
        });
      }
    });

    // Popular searches (if no current query)
    if (!currentQuery && this.searchHistory.length > 0) {
      const popularSearches = this.getPopularSearches();
      popularSearches.slice(0, 2).forEach(({ term, count }) => {
        suggestions.push({
          type: 'popular',
          text: term,
          count,
          icon: 'trending-up-outline'
        });
      });
    }

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }

  /**
   * Apply session filters
   */
  private applySessionFilters(sessions: SessionInfo[], filters?: SearchFilters): SessionInfo[] {
    if (!filters) return sessions;

    return sessions.filter(session => {
      // Date range filter
      if (filters.dateRange) {
        const sessionDate = new Date(session.lastAccessed);
        if (sessionDate < filters.dateRange.start || sessionDate > filters.dateRange.end) {
          return false;
        }
      }

      // Diagnostic accuracy filter
      if (filters.diagnosticAccuracy) {
        const accuracy = parseFloat(session.diagnosticAccuracy.replace('%', ''));
        if (accuracy < filters.diagnosticAccuracy.min || accuracy > filters.diagnosticAccuracy.max) {
          return false;
        }
      }

      // VIN enhanced filter
      if (filters.vinEnhanced !== undefined && session.vinEnhanced !== filters.vinEnhanced) {
        return false;
      }

      // Vehicle types filter
      if (filters.vehicleTypes && filters.vehicleTypes.length > 0) {
        const vehicleType = `${session.vehicleInfo?.make} ${session.vehicleInfo?.model}`.trim();
        if (!filters.vehicleTypes.includes(vehicleType)) {
          return false;
        }
      }

      // Problem types filter
      if (filters.problemTypes && filters.problemTypes.length > 0) {
        const title = session.title.toLowerCase();
        const hasMatchingProblem = filters.problemTypes.some(problem => 
          title.includes(problem.toLowerCase())
        );
        if (!hasMatchingProblem) {
          return false;
        }
      }

      // Message count range filter
      if (filters.messageCountRange) {
        if (session.messageCount < filters.messageCountRange.min || 
            session.messageCount > filters.messageCountRange.max) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Tokenize search query
   */
  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 1);
  }

  /**
   * Get searchable text for session
   */
  private getSessionSearchableText(session: SessionInfo): string {
    return [
      session.title,
      session.vehicleInfo?.make,
      session.vehicleInfo?.model,
      session.vehicleInfo?.year?.toString(),
      session.diagnosticLevel,
      session.vinEnhanced ? 'vin enhanced' : 'basic diagnostic'
    ].filter(Boolean).join(' ').toLowerCase();
  }

  /**
   * Get searchable text for vehicle
   */
  private getVehicleSearchableText(vehicle: VehicleInfo): string {
    return [
      vehicle.make,
      vehicle.model,
      vehicle.year?.toString(),
      vehicle.nickname,
      vehicle.vin,
      vehicle.verified ? 'verified' : 'unverified'
    ].filter(Boolean).join(' ').toLowerCase();
  }

  /**
   * Calculate session search score
   */
  private calculateSessionScore(queryTerms: string[], searchableText: string, session: SessionInfo): number {
    let score = 0;
    const words = searchableText.split(' ');

    queryTerms.forEach(term => {
      // Exact matches in title (highest weight)
      if (session.title.toLowerCase().includes(term)) {
        score += 10;
      }

      // Exact matches in vehicle info
      if (session.vehicleInfo?.make?.toLowerCase().includes(term) ||
          session.vehicleInfo?.model?.toLowerCase().includes(term)) {
        score += 8;
      }

      // Partial matches
      words.forEach(word => {
        if (word.includes(term)) {
          score += 3;
        }
        if (term.includes(word) && word.length > 2) {
          score += 2;
        }
      });
    });

    // Boost recent sessions
    const daysSinceAccess = (Date.now() - new Date(session.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAccess < 7) {
      score *= 1.5;
    } else if (daysSinceAccess < 30) {
      score *= 1.2;
    }

    // Boost VIN-enhanced sessions
    if (session.vinEnhanced) {
      score *= 1.3;
    }

    // Boost sessions with more messages (more engagement)
    if (session.messageCount > 5) {
      score *= 1.2;
    }

    return score;
  }

  /**
   * Calculate vehicle search score
   */
  private calculateVehicleScore(queryTerms: string[], searchableText: string, vehicle: VehicleInfo): number {
    let score = 0;
    const words = searchableText.split(' ');

    queryTerms.forEach(term => {
      // Exact matches in make/model (highest weight)
      if (vehicle.make.toLowerCase().includes(term) || vehicle.model.toLowerCase().includes(term)) {
        score += 10;
      }

      // Exact matches in nickname
      if (vehicle.nickname?.toLowerCase().includes(term)) {
        score += 8;
      }

      // Year matches
      if (vehicle.year?.toString().includes(term)) {
        score += 6;
      }

      // Partial matches
      words.forEach(word => {
        if (word.includes(term)) {
          score += 3;
        }
      });
    });

    // Boost frequently used vehicles
    score += Math.min(vehicle.usageCount * 0.5, 5);

    // Boost verified vehicles
    if (vehicle.verified) {
      score *= 1.4;
    }

    // Boost recently used vehicles
    if (vehicle.lastUsed) {
      const daysSinceUse = (Date.now() - new Date(vehicle.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUse < 7) {
        score *= 1.3;
      } else if (daysSinceUse < 30) {
        score *= 1.1;
      }
    }

    return score;
  }

  /**
   * Get matched fields for session
   */
  private getMatchedFields(queryTerms: string[], session: SessionInfo): string[] {
    const matchedFields: string[] = [];

    queryTerms.forEach(term => {
      if (session.title.toLowerCase().includes(term)) {
        matchedFields.push('title');
      }
      if (session.vehicleInfo?.make?.toLowerCase().includes(term)) {
        matchedFields.push('vehicle');
      }
      if (session.diagnosticLevel.toLowerCase().includes(term)) {
        matchedFields.push('diagnosticLevel');
      }
    });

    return [...new Set(matchedFields)];
  }

  /**
   * Get matched fields for vehicle
   */
  private getVehicleMatchedFields(queryTerms: string[], vehicle: VehicleInfo): string[] {
    const matchedFields: string[] = [];

    queryTerms.forEach(term => {
      if (vehicle.make.toLowerCase().includes(term) || vehicle.model.toLowerCase().includes(term)) {
        matchedFields.push('makeModel');
      }
      if (vehicle.nickname?.toLowerCase().includes(term)) {
        matchedFields.push('nickname');
      }
      if (vehicle.year?.toString().includes(term)) {
        matchedFields.push('year');
      }
    });

    return [...new Set(matchedFields)];
  }

  /**
   * Generate highlights for session
   */
  private generateHighlights(queryTerms: string[], session: SessionInfo): Record<string, string> {
    const highlights: Record<string, string> = {};

    // Highlight title
    let highlightedTitle = session.title;
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedTitle = highlightedTitle.replace(regex, '<mark>$1</mark>');
    });
    if (highlightedTitle !== session.title) {
      highlights.title = highlightedTitle;
    }

    // Highlight vehicle info
    if (session.vehicleInfo) {
      const vehicleText = `${session.vehicleInfo.year} ${session.vehicleInfo.make} ${session.vehicleInfo.model}`;
      let highlightedVehicle = vehicleText;
      queryTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedVehicle = highlightedVehicle.replace(regex, '<mark>$1</mark>');
      });
      if (highlightedVehicle !== vehicleText) {
        highlights.vehicle = highlightedVehicle;
      }
    }

    return highlights;
  }

  /**
   * Generate highlights for vehicle
   */
  private generateVehicleHighlights(queryTerms: string[], vehicle: VehicleInfo): Record<string, string> {
    const highlights: Record<string, string> = {};

    // Highlight make/model
    const makeModel = `${vehicle.make} ${vehicle.model}`;
    let highlightedMakeModel = makeModel;
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedMakeModel = highlightedMakeModel.replace(regex, '<mark>$1</mark>');
    });
    if (highlightedMakeModel !== makeModel) {
      highlights.makeModel = highlightedMakeModel;
    }

    // Highlight nickname
    if (vehicle.nickname) {
      let highlightedNickname = vehicle.nickname;
      queryTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedNickname = highlightedNickname.replace(regex, '<mark>$1</mark>');
      });
      if (highlightedNickname !== vehicle.nickname) {
        highlights.nickname = highlightedNickname;
      }
    }

    return highlights;
  }

  /**
   * Get popular vehicle types
   */
  private getPopularVehicleTypes(vehicles: VehicleInfo[]): { type: string; count: number }[] {
    const typeCounts: Record<string, number> = {};

    vehicles.forEach(vehicle => {
      const type = `${vehicle.make} ${vehicle.model}`;
      typeCounts[type] = (typeCounts[type] || 0) + vehicle.usageCount;
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get common problems from session titles
   */
  private getCommonProblems(sessions: SessionInfo[]): { problem: string; count: number }[] {
    const problemCounts: Record<string, number> = {};
    const problemKeywords = [
      'brake', 'brakes', 'braking',
      'engine', 'motor',
      'transmission', 'gear', 'shifting',
      'battery', 'electrical',
      'tire', 'tires', 'wheel',
      'oil', 'fluid', 'leak',
      'noise', 'sound', 'squealing', 'grinding',
      'vibration', 'shaking',
      'light', 'warning', 'dashboard',
      'starting', 'start', 'ignition',
      'cooling', 'overheating', 'temperature'
    ];

    sessions.forEach(session => {
      const title = session.title.toLowerCase();
      problemKeywords.forEach(keyword => {
        if (title.includes(keyword)) {
          problemCounts[keyword] = (problemCounts[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(problemCounts)
      .map(([problem, count]) => ({ 
        problem: problem.charAt(0).toUpperCase() + problem.slice(1), 
        count 
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get popular searches
   */
  private getPopularSearches(): { term: string; count: number }[] {
    const searchCounts: Record<string, number> = {};

    this.searchHistory.forEach(term => {
      searchCounts[term] = (searchCounts[term] || 0) + 1;
    });

    return Object.entries(searchCounts)
      .map(([term, count]) => ({ term, count }))
      .filter(({ count }) => count > 1)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Add to search history
   */
  private addToSearchHistory(query: string): void {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return;

    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(term => term !== trimmedQuery);
    
    // Add to beginning
    this.searchHistory.unshift(trimmedQuery);
    
    // Keep only recent searches
    if (this.searchHistory.length > this.MAX_HISTORY) {
      this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY);
    }

    this.persistSearchHistory();
  }

  /**
   * Load search history from localStorage
   */
  private loadSearchHistory(): void {
    try {
      const stored = localStorage.getItem('dixon-search-history');
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  /**
   * Persist search history to localStorage
   */
  private persistSearchHistory(): void {
    try {
      localStorage.setItem('dixon-search-history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Failed to persist search history:', error);
    }
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    localStorage.removeItem('dixon-search-history');
    console.log('🗑️ Search history cleared');
  }

  /**
   * Get search history
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }
}

export default new SearchService();
