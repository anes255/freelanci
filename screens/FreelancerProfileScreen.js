import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userAPI, jobAPI } from '../services/api';

export default function FreelancerProfileScreen({ route, navigation }) {
  const { freelancerId } = route.params;
  const [freelancer, setFreelancer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFreelancer();
    fetchJobs();
  }, []);

  const fetchFreelancer = async () => {
    try {
      const response = await userAPI.getFreelancer(freelancerId);
      setFreelancer(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getByFreelancer(freelancerId);
      setJobs(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={[styles.container, styles.centerContent]}><ActivityIndicator size="large" color="#FFFFFF" /></View>;
  }

  if (!freelancer) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {freelancer.profilePicture ? (
          <Image source={{ uri: freelancer.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}><Ionicons name="person" size={50} color="#666666" /></View>
        )}
        <Text style={styles.name}>{freelancer.name}</Text>
        <Text style={styles.field}>{freelancer.fieldOfWork}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.statText}>{freelancer.rating || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="briefcase" size={20} color="#FFFFFF" />
            <Text style={styles.statText}>{freelancer.completedJobs} jobs</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{freelancer.profileDescription}</Text>
      </View>

      {freelancer.skills && freelancer.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {freelancer.skills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jobs ({jobs.length})</Text>
        {jobs.map((job) => (
          <TouchableOpacity
            key={job._id}
            style={styles.jobCard}
            onPress={() => navigation.navigate('JobDetail', { jobId: job._id })}
          >
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobPrice}>{job.price} DA</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 30, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  field: { fontSize: 16, color: '#666666', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 16, color: '#FFFFFF', marginLeft: 8, fontWeight: '600' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  description: { fontSize: 16, color: '#FFFFFF', lineHeight: 24 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  skillChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  skillText: { fontSize: 14, color: '#FFFFFF' },
  jobCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { fontSize: 16, color: '#FFFFFF', flex: 1 },
  jobPrice: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});
