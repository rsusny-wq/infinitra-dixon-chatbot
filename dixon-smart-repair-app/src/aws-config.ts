/**
 * AWS Configuration for Amplify Libraries (Without Amplify Service)
 * This configuration allows us to use Amplify libraries with our CDK-deployed infrastructure
 * Following AWS best practices for hybrid architecture
 * UPDATED: January 17, 2025 with correct infrastructure values
 */

// CDK Stack Outputs (from our deployed infrastructure)
const AWS_CONFIG = {
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_yzuANWurD',
      userPoolClientId: '2m1crr1oqmoc1ejapqtb16lr8o',
      // REMOVED: identityPoolId - This was causing the 400 Bad Request error
      loginWith: {
        username: true,
        email: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://ar2pbqk5fjelrkcvwi26fgck4m.appsync-api.us-west-2.amazonaws.com/graphql',
      region: 'us-west-2',
      defaultAuthMode: 'userPool', // Changed from 'apiKey' to 'userPool' for authenticated requests
      apiKey: 'da2-dqtdq7bvgfdcpdfwbv4u54xgr4', // Still available for anonymous requests
    },
  },
  Storage: {
    S3: {
      bucket: 'dixon-vehicle-photos-041063310146-us-west-2',
      region: 'us-west-2',
    },
  },
};

export default AWS_CONFIG;
