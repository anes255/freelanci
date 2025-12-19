import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { orderAPI } from '../services/api';

export default function OrderDetailScreenClient({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserType, setCurrentUserType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    initializeScreen();
  }, [orderId]);

  useEffect(() => {
    if (order) {
      const interval = setInterval(loadOrderDetails, 5000);
      return () => clearInterval(interval);
    }
  }, [order]);

  const initializeScreen = async () => {
    await loadUserId();
    await loadOrderDetails();
    setLoading(false);
  };

  const loadUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setCurrentUserId(parsed._id);
        setCurrentUserType(parsed.userType);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadOrderDetails = async () => {
    try {
      const response = await orderAPI.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Load order error:', error);
      if (loading) {
        Alert.alert('Error', 'Could not load order details');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrderDetails();
  };

  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable photo library access in your device settings to upload images and videos.');
        return;
      }

      // Launch image picker with correct format
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image'
        });
        setMediaModalVisible(true);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Could not open image picker. Please try again.');
    }
  };

  const uploadMedia = async (mediaUri, mediaType) => {
    try {
      console.log('Processing media:', { mediaUri, mediaType });
      
      if (mediaType === 'image') {
        // Convert image to base64
        const response = await fetch(mediaUri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            console.log('Image converted to base64, length:', base64data.length);
            resolve(base64data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // For videos, return local URI (videos are too large for base64)
        // In production, upload to cloud storage
        return mediaUri;
      }
    } catch (error) {
      console.error('Media upload error:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if ((!message.trim() && !selectedMedia) || sending) return;
    
    setSending(true);
    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media if selected
      if (selectedMedia) {
        mediaUrl = await uploadMedia(selectedMedia.uri, selectedMedia.type);
        mediaType = selectedMedia.type;
      }

      const payload = { 
        message: message.trim(),
        mediaUrl,
        mediaType
      };
      
      console.log('Sending message with payload:', payload);

      await orderAPI.sendMessage(orderId, payload);
      
      setMessage('');
      setSelectedMedia(null);
      await loadOrderDetails();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openFullScreenMedia = (media) => {
    setFullScreenMedia(media);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF4444" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isClient = currentUserId === order.clientId?._id;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Chat</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FFFFFF" 
          />
        }
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {/* Order Info Card - Enhanced Minimal Design */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderTitleContainer}>
              <Text style={styles.orderTitle}>{order.jobId?.title || 'Service'}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.orderPrice}>{order.price}</Text>
              <Text style={styles.currencyLabel}>DA</Text>
            </View>
          </View>
          
          <View style={styles.orderDetails}>
            <View style={styles.participantsRow}>
              <View style={styles.participantItem}>
                <View style={styles.participantIcon}>
                  <Ionicons name="person" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.participantLabel}>Client</Text>
                <Text style={styles.participantName}>{order.clientId?.name || 'Unknown'}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.participantItem}>
                <View style={styles.participantIcon}>
                  <Ionicons name="briefcase" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.participantLabel}>Freelancer</Text>
                <Text style={styles.participantName}>{order.freelancerId?.name || 'Unknown'}</Text>
              </View>
            </View>
          </View>

          {order.requirements && (
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsLabel}>Requirements</Text>
              <Text style={styles.requirementsText}>{order.requirements}</Text>
            </View>
          )}
        </View>

        {/* Payment Status - Enhanced */}
        <View style={[
          styles.paymentStatus,
          order.paymentApproved ? styles.paymentConfirmed : styles.paymentPending
        ]}>
          <View style={styles.paymentIconContainer}>
            <Ionicons 
              name={order.paymentApproved ? "checkmark-circle" : "time"} 
              size={28} 
              color={order.paymentApproved ? "#00FF00" : "#FFA500"} 
            />
          </View>
          <View style={styles.paymentStatusText}>
            <Text style={[
              styles.paymentStatusTitle,
              { color: order.paymentApproved ? "#00FF00" : "#FFA500" }
            ]}>
              {order.paymentApproved ? "Payment Confirmed" : "Payment Pending"}
            </Text>
            {order.paymentApproved && order.paymentApprovedAt && (
              <Text style={styles.paymentStatusDate}>
                {formatDate(order.paymentApprovedAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Chat Section - Enhanced */}
        <View style={styles.chatSection}>
          <View style={styles.chatHeader}>
            <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
            <Text style={styles.chatTitle}>Messages</Text>
          </View>
          
          {order.messages && order.messages.length > 0 ? (
            order.messages.map((msg, index) => {
              const isMyMessage = msg.senderId === currentUserId;
              const isFreelancerMessage = msg.senderId === order.freelancerId?._id;
              
              // Debug log for media
              if (msg.media) {
                console.log('Message has media:', {
                  index,
                  type: msg.media.type,
                  url: msg.media.url,
                  hasUrl: !!msg.media.url
                });
              }
              
              if (msg.isSystemMessage) {
                return (
                  <View key={index} style={styles.systemMessage}>
                    <Ionicons name="checkmark-done-circle" size={18} color="#00FF00" />
                    <Text style={styles.systemMessageText}>{msg.message}</Text>
                  </View>
                );
              }
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.messageBubble,
                    isFreelancerMessage ? styles.freelancerMessage : styles.clientMessage
                  ]}
                >
                  {!isMyMessage && (
                    <Text style={styles.messageSender}>{msg.senderName}</Text>
                  )}
                  
                  {msg.media && (
                    <TouchableOpacity 
                      onPress={() => openFullScreenMedia(msg.media)}
                      style={styles.mediaContainer}
                    >
                      {msg.media.type === 'image' ? (
                        <Image 
                          source={{ uri: msg.media.url }} 
                          style={styles.mediaImage}
                          resizeMode="cover"
                          onError={(error) => {
                            console.log('Image load error:', msg.media.url, error.nativeEvent.error);
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', msg.media.url);
                          }}
                        />
                      ) : (
                        <View style={styles.videoPlaceholder}>
                          <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.videoText}>Tap to play video</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  {msg.message && (
                    <Text style={styles.messageText}>{msg.message}</Text>
                  )}
                  
                  <Text style={styles.messageTime}>{formatTime(msg.createdAt)}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.noMessages}>
              <Ionicons name="mail-open-outline" size={48} color="#333333" />
              <Text style={styles.noMessagesText}>No messages yet</Text>
              <Text style={styles.noMessagesSubtext}>Start the conversation</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Media Preview Modal */}
      {selectedMedia && (
        <Modal
          visible={mediaModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.mediaPreviewModal}>
            <View style={styles.mediaPreviewContainer}>
              {selectedMedia.type === 'image' ? (
                <Image 
                  source={{ uri: selectedMedia.uri }} 
                  style={styles.mediaPreviewImage}
                  resizeMode="contain"
                />
              ) : (
                <Video
                  source={{ uri: selectedMedia.uri }}
                  style={styles.mediaPreviewImage}
                  useNativeControls
                  isLooping
                />
              )}
              <View style={styles.mediaPreviewActions}>
                <TouchableOpacity 
                  style={styles.mediaActionButton}
                  onPress={() => {
                    setSelectedMedia(null);
                    setMediaModalVisible(false);
                  }}
                >
                  <Text style={styles.mediaActionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.mediaActionButton, styles.sendMediaButton]}
                  onPress={() => {
                    setMediaModalVisible(false);
                    sendMessage();
                  }}
                >
                  <Text style={styles.sendMediaText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Full Screen Media Modal */}
      {fullScreenMedia && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.fullScreenModal}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFullScreenMedia(null)}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            {fullScreenMedia.type === 'image' ? (
              <Image 
                source={{ uri: fullScreenMedia.url }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ) : (
              <Video
                source={{ uri: fullScreenMedia.url }}
                style={styles.fullScreenImage}
                useNativeControls
                shouldPlay
                isLooping
              />
            )}
          </View>
        </Modal>
      )}

      {/* Input Container - Enhanced */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.mediaButton}
          onPress={pickImage}
        >
          <Ionicons name="image" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666666"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!message.trim() && !selectedMedia) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={(!message.trim() && !selectedMedia) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Ionicons name="send" size={20} color="#000000" />
          )}
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '300',
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#000000',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  orderTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  orderDate: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '300',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  currencyLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
    marginTop: 2,
  },
  orderDetails: {
    marginBottom: 16,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantItem: {
    flex: 1,
    alignItems: 'center',
  },
  participantIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
  },
  participantName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
  },
  requirementsBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  requirementsLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
  },
  requirementsText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '300',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  paymentConfirmed: {
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderColor: 'rgba(0, 255, 0, 0.2)',
  },
  paymentPending: {
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  paymentIconContainer: {
    marginRight: 14,
  },
  paymentStatusText: {
    flex: 1,
  },
  paymentStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  paymentStatusDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    fontWeight: '300',
  },
  tinyConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  tinyConfirmButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  chatSection: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  freelancerMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2a2a2a',
    borderBottomRightRadius: 4,
  },
  clientMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 11,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
    fontWeight: '400',
  },
  messageTime: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.6,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontWeight: '400',
  },
  mediaContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '300',
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.2)',
  },
  systemMessageText: {
    fontSize: 13,
    color: '#00FF00',
    fontWeight: '400',
    marginLeft: 8,
  },
  noMessages: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMessagesText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    fontWeight: '400',
  },
  noMessagesSubtext: {
    fontSize: 13,
    color: '#444444',
    marginTop: 6,
    fontWeight: '300',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#000000',
  },
  mediaButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
    fontWeight: '300',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  mediaPreviewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreviewContainer: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  mediaPreviewImage: {
    width: '100%',
    height: 400,
  },
  mediaPreviewActions: {
    flexDirection: 'row',
    padding: 20,
  },
  mediaActionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: '#2a2a2a',
  },
  sendMediaButton: {
    backgroundColor: '#FFFFFF',
  },
  mediaActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  sendMediaText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});