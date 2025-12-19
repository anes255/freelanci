import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { jobAPI } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { label: 'All', value: 'all' },
    { label: 'Web Dev', value: 'Web Development' },
    { label: 'Mobile Dev', value: 'Mobile Development' },
    { label: 'UI/UX Design', value: 'UI/UX Design' },
    { label: 'Graphic Design', value: 'Graphic Design' },
    { label: 'Logo Design', value: 'Logo Design' },
    { label: 'Content Writing', value: 'Content Writing' },
    { label: 'Copywriting', value: 'Copywriting' },
    { label: 'SEO', value: 'SEO' },
    { label: 'Social Media', value: 'Social Media Marketing' },
    { label: 'Video Editing', value: 'Video Editing' },
    { label: 'Animation', value: 'Animation' },
    { label: 'Photography', value: 'Photography' },
    { label: 'Translation', value: 'Translation' },
    { label: 'Voice Over', value: 'Voice Over' },
    { label: 'Data Entry', value: 'Data Entry' },
    { label: 'Virtual Assistant', value: 'Virtual Assistant' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_low' },
    { label: 'Price: High to Low', value: 'price_high' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Most Popular', value: 'popular' },
  ];

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, sortBy]);

  const fetchJobs = async () => {
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (sortBy && sortBy !== 'newest') params.sort = sortBy;
      
      const response = await jobAPI.getAll(params);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={12}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderJob = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={600}
    >
      <TouchableOpacity
        style={[styles.jobCard, item.isPinned && styles.pinnedCard]}
        onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
      >
        {item.isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={12} color="#000000" />
            <Text style={styles.pinnedText}>Featured</Text>
          </View>
        )}
        
        {item.thumbnails && item.thumbnails.length > 0 && (
          <Image source={{ uri: item.thumbnails[0] }} style={styles.jobImage} />
        )}
        
        <View style={styles.jobContent}>
          <View style={styles.jobHeader}>
            <TouchableOpacity
              onPress={() => navigation.navigate('PublicProfile', { 
                userId: item.freelancerId._id 
              })}
              style={styles.freelancerRow}
            >
              {item.freelancerId.profilePicture ? (
                <Image
                  source={{ uri: item.freelancerId.profilePicture }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color="#666666" />
                </View>
              )}
              <View style={styles.jobHeaderText}>
                <Text style={styles.freelancerName}>{item.freelancerId.name}</Text>
                {item.freelancerId.rating > 0 && (
                  <View style={styles.rating}>
                    {renderStars(item.freelancerId.rating)}
                    <Text style={styles.ratingText}>
                      {item.freelancerId.rating.toFixed(1)} ({item.freelancerId.totalRatings || 0})
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.price}>{item.price} DA</Text>
          </View>

          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.jobFooter}>
            <View style={styles.tag}>
              <Ionicons name="pricetag" size={12} color="#666666" />
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
            <View style={styles.deliveryTime}>
              <Ionicons name="time" size={12} color="#666666" />
              <Text style={styles.deliveryText}>{item.deliveryTime} days</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../assets/logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.value && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item.value)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === item.value && styles.categoryChipTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item._id}
        renderItem={renderJob}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#666666" />
            <Text style={styles.emptyText}>No jobs available</Text>
            <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Sort By</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  sortBy === option.value && styles.filterOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.value);
                  setShowFilters(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  sortBy === option.value && styles.filterOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={20} color="#000000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  logo: {
    width: 180,
    height: 50,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterButton: {
    marginRight: 16,
  },
  categoriesContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  categoryChip: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
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
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#000000',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  jobCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  pinnedCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  pinnedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  pinnedText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  jobImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#0a0a0a',
  },
  jobContent: {
    padding: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  freelancerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  jobHeaderText: {
    flex: 1,
  },
  freelancerName: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    color: '#FFD700',
    marginLeft: 4,
    fontWeight: '600',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 20,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  filterOptionActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  filterOptionTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
});
