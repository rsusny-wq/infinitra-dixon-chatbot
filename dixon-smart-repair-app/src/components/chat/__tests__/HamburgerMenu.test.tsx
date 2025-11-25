/**
 * HamburgerMenu Component Tests
 * Tests automotive-specific navigation menu with ChatGPT-style behavior
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import HamburgerMenu from '../HamburgerMenu';

// Mock React Navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    },
  };
});

describe('HamburgerMenu', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    currentSection: 'chat_history' as const,
    onSectionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<HamburgerMenu {...defaultProps} />);
      
      expect(screen.getByTestId('hamburger-menu')).toBeTruthy();
      expect(screen.getByText('Dixon Smart Repair')).toBeTruthy();
    });

    it('should not render when closed', () => {
      const closedProps = { ...defaultProps, isOpen: false };
      render(<HamburgerMenu {...closedProps} />);
      
      expect(screen.queryByTestId('hamburger-menu')).toBeNull();
    });

    it('should render all automotive menu sections', () => {
      render(<HamburgerMenu {...defaultProps} />);
      
      expect(screen.getByText('Chat History')).toBeTruthy();
      expect(screen.getByText('Past Invoices')).toBeTruthy();
      expect(screen.getByText('Service History')).toBeTruthy();
      expect(screen.getByText('My Vehicles')).toBeTruthy();
      expect(screen.getByText('Preferred Mechanics')).toBeTruthy();
      expect(screen.getByText('Maintenance Reminders')).toBeTruthy();
      expect(screen.getByText('Settings')).toBeTruthy();
    });

    it('should highlight current section', () => {
      render(<HamburgerMenu {...defaultProps} currentSection="my_vehicles" />);
      
      const myVehiclesSection = screen.getByTestId('menu-section-my_vehicles');
      expect(myVehiclesSection.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: expect.any(String),
        })
      );
    });
  });

  describe('Navigation', () => {
    it('should call onSectionChange when section is selected', () => {
      const onSectionChangeMock = jest.fn();
      const props = { ...defaultProps, onSectionChange: onSectionChangeMock };

      render(<HamburgerMenu {...props} />);
      
      const serviceHistorySection = screen.getByText('Service History');
      fireEvent.press(serviceHistorySection);
      
      expect(onSectionChangeMock).toHaveBeenCalledWith('service_history');
    });

    it('should navigate to appropriate screens for each section', () => {
      render(<HamburgerMenu {...defaultProps} />);
      
      // Test navigation for different sections
      const sectionsToTest = [
        { text: 'Past Invoices', expectedRoute: 'Invoices' },
        { text: 'My Vehicles', expectedRoute: 'Vehicles' },
        { text: 'Preferred Mechanics', expectedRoute: 'Mechanics' },
        { text: 'Settings', expectedRoute: 'Settings' },
      ];

      sectionsToTest.forEach(({ text, expectedRoute }) => {
        fireEvent.press(screen.getByText(text));
        expect(mockNavigation.navigate).toHaveBeenCalledWith(expectedRoute);
      });
    });

    it('should close menu after section selection', () => {
      const onCloseMock = jest.fn();
      const props = { ...defaultProps, onClose: onCloseMock };

      render(<HamburgerMenu {...props} />);
      
      const chatHistorySection = screen.getByText('Chat History');
      fireEvent.press(chatHistorySection);
      
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('Menu Sections Content', () => {
    it('should show chat history section with recent conversations', () => {
      render(<HamburgerMenu {...defaultProps} currentSection="chat_history" />);
      
      expect(screen.getByText('Recent Conversations')).toBeTruthy();
      expect(screen.getByText('Engine Diagnostic - Honda Civic')).toBeTruthy();
      expect(screen.getByText('Brake Inspection - Toyota Camry')).toBeTruthy();
    });

    it('should show past invoices section with invoice list', () => {
      render(<HamburgerMenu {...defaultProps} currentSection="past_invoices" />);
      
      expect(screen.getByText('Recent Invoices')).toBeTruthy();
      expect(screen.getByText('Invoice #2024-001')).toBeTruthy();
      expect(screen.getByText('$450.00')).toBeTruthy();
    });

    it('should show service history with maintenance records', () => {
      render(<HamburgerMenu {...defaultProps} currentSection="service_history" />);
      
      expect(screen.getByText('Service Records')).toBeTruthy();
      expect(screen.getByText('Oil Change - 01/15/2024')).toBeTruthy();
      expect(screen.getByText('Brake Service - 12/10/2023')).toBeTruthy();
    });

    it('should show my vehicles section with vehicle list', () => {
      render(<HamburgerMenu {...defaultProps} currentSection="my_vehicles" />);
      
      expect(screen.getByText('Your Vehicles')).toBeTruthy();
      expect(screen.getByText('2020 Honda Civic')).toBeTruthy();
      expect(screen.getByText('VIN: 1HGBH41JXMN109186')).toBeTruthy();
    });

    it('should show preferred mechanics section', () => {
      render(<HamburgerMenu {...defaultProps} currentSection="preferred_mechanics" />);
      
      expect(screen.getByText('Preferred Mechanics')).toBeTruthy();
      expect(screen.getByText('AutoCare Plus')).toBeTruthy();
      expect(screen.getByText('4.8 ⭐ (127 reviews)')).toBeTruthy();
    });

    it('should show maintenance reminders section', () => {
      render(<HamburgerMenu {...defaultProps} currentSection="maintenance_reminders" />);
      
      expect(screen.getByText('Upcoming Maintenance')).toBeTruthy();
      expect(screen.getByText('Oil Change Due')).toBeTruthy();
      expect(screen.getByText('Due in 500 miles')).toBeTruthy();
    });
  });

  describe('Animations', () => {
    it('should animate menu opening', () => {
      const { rerender } = render(<HamburgerMenu {...defaultProps} isOpen={false} />);
      
      rerender(<HamburgerMenu {...defaultProps} isOpen={true} />);
      
      // Animation should be triggered
      expect(require('react-native').Animated.timing).toHaveBeenCalled();
    });

    it('should animate menu closing', () => {
      const { rerender } = render(<HamburgerMenu {...defaultProps} isOpen={true} />);
      
      rerender(<HamburgerMenu {...defaultProps} isOpen={false} />);
      
      // Animation should be triggered
      expect(require('react-native').Animated.timing).toHaveBeenCalled();
    });
  });

  describe('Gestures', () => {
    it('should close menu when backdrop is pressed', () => {
      const onCloseMock = jest.fn();
      const props = { ...defaultProps, onClose: onCloseMock };

      render(<HamburgerMenu {...props} />);
      
      const backdrop = screen.getByTestId('menu-backdrop');
      fireEvent.press(backdrop);
      
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('should support swipe to close gesture', () => {
      const onCloseMock = jest.fn();
      const props = { ...defaultProps, onClose: onCloseMock };

      render(<HamburgerMenu {...props} />);
      
      const menuContainer = screen.getByTestId('hamburger-menu');
      
      // Simulate swipe left gesture
      fireEvent(menuContainer, 'onSwipeLeft');
      
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for menu sections', () => {
      render(<HamburgerMenu {...defaultProps} />);
      
      expect(screen.getByLabelText('Navigate to Chat History')).toBeTruthy();
      expect(screen.getByLabelText('Navigate to Past Invoices')).toBeTruthy();
      expect(screen.getByLabelText('Navigate to Service History')).toBeTruthy();
      expect(screen.getByLabelText('Navigate to My Vehicles')).toBeTruthy();
      expect(screen.getByLabelText('Navigate to Preferred Mechanics')).toBeTruthy();
      expect(screen.getByLabelText('Navigate to Maintenance Reminders')).toBeTruthy();
      expect(screen.getByLabelText('Navigate to Settings')).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      render(<HamburgerMenu {...defaultProps} />);
      
      const firstSection = screen.getByTestId('menu-section-chat_history');
      expect(firstSection.props.accessible).toBe(true);
      expect(firstSection.props.accessibilityRole).toBe('button');
    });

    it('should announce current section to screen readers', () => {
      render(<HamburgerMenu {...defaultProps} currentSection="my_vehicles" />);
      
      const currentSection = screen.getByTestId('menu-section-my_vehicles');
      expect(currentSection.props.accessibilityState).toEqual({
        selected: true,
      });
    });
  });

  describe('Dark/Light Mode', () => {
    it('should apply dark theme styles when in dark mode', () => {
      // Mock theme context
      const mockTheme = { isDark: true };
      jest.doMock('../../../contexts/ThemeContext', () => ({
        useTheme: () => mockTheme,
      }));

      render(<HamburgerMenu {...defaultProps} />);
      
      const menuContainer = screen.getByTestId('hamburger-menu');
      expect(menuContainer.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/#[0-9a-f]{6}/i), // Dark color
        })
      );
    });

    it('should apply light theme styles when in light mode', () => {
      // Mock theme context
      const mockTheme = { isDark: false };
      jest.doMock('../../../contexts/ThemeContext', () => ({
        useTheme: () => mockTheme,
      }));

      render(<HamburgerMenu {...defaultProps} />);
      
      const menuContainer = screen.getByTestId('hamburger-menu');
      expect(menuContainer.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/#[0-9a-f]{6}/i), // Light color
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', () => {
      mockNavigation.navigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      render(<HamburgerMenu {...defaultProps} />);
      
      const settingsSection = screen.getByText('Settings');
      
      // Should not crash when navigation fails
      expect(() => fireEvent.press(settingsSection)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many menu items', () => {
      const startTime = performance.now();
      render(<HamburgerMenu {...defaultProps} />);
      const endTime = performance.now();
      
      // Should render quickly (under 50ms)
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
