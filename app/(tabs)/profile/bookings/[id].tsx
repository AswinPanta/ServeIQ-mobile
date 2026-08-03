import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useBookings, Booking } from '@/lib/context/booking-context';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';

const CORAL = '#E63946';
const NAVY = '#1A3C5E';

const STATUS_COLORS = {
  upcoming: { bg: '#FEF2F2', text: CORAL, icon: 'calendar' as const },
  completed: { bg: '#F0FDF4', text: '#16A34A', icon: 'confirm' as const },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', icon: 'cancel' as const },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings } = useBookings();
  const booking = bookings.find(b => b.id === id);

  if (!booking) {
    return (
      <View style={s.center}>
        <IconSymbol name="warning" size={48} color="#E2E8F0" />
        <Text style={s.errorText}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colors = STATUS_COLORS[booking.status];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.title}>Booking Details</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={s.imageWrap}>
          <Image source={{ uri: booking.hotelImage }} style={s.image} />
          <View style={[s.statusBadge, { backgroundColor: colors.bg }]}>
            <IconSymbol name={colors.icon} size={14} color={colors.text} />
            <Text style={[s.statusText, { color: colors.text }]}>{booking.status}</Text>
          </View>
        </View>

        <Text style={s.hotelName}>{booking.hotelName}</Text>
        <Text style={s.location}>{booking.hotelCity}, {booking.hotelCountry}</Text>

        <View style={s.detailsCard}>
          <DetailRow icon="guests" label="Guests" value={`${booking.guests} guest${booking.guests !== 1 ? 's' : ''}`} />
          <DetailRow icon="room" label="Room" value={booking.roomTypeName} />
          <DetailRow icon="calendar" label="Check-in" value={new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} />
          <DetailRow icon="calendar" label="Check-out" value={new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} />
          <DetailRow icon="clock" label="Booked on" value={new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
        </View>

        <View style={s.priceCard}>
          <Text style={s.priceLabel}>Total Price</Text>
          <Text style={s.priceValue}>NPR {booking.totalPrice.toLocaleString()}</Text>
          {booking.discountApplied && (
            <View style={s.discountRow}>
              <IconSymbol name="discount" size={12} color="#16A34A" />
              <Text style={s.discountText}>
                {booking.discountApplied.code} ({booking.discountApplied.type === 'percentage' ? `${booking.discountApplied.amount}% off` : `NPR ${booking.discountApplied.amount} off`})
              </Text>
            </View>
          )}
          {booking.refundAmount && (
            <View style={s.refundRow}>
              <IconSymbol name="refresh" size={12} color="#DC2626" />
              <Text style={s.refundText}>Refunded: NPR {booking.refundAmount.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {booking.folio && booking.folio.length > 0 && (
          <View style={s.folioCard}>
            <Text style={s.folioTitle}>Folio Charges</Text>
            {booking.folio.map((charge, i) => (
              <View key={i} style={s.folioRow}>
                <Text style={s.folioName}>{charge.description}</Text>
                <Text style={s.folioAmount}>NPR {charge.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={s.contactBtn}>
          <IconSymbol name="email" size={16} color="#FFF" />
          <Text style={s.contactBtnText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: IconSymbolName; label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailLeft}>
        <IconSymbol name={icon} size={16} color="#64748B" />
        <Text style={s.detailLabel}>{label}</Text>
      </View>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#FFF' },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: NAVY },
  backBtnText: { fontSize: 14, fontWeight: '600', color: CORAL },

  imageWrap: { height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 16 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  statusBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  hotelName: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 4 },
  location: { fontSize: 14, color: '#64748B', marginBottom: 20 },

  detailsCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 14, color: '#64748B' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111' },

  priceCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  priceLabel: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  priceValue: { fontSize: 24, fontWeight: '800', color: NAVY },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  discountText: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  refundRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  refundText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },

  folioCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  folioTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 12 },
  folioRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  folioName: { fontSize: 13, color: '#64748B', flex: 1 },
  folioAmount: { fontSize: 13, fontWeight: '600', color: '#111' },

  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: CORAL, marginTop: 6,
  },
  contactBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
