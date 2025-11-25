/**
 * API Test Component - Test GraphQL APIs
 * This component can be used to test the working GraphQL APIs
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AdminService } from '../services/AdminService';
import MechanicService from '../services/MechanicService';

const APITestComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (title: string, data: any) => {
    setResults(prev => [...prev, { title, data, timestamp: new Date().toISOString() }]);
  };

  const testAdminAPIs = async () => {
    setLoading(true);
    try {
      // Test getShopMechanics
      const mechanicsResult = await AdminService.getShopMechanics();
      addResult('Admin: getShopMechanics', mechanicsResult);

      // Test getShopAnalytics
      const analyticsResult = await AdminService.getShopAnalytics('30d');
      addResult('Admin: getShopAnalytics', analyticsResult);

    } catch (error) {
      addResult('Admin APIs Error', error);
    } finally {
      setLoading(false);
    }
  };

  const testMechanicAPIs = async () => {
    setLoading(true);
    try {
      const shopId = 'shop_001';

      // Test getShopStatistics
      const statsResult = await MechanicService.getShopStatistics(shopId);
      addResult('Mechanic: getShopStatistics', statsResult);

      // Test getPendingDiagnoses
      const diagnosesResult = await MechanicService.getPendingDiagnoses(shopId);
      addResult('Mechanic: getPendingDiagnoses', diagnosesResult);

      // Test getQueuedRequests
      const requestsResult = await MechanicService.getQueuedRequests(shopId);
      addResult('Mechanic: getQueuedRequests', requestsResult);

    } catch (error) {
      addResult('Mechanic APIs Error', error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GraphQL API Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.adminButton]} 
          onPress={testAdminAPIs}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Admin APIs</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.mechanicButton]} 
          onPress={testMechanicAPIs}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Mechanic APIs</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Testing APIs...</Text>
        </View>
      )}

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultTimestamp}>{result.timestamp}</Text>
            <Text style={styles.resultData}>
              {JSON.stringify(result.data, null, 2)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginVertical: 5,
  },
  adminButton: {
    backgroundColor: '#007AFF',
  },
  mechanicButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  resultData: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 4,
  },
});

export default APITestComponent;
