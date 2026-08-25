import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk, type BookingSource } from '@/lib/context/frontdesk-context';
import { useBookingStore } from '@/stores/useBookingStore';
import { useFolioStore } from '@/stores/useFolioStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { safeGoBack } from "@/lib/utils";
import { BG } from '@/lib/constants/figma-tokens';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';

type WizardStep = 'source' | 'guest' | 'dates' | 'room' | 'services' | 'review';

const STEPS: { key: WizardStep; label: string; icon: string }[] = [
  { key: 'source', label: 'Source', icon: 'booking' },
  { key: 'guest', label: 'Guest', icon: 'person.fill' },
  { key: 'dates', label: 'Dates', icon: 'calendar' },
  { key: 'room', label: 'Room', icon: 'hotel' },
  { key: 'services', label: 'Services', icon: 'list' },
  { key: 'review', label: 'Review', icon: 'check' },
];

const BOOKING_SOURCES: { id: BookingSource; label: string; icon: string; desc: string }[] = [
  { id: 'walk_in', label: 'Walk-in', icon: 'person.fill', desc: 'Guest at the front desk' },
  { id: 'phone', label: 'Phone', icon: 'phone', desc: 'Phone reservation' },
  { id: 'online', label: 'Online', icon: 'email', desc: 'Guest portal/website' },
  { id: 'ota', label: 'OTA', icon: 'booking', desc: 'Expedia, Booking.com, etc.' },
  { id: 'corporate', label: 'Corporate', icon: 'business', desc: 'Company booking' },
  { id: 'agent', label: 'Agent', icon: 'group', desc: 'Travel agent booking' },
];

const ROOM_TYPES = [
  { id: 'Standard' as const, label: 'Standard', price: 2499, desc: 'Comfortable single/double room', capacity: 2 },
  { id: 'Deluxe' as const, label: 'Deluxe', price: 4999, desc: 'Spacious with premium amenities', capacity: 3 },
  { id: 'Suite' as const, label: 'Suite', price: 8999, desc: 'Luxury suite with living area', capacity: 5 },
];

const ADDON_SERVICES = [
  { id: 'breakfast', label: 'Breakfast', price: 500, desc: 'Daily breakfast buffet' },
  { id: 'airport', label: 'Airport Transfer', price: 1500, desc: 'Round-trip pickup/drop' },
  { id: 'extra_bed', label: 'Extra Bed', price: 1000, desc: 'Rollaway bed' },
  { id: 'late_checkout', label: 'Late Check-out', price: 800, desc: 'Until 4 PM' },
  { id: 'early_checkin', label: 'Early Check-in', price: 800, desc: 'From 10 AM' },
  { id: 'spa', label: 'Spa Access', price: 2000, desc: 'Full day spa access' },
];

