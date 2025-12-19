import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../services/api';

export default function AdminDashboard({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Fetch users error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Could not fetch users';
      Alert.alert('Error', `Failed to fetch users: ${errorMsg}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await adminAPI.approveUser(userId);
      Alert.alert('Success', 'Freelancer approved');
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'Could not approve user');
    }
  };

  const handleDelete = async (userId) => {
    Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminAPI.deleteUser(userId);
            Alert.alert('Success', 'User deleted');
            fetchUsers();
          } catch (error) {
            Alert.alert('Error', 'Could not delete user');
          }
        }
      }
    ]);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    navigation.replace('Login');
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'freelancers') return user.userType === 'freelancer';
    if (filter === 'clients') return user.userType === 'client';
    if (filter === 'pending') return user.userType === 'freelancer' && !user.isApproved;
    return true;
  });

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.username && (
            <Text style={styles.userUsername}>@{item.username}</Text>
          )}
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.phone && (
            <Text style={styles.userPhone}>📞 {item.phone}</Text>
          )}
          <View style={styles.badges}>
            <View style={[styles.badge, item.userType === 'freelancer' ? styles.badgeFreelancer : styles.badgeClient]}>
              <Text style={styles.badgeText}>{item.userType}</Text>
            </View>
            {item.userType === 'freelancer' && (
              <View style={[styles.badge, item.isApproved ? styles.badgeApproved : styles.badgePending]}>
                <Text style={styles.badgeText}>{item.isApproved ? 'Approved' : 'Pending'}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          {item.userType === 'freelancer' && !item.isApproved && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleApprove(item._id)}>
              <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item._id)}>
            <Ionicons name="trash" size={24} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Freelancer Details */}
      {item.userType === 'freelancer' && (
        <View style={styles.freelancerDetails}>
          {item.fieldsOfWork && item.fieldsOfWork.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Fields of Work:</Text>
              <View style={styles.fieldsWrap}>
                {item.fieldsOfWork.map((field, index) => (
                  <View key={index} style={styles.fieldTag}>
                    <Text style={styles.fieldTagText}>{field}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {item.idPicture && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Algerian ID Picture:</Text>
              <Image 
                source={{ uri: item.idPicture }}
                style={styles.idImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Joined:</Text>
              <Text style={styles.detailValue}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {item.rating > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Rating:</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {item.rating.toFixed(1)} ({item.totalRatings})
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Client Details */}
      {item.userType === 'client' && (
        <View style={styles.clientDetails}>
          <Text style={styles.detailLabel}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return <View style={[styles.container, styles.centerContent]}><ActivityIndicator size="large" color="#FFFFFF" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('AdminSupport')} style={styles.supportButton}>
            <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AdminAnalytics')} style={styles.analyticsButton}>
            <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filters}>
        {['all', 'freelancers', 'clients', 'pending'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#FFFFFF" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#666666" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  supportButton: { padding: 8, borderRadius: 8, backgroundColor: '#1a1a1a' },
  analyticsButton: { padding: 8, borderRadius: 8, backgroundColor: '#1a1a1a' },
  filters: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 10 },
  filterChip: { backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  filterChipActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  filterText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  filterTextActive: { color: '#000000' },
  listContent: { padding: 20 },
  userCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  userUsername: { fontSize: 13, color: '#888888', marginBottom: 4, fontWeight: '500' },
  userEmail: { fontSize: 13, color: '#666666', marginBottom: 4 },
  userPhone: { fontSize: 13, color: '#4CAF50', marginBottom: 8, fontWeight: '500' },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeFreelancer: { backgroundColor: '#4169E130' },
  badgeClient: { backgroundColor: '#32CD3230' },
  badgeApproved: { backgroundColor: '#00FF0030' },
  badgePending: { backgroundColor: '#FFA50030' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { padding: 6, width: 36, height: 36, borderRadius: 8, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  freelancerDetails: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  clientDetails: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  detailSection: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', gap: 20 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#888888', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '500' },
  fieldsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fieldTag: { backgroundColor: '#0a0a0a', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#2a2a2a' },
  fieldTagText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  idImage: { width: '100%', height: 200, borderRadius: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginTop: 16 },
});