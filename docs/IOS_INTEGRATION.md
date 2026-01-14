# Teslyrics - iOS App Integration Guide

## Overview

This guide explains how to integrate the Teslyrics backend with an iOS companion app that sends Apple Music lyrics to the Raspberry Pi server.

## Architecture

```
Apple Music (iOS) → Lyrics Extractor → HTTP Client → Teslyrics API → Cache
```

## Requirements

- iOS 14.0 or later
- Swift 5.0+
- MusicKit framework access
- Network permissions

## Basic Integration Steps

### 1. Network Configuration

Add network permissions to your `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <!-- Or for specific domains: -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>192.168.4.1</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 2. Server Discovery

Use Bonjour/mDNS for automatic server discovery:

```swift
import Foundation

class TeslyricsServerDiscovery: NSObject, NetServiceBrowserDelegate, NetServiceDelegate {
    private let browser = NetServiceBrowser()
    private var foundServers: [NetService] = []
    
    func startDiscovery() {
        browser.delegate = self
        browser.searchForServices(ofType: "_teslyrics._tcp", inDomain: "local.")
    }
    
    func netServiceBrowser(_ browser: NetServiceBrowser, didFind service: NetService, moreComing: Bool) {
        service.delegate = self
        service.resolve(withTimeout: 5.0)
        foundServers.append(service)
    }
    
    func netServiceDidResolveAddress(_ sender: NetService) {
        // Extract IP address and port
        if let addresses = sender.addresses {
            // Use the first IPv4 address
            for address in addresses {
                // Convert address data to string
                print("Found Teslyrics server at: \(sender.hostName ?? "unknown")")
            }
        }
    }
}
```

Or use a hardcoded IP (simpler approach):

```swift
let serverURL = "http://192.168.4.1:3000"
```

### 3. API Client

Create a client to interact with the Teslyrics API:

```swift
import Foundation

class TeslyricsClient {
    private let baseURL: String
    
    init(baseURL: String = "http://192.168.4.1:3000") {
        self.baseURL = baseURL
    }
    
    // MARK: - Models
    
    struct LyricsRequest: Codable {
        let trackId: String
        let artist: String
        let title: String
        let lyrics: String
    }
    
    struct LyricsResponse: Codable {
        let success: Bool
        let message: String
        let trackId: String
    }
    
    struct StatusResponse: Codable {
        let status: String
        let uptime: Double
        let cache: CacheStats
    }
    
    struct CacheStats: Codable {
        let keys: Int
        let hits: Int
        let misses: Int
    }
    
    // MARK: - API Methods
    
    func sendLyrics(trackId: String, artist: String, title: String, lyrics: String, completion: @escaping (Result<LyricsResponse, Error>) -> Void) {
        let url = URL(string: "\(baseURL)/api/lyrics")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let lyricsData = LyricsRequest(trackId: trackId, artist: artist, title: title, lyrics: lyrics)
        
        do {
            request.httpBody = try JSONEncoder().encode(lyricsData)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "TeslyricsClient", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
                return
            }
            
            do {
                let response = try JSONDecoder().decode(LyricsResponse.self, from: data)
                completion(.success(response))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    func getStatus(completion: @escaping (Result<StatusResponse, Error>) -> Void) {
        let url = URL(string: "\(baseURL)/api/status")!
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "TeslyricsClient", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
                return
            }
            
            do {
                let response = try JSONDecoder().decode(StatusResponse.self, from: data)
                completion(.success(response))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    func checkHealth(completion: @escaping (Bool) -> Void) {
        let url = URL(string: "\(baseURL)/api/status/health")!
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let httpResponse = response as? HTTPURLResponse {
                completion(httpResponse.statusCode == 200)
            } else {
                completion(false)
            }
        }.resume()
    }
}
```

### 4. Apple Music Integration

Use MusicKit to get currently playing song and lyrics:

```swift
import MusicKit

class AppleMusicLyricsProvider {
    
    // Request authorization
    func requestAuthorization() async -> Bool {
        let status = await MusicAuthorization.request()
        return status == .authorized
    }
    
    // Get currently playing track
    func getCurrentTrack() async -> Track? {
        // Note: This is a simplified example
        // Actual implementation depends on MusicKit API availability
        return nil
    }
    
    // Extract lyrics from track
    func extractLyrics(from track: Track) -> String? {
        // Note: Apple doesn't provide direct API access to lyrics
        // You may need to:
        // 1. Use a third-party lyrics API
        // 2. Implement web scraping (check terms of service)
        // 3. Have users manually input/paste lyrics
        return nil
    }
}
```

### 5. Background Sync

Implement background sync to automatically send lyrics:

```swift
import BackgroundTasks

class LyricsSyncManager {
    private let client = TeslyricsClient()
    private let musicProvider = AppleMusicLyricsProvider()
    
    func registerBackgroundTask() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.teslyrics.sync", using: nil) { task in
            self.handleLyricsSync(task: task as! BGAppRefreshTask)
        }
    }
    
    func scheduleBackgroundSync() {
        let request = BGAppRefreshTaskRequest(identifier: "com.teslyrics.sync")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        try? BGTaskScheduler.shared.submit(request)
    }
    
    private func handleLyricsSync(task: BGAppRefreshTask) {
        // Sync lyrics in background
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        
        // Perform sync
        // ...
        
        task.setTaskCompleted(success: true)
        scheduleBackgroundSync()
    }
}
```

### 6. Real-time Updates

Monitor currently playing track and send lyrics automatically:

```swift
import MediaPlayer

class NowPlayingMonitor {
    private let client = TeslyricsClient()
    private var currentTrackId: String?
    
