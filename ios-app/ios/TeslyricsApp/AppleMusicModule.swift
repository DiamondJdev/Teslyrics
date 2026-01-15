//
//  AppleMusicModule.swift
//  TeslyricsApp
//
//  Provides access to Apple Music and MediaPlayer framework
//

import Foundation
import MediaPlayer
import React

@objc(AppleMusicModule)
class AppleMusicModule: RCTEventEmitter {
  
  private var hasListeners = false
  private let musicPlayer = MPMusicPlayerController.systemMusicPlayer
  
  override init() {
    super.init()
    setupNotifications()
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
    musicPlayer.endGeneratingPlaybackNotifications()
  }
  
  // MARK: - Event Emitter Setup
  
  override func supportedEvents() -> [String]! {
    return ["onTrackChange", "onPlaybackStateChange"]
  }
  
  override func startObserving() {
    hasListeners = true
  }
  
  override func stopObserving() {
    hasListeners = false
  }
  
  // MARK: - Notification Setup
  
  private func setupNotifications() {
    musicPlayer.beginGeneratingPlaybackNotifications()
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(nowPlayingItemDidChange),
      name: .MPMusicPlayerControllerNowPlayingItemDidChange,
      object: musicPlayer
    )
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(playbackStateDidChange),
      name: .MPMusicPlayerControllerPlaybackStateDidChange,
      object: musicPlayer
    )
  }
  
  @objc private func nowPlayingItemDidChange() {
    if hasListeners {
      if let track = getCurrentTrackInfo() {
        sendEvent(withName: "onTrackChange", body: track)
      }
    }
  }
  
  @objc private func playbackStateDidChange() {
    if hasListeners {
      let state = getPlaybackState()
      sendEvent(withName: "onPlaybackStateChange", body: ["state": state])
    }
  }
  
  // MARK: - React Native Methods
  
  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Note: iOS MediaPlayer doesn't require explicit authorization for reading now playing info
    // This is just a placeholder for consistency with the API
    resolve(["authorized": true])
  }
  
  @objc
  func getCurrentTrack(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    if let track = getCurrentTrackInfo() {
      resolve(track)
    } else {
      resolve(NSNull())
    }
  }
  
  @objc
  func getPlaybackState(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    let state = getPlaybackState()
    resolve(["state": state])
  }
  
  @objc
  func startMonitoring(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Notifications are already set up in init
    resolve(["monitoring": true])
  }
  
  @objc
  func stopMonitoring(_ resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Keep notifications running but just stop sending events
    resolve(["monitoring": false])
  }
  
  // MARK: - Helper Methods
  
  private func getCurrentTrackInfo() -> [String: Any]? {
    guard let item = musicPlayer.nowPlayingItem else {
      return nil
    }
    
    var trackInfo: [String: Any] = [:]
    
    trackInfo["trackId"] = String(item.persistentID)
    trackInfo["title"] = item.title ?? "Unknown Title"
    trackInfo["artist"] = item.artist ?? "Unknown Artist"
    trackInfo["album"] = item.albumTitle ?? ""
    trackInfo["duration"] = item.playbackDuration
    
    // Note: Lyrics are not directly accessible via MediaPlayer framework
    // They would need to be fetched from a separate API or MusicKit
    
    return trackInfo
  }
  
  private func getPlaybackState() -> String {
    switch musicPlayer.playbackState {
    case .playing:
      return "playing"
    case .paused:
      return "paused"
    case .stopped:
      return "stopped"
    case .interrupted:
      return "interrupted"
    case .seekingForward:
      return "seekingForward"
    case .seekingBackward:
      return "seekingBackward"
    @unknown default:
      return "unknown"
    }
  }
  
  // Required for RCTEventEmitter
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
