import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';
import { safeGoBack } from '@/lib/utils';

const ACCENT = '#2E86AB';

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  estimatedTime: string;
}

interface ServiceRequest {
  id: string;
  category: string;
  service: string;
  details: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  roomNumber: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'room-service', name: 'Room Service', icon: 'restaurant', description: 'Order food & beverages to your room', estimatedTime: '30-45 min' },
  { id: 'housekeeping', name: 'Housekeeping', icon: 'cleaning', description: 'Extra towels, cleaning, turndown service', estimatedTime: '15-30 min' },
  { id: 'spa', name: 'Spa & Wellness', icon: 'spa', description: 'Book massage, treatment or wellness session', estimatedTime: '60 min' },
  { id: 'transport', name: 'Transport', icon: 'directions-car', description: 'Airport transfer, city tour, taxi booking', estimatedTime: 'As scheduled' },
  { id: 'laundry', name: 'Laundry', icon: 'local-laundry-service', description: 'Wash, dry-clean, ironing service', estimatedTime: '4-8 hours' },
  { id: 'maintenance', name: 'Maintenance', icon: 'build', description: 'Report issues or request repairs', estimatedTime: '15-30 min' },
];

const ROOM_SERVICE_ITEMS = [
  { id: 'rs-1', name: 'Continental Breakfast', price: 800, category: 'Breakfast' },
  { id: 'rs-2', name: 'American Breakfast', price: 1200, category: 'Breakfast' },
  { id: 'rs-3', name: 'Chicken Sandwich', price: 650, category: 'Lunch' },
  { id: 'rs-4', name: 'Caesar Salad', price: 550, category: 'Lunch' },
  { id: 'rs-5', name: 'Grilled Chicken', price: 900, category: 'Dinner' },
  { id: 'rs-6', name: 'Pasta Alfredo', price: 750, category: 'Dinner' },
  { id: 'rs-7', name: 'Fresh Juice', price: 250, category: 'Beverages' },
  { id: 'rs-8', name: 'Coffee / Tea', price: 150, category: 'Beverages' },
  { id: 'rs-9', name: 'Bottled Water', price: 100, category: 'Beverages' },
];

const SPA_SERVICES = [
  { id: 'sp-1', name: 'Swedish Massage', price: 3500, duration: '60 min' },
  { id: 'sp-2', name: 'Deep Tissue Massage', price: 4000, duration: '60 min' },
  { id: 'sp-3', name: 'Aromatherapy', price: 3000, duration: '45 min' },
  { id: 'sp-4', name: 'Facial Treatment', price: 2500, duration: '30 min' },
  { id: 'sp-5', name: 'Foot Reflexology', price: 2000, duration: '30 min' },
];

const HOUSEKEEPING_OPTIONS = [
  { id: 'hk-1', name: 'Extra Towels', icon: 'housekeeping' },
  { id: 'hk-2', name: 'Extra Pillows', icon: 'housekeeping' },
  { id: 'hk-3', name: 'Room Cleaning', icon: 'cleaning' },
  { id: 'hk-4', name: 'Turndown Service', icon: 'housekeeping' },
  { id: 'hk-5', name: 'Toiletry Restock', icon: 'spa' },
  { id: 'hk-6', name: 'Minibar Restock', icon: 'drink' },
];

const MOCK_REQUESTS: ServiceRequest[] = [
  { id: 'sr-1', category: 'Room Service', service: 'Continental Breakfast', details: 'Room 301', status: 'completed', createdAt: '2026-07-27T08:30:00', roomNumber: '301' },
  { id: 'sr-2', category: 'Housekeeping', service: 'Room Cleaning', details: 'Preferred time: morning', status: 'in_progress', createdAt: '2026-07-28T09:00:00', roomNumber: '301' },
];

