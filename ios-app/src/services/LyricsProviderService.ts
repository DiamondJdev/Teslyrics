/**
 * Lyrics Provider Service
 * Integrates with multiple lyrics APIs (Musixmatch, Genius, LRClib)
 * Provides automatic lyrics fetching with failsafes and timing validation
 */

import axios, { AxiosInstance } from 'axios';
import { Track } from '../types';

/**
 * Lyrics response with optional timing information
 */
export interface LyricsResult {
  lyrics: string;
  source: 'musixmatch' | 'genius' | 'lrclib' | 'manual';
  synced: boolean;
  syncedLyrics?: SyncedLyric[];
  confidence: number; // 0-1 match confidence
  duration?: number; // Track duration for validation
}

/**
 * Synced lyric line with timing
 */
export interface SyncedLyric {
  time: number; // Time in milliseconds
  text: string;
}

/**
 * Configuration for lyrics fetching
 */
export interface LyricsConfig {
  // API Keys (optional, some APIs work without keys)
  musixmatchApiKey?: string;
  geniusApiKey?: string;
  
  // Preferences
  preferSynced: boolean;
  maxRetries: number;
  timeout: number;
  
  // Matching thresholds
  titleMatchThreshold: number; // 0-1, how similar titles must be
  artistMatchThreshold: number; // 0-1, how similar artists must be
  durationToleranceMs: number; // Max difference in track duration
}

const DEFAULT_CONFIG: LyricsConfig = {
  preferSynced: true,
  maxRetries: 2,
  timeout: 10000,
  titleMatchThreshold: 0.8,
  artistMatchThreshold: 0.8,
  durationToleranceMs: 5000, // 5 seconds tolerance
};

/**
 * LyricsProviderService
 * Handles fetching lyrics from multiple sources with failsafes
 */
export class LyricsProviderService {
  private config: LyricsConfig;
  private lrclibClient: AxiosInstance;
  private geniusClient: AxiosInstance;
  
  constructor(config: Partial<LyricsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize API clients
    this.lrclibClient = axios.create({
      baseURL: 'https://lrclib.net/api',
      timeout: this.config.timeout,
    });
    
    this.geniusClient = axios.create({
      baseURL: 'https://api.genius.com',
      timeout: this.config.timeout,
      headers: this.config.geniusApiKey ? {
        'Authorization': `Bearer ${this.config.geniusApiKey}`,
      } : {},
    });
  }

  /**
   * Fetch lyrics for a track with automatic provider selection
   */
  async fetchLyrics(track: Track): Promise<LyricsResult | null> {
    console.log(`Fetching lyrics for: ${track.artist} - ${track.title}`);
    
    // Try providers in order of preference
    const providers = [
      () => this.fetchFromLRCLib(track),
      () => this.fetchFromGenius(track),
      // Musixmatch would go here if API key is available
    ];
    
    for (const provider of providers) {
      try {
        const result = await provider();
        if (result && this.validateLyrics(result, track)) {
          console.log(`Successfully fetched lyrics from ${result.source}`);
          return result;
        }
      } catch (error) {
        console.warn(`Provider failed:`, error);
        continue; // Try next provider
      }
    }
    
    console.warn('All lyrics providers failed');
    return null;
  }

  /**
   * Fetch lyrics from LRCLib (free, supports synced lyrics)
   */
  private async fetchFromLRCLib(track: Track): Promise<LyricsResult | null> {
    try {
      // LRCLib search endpoint
      const params = {
        track_name: track.title,
        artist_name: track.artist,
        album_name: track.album || '',
      };
      
      const response = await this.lrclibClient.get('/search', { params });
      
      if (!response.data || response.data.length === 0) {
        return null;
      }
      
      // Find best match
      const bestMatch = this.findBestMatch(response.data, track);
      
      if (!bestMatch) {
        return null;
      }
      
      // Get full lyrics
      const lyricsResponse = await this.lrclibClient.get('/get', {
        params: {
          track_name: bestMatch.trackName,
          artist_name: bestMatch.artistName,
          album_name: bestMatch.albumName,
          duration: bestMatch.duration,
        },
      });
      
      const data = lyricsResponse.data;
      
      // Parse synced lyrics if available
      let syncedLyrics: SyncedLyric[] | undefined;
      if (data.syncedLyrics) {
        syncedLyrics = this.parseLRC(data.syncedLyrics);
      }
      
      return {
        lyrics: data.plainLyrics || data.syncedLyrics || '',
        source: 'lrclib',
        synced: !!syncedLyrics,
        syncedLyrics,
        confidence: this.calculateMatchConfidence(bestMatch, track),
        duration: data.duration,
      };
    } catch (error) {
      console.error('LRCLib fetch error:', error);
      return null;
    }
  }

