import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import styles
import { styles } from './DixonAuthModal.styles';
import { DesignSystem } from '../../../../styles/designSystem';

// Types
interface DixonAuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (userData: any) => Promise<boolean>;
  onForgotPassword: (email: string) => Promise<boolean>;
  onResetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

const DixonAuthModal: React.FC<DixonAuthModalProps> = ({
  isVisible,
  onClose,
  onSignIn,
  onSignUp,
  onForgotPassword,
  onResetPassword,
  isLoading,
  error,
  onClearError,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    givenName: '',
    familyName: '',
    phoneNumber: '',
    resetCode: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Debug logging
  console.log('🔐 DixonAuthModal - Current mode:', authMode);
  console.log('🔐 DixonAuthModal - Form data:', { 
    email: formData.email, 
    password: formData.password ? '***' : '',
    confirmPassword: formData.confirmPassword ? '***' : '',
    givenName: formData.givenName,
    familyName: formData.familyName,
    phoneNumber: formData.phoneNumber,
    resetCode: formData.resetCode,
    hasNewPassword: !!formData.newPassword 
  });

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) onClearError();
  }, [error, onClearError]);

  // Handle sign in
  const handleSignIn = useCallback(async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const success = await onSignIn(formData.email, formData.password);
    if (success) {
      onClose();
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        givenName: '',
        familyName: '',
        phoneNumber: '',
        resetCode: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    }
  }, [formData, onSignIn, onClose]);

  // Handle sign up
  const handleSignUp = useCallback(async () => {
    console.log('🔐 handleSignUp called with form data:', formData);
    
    if (!formData.email || !formData.password || !formData.givenName || !formData.familyName) {
      console.log('🔐 Missing required fields:', {
        email: !!formData.email,
        password: !!formData.password,
        givenName: !!formData.givenName,
        familyName: !!formData.familyName
      });
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      console.log('🔐 Password mismatch');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    console.log('🔐 Calling onSignUp with userData...');
    const userData = {
      email: formData.email,
      password: formData.password,
      givenName: formData.givenName,
      familyName: formData.familyName,
      phoneNumber: formData.phoneNumber || undefined,
      role: 'customer' as const,
    };

    const success = await onSignUp(userData);
    console.log('🔐 onSignUp result:', success);
    
    if (success) {
      console.log('🎉 SUCCESS: Account created! Check your email for verification.');
      
      // Try both alert and manual mode switch
      try {
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email to verify your account.',
          [{ text: 'OK', onPress: () => setAuthMode('signin') }]
        );
      } catch (alertError) {
        console.log('Alert failed, switching mode manually:', alertError);
        // Fallback: switch mode manually after delay
        setTimeout(() => {
          setAuthMode('signin');
        }, 2000);
      }
    }
  }, [formData, onSignUp]);

  // Handle forgot password
  const handleForgotPassword = useCallback(async () => {
    if (!formData.email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const success = await onForgotPassword(formData.email);
    if (success) {
      Alert.alert(
        'Reset Code Sent!',
        `We've sent a password reset code to ${formData.email}. Please check your email and enter the code below to reset your password.`,
        [{ 
          text: 'OK', 
          onPress: () => {
            setAuthMode('reset');
            // Clear other fields but keep email
            setFormData(prev => ({
              ...prev,
              password: '',
              confirmPassword: '',
              givenName: '',
              familyName: '',
              phoneNumber: '',
              resetCode: '',
              newPassword: '',
              confirmNewPassword: '',
            }));
          }
        }]
      );
    }
  }, [formData.email, onForgotPassword]);

  // Handle reset password
  const handleResetPassword = useCallback(async () => {
    if (!formData.email || !formData.resetCode || !formData.newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const success = await onResetPassword(formData.email, formData.resetCode, formData.newPassword);
    if (success) {
      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully. You can now sign in with your new password.',
        [{ text: 'OK', onPress: () => setAuthMode('signin') }]
      );
      setFormData({
        email: formData.email, // Keep email for sign in
        password: '',
        confirmPassword: '',
        givenName: '',
        familyName: '',
        phoneNumber: '',
        resetCode: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    }
  }, [formData, onResetPassword]);

  // Switch auth mode
  const switchAuthMode = useCallback(() => {
    setAuthMode(prev => prev === 'signin' ? 'signup' : 'signin');
    onClearError();
  }, [onClearError]);

  // Get action handler based on mode
  const getActionHandler = () => {
    switch (authMode) {
      case 'signin': return handleSignIn;
      case 'signup': return handleSignUp;
      case 'forgot': return handleForgotPassword;
      case 'reset': return handleResetPassword;
      default: return handleSignIn;
    }
  };

  // Get action button text
  const getActionButtonText = () => {
    switch (authMode) {
      case 'signin': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'forgot': return 'Send Reset Code';
      case 'reset': return 'Reset Password';
      default: return 'Sign In';
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {authMode === 'signin' && 'Sign In'}
              {authMode === 'signup' && 'Create Account'}
              {authMode === 'forgot' && 'Forgot Password'}
              {authMode === 'reset' && 'Reset Password'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={DesignSystem.components.iconSize.md}
                color={DesignSystem.colors.gray600}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                Welcome to Dixon Smart Repair
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {authMode === 'signin' && 'Sign in to access your vehicle history and personalized recommendations'}
                {authMode === 'signup' && 'Create an account to save your conversations and vehicle information'}
                {authMode === 'forgot' && 'Enter your email address and we\'ll send you a password reset code'}
                {authMode === 'reset' && `Enter the 6-digit code we sent to ${formData.email} and choose your new password`}
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Sign Up Fields */}
              {authMode === 'signup' && (
                <>
                  <View style={styles.nameRow}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>First Name *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.givenName}
                        onChangeText={(value) => handleInputChange('givenName', value)}
                        placeholder="John"
                        placeholderTextColor={DesignSystem.colors.gray400}
                        autoCapitalize="words"
                        editable={!isLoading}
                      />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Last Name *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.familyName}
                        onChangeText={(value) => handleInputChange('familyName', value)}
                        placeholder="Doe"
                        placeholderTextColor={DesignSystem.colors.gray400}
                        autoCapitalize="words"
                        editable={!isLoading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.phoneNumber}
                      onChangeText={(value) => handleInputChange('phoneNumber', value)}
                      placeholder="+1 (555) 123-4567"
                      placeholderTextColor={DesignSystem.colors.gray400}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                    />
                  </View>
                </>
              )}

              {/* Email */}
              {(authMode === 'signin' || authMode === 'signup' || authMode === 'forgot' || authMode === 'reset') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="john@example.com"
                    placeholderTextColor={DesignSystem.colors.gray400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading && authMode !== 'reset'}
                  />
                </View>
              )}

              {/* Password */}
              {(authMode === 'signin' || authMode === 'signup') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Enter your password"
                    placeholderTextColor={DesignSystem.colors.gray400}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>
              )}

              {/* Confirm Password (Sign Up only) */}
              {authMode === 'signup' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Confirm your password"
                    placeholderTextColor={DesignSystem.colors.gray400}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>
              )}

              {/* Reset Code (Reset mode only) */}
              {authMode === 'reset' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Reset Code *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.resetCode}
                    onChangeText={(value) => handleInputChange('resetCode', value)}
                    placeholder="Enter 6-digit code from email"
                    placeholderTextColor={DesignSystem.colors.gray400}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isLoading}
                  />
                  <Text style={styles.helpText}>
                    Check your email for a 6-digit verification code
                  </Text>
                </View>
              )}

              {/* New Password (Reset mode only) */}
              {authMode === 'reset' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>New Password *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.newPassword}
                      onChangeText={(value) => handleInputChange('newPassword', value)}
                      placeholder="Enter your new password"
                      placeholderTextColor={DesignSystem.colors.gray400}
                      secureTextEntry
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm New Password *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.confirmNewPassword}
                      onChangeText={(value) => handleInputChange('confirmNewPassword', value)}
                      placeholder="Confirm your new password"
                      placeholderTextColor={DesignSystem.colors.gray400}
                      secureTextEntry
                      editable={!isLoading}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                isLoading && styles.actionButtonDisabled
              ]}
              onPress={getActionHandler()}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={DesignSystem.colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>
                  {getActionButtonText()}
                </Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password (Sign In only) */}
            {authMode === 'signin' && (
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => setAuthMode('forgot')}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Back to Sign In (Forgot/Reset modes) */}
            {(authMode === 'forgot' || authMode === 'reset') && (
              <View style={styles.linkContainer}>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setAuthMode('signin')}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
                
                {/* Manual switch to reset mode for testing */}
                {authMode === 'forgot' && formData.email && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => {
                      Alert.alert(
                        'Test Mode',
                        'This will skip to reset mode for testing. In production, this would only happen after successfully sending a reset code.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Continue', 
                            onPress: () => setAuthMode('reset')
                          }
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={styles.linkText}>
                      Test Reset Mode
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* Resend Code option in reset mode */}
                {authMode === 'reset' && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => setAuthMode('forgot')}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={styles.linkText}>
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Switch Mode (Sign In/Sign Up only) */}
            {(authMode === 'signin' || authMode === 'signup') && (
              <View style={styles.switchModeContainer}>
                <Text style={styles.switchModeText}>
                  {authMode === 'signin' 
                    ? "Don't have an account? " 
                    : "Already have an account? "
                  }
                </Text>
                <TouchableOpacity
                  onPress={switchAuthMode}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchModeLink}>
                    {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(DixonAuthModal);
