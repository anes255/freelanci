import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobAPI, orderAPI } from '../services/api';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJob();
  }, []);

  const fetchJob = async () => {
    try {
      const response = await jobAPI.getById(jobId);
      setJob(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load job details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    Alert.alert('Order Job', 'Do you want to order this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Order',
        onPress: async () => {
          try {
            await orderAPI.create({ jobId: job._id });
            Alert.alert('Success', 'Job ordered successfully!');
            navigation.navigate('Orders');
          } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Could not create order');
          }
        }
      }
    ]);
  };

  if (loading) {
    return <View style={[styles.container, styles.centerContent]}><ActivityIndicator size="large" color="#FFFFFF" /></View>;
  }

  if (!job) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('FreelancerProfile', { freelancerId: job.freelancerId._id })}>
          {job.freelancerId.profilePicture ? (
            <Image source={{ uri: job.freelancerId.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={40} color="#666666" /></View>
          )}
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.freelancerName}>{job.freelancerId.name}</Text>
          {job.freelancerId.rating > 0 && (
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{job.freelancerId.rating}</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.category}>{job.category}</Text>
      <Text style={styles.description}>{job.description}</Text>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={20} color="#FFFFFF" />
          <Text style={styles.infoText}>{job.deliveryTime} days delivery</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="eye" size={20} color="#FFFFFF" />
          <Text style={styles.infoText}>{job.views} views</Text>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Price</Text>
        <Text style={styles.price}>{job.price} DA</Text>
      </View>

      <TouchableOpacity style={styles.orderButton} onPress={handleOrder}>
        <Text style={styles.orderButtonText}>Order Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerText: { flex: 1 },
  freelancerName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 14, color: '#FFD700', marginLeft: 4, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', padding: 20, paddingBottom: 10 },
  category: { fontSize: 14, color: '#666666', paddingHorizontal: 20, marginBottom: 10 },
  description: { fontSize: 16, color: '#FFFFFF', lineHeight: 24, padding: 20 },
  infoRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  infoText: { fontSize: 14, color: '#FFFFFF', marginLeft: 8 },
  priceContainer: { backgroundColor: '#1a1a1a', padding: 20, marginHorizontal: 20, borderRadius: 16, marginBottom: 20 },
  priceLabel: { fontSize: 14, color: '#666666', marginBottom: 4 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  orderButton: { backgroundColor: '#FFFFFF', margin: 20, padding: 18, borderRadius: 16, alignItems: 'center' },
  orderButtonText: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
});