    func startMonitoring() {
        let center = MPRemoteCommandCenter.shared()
        
        // Monitor play/pause
        center.playCommand.addTarget { [weak self] _ in
            self?.checkCurrentTrack()
            return .success
        }
        
        // Monitor track changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(nowPlayingItemDidChange),
            name: .MPMusicPlayerControllerNowPlayingItemDidChange,
            object: nil
        )
        
        MPMusicPlayerController.systemMusicPlayer.beginGeneratingPlaybackNotifications()
    }
    
    @objc private func nowPlayingItemDidChange() {
        checkCurrentTrack()
    }
    
    private func checkCurrentTrack() {
        let player = MPMusicPlayerController.systemMusicPlayer
        
        guard let item = player.nowPlayingItem else { return }
        
        let trackId = item.persistentID.description
        let artist = item.artist ?? "Unknown Artist"
        let title = item.title ?? "Unknown Title"
        
        // Only send if track changed
        guard trackId != currentTrackId else { return }
        currentTrackId = trackId
        
        // Get lyrics and send to server
        getLyricsForTrack(trackId: trackId, artist: artist, title: title)
    }
    
    private func getLyricsForTrack(trackId: String, artist: String, title: String) {
        // Fetch lyrics from your source
        // Then send to server
        let lyrics = "..." // Get lyrics somehow
        
        client.sendLyrics(trackId: trackId, artist: artist, title: title, lyrics: lyrics) { result in
            switch result {
            case .success(let response):
                print("Lyrics sent: \(response.message)")
            case .failure(let error):
                print("Error sending lyrics: \(error)")
            }
        }
    }
}
```

## User Interface Example

### SwiftUI View

```swift
import SwiftUI

struct TeslyricsView: View {
    @StateObject private var viewModel = TeslyricsViewModel()
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Connection Status
                HStack {
                    Circle()
                        .fill(viewModel.isConnected ? Color.green : Color.red)
                        .frame(width: 12, height: 12)
                    Text(viewModel.isConnected ? "Connected" : "Disconnected")
                        .foregroundColor(.secondary)
                }
                
                // Current Track
                if let track = viewModel.currentTrack {
                    VStack {
                        Text(track.title)
                            .font(.title2)
                            .bold()
                        Text(track.artist)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                } else {
                    Text("No track playing")
                        .foregroundColor(.secondary)
                }
                
                // Cache Info
                Text("\(viewModel.cachedSongsCount) songs cached")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                // Manual Send Button
                Button(action: {
                    viewModel.sendCurrentTrackLyrics()
                }) {
                    Label("Send Lyrics to Tesla", systemImage: "paperplane.fill")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .disabled(!viewModel.isConnected)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Teslyrics")
            .onAppear {
                viewModel.startMonitoring()
            }
        }
    }
}

class TeslyricsViewModel: ObservableObject {
    @Published var isConnected = false
    @Published var currentTrack: (title: String, artist: String)?
    @Published var cachedSongsCount = 0
    
    private let client = TeslyricsClient()
    private let monitor = NowPlayingMonitor()
    
    func startMonitoring() {
        monitor.startMonitoring()
        checkConnection()
    }
    
    func checkConnection() {
        client.checkHealth { [weak self] isHealthy in
            DispatchQueue.main.async {
                self?.isConnected = isHealthy
                if isHealthy {
                    self?.updateCacheInfo()
                }
            }
        }
    }
    
    func updateCacheInfo() {
        client.getStatus { [weak self] result in
            if case .success(let status) = result {
                DispatchQueue.main.async {
                    self?.cachedSongsCount = status.cache.keys
                }
            }
        }
    }
    
    func sendCurrentTrackLyrics() {
        // Implementation to send current track lyrics
    }
}
```

## Best Practices

1. **Error Handling**: Always handle network errors gracefully
2. **User Permissions**: Request only necessary permissions
3. **Background Efficiency**: Minimize background activity to save battery
4. **Caching**: Cache lyrics locally before sending to reduce API calls
5. **Network Detection**: Check WiFi connection before attempting to send
6. **User Feedback**: Show clear status of sync operations

## Testing

Test your iOS app integration:

```swift
func testTeslyricsConnection() {
    let client = TeslyricsClient()
    
    client.checkHealth { isHealthy in
        XCTAssertTrue(isHealthy, "Server should be healthy")
    }
}

func testSendLyrics() {
    let client = TeslyricsClient()
    let expectation = XCTestExpectation(description: "Send lyrics")
    
    client.sendLyrics(
        trackId: "test123",
        artist: "Test Artist",
        title: "Test Song",
        lyrics: "Test lyrics content"
    ) { result in
        switch result {
        case .success(let response):
            XCTAssertTrue(response.success)
            expectation.fulfill()
        case .failure(let error):
            XCTFail("Failed to send lyrics: \(error)")
        }
    }
    
    wait(for: [expectation], timeout: 5.0)
}
```

## Troubleshooting

### Cannot connect to server
- Verify iOS device is connected to Teslyrics WiFi
- Check server IP address is correct
- Ensure firewall is not blocking port 3000

### Lyrics not appearing
- Verify lyrics are being sent successfully
- Check Tesla browser is at the correct URL
- Refresh the Tesla browser page

### Background sync not working
- Ensure background app refresh is enabled
- Check background task registration
- Verify network connection in background

## Resources

- [MusicKit Documentation](https://developer.apple.com/documentation/musickit)
- [BackgroundTasks Framework](https://developer.apple.com/documentation/backgroundtasks)
- [URLSession Guide](https://developer.apple.com/documentation/foundation/urlsession)
