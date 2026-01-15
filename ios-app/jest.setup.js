/**
 * Jest setup file for mocking native modules
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock NativeEventEmitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.AppleMusicModule = {
    requestAuthorization: jest.fn(() => Promise.resolve({ authorized: true })),
    getCurrentTrack: jest.fn(() => Promise.resolve(null)),
    getPlaybackState: jest.fn(() => Promise.resolve({ state: 'stopped' })),
    startMonitoring: jest.fn(() => Promise.resolve({ monitoring: true })),
    stopMonitoring: jest.fn(() => Promise.resolve({ monitoring: false })),
  };
  return RN;
});
