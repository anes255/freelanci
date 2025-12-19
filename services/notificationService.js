import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://frelanci-backend.onrender.com/api';

// Configure how notifications should be handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
    
    // Save token to backend
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        await axios.post(
          `${API_URL}/notifications/register-token`,
          { pushToken: token },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Add notification listeners
export function addNotificationListeners(navigation) {
  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Handle notification tap
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
    console.log('Notification tapped:', response);
    
    const data = response.notification.request.content.data;
    
    // Get user type to determine which screen to navigate to
    const userData = await AsyncStorage.getItem('userData');
    let userType = 'client'; // default
    if (userData) {
      const parsed = JSON.parse(userData);
      userType = parsed.userType || 'client';
    }
    
    // Navigate based on notification type and user type
    if (data.type === 'order' || data.type === 'message') {
      const screenName = userType === 'freelancer' ? 'OrderDetailFreelancer' : 'OrderDetailClient';
      navigation.navigate(screenName, { orderId: data.orderId });
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

// Send local notification (for testing)
export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Show immediately
  });
}