import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderAPI } from '../services/api';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [userType, setUserType] = useState('');

  useEffect(() => {
    loadUser();
    fetchOrders();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setCurrentUserId(parsed._id || '');
        setUserType(parsed.userType || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMy();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const confirmPayment = async (orderId, orderPrice, orderTitle) => {
    Alert.alert(
      '✅ Confirm Payment',
      `Confirm you received ${orderPrice} DA for "${orderTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Confirm',
          onPress: async () => {
            try {
              await orderAPI.approvePayment(orderId);
              Alert.alert('Payment Confirmed', 'Payment has been confirmed successfully!');
              await fetchOrders();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Could not confirm payment');
            }
          }
        }
      ]
    );
  };

  const deleteOrder = (orderId, jobTitle) => {
    Alert.alert(
      'Delete Order',
      `Remove "${jobTitle}" from your orders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderAPI.delete(orderId);
              setOrders(orders.filter(order => order._id !== orderId));
              Alert.alert('Success', 'Order deleted from your view');
            } catch (error) {
              Alert.alert('Error', 'Could not delete order');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'in_progress': return '#4499FF';
      case 'delivered': return '#9944FF';
      case 'completed': return '#00FF00';
      case 'cancelled': return '#FF0000';
      default: return '#666666';
    }
  };

  const renderOrder = ({ item }) => {
    const isFreelancer = item.freelancerId?._id === currentUserId;
    const showConfirmButton = isFreelancer && !item.paymentApproved;

    return (
      <View style={styles.orderCardWrapper}>
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => {
            const screenName = userType === 'freelancer' ? 'OrderDetailFreelancer' : 'OrderDetailClient';
            navigation.navigate(screenName, { orderId: item._id });
          }}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle} numberOfLines={1}>
              {item.jobId?.title || 'Untitled Job'}
            </Text>
            {item.paymentApproved ? (
              <View style={styles.approvedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#00FF00" />
                <Text style={styles.approvedText}>PAID</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15`, borderColor: getStatusColor(item.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.orderBody}>
            <Text style={styles.orderPrice}>{item.price} DA</Text>

            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={14} color="#666666" />
              <Text style={styles.infoText}>
                {item.clientId?.name} → {item.freelancerId?.name}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#666666" />
              <Text style={styles.infoText}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {item.messages && item.messages.length > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="chatbubble-outline" size={14} color="#4499FF" />
                <Text style={[styles.infoText, { color: '#4499FF' }]}>
                  {item.messages.length} message{item.messages.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* PAYMENT CONFIRMATION BUTTON */}
          {showConfirmButton && (
            <TouchableOpacity 
              style={styles.confirmPaymentButton}
              onPress={() => confirmPayment(item._id, item.price, item.jobId?.title || 'this order')}
              activeOpacity={0.8}
            >
              <Ionicons name="cash" size={20} color="#000000" />
              <Text style={styles.confirmPaymentText}>Confirm Payment Received</Text>
              <Ionicons name="checkmark-circle" size={20} color="#000000" />
            </TouchableOpacity>
          )}

          {!showConfirmButton && (
            <View style={styles.footer}>
              <Text style={styles.tapText}>Tap to view details & chat</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteOrder(item._id, item.jobId?.title || 'this order')}
        >
          <Ionicons name="trash-outline" size={18} color="#FF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerCount}>{orders.length}</Text>
      </View>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#333333" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Your orders will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  orderCardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    overflow: 'hidden',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1a0000',
    padding: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#FF4444',
    zIndex: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingRight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  orderBody: {
    padding: 16,
  },
  orderPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00FF0015',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  approvedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00FF00',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#888888',
  },
  confirmPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  confirmPaymentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    gap: 8,
  },
  tapText: {
    fontSize: 13,
    color: '#666666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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