  /**
   * Fetch lyrics from Genius API
   */
  private async fetchFromGenius(track: Track): Promise<LyricsResult | null> {
    try {
      // Search for the song
      const searchResponse = await this.geniusClient.get('/search', {
        params: {
          q: `${track.artist} ${track.title}`,
        },
      });
      
      if (!searchResponse.data?.response?.hits?.length) {
        return null;
      }
      
      const hits = searchResponse.data.response.hits;
      const bestMatch = hits[0]?.result;
      
      if (!bestMatch) {
        return null;
      }
      
      // Note: Genius API doesn't provide lyrics directly via API
      // This would require web scraping which is against their ToS
      // Return null for now, but structure is here for future use
      console.log('Genius match found but lyrics extraction not implemented');
      return null;
    } catch (error) {
      console.error('Genius fetch error:', error);
      return null;
    }
  }

  /**
   * Parse LRC format lyrics to synced lyrics array
   */
  private parseLRC(lrcContent: string): SyncedLyric[] {
    const lines = lrcContent.split('\n');
    const syncedLyrics: SyncedLyric[] = [];
    
    // LRC format: [mm:ss.xx]lyrics text
    const lrcPattern = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    
    for (const line of lines) {
      const match = line.match(lrcPattern);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centiseconds = parseInt(match[3].padEnd(3, '0'), 10);
        
        const timeMs = (minutes * 60 * 1000) + (seconds * 1000) + (centiseconds * 10);
        const text = match[4].trim();
        
        if (text) {
          syncedLyrics.push({ time: timeMs, text });
        }
      }
    }
    
    return syncedLyrics;
  }

  /**
   * Find best matching track from search results
   */
  private findBestMatch(results: any[], track: Track): any | null {
    let bestMatch = null;
    let highestScore = 0;
    
    for (const result of results) {
      const score = this.calculateMatchScore(result, track);
      if (score > highestScore && score >= this.config.titleMatchThreshold) {
        highestScore = score;
        bestMatch = result;
      }
    }
    
    return bestMatch;
  }

  /**
   * Calculate match score between search result and track
   */
  private calculateMatchScore(result: any, track: Track): number {
    const titleSimilarity = this.stringSimilarity(
      result.trackName || result.title || '',
      track.title
    );
    
    const artistSimilarity = this.stringSimilarity(
      result.artistName || result.artist || '',
      track.artist
    );
    
    // Weighted average: title is more important
    return (titleSimilarity * 0.6) + (artistSimilarity * 0.4);
  }

  /**
   * Calculate confidence score for a match
   */
  private calculateMatchConfidence(result: any, track: Track): number {
    let confidence = this.calculateMatchScore(result, track);
    
    // Reduce confidence if duration differs significantly
    if (track.duration && result.duration) {
      const durationDiff = Math.abs((track.duration * 1000) - result.duration);
      if (durationDiff > this.config.durationToleranceMs) {
        confidence *= 0.7; // Reduce confidence by 30%
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Validate lyrics result
   */
  private validateLyrics(result: LyricsResult, track: Track): boolean {
    // Check if lyrics are not empty
    if (!result.lyrics || result.lyrics.trim().length === 0) {
      return false;
    }
    
    // Check confidence threshold
    if (result.confidence < this.config.titleMatchThreshold) {
      return false;
    }
    
    // Validate synced lyrics timing if present
    if (result.syncedLyrics && result.syncedLyrics.length > 0) {
      // Check that timings are in order
      for (let i = 1; i < result.syncedLyrics.length; i++) {
        if (result.syncedLyrics[i].time < result.syncedLyrics[i - 1].time) {
          console.warn('Synced lyrics have invalid timing order');
          return false;
        }
      }
      
      // Check that last lyric doesn't exceed track duration (if known)
      if (track.duration) {
        const lastTime = result.syncedLyrics[result.syncedLyrics.length - 1].time;
        const trackDurationMs = track.duration * 1000;
        if (lastTime > trackDurationMs + this.config.durationToleranceMs) {
          console.warn('Synced lyrics exceed track duration');
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Calculate string similarity (Dice coefficient)
   */
  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) return 0;
    
    // Create bigrams
    const bigrams1 = new Set<string>();
    const bigrams2 = new Set<string>();
    
    for (let i = 0; i < s1.length - 1; i++) {
      bigrams1.add(s1.substring(i, i + 2));
    }
    
    for (let i = 0; i < s2.length - 1; i++) {
      bigrams2.add(s2.substring(i, i + 2));
    }
    
    // Calculate intersection
    const intersection = new Set(
      [...bigrams1].filter(x => bigrams2.has(x))
    );
    
    // Dice coefficient
    return (2 * intersection.size) / (bigrams1.size + bigrams2.size);
  }

  /**
   * Format synced lyrics to plain text
   */
  formatSyncedLyricsToPlain(syncedLyrics: SyncedLyric[]): string {
    return syncedLyrics.map(line => line.text).join('\n');
  }

  /**
   * Format synced lyrics to LRC format
   */
  formatSyncedLyricsToLRC(syncedLyrics: SyncedLyric[]): string {
    return syncedLyrics.map(line => {
      const totalSeconds = line.time / 1000;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const centiseconds = Math.floor((totalSeconds % 1) * 100);
      
      return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]${line.text}`;
    }).join('\n');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LyricsConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
export const lyricsProviderService = new LyricsProviderService();
