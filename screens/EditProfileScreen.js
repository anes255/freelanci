import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { userAPI } from '../services/api';

export default function EditProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [profileDescription, setProfileDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fieldsOfWork = [
    'Web Development',
    'Mobile Development',
    'Graphic Design',
    'UI/UX Design',
    'Content Writing',
    'Digital Marketing',
    'Video Editing',
    'Translation',
    'Data Entry',
    'SEO',
    'Social Media Management',
    'Photography',
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setName(parsedUser.name || '');
        setUsername(parsedUser.username || '');
        setEmail(parsedUser.email || '');
        setPhone(parsedUser.phone || '');
        setProfilePicture(parsedUser.profilePicture || null);
        setSelectedFields(parsedUser.fieldsOfWork || []);
        setProfileDescription(parsedUser.profileDescription || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const toggleField = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const pickProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        setProfilePicture(base64);
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };

  const handleSave = async () => {
    if (!name || !username || !email || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name,
        username,
        email: email.toLowerCase(),
        phone,
        profilePicture,
      };

      if (user.userType === 'freelancer') {
        updateData.fieldsOfWork = selectedFields;
        updateData.profileDescription = profileDescription;
      }

      const response = await userAPI.updateProfile(updateData);

      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Picture */}
        <View style={styles.avatarSection}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#666" />
            </View>
          )}
          <TouchableOpacity style={styles.changePictureButton} onPress={pickProfilePicture}>
            <Ionicons name="camera" size={20} color="#FFF" />
            <Text style={styles.changePictureText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        {/* Username */}
        <Text style={styles.label}>Username *</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase())}
          autoCapitalize="none"
        />

        {/* Email */}
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Phone */}
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#666"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Freelancer Only Fields */}
        {user.userType === 'freelancer' && (
          <>
            {/* Fields of Work */}
            <Text style={styles.label}>Fields of Work</Text>
            <View style={styles.fieldsGrid}>
              {fieldsOfWork.map((field) => (
                <TouchableOpacity
                  key={field}
                  style={[
                    styles.fieldChip,
                    selectedFields.includes(field) && styles.fieldChipSelected
                  ]}
                  onPress={() => toggleField(field)}
                >
                  <Text style={[
                    styles.fieldText,
                    selectedFields.includes(field) && styles.fieldTextSelected
                  ]}>
                    {field}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Profile Description */}
            <Text style={styles.label}>Profile Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell clients about yourself..."
              placeholderTextColor="#666"
              value={profileDescription}
              onChangeText={setProfileDescription}
              multiline
              numberOfLines={4}
            />
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
  },
  changePictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  changePictureText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  fieldChip: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  fieldChipSelected: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  fieldText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  fieldTextSelected: {
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});