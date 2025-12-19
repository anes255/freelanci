import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications, addNotificationListeners } from './services/notificationService';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import UserTypeScreen from './screens/UserTypeScreen';
import FreelancerOnboardingScreen from './screens/FreelancerOnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';
import JobDetailScreen from './screens/JobDetailScreen';
import FreelancerProfileScreen from './screens/FreelancerProfileScreen';
import CreateJobScreen from './screens/CreateJobScreen';
import AdminDashboard from './screens/AdminDashboard';
import AdminAnalytics from './screens/AdminAnalytics';
import AdminSupportScreen from './screens/AdminSupportScreen';
import MaintenanceScreen from './screens/MaintenanceScreen';
import SupportScreen from './screens/SupportScreen';
import PublicProfileScreen from './screens/PublicProfileScreen';
import RateFreelancerScreen from './screens/RateFreelancerScreen';
import OrderDetailScreenFreelancer from './screens/OrderDetailScreenFreelancer';
import OrderDetailScreenClient from './screens/OrderDetailScreenClient';
import MyJobsScreen from './screens/MyJobsScreen';
import EditProfileScreen from './screens/EditProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigationRef = React.useRef();

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      setUserToken(token);
      setUserRole(role);
    } catch (error) {
      console.error('Error checking token:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 2500); // Show splash for 2.5 seconds
    }
  };

  // Listen for login/logout events with improved state management
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');
        
        // Update state if token changed
        if (token !== userToken) {
          setUserToken(token);
          setUserRole(role);
          
          // Register for push notifications when user logs in
          if (token) {
            registerForPushNotifications();
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    const interval = setInterval(checkAuthState, 500);
    return () => clearInterval(interval);
  }, [userToken]);

  // Setup notification listeners
  useEffect(() => {
    if (userToken && navigationRef.current) {
      const cleanup = addNotificationListeners(navigationRef.current);
      return cleanup;
    }
  }, [userToken]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: true,
        colors: {
          primary: '#FFFFFF',
          background: '#000000',
          card: '#000000',
          text: '#FFFFFF',
          border: '#1a1a1a',
          notification: '#FFFFFF',
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000000',
            borderBottomColor: '#1a1a1a',
            borderBottomWidth: 1,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {userToken === null ? (
          <>
            {/* First-time users see sign up flow */}
            <Stack.Screen 
              name="UserType" 
              component={UserTypeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="FreelancerOnboarding" 
              component={FreelancerOnboardingScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            {/* Main Tabs - accessible by all authenticated users */}
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            
            {/* Admin Dashboard - only for admin role */}
            {userRole === 'admin' && (
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminDashboard}
                options={{ 
                  title: 'Admin Dashboard',
                }}
              />
            )}
            
            {/* Admin Analytics - accessible from admin dashboard */}
            <Stack.Screen 
              name="AdminAnalytics" 
              component={AdminAnalytics}
              options={{ 
                headerShown: false
              }}
            />
            
            {/* Maintenance Panel - only for maintenance role */}
            {userRole === 'maintenance' && (
              <Stack.Screen 
                name="Maintenance" 
                component={MaintenanceScreen}
                options={{ 
                  title: 'Maintenance Panel',
                }}
              />
            )}
            
            {/* Additional screens accessible by all */}
            <Stack.Screen 
              name="JobDetail" 
              component={JobDetailScreen}
              options={{ title: 'Job Details' }}
            />
            <Stack.Screen 
              name="FreelancerProfile" 
              component={FreelancerProfileScreen}
              options={{ title: 'Freelancer Profile' }}
            />
            <Stack.Screen 
              name="PublicProfile" 
              component={PublicProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen 
              name="RateFreelancer" 
              component={RateFreelancerScreen}
              options={{ title: 'Rate Freelancer' }}
            />
            <Stack.Screen 
              name="OrderDetailFreelancer" 
              component={OrderDetailScreenFreelancer}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="OrderDetailClient" 
              component={OrderDetailScreenClient}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreateJob" 
              component={CreateJobScreen}
              options={{ title: 'Create New Job' }}
            />
            <Stack.Screen 
              name="MyJobs" 
              component={MyJobsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Support" 
              component={SupportScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AdminSupport" 
              component={AdminSupportScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}