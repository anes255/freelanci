import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

export default function UserTypeScreen({ navigation }) {
  const handleUserType = (type) => {
    if (type === 'freelancer') {
      navigation.navigate('FreelancerOnboarding');
    } else {
      navigation.navigate('Register', { userType: type });
    }
  };

  return (
    <View style={styles.container}>
      <Animatable.Image
        animation="fadeInDown"
        duration={1000}
        source={require('../assets/logo-transparent.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Animatable.View animation="fadeInUp" duration={1000} delay={300} style={styles.content}>
        <Text style={styles.title}>Join Freelanci</Text>
        <Text style={styles.subtitle}>Choose your account type</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handleUserType('client')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>I'm a Client</Text>
            <Text style={styles.cardDescription}>
              Hire talented freelancers for your projects
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handleUserType('freelancer')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="briefcase" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>I'm a Freelancer</Text>
            <Text style={styles.cardDescription}>
              Offer your services and earn money
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backButtonText}>
            Already have an account? <Text style={styles.backButtonTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logo: {
    width: '70%',
    height: 80,
    alignSelf: 'center',
    marginBottom: 40,
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#2a2a2a',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
  },
  backButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666666',
    fontSize: 14,
  },
  backButtonTextBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
