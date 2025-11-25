/**
 * MessageBubble Component Tests
 * Tests message display with automotive context and diagnostic information
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import MessageBubble from '../MessageBubble';
import { createMockVehicle } from '../../../test-utils/setup';

describe('MessageBubble', () => {
  const mockVehicle = createMockVehicle();

  const baseMessage = {
    id: 'msg-1',
    content: 'Test message content',
    type: 'user' as const,
    timestamp: new Date('2024-01-01T10:00:00Z'),
  };

  const aiMessageWithContext = {
    id: 'msg-2',
    content: 'Based on your symptoms, this appears to be a starter motor issue.',
    type: 'ai' as const,
    timestamp: new Date('2024-01-01T10:00:30Z'),
    automotiveContext: {
      vehicleInfo: mockVehicle,
      diagnosticConfidence: 0.85,
      toolsUsed: ['symptom_diagnosis_analyzer', 'parts_availability_lookup'],
      repairRecommendations: [
        {
          name: 'Replace Starter Motor',
          estimatedCost: 450,
          urgency: 'medium',
          description: 'Starter motor replacement for 2020 Honda Civic',
        },
      ],
    },
  };

  describe('Basic Rendering', () => {
    it('should render user message correctly', () => {
      render(<MessageBubble message={baseMessage} />);
      
      expect(screen.getByText('Test message content')).toBeTruthy();
      expect(screen.getByTestId('message-bubble-user')).toBeTruthy();
    });

    it('should render AI message correctly', () => {
      const aiMessage = { ...baseMessage, type: 'ai' as const };
      render(<MessageBubble message={aiMessage} />);
      
      expect(screen.getByText('Test message content')).toBeTruthy();
      expect(screen.getByTestId('message-bubble-ai')).toBeTruthy();
    });

    it('should render system message correctly', () => {
      const systemMessage = { 
        ...baseMessage, 
        type: 'system' as const,
        content: 'Vehicle information updated'
      };
      render(<MessageBubble message={systemMessage} />);
      
      expect(screen.getByText('Vehicle information updated')).toBeTruthy();
      expect(screen.getByTestId('message-bubble-system')).toBeTruthy();
    });

    it('should apply different styles for different message types', () => {
      const { rerender } = render(<MessageBubble message={baseMessage} />);
      const userBubble = screen.getByTestId('message-bubble-user');
      
      const aiMessage = { ...baseMessage, type: 'ai' as const };
      rerender(<MessageBubble message={aiMessage} />);
      const aiBubble = screen.getByTestId('message-bubble-ai');
      
      // User and AI bubbles should have different styles
      expect(userBubble.props.style).not.toEqual(aiBubble.props.style);
    });
  });

  describe('Timestamp Display', () => {
    it('should show timestamp when showTimestamp is true', () => {
      render(<MessageBubble message={baseMessage} showTimestamp={true} />);
      
      expect(screen.getByText('10:00 AM')).toBeTruthy();
    });

    it('should hide timestamp when showTimestamp is false', () => {
      render(<MessageBubble message={baseMessage} showTimestamp={false} />);
      
      expect(screen.queryByText('10:00 AM')).toBeNull();
    });

    it('should toggle timestamp visibility when message is pressed', () => {
      const onTimestampToggleMock = jest.fn();
      render(
        <MessageBubble 
          message={baseMessage} 
          onTimestampToggle={onTimestampToggleMock}
        />
      );
      
      const messageBubble = screen.getByTestId('message-bubble-user');
      fireEvent.press(messageBubble);
      
      expect(onTimestampToggleMock).toHaveBeenCalled();
    });

    it('should format timestamp correctly for different times', () => {
      const morningMessage = { 
        ...baseMessage, 
        timestamp: new Date('2024-01-01T09:30:00Z') 
      };
      const { rerender } = render(
        <MessageBubble message={morningMessage} showTimestamp={true} />
      );
      expect(screen.getByText('9:30 AM')).toBeTruthy();

      const eveningMessage = { 
        ...baseMessage, 
        timestamp: new Date('2024-01-01T21:45:00Z') 
      };
      rerender(<MessageBubble message={eveningMessage} showTimestamp={true} />);
      expect(screen.getByText('9:45 PM')).toBeTruthy();
    });
  });

  describe('Automotive Context', () => {
    it('should display diagnostic confidence when available', () => {
      render(<MessageBubble message={aiMessageWithContext} />);
      
      expect(screen.getByText('Confidence: 85%')).toBeTruthy();
    });

    it('should display tools used information', () => {
      render(<MessageBubble message={aiMessageWithContext} />);
      
      expect(screen.getByText('Tools Used: 2')).toBeTruthy();
      expect(screen.getByTestId('tools-used-indicator')).toBeTruthy();
    });

    it('should show vehicle information when present', () => {
      render(<MessageBubble message={aiMessageWithContext} />);
      
      expect(screen.getByText('2020 Honda Civic')).toBeTruthy();
      expect(screen.getByText('VIN: 1HGBH41JXMN109186')).toBeTruthy();
    });

    it('should display repair recommendations', () => {
      render(<MessageBubble message={aiMessageWithContext} />);
      
      expect(screen.getByText('Replace Starter Motor')).toBeTruthy();
      expect(screen.getByText('$450')).toBeTruthy();
      expect(screen.getByText('Medium Priority')).toBeTruthy();
    });

    it('should handle missing automotive context gracefully', () => {
      const messageWithoutContext = { ...baseMessage, type: 'ai' as const };
      render(<MessageBubble message={messageWithoutContext} />);
      
      expect(screen.queryByText('Confidence:')).toBeNull();
      expect(screen.queryByText('Tools Used:')).toBeNull();
    });
  });

  describe('Attachments', () => {
    it('should display image attachments', () => {
      const messageWithImage = {
        ...baseMessage,
        attachments: [
          {
            id: 'att-1',
            type: 'image',
            uri: 'file://engine-photo.jpg',
            name: 'engine-photo.jpg',
          },
        ],
      };

      render(<MessageBubble message={messageWithImage} />);
      
      expect(screen.getByTestId('attachment-image')).toBeTruthy();
      expect(screen.getByText('engine-photo.jpg')).toBeTruthy();
    });

    it('should display document attachments', () => {
      const messageWithDocument = {
        ...baseMessage,
        attachments: [
          {
            id: 'att-2',
            type: 'document',
            uri: 'file://service-record.pdf',
            name: 'service-record.pdf',
          },
        ],
      };

      render(<MessageBubble message={messageWithDocument} />);
      
      expect(screen.getByTestId('attachment-document')).toBeTruthy();
      expect(screen.getByText('service-record.pdf')).toBeTruthy();
    });

    it('should handle multiple attachments', () => {
      const messageWithMultipleAttachments = {
        ...baseMessage,
        attachments: [
          {
            id: 'att-1',
            type: 'image',
            uri: 'file://photo1.jpg',
            name: 'photo1.jpg',
          },
          {
            id: 'att-2',
            type: 'image',
            uri: 'file://photo2.jpg',
            name: 'photo2.jpg',
          },
        ],
      };

      render(<MessageBubble message={messageWithMultipleAttachments} />);
      
      expect(screen.getByText('photo1.jpg')).toBeTruthy();
      expect(screen.getByText('photo2.jpg')).toBeTruthy();
      expect(screen.getAllByTestId('attachment-image')).toHaveLength(2);
    });
  });

  describe('Confidence Indicators', () => {
    it('should show high confidence with green indicator', () => {
      const highConfidenceMessage = {
        ...aiMessageWithContext,
        automotiveContext: {
          ...aiMessageWithContext.automotiveContext!,
          diagnosticConfidence: 0.95,
        },
      };

      render(<MessageBubble message={highConfidenceMessage} />);
      
      const confidenceIndicator = screen.getByTestId('confidence-indicator');
      expect(confidenceIndicator.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/green/i),
        })
      );
    });

    it('should show medium confidence with yellow indicator', () => {
      const mediumConfidenceMessage = {
        ...aiMessageWithContext,
        automotiveContext: {
          ...aiMessageWithContext.automotiveContext!,
          diagnosticConfidence: 0.65,
        },
      };

      render(<MessageBubble message={mediumConfidenceMessage} />);
      
      const confidenceIndicator = screen.getByTestId('confidence-indicator');
      expect(confidenceIndicator.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/yellow|orange/i),
        })
      );
    });

    it('should show low confidence with red indicator', () => {
      const lowConfidenceMessage = {
        ...aiMessageWithContext,
        automotiveContext: {
          ...aiMessageWithContext.automotiveContext!,
          diagnosticConfidence: 0.35,
        },
      };

      render(<MessageBubble message={lowConfidenceMessage} />);
      
      const confidenceIndicator = screen.getByTestId('confidence-indicator');
      expect(confidenceIndicator.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/red/i),
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<MessageBubble message={baseMessage} />);
      
      expect(screen.getByLabelText('User message: Test message content')).toBeTruthy();
    });

    it('should include automotive context in accessibility description', () => {
      render(<MessageBubble message={aiMessageWithContext} />);
      
      expect(screen.getByLabelText(
        expect.stringContaining('AI message with 85% confidence')
      )).toBeTruthy();
    });

    it('should support screen reader navigation for attachments', () => {
      const messageWithImage = {
        ...baseMessage,
        attachments: [
          {
            id: 'att-1',
            type: 'image',
            uri: 'file://engine-photo.jpg',
            name: 'engine-photo.jpg',
          },
        ],
      };

      render(<MessageBubble message={messageWithImage} />);
      
      expect(screen.getByLabelText('Image attachment: engine-photo.jpg')).toBeTruthy();
    });
  });

  describe('Long Content Handling', () => {
    it('should handle long message content', () => {
      const longMessage = {
        ...baseMessage,
        content: 'This is a very long message that contains detailed diagnostic information about the vehicle issue including multiple symptoms, potential causes, recommended repairs, and estimated costs for the work that needs to be performed on the vehicle.',
      };

      render(<MessageBubble message={longMessage} />);
      
      expect(screen.getByText(longMessage.content)).toBeTruthy();
    });

    it('should support text selection for long content', () => {
      const longMessage = {
        ...baseMessage,
        content: 'This is a long diagnostic message that users might want to copy.',
      };

      render(<MessageBubble message={longMessage} />);
      
      const messageText = screen.getByText(longMessage.content);
      expect(messageText.props.selectable).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed automotive context', () => {
      const messageWithBadContext = {
        ...baseMessage,
        type: 'ai' as const,
        automotiveContext: {
          diagnosticConfidence: 'invalid' as any,
          toolsUsed: null as any,
        },
      };

      expect(() => render(<MessageBubble message={messageWithBadContext} />)).not.toThrow();
    });

    it('should handle missing message content', () => {
      const messageWithoutContent = {
        ...baseMessage,
        content: '',
      };

      render(<MessageBubble message={messageWithoutContent} />);
      
      expect(screen.getByTestId('message-bubble-user')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with complex automotive context', () => {
      const startTime = performance.now();
      render(<MessageBubble message={aiMessageWithContext} />);
      const endTime = performance.now();
      
      // Should render quickly (under 50ms)
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
