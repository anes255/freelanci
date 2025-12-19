import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supportAPI } from '../services/api';

export default function AdminSupportScreen({ navigation }) {
  const [filter, setFilter] = useState('all');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Response modal state
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  
  // Conversation modal state
  const [conversationModalVisible, setConversationModalVisible] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [conversationReply, setConversationReply] = useState('');
  const [sendingConversationReply, setSendingConversationReply] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      let allMessages = [];
      
      if (filter === 'all' || filter === 'yanis') {
        const yanisResponse = await supportAPI.getMessagesByRecipient('yanis');
        allMessages = [...allMessages, ...yanisResponse.data.messages];
      }

      // Sort by creation date (newest first)
      allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setMessages(allMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load support messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (messageId, newStatus) => {
    try {
      await supportAPI.updateStatus(messageId, newStatus);
      fetchMessages();
      Alert.alert('Success', 'Status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleAddResponse = async (messageId) => {
    setSelectedMessage(messages.find(msg => msg._id === messageId));
    setResponseModalVisible(true);
  };

  const submitResponse = async () => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Response cannot be empty');
      return;
    }

    setSendingResponse(true);
    try {
      await supportAPI.addResponse(selectedMessage._id, responseText.trim());
      await fetchMessages();
      setResponseModalVisible(false);
      setResponseText('');
      setSelectedMessage(null);
      Alert.alert('Success', 'Response sent successfully');
    } catch (error) {
      console.error('Response error:', error);
      Alert.alert('Error', 'Failed to send response');
    } finally {
      setSendingResponse(false);
    }
  };

  const closeResponseModal = () => {
    setResponseModalVisible(false);
    setResponseText('');
    setSelectedMessage(null);
  };

  const openConversationModal = (message) => {
    setSelectedThread(message);
    setConversationModalVisible(true);
  };

  const closeConversationModal = () => {
    setConversationModalVisible(false);
    setSelectedThread(null);
    setConversationReply('');
  };

  const sendConversationMessage = async () => {
    if (!conversationReply.trim() || !selectedThread) return;

    setSendingConversationReply(true);
    try {
      await supportAPI.addMessageToThread(selectedThread._id, conversationReply.trim());
      await fetchMessages();
      
      // Refresh the selected thread
      const updated = messages.find(msg => msg._id === selectedThread._id);
      setSelectedThread(updated);
      
      setConversationReply('');
      Alert.alert('Success', 'Message sent successfully');
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingConversationReply(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supportAPI.deleteMessage(messageId);
              fetchMessages();
              Alert.alert('Success', 'Message deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'read': return '#00BFFF';
      case 'resolved': return '#00FF00';
      default: return '#FFF';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bug': return 'bug';
      case 'feature': return 'bulb';
      case 'question': return 'help-circle';
      case 'complaint': return 'warning';
      default: return 'chatbubbles';
    }
  };

  const renderMessage = ({ item }) => (
    <TouchableOpacity 
      style={styles.messageCard}
      onPress={() => openConversationModal(item)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.messageHeader}>
        <View style={styles.userInfo}>
          {item.from?.profilePicture ? (
            <Image source={{ uri: item.from.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color="#FFF" />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.from?.name || 'Unknown'}</Text>
            <Text style={styles.userEmail}>{item.from?.email}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '30' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
          <View style={styles.recipientBadge}>
            <Text style={styles.recipientText}>To: {item.to}</Text>
          </View>
        </View>
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name={getCategoryIcon(item.category)} size={14} color="#00BFFF" />
          <Text style={styles.metaText}>{item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="flag" size={14} color={
            item.priority === 'high' ? '#FF0000' :
            item.priority === 'medium' ? '#FFA500' : '#00FF00'
          } />
          <Text style={styles.metaText}>{item.priority}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.subject}>{item.subject}</Text>
      <Text style={styles.message}>{item.message}</Text>

      {/* Response */}
      {item.response && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <Ionicons name="checkmark-done" size={16} color="#00FF00" />
            <Text style={styles.responseLabel}>Response</Text>
          </View>
          <Text style={styles.responseText}>{item.response}</Text>
          {item.respondedAt && (
            <Text style={styles.responseDate}>
              {new Date(item.respondedAt).toLocaleString()}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {item.status !== 'resolved' && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleUpdateStatus(item._id, item.status === 'pending' ? 'read' : 'resolved')}
            >
              <Ionicons name="checkmark" size={16} color="#00FF00" />
              <Text style={styles.actionText}>
                {item.status === 'pending' ? 'Mark Read' : 'Resolve'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAddResponse(item._id)}
            >
              <Ionicons name="chatbubble" size={16} color="#00BFFF" />
              <Text style={styles.actionText}>Respond</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteMessage(item._id)}
        >
          <Ionicons name="trash" size={16} color="#FF0000" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tapHint}>
        <Ionicons name="enter-outline" size={16} color="#4499FF" />
        <Text style={styles.tapHintText}>Tap to view full conversation</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {['all', 'yanis'].map((f) => (
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

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(); }} tintColor="#FFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No support messages</Text>
          </View>
        }
      />

      {/* Response Modal */}
      <Modal
        visible={responseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeResponseModal}
      >
        <KeyboardAvoidingView
          style={styles.responseModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.responseModalContent}>
            <View style={styles.responseModalHeader}>
              <Text style={styles.responseModalTitle}>Respond to Support Message</Text>
              <TouchableOpacity onPress={closeResponseModal}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            {selectedMessage && (
              <View style={styles.responseModalMessage}>
                <Text style={styles.responseModalFrom}>
                  From: {selectedMessage.from?.name}
                </Text>
                <Text style={styles.responseModalSubject}>
                  Subject: {selectedMessage.subject}
                </Text>
                <Text style={styles.responseModalText}>
                  {selectedMessage.message}
                </Text>
              </View>
            )}

            <View style={styles.responseModalInputSection}>
              <Text style={styles.responseModalLabel}>Your Response:</Text>
              <TextInput
                style={styles.responseModalInput}
                placeholder="Type your response to the user..."
                placeholderTextColor="#666"
                value={responseText}
                onChangeText={setResponseText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.responseModalCharCount}>
                {responseText.length}/1000 characters
              </Text>
            </View>

            <View style={styles.responseModalActions}>
              <TouchableOpacity
                style={styles.responseModalCancelButton}
                onPress={closeResponseModal}
                disabled={sendingResponse}
              >
                <Text style={styles.responseModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.responseModalSendButton,
                  (!responseText.trim() || sendingResponse) && styles.responseModalSendButtonDisabled
                ]}
                onPress={submitResponse}
                disabled={!responseText.trim() || sendingResponse}
              >
                {sendingResponse ? (
                  <>
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={styles.responseModalSendText}>Sending...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#000" />
                    <Text style={styles.responseModalSendText}>Send Response</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Conversation Modal */}
      <Modal
        visible={conversationModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeConversationModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeConversationModal} style={styles.modalBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalHeaderTitle}>Conversation</Text>
              <Text style={styles.modalHeaderSubtitle}>
                {selectedThread?.from?.name}
              </Text>
            </View>
            <View style={styles.modalBackButton} />
          </View>

          <ScrollView style={styles.conversationModalContent}>
            {selectedThread && (
              <>
                {/* Subject */}
                <View style={styles.conversationSection}>
                  <Text style={styles.conversationSectionLabel}>Subject</Text>
                  <Text style={styles.conversationSubject}>{selectedThread.subject}</Text>
                </View>

                {/* Conversation Thread */}
                <View style={styles.conversationSection}>
                  <Text style={styles.conversationSectionLabel}>Messages</Text>
                  <View style={styles.conversationThreadContainer}>
                    {selectedThread.conversation && selectedThread.conversation.length > 0 ? (
                      selectedThread.conversation.map((msg, index) => (
                        <View 
                          key={index}
                          style={[
                            styles.conversationMessage,
                            msg.sender === 'user' ? styles.userMessage : styles.teamMessage
                          ]}
                        >
                          <View style={styles.conversationMessageHeader}>
                            <Text style={styles.conversationSenderName}>
                              {msg.senderName}
                            </Text>
                            <Text style={styles.conversationMessageTime}>
                              {new Date(msg.timestamp).toLocaleString()}
                            </Text>
                          </View>
                          <Text style={styles.conversationMessageText}>{msg.text}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.conversationMessage}>
                        <Text style={styles.conversationMessageText}>{selectedThread.message}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Reply Input */}
          <View style={styles.conversationInputContainer}>
            <TextInput
              style={styles.conversationInput}
              placeholder="Type your message..."
              placeholderTextColor="#666"
              value={conversationReply}
              onChangeText={setConversationReply}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.conversationSendButton,
                (!conversationReply.trim() || sendingConversationReply) && styles.conversationSendButtonDisabled
              ]}
              onPress={sendConversationMessage}
              disabled={!conversationReply.trim() || sendingConversationReply}
            >
              {sendingConversationReply ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="send" size={20} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  filters: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  filterChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#FFF',
  },
  filterText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  listContent: {
    padding: 20,
  },
  messageCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  userEmail: {
    fontSize: 12,
    color: '#AAA',
  },
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recipientBadge: {
    backgroundColor: '#00BFFF30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recipientText: {
    fontSize: 10,
    color: '#00BFFF',
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#AAA',
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  responseContainer: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00FF00',
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00FF00',
    textTransform: 'uppercase',
  },
  responseText: {
    fontSize: 13,
    color: '#DDD',
    lineHeight: 18,
  },
  responseDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0a0a0a',
    padding: 10,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: 16,
  },
  responseModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  responseModalContent: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  responseModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  responseModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  responseModalMessage: {
    padding: 20,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  responseModalFrom: {
    fontSize: 14,
    color: '#4499FF',
    fontWeight: '600',
    marginBottom: 8,
  },
  responseModalSubject: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  responseModalText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
  },
  responseModalInputSection: {
    padding: 20,
  },
  responseModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 10,
  },
  responseModalInput: {
    backgroundColor: '#000',
    color: '#FFF',
    padding: 15,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  responseModalCharCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 6,
  },
  responseModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  responseModalCancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  responseModalCancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  responseModalSendButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  responseModalSendButtonDisabled: {
    opacity: 0.4,
  },
  responseModalSendText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  tapHintText: {
    fontSize: 13,
    color: '#4499FF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalHeaderSubtitle: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 2,
  },
  conversationModalContent: {
    flex: 1,
    padding: 20,
  },
  conversationSection: {
    marginBottom: 20,
  },
  conversationSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  conversationSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  conversationThreadContainer: {
    gap: 12,
  },
  conversationMessage: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  userMessage: {
    backgroundColor: '#0a0a0a',
    borderColor: '#1a1a1a',
    marginRight: 30,
  },
  teamMessage: {
    backgroundColor: '#00FF0010',
    borderColor: '#00FF0030',
    marginLeft: 30,
  },
  conversationMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationSenderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4499FF',
  },
  conversationMessageTime: {
    fontSize: 11,
    color: '#666',
  },
  conversationMessageText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 20,
  },
  conversationInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    gap: 12,
  },
  conversationInput: {
    flex: 1,
    backgroundColor: '#000',
    color: '#FFF',
    padding: 12,
    borderRadius: 12,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  conversationSendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationSendButtonDisabled: {
    opacity: 0.4,
  },
});