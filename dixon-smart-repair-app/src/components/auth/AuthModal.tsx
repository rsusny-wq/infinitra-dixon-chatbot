/**
 * Improved Authentication Modal - Dixon Smart Repair
 * Better UX with inline validation and proper email verification
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import AuthService, { SignUpData, SignInData, AutomotiveUser } from '../../services/AuthService';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AutomotiveUser) => void;
}

type AuthMode = 'signin' | 'signup' | 'confirm';

const AuthModal: React.FC<AuthModalProps> = React.memo(({ visible, onClose, onAuthSuccess }) => {
  console.log('🔍 AuthModal render - visible:', visible);
  
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  // Role is always 'customer' for public registration
  // Admin users can create mechanic/admin accounts through admin interface
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Real-time validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateNames = (given: string, family: string) => {
    if (!given.trim() || !family.trim()) {
      setNameError('First and last names are required');
      return false;
    }
    if (given.trim().length < 2 || family.trim().length < 2) {
      setNameError('Names must be at least 2 characters long');
      return false;
    }
    setNameError('');
    return true;
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setGivenName('');
    setFamilyName('');
    setPhoneNumber('');
    setConfirmationCode('');
    setEmailError('');
    setPasswordError('');
    setNameError('');
    setMessage('');
  };

  const handleSignUp = async () => {
    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const areNamesValid = validateNames(givenName, familyName);

    if (!isEmailValid || !isPasswordValid || !areNamesValid) {
      showMessage('Please fix the errors above', 'error');
      return;
    }

    setLoading(true);
    showMessage('Creating your automotive account...', 'info');

    const userData: SignUpData = {
      email: email.trim().toLowerCase(),
      password,
      givenName: givenName.trim(),
      familyName: familyName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      // All public registrations are customers
      // Mechanics and admins are created by admin users through admin interface
    };

    const result = await AuthService.registerUser(userData);
    
    setLoading(false);
    
    if (result.success) {
      showMessage(result.message, 'success');
      setAuthMode('confirm');
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleConfirmSignUp = async () => {
    if (!email || !confirmationCode) {
      showMessage('Please enter the verification code sent to your email', 'error');
      return;
    }

    if (confirmationCode.length !== 6) {
      showMessage('Verification code must be 6 digits', 'error');
      return;
    }

    setLoading(true);
    showMessage('Verifying your email...', 'info');

    const result = await AuthService.confirmRegistration(email, confirmationCode);
    
    setLoading(false);
    
    if (result.success) {
      showMessage(result.message, 'success');
      setTimeout(() => {
        setAuthMode('signin');
        setConfirmationCode('');
      }, 1500);
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleSignIn = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = password.length > 0;

    if (!isEmailValid || !isPasswordValid) {
      showMessage('Please enter your email and password', 'error');
      return;
    }

    setLoading(true);
    showMessage('Signing you in...', 'info');

    const credentials: SignInData = {
      email: email.trim().toLowerCase(),
      password,
    };

    const result = await AuthService.signInUser(credentials);
    
    setLoading(false);
    
    if (result.success && result.user) {
      showMessage('Welcome back!', 'success');
      setTimeout(() => {
        onAuthSuccess(result.user!);
        clearForm();
      }, 1000);
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      showMessage('Please enter your email first', 'error');
      return;
    }

    setLoading(true);
    const result = await AuthService.resendVerificationCode(email);
    setLoading(false);
    
    showMessage(result.message, result.success ? 'success' : 'error');
  };

  const handleClose = () => {
    clearForm();
    setAuthMode('signin');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚗 Dixon Smart Repair</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Auth Mode Selector */}
            {authMode !== 'confirm' && (
              <View style={styles.authModeSelector}>
                <TouchableOpacity 
                  style={[styles.modeButton, authMode === 'signin' && styles.activeModeButton]}
                  onPress={() => setAuthMode('signin')}
                >
                  <Text style={[styles.modeButtonText, authMode === 'signin' && styles.activeModeButtonText]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modeButton, authMode === 'signup' && styles.activeModeButton]}
                  onPress={() => setAuthMode('signup')}
                >
                  <Text style={[styles.modeButtonText, authMode === 'signup' && styles.activeModeButtonText]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sign In Form */}
            {authMode === 'signin' && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Welcome Back</Text>
                <Text style={styles.formSubtitle}>Sign in to your automotive account</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, emailError ? styles.inputError : null]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (text) validateEmail(text);
                    }}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.disabledButton]} 
                  onPress={handleSignIn}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sign Up Form */}
            {authMode === 'signup' && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Create Account</Text>
                <Text style={styles.formSubtitle}>Join Dixon Smart Repair for automotive diagnostics</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput
                    style={[styles.input, emailError ? styles.inputError : null]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (text) validateEmail(text);
                    }}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>

                <View style={styles.nameRow}>
                  <View style={[styles.inputGroup, styles.nameInput]}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                      style={[styles.input, nameError ? styles.inputError : null]}
                      value={givenName}
                      onChangeText={(text) => {
                        setGivenName(text);
                        if (text && familyName) validateNames(text, familyName);
                      }}
                      placeholder="First name"
                      autoComplete="given-name"
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, styles.nameInput]}>
                    <Text style={styles.label}>Last Name *</Text>
                    <TextInput
                      style={[styles.input, nameError ? styles.inputError : null]}
                      value={familyName}
                      onChangeText={(text) => {
                        setFamilyName(text);
                        if (givenName && text) validateNames(givenName, text);
                      }}
                      placeholder="Last name"
                      autoComplete="family-name"
                    />
                  </View>
                </View>
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="+1 (555) 123-4567"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                  <Text style={styles.helpText}>For service notifications and appointment reminders</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={[styles.input, passwordError ? styles.inputError : null]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (text) validatePassword(text);
                    }}
                    placeholder="Create a secure password"
                    secureTextEntry
                    autoComplete="new-password"
                  />
                  {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  ) : (
                    <Text style={styles.helpText}>
                      Must be 8+ characters with uppercase, lowercase, and numbers
                    </Text>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.disabledButton]} 
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Email Verification Form */}
            {authMode === 'confirm' && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Verify Your Email</Text>
                <Text style={styles.formSubtitle}>
                  We sent a 6-digit verification code to:
                </Text>
                <Text style={styles.emailDisplay}>{email}</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmationCode}
                    onChangeText={setConfirmationCode}
                    placeholder="Enter 6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <Text style={styles.helpText}>Check your email inbox and spam folder</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.disabledButton]} 
                  onPress={handleConfirmSignUp}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.secondaryButton, loading && styles.disabledButton]} 
                  onPress={handleResendCode}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Message Display */}
            {message ? (
              <View style={[
                styles.messageContainer,
                messageType === 'success' && styles.successMessage,
                messageType === 'error' && styles.errorMessage,
                messageType === 'info' && styles.infoMessage,
              ]}>
                <Text style={[
                  styles.messageText,
                  messageType === 'success' && styles.successText,
                  messageType === 'error' && styles.errorText,
                  messageType === 'info' && styles.infoText,
                ]}>
                  {message}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // Extremely high z-index to ensure it appears above everything
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 100000, // Even higher z-index for the container
    elevation: 20, // Higher elevation for Android
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  authModeSelector: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeModeButton: {
    backgroundColor: '#3b82f6',
  },
  modeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeModeButtonText: {
    color: 'white',
  },
  form: {
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emailDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  messageContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  successMessage: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  infoMessage: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bfdbfe',
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#166534',
  },
  infoText: {
    color: '#1e40af',
  },
});

export default AuthModal;
