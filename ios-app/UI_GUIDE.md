# iOS App UI Guide

This document describes the user interface of the Teslyrics iOS app.

## Main Screen Overview

The app consists of a single, scrollable screen with several sections:

```
┌─────────────────────────────────────┐
│         Teslyrics                   │  ← Header (Blue)
│      Tesla Lyrics Sync              │
├─────────────────────────────────────┤
│                                     │
│ ● Connected                         │  ← Connection Status
│ Last checked: 3:15:23 PM           │     (Green = Connected, Red = Disconnected)
│                                     │
├─────────────────────────────────────┤
│ Server Configuration                │
│                                     │
│ http://192.168.4.1:3000            │  ← Server URL
│ [Edit Server URL]                   │     (Tap to edit)
│ 15 songs cached                     │
│                                     │
├─────────────────────────────────────┤
│ Currently Playing                   │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Song Title Here             │    │  ← Track Info
│ │ Artist Name                 │    │     (Shows when music plays)
│ │ Album Name                  │    │
│ └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│ Manual Lyrics (Optional)            │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Paste lyrics here if not    │    │  ← Lyrics Input
│ │ automatically available...  │    │     (Multiline text field)
│ │                             │    │
│ │                             │    │
│ └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│ Auto-sync on track change  [ON]     │  ← Settings Toggle
│                                     │
│ [ Send Lyrics to Tesla ]            │  ← Primary Action Button
│                                     │     (Blue when enabled)
│ [ Start Auto-Monitoring ]           │  ← Monitoring Button
│                                     │     (Changes to "Stop" when active)
│ [ Test Connection ]                 │  ← Test Button
│                                     │
├─────────────────────────────────────┤
│ Instructions                        │
│                                     │
│ 1. Connect your iPhone to the      │  ← Help Text
│    Teslyrics WiFi network...       │     (Step-by-step guide)
│ 2. Make sure the server URL is...  │
│ ...                                 │
│                                     │
└─────────────────────────────────────┘
```

## Color Scheme

- **Header**: Blue (#2196F3)
- **Connected Status**: Green (#4CAF50)
- **Disconnected Status**: Red (#F44336)
- **Primary Buttons**: Blue (#2196F3) with white text
- **Secondary Buttons**: White with blue border and text
- **Background**: Light gray (#f5f5f5)
- **Sections**: White cards with subtle shadow

## UI Components Explained

### 1. Header
- **Purpose**: App branding
- **Content**: "Teslyrics" title and subtitle
- **Style**: Blue background, white text, prominent

### 2. Connection Status Section
- **Purpose**: Show server connectivity
- **Elements**:
  - Colored indicator dot (green/red)
  - Status text (Connected/Disconnected)
  - Last check timestamp
- **Updates**: Automatically every 10 seconds

### 3. Server Configuration Section
- **Purpose**: Configure server connection
- **Elements**:
  - Server URL display
  - "Edit Server URL" button
  - Cache count display
- **Functionality**: Tap button to edit, save updates URL

### 4. Currently Playing Section
- **Purpose**: Display active track info
- **Elements**:
  - Song title (bold, large)
  - Artist name (medium)
  - Album name (small, gray)
- **State**: Shows "No track playing" when empty

### 5. Manual Lyrics Section
- **Purpose**: Allow manual lyrics input
- **Elements**:
  - Multiline text input field
  - Placeholder text with instructions
- **Usage**: Paste lyrics from any source

### 6. Controls Section
- **Purpose**: Main app functionality
- **Elements**:
  - Auto-sync toggle switch
  - "Send Lyrics to Tesla" button
  - "Start/Stop Auto-Monitoring" button
  - "Test Connection" button
- **Behavior**: Buttons disabled when disconnected

### 7. Instructions Section
- **Purpose**: Help users get started
- **Content**: 6-step setup guide
- **Style**: Numbered list, gray text

## Button States

### Send Lyrics Button
- **Enabled**: Blue background, white text
- **Disabled**: Gray background (when disconnected)
- **Loading**: Shows spinner while sending
- **Success**: Shows alert "Lyrics sent to Tesla!"
- **Error**: Shows alert with error message

### Auto-Monitoring Button
- **Not Monitoring**: Blue, text "Start Auto-Monitoring"
- **Monitoring**: Red, text "Stop Auto-Monitoring"
- **Function**: Toggles track change detection

### Test Connection Button
- **Always**: Secondary style (white with blue border)
- **Function**: Manually checks server connectivity

## User Interactions

### Editing Server URL
1. Tap "Edit Server URL"
2. Text field appears with current URL
3. Edit URL
4. Tap "Save" to confirm or "Cancel" to abort
5. Connection automatically tested

### Sending Lyrics
1. Play song in Apple Music
2. Paste lyrics in text field
3. Tap "Send Lyrics to Tesla"
4. Wait for confirmation
5. Lyrics cached on server

### Auto-Monitoring
1. Enable "Auto-sync on track change" toggle
2. Tap "Start Auto-Monitoring"
3. App listens for track changes
4. When track changes, checks for available lyrics
5. Automatically sends if lyrics available

## Visual Feedback

### Loading States
- Spinner appears on "Send Lyrics" button while processing
- Connection status updates with timestamp

### Success States
- Alert dialog: "Success - Lyrics sent to Tesla!"
- Cache count increases

### Error States
- Alert dialog with error message
- Connection status turns red
- Detailed error in console (for debugging)

## Accessibility

- Large, tappable buttons (48pt minimum)
- Clear color contrast for text
- Status indicators use both color and text
- Form fields have clear labels
- Scrollable for smaller screens

## Responsive Design

- Adapts to iPhone screen sizes
- Scrollable content for all device sizes
- Safe area insets respected
- Keyboard avoidance for text fields

## Dark Mode

Not currently implemented, but designed to support:
- Would invert colors
- Keep accent colors (blue, green, red)
- Adjust text contrast

## Tips for Best UI Experience

1. **Connection Status**: Check green indicator before sending
2. **Server URL**: Only change if using custom server
3. **Lyrics Input**: Clear after successful send
4. **Auto-Sync**: Enable for hands-free operation
5. **Cache Count**: Monitor to see stored songs

## Common UI States

### Initial Launch
- Connection: Disconnected (red)
- Track: "No track playing"
- Lyrics: Empty
- Monitoring: Not active

### After Setup
- Connection: Connected (green)
- Track: Shows current song
- Lyrics: Ready for input
- Monitoring: Optional

### Active Use
- Connection: Connected (green)
- Track: Updates automatically
- Lyrics: User inputs as needed
- Monitoring: Can be active

---

For development details on the UI implementation, see `src/screens/MainScreen.tsx`.
