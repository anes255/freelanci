import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI, jobAPI, orderAPI, ratingAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function PublicProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserType, setCurrentUserType] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadProfile();
    loadCurrentUser();
  }, [userId]);

  const loadCurrentUser = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      setCurrentUserId(parsed._id);
      setCurrentUserType(parsed.userType);
      
      // Check rating eligibility for all users, not just clients
      if (parsed._id !== userId) {
        checkRatingEligibility(parsed._id);
      }
    }
  };

  const checkRatingEligibility = async (clientId) => {
    try {
      // Check if client can rate this freelancer from profile
      const canRateResponse = await ratingAPI.canRateFromProfile(userId);
      
      if (canRateResponse.data.canRate) {
        setCanRate(true);
        
        // Also get completed orders for context (optional)
        try {
          const response = await orderAPI.getMy();
          const orders = response.data;
          
          const eligibleOrders = orders.filter(order => 
            order.freelancerId._id === userId && 
            order.status === 'completed' && 
            !order.isRated &&
            order.paymentApproved
          );
          
          setCompletedOrders(eligibleOrders);
        } catch (error) {
          // Orders are optional, just set empty array
          setCompletedOrders([]);
        }
      }
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await userAPI.getPublicProfile(userId);
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateClick = () => {
    // Direct navigation to rating screen, with or without orderId
    navigation.navigate('RateFreelancer', {
      orderId: completedOrders.length > 0 ? completedOrders[0]._id : null,
      freelancerId: userId,
      freelancerName: profile.user.name
    });
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setSubmittingRating(true);
    try {
      await ratingAPI.rate({
        orderId: selectedOrder._id,
        freelancerId: userId,
        rating,
        review,
      });
      
      Alert.alert('Success', 'Thank you for your feedback!');
      setShowRatingModal(false);
      setRating(0);
      setReview('');
      setSelectedOrder(null);
      
      loadProfile();
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        checkRatingEligibility(parsed._id);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderStars = (ratingValue) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(ratingValue) ? 'star' : i - 0.5 <= ratingValue ? 'star-half' : 'star-outline'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderInteractiveStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => setRating(star)}
        style={styles.starButton}
      >
        <Ionicons
          name={star <= rating ? 'star' : 'star-outline'}
          size={48}
          color={star <= rating ? '#FFD700' : '#666666'}
        />
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const { user, jobs, ratings, stats } = profile;
  const isFreelancer = user.userType === 'freelancer';
  const isOwnProfile = currentUserId === userId;
  const showRateButton = isFreelancer && !isOwnProfile && canRate;

  return (
    <View style={styles.container}>
    <ScrollView style={styles.scrollView}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: user.profilePicture || 'https://via.placeholder.com/100' }} 
          style={styles.profilePicture}
        />
        <Text style={styles.name}>{user.name}</Text>
        {user.username && <Text style={styles.username}>@{user.username}</Text>}
        
        {isFreelancer && user.fieldsOfWork && user.fieldsOfWork.length > 0 && (
          <View style={styles.fieldsContainer}>
            {user.fieldsOfWork.map((field, index) => (
              <View key={index} style={styles.fieldChip}>
                <Text style={styles.fieldChipText}>{field}</Text>
              </View>
            ))}
          </View>
        )}

        {isFreelancer && user.fieldOfWork && (
          <Text style={styles.fieldOfWork}>{user.fieldOfWork}</Text>
        )}

        {isFreelancer && (
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(user.rating || 0)}
            </View>
            <Text style={styles.ratingText}>
              {(user.rating || 0).toFixed(1)} ({user.totalRatings || 0} reviews)
            </Text>
          </View>
        )}

        {user.profileDescription && (
          <Text style={styles.description}>{user.profileDescription}</Text>
        )}

        {showRateButton && (
          <TouchableOpacity style={styles.rateButton} onPress={handleRateClick}>
            <Ionicons name="star" size={20} color="#000000" />
            <Text style={styles.rateButtonText}>Rate This Freelancer</Text>
          </TouchableOpacity>
        )}
      </View>

      {isFreelancer && stats && (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalJobs || 0}</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completedJobs || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalRatings || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* Rating Breakdown */}
          {user.ratingBreakdown && user.totalRatings > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating Breakdown</Text>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = user.ratingBreakdown[`${['five', 'four', 'three', 'two', 'one'][5 - star]}Star`] || 0;
                const percentage = user.totalRatings > 0 ? (count / user.totalRatings) * 100 : 0;
                
                return (
                  <View key={star} style={styles.ratingRow}>
                    <Text style={styles.ratingRowText}>{star}★</Text>
                    <View style={styles.ratingBar}>
                      <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.ratingRowCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Skills */}
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

          {/* Jobs/Services */}
          {jobs && jobs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services ({jobs.length})</Text>
              {jobs.map((job) => (
                <TouchableOpacity
                  key={job._id}
                  style={styles.jobCard}
                  onPress={() => navigation.navigate('JobDetail', { jobId: job._id })}
                >
                  {job.thumbnails && job.thumbnails.length > 0 && (
                    <Image source={{ uri: job.thumbnails[0] }} style={styles.jobThumbnail} />
                  )}
                  <View style={styles.jobContent}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobCategory}>{job.category}</Text>
                    <View style={styles.jobFooter}>
                      <Text style={styles.jobPrice}>{job.price} DA</Text>
                      <View style={styles.jobMeta}>
                        <Ionicons name="time-outline" size={14} color="#888888" />
                        <Text style={styles.jobMetaText}>{job.deliveryTime} days</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Reviews */}
          {ratings && ratings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Reviews</Text>
              {ratings.slice(0, 5).map((rating, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image 
                      source={{ uri: rating.clientId?.profilePicture || 'https://via.placeholder.com/40' }}
                      style={styles.reviewerPhoto}
                    />
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{rating.clientId?.name || 'Anonymous'}</Text>
                      <View style={styles.reviewStars}>
                        {renderStars(rating.rating)}
                      </View>
                    </View>
                  </View>
                  {rating.review && (
                    <Text style={styles.reviewText}>{rating.review}</Text>
                  )}
                  <Text style={styles.reviewDate}>
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>

    {/* Rating Modal */}
    <Modal
      visible={showRatingModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRatingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.modalClose}
            onPress={() => setShowRatingModal(false)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Rate Your Experience</Text>
          <Text style={styles.modalSubtitle}>with {user.name}</Text>

          {selectedOrder && (
            <Text style={styles.modalOrderInfo}>
              Order: {selectedOrder.jobId.title}
            </Text>
          )}

          <View style={styles.ratingSection}>
            <Text style={styles.modalLabel}>How would you rate this service?</Text>
            <View style={styles.starsContainer}>
              {renderInteractiveStars()}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.modalLabel}>Write a Review (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Share your experience..."
              placeholderTextColor="#666666"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, (rating === 0 || submittingRating) && styles.submitButtonDisabled]} 
            onPress={submitRating} 
            disabled={submittingRating || rating === 0}
          >
            {submittingRating ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#FFFFFF', fontSize: 16 },
  header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  profilePicture: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  username: { fontSize: 14, color: '#666666', marginBottom: 12 },
  fieldsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12, marginBottom: 12 },
  fieldChip: { backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#333' },
  fieldChipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  fieldOfWork: { fontSize: 16, color: '#888888', marginBottom: 12 },
  ratingContainer: { alignItems: 'center', marginBottom: 12 },
  stars: { flexDirection: 'row', marginBottom: 4 },
  ratingText: { color: '#888888', fontSize: 14 },
  description: { color: '#CCCCCC', fontSize: 14, textAlign: 'center', marginTop: 8 },
  statsContainer: { flexDirection: 'row', padding: 20, backgroundColor: '#0a0a0a' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#888888' },
  statDivider: { width: 1, backgroundColor: '#1a1a1a', marginHorizontal: 10 },
  section: { padding: 20, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingRowText: { color: '#FFFFFF', width: 30, fontSize: 14 },
  ratingBar: { flex: 1, height: 8, backgroundColor: '#1a1a1a', borderRadius: 4, marginHorizontal: 12, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
  ratingRowCount: { color: '#888888', fontSize: 14, width: 40, textAlign: 'right' },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  skillChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  skillText: { color: '#FFFFFF', fontSize: 14 },
  jobCard: { flexDirection: 'row', backgroundColor: '#0a0a0a', borderRadius: 12, padding: 12, marginBottom: 12 },
  jobThumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  jobContent: { flex: 1 },
  jobTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  jobCategory: { fontSize: 12, color: '#888888', marginBottom: 8 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobPrice: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  jobMeta: { flexDirection: 'row', alignItems: 'center' },
  jobMetaText: { color: '#888888', fontSize: 12, marginLeft: 4 },
  reviewCard: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', marginBottom: 8 },
  reviewerPhoto: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  reviewStars: { flexDirection: 'row' },
  reviewText: { color: '#CCCCCC', fontSize: 14, marginBottom: 8 },
  reviewDate: { color: '#666666', fontSize: 12 },
  scrollView: { flex: 1 },
  rateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
  rateButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000000', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalClose: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 16, color: '#888888', textAlign: 'center', marginBottom: 16 },
  modalOrderInfo: { fontSize: 14, color: '#CCCCCC', textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },
  ratingSection: { marginBottom: 24, alignItems: 'center' },
  modalLabel: { fontSize: 16, color: '#FFFFFF', marginBottom: 12, fontWeight: '600' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  starButton: { marginHorizontal: 4 },
  ratingLabel: { fontSize: 16, color: '#FFD700', fontWeight: 'bold', marginTop: 8 },
  inputContainer: { marginBottom: 24 },
  textInput: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#2a2a2a' },
  textArea: { height: 120, paddingTop: 16 },
  submitButton: { backgroundColor: '#FFD700', borderRadius: 12, padding: 18, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#333333', opacity: 0.5 },
  submitButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
});