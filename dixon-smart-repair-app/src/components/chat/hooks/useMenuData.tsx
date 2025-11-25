/**
 * Shared Menu Data Hook
 * Extracts menu data logic from VerticalMenuModal for reuse in HoneycombSidebar
 */

import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/api';
import { useSessionStore } from '../../../stores/sessionStore';
import { chatService } from '../../../services/ChatService';
import { 
  GET_USER_VISITS_QUERY, 
  GET_USER_VEHICLES_QUERY,
  LIST_USER_CONVERSATIONS_QUERY 
} from '../../../services/GraphQLService';
import AuthService, { AutomotiveUser } from '../../../services/AuthService';

// Initialize GraphQL client
const client = generateClient();

// Helper function to format dates (moved outside component to prevent recreation)
const formatDate = (dateString: string | Date) => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  contextIcon: string; // Icon for collapsed state
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    value?: string | number;
    date?: string;
    status?: string;
  }>;
}

export const useMenuData = () => {
  const [currentUser, setCurrentUser] = useState<AutomotiveUser | null>(null);
  const [costEstimates, setCostEstimates] = useState<any[]>([]);
  const [shopVisits, setShopVisits] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]); // Database conversations
  const [loading, setLoading] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  // Get user profile from session store (but not local sessions anymore)
  const { userProfile } = useSessionStore();

  const loadUserData = async () => {
    // Prevent too frequent calls (rate limiting)
    const now = Date.now();
    if (now - lastLoadTime < 2000) { // Minimum 2 seconds between calls
      console.log('🔍 useMenuData - Rate limiting: Skipping load, too soon since last call');
      return;
    }

    try {
      setLoading(true);
      setLastLoadTime(now);
      
      // Get current user with error handling
      const user = await AuthService.getCurrentUser();
      console.log('🔍 useMenuData - loadUserData - user:', user);
      setCurrentUser(user);

      // Load cost estimates if user is authenticated
      if (user?.userId) {
        console.log('🔍 Loading cost estimates for user:', user.userId);
        try {
          const estimatesResponse = await chatService.getUserCostEstimates(user.userId, 20);
          console.log('🔍 Cost estimates response:', estimatesResponse);
          if (estimatesResponse.success) {
            setCostEstimates(estimatesResponse.estimates || []);
            console.log('✅ Loaded', estimatesResponse.estimates?.length || 0, 'cost estimates');
          }
        } catch (estimateError) {
          console.warn('⚠️ Failed to load cost estimates:', estimateError);
          // Don't fail the entire load if cost estimates fail
        }

        // Load conversations using GraphQL
        console.log('🔍 Loading conversations for user:', user.userId);
        try {
          const conversationsResponse = await client.graphql({
            query: LIST_USER_CONVERSATIONS_QUERY,
            variables: { userId: user.userId }
          });
          
          if (conversationsResponse.data?.listUserConversations) {
            setConversations(conversationsResponse.data.listUserConversations);
            console.log('✅ Loaded', conversationsResponse.data.listUserConversations.length, 'conversations');
          }
        } catch (error) {
          console.warn('⚠️ Error loading conversations:', error);
          // Check if it's a network error or GraphQL error
          if (error && typeof error === 'object') {
            if ('networkError' in error) {
              console.warn('📡 Network error loading conversations - this is expected for new users');
            } else if ('graphQLErrors' in error && Array.isArray(error.graphQLErrors)) {
              console.warn('🔍 GraphQL errors:', error.graphQLErrors);
            } else {
              console.warn('🔍 Unknown error type:', error);
            }
          }
          setConversations([]);
        }

        // Load shop visits if user is authenticated
        console.log('🔍 Loading shop visits for user:', user.userId);
        try {
          const visitsResponse = await client.graphql({
            query: GET_USER_VISITS_QUERY,
            variables: { userId: user.userId }
          });
          console.log('🔍 Shop visits response:', visitsResponse);
          if (visitsResponse.data?.getUserVisits) {
            setShopVisits(visitsResponse.data.getUserVisits);
            console.log('✅ Loaded', visitsResponse.data.getUserVisits.length, 'shop visits');
          }
        } catch (visitsError) {
          console.warn('⚠️ Failed to load shop visits:', visitsError);
          // Don't fail the entire load if shop visits fail
        }

        // Load vehicles if user is authenticated
        console.log('🔍 Loading vehicles for user:', user.userId);
        try {
          const vehiclesResponse = await client.graphql({
            query: GET_USER_VEHICLES_QUERY,
            variables: { userId: user.userId }
          });
          console.log('🔍 Vehicles response:', vehiclesResponse);
          if (vehiclesResponse.data?.getUserVehicles) {
            setVehicles(vehiclesResponse.data.getUserVehicles);
            console.log('✅ Loaded', vehiclesResponse.data.getUserVehicles.length, 'vehicles');
          }
        } catch (vehiclesError) {
          console.warn('⚠️ Failed to load vehicles:', vehiclesError);
          // Don't fail the entire load if vehicles fail
        }
      } else {
        console.log('🔒 No user ID, skipping cost estimates, shop visits, and vehicles load');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Handle specific rate limiting errors
      if (error instanceof Error && error.message.includes('Rate exceeded')) {
        console.warn('⚠️ Rate limit exceeded, will retry later');
        // Set a longer delay before next attempt
        setLastLoadTime(now + 5000); // Add 5 second penalty
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Memoize isAuthenticated to prevent re-renders
  const isAuthenticated = useMemo(() => !!(currentUser && currentUser.userId), [currentUser?.userId]);

  // Memoize menu items to prevent infinite re-renders
  const menuItems = useMemo((): MenuItem[] => {
    console.log('🔍 useMenuData - getMenuItems called');
    console.log('🔍 currentUser:', currentUser);
    console.log('🔍 isAuthenticated:', isAuthenticated);
    
    // If user is not authenticated, show login prompts for most categories
    if (!isAuthenticated) {
      console.log('🔒 Showing login prompts for unauthenticated user');
      const loginPromptCategories = [
        {
          id: 'chat_history',
          title: 'Chat History',
          icon: 'chatbubbles-outline',
          contextIcon: 'chatbubble',
          items: [
            {
              id: 'login_prompt',
              title: 'Sign in to see your chat history',
              description: 'View your previous conversations and diagnostic sessions',
              status: 'login_required',
            }
          ],
        },
        {
          id: 'cost_estimates',
          title: 'Cost Estimates',
          icon: 'receipt-outline',
          contextIcon: 'calculator',
          items: [
            {
              id: 'login_prompt',
              title: 'Sign in to see your cost estimates',
              description: 'Access your repair estimates and pricing information',
              status: 'login_required',
            }
          ],
        },
        {
          id: 'service_history',
          title: 'Service History',
          icon: 'construct-outline',
          contextIcon: 'build',
          items: [
            {
              id: 'login_prompt',
              title: 'Sign in to see your service history',
              description: 'Track your vehicle maintenance and repair records',
              status: 'login_required',
            }
          ],
        },
        {
          id: 'shop_visits',
          title: 'Shop Visits',
          icon: 'location-outline',
          contextIcon: 'location',
          items: [
            {
              id: 'login_prompt',
              title: 'Sign in to see your shop visits',
              description: 'View your recorded shop visits and service appointments',
              status: 'login_required',
            }
          ],
        },
        {
          id: 'my_vehicles',
          title: 'My Vehicles',
          icon: 'car-outline',
          contextIcon: 'car',
          items: [
            {
              id: 'login_prompt',
              title: 'Sign in to see your vehicles',
              description: 'Manage your vehicle information and history',
              status: 'login_required',
            }
          ],
        },
        {
          id: 'mechanics',
          title: 'Preferred Mechanics',
          icon: 'people-outline',
          contextIcon: 'person',
          items: [
            {
              id: 'login_prompt',
              title: 'Sign in to see your preferred mechanics',
              description: 'Access your saved mechanic contacts and reviews',
              status: 'login_required',
            }
          ],
        },
        {
          id: 'reminders',
          title: 'Maintenance Reminders',
          icon: 'alarm-outline',
          contextIcon: 'notifications',
          items: [
            {
              id: 'login_prompt',
              title: 'Sign in to see your maintenance reminders',
              description: 'Set up and manage vehicle maintenance schedules',
              status: 'login_required',
            }
          ],
        },
        {
          id: 'settings',
          title: 'Settings',
          icon: 'settings-outline',
          contextIcon: 'settings',
          items: [
            {
              id: 'sign_in',
              title: 'Sign In',
              description: 'Create an account or sign in to access all features',
              status: 'login_required',
            },
            {
              id: '2',
              title: 'Notification Settings',
              description: 'Configure alerts and reminders',
            },
            {
              id: '3',
              title: 'Privacy Settings',
              description: 'Control your data and privacy',
            },
          ],
        },
        {
          id: 'help_support',
          title: 'Help & Support',
          icon: 'help-circle-outline',
          contextIcon: 'help-circle',
          items: [
            {
              id: '1',
              title: 'Contact Support',
              description: 'Get help from our support team',
            },
            {
              id: '2',
              title: 'User Guide',
              description: 'Learn how to use Dixon Smart Repair',
            },
            {
              id: '3',
              title: 'FAQ',
              description: 'Frequently asked questions',
            },
            {
              id: '4',
              title: 'Report Issue',
              description: 'Report a bug or technical issue',
            },
          ],
        },
      ];

      return loginPromptCategories;
    }

    console.log('✅ Showing real data for authenticated user');
    console.log('✅ User email:', currentUser.email);
    console.log('✅ Conversations count:', conversations.length);
    console.log('✅ Vehicles count:', vehicles.length);

    // For authenticated users, show real data from database
    const chatHistoryItems = conversations
      .filter(conversation => conversation.messages && conversation.messages.length > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(conversation => ({
        id: conversation.id,
        title: conversation.title || 'Automotive Help',
        subtitle: formatDate(conversation.updatedAt),
        description: `${conversation.messages?.length || 0} messages`,
        status: conversation.status === 'active' ? 'active' : 'completed',
      }));

    // Get real cost estimates
    const costEstimateItems = costEstimates
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(estimate => ({
        id: estimate.estimateId,
        title: `${estimate.vehicleInfo?.year || ''} ${estimate.vehicleInfo?.make || ''} ${estimate.vehicleInfo?.model || ''}`.trim() || 'Vehicle Service',
        subtitle: `EST-${estimate.estimateId.slice(-6)}`,
        description: estimate.selectedOption?.replace(/_/g, ' ') || 'Service Estimate',
        value: estimate.breakdown?.total || 0,
        date: formatDate(estimate.createdAt),
        status: estimate.status || 'pending',
      }));

    // Get real shop visits
    const shopVisitItems = shopVisits
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(visit => ({
        id: visit.visitId,
        title: visit.shopName || 'Shop Visit',
        subtitle: visit.serviceType?.replace(/_/g, ' ') || 'Service',
        description: visit.mechanicNotes || `${visit.serviceType} service`,
        date: formatDate(visit.createdAt),
        status: visit.status || 'completed',
        estimatedTime: visit.estimatedServiceTime,
        actualTime: visit.actualServiceTime,
      }));

    // Get real vehicles from GraphQL
    const vehicleItems = vehicles
      .sort((a, b) => {
        const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return dateB - dateA;
      })
      .map(vehicle => ({
        id: vehicle.vehicleId,
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        subtitle: vehicle.trim ? `${vehicle.trim}` : (vehicle.vin ? `VIN: ${vehicle.vin.slice(-6)}` : 'No VIN'),
        description: vehicle.color ? `${vehicle.color}` : 'Vehicle',
        date: vehicle.lastUsed ? formatDate(vehicle.lastUsed) : 'Never used',
        status: 'active',
        mileage: vehicle.mileage,
      }));

    // Mock data for categories we don't have real data for yet
    const serviceHistoryItems = [
      {
        id: '1',
        title: 'No Service History',
        description: 'Service history will appear here after visits',
        status: 'empty',
      },
    ];

    const mechanicItems = [
      {
        id: '1',
        title: 'No Preferred Mechanics',
        description: 'Add mechanics after using our services',
        status: 'empty',
      },
    ];

    const reminderItems = [
      {
        id: '1',
        title: 'No Reminders Set',
        description: 'Maintenance reminders will appear here',
        status: 'empty',
      },
    ];

    const settingsItems = [
      ...(isAuthenticated ? [
        {
          id: 'user_profile',
          title: `Welcome, ${currentUser.email || 'User'}`,
          description: `Signed in as ${currentUser.email}`,
          status: 'authenticated',
        },
        {
          id: 'sign_out',
          title: 'Sign Out',
          description: 'Sign out of your account',
          status: 'sign_out',
        },
      ] : [
        {
          id: 'sign_in',
          title: 'Sign In',
          description: 'Sign in to access all features',
          status: 'login_required',
        },
      ]),
      {
        id: '2',
        title: 'Notification Settings',
        description: 'Configure alerts and reminders',
      },
      {
        id: '3',
        title: 'Privacy Settings',
        description: 'Control your data and privacy',
      },
    ];

    // Add Help & Support as a separate menu item
    const helpSupportItems = [
      {
        id: '1',
        title: 'Contact Support',
        description: 'Get help from our support team',
      },
      {
        id: '2',
        title: 'User Guide',
        description: 'Learn how to use Dixon Smart Repair',
      },
      {
        id: '3',
        title: 'FAQ',
        description: 'Frequently asked questions',
      },
      {
        id: '4',
        title: 'Report Issue',
        description: 'Report a bug or technical issue',
      },
    ];

    return [
      {
        id: 'chat_history',
        title: 'Chat History',
        icon: 'chatbubbles-outline',
        contextIcon: 'chatbubble',
        items: chatHistoryItems.length > 0 ? chatHistoryItems : [
          {
            id: '1',
            title: 'No Chat History',
            description: 'Start a conversation to see your chat history here',
            status: 'empty',
          }
        ],
      },
      {
        id: 'cost_estimates',
        title: 'Cost Estimates',
        icon: 'receipt-outline',
        contextIcon: 'calculator',
        items: costEstimateItems.length > 0 ? costEstimateItems : [
          {
            id: '1',
            title: 'No Cost Estimates',
            description: currentUser ? 'Request a diagnostic to get cost estimates' : 'Sign in to view your cost estimates',
            status: 'empty',
          }
        ],
      },
      {
        id: 'service_history',
        title: 'Service History',
        icon: 'construct-outline',
        contextIcon: 'build',
        items: serviceHistoryItems,
      },
      {
        id: 'shop_visits',
        title: 'Shop Visits',
        icon: 'location-outline',
        contextIcon: 'location',
        items: shopVisitItems.length > 0 ? shopVisitItems : [
          {
            id: '1',
            title: 'No Shop Visits',
            description: 'Visit a shop and scan their QR code to track your visits',
            status: 'empty',
          }
        ],
      },
      {
        id: 'my_vehicles',
        title: 'My Vehicles',
        icon: 'car-outline',
        contextIcon: 'car',
        items: vehicleItems.length > 0 ? vehicleItems : [
          {
            id: '1',
            title: 'No Vehicles Added',
            description: 'Add vehicle information during diagnostics',
            status: 'empty',
          }
        ],
      },
      {
        id: 'mechanics',
        title: 'Preferred Mechanics',
        icon: 'people-outline',
        contextIcon: 'person',
        items: mechanicItems,
      },
      {
        id: 'reminders',
        title: 'Maintenance Reminders',
        icon: 'alarm-outline',
        contextIcon: 'notifications',
        items: reminderItems,
      },
      {
        id: 'settings',
        title: 'Settings',
        icon: 'settings-outline',
        contextIcon: 'settings',
        items: settingsItems,
      },
      {
        id: 'help_support',
        title: 'Help & Support',
        icon: 'help-circle-outline',
        contextIcon: 'help-circle',
        items: helpSupportItems,
      },
    ];
  }, [
    currentUser?.userId, // Only userId, not the whole object
    isAuthenticated, 
    conversations.length, // Database conversations instead of local sessions
    costEstimates.length, // Only length, not the whole array
    shopVisits.length, // Only length, not the whole array
    vehicles.length // Only length, not the whole array
  ]); // Dependencies for useMemo - using lengths to prevent reference changes

  return {
    currentUser,
    costEstimates,
    shopVisits,
    vehicles,
    loading,
    isAuthenticated,
    menuItems, // Use memoized menuItems instead of getMenuItems()
    loadUserData,
    setCostEstimates,
    setShopVisits,
    setVehicles,
    setCurrentUser,
  };
};
