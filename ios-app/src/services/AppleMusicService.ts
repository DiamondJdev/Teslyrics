/**
 * Apple Music Integration Service
 * Handles retrieving currently playing track information
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { Track } from '../types';
import { lyricsProviderService, LyricsResult } from './LyricsProviderService';

const { AppleMusicModule } = NativeModules;

/**
 * Service to interact with Apple Music via native iOS MediaPlayer framework
 */
export class AppleMusicService {
  private eventEmitter: NativeEventEmitter | null = null;
  private trackChangeListeners: Array<(track: Track) => void> = [];
  private currentTrack: Track | null = null;

  constructor() {
    if (Platform.OS === 'ios' && AppleMusicModule) {
      this.eventEmitter = new NativeEventEmitter(AppleMusicModule);
      this.setupEventListeners();
    }
  }

  /**
   * Set up event listeners for native module events
   */
  private setupEventListeners(): void {
    if (!this.eventEmitter) return;

    this.eventEmitter.addListener('onTrackChange', (track: Track) => {
      this.currentTrack = track;
      this.trackChangeListeners.forEach(listener => listener(track));
    });

    this.eventEmitter.addListener('onPlaybackStateChange', (state: any) => {
      console.log('Playback state changed:', state);
    });
  }

  /**
   * Request authorization for Apple Music
   */
  async requestAuthorization(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AppleMusicModule) {
      console.warn('AppleMusicModule not available');
      return false;
    }

    try {
      const result = await AppleMusicModule.requestAuthorization();
      return result.authorized === true;
    } catch (error) {
      console.error('Error requesting authorization:', error);
      return false;
    }
  }

  /**
   * Get the currently playing track
   */
  async getCurrentTrack(): Promise<Track | null> {
    if (Platform.OS !== 'ios' || !AppleMusicModule) {
      console.warn('AppleMusicModule not available');
      return null;
    }

    try {
      const track = await AppleMusicModule.getCurrentTrack();
      if (track && track.trackId) {
        this.currentTrack = track;
        return track;
      }
      return null;
    } catch (error) {
      console.error('Error getting current track:', error);
      return null;
    }
  }

  /**
   * Fetch lyrics for a track using automatic provider selection
   * Tries LRCLib, Genius, and other providers with failsafes
   */
  async fetchLyrics(track: Track): Promise<LyricsResult | null> {
    console.log(`Auto-fetching lyrics for: ${track.artist} - ${track.title}`);
    
    try {
      const result = await lyricsProviderService.fetchLyrics(track);
      
      if (result) {
        console.log(`Lyrics fetched from ${result.source} with ${Math.round(result.confidence * 100)}% confidence`);
        return result;
      }
      
      console.warn('No lyrics found from any provider');
      return null;
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      return null;
    }
  }

  /**
   * Monitor for track changes
   */
  startMonitoring(callback: (track: Track) => void): void {
    if (Platform.OS !== 'ios' || !AppleMusicModule) {
      console.warn('AppleMusicModule not available');
      return;
    }

    this.trackChangeListeners.push(callback);

    AppleMusicModule.startMonitoring()
      .then(() => console.log('Started monitoring track changes'))
      .catch((error: Error) => console.error('Error starting monitoring:', error));
  }

  /**
   * Stop monitoring for track changes
   */
  stopMonitoring(): void {
    if (Platform.OS !== 'ios' || !AppleMusicModule) {
      return;
    }

    this.trackChangeListeners = [];

    AppleMusicModule.stopMonitoring()
      .then(() => console.log('Stopped monitoring track changes'))
      .catch((error: Error) => console.error('Error stopping monitoring:', error));
  }

  /**
   * Get cached current track (from last event)
   */
  getCachedCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  /**
   * Clean up event listeners
   */
  cleanup(): void {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('onTrackChange');
      this.eventEmitter.removeAllListeners('onPlaybackStateChange');
    }
    this.trackChangeListeners = [];
  }
}

export const appleMusicService = new AppleMusicService();
