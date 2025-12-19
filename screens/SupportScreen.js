import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supportAPI } from '../services/api';

const TEAM_MEMBERS = [
  {
    id: 'anes',
    name: 'Anes Gaher',
    role: 'Co-Founder & Developer',
    description: 'Technical support and app development',
    icon: 'code-slash',
    color: '#FFFFFF'
  },
  {
    id: 'yanis',
    name: 'Messaoudi Yanis',
    role: 'Founder',
    description: 'Platform strategy and business inquiries',
    icon: 'business',
    color: '#FFFFFF'
  }
];

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report', icon: 'bug' },
  { value: 'feature', label: 'Feature Request', icon: 'bulb' },
  { value: 'question', label: 'Question', icon: 'help-circle' },
  { value: 'complaint', label: 'Complaint', icon: 'warning' },
  { value: 'other', label: 'Other', icon: 'chatbubbles' }
];

export default function SupportScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [myMessages, setMyMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Message detail modal state
  const [messageDetailVisible, setMessageDetailVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchMyMessages();
  }, []);

  const fetchMyMessages = async () => {
    try {
      const response = await supportAPI.getMyMessages();
      setMyMessages(response.data.messages || []);
      if (response.data.messages && response.data.messages.length > 0) {
        setShowMessages(true);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyMessages();
  };

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    setLoading(true);
    try {
      await supportAPI.createMessage({
        to: selectedRecipient.id,
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority
      });

      Alert.alert(
        'Success',
        `Your message has been sent to ${selectedRecipient.name}. They will review it and respond as soon as possible.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              resetForm();
              fetchMyMessages();
              setShowMessages(true);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setCategory('other');
    setPriority('medium');
    setSelectedRecipient(null);
  };

  const handleCancel = () => {
    setModalVisible(false);
    resetForm();
  };

  const openMessageDetail = (message) => {
    setSelectedMessage(message);
    setMessageDetailVisible(true);
  };

  const closeMessageDetail = () => {
    setMessageDetailVisible(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setSendingReply(true);
    try {
      const response = await supportAPI.addMessageToThread(selectedMessage._id, replyText.trim());
      
      // Update the selected message with new conversation
      setSelectedMessage(response.data.data);
      
      // Refresh messages list
      await fetchMyMessages();
      
      setReplyText('');
      Alert.alert('Success', 'Message sent successfully');
    } catch (error) {
      console.error('Send reply error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  const renderTeamView = () => (
    <ScrollView style={styles.content}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Ionicons name="chatbubbles" size={48} color="#FFFFFF" />
        <Text style={styles.welcomeTitle}>How can we help you?</Text>
        <Text style={styles.welcomeText}>
          Select a team member below to send them a message. We're here to assist you!
        </Text>
      </View>

      {/* Team Members */}
      <View style={styles.teamSection}>
        <Text style={styles.sectionTitle}>OUR TEAM</Text>
        {TEAM_MEMBERS.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberCard}
            onPress={() => handleSelectRecipient(member)}
            activeOpacity={0.7}
          >
            <View style={[styles.memberImageContainer, { borderColor: member.color, borderWidth: 2 }]}>
              <Image
                source={require('../assets/freelanci-logo.png')}
                style={styles.memberImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
              <Text style={styles.memberDescription}>{member.description}</Text>
            </View>
            <View style={[styles.memberIcon, { backgroundColor: '#1a1a1a' }]}>
              <Ionicons name={member.icon} size={24} color={member.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={24} color="#FFFFFF" />
        <Text style={styles.infoText}>
          Your messages are reviewed by our team. You can track your support messages here.
        </Text>
      </View>
    </ScrollView>
  );

  const renderMessagesView = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
      }
    >
      <View style={styles.messagesContainer}>
        <Text style={styles.messagesTitle}>My Support Messages</Text>
        {myMessages.length === 0 ? (
          <View style={styles.emptyMessages}>
            <Ionicons name="chatbubbles-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Send a message to our team to get started</Text>
          </View>
        ) : (
          myMessages.map((item) => (
            <TouchableOpacity 
              key={item._id} 
              style={styles.messageCard}
              onPress={() => openMessageDetail(item)}
              activeOpacity={0.7}
            >
              <View style={styles.messageHeader}>
                <View style={styles.messageRecipient}>
                  <View style={styles.recipientAvatar}>
                    <Image
                      source={require('../assets/freelanci-logo.png')}
                      style={styles.recipientImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View>
                    <Text style={styles.recipientName}>
                      To: {item.to === 'anes' ? 'Anes Gaher' : 'Messaoudi Yanis'}
                    </Text>
                    <Text style={styles.messageDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  item.status === 'resolved' && styles.statusResolved,
                  item.status === 'pending' && styles.statusPending
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.messageSubject} numberOfLines={1}>{item.subject}</Text>
              <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
              <View style={styles.messageMeta}>
                <View style={styles.metaTag}>
                  <Ionicons name="pricetag" size={12} color="#AAA" />
                  <Text style={styles.metaTagText}>{item.category}</Text>
                </View>
                <View style={styles.metaTag}>
                  <Ionicons name="flag" size={12} color="#AAA" />
                  <Text style={styles.metaTagText}>{item.priority}</Text>
                </View>
              </View>
              {item.response && (
                <View style={styles.responsePreview}>
                  <Ionicons name="checkmark-done" size={14} color="#00FF00" />
                  <Text style={styles.responsePreviewText} numberOfLines={1}>
                    Response: {item.response}
                  </Text>
                </View>
              )}
              <View style={styles.tapHint}>
                <Ionicons name="enter-outline" size={16} color="#4499FF" />
                <Text style={styles.tapHintText}>Tap to view full conversation</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.backButton} />
      </View>

      {/* Toggle View Button */}
      {myMessages.length > 0 && (
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setShowMessages(!showMessages)}
        >
          <Ionicons 
            name={showMessages ? "people" : "chatbubble-ellipses"} 
            size={20} 
            color="#FFF" 
          />
          <Text style={styles.toggleButtonText}>
            {showMessages ? "Contact Team" : "My Messages"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Conditional Content */}
      {!showMessages ? renderTeamView() : renderMessagesView()}

      {/* Message Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Message {selectedRecipient?.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedRecipient?.role}</Text>
              </View>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Subject */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Brief description of your issue"
                  placeholderTextColor="#666"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryButton,
                        category === cat.value && styles.categoryButtonActive
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Ionicons 
                        name={cat.icon} 
                        size={20} 
                        color={category === cat.value ? '#000' : '#FFF'} 
                      />
                      <Text style={[
                        styles.categoryText,
                        category === cat.value && styles.categoryTextActive
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {['low', 'medium', 'high'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        priority === p && styles.priorityButtonActive
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[
                        styles.priorityText,
                        priority === p && styles.priorityTextActive
                      ]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Message */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message *</Text>
                <TextInput
                  style={[styles.modalInput, styles.messageInput]}
                  placeholder="Describe your issue in detail..."
                  placeholderTextColor="#666"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send Message</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Message Detail Modal */}
      <Modal
        visible={messageDetailVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeMessageDetail}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity onPress={closeMessageDetail} style={styles.detailModalBack}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Message Details</Text>
            <View style={styles.detailModalBack} />
          </View>

          <ScrollView style={styles.detailModalContent}>
            {selectedMessage && (
              <>
                {/* Status & Recipient */}
                <View style={styles.detailStatusSection}>
                  <View style={styles.detailRecipientInfo}>
                    <Ionicons name="person-circle" size={40} color="#4499FF" />
                    <View>
                      <Text style={styles.detailRecipientName}>
                        To: {selectedMessage.to === 'anes' ? 'Anes Gaher' : 'Messaoudi Yanis'}
                      </Text>
                      <Text style={styles.detailRecipientRole}>
                        {selectedMessage.to === 'anes' ? 'Co-Founder & Developer' : 'Founder'}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.detailStatusBadge,
                    selectedMessage.status === 'pending' && { backgroundColor: '#FFA50030', borderColor: '#FFA500' },
                    selectedMessage.status === 'read' && { backgroundColor: '#00BFFF30', borderColor: '#00BFFF' },
                    selectedMessage.status === 'resolved' && { backgroundColor: '#00FF0030', borderColor: '#00FF00' }
                  ]}>
                    <Text style={styles.detailStatusText}>{selectedMessage.status}</Text>
                  </View>
                </View>

                {/* Meta Information */}
                <View style={styles.detailMetaSection}>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="pricetag" size={16} color="#00BFFF" />
                    <Text style={styles.detailMetaText}>{selectedMessage.category}</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="flag" size={16} color="#FFA500" />
                    <Text style={styles.detailMetaText}>{selectedMessage.priority} priority</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.detailMetaText}>
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Subject */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Subject</Text>
                  <Text style={styles.detailSubject}>{selectedMessage.subject}</Text>
                </View>

                {/* Conversation Thread */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Conversation</Text>
                  <View style={styles.conversationContainer}>
                    {selectedMessage.conversation && selectedMessage.conversation.length > 0 ? (
                      selectedMessage.conversation.map((msg, index) => (
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
                      <View style={styles.detailMessageBox}>
                        <Text style={styles.detailMessageText}>{selectedMessage.message}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Status Info */}
                {selectedMessage.status === 'pending' && (
                  <View style={styles.detailInfoBox}>
                    <Ionicons name="time-outline" size={20} color="#FFA500" />
                    <Text style={styles.detailInfoText}>
                      Your message is pending. Our team will respond soon.
                    </Text>
                  </View>
                )}
                {selectedMessage.status === 'read' && (
                  <View style={styles.detailInfoBox}>
                    <Ionicons name="eye-outline" size={20} color="#00BFFF" />
                    <Text style={styles.detailInfoText}>
                      Your message has been read by our team.
                    </Text>
                  </View>
                )}
                {selectedMessage.status === 'resolved' && (
                  <View style={[styles.detailInfoBox, { borderColor: '#00FF00' }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#00FF00" />
                    <Text style={styles.detailInfoText}>
                      This conversation has been resolved.
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Reply Input */}
          {selectedMessage && selectedMessage.status !== 'resolved' && (
            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your message..."
                placeholderTextColor="#666"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.replySendButton,
                  (!replyText.trim() || sendingReply) && styles.replySendButtonDisabled
                ]}
                onPress={sendReply}
                disabled={!replyText.trim() || sendingReply}
              >
                {sendingReply ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="send" size={20} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#000000', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  backButton: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  toggleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, margin: 20, marginBottom: 10, gap: 8 },
  toggleButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  content: { flex: 1 },
  welcomeSection: { alignItems: 'center', padding: 30, paddingTop: 20 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 20, marginBottom: 10 },
  welcomeText: { fontSize: 15, color: '#CCCCCC', textAlign: 'center', lineHeight: 22 },
  teamSection: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888888', letterSpacing: 1, marginBottom: 15 },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 15, backgroundColor: '#0a0a0a', marginBottom: 15 },
  memberImageContainer: { width: 70, height: 70, borderRadius: 8, borderWidth: 3, padding: 5, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  memberImage: { width: '100%', height: '100%', borderRadius: 4 },
  memberInfo: { flex: 1, marginLeft: 15 },
  memberName: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  memberRole: { fontSize: 13, color: '#888888', marginBottom: 6 },
  memberDescription: { fontSize: 13, color: '#CCCCCC' },
  memberIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  infoSection: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingVertical: 15, backgroundColor: '#0a0a0a', marginHorizontal: 20, marginBottom: 30, borderRadius: 12 },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#CCCCCC', lineHeight: 20 },
  messagesContainer: { padding: 20 },
  messagesTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  emptyMessages: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  messageCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  messageRecipient: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  recipientAvatar: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#FFF', padding: 4, justifyContent: 'center', alignItems: 'center' },
  recipientImage: { width: '100%', height: '100%', borderRadius: 3 },
  recipientName: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  messageDate: { fontSize: 11, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFA50030' },
  statusPending: { backgroundColor: '#FFA50030' },
  statusResolved: { backgroundColor: '#FFFFFF30' },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: '#FFF' },
  messageSubject: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  messageText: { fontSize: 14, color: '#CCC', lineHeight: 20, marginBottom: 12 },
  messageMeta: { flexDirection: 'row', gap: 12 },
  metaTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTagText: { fontSize: 12, color: '#AAA' },
  responseContainer: { backgroundColor: '#0a0a0a', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#FFF', marginTop: 12 },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  responseLabel: { fontSize: 12, fontWeight: '600', color: '#FFF', textTransform: 'uppercase' },
  responseText: { fontSize: 13, color: '#DDD', lineHeight: 18 },
  responseDate: { fontSize: 11, color: '#666', marginTop: 6 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  modalSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  closeButton: { padding: 4 },
  modalScroll: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  modalInput: { backgroundColor: '#0a0a0a', borderRadius: 10, padding: 15, fontSize: 15, color: '#FFF', borderWidth: 1, borderColor: '#2a2a2a' },
  messageInput: { height: 120, paddingTop: 15 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#0a0a0a', borderRadius: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  categoryButtonActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  categoryText: { fontSize: 13, color: '#FFF' },
  categoryTextActive: { color: '#000' },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityButton: { flex: 1, padding: 12, backgroundColor: '#0a0a0a', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  priorityButtonActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  priorityText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  priorityTextActive: { color: '#000' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 20 },
  cancelButton: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: '#0a0a0a', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  cancelButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  sendButton: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  responsePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0a0a0a',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  responsePreviewText: {
    fontSize: 12,
    color: '#00FF00',
    flex: 1,
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
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  detailModalHeader: {
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
  detailModalBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  detailModalContent: {
    flex: 1,
    padding: 20,
  },
  detailStatusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailRecipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailRecipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  detailRecipientRole: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 2,
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  detailMetaSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailMetaText: {
    fontSize: 13,
    color: '#CCC',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  detailMessageBox: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  detailMessageText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
  },
  detailResponseBox: {
    backgroundColor: '#00FF0010',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF0030',
  },
  detailResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  detailResponseFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FF00',
  },
  detailResponseText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
    marginBottom: 10,
  },
  detailResponseDate: {
    fontSize: 12,
    color: '#666',
  },
  detailInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFA500',
    marginTop: 20,
  },
  detailInfoText: {
    fontSize: 14,
    color: '#CCC',
    flex: 1,
    lineHeight: 20,
  },
  conversationContainer: {
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
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    gap: 12,
  },
  replyInput: {
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
  replySendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replySendButtonDisabled: {
    opacity: 0.4,
  },
});