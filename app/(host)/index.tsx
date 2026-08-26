import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Switch, Image, Alert, Pressable,
} from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/context/auth-context';
import { useHost } from '@/lib/context/host-context';
import { useBookings } from '@/lib/context/booking-context';
import { useNotifications } from '@/lib/context/notification-context';
import { isApiPropertyId } from '@/lib/context/host-utils';
import { PropertySyncBanner } from '@/components/host/PropertySyncBanner';
import { AnimatedPressable } from '@/components/ui/motion';
import { PaginationControls } from '@/components/feature/pagination-controls';
import { usePagination } from '@/hooks/use-pagination';
import { hostApi } from '@/lib/api/host-api';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG as BGTokens, CLOUD, RED, STATUS } from '@/lib/constants/figma-tokens';
import type { AdminRoom } from '@/types/api';

const ACCENT = SRS.teal;
const NAVY = SRS.navy;
const BG = GRAY[50];

interface PropertyRoomsData {
  propertyId: string;
  rooms: AdminRoom[];
}

export default function HostDrawerShell() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { properties, isDataLoading, fetchHostData, togglePropertyActivation, removeProperty, getFilteredBookings } = useHost();
  const { bookings: guestBookings } = useBookings();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Fetch rooms for ALL properties on mount for accurate KPIs
  const [allRooms, setAllRooms] = useState<PropertyRoomsData[]>([]);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

  // Filtered properties based on dropdown selection
  const filteredProperties = useMemo(() => {
    if (!selectedPropertyId) return properties;
    return properties.filter(p => p.id === selectedPropertyId);
  }, [properties, selectedPropertyId]);

  useEffect(() => {
    if (properties.length === 0) return;
    let cancelled = false;

    const apiProps = properties.filter(p => isApiPropertyId(p.id));
    if (apiProps.length === 0) {
      // Demo properties — use rooms from context (already loaded)
      // Defer to avoid synchronous setState in effect
      const timer = setTimeout(() => { if (!cancelled) setRoomsLoaded(true); }, 0);
      return () => clearTimeout(timer);
    }

    Promise.all(
      apiProps.map(p =>
        hostApi.getRooms(p.id, () => []).then(rooms => ({ propertyId: p.id, rooms }))
      )
    ).then(results => {
      if (!cancelled) {
        setAllRooms(results);
        setRoomsLoaded(true);
      }
    }).catch(() => {
      if (!cancelled) setRoomsLoaded(true);
    });

    return () => { cancelled = true; };
  }, [properties]);

  // Flatten all rooms across properties
  const flatRooms = useMemo(() => allRooms.flatMap(r => r.rooms), [allRooms]);

  // All bookings across properties
  const allBookings = useMemo(() => {
    const result: {
      id: string;
      property_id: string;
      guest_name: string;
      room_name: string;
      check_in: string;
      check_out: string;
      status: string;
      total: number;
      created_at: string;
    }[] = [];
    for (const p of properties) {
      const bks = getFilteredBookings(p.id);
      for (const b of bks) {
        result.push({
          id: b.id,
          property_id: b.property_id,
          guest_name: b.guest_name,
          room_name: b.room_name,
          check_in: b.check_in,
          check_out: b.check_out,
          status: b.status,
          total: b.total,
          created_at: b.created_at,
        });
      }
    }
    // Also include guest bookings for revenue
    for (const b of guestBookings) {
      if (b.status !== 'cancelled') {
        result.push({
          id: b.id,
          property_id: b.hotelId,
          guest_name: 'Guest',
          room_name: b.roomTypeName,
          check_in: b.checkIn,
          check_out: b.checkOut,
          status: b.status,
          total: b.totalPrice,
          created_at: b.createdAt,
        });
      }
    }
    return result;
  }, [properties, getFilteredBookings, guestBookings]);

  // ── Portfolio KPIs (matching web dashboard) ──
  const kpis = useMemo(() => {
    const activeProps = filteredProperties;
    const activePropIds = new Set(activeProps.map(p => p.id));
    const relevantRooms = flatRooms.filter(r => {
      // If filtering, only count rooms from selected property
      if (selectedPropertyId) {
        return allRooms.some(ar => ar.propertyId === selectedPropertyId && ar.rooms.includes(r));
      }
      return true;
    });

    const totalRooms = relevantRooms.length;
    const occupiedRooms = relevantRooms.filter(r => r.status === 'OCCUPIED' || r.status === 'DIRTY').length;
    const availableRooms = relevantRooms.filter(r => r.status === 'AVAILABLE').length;
    const maintenanceRooms = relevantRooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'BLOCKED').length;
    const outOfOrderRooms = relevantRooms.filter(r => r.status === 'BLOCKED').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const relevantBookings = allBookings.filter(b => activePropIds.has(b.property_id));
    const totalRevenue = relevantBookings.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalBookings = relevantBookings.length;
    const adr = occupiedRooms > 0 ? Math.round(totalRevenue / occupiedRooms) : 0;
    const revpar = totalRooms > 0 ? Math.round(totalRevenue / totalRooms) : 0;

    return {
      totalProperties: activeProps.length,
      activeProperties: activeProps.filter(p => p.is_active).length,
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      outOfOrderRooms,
      occupancyRate,
      totalRevenue,
      totalBookings,
      adr,
      revpar,
      totalFloors: activeProps.reduce((sum, p) => sum + (p.number_of_floors || 0), 0),
    };
  }, [flatRooms, allBookings, filteredProperties, selectedPropertyId, allRooms]);

  // ── Recent bookings (last 5) ──
  const recentBookings = useMemo(() =>
    [...allBookings]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [allBookings],
  );

  // ── Arrivals & Departures (today) ──
  const { arrivals, departures } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const arr = allBookings.filter(b => b.check_in === today && b.status !== 'cancelled');
    const dep = allBookings.filter(b => b.check_out === today && b.status !== 'cancelled');
    return { arrivals: arr, departures: dep };
  }, [allBookings]);

  // ── Revenue by day (last 7 days) ──
  const revenueTrend = useMemo(() => {
    const now = new Date();
    const days: { day: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      const revenue = allBookings
        .filter(b => b.created_at.slice(0, 10) === dateStr)
        .reduce((sum, b) => sum + (b.total || 0), 0);
      days.push({ day: label, revenue });
    }
    return days;
  }, [allBookings]);

  const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue), 1);

  // Pagination — 10 properties per page
  const PAGE_SIZE = 10;
  const { currentPage, totalPages, nextPage, prevPage, startIndex } = usePagination({
    totalItems: properties.length,
    itemsPerPage: PAGE_SIZE,
  });
  const pagedProperties = properties.slice(startIndex, startIndex + PAGE_SIZE);

  // Revenue per property (for bar chart)
  const propertyRevenue = useMemo(() =>
    pagedProperties.map(p => {
      const bks = getFilteredBookings(p.id);
      let rev = bks
        .filter(b => b.status === 'checked_in' || b.status === 'checked_out' || b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.total || 0), 0);
      rev += guestBookings
        .filter(b => b.hotelId === p.id && b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      return { name: p.name, revenue: rev };
    }),
    [pagedProperties, getFilteredBookings, guestBookings],
  );
  const maxPropRevenue = Math.max(...propertyRevenue.map(d => d.revenue), 1);

  const userName = user && 'firstName' in user
    ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).name || 'Host'
    : 'Host';

  const onRefresh = async () => {
    setRefreshing(true);
    try { await fetchHostData(); } finally { setRefreshing(false); }
  };

  const bookingStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('cancel')) return { label: 'Cancelled', color: RED[500], bg: RED[50] };
    if (s.includes('check_out') || s.includes('checkout') || s.includes('complete')) return { label: 'Completed', color: '#16A34A', bg: '#DCFCE7' };
    if (s.includes('check_in') || s.includes('checkin')) return { label: 'In-Stay', color: '#2563EB', bg: '#EFF6FF' };
    if (s.includes('confirm')) return { label: 'Confirmed', color: '#7C3AED', bg: '#F5F3FF' };
    return { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' };
  };

  // ── Drawer ──
  const firstPropertyId = properties.length > 0 ? properties[0].id : null;

  const renderDrawerContent = () => (
    <View style={[s.drawer, { paddingTop: insets.top }]}>
      <View style={s.drawerHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{userName[0]}</Text>
        </View>
        <Text style={s.drawerName}>{userName}</Text>
        <Text style={s.drawerRole}>Host</Text>
        {(user as any)?.email ? <Text style={s.drawerEmail}>{(user as any).email}</Text> : null}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* MAIN section */}
        <Text style={s.navSection}>MAIN</Text>

        <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
          onPress={() => { setOpen(false); }}
          style={[s.navItem, s.navItemActive]}
        >
          <View style={[s.navIcon, s.navIconActive]}>
            <Ionicons name="grid-outline" size={18} color={BGTokens.white} />
          </View>
          <Text style={[s.navLabel, s.navLabelActive]}>Dashboard</Text>
          <View style={s.navActiveDot} />
        </AnimatedPressable>

        <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
          onPress={() => { setOpen(false); }}
          style={s.navItem}
        >
          <View style={s.navIcon}>
            <Ionicons name="business-outline" size={18} color={CLOUD.cloud} />
          </View>
          <Text style={s.navLabel}>Properties</Text>
        </AnimatedPressable>

        {firstPropertyId && (
          <>
            <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
              onPress={() => { setOpen(false); router.push(`/(host)/property/${firstPropertyId}/bookings`); }}
              style={s.navItem}
            >
              <View style={s.navIcon}>
                <Ionicons name="calendar-outline" size={18} color={CLOUD.cloud} />
              </View>
              <Text style={s.navLabel}>Bookings</Text>
            </AnimatedPressable>

            <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
              onPress={() => { setOpen(false); router.push(`/(host)/property/${firstPropertyId}/guests`); }}
              style={s.navItem}
            >
              <View style={s.navIcon}>
                <Ionicons name="people-outline" size={18} color={CLOUD.cloud} />
              </View>
              <Text style={s.navLabel}>Guests</Text>
            </AnimatedPressable>

            <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
              onPress={() => { setOpen(false); router.push(`/(host)/property/${firstPropertyId}/staff`); }}
              style={s.navItem}
            >
              <View style={s.navIcon}>
                <Ionicons name="person-add-outline" size={18} color={CLOUD.cloud} />
              </View>
              <Text style={s.navLabel}>Staff Management</Text>
            </AnimatedPressable>

            <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
              onPress={() => { setOpen(false); router.push(`/(host)/property/${firstPropertyId}/housekeeping`); }}
              style={s.navItem}
            >
              <View style={s.navIcon}>
                <Ionicons name="sparkles-outline" size={18} color={CLOUD.cloud} />
              </View>
              <Text style={s.navLabel}>Housekeeping</Text>
            </AnimatedPressable>

            <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
              onPress={() => { setOpen(false); router.push(`/(host)/property/${firstPropertyId}/reports`); }}
              style={s.navItem}
            >
              <View style={s.navIcon}>
                <Ionicons name="bar-chart-outline" size={18} color={CLOUD.cloud} />
              </View>
              <Text style={s.navLabel}>Reports</Text>
            </AnimatedPressable>
          </>
        )}

        {/* SYSTEM section */}
        <Text style={s.navSection}>SYSTEM</Text>

        {firstPropertyId && (
          <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
            onPress={() => { setOpen(false); router.push(`/(host)/property/${firstPropertyId}/settings`); }}
            style={s.navItem}
          >
            <View style={s.navIcon}>
              <Ionicons name="settings-outline" size={18} color={CLOUD.cloud} />
            </View>
            <Text style={s.navLabel}>Settings</Text>
          </AnimatedPressable>
        )}

        <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
          onPress={() => { setOpen(false); router.push('/(host)/notifications'); }}
          style={s.navItem}
        >
          <View style={s.navIcon}>
            <Ionicons name="notifications-outline" size={18} color={CLOUD.cloud} />
          </View>
          <Text style={s.navLabel}>Notifications</Text>
        </AnimatedPressable>

        <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
          onPress={() => { setOpen(false); router.push('/(host)/profile'); }}
          style={s.navItem}
        >
          <View style={s.navIcon}>
            <Ionicons name="person-outline" size={18} color={CLOUD.cloud} />
          </View>
          <Text style={s.navLabel}>My Profile</Text>
        </AnimatedPressable>

        <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
          onPress={() => { setOpen(false); router.push('/(host)/admin-profile'); }}
          style={s.navItem}
        >
          <View style={s.navIcon}>
            <Ionicons name="shield-checkmark-outline" size={18} color={CLOUD.cloud} />
          </View>
          <Text style={s.navLabel}>Admin Profile</Text>
        </AnimatedPressable>

        <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
          onPress={() => { setOpen(false); router.push('/(host)/change-password'); }}
          style={s.navItem}
        >
          <View style={s.navIcon}>
            <Ionicons name="lock-closed-outline" size={18} color={CLOUD.cloud} />
          </View>
          <Text style={s.navLabel}>Change Password</Text>
        </AnimatedPressable>
      </ScrollView>

      <AnimatedPressable portal="host" haptic="medium" scaleTo={0.97}
        onPress={() => { router.push('/(host)/listing-wizard'); setOpen(false); }}
        style={s.newListingBtn}
      >
        <Ionicons name="add" size={16} color={BGTokens.white} />
        <Text style={s.newListingText}>New Listing</Text>
      </AnimatedPressable>

      <View style={s.divider} />

      <AnimatedPressable portal="host" haptic="light" scaleTo={0.97}
        onPress={() => { logout(); router.replace('/'); }}
        style={s.logoutBtn}
      >
        <Ionicons name="log-out-outline" size={16} color={RED[500]} />
        <Text style={s.logoutText}>Logout</Text>
      </AnimatedPressable>
    </View>
  );

  if (isDataLoading) {
    return <View style={s.shell}><ActivityIndicator size="large" color={ACCENT} style={{ flex: 1 }} /></View>;
  }

  const loading = !roomsLoaded && properties.some(p => isApiPropertyId(p.id));

  return (
    <View style={s.shell}>
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={s.topBarLeft}>
          <TouchableOpacity onPress={() => setOpen(true)} style={s.menuBtn}>
            <Ionicons name="menu" size={20} color={NAVY} />
          </TouchableOpacity>
          <View>
            <Text style={s.brand}>ServeIQ</Text>
            <Text style={s.tabLabel}>Dashboard</Text>
          </View>
        </View>
        <View style={s.topBarRight}>
          {/* Property Switcher */}
          <View style={s.propertySwitcherWrap}>
            <TouchableOpacity
              style={s.propertySwitcher}
              onPress={() => setShowPropertyDropdown(!showPropertyDropdown)}
              activeOpacity={0.7}
            >
              <Ionicons name="business-outline" size={14} color={NAVY} />
              <Text style={s.propertySwitcherText} numberOfLines={1}>
                {selectedPropertyId
                  ? properties.find(p => p.id === selectedPropertyId)?.name || 'All Properties'
                  : 'All Properties'}
              </Text>
              <Ionicons name={showPropertyDropdown ? 'chevron-up' : 'chevron-down'} size={14} color={GRAY[500]} />
            </TouchableOpacity>
            {showPropertyDropdown && (
              <View style={s.dropdown}>
                <Pressable
                  style={[s.dropdownItem, !selectedPropertyId && s.dropdownItemActive]}
                  onPress={() => { setSelectedPropertyId(null); setShowPropertyDropdown(false); }}
                >
                  <Text style={[s.dropdownText, !selectedPropertyId && s.dropdownTextActive]}>All Properties</Text>
                </Pressable>
                {properties.map(p => (
                  <Pressable
                    key={p.id}
                    style={[s.dropdownItem, selectedPropertyId === p.id && s.dropdownItemActive]}
                    onPress={() => {
                      setSelectedPropertyId(p.id);
                      setShowPropertyDropdown(false);
                    }}
                  >
                    <Text style={[s.dropdownText, selectedPropertyId === p.id && s.dropdownTextActive]} numberOfLines={1}>{p.name}</Text>
                    <Text style={s.dropdownSubtext}>{p.city}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {/* Notification Bell */}
          <TouchableOpacity
            style={s.notifBtn}
            onPress={() => router.push('/(host)/notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={NAVY} />
            {unreadCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(host)/listing-wizard')} style={s.newBtn}>
            <Ionicons name="add" size={14} color={BGTokens.white} />
            <Text style={s.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Drawer
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        renderDrawerContent={renderDrawerContent}
        drawerType="front"
        drawerStyle={{ width: 280 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        >
          {loading && (
            <View style={s.loadingBanner}>
              <ActivityIndicator size="small" color={ACCENT} />
              <Text style={s.loadingBannerText}>Loading portfolio data...</Text>
            </View>
          )}

          {/* Header */}
          <View style={s.greetingSection}>
            <Text style={s.greeting}>Welcome back, {userName}</Text>
            <Text style={s.greetingSub}>Overview of your portfolio performance</Text>
          </View>

          {/* ── KPI Cards (5 tiles matching web) ── */}
          <View style={s.kpiRow}>
            <KpiCard
              icon="wallet"
              iconBg="#EFF6FF"
              label="Total Revenue"
              value={`NPR ${kpis.totalRevenue.toLocaleString()}`}
              change="12.1%"
              positive
            />
            <KpiCard
              icon="bed"
              iconBg="#EFF6FF"
              label="Occupancy Rate"
              value={`${kpis.occupancyRate}%`}
              change="3.2%"
              positive={kpis.occupancyRate > 50}
            />
            <KpiCard
              icon="calendar"
              iconBg="#EFF6FF"
              label="Total Bookings"
              value={String(kpis.totalBookings)}
              change="13.7%"
              positive
            />
            <KpiCard
              icon="trending-up"
              iconBg="#EFF6FF"
              label="ADR (Avg Room Rate)"
              value={`NPR ${kpis.adr.toLocaleString()}`}
              change="1.2%"
              positive
            />
            <KpiCard
              icon="cash"
              iconBg="#EFF6FF"
              label="RevPAR"
              value={`NPR ${kpis.revpar.toLocaleString()}`}
              change="20.4%"
              positive={kpis.revpar > 0}
            />
          </View>

          {/* ── Row 2: Revenue Trend + Rooms Status + Arrivals ── */}
          <View style={s.row2}>
            {/* Revenue Trend Chart */}
            <View style={s.chartCard}>
              <Text style={s.cardTitle}>Revenue Overview</Text>
              <View style={s.trendChart}>
                {revenueTrend.map((d, i) => {
                  const pct = maxRevenue > 0 ? Math.round((d.revenue / maxRevenue) * 100) : 0;
                  return (
                    <View key={i} style={s.trendCol}>
                      <Text style={s.trendValue}>{d.revenue > 0 ? `${(d.revenue / 1000).toFixed(0)}k` : '-'}</Text>
                      <View style={s.trendBarWrap}>
                        <View style={[s.trendBar, { height: `${Math.max(pct, 4)}%` }]} />
                      </View>
                      <Text style={s.trendLabel}>{d.day.split(' ')[1]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Rooms Status */}
            <View style={s.statusCard}>
              <Text style={s.cardTitle}>Rooms Status</Text>
              <View style={s.statusGrid}>
                <StatusCell label="Total" value={kpis.totalRooms} color={NAVY} />
                <StatusCell label="Occupied" value={kpis.occupiedRooms} color="#F59E0B" />
                <StatusCell label="Available" value={kpis.availableRooms} color="#10B981" />
                <StatusCell label="Maintenance" value={kpis.maintenanceRooms} color="#6366F1" />
                <StatusCell label="Out of Order" value={kpis.outOfOrderRooms} color="#EF4444" />
                <StatusCell label="Active Props" value={kpis.activeProperties} color={ACCENT} />
              </View>
            </View>

            {/* Arrivals & Departures */}
            <View style={s.arrivalsCard}>
              <Text style={s.cardTitle}>Today</Text>
              <View style={s.arrivalsSection}>
                <Text style={s.arrivalsLabel}>
                  <View style={[s.dot, { backgroundColor: '#10B981' }]} /> Arrivals ({arrivals.length})
                </Text>
                {arrivals.length === 0 ? (
                  <Text style={s.emptySmall}>No arrivals today</Text>
                ) : (
                  arrivals.slice(0, 3).map((b, i) => (
                    <View key={i} style={s.arrivalRow}>
                      <Text style={s.arrivalName} numberOfLines={1}>{b.guest_name}</Text>
                      <Text style={s.arrivalRoom} numberOfLines={1}>{b.room_name}</Text>
                    </View>
                  ))
                )}
              </View>
              <View style={s.arrivalsSection}>
                <Text style={s.arrivalsLabel}>
                  <View style={[s.dot, { backgroundColor: '#F59E0B' }]} /> Departures ({departures.length})
                </Text>
                {departures.length === 0 ? (
                  <Text style={s.emptySmall}>No departures today</Text>
                ) : (
                  departures.slice(0, 3).map((b, i) => (
                    <View key={i} style={s.arrivalRow}>
                      <Text style={s.arrivalName} numberOfLines={1}>{b.guest_name}</Text>
                      <Text style={s.arrivalRoom} numberOfLines={1}>{b.room_name}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* ── Row 3: Recent Bookings + Room Breakdown ── */}
          <View style={s.row3}>
            {/* Recent Bookings */}
            <View style={s.bookingsCard}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>Recent Bookings</Text>
                <Text style={s.cardSubtitle}>Last {recentBookings.length} reservations</Text>
              </View>
              {recentBookings.length === 0 ? (
                <View style={s.emptyState}>
                  <Ionicons name="calendar-outline" size={32} color={GRAY[300]} />
                  <Text style={s.emptyText}>No bookings yet</Text>
                </View>
              ) : (
                <View>
                  {recentBookings.map((b, i) => {
                    const st = bookingStatusLabel(b.status);
                    return (
                      <View key={i} style={s.bookingRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.bookingGuest} numberOfLines={1}>{b.guest_name}</Text>
                          <Text style={s.bookingRoom} numberOfLines={1}>{b.room_name}</Text>
                        </View>
                        <View style={s.bookingDates}>
                          <Text style={s.bookingDateText}>{b.check_in?.slice(5, 10) || '-'}</Text>
                          <Ionicons name="arrow-forward" size={10} color={GRAY[400]} />
                          <Text style={s.bookingDateText}>{b.check_out?.slice(5, 10) || '-'}</Text>
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                          <Text style={[s.statusBadgeText, { color: st.color }]}>{st.label}</Text>
                        </View>
                        <Text style={s.bookingAmount}>NPR {(b.total || 0).toLocaleString()}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Room Type Breakdown */}
            <View style={s.breakdownCard}>
              <Text style={s.cardTitle}>Room Breakdown</Text>
              <View style={s.breakdownList}>
                {(() => {
                  const grouped: Record<string, { total: number; occupied: number }> = {};
                  for (const r of flatRooms) {
                    const name = r.room_type_name || r.room_name || 'Room';
                    if (!grouped[name]) grouped[name] = { total: 0, occupied: 0 };
                    grouped[name].total++;
                    if (r.status === 'OCCUPIED' || r.status === 'DIRTY') grouped[name].occupied++;
                  }
                  const entries = Object.entries(grouped);
                  if (entries.length === 0) return <Text style={s.emptySmall}>No rooms data</Text>;
                  return entries.map(([name, data], i) => {
                    const pct = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0;
                    return (
                      <View key={i} style={s.breakdownRow}>
                        <Text style={s.breakdownLabel} numberOfLines={1}>{name}</Text>
                        <View style={s.breakdownBarWrap}>
                          <View style={[s.breakdownBar, { width: `${pct}%` }]} />
                        </View>
                        <Text style={s.breakdownValue}>{data.occupied}/{data.total}</Text>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          </View>

          {/* ── Quick Actions ── */}
          <View style={s.quickActions}>
            {[
              { icon: 'add-circle' as const, label: 'New Booking', route: firstPropertyId ? `/(host)/property/${firstPropertyId}/bookings` : '/(host)/listing-wizard' },
              { icon: 'walk' as const, label: 'Walk-in', route: firstPropertyId ? `/(host)/property/${firstPropertyId}/bookings` : '/(host)/listing-wizard' },
              { icon: 'bed' as const, label: 'Add Room', route: firstPropertyId ? `/(host)/property/${firstPropertyId}/rooms` : '/(host)/listing-wizard' },
              { icon: 'people' as const, label: 'Guest List', route: firstPropertyId ? `/(host)/property/${firstPropertyId}/guests` : '/(host)/listing-wizard' },
              { icon: 'bar-chart' as const, label: 'Reports', route: firstPropertyId ? `/(host)/property/${firstPropertyId}/reports` : '/(host)/listing-wizard' },
            ].map((action, i) => (
              <TouchableOpacity key={i} style={s.quickActionBtn} onPress={() => router.push(action.route as any)} activeOpacity={0.8}>
                <Ionicons name={action.icon} size={20} color={ACCENT} />
                <Text style={s.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Revenue by Property ── */}
          {properties.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.cardTitle}>Revenue by Property</Text>
              {propertyRevenue.some(d => d.revenue > 0) ? (
                <View style={s.chartBars}>
                  {propertyRevenue.map((d, i) => {
                    const pct = Math.round((d.revenue / maxPropRevenue) * 100);
                    return (
                      <View key={i} style={s.barRow}>
                        <View style={s.barLabelRow}>
                          <Text style={s.barLabel} numberOfLines={1}>{d.name}</Text>
                          <Text style={s.barValue}>NPR {d.revenue.toLocaleString()}</Text>
                        </View>
                        <View style={s.barTrack}>
                          <View style={[s.barFill, { width: `${pct}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={s.emptyChart}>
                  <Text style={s.emptySmall}>No revenue data yet</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Property List ── */}
          <Text style={s.sectionTitle}>All Properties</Text>
          <Text style={s.sectionSub}>{properties.length} property{properties.length !== 1 ? 'ies' : 'y'}</Text>

          {properties.length === 0 && (
            <View style={s.emptyStateCard}>
              <View style={s.emptyIcon}>
                <Ionicons name="business-outline" size={36} color={ACCENT} />
              </View>
              <Text style={s.emptyTitle}>No properties yet</Text>
              <Text style={s.emptyDesc}>
                Create your first listing to start managing rooms, staff and bookings.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(host)/listing-wizard')}
                style={s.emptyBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color={BGTokens.white} />
                <Text style={s.emptyBtnText}>New Listing</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ gap: 14, marginTop: 16 }}>
            {pagedProperties.map(p => {
              const propRooms = allRooms.find(r => r.propertyId === p.id)?.rooms || [];
              const occupied = propRooms.filter(r => r.status === 'OCCUPIED' || r.status === 'DIRTY').length;
              const occPct = propRooms.length > 0 ? Math.round((occupied / propRooms.length) * 100) : 0;
              return (
                <View key={p.id} style={{ gap: 10 }}>
                  <TouchableOpacity
                    style={s.propertyCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/(host)/property/${p.id}`)}
                  >
                    <View style={s.cardTop}>
                      {p.photos?.length > 0 ? (
                        <Image
                          source={{ uri: (p.photos.find(ph => ph.category === 'cover') || p.photos[0])?.photo_url }}
                          style={s.cardImage}
                        />
                      ) : (
                        <View style={s.cardImagePlaceholder}>
                          <Ionicons name="business-outline" size={32} color={ACCENT} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardName}>{p.name}</Text>
                        <Text style={s.cardLocation}>
                          <Ionicons name="location-outline" size={12} color={GRAY[400]} /> {p.city}, {p.country}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push(`/(host)/property/edit/${p.id}`)}
                        style={s.editIconBtn}
                      >
                        <Ionicons name="create-outline" size={16} color={GRAY[400]} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'Delete Property',
                            `Are you sure you want to delete "${p.name}"? This cannot be undone.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => removeProperty(p.id) },
                            ],
                          );
                        }}
                        style={[s.editIconBtn, { backgroundColor: RED[50] }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={RED[500]} />
                      </TouchableOpacity>
                      <View style={{ alignItems: 'center', gap: 2 }}>
                        <Switch
                          value={p.is_active}
                          onValueChange={() => togglePropertyActivation(p.id)}
                          trackColor={{ false: RED[100], true: STATUS.badgeGreen }}
                          thumbColor={p.is_active ? STATUS.activeGreenDark : RED[500]}
                        />
                        <Text style={[s.statusText, { color: p.is_active ? STATUS.activeGreenDark : RED[500] }]}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <View style={s.cardStats}>
                      <View style={s.statItem}>
                        <Text style={s.statValue}>{propRooms.length || p.total_rooms}</Text>
                        <Text style={s.statLabel}>Rooms</Text>
                      </View>
                      <View style={s.statDivider} />
                      <View style={s.statItem}>
                        <Text style={s.statValue}>{p.type}</Text>
                        <Text style={s.statLabel}>Type</Text>
                      </View>
                      <View style={s.statDivider} />
                      <View style={s.statItem}>
                        <Text style={s.statValue}>{occPct}%</Text>
                        <Text style={s.statLabel}>Occupancy</Text>
                      </View>
                      <View style={s.statDivider} />
                      <View style={s.statItem}>
                        <Text style={s.statValue}>{p.number_of_floors}</Text>
                        <Text style={s.statLabel}>Floors</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {!isApiPropertyId(p.id) && <PropertySyncBanner property={p} />}
                </View>
              );
            })}
          </View>

          {properties.length > PAGE_SIZE && (
            <PaginationControls
              page={currentPage - 1}
              totalPages={totalPages}
              canGoNext={currentPage < totalPages}
              onPrev={prevPage}
              onNext={nextPage}
            />
          )}
        </ScrollView>
      </Drawer>
    </View>
  );
}

// ── Sub-components ──

function KpiCard({ icon, iconBg, label, value, change, positive }: {
  icon: string; iconBg: string; label: string; value: string; change: string; positive: boolean;
}) {
  return (
    <View style={s.kpiCard}>
      <View style={s.kpiHeader}>
        <Text style={s.kpiLabel}>{label}</Text>
        <View style={[s.kpiIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={16} color="#2563EB" />
        </View>
      </View>
      <Text style={s.kpiValue}>{value}</Text>
      <View style={s.kpiChangeRow}>
        <View style={[s.kpiChangePill, { backgroundColor: positive ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[s.kpiChangeText, { color: positive ? '#16A34A' : '#DC2626' }]}>
            {positive ? '\u2197' : '\u2198'} {change}
          </Text>
        </View>
        <Text style={s.kpiChangeLabel}>vs last month</Text>
      </View>
    </View>
  );
}

function StatusCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.statusCell}>
      <View style={[s.statusDot, { backgroundColor: color }]} />
      <Text style={s.statusCellValue}>{value}</Text>
      <Text style={s.statusCellLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: BG },

  topBar: {
    paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BGTokens.white, borderBottomWidth: 1, borderBottomColor: GRAY[200],
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  brand: { ...TYPOGRAPHY.body, fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
  tabLabel: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 1 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.button, backgroundColor: ACCENT },
  newBtnText: { ...TYPOGRAPHY.small, fontWeight: '700', color: BGTokens.white },

  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Property Switcher
  propertySwitcherWrap: { position: 'relative', zIndex: 100 },
  propertySwitcher: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.button,
    backgroundColor: GRAY[100], borderWidth: 1, borderColor: GRAY[200],
  },
  propertySwitcherText: { fontSize: 13, fontWeight: '600', color: NAVY, maxWidth: 100 },
  dropdown: {
    position: 'absolute', top: '100%', right: 0, marginTop: 4,
    backgroundColor: BGTokens.white, borderRadius: 12, borderWidth: 1, borderColor: GRAY[200],
    width: 220, ...SHADOWS.card, zIndex: 200,
  },
  dropdownItem: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: GRAY[100],
  },
  dropdownItemActive: { backgroundColor: ACCENT + '08' },
  dropdownText: { fontSize: 13, fontWeight: '500', color: GRAY[700] },
  dropdownTextActive: { color: ACCENT, fontWeight: '700' },
  dropdownSubtext: { fontSize: 11, color: GRAY[400], marginTop: 2 },

  // Notification Bell
  notifBtn: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GRAY[200] },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: RED[500],
    alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: BGTokens.white },

  drawer: { flex: 1, backgroundColor: NAVY },
  drawerHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 20, fontWeight: '700', color: BGTokens.white },
  drawerName: { fontSize: 17, fontWeight: '700', color: BGTokens.white },
  drawerRole: { fontSize: 12, color: CLOUD.slateBlue, marginTop: 2 },
  drawerEmail: { fontSize: 12, color: CLOUD.slateBlue, marginTop: 4 },

  navItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20, marginHorizontal: 12, borderRadius: 10 },
  navItemActive: { backgroundColor: 'rgba(46,134,171,0.2)' },
  navSection: {
    fontSize: 11, fontWeight: '700', color: CLOUD.slateBlue, letterSpacing: 0.5,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6, textTransform: 'uppercase',
  },
  navIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: ACCENT },
  navLabel: { fontSize: 15, fontWeight: '500', color: CLOUD.cloud, flex: 1 },
  navLabelActive: { color: BGTokens.white, fontWeight: '700' },
  navActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },

  newListingBtn: { marginHorizontal: 12, marginBottom: 4, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', gap: 8 },
  newListingText: { fontSize: 15, fontWeight: '700', color: BGTokens.white },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, marginVertical: 8 },
  logoutBtn: { marginHorizontal: 12, marginBottom: 12, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutText: { fontSize: 15, fontWeight: '500', color: RED[500] },

  loadingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 12,
    backgroundColor: '#EFF6FF', borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE',
  },
  loadingBannerText: { fontSize: 13, color: '#2563EB', fontWeight: '500' },

  greetingSection: { marginBottom: 18 },
  greeting: { ...TYPOGRAPHY.h1, color: GRAY[900], letterSpacing: -0.3 },
  greetingSub: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 4 },

  // KPI Cards
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: {
    width: '47%', backgroundColor: BGTokens.white, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: GRAY[200],
  },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  kpiLabel: { ...TYPOGRAPHY.small, color: GRAY[500], fontWeight: '500', flex: 1 },
  kpiIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 28, fontWeight: '700', color: GRAY[900], marginBottom: 8 },
  kpiChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kpiChangePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  kpiChangeText: { fontSize: 12, fontWeight: '600' },
  kpiChangeLabel: { fontSize: 12, color: GRAY[400] },

  // Row layouts
  row2: { gap: 16, marginBottom: 16 },
  row3: { gap: 16, marginBottom: 16 },

  // Cards
  chartCard: {
    backgroundColor: BGTokens.white, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: GRAY[200],
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: GRAY[900], marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardSubtitle: { fontSize: 12, color: GRAY[400] },

  // Revenue Trend
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 4 },
  trendCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  trendValue: { fontSize: 10, color: GRAY[500], marginBottom: 4, fontWeight: '600' },
  trendBarWrap: { width: '80%', height: '70%', justifyContent: 'flex-end', alignItems: 'center' },
  trendBar: { width: '100%', borderRadius: 4, backgroundColor: ACCENT },
  trendLabel: { fontSize: 10, color: GRAY[400], marginTop: 4 },

  // Rooms Status
  statusCard: {
    backgroundColor: BGTokens.white, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: GRAY[200],
  },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusCell: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusCellValue: { fontSize: 16, fontWeight: '700', color: GRAY[900] },
  statusCellLabel: { fontSize: 12, color: GRAY[500], flex: 1 },

  // Arrivals & Departures
  arrivalsCard: {
    backgroundColor: BGTokens.white, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: GRAY[200],
  },
  arrivalsSection: { marginBottom: 16 },
  arrivalsLabel: { fontSize: 13, fontWeight: '700', color: GRAY[700], marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  arrivalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  arrivalName: { flex: 1, fontSize: 13, fontWeight: '600', color: GRAY[800] },
  arrivalRoom: { fontSize: 12, color: GRAY[400], width: 80 },

  // Recent Bookings
  bookingsCard: {
    backgroundColor: BGTokens.white, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: GRAY[200],
  },
  bookingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: GRAY[100],
  },
  bookingGuest: { fontSize: 13, fontWeight: '600', color: GRAY[800] },
  bookingRoom: { fontSize: 11, color: GRAY[400], marginTop: 2 },
  bookingDates: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookingDateText: { fontSize: 11, color: GRAY[500] },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  bookingAmount: { fontSize: 13, fontWeight: '700', color: GRAY[900], minWidth: 70, textAlign: 'right' },

  // Room Breakdown
  breakdownCard: {
    backgroundColor: BGTokens.white, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: GRAY[200],
  },
  breakdownList: { gap: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownLabel: { fontSize: 13, fontWeight: '500', color: GRAY[700], width: 100 },
  breakdownBarWrap: { flex: 1, height: 8, borderRadius: 4, backgroundColor: GRAY[100], overflow: 'hidden' },
  breakdownBar: { height: 8, borderRadius: 4, backgroundColor: ACCENT },
  breakdownValue: { fontSize: 12, fontWeight: '600', color: GRAY[600], width: 40, textAlign: 'right' },

  // Quick Actions
  quickActions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1, minWidth: '18%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: BGTokens.white, borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: GRAY[200],
  },
  quickActionText: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[700] },

  // Revenue by Property
  chartBars: { gap: 14 },
  barRow: { gap: 6 },
  barLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  barLabel: { fontSize: 13, fontWeight: '500', color: GRAY[700], flex: 1 },
  barValue: { fontSize: 13, fontWeight: '700', color: GRAY[900] },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: GRAY[100], overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: ACCENT },
  emptyChart: { height: 80, alignItems: 'center', justifyContent: 'center' },
  emptySmall: { fontSize: 13, color: GRAY[400], textAlign: 'center', paddingVertical: 8 },

  // Property List
  sectionTitle: { ...TYPOGRAPHY.h2, color: GRAY[900] },
  sectionSub: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },

  propertyCard: {
    backgroundColor: BGTokens.white, borderRadius: 16,
    borderWidth: 1, borderColor: GRAY[200],
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', gap: 14, padding: 16, alignItems: 'center' },
  cardImage: { width: 56, height: 56, borderRadius: RADIUS.modal },
  cardImagePlaceholder: {
    width: 56, height: 56, borderRadius: RADIUS.modal,
    backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center',
  },
  cardName: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  cardLocation: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 3 },
  editIconBtn: { width: 32, height: 32, borderRadius: RADIUS.card, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  statusText: { ...TYPOGRAPHY.small, fontWeight: '700' },

  cardStats: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: GRAY[100],
    paddingVertical: 12, paddingHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  statLabel: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
  statDivider: { width: 1, backgroundColor: GRAY[100] },

  // Empty states
  emptyState: {
    alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20,
  },
  emptyStateCard: {
    alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32,
    backgroundColor: BGTokens.white, borderRadius: 16, marginTop: 16,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: ACCENT + '14',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: GRAY[900], textAlign: 'center' },
  emptyDesc: { ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emptyText: { ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center', marginTop: 8 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.button, backgroundColor: ACCENT,
  },
  emptyBtnText: { ...TYPOGRAPHY.small, fontWeight: '700', color: BGTokens.white },
});
