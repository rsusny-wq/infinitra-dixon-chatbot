/**
 * Real Authentication Service - Dixon Smart Repair
 * Handles actual Cognito authentication for automotive users
 */

import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut, getCurrentUser, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import awsConfig from '../aws-config';

// Configure Amplify
Amplify.configure(awsConfig);

export interface AutomotiveUser {
  userId: string;
  email: string;
  givenName: string;
  familyName: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  // NEW: Role-based authentication for mechanic interface
  role: 'customer' | 'mechanic' | 'admin';
  shopId?: string; // For mechanics and shop owners
  shopName?: string; // For display purposes
}

export interface SignUpData {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  phoneNumber?: string;
  // Role is optional - defaults to 'customer' for public registration
  // Admin users can specify role when creating mechanic/admin accounts
  role?: 'customer' | 'mechanic' | 'admin';
  shopId?: string; // For mechanics and shop owners
  shopName?: string; // For shop owners creating new shop
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Register new user (defaults to customer for public registration)
   */
  static async registerUser(userData: SignUpData): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      const role = userData.role || 'customer'; // Default to customer
      console.log('🚗 Registering user:', userData.email, 'Role:', role);

      // Build user attributes
      const userAttributes: Record<string, string> = {
        email: userData.email,
        given_name: userData.givenName,
        family_name: userData.familyName,
        'custom:role': role,
      };

      // Add optional attributes
      if (userData.phoneNumber) {
        userAttributes.phone_number = userData.phoneNumber;
      }

      if (userData.shopId) {
        userAttributes['custom:shop_id'] = userData.shopId;
      }

      if (userData.shopName) {
        userAttributes['custom:shop_name'] = userData.shopName;
      }

      const result = await signUp({
        username: userData.email,
        password: userData.password,
        options: {
          userAttributes,
        },
      });

      console.log('✅ Registration successful:', result);

