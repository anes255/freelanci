import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';

export default function FreelancerOnboardingScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Professional Info
  const [selectedFields, setSelectedFields] = useState([]);
  const [profileDescription, setProfileDescription] = useState('');
  const [skills, setSkills] = useState('');

  // Step 3: Payment & Profile
  const [ccp, setCcp] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [idPicture, setIdPicture] = useState('');

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

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !phone || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
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
      
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedFields.length === 0) {
        Alert.alert('Error', 'Please select at least one field of work');
        return;
      }
      if (!profileDescription) {
        Alert.alert('Error', 'Please provide a profile description');
        return;
      }
      setStep(3);
    }
  };

  const handleRegister = async () => {
    if (!ccp) {
      Alert.alert('Error', 'Please provide your CCP account number');
      return;
    }

    if (!idPicture) {
      Alert.alert('Error', 'ID picture is required for freelancers');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        name,
        email: email.toLowerCase(),
        phone,
        password,
        userType: 'freelancer',
        fieldsOfWork: selectedFields,
        profileDescription,
        ccp,
        skills: skills.split(',').map(s => s.trim()).filter(s => s),
        profilePicture,
        idPicture,
      });

      // Store response data but DON'T save token yet
      setRegistrationData(response.data);
      setSuccessModalVisible(true);
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Something went wrong');
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
          </View>
          <Text style={styles.stepText}>Step {step} of 3</Text>
        </View>

        {step === 1 && (
          <Animatable.View animation="fadeInRight" duration={500} style={styles.content}>
            <Text style={styles.title}>Basic Information</Text>
            <Text style={styles.subtitle}>Let's start with the basics</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#666666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#666666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#666666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#666666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#000000" />
            </TouchableOpacity>
          </Animatable.View>
        )}

        {step === 2 && (
          <Animatable.View animation="fadeInRight" duration={500} style={styles.content}>
            <Text style={styles.title}>Professional Info</Text>
            <Text style={styles.subtitle}>Tell us about your expertise</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fields of Work * (Select multiple)</Text>
              <View style={styles.categoriesContainer}>
                {fieldsOfWork.map((field) => (
                  <TouchableOpacity
                    key={field}
                    style={[
                      styles.categoryChip,
                      selectedFields.includes(field) && styles.categoryChipActive
                    ]}
                    onPress={() => toggleFieldSelection(field)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedFields.includes(field) && styles.categoryChipTextActive
                    ]}>
                      {field}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Profile Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your experience, skills, and what you offer..."
                placeholderTextColor="#666666"
                value={profileDescription}
                onChangeText={setProfileDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Skills (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. React, Node.js, MongoDB"
                placeholderTextColor="#666666"
                value={skills}
                onChangeText={setSkills}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(1)}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.buttonTextSecondary}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, { flex: 1, marginLeft: 10 }]}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}

        {step === 3 && (
          <Animatable.View animation="fadeInRight" duration={500} style={styles.content}>
            <Text style={styles.title}>Payment & Profile</Text>
            <Text style={styles.subtitle}>Final step - add your details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Profile Picture</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickProfilePicture}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="camera" size={40} color="#666666" />
                    <Text style={styles.imagePickerText}>Tap to upload photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>ID Picture (Mandatory) *</Text>
              <TouchableOpacity style={styles.idUploadButton} onPress={pickIdPicture}>
                {idPicture ? (
                  <View style={styles.idUploadedContainer}>
                    <Ionicons name="checkmark-circle" size={30} color="#00FF00" />
                    <Text style={styles.idUploadedText}>ID Uploaded</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="card" size={30} color="#666666" />
                    <Text style={styles.idUploadText}>Upload ID Picture</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.helperText}>
                ID verification is required for all freelancers
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CCP Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your CCP account number"
                placeholderTextColor="#666666"
                value={ccp}
                onChangeText={setCcp}
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                This will be used for payment processing
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(2)}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.buttonTextSecondary}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, { flex: 1, marginLeft: 10 }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Complete</Text>
                    <Ionicons name="checkmark" size={20} color="#000000" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
              Your freelancer account has been created successfully. To activate your account and start offering your services, please pay the monthly subscription fee of <Text style={styles.boldText}>500 DA</Text> to:
            </Text>
            <View style={styles.ccpBox}>
              <Text style={styles.ccpLabel}>CCP Account</Text>
              <Text style={styles.ccpNumber}>007999999004353702907</Text>
            </View>
            <Text style={styles.modalText}>
              Once your payment is confirmed, your account will be validated within <Text style={styles.boldText}>48 hours</Text>.
            </Text>
            <Text style={styles.warningText}>
              ⚠️ Your account will be automatically disabled after 30 days. Please renew your subscription to continue offering services.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closeSuccessModal}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#FFFFFF',
  },
  stepText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '600',
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
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  categoryChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  categoryChipTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  selectedCount: {
    marginTop: 10,
    fontSize: 14,
    color: '#00FF00',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  idUploadButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
  },
  idUploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  idUploadedText: {
    fontSize: 16,
    color: '#00FF00',
    fontWeight: 'bold',
  },
  idUploadText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    flex: 1,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonTextSecondary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
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