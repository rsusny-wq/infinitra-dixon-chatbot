/**
 * ManualVINEntry Component
 * Manual VIN input with validation and formatting
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ManualVINEntryProps {
  onVinEntered: (vin: string) => void;
  onCancel: () => void;
  onScanInstead: () => void;
}

export const ManualVINEntry: React.FC<ManualVINEntryProps> = ({
  onVinEntered,
  onCancel,
  onScanInstead,
}) => {
  const [vin, setVin] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const validateVINFormat = (vinInput: string): { valid: boolean; error?: string } => {
    const cleanVin = vinInput.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanVin.length !== 17) {
      return { valid: false, error: 'VIN must be exactly 17 characters' };
    }
    
    // Check for invalid characters (I, O, Q not allowed in VINs)
    if (/[IOQ]/.test(cleanVin)) {
      return { valid: false, error: 'VIN cannot contain letters I, O, or Q' };
    }
    
    // Basic VIN pattern check
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinPattern.test(cleanVin)) {
      return { valid: false, error: 'Invalid VIN format' };
    }
    
    return { valid: true };
  };

  const handleVinChange = (text: string) => {
    // Convert to uppercase and remove invalid characters
    const cleanText = text.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    
    // Limit to 17 characters
    const limitedText = cleanText.slice(0, 17);
    
    setVin(limitedText);
    setValidationError('');
  };

  const handleSubmit = async () => {
    const validation = validateVINFormat(vin);
    
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid VIN');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      // Process VIN (this will trigger NHTSA validation in backend)
      await onVinEntered(vin);
    } catch (error) {
      console.error('VIN processing error:', error);
      setValidationError('Failed to process VIN. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const formatVinDisplay = (vinText: string) => {
    // Add spaces for better readability (every 4 characters)
    return vinText.replace(/(.{4})/g, '$1 ').trim();
  };

  const getValidationColor = () => {
    if (validationError) return '#ff6b6b';
    if (vin.length === 17) return '#10a37f';
    return '#666';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Enter VIN Manually</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.instructionsContainer}>
          <Ionicons name="create-outline" size={48} color="#10a37f" />
          <Text style={styles.instructionTitle}>
            Type your 17-character VIN
          </Text>
          <Text style={styles.instructionText}>
            Your VIN is a unique 17-character code that identifies your specific vehicle
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Vehicle Identification Number (VIN)</Text>
          <TextInput
            ref={inputRef}
            style={[
              styles.vinInput,
              { borderColor: getValidationColor() }
            ]}
            value={vin}
            onChangeText={handleVinChange}
            placeholder="Enter 17-character VIN"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={17}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          
          <View style={styles.vinDisplay}>
            <Text style={styles.vinDisplayText}>
              {formatVinDisplay(vin)}
            </Text>
            <Text style={styles.characterCount}>
              {vin.length}/17
            </Text>
          </View>

          {validationError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          ) : null}

          {vin.length === 17 && !validationError && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#10a37f" />
              <Text style={styles.successText}>VIN format looks good!</Text>
            </View>
          )}
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 VIN Tips:</Text>
          <Text style={styles.tipItem}>• VINs are exactly 17 characters</Text>
          <Text style={styles.tipItem}>• No letters I, O, or Q</Text>
          <Text style={styles.tipItem}>• Mix of letters and numbers</Text>
          <Text style={styles.tipItem}>• Usually found on dashboard or door frame</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            { 
              backgroundColor: vin.length === 17 && !validationError ? '#10a37f' : '#ccc',
              opacity: isValidating ? 0.7 : 1
            }
          ]}
          onPress={handleSubmit}
          disabled={vin.length !== 17 || !!validationError || isValidating}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark" size={20} color="white" />
          )}
          <Text style={styles.submitButtonText}>
            {isValidating ? 'Validating...' : 'Process VIN'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={onScanInstead}
        >
          <Ionicons name="camera" size={20} color="#10a37f" />
          <Text style={styles.scanButtonText}>Scan VIN Instead</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.accuracyNote}>
        📊 Manual VIN entry provides 95% diagnostic accuracy
      </Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  vinInput: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f8f9fa',
  },
  vinDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  vinDisplayText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
    letterSpacing: 1,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginLeft: 6,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  successText: {
    fontSize: 14,
    color: '#10a37f',
    marginLeft: 6,
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
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
    marginBottom: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scanButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10a37f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  scanButtonText: {
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
    paddingHorizontal: 20,
  },
});

export default ManualVINEntry;