      return {
        success: true,
        userId: result.userId,
        message: result.isSignUpComplete
          ? 'Registration complete! You can now sign in.'
          : 'Registration successful! Please check your email for verification code.',
      };
    } catch (error: any) {
      console.error('❌ Registration failed:', error);

      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Confirm user registration with verification code
   */
  static async confirmRegistration(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Confirming registration for:', email);

      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      console.log('✅ Email confirmed successfully');

      return {
        success: true,
        message: 'Email verified successfully! You can now sign in.',
      };
    } catch (error: any) {
      console.error('❌ Confirmation failed:', error);

      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Resend verification code
   */
  static async resendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Resending verification code for:', email);

      await resendSignUpCode({
        username: email,
      });

      return {
        success: true,
        message: 'Verification code sent! Please check your email.',
      };
    } catch (error: any) {
      console.error('❌ Resend failed:', error);

      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Sign in automotive user
   */
  static async signInUser(credentials: SignInData): Promise<{ success: boolean; user?: AutomotiveUser; message: string }> {
    try {
      console.log('🔐 Signing in user:', credentials.email);

      const result = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      console.log('✅ Sign in successful:', result);

      if (result.isSignedIn) {
        const user = await this.getCurrentUser();
        return {
          success: true,
          user: user || undefined,
          message: 'Welcome to Dixon Smart Repair!',
        };
      } else {
        return {
          success: false,
          message: 'Sign in requires additional steps.',
        };
      }
    } catch (error: any) {
      console.error('❌ Sign in failed:', error);

      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  // Cache for current user to avoid excessive Cognito calls
  private static currentUserCache: {
    user: AutomotiveUser | null;
    timestamp: number;
  } | null = null;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current authenticated user with role and shop information
   */
  static async getCurrentUser(): Promise<AutomotiveUser | null> {
    try {
      // Check cache first
      if (
        this.currentUserCache &&
        Date.now() - this.currentUserCache.timestamp < this.CACHE_DURATION
      ) {
        return this.currentUserCache.user;
      }

      const user = await getCurrentUser();

      // Import fetchUserAttributes to get custom attributes
      const { fetchUserAttributes } = await import('aws-amplify/auth');
      const attributes = await fetchUserAttributes();

      // Extract user information from Cognito attributes
      const userData: AutomotiveUser = {
        userId: user.userId,
        email: attributes.email || user.signInDetails?.loginId || '',
        givenName: attributes.given_name || user.signInDetails?.loginId?.split('@')[0] || 'User',
        familyName: attributes.family_name || '',
        phoneNumber: attributes.phone_number,
        isEmailVerified: attributes.email_verified === 'true',
        isPhoneVerified: attributes.phone_number_verified === 'true',
        // Get role from custom attributes, default to customer
        role: (attributes['custom:role'] as 'customer' | 'mechanic' | 'admin') || 'customer',
        shopId: attributes['custom:shop_id'] || 'shop_001', // Default shop for single shop model
        shopName: attributes['custom:shop_name'] || 'Dixon Smart Repair Shop',
      };

      // Update cache
      this.currentUserCache = {
        user: userData,
        timestamp: Date.now(),
      };

      console.log('👤 Current user (fetched):', userData.email);
      return userData;
    } catch (error) {
      // Handle rate limiting specifically
      if (error instanceof Error && error.message.includes('Rate exceeded')) {
        console.warn('⚠️ AuthService: Rate limit exceeded for getCurrentUser');
        // Return cached user if available, even if expired, as fallback
        if (this.currentUserCache) {
          console.log('⚠️ Returning expired cache due to rate limit');
          return this.currentUserCache.user;
        }
        return null; // Return null instead of throwing to prevent cascading errors
      }

      // Check if this is the expected "UserUnAuthenticatedException" for unauthenticated users
      if (error instanceof Error && error.name === 'UserUnAuthenticatedException') {
        // Clear cache if user is not authenticated
        this.currentUserCache = null;
        return null;
      }

      // Only log unexpected errors
      console.log('Unexpected authentication error:', error);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  static async signOutUser(): Promise<{ success: boolean; message: string }> {
    try {
      await signOut();
      this.currentUserCache = null; // Clear cache

      return {
        success: true,
        message: 'Signed out successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Check if current user has mechanic or admin permissions
   */
  static async isMechanicOrAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.role === 'mechanic' || user?.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if current user is admin (shop owner)
   */
  static async isAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if current user is a shop owner
   */
  static async isShopOwner(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.role === 'admin'; // Shop owner is admin
    } catch (error) {
      return false;
    }
  }

  /**
   * Create mechanic user (admin only) - Simplified approach
   */
  static async createMechanicUser(mechanicData: {
    email: string;
    givenName: string;
    familyName: string;
    phoneNumber?: string;
    temporaryPassword: string;
  }): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      // Check if current user is admin
      const currentUser = await this.getCurrentUser();
      if (currentUser?.role !== 'admin') {
        return {
          success: false,
          message: 'Only admin users can create mechanic accounts',
        };
      }

      console.log('🔧 Creating mechanic user:', mechanicData.email);

      // Build user attributes for mechanic
      const userAttributes: Record<string, string> = {
        email: mechanicData.email,
        given_name: mechanicData.givenName,
        family_name: mechanicData.familyName,
        'custom:role': 'mechanic',
        'custom:shop_id': currentUser.shopId || 'shop_001',
        'custom:shop_name': currentUser.shopName || 'Dixon Smart Repair Shop',
      };

      // Add optional attributes
      if (mechanicData.phoneNumber) {
        userAttributes.phone_number = mechanicData.phoneNumber;
      }

      const result = await signUp({
        username: mechanicData.email,
        password: mechanicData.temporaryPassword,
        options: {
          userAttributes,
        },
      });

      console.log('✅ Mechanic creation successful:', result);

      // Check if email verification is required
      const verificationMessage = result.isSignUpComplete
        ? "They can sign in immediately with the provided credentials."
        : "They may need to verify their email before signing in. Check the email verification settings in your Cognito User Pool.";

      return {
        success: true,
        userId: result.userId,
        message: `Mechanic account created for ${mechanicData.givenName}. ${verificationMessage}`,
      };
    } catch (error: any) {
      console.error('❌ Mechanic creation failed:', error);

      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }
  static async getUserShopId(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      return user?.shopId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user-friendly error messages
   */
  private static getErrorMessage(error: any): string {
    switch (error.name) {
      case 'UsernameExistsException':
        return 'An account with this email already exists. Please sign in instead.';
      case 'InvalidPasswordException':
        return 'Password must be at least 8 characters with uppercase, lowercase, and numbers.';
      case 'InvalidParameterException':
        return 'Please check your input and try again.';
      case 'CodeMismatchException':
        return 'Invalid verification code. Please try again.';
      case 'ExpiredCodeException':
        return 'Verification code has expired. Please request a new one.';
      case 'NotAuthorizedException':
        return 'Incorrect email or password. Please try again.';
      case 'UserNotConfirmedException':
        return 'Please verify your email before signing in.';
      case 'UserNotFoundException':
        return 'No account found with this email. Please register first.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

export default AuthService;
