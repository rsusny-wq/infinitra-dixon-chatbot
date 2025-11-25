import React, { useState, useEffect } from 'react';
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
import AuthService, { AutomotiveUser } from '../services/AuthService';
import MechanicDashboard from './mechanic-dashboard';
import EnhancedAdminDashboard from './admin/EnhancedAdminDashboard';

export default function MechanicPortal() {
  const [user, setUser] = useState<AutomotiveUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      
      if (currentUser && (currentUser.role === 'mechanic' || currentUser.role === 'admin')) {
        setUser(currentUser);
        setIsAuthenticated(true);
        console.log('🔧 User authenticated:', currentUser.email, 'Role:', currentUser.role);
      } else if (currentUser && currentUser.role === 'customer') {
        // Customer trying to access mechanic portal
        Alert.alert(
          'Access Denied',
          'This portal is for mechanics and shop owners only. Please use the main app for customer services.',
          [
            {
              text: 'OK',
              onPress: () => {
                AuthService.signOutUser();
                setUser(null);
                setIsAuthenticated(false);
              },
            },
          ]
        );
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('🔧 No authenticated user');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoginLoading(true);
      console.log('🔧 Login attempt for:', email);
      
      const result = await AuthService.signInUser({ email, password });
      
      if (result.success) {
        // Get user details after successful login
        const user = await AuthService.getCurrentUser();
        if (user && (user.role === 'mechanic' || user.role === 'admin')) {
          console.log('✅ Login successful:', user.email, 'Role:', user.role);
          setUser(user);
          setIsAuthenticated(true);
        } else if (user && user.role === 'customer') {
          // Customer trying to access mechanic portal
          Alert.alert(
            'Access Denied',
            'This portal is for mechanics and shop owners only. Please use the main app for customer services.'
          );
          await AuthService.signOutUser();
        } else {
          throw new Error('Failed to get user details after login');
        }
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOutUser();
      setUser(null);
      setIsAuthenticated(false);
      setEmail('');
      setPassword('');
      console.log('👋 User logged out');
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // Show appropriate dashboard based on role
  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      return <EnhancedAdminDashboard />;
    } else {
      return <MechanicDashboard />;
    }
  }

  // Show login form
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="construct" size={64} color="#007AFF" />
          <Text style={styles.title}>Staff Portal</Text>
          <Text style={styles.subtitle}>Dixon Smart Repair</Text>
          <Text style={styles.description}>
            Sign in with your staff credentials to access your dashboard
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loginLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in" size={20} color="#fff" />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo Account Info */}
        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>Demo Accounts:</Text>
          <Text style={styles.demoText}>Mechanic: mechanic@dixon.com</Text>
          <Text style={styles.demoText}>Shop Owner: admin@dixon.com</Text>
          <Text style={styles.demoText}>Password: DixonDemo123!</Text>
        </View>

        {/* Customer Link */}
        <View style={styles.customerLink}>
          <Text style={styles.customerLinkText}>
            Are you a customer? 
          </Text>
          <TouchableOpacity onPress={() => {
            // Navigate back to main app - in a real app this would be handled by navigation
            Alert.alert(
              'Customer Portal',
              'Please visit the main Dixon Smart Repair app for customer services.',
              [{ text: 'OK' }]
            );
          }}>
            <Text style={styles.customerLinkButton}>Use Customer Portal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoInfo: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  customerLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  customerLinkText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  customerLinkButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
