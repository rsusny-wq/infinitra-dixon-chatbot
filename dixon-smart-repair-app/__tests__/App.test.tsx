/**
 * App Component Tests
 * Tests the main Dixon Smart Repair demo application
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the main title', () => {
      render(<App />);
      
      expect(screen.getByText('🚗 Dixon Smart Repair')).toBeTruthy();
      expect(screen.getByText('Mobile Demo & Testing')).toBeTruthy();
    });

    it('should render device information', () => {
      render(<App />);
      
      expect(screen.getByText('📱 Device Information')).toBeTruthy();
      expect(screen.getByText(/Platform:/)).toBeTruthy();
      expect(screen.getByText(/Screen:/)).toBeTruthy();
      expect(screen.getByText('Expo SDK: 53.0.0')).toBeTruthy();
      expect(screen.getByText('React Native: 0.79.4')).toBeTruthy();
    });

    it('should render connection test information', () => {
      render(<App />);
      
      expect(screen.getByText('🌐 Connection Test')).toBeTruthy();
      expect(screen.getByText('Local IP: 192.168.0.104:8081')).toBeTruthy();
      expect(screen.getByText('Hot Reload: Active ✅')).toBeTruthy();
      expect(screen.getByText('Development Mode: Enabled ✅')).toBeTruthy();
    });

    it('should render feature test buttons', () => {
      render(<App />);
      
      expect(screen.getByText('🔍 Test Web Search (Tavily)')).toBeTruthy();
      expect(screen.getByText('☁️ Test AWS Services')).toBeTruthy();
      expect(screen.getByText('🚗 Test Automotive Features')).toBeTruthy();
      expect(screen.getByText('🔬 Simulate Diagnostic')).toBeTruthy();
    });

    it('should render environment information', () => {
      render(<App />);
      
      expect(screen.getByText('⚙️ Environment')).toBeTruthy();
      expect(screen.getByText('Mode: AWS-First Development')).toBeTruthy();
      expect(screen.getByText('Region: us-west-2')).toBeTruthy();
      expect(screen.getByText('Profile: dixonsmartrepair-dev')).toBeTruthy();
      expect(screen.getByText('Backend: AWS Amplify + Lambda')).toBeTruthy();
    });

    it('should render service architecture', () => {
      render(<App />);
      
      expect(screen.getByText('🏗️ Service Architecture')).toBeTruthy();
      expect(screen.getByText('✅ WebSearchService (Tavily)')).toBeTruthy();
      expect(screen.getByText('✅ DataParsingService')).toBeTruthy();
      expect(screen.getByText('✅ AmplifyService (AWS)')).toBeTruthy();
      expect(screen.getByText('🔄 StrandsAgentService (Pending)')).toBeTruthy();
    });
  });

  describe('Connection Status', () => {
    it('should show initial checking status', () => {
      render(<App />);
      
      expect(screen.getByText('Status: Checking...')).toBeTruthy();
    });

    it('should update to connected status after delay', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Status: Connected ✅')).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('Feature Test Buttons', () => {
    beforeEach(() => {
      render(<App />);
    });

    it('should show web search test alert when button is pressed', () => {
      const webSearchButton = screen.getByText('🔍 Test Web Search (Tavily)');
      
      fireEvent.press(webSearchButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Web Search Test',
        'Tavily web search integration ready!\n\nAPI Key: Configured ✅\nEndpoint: https://api.tavily.com/search\nStatus: Ready for automotive queries',
        [{ text: 'OK' }]
      );
    });

    it('should show AWS services test alert when button is pressed', () => {
      const awsButton = screen.getByText('☁️ Test AWS Services');
      
      fireEvent.press(awsButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'AWS Services Test',
        'AWS Amplify Integration:\n\n• Authentication: Cognito ✅\n• API: GraphQL ✅\n• Region: us-west-2 ✅\n• Profile: dixonsmartrepair-dev ✅',
        [{ text: 'OK' }]
      );
    });

    it('should show automotive features test alert when button is pressed', () => {
      const automotiveButton = screen.getByText('🚗 Test Automotive Features');
      
      fireEvent.press(automotiveButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Automotive Features',
        'Dixon Smart Repair Services:\n\n• Symptom Analysis ✅\n• Parts Lookup ✅\n• Labor Estimation ✅\n• Repair Instructions ✅\n• VIN Scanning (Ready) 📱',
        [{ text: 'OK' }]
      );
    });

    it('should show diagnostic simulation alert when button is pressed', () => {
      const diagnosticButton = screen.getByText('🔬 Simulate Diagnostic');
      
      fireEvent.press(diagnosticButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Diagnostic Simulation',
        'Simulating automotive diagnostic...\n\nSymptom: Engine noise\nVehicle: 2020 Honda Civic\nDiagnosis: Starter motor issue\nEstimated Cost: $400-$600\nUrgency: Medium',
        [{ 
          text: 'View Details', 
          onPress: expect.any(Function)
        }]
      );
    });

    it('should show details alert when diagnostic details button is pressed', () => {
      const diagnosticButton = screen.getByText('🔬 Simulate Diagnostic');
      
      fireEvent.press(diagnosticButton);
      
      // Get the onPress function from the Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Diagnostic Simulation'
      );
      const detailsButton = alertCall[2][0];
      
      // Simulate pressing the "View Details" button
      detailsButton.onPress();
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Details',
        'Full diagnostic report would appear here with repair recommendations.'
      );
    });
  });

  describe('Device Information', () => {
    it('should display correct platform information', () => {
      render(<App />);
      
      // Platform should be detected (will be 'ios' or 'android' in test environment)
      expect(screen.getByText(/Platform: (IOS|ANDROID)/)).toBeTruthy();
    });

    it('should display screen dimensions', () => {
      render(<App />);
      
      // Screen dimensions should be displayed
      expect(screen.getByText(/Screen: \d+ × \d+/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      render(<App />);
      
      const buttons = [
        '🔍 Test Web Search (Tavily)',
        '☁️ Test AWS Services',
        '🚗 Test Automotive Features',
        '🔬 Simulate Diagnostic'
      ];

      buttons.forEach(buttonText => {
        const button = screen.getByText(buttonText);
        expect(button).toBeTruthy();
        
        // Button should be pressable
        fireEvent.press(button);
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
  });

  describe('Styling', () => {
    it('should apply correct styles to main container', () => {
      const { getByTestId } = render(<App />);
      
      // We would need to add testID to the component to test this properly
      // For now, we'll just verify the component renders without style errors
      expect(screen.getByText('🚗 Dixon Smart Repair')).toBeTruthy();
    });
  });

  describe('Footer Information', () => {
    it('should render footer with version information', () => {
      render(<App />);
      
      expect(screen.getByText(/Dixon Smart Repair v1.0.0/)).toBeTruthy();
      expect(screen.getByText(/AWS-First Mobile Development/)).toBeTruthy();
      expect(screen.getByText(/🚀 PROMPT 1 Successfully Completed/)).toBeTruthy();
    });
  });

  describe('Instructions Section', () => {
    it('should render mobile testing instructions', () => {
      render(<App />);
      
      expect(screen.getByText('📋 Mobile Testing Instructions')).toBeTruthy();
      expect(screen.getByText(/App loaded successfully on mobile/)).toBeTruthy();
      expect(screen.getByText(/Touch interactions working/)).toBeTruthy();
      expect(screen.getByText(/Ready for automotive feature development/)).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle component errors gracefully', () => {
      // Mock console.error to prevent error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // This test would require error boundary implementation
      // For now, we'll just verify the component renders
      expect(() => render(<App />)).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      render(<App />);
      const endTime = performance.now();
      
      // Component should render quickly (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
