/**
 * VINScanner Component
 * Optimized camera interface for VIN photo capture with Textract processing
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import AWS_CONFIG from '../../aws-config';

const { width, height } = Dimensions.get('window');

export interface VINScannerProps {
  onVinDetected: (vin: string, extractionData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  onManualFallback: () => void;
}

export const VINScanner: React.FC<VINScannerProps> = ({
  onVinDetected,
  onError,
  onCancel,
  onManualFallback,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const captureVINPhoto = async () => {
    try {
      console.log('🔍 VIN Scanner: Starting photo capture');
      
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to scan your VIN for precise diagnostics.',
          [
            { text: 'Cancel', onPress: onCancel },
            { text: 'Enter VIN Manually', onPress: onManualFallback }
          ]
        );
        return;
      }

      setIsProcessing(true);
      setProcessingStep('Opening camera...');

      // Launch camera with VIN-optimized settings
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Good aspect ratio for VIN capture
        quality: 0.8, // Balance between quality and processing speed
        base64: true, // Required for Textract processing
      });

      if (result.canceled) {
        setIsProcessing(false);
        return;
      }

      if (!result.assets[0].base64) {
        throw new Error('Failed to capture image data');
      }

      console.log('🔍 VIN Scanner: Photo captured, processing...');
      setProcessingStep('Extracting VIN from image...');

      // Send to backend for Textract processing
      await processVINImage(result.assets[0].base64);

    } catch (error) {
      console.error('🔍 VIN Scanner Error:', error);
      setIsProcessing(false);
      onError(`VIN scanning failed: ${error.message}`);
    }
  };

  const processVINImage = async (imageBase64: string) => {
    try {
      setProcessingStep('Analyzing image with AI...');

      // Call GraphQL mutation with image
      const response = await fetch(AWS_CONFIG.API.GraphQL.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AWS_CONFIG.API.GraphQL.apiKey,
        },
        body: JSON.stringify({
          query: `
            mutation SendMessage($image_base64: String, $conversationId: String) {
              sendMessage(image_base64: $image_base64, conversationId: $conversationId) {
                conversationId
                message
                success
                vin_found
                vin_enhanced
                extraction_method
                diagnostic_accuracy
                error
                processingTime
              }
            }
          `,
          variables: {
            image_base64: imageBase64,
            conversationId: `vin-scan-${Date.now()}`,
          },
        }),
      });

      const result = await response.json();
      console.log('🔍 VIN Processing Result:', result);

      setIsProcessing(false);

      if (result.data?.sendMessage?.success) {
        const messageData = result.data.sendMessage;
        
        if (messageData.vin_found) {
          setProcessingStep('VIN detected successfully!');
          
          // Extract VIN from response (it should be in the message)
          const vinMatch = messageData.message.match(/VIN[:\s]+([A-HJ-NPR-Z0-9]{17})/i);
          const detectedVin = vinMatch ? vinMatch[1] : 'DETECTED_VIN';
          
          setTimeout(() => {
            onVinDetected(detectedVin, {
              extraction_method: messageData.extraction_method,
              diagnostic_accuracy: messageData.diagnostic_accuracy,
              processing_time: messageData.processingTime,
              message: messageData.message,
            });
          }, 1000);
        } else {
          // VIN not found - show fallback options
          Alert.alert(
            'VIN Not Detected',
            'I couldn\'t detect a VIN in the image. This could be due to lighting, angle, or image quality.',
            [
              { text: 'Try Again', onPress: captureVINPhoto },
              { text: 'Enter VIN Manually', onPress: onManualFallback },
              { text: 'Continue Without VIN', onPress: onCancel }
            ]
          );
        }
      } else {
        throw new Error(result.data?.sendMessage?.error || 'VIN processing failed');
      }

    } catch (error) {
      console.error('🔍 VIN Processing Error:', error);
      setIsProcessing(false);
      
      Alert.alert(
        'Processing Error',
        'There was an error processing your VIN image. Please try again or enter your VIN manually.',
        [
          { text: 'Try Again', onPress: captureVINPhoto },
          { text: 'Enter Manually', onPress: onManualFallback },
          { text: 'Cancel', onPress: onCancel }
        ]
      );
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color="#10a37f" />
          <Text style={styles.processingTitle}>Processing VIN Image</Text>
          <Text style={styles.processingStep}>{processingStep}</Text>
          <Text style={styles.processingNote}>
            This may take a few seconds...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan Your VIN</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.instructionsContainer}>
        <Ionicons name="camera" size={48} color="#10a37f" />
        <Text style={styles.instructionTitle}>
          Take a photo of your VIN
        </Text>
        <Text style={styles.instructionText}>
          Your VIN is usually found on:
        </Text>
        <View style={styles.locationList}>
          <Text style={styles.locationItem}>• Dashboard (visible through windshield)</Text>
          <Text style={styles.locationItem}>• Driver's door frame</Text>
          <Text style={styles.locationItem}>• Engine bay</Text>
        </View>
        
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>📸 Photo Tips:</Text>
          <Text style={styles.tipItem}>• Ensure good lighting</Text>
          <Text style={styles.tipItem}>• Keep camera steady</Text>
          <Text style={styles.tipItem}>• Make sure all 17 characters are visible</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={captureVINPhoto}
        >
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.scanButtonText}>Scan VIN</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.manualButton}
          onPress={onManualFallback}
        >
          <Ionicons name="create-outline" size={20} color="#10a37f" />
          <Text style={styles.manualButtonText}>Enter VIN Manually</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.accuracyNote}>
        📊 VIN scanning provides 95% diagnostic accuracy
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  instructionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  locationList: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  locationItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  scanButton: {
    backgroundColor: '#10a37f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  manualButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10a37f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  manualButtonText: {
    color: '#10a37f',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  accuracyNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    paddingBottom: 20,
  },
  processingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  processingStep: {
    fontSize: 14,
    color: '#10a37f',
    marginBottom: 8,
  },
  processingNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default VINScanner;
