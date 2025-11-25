import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Suppress known development warnings from dependencies
import './src/utils/suppressWarnings';

// Configure AWS Amplify with our deployed CDK backend
import { Amplify } from 'aws-amplify';
import awsConfig from './src/aws-config';

Amplify.configure(awsConfig);

// Import NEW Dixon Chat Interface
import DixonChatInterface from './src/components/chat/DixonChatInterface';
// Import portals
import MechanicPortal from './src/components/MechanicPortal';
import AdminPortal from './src/components/AdminPortal';
// Import other dashboards for testing
import AdminDashboard from './src/components/admin/AdminDashboard';
// Import API test component
import APITestComponent from './src/components/APITestComponent';

const Stack = createStackNavigator();

// URL-based routing configuration
const linking = {
  prefixes: ['https://d37f64klhjdi5b.cloudfront.net', 'http://localhost:19006'],
  config: {
    screens: {
      Main: '',
      MechanicPortal: 'mechanic',
      AdminPortal: 'admin',
      MechanicDashboard: 'mechanic-dashboard',
      AdminDashboard: 'admin-dashboard',
      APITest: 'api-test',
    },
  },
};

export default function App() {
  console.log('🚗 Dixon Smart Repair - NEW Clean Interface');
  console.log('🔧 Platform:', Platform.OS);
  console.log('🌐 CDK Infrastructure + Amplify Libraries');
  console.log('🔗 URL Routing Enabled:');
  console.log('   • Customer: https://d37f64klhjdi5b.cloudfront.net');
  console.log('   • Mechanic: https://d37f64klhjdi5b.cloudfront.net/mechanic');
  console.log('   • Admin: https://d37f64klhjdi5b.cloudfront.net/admin');
  
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator 
        initialRouteName="Main"
        screenOptions={{
          headerShown: false, // Dixon interface handles its own header
        }}
      >
        {/* Main Customer Interface */}
        <Stack.Screen 
          name="Main" 
          component={DixonChatInterface}
        />
        
        {/* Mechanic Portal - Separate entry point for mechanics */}
        <Stack.Screen 
          name="MechanicPortal" 
          component={MechanicPortal}
          options={{
            headerShown: false, // Portal handles its own auth and navigation
          }}
        />
        
        {/* Admin Portal - Separate entry point for shop owners */}
        <Stack.Screen 
          name="AdminPortal" 
          component={AdminPortal}
          options={{
            headerShown: false, // Portal handles its own auth and navigation
          }}
        />
        
        {/* Keep mechanic dashboard route for direct access */}
        <Stack.Screen 
          name="MechanicDashboard" 
          component={MechanicPortal} // Redirect to portal for proper auth
          options={{
            headerShown: false,
          }}
        />
        
        {/* Keep admin dashboard route for direct access */}
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminPortal} // Redirect to portal for proper auth
          options={{
            headerShown: false,
          }}
        />
        
        {/* API Test Component - Temporary for testing */}
        <Stack.Screen 
          name="APITest" 
          component={APITestComponent}
          options={{
            headerShown: true,
            title: 'API Test',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
