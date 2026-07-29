import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';

const ACCENT = '#2E86AB';

interface Props { property: Property; onSelectCover?: () => void }

const SETTINGS_SECTIONS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'company', label: 'Company Profile', icon: 'business-outline' },
  { key: 'general', label: 'General Settings', icon: 'settings-outline' },
  { key: 'booking', label: 'Booking Settings', icon: 'calendar-outline' },
  { key: 'room-rate', label: 'Room & Rate', icon: 'bed-outline' },
  { key: 'amenities', label: 'Amenities', icon: 'sparkles-outline' },
  { key: 'notifications', label: 'Notification Settings', icon: 'notifications-outline' },
  { key: 'taxes', label: 'Taxes & Policies', icon: 'receipt-outline' },
  { key: 'payments', label: 'Payment Method & Policies', icon: 'card-outline' },
  { key: 'integrations', label: 'Integrations', icon: 'git-merge-outline' },
  { key: 'logs', label: 'Activity Logs', icon: 'document-text-outline' },
  { key: 'support', label: 'Support Tickets', icon: 'help-circle-outline' },
];

export function PropertySettings({ property }: Props) {
  const [activeSection, setActiveSection] = React.useState('company');
  const [showCoverPicker, setShowCoverPicker] = React.useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = React.useState(false);
  const { setPropertyCoverPhoto, addPropertyGalleryPhotos, removePropertyGalleryPhoto } = useHost();

  const renderSection = () => {
    switch (activeSection) {
      case 'company': return (
        <CompanyProfileSection
          property={property}
          onSelectCover={() => setShowCoverPicker(true)}
          onAddGallery={() => setShowGalleryPicker(true)}
          onRemoveGallery={(url) => removePropertyGalleryPhoto(property.id, url)}
        />
      );
      case 'general': return <GeneralSection property={property} />;
      case 'booking': return <BookingSection />;
      case 'room-rate': return <RoomRateSection />;
      case 'amenities': return <AmenitiesSection />;
      case 'notifications': return <NotificationsSection />;
      case 'taxes': return <TaxesSection />;
      case 'payments': return <PaymentsSection />;
      case 'integrations': return <IntegrationsSection />;
      case 'logs': return <ActivityLogsSection />;
      case 'support': return <SupportSection />;
      default: return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
        {SETTINGS_SECTIONS.map(s => (
          <TouchableOpacity key={s.key} onPress={() => setActiveSection(s.key)}
            style={[navStyles.chip, activeSection === s.key && navStyles.chipActive]}>
            <Ionicons name={s.icon} size={14} color={activeSection === s.key ? '#FFF' : '#64748B'} />
            <Text style={[navStyles.chipLabel, activeSection === s.key && navStyles.chipLabelActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {renderSection()}
      </ScrollView>
      <ImagePickerOverlay
        visible={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        onImagePicked={async (uri) => {
          await setPropertyCoverPhoto(property.id, uri);
        }}
      />
      <ImagePickerOverlay
        visible={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onImagePicked={async (uri) => {
          await addPropertyGalleryPhotos(property.id, [uri]);
        }}
      />
    </View>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={formStyles.row}>
      <Text style={formStyles.rowLabel}>{label}</Text>
      <Text style={formStyles.rowValue}>{value}</Text>
    </View>
  );
}

function CompanyProfileSection({ property, onSelectCover, onAddGallery, onRemoveGallery }: Props & { onSelectCover: () => void; onAddGallery: () => void; onRemoveGallery: (url: string) => void }) {
  const cover = property.photos.find(p => p.category === 'cover');
  const gallery = property.photos.filter(p => p.category === 'gallery');
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Company Profile</Text>

      {/* Cover Photo */}
      <View style={[formStyles.card, { marginBottom: 12 }]}>
        <View className="flex-row items-center justify-between mb-2 px-4 pt-3">
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>Cover Photo</Text>
        </View>
        {cover ? (
          <View style={{ position: 'relative', marginBottom: 8, marginHorizontal: 12 }}>
            <Image source={{ uri: cover.photo_url }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
            <TouchableOpacity
              onPress={onSelectCover}
              style={{ position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="camera-outline" size={14} color="#FFF" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFF' }}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={onSelectCover}
            style={{ marginHorizontal: 12, marginBottom: 12, height: 120, borderRadius: 12, borderWidth: 1.5, borderColor: ACCENT + '40', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT + '08' }}
          >
            <Ionicons name="camera-outline" size={24} color={ACCENT} />
            <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600', marginTop: 4 }}>Upload Cover Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Gallery Photos */}
      <View style={[formStyles.card, { marginBottom: 12 }]}>
        <View className="flex-row items-center justify-between mb-2 px-4 pt-3">
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>Gallery ({gallery.length})</Text>
          <TouchableOpacity onPress={onAddGallery} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: ACCENT + '15' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {gallery.length === 0 ? (
          <Text style={{ fontSize: 12, color: '#94A3B8', marginHorizontal: 12, marginBottom: 12 }}>No gallery photos yet</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 12, marginBottom: 12 }}>
            {gallery.map((photo, idx) => (
              <View key={photo.id || idx} style={{ width: '30%', aspectRatio: 4 / 3, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                <Image source={{ uri: photo.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <TouchableOpacity onPress={() => onRemoveGallery(photo.photo_url)}
                  style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.85)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={formStyles.card}>
        <SettingRow label="Property Name" value={property.name} />
        <SettingRow label="Type" value={property.type} />
        <SettingRow label="City" value={property.city} />
        <SettingRow label="Country" value={property.country} />
        <SettingRow label="Status" value={property.is_active ? 'Active' : 'Inactive'} />
        <SettingRow label="Check-in" value={`${property.check_in_time_from} – ${property.check_in_time_to}`} />
        <SettingRow label="Check-out" value={`${property.check_out_time_from} – ${property.check_out_time_to}`} />
      </View>
    </View>
  );
}

function GeneralSection({ property }: Props) {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>General Settings</Text>
      <View style={formStyles.card}>
        <SettingRow label="Default Currency" value={property.currency || 'USD'} />
        <SettingRow label="Time Zone" value={property.timezone || 'UTC'} />
        <SettingRow label="Language" value="English" />
        <SettingRow label="Floors" value={String(property.number_of_floors)} />
        <SettingRow label="Total Rooms" value={String(property.total_rooms)} />
        <SettingRow label="Default Check-in" value={property.check_in_time_from || '14:00'} />
        <SettingRow label="Default Check-out" value={property.check_out_time_to || '11:00'} />
      </View>
    </View>
  );
}

function BookingSection() {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Booking Settings</Text>
      <View style={formStyles.card}>
        <SettingRow label="Min Stay" value="1 night" />
        <SettingRow label="Max Stay" value="30 nights" />
        <SettingRow label="Advance Booking" value="90 days" />
        <SettingRow label="Auto-confirm" value="Yes" />
        <SettingRow label="Cancellation Policy" value="Free 24h before" />
      </View>
    </View>
  );
}

function RoomRateSection() {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Room & Rate Settings</Text>
      <View style={formStyles.card}>
        <SettingRow label="Dynamic Pricing" value="Disabled" />
        <SettingRow label="Weekend Premium" value="20%" />
        <SettingRow label="Seasonal Rates" value="Not configured" />
        <SettingRow label="Minimum Rates" value="Set per room type" />
      </View>
    </View>
  );
}

function AmenitiesSection() {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Amenities</Text>
      <View style={formStyles.card}>
        <SettingRow label="WiFi" value="Free" />
        <SettingRow label="Breakfast" value="Included" />
        <SettingRow label="Parking" value="Available" />
        <SettingRow label="Pool" value="Seasonal" />
        <SettingRow label="Gym" value="24/7 Access" />
        <SettingRow label="AC" value="Central" />
      </View>
    </View>
  );
}

function NotificationsSection() {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Notification Preferences</Text>
      <View style={formStyles.card}>
        <SettingRow label="New Booking" value="Push + Email" />
        <SettingRow label="Cancellation" value="Push + Email" />
        <SettingRow label="Check-in Reminder" value="Push" />
        <SettingRow label="Check-out Reminder" value="Push" />
        <SettingRow label="Review Received" value="Email" />
      </View>
    </View>
  );
}

function TaxesSection() {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Taxes & Policies</Text>
      <View style={formStyles.card}>
        <Text style={formStyles.subSectionTitle}>Tax Configuration</Text>
        <SettingRow label="VAT / GST" value="10%" />
        <SettingRow label="Service Charge" value="5%" />
        <SettingRow label="Tourist Tax" value="2%" />
        <SettingRow label="Tax Included in Price" value="Yes" />
      </View>
      <View style={[formStyles.card, { marginTop: 12 }]}>
        <Text style={formStyles.subSectionTitle}>Hotel Policies</Text>
        <SettingRow label="Check-in Time" value="From 2:00 PM" />
        <SettingRow label="Check-out Time" value="Until 11:00 AM" />
        <SettingRow label="Late Check-out" value="Available (fee applies)" />
        <SettingRow label="Early Check-in" value="Subject to availability" />
        <SettingRow label="Quiet Hours" value="10:00 PM – 7:00 AM" />
        <SettingRow label="Smoking" value="Not allowed indoors" />
        <SettingRow label="Pets" value="Not allowed" />
        <SettingRow label="Parties/Events" value="Not allowed" />
        <SettingRow label="Age Restriction" value="18+" />
      </View>
    </View>
  );
}

function PaymentsSection() {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Payment Method & Policies</Text>
      <View style={formStyles.card}>
        <Text style={formStyles.subSectionTitle}>Accepted Payment Methods</Text>
        <SettingRow label="Credit/Debit Cards" value="Visa, MC, Amex" />
        <SettingRow label="Cash" value="Accepted" />
        <SettingRow label="Bank Transfer" value="Available" />
        <SettingRow label="Online Wallet" value="Coming soon" />
      </View>
      <View style={[formStyles.card, { marginTop: 12 }]}>
        <Text style={formStyles.subSectionTitle}>Payment Policies</Text>
        <SettingRow label="Deposit Required" value="30%" />
        <SettingRow label="Full Payment" value="At check-in" />
        <SettingRow label="Refund Policy" value="Free cancel 24h before" />
        <SettingRow label="No-show Fee" value="100% of first night" />
      </View>
    </View>
  );
}

function IntegrationsSection() {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Integrations</Text>
      <View style={formStyles.card}>
        <SettingRow label="Channel Manager" value="Not connected" />
        <SettingRow label="PMS Integration" value="StayEasy PMS" />
        <SettingRow label="Accounting" value="Not connected" />
        <SettingRow label="Revenue Management" value="Not connected" />
      </View>
    </View>
  );
}

function ActivityLogsSection() {
  const logs = [
    { action: 'Property updated', time: '2 hours ago' },
    { action: 'New booking', time: '5 hours ago' },
    { action: 'Room 101 marked clean', time: '8 hours ago' },
    { action: 'Rate updated for Deluxe', time: '1 day ago' },
    { action: 'Property created', time: '2 days ago' },
  ];

  return (
    <View>
      <Text style={formStyles.sectionTitle}>Activity Logs</Text>
      {logs.map((log, i) => (
        <View key={i} style={formStyles.logRow}>
          <View style={formStyles.logDot} />
          <View style={{ flex: 1 }}>
            <Text style={formStyles.logAction}>{log.action}</Text>
            <Text style={formStyles.logTime}>{log.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SupportSection() {
  return (
    <View>
      <Text style={formStyles.sectionTitle}>Support Tickets</Text>
      <View style={formStyles.card}>
        <SettingRow label="Contact Email" value="support@stayeasy.com" />
        <SettingRow label="Phone" value="+1-800-STAYEASY" />
        <SettingRow label="Live Chat" value="Available 24/7" />
        <SettingRow label="Knowledge Base" value="docs.stayeasy.com" />
      </View>
    </View>
  );
}

const navStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9' },
  chipActive: { backgroundColor: ACCENT },
  chipLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  chipLabelActive: { color: '#FFF' },
});

const formStyles = StyleSheet.create({
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  subSectionTitle: { fontSize: 13, fontWeight: '700', color: '#475569', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#F8F9FB', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  card: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowLabel: { fontSize: 13, color: '#64748B' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT, marginTop: 6 },
  logAction: { fontSize: 13, fontWeight: '600', color: '#111' },
  logTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
});
