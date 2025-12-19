import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';

export default function RegisterScreen({ navigation, route }) {
  const { userType } = route.params;
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [idPicture, setIdPicture] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  const fieldsOfWork = [
    'Web Development',
    'Mobile Development',
    'Graphic Design',
    'UI/UX Design',
    'Content Writing',
    'Digital Marketing',
    'Video Editing',
    'Photography',
    'Data Entry',
    'Translation',
    'SEO',
    'Social Media Management',
    'Virtual Assistant',
    'Accounting',
    'Other'
  ];

  const pickProfilePicture = async () => {
    Alert.alert(
      'Upload Profile Picture',
      'Choose how you want to upload your photo',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            setTimeout(async () => {
              try {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission needed', 'Please grant camera permission');
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  allowsMultipleSelection: false,
                  quality: 0.8,
                  base64: true,
                });

                if (!result.canceled) {
                  setProfilePicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
                }
              } catch (error) {
                console.error('Camera error:', error);
                Alert.alert('Error', 'Failed to open camera');
              }
            }, 100);
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            setTimeout(async () => {
              try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission needed', 'Please grant camera roll permission');
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  allowsMultipleSelection: false,
                  quality: 0.8,
                  base64: true,
                });

                if (!result.canceled) {
                  setProfilePicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
                }
              } catch (error) {
                console.error('Gallery error:', error);
                Alert.alert('Error', 'Failed to open gallery');
              }
            }, 100);
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const pickIdPicture = async () => {
    Alert.alert(
      'Upload ID Picture',
      'Choose how you want to upload your ID',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            setTimeout(async () => {
              try {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission needed', 'Please grant camera permission');
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  allowsMultipleSelection: false,
                  quality: 0.8,
                  base64: true,
                });

                if (!result.canceled) {
                  setIdPicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
                }
              } catch (error) {
                console.error('Camera error:', error);
                Alert.alert('Error', 'Failed to open camera');
              }
            }, 100);
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            setTimeout(async () => {
              try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission needed', 'Please grant camera roll permission');
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  allowsMultipleSelection: false,
                  quality: 0.8,
                  base64: true,
                });

                if (!result.canceled) {
                  setIdPicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
                }
              } catch (error) {
                console.error('Gallery error:', error);
                Alert.alert('Error', 'Failed to open gallery');
              }
            }, 100);
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const toggleFieldSelection = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleRegister = async () => {
    if (!name || !username || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone format (Algerian format)
    const phoneRegex = /^(0|\+213)[5-7][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Please enter a valid Algerian phone number (e.g., 0551234567)');
      return;
    }

    if (userType === 'freelancer' && selectedFields.length === 0) {
      Alert.alert('Error', 'Please select at least one field of work');
      return;
    }

    if (userType === 'freelancer' && !idPicture) {
      Alert.alert('Error', 'ID picture is required for freelancers');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name,
        username,
        email: email.toLowerCase(),
        phone,
        password,
        userType,
        profilePicture,
      };

      if (userType === 'freelancer') {
        userData.fieldsOfWork = selectedFields;
        userData.idPicture = idPicture;
      }

      const response = await authAPI.register(userData);

      // Only show payment modal for freelancers
      if (userType === 'freelancer') {
        // Store response data but DON'T save token yet (wait for modal close)
        setRegistrationData(response.data);
        setSuccessModalVisible(true);
      } else {
        // For clients, save token immediately and navigate
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message;
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = async () => {
    setSuccessModalVisible(false);
    
    // NOW save the token and user data after user closes modal
    if (registrationData) {
      await AsyncStorage.setItem('userToken', registrationData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(registrationData.user));
      
      // Navigate to main tabs
      navigation.replace('MainTabs');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up as {userType}</Text>

      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Username *</Text>
      <TextInput
        style={styles.input}
        placeholder="Choose username"
        placeholderTextColor="#666"
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase())}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Phone Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        placeholderTextColor="#666"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Password *</Text>
      <TextInput
        style={styles.input}
        placeholder="Create password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Confirm Password *</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor="#666"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Profile Picture</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={pickProfilePicture}>
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.profilePreview} />
        ) : (
          <>
            <Ionicons name="camera" size={24} color="#FFF" />
            <Text style={styles.uploadText}>Upload Profile Picture</Text>
          </>
        )}
      </TouchableOpacity>

      {userType === 'freelancer' && (
        <>
          <Text style={styles.label}>ID Picture (Mandatory) *</Text>
          <Text style={styles.helperText}>ID verification is required for all freelancers</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickIdPicture}>
            {idPicture ? (
              <View style={styles.idPreviewContainer}>
                <Ionicons name="checkmark-circle" size={30} color="#00FF00" />
                <Text style={styles.uploadText}>ID Uploaded</Text>
              </View>
            ) : (
              <>
                <Ionicons name="card" size={24} color="#FFF" />
                <Text style={styles.uploadText}>Upload ID Picture</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {userType === 'freelancer' && (
        <View style={styles.freelancerSection}>
          <Text style={styles.sectionTitle}>SELECT YOUR FIELDS OF WORK *</Text>
          <View style={styles.fieldsGrid}>
            {fieldsOfWork.map((field) => (
              <TouchableOpacity
                key={field}
                style={[
                  styles.fieldChip,
                  selectedFields.includes(field) && styles.fieldChipSelected
                ]}
                onPress={() => toggleFieldSelection(field)}
              >
                <Text
                  style={[
                    styles.fieldText,
                    selectedFields.includes(field) && styles.fieldTextSelected
                  ]}
                >
                  {field}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{ alignItems: 'center', marginTop: 20, marginBottom: 50 }}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={{ color: '#888' }}>
          Already have an account? <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Sign In</Text>
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={80} color="#FFF" />
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalSubtitle}>Welcome to Freelanci</Text>
            <Text style={styles.modalText}>
              Your account has been created successfully. To activate your account{userType === 'freelancer' ? ' and start offering your services' : ''}, please pay the {userType === 'freelancer' ? 'monthly subscription fee of' : 'registration fee of'} <Text style={styles.boldText}>500 DA</Text> to:
            </Text>
            <View style={styles.ccpBox}>
              <Text style={styles.ccpLabel}>CCP Account</Text>
              <Text style={styles.ccpNumber}>007999999004353702907</Text>
            </View>
            <Text style={styles.modalText}>
              Once your payment is confirmed, your account will be validated within <Text style={styles.boldText}>48 hours</Text>.
            </Text>
            {userType === 'freelancer' && (
              <Text style={styles.warningText}>
                ⚠️ Your account will be automatically disabled after 30 days. Please renew your subscription to continue.
              </Text>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closeSuccessModal}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 20,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    gap: 10,
    marginTop: 5,
  },
  uploadText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  profilePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  idPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  freelancerSection: {
    backgroundColor: '#0a0a0a',
    padding: 20,
    borderRadius: 8,
    marginTop: 30,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFA500',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 1,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  fieldChip: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  fieldChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  fieldText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  fieldTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  selectedCount: {
    marginTop: 10,
    fontSize: 14,
    color: '#00FF00',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginTop: 40,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000',
    borderRadius: 0,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalText: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  ccpBox: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#FFF',
    marginVertical: 20,
    width: '100%',
  },
  ccpLabel: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ccpNumber: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  warningText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  modalButton: {
    backgroundColor: '#FFF',
    borderRadius: 0,
    paddingVertical: 15,
    paddingHorizontal: 50,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});