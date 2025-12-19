import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function AdminAnalytics({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, comparisonRes, revenueRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getMonthlyComparison(),
        adminAPI.getMonthlyRevenue()
      ]);

      setDashboardStats(statsRes.data);
      setMonthlyComparison(comparisonRes.data);
      setMonthlyRevenue(revenueRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderStatCard = (title, value, change, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
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
    const barWidth = (width - 80) / data.length;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{label}</Text>
        <View style={styles.chart}>
          {data.map((item, index) => {
            const height = maxValue > 0 ? (item[dataKey] / maxValue) * 150 : 0;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
      </View>

      {dashboardStats && (
        <>
          {/* Total Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OVERVIEW</Text>
            <View style={styles.statsGrid}>
              {renderStatCard(
                'Total Users',
                dashboardStats.totals.users,
                null,
                'people',
                '#00FF00'
              )}
              {renderStatCard(
                'Freelancers',
                dashboardStats.totals.freelancers,
                null,
                'briefcase',
                '#FFA500'
              )}
              {renderStatCard(
                'Clients',
                dashboardStats.totals.clients,
                null,
                'person',
                '#00BFFF'
              )}
              {renderStatCard(
                'Pending Approvals',
                dashboardStats.totals.pendingApprovals,
                null,
                'time',
                '#FF6347'
              )}
            </View>
          </View>

          {/* Current Month Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THIS MONTH</Text>
            <View style={styles.statsGrid}>
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
            </View>
          </View>

          {/* Comparison Note */}
          <View style={styles.comparisonNote}>
            <Ionicons name="information-circle" size={20} color="#00BFFF" />
            <Text style={styles.comparisonText}>
              Compared to previous month ({dashboardStats.previousMonth.orders} orders, {dashboardStats.previousMonth.jobs} jobs, {dashboardStats.previousMonth.revenue.toFixed(0)} DA)
            </Text>
          </View>
        </>
      )}

      {/* Charts */}
      {monthlyComparison.length > 0 && (
        <>
          {renderBarChart(monthlyComparison, 'revenue', 'Revenue Trend (Last 6 Months)', '#FFD700')}
          {renderBarChart(monthlyComparison, 'orders', 'Orders Trend (Last 6 Months)', '#FF1493')}
          {renderBarChart(monthlyComparison, 'jobs', 'Jobs Trend (Last 6 Months)', '#9370DB')}
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 15,
    letterSpacing: 1,
  },
  statsGrid: {
    gap: 15,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    color: '#AAA',
    fontSize: 14,
    marginLeft: 10,
  },
  statValue: {
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
    marginHorizontal: 20,
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
    marginHorizontal: 20,
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
    height: 180,
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
    fontSize: 10,
    marginBottom: 5,
  },
  barLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 5,
  },
});