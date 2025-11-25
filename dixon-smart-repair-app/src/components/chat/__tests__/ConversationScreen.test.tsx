/**
 * ConversationScreen Component Tests
 * Tests ChatGPT-style conversation interface with automotive context
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import ConversationScreen from '../ConversationScreen';
import { createMockVehicle, createMockDiagnostic } from '../../../test-utils/setup';

// Mock Zustand store
const mockUseConversationStore = jest.fn();
jest.mock('../../../stores/conversationStore', () => ({
  useConversationStore: () => mockUseConversationStore(),
}));

// Mock React Navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: jest.fn(),
}));

describe('ConversationScreen', () => {
  const mockVehicle = createMockVehicle();
  const mockDiagnostic = createMockDiagnostic();

  const defaultStoreState = {
    messages: [],
    isTyping: false,
    attachments: [],
    currentVehicle: null,
    diagnosticContext: null,
    sendMessage: jest.fn(),
    addAttachment: jest.fn(),
    setCurrentVehicle: jest.fn(),
    clearConversation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConversationStore.mockReturnValue(defaultStoreState);
  });

  describe('Rendering', () => {
    it('should render conversation screen with empty state', () => {
      render(<ConversationScreen />);
      
      expect(screen.getByText('Dixon Smart Repair')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ask about your vehicle...')).toBeTruthy();
      expect(screen.getByTestId('message-input')).toBeTruthy();
      expect(screen.getByTestId('send-button')).toBeTruthy();
    });

    it('should render with vehicle context when provided', () => {
      const props = {
        vehicleContext: mockVehicle,
      };

      render(<ConversationScreen {...props} />);
      
      expect(screen.getByText(`${mockVehicle.year} ${mockVehicle.make} ${mockVehicle.model}`)).toBeTruthy();
      expect(screen.getByText(`VIN: ${mockVehicle.vin}`)).toBeTruthy();
    });

    it('should render messages when conversation has history', () => {
      const messagesState = {
        ...defaultStoreState,
        messages: [
          {
            id: '1',
            content: 'My car is making a strange noise',
            type: 'user' as const,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
          {
            id: '2',
            content: 'I can help diagnose that issue. Can you describe the noise?',
            type: 'ai' as const,
            timestamp: new Date('2024-01-01T10:00:30Z'),
            automotiveContext: {
              diagnosticConfidence: 0.8,
              toolsUsed: ['symptom_diagnosis_analyzer'],
            },
          },
        ],
      };

      mockUseConversationStore.mockReturnValue(messagesState);

      render(<ConversationScreen />);
      
      expect(screen.getByText('My car is making a strange noise')).toBeTruthy();
      expect(screen.getByText('I can help diagnose that issue. Can you describe the noise?')).toBeTruthy();
    });

    it('should show typing indicator when AI is responding', () => {
      const typingState = {
        ...defaultStoreState,
        isTyping: true,
      };

      mockUseConversationStore.mockReturnValue(typingState);

      render(<ConversationScreen />);
      
      expect(screen.getByTestId('typing-indicator')).toBeTruthy();
      expect(screen.getByText('Dixon Smart Repair is typing...')).toBeTruthy();
    });
  });

  describe('Message Input', () => {
    it('should handle text input changes', () => {
      render(<ConversationScreen />);
      
      const input = screen.getByTestId('message-input');
      fireEvent.changeText(input, 'Test message');
      
      expect(input.props.value).toBe('Test message');
    });

    it('should send message when send button is pressed', async () => {
      const sendMessageMock = jest.fn();
      const stateWithSendMessage = {
        ...defaultStoreState,
        sendMessage: sendMessageMock,
      };

      mockUseConversationStore.mockReturnValue(stateWithSendMessage);

      render(<ConversationScreen />);
      
      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      fireEvent.changeText(input, 'Test diagnostic message');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(sendMessageMock).toHaveBeenCalledWith('Test diagnostic message');
      });
    });

    it('should clear input after sending message', async () => {
      const sendMessageMock = jest.fn();
      const stateWithSendMessage = {
        ...defaultStoreState,
        sendMessage: sendMessageMock,
      };

      mockUseConversationStore.mockReturnValue(stateWithSendMessage);

      render(<ConversationScreen />);
      
      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      fireEvent.changeText(input, 'Test message');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });

    it('should not send empty messages', () => {
      const sendMessageMock = jest.fn();
      const stateWithSendMessage = {
        ...defaultStoreState,
        sendMessage: sendMessageMock,
      };

      mockUseConversationStore.mockReturnValue(stateWithSendMessage);

      render(<ConversationScreen />);
      
      const sendButton = screen.getByTestId('send-button');
      fireEvent.press(sendButton);
      
      expect(sendMessageMock).not.toHaveBeenCalled();
    });
  });

  describe('Attachment Handling', () => {
    it('should show attachment button', () => {
      render(<ConversationScreen />);
      
      expect(screen.getByTestId('attachment-button')).toBeTruthy();
    });

    it('should open attachment options when attachment button is pressed', () => {
      render(<ConversationScreen />);
      
      const attachmentButton = screen.getByTestId('attachment-button');
      fireEvent.press(attachmentButton);
      
      expect(screen.getByText('Take Photo')).toBeTruthy();
      expect(screen.getByText('Choose from Gallery')).toBeTruthy();
      expect(screen.getByText('Upload Document')).toBeTruthy();
    });

    it('should display attachments when present', () => {
      const stateWithAttachments = {
        ...defaultStoreState,
        attachments: [
          {
            id: '1',
            type: 'image',
            uri: 'file://test-image.jpg',
            name: 'engine-photo.jpg',
          },
        ],
      };

      mockUseConversationStore.mockReturnValue(stateWithAttachments);

      render(<ConversationScreen />);
      
      expect(screen.getByText('engine-photo.jpg')).toBeTruthy();
      expect(screen.getByTestId('attachment-preview')).toBeTruthy();
    });
  });

  describe('Vehicle Context', () => {
    it('should call onVehicleSelect when vehicle is selected', () => {
      const onVehicleSelectMock = jest.fn();
      const props = {
        onVehicleSelect: onVehicleSelectMock,
      };

      render(<ConversationScreen {...props} />);
      
      const vehicleSelector = screen.getByTestId('vehicle-selector');
      fireEvent.press(vehicleSelector);
      
      // Simulate selecting a vehicle
      const vehicleOption = screen.getByText(`${mockVehicle.year} ${mockVehicle.make} ${mockVehicle.model}`);
      fireEvent.press(vehicleOption);
      
      expect(onVehicleSelectMock).toHaveBeenCalledWith(mockVehicle);
    });

    it('should update conversation context when vehicle changes', () => {
      const setCurrentVehicleMock = jest.fn();
      const stateWithVehicleUpdate = {
        ...defaultStoreState,
        setCurrentVehicle: setCurrentVehicleMock,
      };

      mockUseConversationStore.mockReturnValue(stateWithVehicleUpdate);

      const props = {
        vehicleContext: mockVehicle,
      };

      render(<ConversationScreen {...props} />);
      
      expect(setCurrentVehicleMock).toHaveBeenCalledWith(mockVehicle);
    });
  });

  describe('Diagnostic Context', () => {
    it('should display diagnostic confidence when available', () => {
      const stateWithDiagnostic = {
        ...defaultStoreState,
        diagnosticContext: mockDiagnostic,
        messages: [
          {
            id: '1',
            content: 'Based on your symptoms, this appears to be a starter motor issue.',
            type: 'ai' as const,
            timestamp: new Date(),
            automotiveContext: {
              diagnosticConfidence: 0.85,
              toolsUsed: ['symptom_diagnosis_analyzer', 'parts_availability_lookup'],
            },
          },
        ],
      };

      mockUseConversationStore.mockReturnValue(stateWithDiagnostic);

      render(<ConversationScreen />);
      
      expect(screen.getByText('Confidence: 85%')).toBeTruthy();
      expect(screen.getByText('Tools Used: 2')).toBeTruthy();
    });

    it('should show repair recommendations when available', () => {
      const stateWithRecommendations = {
        ...defaultStoreState,
        messages: [
          {
            id: '1',
            content: 'Here are the recommended repairs:',
            type: 'ai' as const,
            timestamp: new Date(),
            automotiveContext: {
              repairRecommendations: [
                {
                  name: 'Replace Starter Motor',
                  estimatedCost: 450,
                  urgency: 'medium',
                  description: 'Starter motor replacement for 2020 Honda Civic',
                },
              ],
            },
          },
        ],
      };

      mockUseConversationStore.mockReturnValue(stateWithRecommendations);

      render(<ConversationScreen />);
      
      expect(screen.getByText('Replace Starter Motor')).toBeTruthy();
      expect(screen.getByText('$450')).toBeTruthy();
      expect(screen.getByText('Medium Priority')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<ConversationScreen />);
      
      expect(screen.getByLabelText('Message input field')).toBeTruthy();
      expect(screen.getByLabelText('Send message')).toBeTruthy();
      expect(screen.getByLabelText('Add attachment')).toBeTruthy();
    });

    it('should support screen reader navigation', () => {
      const stateWithMessages = {
        ...defaultStoreState,
        messages: [
          {
            id: '1',
            content: 'Test message',
            type: 'user' as const,
            timestamp: new Date(),
          },
        ],
      };

      mockUseConversationStore.mockReturnValue(stateWithMessages);

      render(<ConversationScreen />);
      
      expect(screen.getByLabelText('User message: Test message')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle large message lists efficiently', () => {
      const largeMessageList = Array.from({ length: 100 }, (_, index) => ({
        id: `msg-${index}`,
        content: `Message ${index}`,
        type: 'user' as const,
        timestamp: new Date(),
      }));

      const stateWithManyMessages = {
        ...defaultStoreState,
        messages: largeMessageList,
      };

      mockUseConversationStore.mockReturnValue(stateWithManyMessages);

      const startTime = performance.now();
      render(<ConversationScreen />);
      const endTime = performance.now();
      
      // Should render efficiently (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle message sending errors gracefully', async () => {
      const sendMessageMock = jest.fn().mockRejectedValue(new Error('Network error'));
      const stateWithErrorHandling = {
        ...defaultStoreState,
        sendMessage: sendMessageMock,
      };

      mockUseConversationStore.mockReturnValue(stateWithErrorHandling);

      render(<ConversationScreen />);
      
      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      fireEvent.changeText(input, 'Test message');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to send message. Please try again.')).toBeTruthy();
      });
    });
  });
});