export default function ServicesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [roomNumber, setRoomNumber] = useState('301');
  const [requests, setRequests] = useState<ServiceRequest[]>(MOCK_REQUESTS);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = () => {
    if (!selectedCategory || !selectedService) {
      Alert.alert('Select Service', 'Please choose a category and service');
      return;
    }
    const cat = SERVICE_CATEGORIES.find(c => c.id === selectedCategory);
    const newReq: ServiceRequest = {
      id: 'sr-' + Date.now(),
      category: cat?.name || selectedCategory,
      service: selectedService,
      details: requestDetails || `Room ${roomNumber}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      roomNumber,
    };
    setRequests(prev => [newReq, ...prev]);
    setSelectedCategory(null);
    setSelectedService(null);
    setRequestDetails('');
    Alert.alert('Request Submitted', 'Your service request has been received. We will fulfill it shortly.');
  };

  const activeRequests = requests.filter(r => r.status !== 'completed');
  const completedRequests = requests.filter(r => r.status === 'completed');

  if (showHistory) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setShowHistory(false)} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Request History</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
          {requests.length === 0 ? (
            <View style={s.emptyState}>
              <IconSymbol name="invoice" size={48} color="#CBD5E1" />
              <Text style={s.emptyTitle}>No requests yet</Text>
              <Text style={s.emptyDesc}>Your service requests will appear here</Text>
            </View>
          ) : (
            requests.map(req => (
              <View key={req.id} style={s.historyCard}>
                <View style={s.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.historyService}>{req.service}</Text>
                    <Text style={s.historyCategory}>{req.category}</Text>
                  </View>
                  <View style={[s.statusBadge, req.status === 'completed' ? s.statusCompleted : req.status === 'in_progress' ? s.statusProgress : s.statusPending]}>
                    <Text style={[s.statusText, req.status === 'completed' ? s.statusTextCompleted : req.status === 'in_progress' ? s.statusTextProgress : s.statusTextPending]}>
                      {req.status === 'completed' ? 'Completed' : req.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={s.historyDetails}>{req.details}</Text>
                <Text style={s.historyTime}>{new Date(req.createdAt).toLocaleString()}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  if (selectedCategory) {
    const cat = SERVICE_CATEGORIES.find(c => c.id === selectedCategory);
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setSelectedCategory(null); setSelectedService(null); }} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{cat?.name || 'Service'}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 160 }}>
          <Text style={s.categoryDesc}>{cat?.description}</Text>

          {selectedCategory === 'room-service' && (
            <>
              {['Breakfast', 'Lunch', 'Dinner', 'Beverages'].map(meal => (
                <View key={meal}>
                  <Text style={s.sectionLabel}>{meal}</Text>
                  {ROOM_SERVICE_ITEMS.filter(i => i.category === meal).map(item => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedService(item.name)}
                      style={[s.serviceItem, selectedService === item.name && s.serviceItemActive]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.serviceName, selectedService === item.name && { color: ACCENT }]}>{item.name}</Text>
                        <Text style={s.servicePrice}>NPR {item.price.toLocaleString()}</Text>
                      </View>
                      <View style={[s.radioCircle, selectedService === item.name && s.radioActive]}>
                        {selectedService === item.name && <View style={s.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </>
          )}

          {selectedCategory === 'spa' && (
            <View style={{ gap: 10 }}>
              {SPA_SERVICES.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedService(item.name)}
                  style={[s.serviceItem, selectedService === item.name && s.serviceItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.serviceName, selectedService === item.name && { color: ACCENT }]}>{item.name}</Text>
                    <Text style={s.servicePrice}>NPR {item.price.toLocaleString()} · {item.duration}</Text>
                  </View>
                  <View style={[s.radioCircle, selectedService === item.name && s.radioActive]}>
                    {selectedService === item.name && <View style={s.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedCategory === 'housekeeping' && (
            <View style={s.hkGrid}>
              {HOUSEKEEPING_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSelectedService(opt.name)}
                  style={[s.hkCard, selectedService === opt.name && s.hkCardActive]}
                >
                  <IconSymbol name={opt.icon as any} size={24} color={selectedService === opt.name ? ACCENT : '#64748B'} />
                  <Text style={[s.hkLabel, selectedService === opt.name && { color: ACCENT }]}>{opt.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedCategory === 'transport' && (
            <View style={{ gap: 10 }}>
              {[
                { id: 't-1', name: 'Airport Transfer', desc: 'Sedan, one-way', price: 2500 },
                { id: 't-2', name: 'Airport Transfer', desc: 'SUV, one-way', price: 3500 },
                { id: 't-3', name: 'City Tour', desc: 'Half-day guided tour', price: 4000 },
                { id: 't-4', name: 'Taxi Booking', desc: 'Per hour (min 2 hrs)', price: 1500 },
              ].map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedService(item.name)}
                  style={[s.serviceItem, selectedService === item.name && s.serviceItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.serviceName, selectedService === item.name && { color: ACCENT }]}>{item.name}</Text>
                    <Text style={s.servicePrice}>NPR {item.price.toLocaleString()} · {item.desc}</Text>
                  </View>
                  <View style={[s.radioCircle, selectedService === item.name && s.radioActive]}>
                    {selectedService === item.name && <View style={s.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedCategory === 'laundry' && (
            <View style={{ gap: 10 }}>
              {[
                { id: 'l-1', name: 'Wash & Fold', desc: 'Per kg', price: 300 },
                { id: 'l-2', name: 'Dry Cleaning', desc: 'Per item', price: 500 },
                { id: 'l-3', name: 'Ironing', desc: 'Per piece', price: 100 },
                { id: 'l-4', name: 'Express Service', desc: '2-hour turnaround (+50%)', price: 450 },
              ].map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedService(item.name)}
                  style={[s.serviceItem, selectedService === item.name && s.serviceItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.serviceName, selectedService === item.name && { color: ACCENT }]}>{item.name}</Text>
                    <Text style={s.servicePrice}>NPR {item.price.toLocaleString()} · {item.desc}</Text>
                  </View>
                  <View style={[s.radioCircle, selectedService === item.name && s.radioActive]}>
                    {selectedService === item.name && <View style={s.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedCategory === 'maintenance' && (
            <View style={{ gap: 10 }}>
              {['Plumbing issue', 'Electrical issue', 'AC not working', 'WiFi issue', 'Lock/Key issue', 'Other'].map(item => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setSelectedService(item)}
                  style={[s.serviceItem, selectedService === item && s.serviceItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.serviceName, selectedService === item && { color: ACCENT }]}>{item}</Text>
                  </View>
                  <View style={[s.radioCircle, selectedService === item && s.radioActive]}>
                    {selectedService === item && <View style={s.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedService && (
            <View style={{ gap: 8 }}>
              <Text style={s.fieldLabel}>Additional Details (optional)</Text>
              <TextInput
                placeholder="Any special instructions..." placeholderTextColor="#94A3B8"
                value={requestDetails} onChangeText={setRequestDetails}
                multiline numberOfLines={3}
                style={[s.input, { minHeight: 72, textAlignVertical: 'top' }]}
              />
            </View>
          )}

          <View style={s.etaRow}>
            <IconSymbol name="shift" size={16} color="#64748B" />
            <Text style={s.etaText}>Estimated time: {cat?.estimatedTime}</Text>
          </View>
        </ScrollView>

        <View style={s.bottomBar}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedService}
            style={[s.submitBtn, { opacity: selectedService ? 1 : 0.5 }]}
            activeOpacity={0.9}
          >
            <Text style={s.submitBtnText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Hotel Services</Text>
        <TouchableOpacity onPress={() => setShowHistory(true)} style={s.historyBtn}>
          <IconSymbol name="shift" size={18} color="#1A3C5E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        <Text style={s.pageDesc}>Request services for your stay. Tap a category to get started.</Text>

        {/* Active Requests Banner */}
        {activeRequests.length > 0 && (
          <View style={s.activeBanner}>
            <View style={s.activeBannerDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.activeBannerTitle}>{activeRequests.length} active request{activeRequests.length > 1 ? 's' : ''}</Text>
              <Text style={s.activeBannerSub}>{activeRequests.map(r => r.service).join(', ')}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowHistory(true)}>
              <IconSymbol name="chevron.right" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Service Grid */}
        <View style={s.categoryGrid}>
          {SERVICE_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={s.categoryCard}
              activeOpacity={0.7}
            >
              <View style={s.categoryIconWrap}>
                <IconSymbol name={cat.icon as any} size={28} color={ACCENT} />
              </View>
              <Text style={s.categoryName}>{cat.name}</Text>
              <Text style={s.categoryBrief} numberOfLines={2}>{cat.description}</Text>
              <View style={s.categoryEta}>
                <IconSymbol name="shift" size={12} color="#94A3B8" />
                <Text style={s.categoryEtaText}>{cat.estimatedTime}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const PF = FONTS.playfairDisplay.bold;
const IR = FONTS.inter.regular;
const IM = FONTS.inter.medium;
const IB = FONTS.inter.bold;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A3C5E', fontFamily: PF },
  historyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },

  pageDesc: { fontSize: 13, color: '#64748B', lineHeight: 19, fontFamily: IR },

  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 14, backgroundColor: ACCENT,
  },
  activeBannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  activeBannerTitle: { fontSize: 13, fontWeight: '700', color: '#FFF', fontFamily: IB },
  activeBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1, fontFamily: IR },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  categoryIconWrap: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(46, 134, 171, 0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  categoryName: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', fontFamily: IM, marginBottom: 2 },
  categoryBrief: { fontSize: 11, color: '#94A3B8', lineHeight: 16, fontFamily: IR, marginBottom: 8 },
  categoryEta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryEtaText: { fontSize: 10, color: '#94A3B8', fontFamily: IR },

  categoryDesc: { fontSize: 13, color: '#64748B', lineHeight: 19, fontFamily: IR, marginBottom: 4 },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#1A3C5E', letterSpacing: 0.3, marginTop: 8, marginBottom: 4, fontFamily: IM },

  serviceItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  serviceItemActive: { borderColor: ACCENT, backgroundColor: 'rgba(46, 134, 171, 0.04)' },
  serviceName: { fontSize: 13, fontWeight: '600', color: '#1A3C5E', fontFamily: IM },
  servicePrice: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontFamily: IR },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: ACCENT },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT },

  hkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hkCard: {
    width: '30%', backgroundColor: '#FFF', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', gap: 6,
  },
  hkCardActive: { borderColor: ACCENT, backgroundColor: 'rgba(46, 134, 171, 0.04)' },
  hkLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', textAlign: 'center', fontFamily: IM },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#1A3C5E', marginBottom: 4, fontFamily: IM },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A' },

  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#F8FAFC' },
  etaText: { fontSize: 12, color: '#64748B', fontFamily: IR },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 36, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  submitBtn: { paddingVertical: 15, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF', fontFamily: IB },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A3C5E', fontFamily: PF },
  emptyDesc: { fontSize: 13, color: '#94A3B8', fontFamily: IR },

  historyCard: { padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', gap: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyService: { fontSize: 14, fontWeight: '600', color: '#1A3C5E', fontFamily: IM },
  historyCategory: { fontSize: 11, color: '#94A3B8', fontFamily: IR },
  historyDetails: { fontSize: 12, color: '#64748B', fontFamily: IR },
  historyTime: { fontSize: 10, color: '#CBD5E1', fontFamily: IR, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPending: { backgroundColor: 'rgba(211, 84, 0, 0.08)' },
  statusProgress: { backgroundColor: 'rgba(46, 134, 171, 0.08)' },
  statusCompleted: { backgroundColor: 'rgba(30, 132, 73, 0.08)' },
  statusText: { fontSize: 10, fontWeight: '700', fontFamily: IB },
  statusTextPending: { color: '#D35400' },
  statusTextProgress: { color: ACCENT },
  statusTextCompleted: { color: '#1E8449' },
});
