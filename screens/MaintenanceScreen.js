import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, RefreshControl, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { maintenanceAPI, adminAPI, supportAPI, orderAPI } from '../services/api';

export default function MaintenanceScreen({ navigation }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chats, setChats] = useState([]);
  const [payments, setPayments] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Interactive chat modal state
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Support response modal state
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedSupportMessage, setSelectedSupportMessage] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  
  // Interactive support message modal state
  const [supportMessageModalVisible, setSupportMessageModalVisible] = useState(false);
  const [selectedSupportThread, setSelectedSupportThread] = useState(null);
  const [supportReplyText, setSupportReplyText] = useState('');
  const [sendingSupportReply, setSendingSupportReply] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    try {
      if (tab === 'stats') {
        const response = await maintenanceAPI.getStats();
        setStats(response.data);
      } else if (tab === 'analytics') {
        const [statsRes, comparisonRes] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getMonthlyComparison()
        ]);
        setDashboardStats(statsRes.data);
        setMonthlyComparison(comparisonRes.data);
      } else if (tab === 'support') {
        const response = await supportAPI.getMessagesByRecipient('anes');
        setSupportMessages(response.data.messages);
      } else if (tab === 'errors') {
        const response = await maintenanceAPI.getErrors();
        setErrors(response.data);
      } else if (tab === 'users') {
        const response = await adminAPI.getUsers();
        setUsers(response.data);
      } else if (tab === 'orders') {
        const response = await adminAPI.getOrders();
        setOrders(response.data);
      } else if (tab === 'chats') {
        const response = await adminAPI.getOrders();
        // Only show orders with messages
        setChats(response.data.filter(order => order.messages && order.messages.length > 0));
      } else if (tab === 'payments') {
        const response = await adminAPI.getOrders();
        // Only show orders with confirmed payments, sorted by payment date
        const confirmedPayments = response.data
          .filter(order => order.paymentApproved && order.paymentApprovedAt)
          .sort((a, b) => new Date(b.paymentApprovedAt) - new Date(a.paymentApprovedAt));
        setPayments(confirmedPayments);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Could not fetch data';
      Alert.alert('Error', `Failed to fetch data: ${errorMsg}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openChatModal = async (order) => {
    setSelectedChat(order);
    setChatModalVisible(true);
  };

  const closeChatModal = () => {
    setChatModalVisible(false);
    setSelectedChat(null);
    setNewMessage('');
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setSendingMessage(true);
    try {
      await orderAPI.sendMessage(selectedChat._id, {
        message: newMessage.trim()
      });
      
      // Refresh the chat data
      const response = await orderAPI.getById(selectedChat._id);
      setSelectedChat(response.data);
      
      // Update the chats list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat._id === selectedChat._id ? response.data : chat
        )
      );
      
      setNewMessage('');
      Alert.alert('Success', 'Message sent');
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const submitResponse = async () => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Response cannot be empty');
      return;
    }

    setSendingResponse(true);
    try {
      await supportAPI.addResponse(selectedSupportMessage._id, responseText.trim());
      await fetchData();
      setResponseModalVisible(false);
      setResponseText('');
      setSelectedSupportMessage(null);
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
    setSelectedSupportMessage(null);
  };

  const openSupportMessageModal = (message) => {
    setSelectedSupportThread(message);
    setSupportMessageModalVisible(true);
  };

  const closeSupportMessageModal = () => {
    setSupportMessageModalVisible(false);
    setSelectedSupportThread(null);
    setSupportReplyText('');
  };

  const sendSupportReply = async () => {
    if (!supportReplyText.trim() || !selectedSupportThread) return;

    setSendingSupportReply(true);
    try {
      await supportAPI.addMessageToThread(selectedSupportThread._id, supportReplyText.trim());
      
      // Refresh the support messages
      const response = await supportAPI.getMessagesByRecipient('anes');
      setSupportMessages(response.data.messages);
      
      // Update the selected thread
      const updatedThread = response.data.messages.find(msg => msg._id === selectedSupportThread._id);
      setSelectedSupportThread(updatedThread);
      
      setSupportReplyText('');
      Alert.alert('Success', 'Message sent successfully');
    } catch (error) {
      console.error('Send support reply error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingSupportReply(false);
    }
  };

  const updateSupportMessageStatus = async (status) => {
    if (!selectedSupportThread) return;

    try {
      await supportAPI.updateStatus(selectedSupportThread._id, status);
      
      // Refresh
      const response = await supportAPI.getMessagesByRecipient('anes');
      setSupportMessages(response.data.messages);
      
      const updatedThread = response.data.messages.find(msg => msg._id === selectedSupportThread._id);
      setSelectedSupportThread(updatedThread);
      
      Alert.alert('Success', `Status updated to ${status}`);
    } catch (error) {
      console.error('Update status error:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleClearErrors = async () => {
    Alert.alert('Clear Errors', 'Are you sure you want to clear all error logs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await maintenanceAPI.clearErrors();
            Alert.alert('Success', 'Error logs cleared');
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Could not clear error logs');
          }
        }
      }
    ]);
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert('Delete User', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminAPI.deleteUser(userId);
            Alert.alert('Success', 'User deleted');
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Could not delete user');
          }
        }
      }
    ]);
  };

  const handleApproveUser = async (userId) => {
    try {
      await adminAPI.approveUser(userId);
      Alert.alert('Success', 'User approved');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Could not approve user');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    navigation.replace('Login');
  };

  const renderStats = () => (
    <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFFFFF" />}>
      <View style={styles.statCard}>
        <Ionicons name="people" size={32} color="#FFFFFF" />
        <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
        <Text style={styles.statLabel}>Total Users</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="briefcase" size={32} color="#FFFFFF" />
        <Text style={styles.statValue}>{stats?.totalFreelancers || 0}</Text>
        <Text style={styles.statLabel}>Freelancers</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="person" size={32} color="#FFFFFF" />
        <Text style={styles.statValue}>{stats?.totalClients || 0}</Text>
        <Text style={styles.statLabel}>Clients</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="hourglass" size={32} color="#FFA500" />
        <Text style={styles.statValue}>{stats?.pendingApprovals || 0}</Text>
        <Text style={styles.statLabel}>Pending Approvals</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="file-tray-full" size={32} color="#FFFFFF" />
        <Text style={styles.statValue}>{stats?.totalJobs || 0}</Text>
        <Text style={styles.statLabel}>Total Jobs</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="receipt" size={32} color="#FFFFFF" />
        <Text style={styles.statValue}>{stats?.totalOrders || 0}</Text>
        <Text style={styles.statLabel}>Total Orders</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="checkmark-circle" size={32} color="#00FF00" />
        <Text style={styles.statValue}>{stats?.completedOrders || 0}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="cash" size={32} color="#00FF00" />
        <Text style={styles.statValue}>{stats?.approvedPayments || 0}</Text>
        <Text style={styles.statLabel}>Confirmed Payments</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="wallet" size={32} color="#FFA500" />
        <Text style={styles.statValue}>{stats?.pendingPayments || 0}</Text>
        <Text style={styles.statLabel}>Pending Payments</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="cash" size={32} color="#00FF00" />
        <Text style={styles.statValue}>{stats?.approvedRevenue || 0} DA</Text>
        <Text style={styles.statLabel}>Confirmed Revenue</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="trending-up" size={32} color="#FFFFFF" />
        <Text style={styles.statValue}>{stats?.totalRevenue || 0} DA</Text>
        <Text style={styles.statLabel}>Total Revenue</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="warning" size={32} color="#FF0000" />
        <Text style={styles.statValue}>{stats?.recentErrors || 0}</Text>
        <Text style={styles.statLabel}>Recent Errors (24h)</Text>
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => {
    const renderStatCard = (title, value, change, icon, color) => (
      <View style={[styles.analyticsCard, { borderLeftColor: color }]}>
        <View style={styles.analyticsHeader}>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={styles.analyticsTitle}>{title}</Text>
        </View>
        <Text style={styles.analyticsValue}>{value}</Text>
        {change !== undefined && (
          <View style={styles.changeContainer}>
            <Ionicons
              name={change >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={change >= 0 ? '#00FF00' : '#FF0000'}
            />
            <Text style={[styles.changeText, { color: change >= 0 ? '#00FF00' : '#FF0000' }]}>
              {Math.abs(change)}% vs last month
            </Text>
          </View>
        )}
      </View>
    );

    const renderBarChart = (data, dataKey, label, color) => {
      if (!data || data.length === 0) return null;

      const maxValue = Math.max(...data.map(item => item[dataKey] || 0));
      const barWidth = (350 - 40) / data.length;

      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{label}</Text>
          <View style={styles.chart}>
            {data.map((item, index) => {
              const height = maxValue > 0 ? (item[dataKey] / maxValue) * 120 : 0;
              return (
                <View key={index} style={[styles.barContainer, { width: barWidth }]}>
                  <View style={styles.barWrapper}>
                    <Text style={styles.barValue}>
                      {dataKey === 'revenue' ? `${item[dataKey].toFixed(0)}DA` : item[dataKey]}
                    </Text>
                    <View style={[styles.bar, { height, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.barLabel}>{item.monthName}</Text>
                </View>
              );
            })}
          </View>
        </View>
      );
    };

    if (!dashboardStats) {
      return (
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFFFFF" />}
      >
        <Text style={styles.sectionTitle}>OVERVIEW</Text>
        {renderStatCard('Total Users', dashboardStats.totals.users, null, 'people', '#00FF00')}
        {renderStatCard('Total Jobs', dashboardStats.totals.jobs, null, 'briefcase', '#9370DB')}
        {renderStatCard('Total Orders', dashboardStats.totals.orders, null, 'cart', '#FF1493')}
        {renderStatCard('Pending Approvals', dashboardStats.totals.pendingApprovals, null, 'time', '#FF6347')}

        <Text style={styles.sectionTitle}>THIS MONTH</Text>
        {renderStatCard(
          'Orders',
          dashboardStats.currentMonth.orders,
          dashboardStats.changes.orders,
          'cart',
          '#FF1493'
        )}
        {renderStatCard(
          'Jobs Posted',
          dashboardStats.currentMonth.jobs,
          dashboardStats.changes.jobs,
          'briefcase',
          '#9370DB'
        )}
        {renderStatCard(
          'Revenue',
          `${dashboardStats.currentMonth.revenue.toFixed(0)} DA`,
          dashboardStats.changes.revenue,
          'cash',
          '#FFD700'
        )}

        <View style={styles.comparisonNote}>
          <Ionicons name="information-circle" size={20} color="#00BFFF" />
          <Text style={styles.comparisonText}>
            Last month: {dashboardStats.previousMonth.orders} orders, {dashboardStats.previousMonth.jobs} jobs, {dashboardStats.previousMonth.revenue.toFixed(0)} DA
          </Text>
        </View>

        {monthlyComparison.length > 0 && (
          <>
            {renderBarChart(monthlyComparison, 'revenue', 'Revenue Trend (6 Months)', '#FFD700')}
            {renderBarChart(monthlyComparison, 'orders', 'Orders Trend (6 Months)', '#FF1493')}
            {renderBarChart(monthlyComparison, 'jobs', 'Jobs Trend (6 Months)', '#9370DB')}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    );
  };

  const renderSupport = () => {
    const handleUpdateStatus = async (messageId, newStatus) => {
      try {
        await supportAPI.updateStatus(messageId, newStatus);
        fetchData();
        Alert.alert('Success', 'Status updated');
      } catch (error) {
        Alert.alert('Error', 'Failed to update status');
      }
    };

    const handleAddResponse = async (messageId) => {
      setSelectedSupportMessage(supportMessages.find(msg => msg._id === messageId));
      setResponseModalVisible(true);
    };

    const handleDeleteMessage = async (messageId) => {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this support message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await supportAPI.deleteMessage(messageId);
                fetchData();
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

    return (
      <View style={styles.content}>
        <View style={styles.supportHeader}>
          <Text style={styles.supportCount}>{supportMessages.length} Messages</Text>
          <View style={styles.statusLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#00FF00' }]} />
              <Text style={styles.legendText}>Resolved</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={supportMessages}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.supportCard}
              onPress={() => openSupportMessageModal(item)}
              activeOpacity={0.7}
            >
              {/* Header */}
              <View style={styles.supportCardHeader}>
                <View style={styles.supportUser}>
                  {item.from?.profilePicture ? (
                    <Image source={{ uri: item.from.profilePicture }} style={styles.supportAvatar} />
                  ) : (
                    <View style={styles.supportAvatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#FFF" />
                    </View>
                  )}
                  <View>
                    <Text style={styles.supportUserName}>{item.from?.name || 'Unknown User'}</Text>
                    <Text style={styles.supportUserEmail}>{item.from?.email}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '30' }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Category & Priority */}
              <View style={styles.supportMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name={getCategoryIcon(item.category)} size={14} color="#00BFFF" />
                  <Text style={styles.metaText}>{item.category}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flag" size={14} color={
                    item.priority === 'high' ? '#FF0000' :
                    item.priority === 'medium' ? '#FFA500' : '#00FF00'
                  } />
                  <Text style={styles.metaText}>{item.priority} priority</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={14} color="#666" />
                  <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>

              {/* Subject */}
              <Text style={styles.supportSubject}>{item.subject}</Text>

              {/* Message */}
              <Text style={styles.supportMessage} numberOfLines={3}>{item.message}</Text>

              {/* Response Preview */}
              {item.response && (
                <View style={styles.responsePreview}>
                  <Ionicons name="checkmark-done" size={14} color="#00FF00" />
                  <Text style={styles.responsePreviewText} numberOfLines={2}>
                    Response: {item.response}
                  </Text>
                </View>
              )}

              {/* Tap to Open Hint */}
              <View style={styles.openSupportHint}>
                <Ionicons name="enter-outline" size={16} color="#4499FF" />
                <Text style={styles.openSupportHintText}>Tap to open interactive view</Text>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFFFFF" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No support messages</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderErrors = () => (
    <View style={styles.content}>
      <View style={styles.errorHeader}>
        <Text style={styles.errorCount}>{errors.length} Errors</Text>
        {errors.length > 0 && (
          <TouchableOpacity onPress={handleClearErrors}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={errors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.errorCard}>
            <Text style={styles.errorMessage}>{item.message}</Text>
            <Text style={styles.errorUser}>User: {item.user}</Text>
            <Text style={styles.errorRoute}>{item.method} {item.route}</Text>
            <Text style={styles.errorTime}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#00FF00" />
            <Text style={styles.emptyText}>No errors</Text>
            <Text style={styles.emptySubtext}>System running smoothly</Text>
          </View>
        }
      />
    </View>
  );

  const renderUsers = () => (
    <FlatList
      data={users}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
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
                <TouchableOpacity style={styles.actionButton} onPress={() => handleApproveUser(item._id)}>
                  <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteUser(item._id)}>
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
                  <Text style={styles.detailLabel}>ID Picture:</Text>
                  <Image 
                    source={{ uri: item.idPicture }}
                    style={styles.idImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {item.rating > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Rating:</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {item.rating.toFixed(1)} ({item.totalRatings} reviews)
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFFFFF" />}
    />
  );

  const renderChats = () => (
    <FlatList
      data={chats}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.chatCard}
          onPress={() => openChatModal(item)}
          activeOpacity={0.7}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>{item.jobId?.title || 'Job'}</Text>
            <View style={[styles.badge, item.paymentApproved ? { backgroundColor: '#00FF0030' } : { backgroundColor: '#FFA50030' }]}>
              <Text style={styles.badgeText}>{item.paymentApproved ? 'Paid' : 'Unpaid'}</Text>
            </View>
          </View>
          
          <View style={styles.chatInfoRow}>
            <Text style={styles.chatLabel}>Client:</Text>
            <Text style={styles.chatValue}>{item.clientId?.name}</Text>
          </View>
          <View style={styles.chatInfoRow}>
            <Text style={styles.chatLabel}>Freelancer:</Text>
            <Text style={styles.chatValue}>{item.freelancerId?.name}</Text>
          </View>
          <View style={styles.chatInfoRow}>
            <Text style={styles.chatLabel}>Price:</Text>
            <Text style={[styles.chatValue, { color: '#FFD700', fontWeight: 'bold' }]}>{item.price} DA</Text>
          </View>
          
          <View style={styles.messagesSection}>
            <Text style={styles.messagesTitle}>💬 {item.messages.length} Messages</Text>
            <ScrollView style={styles.messagesContainer} nestedScrollEnabled>
              {item.messages.slice(-5).map((msg, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.messageItem,
                    msg.isSystemMessage && styles.systemMessageItem
                  ]}
                >
                  <Text style={styles.messageSender}>{msg.senderName}</Text>
                  <Text style={styles.messageText}>{msg.message}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
            {item.messages.length > 5 && (
              <Text style={styles.moreMessages}>+ {item.messages.length - 5} more messages</Text>
            )}
          </View>
          
          <View style={styles.openChatHint}>
            <Ionicons name="enter-outline" size={16} color="#4499FF" />
            <Text style={styles.openChatHintText}>Tap to open interactive chat</Text>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFFFFF" />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#666666" />
          <Text style={styles.emptyText}>No chats yet</Text>
        </View>
      }
    />
  );

  const renderOrders = () => (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>{item.jobId?.title || 'Job'}</Text>
            <View style={[styles.badge, item.paymentApproved ? { backgroundColor: '#00FF0030' } : { backgroundColor: '#FFA50030' }]}>
              <Text style={styles.badgeText}>{item.paymentApproved ? 'Paid' : 'Unpaid'}</Text>
            </View>
          </View>
          <Text style={styles.orderPrice}>{item.price} DA</Text>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderLabel}>Client:</Text>
            <Text style={styles.orderValue}>{item.clientId?.name}</Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderLabel}>Freelancer:</Text>
            <Text style={styles.orderValue}>{item.freelancerId?.name}</Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderLabel}>Created:</Text>
            <Text style={styles.orderValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          {item.paymentApproved && item.paymentApprovedAt && (
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderLabel}>Paid:</Text>
              <Text style={[styles.orderValue, { color: '#00FF00' }]}>
                {new Date(item.paymentApprovedAt).toLocaleString()}
              </Text>
            </View>
          )}
          {item.messages && item.messages.length > 0 && (
            <View style={styles.orderInfoRow}>
              <Ionicons name="chatbubble-outline" size={14} color="#4499FF" />
              <Text style={[styles.orderValue, { color: '#4499FF', marginLeft: 6 }]}>
                {item.messages.length} messages
              </Text>
            </View>
          )}
          <View style={styles.deletionStatus}>
            {item.deletedByClient && (
              <Text style={styles.deletionText}>🗑️ Deleted by client</Text>
            )}
            {item.deletedByFreelancer && (
              <Text style={styles.deletionText}>🗑️ Deleted by freelancer</Text>
            )}
          </View>
        </View>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFFFFF" />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#666666" />
          <Text style={styles.emptyText}>No orders</Text>
        </View>
      }
    />
  );

  const renderPayments = () => (
    <FlatList
      data={payments}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <Ionicons name="checkmark-circle" size={28} color="#00FF00" />
            <View style={styles.paymentHeaderText}>
              <Text style={styles.paymentTitle}>{item.jobId?.title || 'Job'}</Text>
              <Text style={styles.paymentDate}>
                {new Date(item.paymentApprovedAt).toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.paymentAmount}>
            <Text style={styles.paymentPrice}>{item.price}</Text>
            <Text style={styles.paymentCurrency}>DA</Text>
          </View>
          
          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <Ionicons name="person" size={16} color="#666666" />
              <Text style={styles.paymentLabel}>Client:</Text>
              <Text style={styles.paymentValue}>{item.clientId?.name}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Ionicons name="briefcase" size={16} color="#666666" />
              <Text style={styles.paymentLabel}>Freelancer:</Text>
              <Text style={styles.paymentValue}>{item.freelancerId?.name}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Ionicons name="calendar" size={16} color="#666666" />
              <Text style={styles.paymentLabel}>Order Date:</Text>
              <Text style={styles.paymentValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFFFFF" />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="cash-outline" size={64} color="#666666" />
          <Text style={styles.emptyText}>No confirmed payments</Text>
          <Text style={styles.emptySubtext}>Payments will appear here once confirmed</Text>
        </View>
      }
    />
  );

  if (loading && !refreshing) {
    return <View style={[styles.container, styles.centerContent]}><ActivityIndicator size="large" color="#FFFFFF" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maintenance Panel</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {['stats', 'analytics', 'support', 'payments', 'orders', 'chats', 'users', 'errors'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => { setTab(t); setLoading(true); }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'stats' && renderStats()}
      {tab === 'analytics' && renderAnalytics()}
      {tab === 'support' && renderSupport()}
      {tab === 'payments' && renderPayments()}
      {tab === 'errors' && renderErrors()}
      {tab === 'users' && renderUsers()}
      {tab === 'orders' && renderOrders()}
      {tab === 'chats' && renderChats()}

      {/* Interactive Chat Modal */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeChatModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeChatModal} style={styles.modalBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalHeaderTitle}>
                {selectedChat?.jobId?.title || 'Chat'}
              </Text>
              <Text style={styles.modalHeaderSubtitle}>
                {selectedChat?.clientId?.name} ↔ {selectedChat?.freelancerId?.name}
              </Text>
            </View>
            <View style={styles.modalBackButton} />
          </View>

          <ScrollView style={styles.modalMessagesContainer}>
            {selectedChat?.messages?.map((msg, index) => (
              <View 
                key={index} 
                style={[
                  styles.modalMessage,
                  msg.isSystemMessage && styles.modalSystemMessage
                ]}
              >
                <Text style={styles.modalMessageSender}>{msg.senderName}</Text>
                <Text style={styles.modalMessageText}>{msg.message}</Text>
                <Text style={styles.modalMessageTime}>
                  {new Date(msg.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalInputContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="Type a message as maintenance..."
              placeholderTextColor="#666"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.modalSendButton,
                (!newMessage.trim() || sendingMessage) && styles.modalSendButtonDisabled
              ]}
              onPress={sendChatMessage}
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="send" size={20} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Support Response Modal */}
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

            {selectedSupportMessage && (
              <View style={styles.responseModalMessage}>
                <Text style={styles.responseModalFrom}>
                  From: {selectedSupportMessage.from?.name}
                </Text>
                <Text style={styles.responseModalSubject}>
                  Subject: {selectedSupportMessage.subject}
                </Text>
                <Text style={styles.responseModalText}>
                  {selectedSupportMessage.message}
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

      {/* Interactive Support Message Modal */}
      <Modal
        visible={supportMessageModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeSupportMessageModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSupportMessageModal} style={styles.modalBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalHeaderTitle}>Support Message</Text>
              <Text style={styles.modalHeaderSubtitle}>
                {selectedSupportThread?.from?.name}
              </Text>
            </View>
            <View style={styles.modalBackButton} />
          </View>

          <ScrollView style={styles.supportModalContent}>
            {selectedSupportThread && (
              <>
                {/* User Info */}
                <View style={styles.supportModalUserSection}>
                  <View style={styles.supportModalUserInfo}>
                    <Ionicons name="person-circle" size={40} color="#4499FF" />
                    <View style={styles.supportModalUserText}>
                      <Text style={styles.supportModalUserName}>
                        {selectedSupportThread.from?.name}
                      </Text>
                      <Text style={styles.supportModalUserEmail}>
                        {selectedSupportThread.from?.email}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.supportModalStatusBadge,
                    selectedSupportThread.status === 'pending' && { backgroundColor: '#FFA50030', borderColor: '#FFA500' },
                    selectedSupportThread.status === 'read' && { backgroundColor: '#00BFFF30', borderColor: '#00BFFF' },
                    selectedSupportThread.status === 'resolved' && { backgroundColor: '#00FF0030', borderColor: '#00FF00' }
                  ]}>
                    <Text style={styles.supportModalStatusText}>{selectedSupportThread.status}</Text>
                  </View>
                </View>

                {/* Meta Info */}
                <View style={styles.supportModalMeta}>
                  <View style={styles.supportModalMetaItem}>
                    <Ionicons name="pricetag" size={16} color="#00BFFF" />
                    <Text style={styles.supportModalMetaText}>{selectedSupportThread.category}</Text>
                  </View>
                  <View style={styles.supportModalMetaItem}>
                    <Ionicons name="flag" size={16} color="#FFA500" />
                    <Text style={styles.supportModalMetaText}>{selectedSupportThread.priority}</Text>
                  </View>
                  <View style={styles.supportModalMetaItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.supportModalMetaText}>
                      {new Date(selectedSupportThread.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Subject */}
                <View style={styles.supportModalSection}>
                  <Text style={styles.supportModalSectionTitle}>Subject:</Text>
                  <Text style={styles.supportModalSubject}>{selectedSupportThread.subject}</Text>
                </View>

                {/* Conversation Thread */}
                <View style={styles.supportModalSection}>
                  <Text style={styles.supportModalSectionTitle}>Conversation:</Text>
                  <View style={styles.conversationContainer}>
                    {selectedSupportThread.conversation && selectedSupportThread.conversation.length > 0 ? (
                      selectedSupportThread.conversation.map((msg, index) => (
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
                      <>
                        <View style={styles.supportModalMessageBox}>
                          <Text style={styles.supportModalMessageText}>{selectedSupportThread.message}</Text>
                        </View>
                        {selectedSupportThread.response && (
                          <View style={styles.supportModalResponseBox}>
                            <Ionicons name="checkmark-done" size={18} color="#00FF00" />
                            <Text style={styles.supportModalResponseText}>{selectedSupportThread.response}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>

                {/* Status Actions */}
                {selectedSupportThread.status !== 'resolved' && (
                  <View style={styles.supportModalStatusActions}>
                    <Text style={styles.supportModalSectionTitle}>Update Status:</Text>
                    <View style={styles.supportModalStatusButtons}>
                      {selectedSupportThread.status === 'pending' && (
                        <TouchableOpacity
                          style={styles.supportModalStatusButton}
                          onPress={() => updateSupportMessageStatus('read')}
                        >
                          <Ionicons name="checkmark" size={18} color="#00BFFF" />
                          <Text style={styles.supportModalStatusButtonText}>Mark as Read</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.supportModalStatusButton, styles.supportModalResolveButton]}
                        onPress={() => updateSupportMessageStatus('resolved')}
                      >
                        <Ionicons name="checkmark-done" size={18} color="#00FF00" />
                        <Text style={styles.supportModalStatusButtonText}>Mark as Resolved</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Reply Input */}
          {selectedSupportThread && selectedSupportThread.status !== 'resolved' && (
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Type your response..."
                placeholderTextColor="#666"
                value={supportReplyText}
                onChangeText={setSupportReplyText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.modalSendButton,
                  (!supportReplyText.trim() || sendingSupportReply) && styles.modalSendButtonDisabled
                ]}
                onPress={sendSupportReply}
                disabled={!supportReplyText.trim() || sendingSupportReply}
              >
                {sendingSupportReply ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="send" size={20} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FFFFFF' },
  tabText: { fontSize: 16, color: '#666666', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  content: { flex: 1, padding: 20 },
  statCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginTop: 12 },
  statLabel: { fontSize: 14, color: '#666666', marginTop: 4 },
  errorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  errorCount: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  clearButton: { fontSize: 14, color: '#FF0000', fontWeight: '600' },
  errorCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FF000030' },
  errorMessage: { fontSize: 14, color: '#FF0000', fontWeight: '600', marginBottom: 8 },
  errorUser: { fontSize: 12, color: '#FFFFFF', marginBottom: 4 },
  errorRoute: { fontSize: 12, color: '#666666', marginBottom: 4 },
  errorTime: { fontSize: 10, color: '#666666' },
  listContent: { padding: 20 },
  userCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  userUsername: { fontSize: 13, color: '#888888', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#666666', marginBottom: 4 },
  userPhone: { fontSize: 13, color: '#4CAF50', marginBottom: 8, fontWeight: '500' },
  freelancerDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  detailSection: { marginBottom: 12 },
  detailLabel: { fontSize: 13, color: '#888888', fontWeight: '600', marginBottom: 6 },
  detailValue: { fontSize: 13, color: '#FFFFFF' },
  fieldsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fieldTag: { backgroundColor: '#0a0a0a', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2a2a' },
  fieldTagText: { fontSize: 11, color: '#FFFFFF', fontWeight: '500' },
  idImage: { width: '100%', height: 200, borderRadius: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: 13, color: '#FFFFFF', fontWeight: '500' },
  badges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeFreelancer: { backgroundColor: '#4169E130' },
  badgeClient: { backgroundColor: '#32CD3230' },
  badgeApproved: { backgroundColor: '#00FF0030' },
  badgePending: { backgroundColor: '#FFA50030' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { padding: 8 },
  chatCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chatTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', flex: 1 },
  chatInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  chatLabel: { fontSize: 13, color: '#666666', width: 90 },
  chatValue: { fontSize: 13, color: '#FFFFFF', flex: 1 },
  messagesSection: { marginTop: 12, padding: 12, backgroundColor: '#0a0a0a', borderRadius: 12 },
  messagesTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  messagesContainer: { maxHeight: 200 },
  messageItem: { backgroundColor: '#1a1a1a', padding: 10, borderRadius: 8, marginBottom: 8 },
  systemMessageItem: { backgroundColor: '#00FF0010', borderWidth: 1, borderColor: '#00FF00' },
  messageSender: { fontSize: 11, color: '#888888', marginBottom: 4, fontWeight: '600' },
  messageText: { fontSize: 13, color: '#FFFFFF', marginBottom: 4 },
  messageTime: { fontSize: 10, color: '#666666' },
  moreMessages: { fontSize: 11, color: '#888888', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  orderCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', flex: 1 },
  orderPrice: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 12 },
  orderInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  orderLabel: { fontSize: 13, color: '#666666', width: 90 },
  orderValue: { fontSize: 13, color: '#FFFFFF', flex: 1 },
  deletionStatus: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  deletionText: { fontSize: 11, color: '#888888', marginBottom: 2 },
  paymentCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00FF0030',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  paymentHeaderText: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#00FF00',
    fontWeight: '500',
  },
  paymentAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  paymentPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentCurrency: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  paymentDetails: {
    gap: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#666666',
    width: 90,
  },
  paymentValue: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#666666', marginTop: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 15,
    marginTop: 10,
    letterSpacing: 1,
  },
  analyticsCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 15,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  analyticsTitle: {
    color: '#AAA',
    fontSize: 14,
    marginLeft: 10,
  },
  analyticsValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  comparisonNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
  },
  comparisonText: {
    color: '#AAA',
    fontSize: 12,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  chartContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    marginBottom: 20,
    borderRadius: 10,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: {
    color: '#AAA',
    fontSize: 9,
    marginBottom: 5,
  },
  barLabel: {
    color: '#888',
    fontSize: 9,
    marginTop: 5,
  },
  supportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  supportCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusLegend: {
    flexDirection: 'row',
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#AAA',
  },
  supportCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  supportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  supportAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  supportAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  supportUserEmail: {
    fontSize: 12,
    color: '#AAA',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  supportMeta: {
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
  supportSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  supportMessage: {
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
  supportActions: {
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
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: 12,
  },
  openChatHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  openChatHintText: {
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
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  modalMessagesContainer: {
    flex: 1,
    padding: 16,
  },
  modalMessage: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  modalSystemMessage: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
  },
  modalMessageSender: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4499FF',
    marginBottom: 4,
  },
  modalMessageText: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
    marginBottom: 6,
  },
  modalMessageTime: {
    fontSize: 11,
    color: '#666',
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    gap: 12,
  },
  modalInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#FFF',
    padding: 12,
    borderRadius: 12,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalSendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSendButtonDisabled: {
    opacity: 0.4,
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
  responsePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0a0a0a',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  responsePreviewText: {
    fontSize: 12,
    color: '#00FF00',
    flex: 1,
  },
  openSupportHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  openSupportHintText: {
    fontSize: 13,
    color: '#4499FF',
    fontWeight: '500',
  },
  supportModalContent: {
    flex: 1,
    padding: 20,
  },
  supportModalUserSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  supportModalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportModalUserText: {
    flex: 1,
  },
  supportModalUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  supportModalUserEmail: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 2,
  },
  supportModalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  supportModalStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  supportModalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  supportModalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  supportModalMetaText: {
    fontSize: 13,
    color: '#CCC',
  },
  supportModalSection: {
    marginBottom: 20,
  },
  supportModalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supportModalSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  supportModalMessageBox: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  supportModalMessageText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
  },
  supportModalResponseBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#00FF0010',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF0030',
  },
  supportModalResponseText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
    flex: 1,
  },
  supportModalResponseDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  supportModalStatusActions: {
    marginBottom: 20,
  },
  supportModalStatusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  supportModalStatusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#00BFFF20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00BFFF',
  },
  supportModalResolveButton: {
    backgroundColor: '#00FF0020',
    borderColor: '#00FF00',
  },
  supportModalStatusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
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
});