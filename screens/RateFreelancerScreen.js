import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ratingAPI } from '../services/api';

export default function RateFreelancerScreen({ route, navigation }) {
  const { orderId, freelancerId, freelancerName } = route.params;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const ratingData = {
        freelancerId,
        rating,
        review,
      };
      
      // Only include orderId if it's provided
      if (orderId) {
        ratingData.orderId = orderId;
      }

      await ratingAPI.rate(ratingData);
      Alert.alert('Success', 'Thank you for your feedback!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rate Your Experience</Text>
        <Text style={styles.subtitle}>with {freelancerName}</Text>
      </View>

      <View style={styles.ratingSection}>
        <Text style={styles.label}>How would you rate this service?</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
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
          ))}
        </View>
        {rating > 0 && (
          <Text style={styles.ratingLabel}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Write a Review (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Share your experience with this freelancer..."
          placeholderTextColor="#666666"
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, rating === 0 && styles.buttonDisabled]} 
        onPress={handleSubmit} 
        disabled={loading || rating === 0}
      >
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.buttonText}>Submit Rating</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', padding: 20 },
  header: { marginTop: 20, marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#888888' },
  ratingSection: { marginBottom: 30, alignItems: 'center' },
  label: { fontSize: 16, color: '#FFFFFF', marginBottom: 16, fontWeight: '600' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  starButton: { marginHorizontal: 8 },
  ratingLabel: { fontSize: 18, color: '#FFD700', fontWeight: 'bold', marginTop: 8 },
  inputContainer: { marginBottom: 30 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#2a2a2a' },
  textArea: { height: 150, paddingTop: 16 },
  button: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 40 },
  buttonDisabled: { backgroundColor: '#333333', opacity: 0.5 },
  buttonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
});
