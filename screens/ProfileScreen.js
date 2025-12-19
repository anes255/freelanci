import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { userAPI, orderAPI } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const userRole = await AsyncStorage.getItem('userRole');
      setUser({ ...response.data, role: userRole });
      
      // Fetch stats
      const ordersResponse = await orderAPI.getMy();
      const orders = ordersResponse.data;
      
      setStats({
        totalOrders: orders.length,
        activeOrders: orders.filter(o => o.status === 'in_progress').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('userRole');
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
      }
    ]);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  if (!user) return null;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        {user.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={50} color="#666666" />
          </View>
        )}
        <Text style={styles.name}>{user.name}</Text>
        {user.username && <Text style={styles.username}>@{user.username}</Text>}
        
        {user.userType === 'freelancer' && (
          <>
            <View style={[styles.badge, user.isApproved ? styles.badgeApproved : styles.badgePending]}>
              <Text style={styles.badgeText}>
                {user.isApproved ? '✓ Approved Freelancer' : '⏳ Pending Approval'}
              </Text>
            </View>
            
            {user.rating > 0 && (
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {renderStars(user.rating)}
                </View>
                <Text style={styles.ratingText}>
                  {user.rating.toFixed(1)} ({user.totalRatings || 0} reviews)
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="mail-outline" size={20} color="#888888" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        {user.phone && (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={20} color="#888888" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="person-outline" size={20} color="#888888" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>
              {user.userType === 'freelancer' ? 'Freelancer' : 'Client'}
            </Text>
          </View>
        </View>

        {user.fieldsOfWork && user.fieldsOfWork.length > 0 && (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="briefcase-outline" size={20} color="#888888" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fields of Work</Text>
              <View style={styles.fieldsWrap}>
                {user.fieldsOfWork.map((field, index) => (
                  <View key={index} style={styles.fieldTag}>
                    <Text style={styles.fieldTagText}>{field}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {user.fieldOfWork && (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="briefcase-outline" size={20} color="#888888" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Field of Work</Text>
              <Text style={styles.infoValue}>{user.fieldOfWork}</Text>
            </View>
          </View>
        )}

        {user.ccp && (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="card-outline" size={20} color="#888888" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>CCP Account</Text>
              <Text style={styles.infoValue}>{user.ccp}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="calendar-outline" size={20} color="#888888" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.activeOrders}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedOrders}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {user.userType === 'freelancer' && (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{user.completedJobs || 0}</Text>
                <Text style={styles.statLabel}>Jobs Done</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{user.totalRatings || 0}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Skills Section */}
      {user.skills && user.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {user.skills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Profile Description */}
      {user.profileDescription && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{user.profileDescription}</Text>
        </View>
      )}

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {/* Admin Panel Access */}
        {user.role === 'admin' && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
            <Text style={styles.menuItemText}>Admin Dashboard</Text>
            <Ionicons name="chevron-forward" size={24} color="#666666" />
          </TouchableOpacity>
        )}

        {/* Maintenance Panel Access */}
        {user.role === 'maintenance' && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Maintenance')}
          >
            <Ionicons name="construct" size={24} color="#FFFFFF" />
            <Text style={styles.menuItemText}>Maintenance Panel</Text>
            <Ionicons name="chevron-forward" size={24} color="#666666" />
          </TouchableOpacity>
        )}

        {user.userType === 'freelancer' && user.isApproved && (
          <>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('CreateJob')}
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text style={styles.menuItemText}>Create New Job Post</Text>
              <Ionicons name="chevron-forward" size={24} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('MyJobs')}
            >
              <Ionicons name="briefcase" size={24} color="#FFFFFF" />
              <Text style={styles.menuItemText}>My Jobs</Text>
              <Ionicons name="chevron-forward" size={24} color="#666666" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('PublicProfile', { userId: user._id })}
        >
          <Ionicons name="eye-outline" size={24} color="#FFFFFF" />
          <Text style={styles.menuItemText}>View Public Profile</Text>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Support')}
        >
          <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
          <Text style={styles.menuItemText}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#FF0000" />
          <Text style={[styles.menuItemText, { color: '#FF0000' }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  username: { fontSize: 14, color: '#666666', marginBottom: 12 },
  email: { fontSize: 14, color: '#666666', marginBottom: 12 },
  badge: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  badgeApproved: { backgroundColor: '#00FF0030', borderWidth: 1, borderColor: '#00FF00' },
  badgePending: { backgroundColor: '#FFA50030', borderWidth: 1, borderColor: '#FFA500' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  ratingContainer: { marginTop: 12, alignItems: 'center' },
  stars: { flexDirection: 'row', marginBottom: 4 },
  ratingText: { fontSize: 14, color: '#888888' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  infoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#666666', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  statCard: { width: '50%', padding: 6 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  statLabel: { fontSize: 12, color: '#666666', textAlign: 'center', marginTop: 4 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  skillChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  skillText: { color: '#FFFFFF', fontSize: 14 },
  fieldsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  fieldTag: { backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#333' },
  fieldTagText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  description: { fontSize: 14, color: '#CCCCCC', lineHeight: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#0a0a0a', marginBottom: 8 },
  menuItemText: { flex: 1, fontSize: 16, color: '#FFFFFF', marginLeft: 12, fontWeight: '500' },
});