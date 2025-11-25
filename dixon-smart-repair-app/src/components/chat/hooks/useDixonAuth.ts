import { useState, useEffect, useCallback } from 'react';
import { AuthService, AutomotiveUser } from '../../../services/AuthService';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

interface DixonAuthState {
  user: AutomotiveUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface DixonAuthActions {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (userData: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
}

export const useDixonAuth = (): DixonAuthState & DixonAuthActions => {
  const [state, setState] = useState<DixonAuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check current authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const currentUser = await AuthService.getCurrentUser();
      
      // Fix: Check if currentUser exists and has the expected structure
      if (currentUser && typeof currentUser === 'object') {
        setState(prev => ({
          ...prev,
          user: currentUser,
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null, // Don't show error for failed auth check
      }));
    }
  }, []);

  // Sign in user
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await AuthService.signInUser({ email, password });
      
      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: result.message || 'Sign in failed',
          isLoading: false,
        }));
        return false;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({
        ...prev,
        error: 'Sign in failed. Please try again.',
        isLoading: false,
      }));
      return false;
    }
  }, []);

  // Sign up user
  const signUp = useCallback(async (userData: any): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await AuthService.registerUser(userData);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: result.message || 'Sign up failed',
          isLoading: false,
        }));
        return false;
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setState(prev => ({
        ...prev,
        error: 'Sign up failed. Please try again.',
        isLoading: false,
      }));
      return false;
    }
  }, []);

  // Sign out user
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await AuthService.signOutUser();
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Sign out error:', error);
      setState(prev => ({
        ...prev,
        error: 'Sign out failed',
        isLoading: false,
      }));
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Forgot password
  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await resetPassword({ username: email });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return true;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset code. Please try again.';
      
      // Handle specific AWS Cognito errors
      if (error.name === 'LimitExceededException') {
        errorMessage = 'Too many reset attempts. Please wait 5-10 minutes before trying again.';
      } else if (error.name === 'UserNotFoundException') {
        errorMessage = 'No account found with this email address.';
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return false;
    }
  }, []);

  // Reset password with code
  const resetPasswordWithCode = useCallback(async (email: string, code: string, newPassword: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to reset password. Please check your code and try again.',
        isLoading: false,
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    clearError,
    checkAuthStatus,
    forgotPassword,
    resetPassword: resetPasswordWithCode,
  };
};
