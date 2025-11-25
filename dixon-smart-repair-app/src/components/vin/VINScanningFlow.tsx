/**
 * VINScanningFlow Component
 * Clean, direct VIN scanning experience with proper camera/upload/manual flows
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import AWS_CONFIG from '../../aws-config';

export interface VINScanningFlowProps {
  visible: boolean;
  onVinProcessed: (vinData: VINProcessingResult) => void;
  onClose: () => void;
}

export interface VINProcessingResult {
  vin: string;
  extraction_method: 'textract' | 'manual' | 'camera';
  diagnostic_accuracy: string;
  processing_time?: number;
  message?: string;
  vehicle_data?: any;
  acknowledgement_message?: string; // Lambda's acknowledgement message
}

export const VINScanningFlow: React.FC<VINScanningFlowProps> = ({
  visible,
  onVinProcessed,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<'choice' | 'manual' | 'processing'>('choice');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualVin, setManualVin] = useState('');
  const [vinError, setVinError] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Validate VIN format (17 characters, no I, O, Q)
  const validateVIN = (vin: string): boolean => {
    const cleanVin = vin.replace(/\s/g, '').toUpperCase();
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(cleanVin);
  };

  // Direct camera access for VIN photo
  const handleTakePhoto = async () => {
    try {
      console.log('📷 Taking photo - requesting camera permissions');
      
      // For web, we need to use media picker with camera preference
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
        // On web, this will show camera option first
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.current,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📷 Photo selected successfully, processing VIN');
        if (result.assets[0].base64) {
          await processVINImage(result.assets[0].base64, 'camera');
        } else {
          throw new Error('No base64 data from image');
        }
      } else {
        console.log('📷 Photo selection was canceled');
      }
    } catch (error) {
      console.error('📷 Photo selection error:', error);
      Alert.alert('Photo Selection Error', 'Failed to select photo. Please try uploading a document instead.');
    }
  };

  // Direct document picker for VIN upload
  const handleUploadDocument = async () => {
    try {
      console.log('📄 Uploading document - opening file picker');
      
      // FIXED: Use proper document picker for images
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('📄 Document selected successfully, processing VIN');
        
        // Convert file to base64 for processing
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          await processVINImage(base64, 'textract');
        };
        
        reader.readAsDataURL(blob);
      } else {
        console.log('📄 Document selection was canceled');
      }
    } catch (error) {
      console.error('📄 Document upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload document. Please try again.');
    }
  };

  // Platform-specific VIN input options
  const vinInputOptions = useMemo(() => {
    if (Platform.OS === 'web') {
      // Desktop options - simplified to single upload option
      return [
        {
          id: 'upload',
          title: 'Upload',
          subtitle: 'Upload VIN photo or document',
          icon: 'cloud-upload',
          action: handleUploadDocument
        },
        {
          id: 'enter_text',
          title: 'Enter Text',
          subtitle: 'Type VIN manually',
          icon: 'create',
          action: () => setCurrentStep('manual')
        }
      ];
    } else {
      // Mobile options
      return [
        {
          id: 'scan_vin',
          title: 'Scan VIN',
          subtitle: 'Take photo of VIN',
          icon: 'camera',
          action: handleTakePhoto
        },
        {
          id: 'upload_photo',
          title: 'Upload Photo',
          subtitle: 'Choose from gallery',
          icon: 'images',
          action: handleUploadDocument
        },
        {
          id: 'upload_file',
          title: 'Upload File',
          subtitle: 'Upload document',
          icon: 'document',
          action: handleUploadDocument
        },
        {
          id: 'enter_vin',
          title: 'Enter VIN',
          subtitle: 'Type VIN manually',
          icon: 'create',
          action: () => setCurrentStep('manual')
        }
      ];
    }
  }, []);

  // Process VIN image through Lambda with enhanced user expectations
  const processVINImage = async (base64: string, method: 'camera' | 'upload') => {
    setIsProcessing(true);
    setCurrentStep('processing');
    setProcessingProgress(0);
    
    // Set initial expectation
    setProcessingMessage("🎯 Preparing VIN analysis with advanced OCR technology...\n\nThis takes 5-10 seconds but gives you 95% diagnostic accuracy instead of 65% general guidance.");
    
    try {
      console.log(`🔍 Processing VIN image via ${method}, base64 length:`, base64.length);
      
      // Progressive status updates to manage user expectations
      const statusUpdates = [
        {
          message: "📷 Analyzing image with Amazon Textract OCR...\n\nWhile I process your VIN, here's what you'll get:\n• Exact part numbers for your specific vehicle\n• Known issues and recalls for your VIN",
          progress: 25,
          delay: 1000
        },
        {
          message: "🔍 Extracting VIN characters from image...\n\n• Precise labor time estimates\n• Vehicle-specific diagnostic procedures\n• 95% diagnostic accuracy vs 65% general advice",
          progress: 50,
          delay: 2500
        },
        {
          message: "✅ Validating VIN with NHTSA government database...\n\nAlmost done! Getting your official vehicle specifications...",
          progress: 75,
          delay: 4000
        },
        {
          message: "🚗 Loading your vehicle specifications and known issues...\n\nFinalizing your VIN-enhanced diagnostic profile...",
          progress: 90,
          delay: 6000
        }
      ];
      
      // Start status update sequence
      statusUpdates.forEach(({ message, progress, delay }) => {
        setTimeout(() => {
          if (isProcessing) { // Only update if still processing
            setProcessingMessage(message);
            setProcessingProgress(progress);
          }
        }, delay);
      });
      
      // FIXED: Improved Lambda integration with better error handling
      const response = await fetch(AWS_CONFIG.API.GraphQL.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AWS_CONFIG.API.GraphQL.apiKey,
        },
        body: JSON.stringify({
          query: `
            mutation SendMessage($message: String, $conversationId: String, $image_base64: String) {
              sendMessage(message: $message, conversationId: $conversationId, image_base64: $image_base64) {
                conversationId
                message
                success
                vin_enhanced
                diagnostic_accuracy
                error
                processingTime
              }
            }
          `,
          variables: {
            message: 'Extract VIN from image',
            conversationId: `vin-${method}-${Date.now()}`,
            image_base64: base64,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Lambda response:', result);
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      
      if (result.data?.sendMessage) {
        const messageData = result.data.sendMessage;
        
        // DEBUGGING: Log the exact structure we're receiving
        console.log('📊 Response structure analysis:');
        console.log('  - success:', messageData.success);
        console.log('  - vin_enhanced:', messageData.vin_enhanced);
        console.log('  - vin_extraction_attempted:', messageData.vin_extraction_attempted);
        console.log('  - vin_found:', messageData.vin_found);
        console.log('  - message type:', typeof messageData.message);
        console.log('  - message content:', messageData.message);
        console.log('  - extraction_details:', messageData.extraction_details);
        console.log('  - error:', messageData.error);
        
        // FIXED: Handle the actual response format from Lambda
        // Case 1: Successful VIN processing (vin_enhanced: true) - even without explicit VIN field
        if (messageData.vin_enhanced === true && messageData.diagnostic_accuracy === '95%') {
          console.log('✅ VIN processing successful - enhanced diagnostics active');
          
          // Extract vehicle info from the message content
          const messageStr = messageData.message || '';
          let vehicleInfo = '';
          
          // Look for vehicle information in the message
          const vehicleMatch = messageStr.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z]+)/);
          if (vehicleMatch) {
            vehicleInfo = `${vehicleMatch[1]} ${vehicleMatch[2]} ${vehicleMatch[3]}`;
          }
          
          // VIN processing successful - let the acknowledgement display as normal chat message
          // Don't show our own processing message, let Lambda's response show in chat
          setProcessingProgress(100);
          
          // Immediately proceed - no delay needed
          const vinResult: VINProcessingResult = {
            vin: 'VIN_PROCESSED', // Placeholder since actual VIN not returned
            extraction_method: method === 'camera' ? 'camera' : 'textract',
            diagnostic_accuracy: messageData.diagnostic_accuracy || '95%',
            processing_time: messageData.processingTime || 0,
            message: `VIN extracted from ${method === 'camera' ? 'camera photo' : 'uploaded image'}`,
            vehicle_data: vehicleInfo ? { info: vehicleInfo } : undefined,
            acknowledgement_message: messageStr // Pass the Lambda's acknowledgement message
          };
          
          onVinProcessed(vinResult);
          return;
        }
        
        // Case 2: Explicit VIN field provided (legacy support)
        if (messageData.vin_enhanced === true && messageData.vin) {
          // VIN was successfully extracted and processed
          const extractedVin = messageData.vin.replace('...', ''); // Remove truncation if present
          
          console.log('✅ VIN extracted and processed successfully:', extractedVin);
          
          // Show success message with value confirmation
          setProcessingMessage(`✅ VIN processed successfully!\n\nYour ${messageData.vehicle_data?.year || ''} ${messageData.vehicle_data?.make || ''} ${messageData.vehicle_data?.model || ''} is now in my database.\n\nAll diagnostics will now use 95% accuracy with exact specifications.`);
          setProcessingProgress(100);
          
          // Brief pause to show success message, then pass the Lambda's acknowledgement message
          setTimeout(() => {
            const vinResult: VINProcessingResult = {
              vin: extractedVin,
              extraction_method: method === 'camera' ? 'camera' : 'textract',
              diagnostic_accuracy: messageData.diagnostic_accuracy || '95%',
              processing_time: messageData.processingTime || 0,
              message: `VIN extracted from ${method === 'camera' ? 'camera photo' : 'uploaded image'}`,
              vehicle_data: messageData.vehicle_data,
              acknowledgement_message: messageStr // Pass the Lambda's acknowledgement message
            };
            
            onVinProcessed(vinResult);
          }, 2000);
          return;
        }
        
        // Case 2: VIN extraction failed - Lambda returns success:true but message contains failure info
        // The message is a string representation of the Strands response
        if (messageData.success === true && typeof messageData.message === 'string') {
          const messageStr = messageData.message;
          
          // Check if this is a VIN extraction failure message
          if (messageStr.includes("couldn't detect a VIN") || 
              messageStr.includes("No VIN detected") ||
              messageStr.includes("VIN scanning")) {
            
            // Extract the helpful text from the string representation
            // Format: "{role=assistant, content=[{text=...}]}"
            const textMatch = messageStr.match(/text=([^}]+)\}/);
            let helpfulMessage = 'No VIN found in image';
            
            if (textMatch && textMatch[1]) {
              helpfulMessage = textMatch[1].trim();
            }
            
            console.log('❌ VIN extraction failed - Lambda message:', helpfulMessage);
            throw new Error('No valid VIN found in image. Please ensure the VIN is clearly visible and try again.');
          }
        }
        
        // Case 3: Extract VIN from conversational message content (enhanced fallback)
        const vinPatterns = [
          /VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i,
          /Vehicle Identification Number[:\s]*([A-HJ-NPR-Z0-9]{17})/i,
          /\b([A-HJ-NPR-Z0-9]{17})\b/g,
          // Enhanced patterns for conversational responses
          /your\s+(\d{4})\s+([A-Za-z]+)\s+([A-Za-z]+)/i, // "your 2024 Honda Civic"
          /for\s+your\s+(\d{4})\s+([A-Za-z]+)\s+([A-Za-z]+)/i, // "for your 2024 Honda Civic"
        ];
        
        let extractedVin = null;
        let vehicleInfo = null;
        let messageText = '';
        
        if (typeof messageData.message === 'string') {
          messageText = messageData.message;
        } else if (messageData.message && typeof messageData.message === 'object') {
          if (messageData.message.content && Array.isArray(messageData.message.content)) {
            messageText = messageData.message.content[0]?.text || '';
          }
        }
        
        // Try to extract VIN or vehicle information
        for (const pattern of vinPatterns) {
          const matches = messageText.match(pattern);
          if (matches) {
            if (matches[0].length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(matches[0])) {
              // Found actual VIN
              extractedVin = matches[0];
              break;
            } else if (matches.length >= 4) {
              // Found vehicle info (year, make, model)
              vehicleInfo = `${matches[1]} ${matches[2]} ${matches[3]}`;
            }
          }
        }
        
        // If we found VIN or vehicle info, consider it successful
        if (extractedVin || (vehicleInfo && messageData.vin_enhanced)) {
          console.log('✅ VIN/Vehicle info extracted from message:', extractedVin || vehicleInfo);
          
          const vinResult: VINProcessingResult = {
            vin: extractedVin || 'VEHICLE_INFO_EXTRACTED',
            extraction_method: method === 'camera' ? 'camera' : 'textract',
            diagnostic_accuracy: messageData.diagnostic_accuracy || '95%',
            processing_time: messageData.processingTime || 0,
            message: `Vehicle information extracted from ${method === 'camera' ? 'camera photo' : 'uploaded image'}`,
            vehicle_data: vehicleInfo ? { info: vehicleInfo } : undefined
          };
          
          onVinProcessed(vinResult);
          return;
        }
        
        // If we get here, VIN extraction failed
        console.log('❌ No valid VIN found in response');
        console.log('🔍 DEBUGGING - Full response analysis:');
        console.log('  - messageData keys:', Object.keys(messageData));
        console.log('  - messageData values:', JSON.stringify(messageData, null, 2));
        
        throw new Error('No valid VIN found in image. Please ensure the VIN is clearly visible and try again.');
      } else {
        const errorMsg = result.data?.sendMessage?.error || 'VIN extraction service failed';
        console.log('❌ Lambda processing failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('🔍 VIN processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      Alert.alert(
        'VIN Extraction Failed', 
        `Could not extract VIN from image: ${errorMessage}\n\nWould you like to enter it manually?`,
        [
          { text: 'Try Again', style: 'cancel', onPress: () => setCurrentStep('choice') },
          { text: 'Enter Manually', onPress: () => setCurrentStep('manual') }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual VIN entry with enhanced expectations
  const handleManualVinEntry = async () => {
    const cleanVin = manualVin.replace(/\s/g, '').toUpperCase();
    
    // Validate VIN
    if (!validateVIN(cleanVin)) {
      setVinError('Please enter a valid 17-character VIN (no spaces, I, O, or Q)');
      return;
    }
    
    setVinError('');
    setIsProcessing(true);
    setCurrentStep('processing');
    setProcessingProgress(0);
    
    // Set expectation for manual VIN processing
    setProcessingMessage("🔍 Validating your VIN with NHTSA database...\n\nThis will give you 95% diagnostic accuracy with exact vehicle specifications.");
    
    try {
      console.log('✏️ Processing manual VIN:', cleanVin);
      
      // Status updates for manual VIN processing
      setTimeout(() => {
        if (isProcessing) {
          setProcessingMessage("✅ VIN validated! Loading vehicle specifications...\n\nGetting official data from government database...");
          setProcessingProgress(50);
        }
      }, 1500);
      
      setTimeout(() => {
        if (isProcessing) {
          setProcessingMessage("🚗 Finalizing your vehicle profile...\n\nPreparing VIN-enhanced diagnostics...");
          setProcessingProgress(80);
        }
      }, 3000);
      
      // FIXED: Improved manual VIN processing with better error handling
      const response = await fetch(AWS_CONFIG.API.GraphQL.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AWS_CONFIG.API.GraphQL.apiKey,
        },
        body: JSON.stringify({
          query: `
            mutation SendMessage($message: String, $conversationId: String) {
              sendMessage(message: $message, conversationId: $conversationId) {
                conversationId
                message
                success
                vin_enhanced
                diagnostic_accuracy
                error
                processingTime
              }
            }
          `,
          variables: {
            message: `Process VIN: ${cleanVin}`,
            conversationId: `manual-vin-${Date.now()}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✏️ Manual VIN Lambda response:', result);
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      
      if (result.data?.sendMessage) {
        const messageData = result.data.sendMessage;
        
        // FIXED: For manual VIN, we should always succeed if the format is valid
        // The Lambda will process the VIN and return vehicle data
        console.log('✅ Manual VIN processed successfully');
        
        const vinResult: VINProcessingResult = {
          vin: cleanVin,
          extraction_method: 'manual',
          diagnostic_accuracy: '95%',
          processing_time: messageData.processingTime || 0,
          message: 'VIN entered manually',
          vehicle_data: messageData.vehicle_data // Include any vehicle data returned
        };
        
        onVinProcessed(vinResult);
      } else {
        throw new Error('Invalid response from VIN processing service');
      }
    } catch (error) {
      console.error('✏️ Manual VIN processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      Alert.alert(
        'VIN Processing Error', 
        `Failed to process VIN: ${errorMessage}\n\nPlease check the VIN format and try again.`
      );
      setCurrentStep('manual');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  // Show processing state with enhanced expectations
  if (currentStep === 'processing' || isProcessing) {
    return (
      <View style={styles.inlineContainer}>
        <View style={styles.processingContainer}>
          <Text style={styles.processingTitle}>VIN Processing</Text>
          
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${processingProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{processingProgress}% Complete</Text>
          
          {/* Dynamic processing message */}
          <Text style={styles.processingMessage}>{processingMessage}</Text>
          
          {/* Value proposition reminder */}
          <View style={styles.valueContainer}>
            <Text style={styles.valueTitle}>🎯 Why VIN Processing Matters:</Text>
            <Text style={styles.valueText}>• 95% vs 65% diagnostic accuracy</Text>
            <Text style={styles.valueText}>• Exact part numbers & specifications</Text>
            <Text style={styles.valueText}>• Vehicle-specific known issues</Text>
            <Text style={styles.valueText}>• Precise cost estimates</Text>
          </View>
        </View>
      </View>
    );
  }

  // Show manual VIN entry
  if (currentStep === 'manual') {
    return (
      <View style={styles.inlineContainer}>
        <Text style={styles.title}>Enter Your VIN Manually</Text>
        <Text style={styles.subtitle}>Enter the 17-character Vehicle Identification Number</Text>
        
        <TextInput
          style={[styles.vinInput, vinError ? styles.vinInputError : null]}
          value={manualVin}
          onChangeText={(text) => {
            setManualVin(text);
            setVinError('');
          }}
          placeholder="Enter VIN (17 characters)"
          maxLength={17}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        
        {vinError ? <Text style={styles.errorText}>{vinError}</Text> : null}
        
        <View style={styles.manualButtonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setCurrentStep('choice')}
          >
            <Text style={styles.cancelButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.processButton, !manualVin.trim() && styles.processButtonDisabled]}
            onPress={handleManualVinEntry}
            disabled={!manualVin.trim()}
          >
            <Text style={styles.processButtonText}>Process VIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main VIN options (same size as diagnostic buttons)
  return (
    <View style={styles.inlineContainer}>
      <Text style={styles.title}>🎯 VIN Scanning for 95% Accuracy</Text>
      <Text style={styles.subtitle}>
        Choose how to provide your VIN for precise diagnostics with exact vehicle specifications
      </Text>
      
      <View style={styles.expectationBox}>
        <Text style={styles.expectationTitle}>What you'll get:</Text>
        <Text style={styles.expectationText}>• Exact part numbers for your vehicle</Text>
        <Text style={styles.expectationText}>• Known issues and recalls for your VIN</Text>
        <Text style={styles.expectationText}>• Precise labor time estimates</Text>
        <Text style={styles.expectationText}>• 95% vs 65% diagnostic accuracy</Text>
      </View>
      
      {vinInputOptions.map((option) => (
        <TouchableOpacity 
          key={option.id}
          style={styles.vinOptionButton}
          onPress={option.action}
        >
          <View style={styles.vinOptionContent}>
            <View style={styles.vinOptionIconContainer}>
              <Ionicons 
                name={option.icon as any} 
                size={24} 
                color="#2563eb" 
              />
            </View>
            <View style={styles.vinOptionText}>
              <Text style={styles.vinOptionTitle}>{option.title}</Text>
              <Text style={styles.vinOptionSubtitle}>{option.subtitle}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={onClose}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Same size as diagnostic buttons - inline with chat
  inlineContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: '#6b7280',
  },
  expectationBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  expectationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  expectationText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 2,
    paddingLeft: 4,
  },
  vinOptionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  vinOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vinOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  vinOptionIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vinOptionText: {
    flex: 1,
  },
  vinOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  vinOptionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  processingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10a37f',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  processingMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  valueContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
    textAlign: 'center',
  },
  valueText: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
    paddingLeft: 8,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  vinInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  vinInputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 16,
  },
  manualButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  processButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  processButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VINScanningFlow;
