import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'https://frelanci-backend.onrender.com/api';

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'freelancers'
  const [jobs, setJobs] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { query: searchQuery }
      });
      
      setJobs(response.data.jobs || []);
      setFreelancers(response.data.freelancers || []);
    } catch (error) {
      console.error('Search error:', error);
      setJobs([]);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  const renderJob = ({ item }) => {
    const thumbnail = item.thumbnails?.[0] || item.images?.[0];
    
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
      >
        {/* Job Thumbnail */}
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="briefcase-outline" size={40} color="#666" />
          </View>
        )}

        <View style={styles.jobContent}>
          <View style={styles.jobHeader}>
            {item.freelancerId?.profilePicture ? (
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
              <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.freelancerName}>{item.freelancerId?.name}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.price}>{item.price} DA</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFreelancer = ({ item }) => (
    <TouchableOpacity
      style={styles.freelancerCard}
      onPress={() => navigation.navigate('PublicProfile', { userId: item._id })}
    >
      {item.profilePicture ? (
        <Image
          source={{ uri: item.profilePicture }}
          style={styles.freelancerAvatar}
        />
      ) : (
        <View style={styles.freelancerAvatarPlaceholder}>
          <Ionicons name="person" size={40} color="#666666" />
        </View>
      )}
      
      <View style={styles.freelancerInfo}>
        <Text style={styles.freelancerName}>{item.name}</Text>
        {item.username && (
          <Text style={styles.freelancerUsername}>@{item.username}</Text>
        )}
        
        {item.fieldsOfWork && item.fieldsOfWork.length > 0 && (
          <View style={styles.fieldsRow}>
            {item.fieldsOfWork.slice(0, 2).map((field, index) => (
              <View key={index} style={styles.fieldBadge}>
                <Text style={styles.fieldBadgeText}>{field}</Text>
              </View>
            ))}
            {item.fieldsOfWork.length > 2 && (
              <Text style={styles.moreFields}>+{item.fieldsOfWork.length - 2}</Text>
            )}
          </View>
        )}

        {item.rating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.rating.toFixed(1)} ({item.totalRatings || 0})
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const currentData = activeTab === 'jobs' ? jobs : freelancers;
  const renderItem = activeTab === 'jobs' ? renderJob : renderFreelancer;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs or freelancers..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { 
              setSearchQuery(''); 
              setJobs([]); 
              setFreelancers([]);
              setSearched(false); 
            }}>
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'jobs' && styles.tabActive]}
            onPress={() => setActiveTab('jobs')}
          >
            <Text style={[styles.tabText, activeTab === 'jobs' && styles.tabTextActive]}>
              Jobs ({jobs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'freelancers' && styles.tabActive]}
            onPress={() => setActiveTab('freelancers')}
          >
            <Text style={[styles.tabText, activeTab === 'freelancers' && styles.tabTextActive]}>
              Freelancers ({freelancers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#666666" />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try different keywords</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={64} color="#666666" />
                <Text style={styles.emptyText}>Search for jobs or freelancers</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
  },
  tabActive: {
    backgroundColor: '#FFF',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  jobCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a1a',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobContent: {
    padding: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobHeaderText: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  freelancerName: {
    fontSize: 14,
    color: '#888888',
  },
  description: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 12,
    lineHeight: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  freelancerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  freelancerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  freelancerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  freelancerInfo: {
    flex: 1,
  },
  freelancerUsername: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  fieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  fieldBadge: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  fieldBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  moreFields: {
    color: '#666',
    fontSize: 11,
    alignSelf: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#888',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
});