export default function NewBookingScreen() {
  const frontDesk = useFrontDesk();
  const { rooms } = frontDesk;

  // Step 0: Source
  const [source, setSource] = useState<BookingSource | null>(null);
  const [otaRef, setOtaRef] = useState('');
  const [company, setCompany] = useState('');

  // Step 1: Guest
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [searchGuestQuery, setSearchGuestQuery] = useState('');
  const guestStore = useGuestStore();

  const matchedGuests = useMemo(() => {
    if (!searchGuestQuery.trim()) return [];
    const q = searchGuestQuery.toLowerCase();
    return guestStore.guests.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.phone.includes(q)
    );
  }, [searchGuestQuery, guestStore.guests]);

  const selectExistingGuest = (g: typeof guestStore.guests[0]) => {
    setGuestName(g.name);
    setEmail(g.email);
    setPhone(g.phone);
    setNationality(g.nationality);
    setIdNumber(g.documentNumber);
    setSearchGuestQuery('');
  };

  // Step 2: Dates
  const [checkin, setCheckin] = useState(new Date().toISOString().slice(0, 10));
  const [checkout, setCheckout] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const handleSelectDates = (checkIn: Date, checkOut: Date) => {
    setCheckin(toISODate(checkIn));
    setCheckout(toISODate(checkOut));
    setShowCalendar(false);
  };

  const formatDisplayDate = (iso: string) => {
    if (!iso) return '';
    const d = parseDate(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const nights = useMemo(() => {
    if (!checkin || !checkout) return 1;
    return Math.max(1, Math.ceil((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));
  }, [checkin, checkout]);

  // Step 3: Room
  const [roomType, setRoomType] = useState<string>('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');

  const availableRooms = useMemo(() => rooms.filter(r => r.status === 'available'), [rooms]);
  const suggestedRooms = useMemo(() => {
    if (!roomType) return [];
    return availableRooms.filter(r => r.room_type === roomType);
  }, [roomType, availableRooms]);
  const otherRooms = useMemo(() => {
    if (!roomType) return availableRooms;
    return availableRooms.filter(r => r.room_type !== roomType);
  }, [roomType, availableRooms]);

  const selectedRoomDef = ROOM_TYPES.find(r => r.id === roomType);
  const roomPrice = selectedRoomDef?.price || 0;

  // Step 4: Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Pricing
  const pricing = useMemo(() => {
    const roomTotal = roomPrice * nights;
    const servicesTotal = selectedServices.reduce((sum, id) => {
      const svc = ADDON_SERVICES.find(s => s.id === id);
      return sum + (svc?.price || 0) * (id === 'breakfast' ? nights : 1);
    }, 0);
    const subtotal = roomTotal + servicesTotal;
    const tax = Math.round(subtotal * 0.12);
    const serviceFee = Math.round(subtotal * 0.08);
    const grandTotal = subtotal + tax + serviceFee;
    return { roomTotal, servicesTotal, subtotal, tax, serviceFee, grandTotal };
  }, [roomPrice, nights, selectedServices]);

  // Step navigation
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepKey = STEPS[currentStep].key;

  const canProceed = useMemo(() => {
    switch (currentStepKey) {
      case 'source': return source !== null;
      case 'guest': return guestName.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0;
      case 'dates': return checkin.length > 0 && checkout.length > 0 && checkout >= checkin;
      case 'room': return roomType.length > 0 && selectedRoomNumber.length > 0;
      case 'services': return true;
      case 'review': return true;
    }
  }, [currentStepKey, source, guestName, email, phone, checkin, checkout, roomType, selectedRoomNumber]);

  const handleNext = () => {
    if (!canProceed) {
      Alert.alert('Incomplete', 'Please fill in all required fields');
      return;
    }
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else safeGoBack();
  };

  const handleSubmit = () => {
    if (!source || !guestName || !email || !phone || !roomType || !selectedRoomNumber) {
      Alert.alert('Incomplete', 'Please complete all required fields');
      return;
    }

    // Create booking via context
    frontDesk.createBooking({
      guestName, email, phone, nationality,
      roomType: roomType as 'Standard' | 'Deluxe' | 'Suite',
      checkIn: checkin, checkOut: checkout,
      adults, children, specialRequests,
      source: source,
      company: source === 'corporate' ? company : undefined,
      otaRef: source === 'ota' ? otaRef : undefined,
      idNumber,
    });

    // Store in booking store
    const newBooking = useBookingStore.getState().createBooking({
      guestName, email, phone, roomType,
      checkin, checkout, adults, children,
      specialRequests, paymentMethod: balanceDue > 0 ? 'unpaid' : 'paid',
    } as any);

    // Create folio
    useFolioStore.getState().createFolio(newBooking.ref, guestName, selectedRoomNumber);

    // Add charges for selected services
    selectedServices.forEach(svcId => {
      const svc = ADDON_SERVICES.find(s => s.id === svcId);
      if (svc) {
        useFolioStore.getState().addCharge(newBooking.ref, {
          description: svc.label,
          amount: svc.price * (svcId === 'breakfast' ? nights : 1),
          category: 'service',
        });
      }
    });

    // Add guest to guest store if new
    const existingGuests = guestStore.findGuest(guestName);
    if (existingGuests.length === 0) {
      guestStore.addGuest({
        name: guestName, email, phone, nationality,
        documentType: 'Passport', documentNumber: idNumber || '',
        notes: specialRequests,
      });
    }

    // Record activity
    useActivityStore.getState().addActivity({
      type: 'booking',
      title: `New booking — ${guestName}`,
      description: `${roomType} · ${checkin} → ${checkout} · ${source}`,
      icon: '🔄',
      color: SRS.teal,
    });

    // Confirm
    const balance = pricing.grandTotal;
    const balanceMessage = balance > 0 ? `\nBalance due: NPR ${balance.toLocaleString()}` : '\nFully paid';

    Alert.alert(
      'Booking Created',
      `Reservation confirmed for ${guestName}\n${roomType} — Room ${selectedRoomNumber}\n${checkin} → ${checkout} (${nights} night${nights > 1 ? 's' : ''})\nReference: ${newBooking.ref}${balanceMessage}\nSource: ${source.toUpperCase()}`,
      [{ text: 'OK', onPress: () => safeGoBack() }]
    );
  };

  const balanceDue = pricing.grandTotal;

  const renderStepIndicator = () => (
    <View style={s.stepBar}>
      {STEPS.map((step, i) => (
        <View key={step.key} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity
            onPress={() => i <= currentStep && setCurrentStep(i)}
            style={[s.stepDot, {
              backgroundColor: i <= currentStep ? SRS.teal : GRAY[200],
              opacity: i <= currentStep ? 1 : 0.5,
            }]}
          >
            {i < currentStep ? (
              <IconSymbol name="check" size={12} color={BG.white} />
            ) : (
              <Text style={[s.stepNum, { color: i === currentStep ? BG.white : GRAY[500] }]}>{i + 1}</Text>
            )}
          </TouchableOpacity>
          <Text style={[s.stepLabel, { color: i === currentStep ? SRS.navy : GRAY[400] }]}>{step.label}</Text>
          {i < STEPS.length - 1 && <View style={[s.stepLine, { backgroundColor: i < currentStep ? SRS.teal : GRAY[200] }]} />}
        </View>
      ))}
    </View>
  );

  const renderField = (label: string, value: string, onChange: (v: string) => void, opts?: { placeholder?: string; keyboard?: 'default' | 'email-address' | 'phone-pad'; required?: boolean; multiline?: boolean }) => (
    <View>
      <Text style={s.fieldLabel}>{label}{opts?.required !== false ? <Text style={{ color: SRS.red }}> *</Text> : null}</Text>
      <TextInput
        placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={GRAY[400]}
        value={value}
        onChangeText={onChange}
        keyboardType={opts?.keyboard || 'default'}
        autoCapitalize="none"
        multiline={opts?.multiline}
        style={[s.input, opts?.multiline && { minHeight: 60, textAlignVertical: 'top' }]}
      />
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <View>
          <Text style={s.title}>New Booking</Text>
          <Text style={s.sub}>Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].label}</Text>
        </View>
      </View>

      {renderStepIndicator()}

      <View style={s.body}>
        {/* Step: Source */}
        {currentStepKey === 'source' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Booking Source</Text>
            <View style={{ gap: SPACING.sm }}>
              {BOOKING_SOURCES.map(sourceItem => {
                const active = source === sourceItem.id;
                return (
                  <TouchableOpacity key={sourceItem.id} onPress={() => setSource(sourceItem.id)}
                    style={[s.sourceOption, { backgroundColor: active ? SRS.teal + '08' : BG.white, borderColor: active ? SRS.teal : GRAY[200] }]}
                    activeOpacity={0.7}
                  >
                    <View style={[s.sourceIcon, { backgroundColor: active ? SRS.teal : GRAY[100] }]}>
                      <IconSymbol name={sourceItem.icon as any} size={18} color={active ? BG.white : GRAY[500]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.sourceLabel, { color: active ? SRS.teal : SRS.navy }]}>{sourceItem.label}</Text>
                      <Text style={s.sourceDesc}>{sourceItem.desc}</Text>
                    </View>
                    <View style={[s.radioOuter, { borderColor: active ? SRS.teal : GRAY[300] }]}>
                      {active && <View style={s.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {source === 'ota' && renderField('OTA Reference', otaRef, setOtaRef, { placeholder: 'Booking.com, Expedia ref...', required: false })}
            {source === 'corporate' && renderField('Company Name', company, setCompany, { placeholder: 'Company name', required: false })}
          </View>
        )}

        {/* Step: Guest */}
        {currentStepKey === 'guest' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Guest Details</Text>

            {/* Existing guest search */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={s.fieldLabel}>Search existing guest</Text>
              <TextInput
                placeholder="Type name or email to search..."
                placeholderTextColor={GRAY[400]}
                value={searchGuestQuery}
                onChangeText={setSearchGuestQuery}
                style={s.input}
              />
              {matchedGuests.length > 0 && (
                <View style={s.guestResults}>
                  {matchedGuests.map(g => (
                    <TouchableOpacity key={g.id} onPress={() => selectExistingGuest(g)} style={s.guestResultRow}>
                      <View style={s.guestAvatar}>
                        <Text style={s.guestInitial}>{g.name[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.guestResultName}>{g.name}</Text>
                        <Text style={s.guestResultMeta}>{g.email} · {g.phone} · {g.totalStays} stays</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {renderField('Full Name', guestName, setGuestName)}
            {renderField('Email', email, setEmail, { keyboard: 'email-address' })}
            {renderField('Phone', phone, setPhone, { keyboard: 'phone-pad' })}
            {renderField('ID/Passport Number', idNumber, setIdNumber, { required: false })}
            {renderField('Nationality', nationality, setNationality, { required: false })}
          </View>
        )}

        {/* Step: Dates */}
        {currentStepKey === 'dates' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Stay Details</Text>

            <Text style={s.fieldLabel}>Check-in — Check-out <Text style={{ color: SRS.red }}>*</Text></Text>
            <TouchableOpacity onPress={() => setShowCalendar(true)} style={s.dateRangeBtn} activeOpacity={0.7}>
              <IconSymbol name="calendar" size={18} color={SRS.teal} />
              <View style={{ flex: 1 }}>
                <Text style={[s.dateRangeValue, !checkin && { color: GRAY[400] }]}>
                  {formatDisplayDate(checkin) || 'Select check-in date'}
                </Text>
                <Text style={[s.dateRangeValue, !checkout && { color: GRAY[400] }]}>
                  {formatDisplayDate(checkout) || 'Select check-out date'}
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: SRS.teal }}>Edit ▾</Text>
            </TouchableOpacity>

            {checkin && checkout && checkout >= checkin && (
              <View style={s.nightsBadge}>
                <IconSymbol name="calendar" size={16} color={SRS.teal} />
                <Text style={s.nightsBadgeText}>{nights} night{nights > 1 ? 's' : ''}</Text>
              </View>
            )}

            <DatePickerCalendar
              visible={showCalendar}
              onClose={() => setShowCalendar(false)}
              onSelectDates={handleSelectDates}
              initialCheckIn={checkin ? parseDate(checkin) : undefined}
              initialCheckOut={checkout ? parseDate(checkout) : undefined}
            />

            <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
              {[
                { label: 'Adults', val: adults, set: setAdults, min: 1, max: 10 },
                { label: 'Children', val: children, set: setChildren, min: 0, max: 6 },
              ].map(item => (
                <View key={item.label} style={s.counterRow}>
                  <Text style={{ ...TYPOGRAPHY.body, color: SRS.navy }}>{item.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                    <TouchableOpacity onPress={() => item.val > item.min && item.set(item.val - 1)}
                      style={[s.counterBtn, { opacity: item.val <= item.min ? 0.4 : 1 }]}
                    >
                      <IconSymbol name="minus" size={14} color={SRS.teal} />
                    </TouchableOpacity>
                    <Text style={s.counterVal}>{item.val}</Text>
                    <TouchableOpacity onPress={() => item.val < item.max && item.set(item.val + 1)}
                      style={[s.counterBtn, { opacity: item.val >= item.max ? 0.4 : 1 }]}
                    >
                      <IconSymbol name="add" size={14} color={SRS.teal} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step: Room */}
        {currentStepKey === 'room' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Room Type & Assignment</Text>

            {/* Room type selection */}
            <Text style={[s.fieldLabel, { marginBottom: SPACING.sm }]}>Room Category</Text>
            <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
              {ROOM_TYPES.map(rt => {
                const active = roomType === rt.id;
                return (
                  <TouchableOpacity key={rt.id} onPress={() => { setRoomType(rt.id); setSelectedRoomNumber(''); }}
                    style={[s.roomTypeCard, { backgroundColor: active ? SRS.teal + '08' : GRAY[50], borderColor: active ? SRS.teal : GRAY[200] }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.roomTypeLabel, { color: active ? SRS.teal : SRS.navy }]}>{rt.label}</Text>
                      <Text style={s.roomTypeDesc}>{rt.desc} · Up to {rt.capacity} guests</Text>
                    </View>
                    <Text style={[s.roomTypePrice, { color: active ? SRS.teal : SRS.navy }]}>NPR {rt.price.toLocaleString()}</Text>
                    <View style={[s.radioOuter, { borderColor: active ? SRS.teal : GRAY[300] }]}>
                      {active && <View style={s.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Room assignment */}
            {roomType && (
              <>
                <Text style={s.fieldLabel}>Assign Room</Text>
                {suggestedRooms.length > 0 && (
                  <>
                    <Text style={s.sectionHint}>✦ Available {roomType} rooms</Text>
                    <View style={s.roomChipRow}>
                      {suggestedRooms.map(r => (
                        <TouchableOpacity key={r.id} onPress={() => setSelectedRoomNumber(r.room_number)}
                          style={[s.roomChip, {
                            backgroundColor: selectedRoomNumber === r.room_number ? SRS.teal : SRS.teal + '12',
                            borderColor: selectedRoomNumber === r.room_number ? SRS.teal : SRS.teal + '25',
                          }]}
                        >
                          <Text style={{
                            fontSize: 15, fontWeight: '700',
                            color: selectedRoomNumber === r.room_number ? BG.white : SRS.teal,
                          }}>{r.room_number}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
                {otherRooms.filter(r => r.room_type !== roomType).length > 0 && (
                  <>
                    <Text style={[s.sectionHint, { color: GRAY[500], marginTop: SPACING.md }]}>Other available rooms</Text>
                    <View style={s.roomChipRow}>
                      {otherRooms.filter(r => r.room_type !== roomType).slice(0, 6).map(r => (
                        <TouchableOpacity key={r.id} onPress={() => setSelectedRoomNumber(r.room_number)}
                          style={[s.roomChip, {
                            backgroundColor: selectedRoomNumber === r.room_number ? SRS.teal : GRAY[100],
                            borderColor: selectedRoomNumber === r.room_number ? SRS.teal : GRAY[200],
                          }]}
                        >
                          <Text style={{
                            fontSize: 13, fontWeight: '600',
                            color: selectedRoomNumber === r.room_number ? BG.white : GRAY[600],
                          }}>{r.room_number}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
                {suggestedRooms.length === 0 && (
                  <Text style={s.noRoomsText}>No {roomType} rooms available</Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Step: Services */}
        {currentStepKey === 'services' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Add-on Services</Text>

            <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
              {ADDON_SERVICES.map(svc => {
                const active = selectedServices.includes(svc.id);
                return (
                  <TouchableOpacity key={svc.id} onPress={() => toggleService(svc.id)}
                    style={[s.serviceCard, { borderColor: active ? SRS.teal : GRAY[200], backgroundColor: active ? SRS.teal + '06' : BG.white }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.serviceLabel, { color: active ? SRS.teal : SRS.navy }]}>{svc.label}</Text>
                      <Text style={s.serviceDesc}>{svc.desc}</Text>
                    </View>
                    <Text style={s.servicePrice}>NPR {svc.price.toLocaleString()}{svc.id === 'breakfast' ? '/night' : ''}</Text>
                    <View style={[s.checkbox, { backgroundColor: active ? SRS.teal : 'transparent', borderColor: active ? SRS.teal : GRAY[300] }]}>
                      {active && <IconSymbol name="check" size={10} color={BG.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {renderField('Special Requests', specialRequests, setSpecialRequests, { placeholder: 'Any special requests...', required: false, multiline: true })}
          </View>
        )}

        {/* Step: Review */}
        {currentStepKey === 'review' && (
          <View style={{ gap: SPACING.lg }}>
            {/* Summary Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Reservation Summary</Text>

              <View style={s.reviewRow}>
                <IconSymbol name="booking" size={16} color={SRS.teal} />
                <Text style={s.reviewLabel}>Booking Source</Text>
                <Text style={s.reviewValue}>{source?.toUpperCase()}</Text>
              </View>
              <View style={s.reviewRow}>
                <IconSymbol name="person.fill" size={16} color={SRS.teal} />
                <Text style={s.reviewLabel}>Guest</Text>
                <Text style={s.reviewValue}>{guestName}</Text>
              </View>
              <View style={s.reviewRow}>
                <IconSymbol name="email" size={16} color={SRS.teal} />
                <Text style={s.reviewLabel}>Contact</Text>
                <Text style={s.reviewValue}>{email} · {phone}</Text>
              </View>
              <View style={s.reviewRow}>
                <IconSymbol name="calendar" size={16} color={SRS.teal} />
                <Text style={s.reviewLabel}>Stay</Text>
                <Text style={s.reviewValue}>{checkin} → {checkout} ({nights} night{nights > 1 ? 's' : ''})</Text>
              </View>
              <View style={s.reviewRow}>
                <IconSymbol name="group" size={16} color={SRS.teal} />
                <Text style={s.reviewLabel}>Guests</Text>
                <Text style={s.reviewValue}>{adults} adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}</Text>
              </View>
              <View style={s.reviewRow}>
                <IconSymbol name="hotel" size={16} color={SRS.teal} />
                <Text style={s.reviewLabel}>Room</Text>
                <Text style={s.reviewValue}>{roomType} · {selectedRoomNumber}</Text>
              </View>
              {selectedServices.length > 0 && (
                <View style={s.reviewRow}>
              <IconSymbol name="checklist" size={16} color={SRS.teal} />
              <Text style={s.reviewLabel}>Services</Text>
                  <Text style={s.reviewValue}>{selectedServices.map(id => ADDON_SERVICES.find(s => s.id === id)?.label).join(', ')}</Text>
                </View>
              )}
              {specialRequests.length > 0 && (
                <View style={s.reviewRow}>
              <IconSymbol name="info" size={16} color={SRS.teal} />
              <Text style={s.reviewLabel}>Requests</Text>
                  <Text style={s.reviewValue}>{specialRequests}</Text>
                </View>
              )}
            </View>

            {/* Pricing Card */}
            <View style={[s.card, { backgroundColor: SRS.teal + '06', borderWidth: 1, borderColor: SRS.teal + '20' }]}>
              <Text style={s.cardTitle}>Price Breakdown</Text>
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>{roomType} × {nights} night{nights > 1 ? 's' : ''}</Text>
                <Text style={s.priceValue}>NPR {pricing.roomTotal.toLocaleString()}</Text>
              </View>
              {selectedServices.length > 0 && (
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>Add-on services ({selectedServices.length})</Text>
                  <Text style={s.priceValue}>NPR {pricing.servicesTotal.toLocaleString()}</Text>
                </View>
              )}
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>Tax (12%)</Text>
                <Text style={s.priceValue}>NPR {pricing.tax.toLocaleString()}</Text>
              </View>
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>Service Fee (8%)</Text>
                <Text style={s.priceValue}>NPR {pricing.serviceFee.toLocaleString()}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Balance Due</Text>
                <Text style={s.totalValue}>NPR {pricing.grandTotal.toLocaleString()}</Text>
              </View>
            </View>

            {/* Confirm */}
            <TouchableOpacity onPress={handleSubmit} style={s.submitBtn} activeOpacity={0.85}>
              <IconSymbol name="check" size={18} color={BG.white} />
              <Text style={s.submitText}>Confirm Reservation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation */}
        {currentStepKey !== 'review' && (
          <View style={s.navRow}>
            <TouchableOpacity onPress={() => safeGoBack()} style={s.navBack}>
              <Text style={s.navBackText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext}
              style={[s.navNext, { opacity: canProceed ? 1 : 0.5 }]}
              disabled={!canProceed}
            >
              <Text style={s.navNextText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.lg },

  stepBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 10, fontWeight: '700' },
  stepLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', marginLeft: 4, flex: 1 },
  stepLine: { flex: 1, height: 2, borderRadius: 1, marginHorizontal: 4 },

  card: { backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  cardTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: 4 },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: SRS.navy },
  sectionHint: { ...TYPOGRAPHY.caption, fontWeight: '600', color: SRS.green, marginBottom: SPACING.sm },

  sourceOption: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5, gap: SPACING.md },
  sourceIcon: { width: 36, height: 36, borderRadius: RADIUS.button, alignItems: 'center', justifyContent: 'center' },
  sourceLabel: { ...TYPOGRAPHY.body, fontWeight: '700' },
  sourceDesc: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },

  guestResults: { marginTop: SPACING.sm, backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[200] },
  guestResultRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  guestAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: SRS.teal + '15', alignItems: 'center', justifyContent: 'center' },
  guestInitial: { fontSize: 13, fontWeight: '700', color: SRS.teal },
  guestResultName: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  guestResultMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },

  nightsBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '08', alignSelf: 'flex-start' },
  nightsBadgeText: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.teal },
  dateRangeBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 12 },
  dateRangeValue: { fontSize: 14, fontWeight: '600', color: SRS.navy },

  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 16, fontWeight: '700', color: SRS.navy, minWidth: 24, textAlign: 'center' },

  roomTypeCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5, gap: SPACING.sm },
  roomTypeLabel: { ...TYPOGRAPHY.body, fontWeight: '700' },
  roomTypeDesc: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  roomTypePrice: { ...TYPOGRAPHY.subtitle, fontWeight: '700' },
  roomChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  roomChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.card, borderWidth: 1.5 },
  noRoomsText: { ...TYPOGRAPHY.small, color: SRS.red, fontStyle: 'italic' },

  serviceCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5, gap: SPACING.sm },
  serviceLabel: { ...TYPOGRAPHY.body, fontWeight: '600' },
  serviceDesc: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  servicePrice: { ...TYPOGRAPHY.small, fontWeight: '700', color: SRS.teal },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: SRS.teal },

  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: 6 },
  reviewLabel: { ...TYPOGRAPHY.small, color: GRAY[500], width: 72 },
  reviewValue: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, flex: 1 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceLabel: { ...TYPOGRAPHY.small, color: GRAY[500] },
  priceValue: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: SRS.teal + '30', paddingTop: SPACING.md, marginTop: SPACING.sm },
  totalLabel: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  totalValue: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.teal },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.teal, ...SHADOWS.card },
  submitText: { fontSize: 16, fontWeight: '700', color: BG.white },

  navRow: { flexDirection: 'row', gap: SPACING.md, paddingBottom: SPACING.xl },
  navBack: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: GRAY[100] },
  navBackText: { fontSize: 14, fontWeight: '600', color: GRAY[600] },
  navNext: { flex: 2, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: SRS.teal },
  navNextText: { fontSize: 14, fontWeight: '700', color: BG.white },
});
