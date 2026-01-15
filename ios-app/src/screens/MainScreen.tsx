/**
 * Main Screen
 * Shows currently playing track, connection status, and sync controls
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { Track, ConnectionStatus } from '../types';
import { teslyricsClient } from '../services/TeslyricsClient';
import { appleMusicService } from '../services/AppleMusicService';
import { storageService } from '../services/StorageService';
import { lyricsProviderService } from '../services/LyricsProviderService';

export const MainScreen: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    serverUrl: 'http://192.168.4.1:3000',
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [cachedSongsCount, setCachedSongsCount] = useState(0);
  const [autoSync, setAutoSync] = useState(true);
  const [autoFetchLyrics, setAutoFetchLyrics] = useState(true);
  const [serverUrl, setServerUrl] = useState('http://192.168.4.1:3000');
  const [editingServerUrl, setEditingServerUrl] = useState(false);
  const [lyricsInput, setLyricsInput] = useState('');
  const [lyricsSource, setLyricsSource] = useState<string>('');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkConnection();
    requestMusicAuthorization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-check connection periodically
  useEffect(() => {
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  const loadSettings = async () => {
    const config = await storageService.getConfig();
    setAutoSync(config.autoSync);
    setServerUrl(config.serverUrl);
    teslyricsClient.setServerUrl(config.serverUrl);
    setConnectionStatus(prev => ({ ...prev, serverUrl: config.serverUrl }));
  };

  const requestMusicAuthorization = async () => {
    const authorized = await appleMusicService.requestAuthorization();
    if (!authorized) {
      Alert.alert(
        'Permission Required',
        'Apple Music access is required to retrieve song information.'
      );
    }
  };

  const checkConnection = async () => {
    const isHealthy = await teslyricsClient.checkHealth();
    setConnectionStatus(prev => ({
      ...prev,
      connected: isHealthy,
      lastChecked: new Date(),
    }));

    if (isHealthy) {
      updateCacheInfo();
    }
  };

  const updateCacheInfo = async () => {
    try {
      const status = await teslyricsClient.getStatus();
      setCachedSongsCount(status.cache.keys);
    } catch (error) {
      console.error('Error updating cache info:', error);
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    appleMusicService.startMonitoring(handleTrackChange);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    appleMusicService.stopMonitoring();
  };

  const handleTrackChange = async (track: Track) => {
    setCurrentTrack(track);
    if (autoSync) {
      await syncTrack(track);
    }
  };

  const syncCurrentTrack = async () => {
    const track = await appleMusicService.getCurrentTrack();
    if (track) {
      setCurrentTrack(track);
      await syncTrack(track);
    } else {
      Alert.alert('No Track', 'No track is currently playing in Apple Music.');
    }
  };

  const syncTrack = async (track: Track) => {
    if (!connectionStatus.connected) {
      Alert.alert('Not Connected', 'Cannot sync - server is not connected.');
      return;
    }

    setIsSyncing(true);
    try {
      // Use manual lyrics input if provided, otherwise try to fetch automatically
      let lyrics = lyricsInput;
      
      if (!lyrics && autoFetchLyrics) {
        setIsFetchingLyrics(true);
        setLyricsSource('Fetching from lyrics providers...');
        
        const lyricsResult = await appleMusicService.fetchLyrics(track);
        
        setIsFetchingLyrics(false);
        
        if (lyricsResult) {
          // Use synced lyrics if available, otherwise plain lyrics
          lyrics = lyricsResult.synced && lyricsResult.syncedLyrics
            ? lyricsProviderService.formatSyncedLyricsToPlain(lyricsResult.syncedLyrics)
            : lyricsResult.lyrics;
          
          const confidence = Math.round(lyricsResult.confidence * 100);
          setLyricsSource(`Auto-fetched from ${lyricsResult.source} (${confidence}% match${lyricsResult.synced ? ', synced' : ''})`);
          
          // Show lyrics in the input field so user can review/edit
          setLyricsInput(lyrics);
        } else {
          setLyricsSource('');
        }
      }

      if (!lyrics) {
        Alert.alert(
          'No Lyrics',
          'Could not auto-fetch lyrics. Please paste lyrics manually in the text field below.',
          [{ text: 'OK' }]
        );
        setIsSyncing(false);
        return;
      }

      const response = await teslyricsClient.sendLyrics({
        trackId: track.trackId,
        artist: track.artist,
        title: track.title,
        lyrics: lyrics,
      });

      if (response.success) {
        Alert.alert('Success', 'Lyrics sent to Tesla!');
        setLyricsInput(''); // Clear lyrics input after successful sync
        updateCacheInfo();
      }
    } catch (error) {
      console.error('Error syncing track:', error);
      Alert.alert('Error', 'Failed to send lyrics to server.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleServerUrlChange = async () => {
    await storageService.saveServerUrl(serverUrl);
    teslyricsClient.setServerUrl(serverUrl);
    setConnectionStatus(prev => ({ ...prev, serverUrl }));
    setEditingServerUrl(false);
    checkConnection();
  };

  const toggleAutoSync = async (value: boolean) => {
    setAutoSync(value);
    await storageService.saveAutoSync(value);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teslyrics</Text>
        <Text style={styles.subtitle}>Tesla Lyrics Sync</Text>
      </View>

      {/* Connection Status */}
      <View style={styles.section}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusIndicator,
              connectionStatus.connected ? styles.statusConnected : styles.statusDisconnected,
            ]}
          />
          <Text style={styles.statusText}>
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        {connectionStatus.lastChecked && (
          <Text style={styles.lastChecked}>
            Last checked: {connectionStatus.lastChecked.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Server URL Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Configuration</Text>
        {editingServerUrl ? (
          <View>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.4.1:3000"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  setEditingServerUrl(false);
                  loadSettings();
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleServerUrlChange}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.serverUrl}>{serverUrl}</Text>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setEditingServerUrl(true)}
            >
              <Text style={styles.secondaryButtonText}>Edit Server URL</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.cacheInfo}>{cachedSongsCount} songs cached</Text>
      </View>

      {/* Current Track */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currently Playing</Text>
        {currentTrack ? (
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist}>{currentTrack.artist}</Text>
            {currentTrack.album && (
              <Text style={styles.trackAlbum}>{currentTrack.album}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.noTrack}>No track playing</Text>
        )}
      </View>

      {/* Manual Lyrics Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lyrics</Text>
        {isFetchingLyrics && (
          <View style={styles.fetchingStatus}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.fetchingText}>Auto-fetching lyrics...</Text>
          </View>
        )}
        {lyricsSource && !isFetchingLyrics && (
          <Text style={styles.lyricsSource}>{lyricsSource}</Text>
        )}
        <TextInput
          style={styles.lyricsInput}
          value={lyricsInput}
          onChangeText={setLyricsInput}
          placeholder="Lyrics will auto-fetch when you play a song, or paste manually here..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Controls */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto-fetch lyrics</Text>
          <Switch value={autoFetchLyrics} onValueChange={setAutoFetchLyrics} />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto-sync on track change</Text>
          <Switch value={autoSync} onValueChange={toggleAutoSync} />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            !connectionStatus.connected && styles.disabledButton,
          ]}
          onPress={syncCurrentTrack}
          disabled={!connectionStatus.connected || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Lyrics to Tesla</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isMonitoring ? styles.dangerButton : styles.primaryButton]}
          onPress={isMonitoring ? stopMonitoring : startMonitoring}
        >
          <Text style={styles.buttonText}>
            {isMonitoring ? 'Stop Auto-Monitoring' : 'Start Auto-Monitoring'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={checkConnection}
        >
          <Text style={styles.secondaryButtonText}>Test Connection</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. Connect your iPhone to the Teslyrics WiFi network (default: TeslyricsAP)
        </Text>
        <Text style={styles.instructionText}>
          2. Make sure the server URL is correct (default: http://192.168.4.1:3000)
        </Text>
        <Text style={styles.instructionText}>
          3. Play a song in Apple Music
        </Text>
        <Text style={styles.instructionText}>
          4. Lyrics will auto-fetch (or paste manually if needed)
        </Text>
        <Text style={styles.instructionText}>
          5. Tap "Send Lyrics to Tesla" or enable "Auto-sync"
        </Text>
        <Text style={styles.instructionText}>
          6. Open Tesla browser to {serverUrl}
        </Text>
        <Text style={styles.instructionText}>
          7. Enable "Auto-Monitoring" for hands-free operation
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDisconnected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  lastChecked: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  serverUrl: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cacheInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  trackInfo: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  trackArtist: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  trackAlbum: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  noTrack: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  lyricsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
  },
  fetchingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  fetchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
  },
  lyricsSource: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
