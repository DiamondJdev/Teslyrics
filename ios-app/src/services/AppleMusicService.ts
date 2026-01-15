/**
 * Apple Music Integration Service
 * Handles retrieving currently playing track information
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { Track } from '../types';

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
   * Fetch lyrics for a track
   * Note: MediaPlayer doesn't provide lyrics API
   * This would need integration with a third-party lyrics API
   * or manual user input
   */
  async fetchLyrics(track: Track): Promise<string | null> {
    // Placeholder for lyrics fetching
    // In production, integrate with:
    // - Genius API
    // - Musixmatch API
    // - Or allow manual input
    console.log(`Lyrics fetching not implemented for: ${track.artist} - ${track.title}`);
    return null;
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
