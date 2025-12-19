import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jobAPI } from '../services/api';

export default function CreateJobScreen({ navigation, route }) {
  const { jobId, isEdit } = route.params || {};
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(isEdit);
  const [isApproved, setIsApproved] = useState(true);

  const categories = ['Web Development', 'Mobile Development', 'Graphic Design', 'UI/UX Design', 'Content Writing', 'Digital Marketing', 'Video Editing', 'Photography', 'Data Entry', 'Translation'];

  useEffect(() => {
    checkApprovalStatus();
    if (isEdit && jobId) {
      loadJobData();
    }
  }, [isEdit, jobId]);

  const checkApprovalStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.userType === 'freelancer' && !user.isApproved) {
          setIsApproved(false);
        }
      }
    } catch (error) {
      console.error('Error checking approval:', error);
    }
  };

  const loadJobData = async () => {
    try {
      const response = await jobAPI.getById(jobId);
      const job = response.data;
      
      setTitle(job.title || '');
      setDescription(job.description || '');
      setCategory(job.category || '');
      setPrice(job.price?.toString() || '');
      setDeliveryTime(job.deliveryTime?.toString() || '');
      setThumbnails(job.thumbnails || job.images || []);
    } catch (error) {
      console.error('Error loading job:', error);
      Alert.alert('Error', 'Could not load job data');
    } finally {
      setLoadingJob(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permission');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const newThumbnails = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
        setThumbnails([...thumbnails, ...newThumbnails].slice(0, 5));
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const removeThumbnail = (index) => {
    setThumbnails(thumbnails.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !category || !price || !deliveryTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (thumbnails.length === 0) {
      Alert.alert('Error', 'Please add at least one thumbnail of your work');
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        title,
        description,
        category,
        price: parseFloat(price),
        deliveryTime: parseInt(deliveryTime),
        thumbnails,
        images: thumbnails,
      };

      if (isEdit && jobId) {
        await jobAPI.update(jobId, jobData);
        Alert.alert('Success', 'Job updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await jobAPI.create(jobData);
        Alert.alert('Success', 'Job posted successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.response?.data?.error || `Could not ${isEdit ? 'update' : 'create'} job`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingJob) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading job...</Text>
      </View>
    );
  }

  if (!isApproved) {
    return (
      <View style={styles.container}>
        <View style={styles.notApprovedContainer}>
          <Ionicons name="lock-closed" size={64} color="#FFF" />
          <Text style={styles.notApprovedTitle}>Account Not Approved</Text>
          <Text style={styles.notApprovedMessage}>
            You are not approved yet. Please pay the subscription fee or contact the support team.
          </Text>
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={() => navigation.navigate('Support')}
          >
            <Ionicons name="chatbubbles" size={20} color="#000" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{isEdit ? 'Edit Job Post' : 'Create New Job Post'}</Text>
      <Text style={styles.subtitle}>{isEdit ? 'Update your job details' : 'Share your services with clients'}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. I will design a modern website"
          placeholderTextColor="#666666"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what you will deliver, your expertise, and what makes your service unique..."
          placeholderTextColor="#666666"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Price (DA) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#666666"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Delivery (days) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#666666"
            value={deliveryTime}
            onChangeText={setDeliveryTime}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Thumbnails of Your Work * (Max 5)</Text>
        <Text style={styles.helperText}>Show examples of your previous work</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
          {thumbnails.map((thumb, index) => (
            <View key={index} style={styles.thumbnailContainer}>
              <Image source={{ uri: thumb }} style={styles.thumbnail} />
              <TouchableOpacity 
                style={styles.removeThumbnail}
                onPress={() => removeThumbnail(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ))}
          
          {thumbnails.length < 5 && (
            <TouchableOpacity style={styles.addThumbnail} onPress={pickImage}>
              <Ionicons name="add-circle-outline" size={40} color="#FFFFFF" />
              <Text style={styles.addText}>Add Image</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.buttonText}>{isEdit ? 'Update Job' : 'Post Job'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', padding: 20 },
  loadingContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', fontSize: 16, marginTop: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4, marginTop: 10 },
  subtitle: { fontSize: 14, color: '#888888', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: '#FFFFFF', marginBottom: 8, fontWeight: '600' },
  helperText: { fontSize: 12, color: '#666666', marginBottom: 8 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#2a2a2a' },
  textArea: { height: 120, paddingTop: 16 },
  categoriesScroll: { marginTop: 8 },
  categoriesContainer: { flexDirection: 'row' },
  categoryChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  categoryChipActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  categoryChipText: { fontSize: 14, color: '#FFFFFF' },
  categoryChipTextActive: { color: '#000000', fontWeight: '600' },
  row: { flexDirection: 'row' },
  thumbnailScroll: { marginTop: 8 },
  thumbnailContainer: { marginRight: 12, position: 'relative' },
  thumbnail: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#1a1a1a' },
  removeThumbnail: { position: 'absolute', top: -8, right: -8, backgroundColor: '#000000', borderRadius: 12 },
  addThumbnail: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#2a2a2a', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addText: { color: '#FFFFFF', fontSize: 12, marginTop: 4 },
  button: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  buttonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  notApprovedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  notApprovedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 12,
  },
  notApprovedMessage: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  supportButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#888',
    fontSize: 14,
  },
});