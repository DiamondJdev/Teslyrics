/**
 * Teslyrics API Client
 * Handles communication with the Raspberry Pi server
 */

import axios, { AxiosInstance } from 'axios';
import {
  LyricsRequest,
  LyricsResponse,
  ServerStatus,
} from '../types';

export class TeslyricsClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://192.168.4.1:3000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update the server URL
   */
  setServerUrl(url: string): void {
    this.baseURL = url;
    this.client = axios.create({
      baseURL: url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send lyrics to the server
   */
  async sendLyrics(request: LyricsRequest): Promise<LyricsResponse> {
    try {
      const response = await this.client.post<LyricsResponse>(
        '/api/lyrics',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error sending lyrics:', error);
      throw error;
    }
  }

  /**
   * Get lyrics for a specific track
   */
  async getLyrics(trackId: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/api/lyrics/${trackId}`);
      return response.data.lyrics || null;
    } catch (error) {
      console.error('Error getting lyrics:', error);
      return null;
    }
  }

  /**
   * Get server status
   */
  async getStatus(): Promise<ServerStatus> {
    try {
      const response = await this.client.get<ServerStatus>('/api/status');
      return response.data;
    } catch (error) {
      console.error('Error getting status:', error);
      throw error;
    }
  }

  /**
   * Check server health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/status/health', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const response = await this.client.get('/api/status/cache');
      return response.data;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }
}

// Singleton instance
export const teslyricsClient = new TeslyricsClient();
