// Mock Capacitor for testing
global.Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web'
};

// Mock window.speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: () => {},
    cancel: () => {},
    getVoices: () => []
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});