/**
 * AwsService - Direct AWS SDK integration for authentication, API, and storage
 * Handles user authentication via Cognito, GraphQL API calls via AppSync, and S3 storage operations
 * This replaces Amplify with direct AWS SDK calls for our hybrid architecture
 */

import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// AWS Configuration from CDK outputs
const AWS_CONFIG = {
  region: 'us-west-2',
  userPoolId: 'us-west-2_KzSQ4KRWO',
  userPoolClientId: 'd99c0vsi4agvatvjiouv7pcgq',
  graphqlApiUrl: 'https://ar2pbqk5fjelrkcvwi26fgck4m.appsync-api.us-west-2.amazonaws.com/graphql',
  apiKey: 'da2-dqtdq7bvgfdcpdfwbv4u54xgr4',
  s3BucketName: 'dixon-vehicle-photos-041063310146-us-west-2'
};

// Initialize AWS clients
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_CONFIG.region });
const s3Client = new S3Client({ region: AWS_CONFIG.region });

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  location?: string;
}

export interface VehicleRecord {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  mileage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticRecord {
  id: string;
  userId: string;
  vehicleId: string;
  symptoms: string[];
  diagnosis: string;
  confidence: number;
  estimatedCost?: number;
  status: 'pending' | 'completed' | 'in-progress';
  createdAt: string;
  updatedAt: string;
}

export class AwsService {
  private accessToken: string | null = null;

  /**
   * User Authentication Methods (Direct Cognito)
   */
  
  async signInUser(email: string, password: string): Promise<any> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: AWS_CONFIG.userPoolClientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await cognitoClient.send(command);
      
      if (response.AuthenticationResult?.AccessToken) {
        this.accessToken = response.AuthenticationResult.AccessToken;
        console.log('User signed in successfully');
        return response.AuthenticationResult;
      }
      
      throw new Error('Authentication failed');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signUpUser(email: string, password: string, name?: string, phone?: string): Promise<any> {
    try {
      const command = new SignUpCommand({
        ClientId: AWS_CONFIG.userPoolClientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          ...(name ? [{ Name: 'name', Value: name }] : []),
          ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
        ],
      });

      const response = await cognitoClient.send(command);
      console.log('User signed up successfully:', response);
      return response;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signOutUser(): Promise<void> {
    try {
      if (this.accessToken) {
        const command = new GlobalSignOutCommand({
          AccessToken: this.accessToken,
        });
        await cognitoClient.send(command);
        this.accessToken = null;
      }
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * GraphQL API Methods (Direct AppSync)
   */

  async graphqlRequest(query: string, variables?: any): Promise<any> {
    try {
      const response = await fetch(AWS_CONFIG.graphqlApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AWS_CONFIG.apiKey,
          ...(this.accessToken ? { 'Authorization': `Bearer ${this.accessToken}` } : {}),
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL request failed:', error);
      throw error;
    }
  }

  /**
   * Vehicle Management Methods
   */

  async createVehicle(vehicleData: Omit<VehicleRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<VehicleRecord> {
    const mutation = `
      mutation CreateVehicle($input: CreateVehicleInput!) {
        createVehicle(input: $input) {
          id
          userId
          make
          model
          year
          vin
          mileage
          createdAt
          updatedAt
        }
      }
    `;

    const variables = {
      input: {
        ...vehicleData,
        userId: 'current-user-id', // This would come from authenticated user
      }
    };

    const response = await this.graphqlRequest(mutation, variables);
    return response.createVehicle;
  }

  async getUserVehicles(): Promise<VehicleRecord[]> {
    const query = `
      query ListVehiclesByUser($userId: ID!) {
        listVehicles(filter: { userId: { eq: $userId } }) {
          items {
            id
            userId
            make
            model
            year
            vin
            mileage
            createdAt
            updatedAt
          }
        }
      }
    `;

    const variables = {
      userId: 'current-user-id', // This would come from authenticated user
    };

    const response = await this.graphqlRequest(query, variables);
    return response.listVehicles.items;
  }

  /**
   * File Storage Methods (Direct S3)
   */

  async uploadVehiclePhoto(file: File, vehicleId: string): Promise<string> {
    try {
      const key = `vehicles/${vehicleId}/photos/${Date.now()}-${file.name}`;
      
      const command = new PutObjectCommand({
        Bucket: AWS_CONFIG.s3BucketName,
        Key: key,
        Body: file,
        ContentType: file.type,
      });

      await s3Client.send(command);
      console.log('Photo uploaded successfully:', key);
      return key;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */

  async testConnection(): Promise<boolean> {
    try {
      const testQuery = `
        query TestConnection {
          __typename
        }
      `;

      await this.graphqlRequest(testQuery);
      return true;
    } catch (error) {
      console.error('AWS connection test failed:', error);
      return false;
    }
  }
}

export default AwsService;
