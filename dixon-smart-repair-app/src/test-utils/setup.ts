/**
 * Test Setup Configuration for Dixon Smart Repair
 * Configures Jest and React Native Testing Library for automotive testing
 */

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'dixon-smart-repair',
      slug: 'dixon-smart-repair',
    },
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

jest.mock('aws-amplify/auth', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
  signUp: jest.fn(),
}));

jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn(),
  })),
}));

jest.mock('aws-amplify/storage', () => ({
  uploadData: jest.fn(),
  getUrl: jest.fn(),
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock', () => ({
  BedrockClient: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
}));

// Mock React Native Camera
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      Aspect: {},
      BarCodeType: {},
      Type: { back: 'back', front: 'front' },
      CaptureMode: {},
      CaptureTarget: {},
      CaptureQuality: {},
      Orientation: {},
      FlashMode: {},
      TorchMode: {},
    },
  },
}));

// Mock QR Code Scanner
jest.mock('react-native-qrcode-scanner', () => 'QRCodeScanner');

// Mock Axios for web search testing
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: {} })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn(() => ({
    post: jest.fn(() => Promise.resolve({ data: {} })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
  })),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Global test utilities
global.fetch = jest.fn();

// Silence console warnings in tests unless explicitly testing them
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Custom matchers for automotive testing
expect.extend({
  toBeValidVIN(received: string) {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    const pass = vinRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid VIN`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid VIN (17 characters, no I, O, or Q)`,
        pass: false,
      };
    }
  },
  
  toBeValidPrice(received: number) {
    const pass = typeof received === 'number' && received > 0 && received < 100000;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid automotive price`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid automotive price (positive number under $100,000)`,
        pass: false,
      };
    }
  },
  
  toBeValidDiagnosticConfidence(received: number) {
    const pass = typeof received === 'number' && received >= 0 && received <= 1;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid diagnostic confidence`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid diagnostic confidence (0-1)`,
        pass: false,
      };
    }
  }
});

// Automotive test data factories
export const createMockVehicle = (overrides = {}) => ({
  id: 'test-vehicle-1',
  make: 'Honda',
  model: 'Civic',
  year: 2020,
  vin: '1HGBH41JXMN109186',
  mileage: 45000,
  ...overrides,
});

export const createMockDiagnostic = (overrides = {}) => ({
  id: 'test-diagnostic-1',
  symptoms: ['Engine noise', 'Hard to start'],
  diagnosis: 'Starter motor issue',
  confidence: 0.85,
  estimatedCost: 450,
  urgency: 'medium' as const,
  ...overrides,
});

export const createMockWebSearchResult = (overrides = {}) => ({
  title: 'Honda Civic Starter Motor Replacement',
  content: 'Starter motor replacement for 2020 Honda Civic costs between $400-$600',
  url: 'https://example.com/honda-civic-starter',
  relevanceScore: 0.9,
  source: 'example.com',
  ...overrides,
});

export const createMockPartInfo = (overrides = {}) => ({
  name: 'Starter Motor',
  price: {
    min: 400,
    max: 600,
    currency: 'USD',
  },
  brand: 'Denso',
  partNumber: 'DSN-SM-2020-HC',
  availability: 'in-stock' as const,
  source: 'autozone.com',
  confidence: 0.9,
  ...overrides,
});

// Test environment setup
process.env.NODE_ENV = 'test';
process.env.DEVELOPMENT_MODE = 'test';
process.env.TAVILY_WEB_SEARCH_API_KEY = 'test-api-key';

console.log('🧪 Dixon Smart Repair test environment configured');
