import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AuthService, { AutomotiveUser } from '../services/AuthService';

// Import components for different roles
import DixonChatInterface from './chat/DixonChatInterface';
import MechanicDashboard from './mechanic-dashboard';
import AdminDashboard from './admin/AdminDashboard';
import AuthenticationScreen from './AuthenticationScreen';

export default function RoleBasedNavigator() {
  const [user, setUser] = useState<AutomotiveUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        console.log('🔐 User authenticated:', currentUser.email, 'Role:', currentUser.role);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('🔐 No authenticated user');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: AutomotiveUser) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    console.log('✅ Authentication successful:', authenticatedUser.email, 'Role:', authenticatedUser.role);
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOutUser();
      setUser(null);
      setIsAuthenticated(false);
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
      </View>
    );
  }

  // Show authentication screen if not logged in
  if (!isAuthenticated || !user) {
    return (
      <AuthenticationScreen 
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // Route to appropriate interface based on user role
  switch (user.role) {
    case 'mechanic':
      console.log('🔧 Routing to Mechanic Dashboard');
      return <MechanicDashboard />;
      
    case 'admin':
      console.log('👨‍💼 Routing to Admin Dashboard');
      return <AdminDashboard />;
      
    case 'customer':
    default:
      console.log('👤 Routing to Customer Chat Interface');
      return <DixonChatInterface />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
