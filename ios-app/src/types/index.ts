/**
 * TypeScript type definitions for Teslyrics iOS App
 */

export interface Track {
  trackId: string;
  artist: string;
  title: string;
  album?: string;
  lyrics?: string;
  duration?: number; // Duration in seconds
}

export interface LyricsRequest {
  trackId: string;
  artist: string;
  title: string;
  lyrics: string;
}

export interface LyricsResponse {
  success: boolean;
  message: string;
  trackId: string;
}

export interface ServerStatus {
  status: string;
  uptime: number;
  cache: CacheStats;
}

export interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
}

export interface ConnectionStatus {
  connected: boolean;
  serverUrl: string;
  lastChecked?: Date;
}

export interface AppConfig {
  serverUrl: string;
  autoSync: boolean;
  backgroundSync: boolean;
}
