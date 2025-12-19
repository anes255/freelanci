import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { authAPI } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ email: email.toLowerCase(), password });
      const token = response.data.token;
      const user = response.data.user;
      
      // Store user data and token
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      // Set user role based on email
      if (email.toLowerCase() === 'freelanciapp@gmail.com') {
        await AsyncStorage.setItem('userRole', 'admin');
      } else if (email.toLowerCase() === 'anesgaher3000@gmail.com') {
        await AsyncStorage.setItem('userRole', 'maintenance');
      } else {
        await AsyncStorage.setItem('userRole', 'user');
      }
      
      // App.js will automatically detect the token and navigate
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Invalid credentials';
      
      if (error.response) {
        // Backend responded with error
        if (error.response.status === 403) {
          errorMessage = 'Access denied. This account may not exist in the backend or has incorrect credentials.';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else {
          errorMessage = error.response.data?.error || error.response.data?.message || 'Login failed';
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'Login failed';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animatable.Image
          animation="fadeInDown"
          duration={1000}
          source={require('../assets/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Animatable.View animation="fadeInUp" duration={1000} delay={300} style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('UserType')}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: '80%',
    height: 100,
    alignSelf: 'center',
    marginBottom: 50,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#666666',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
