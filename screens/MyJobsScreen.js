import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jobAPI } from '../services/api';

export default function MyJobsScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserAndJobs();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userId) {
        loadJobs(userId);
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  const loadUserAndJobs = async () => {
    try {
      setError(null);
      const userData = await AsyncStorage.getItem('userData');
      
      if (!userData) {
        setError('Please log in to view your jobs');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(userData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setError('Invalid user data. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // More flexible user ID extraction
      const userId = parsed?._id || parsed?.id || parsed?.userId;
      
      if (!userId) {
        console.error('User data structure:', parsed);
        setError('User ID not found. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setUserId(userId);
      await loadJobs(userId);
    } catch (error) {
      console.error('Load error:', error);
      setError('Could not load user data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadJobs = async (freelancerId) => {
    if (!freelancerId) {
      console.error('No freelancer ID provided');
      setJobs([]);
      return;
    }

    try {
      setError(null);
      const response = await jobAPI.getByFreelancer(freelancerId);
      const jobsData = response.data;
      
      if (Array.isArray(jobsData)) {
        setJobs(jobsData);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Load jobs error:', error);
      console.error('Error details:', error.response?.data || error.message);
      setJobs([]);
      
      if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.response?.status === 400) {
        setError('Invalid request. Please try again.');
      } else {
        setError('Could not load jobs');
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndJobs();
  };

  const handleToggleActive = async (jobId, currentStatus) => {
    try {
      await jobAPI.update(jobId, { isActive: !currentStatus });
      if (userId) {
        loadJobs(userId);
      }
    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Error', 'Could not update job status');
    }
  };

  const handleDeleteJob = (jobId, jobTitle) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${jobTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await jobAPI.delete(jobId);
              Alert.alert('Success', 'Job deleted successfully');
              if (userId) {
                loadJobs(userId);
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Could not delete job');
            }
          }
        }
      ]
    );
  };

  const renderJob = ({ item }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobHeaderLeft}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.jobImage} />
          ) : (
            <View style={styles.jobImagePlaceholder}>
              <Ionicons name="briefcase-outline" size={24} color="#666666" />
            </View>
          )}
          <View style={styles.jobHeaderText}>
            <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.jobCategory}>{item.category}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.deleteIcon}
          onPress={() => handleDeleteJob(item._id, item.title)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.jobPrice}>{item.price} DA</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.isActive ? 'rgba(0, 255, 0, 0.15)' : 'rgba(255, 0, 0, 0.15)' }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: item.isActive ? '#00FF00' : '#FF4444' }
          ]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="eye-outline" size={14} color="#888888" />
          <Text style={styles.statText}>{item.views || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="receipt-outline" size={14} color="#888888" />
          <Text style={styles.statText}>{item.orders || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.statText}>{item.averageRating?.toFixed(1) || '0.0'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleToggleActive(item._id, item.isActive)}
        >
          <Ionicons 
            name={item.isActive ? 'eye-off-outline' : 'eye-outline'} 
            size={20} 
            color={item.isActive ? '#FFA500' : '#00FF00'} 
          />
          <Text style={[
            styles.actionText,
            { color: item.isActive ? '#FFA500' : '#00FF00' }
          ]}>
            {item.isActive ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateJob', { jobId: item._id, isEdit: true })}
        >
          <Ionicons name="create-outline" size={20} color="#4499FF" />
          <Text style={[styles.actionText, { color: '#4499FF' }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading your jobs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateJob')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          renderItem={renderJob}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#FFFFFF" 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color="#444444" />
              <Text style={styles.emptyText}>No jobs yet</Text>
              <Text style={styles.emptySubtext}>Create your first job to get started</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateJob')}
              >
                <Ionicons name="add" size={20} color="#000000" />
                <Text style={styles.createButtonText}>Create Job</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000000' 
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a'
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  listContent: { 
    padding: 20,
    paddingBottom: 40,
  },
  jobCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  jobHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  jobHeaderLeft: { 
    flexDirection: 'row', 
    flex: 1 
  },
  jobImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 8, 
    marginRight: 12,
    backgroundColor: '#2a2a2a',
  },
  jobImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobHeaderText: { 
    flex: 1 
  },
  deleteIcon: { 
    padding: 8,
    marginLeft: 8,
  },
  jobTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    marginBottom: 4 
  },
  jobCategory: { 
    fontSize: 12, 
    color: '#888888' 
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  jobPrice: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFD700' 
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: 'bold' 
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: 20, 
    marginBottom: 12 
  },
  stat: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  statText: { 
    fontSize: 13, 
    color: '#888888' 
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a'
  },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
    padding: 12, 
    backgroundColor: '#0a0a0a', 
    borderRadius: 10 
  },
  actionText: { 
    fontSize: 13, 
    color: '#FFFFFF', 
    fontWeight: '600' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 100 
  },
  emptyText: { 
    fontSize: 18, 
    color: '#FFFFFF', 
    fontWeight: '600', 
    marginTop: 16 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#888888', 
    marginTop: 8 
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#000000' 
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});