import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { RoomSetup } from '@/components/host/RoomSetup';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';
import { useHost } from '@/lib/context/host-context';

type PropertyType = 'Hotel' | 'Villa' | 'Apartment' | 'Resort' | 'Cottage' | 'Hostel' | 'Guest House' | 'Boutique';
const PROPERTY_TYPES: PropertyType[] = ['Hotel', 'Villa', 'Apartment', 'Resort', 'Cottage', 'Hostel', 'Guest House', 'Boutique'];
const AMENITIES = ['WiFi', 'Parking', 'Gym', 'Pool', 'Kitchen', 'AC', 'Smart TV', 'Breakfast'];
const HOUSE_RULES = ['Pets Allowed', 'Smoking', 'Events', 'Children', 'Accessible', 'Eco-Friendly', '24/7 Check-in', 'Security Deposit'];
const LANGUAGES = ['English', 'Hindi', 'Nepali', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
const STEPS = [
  { id: 'property' as const, label: 'Property', icon: 'hotel' as const },
  { id: 'rooms' as const, label: 'Rooms', icon: 'room' as const },
  { id: 'facilities' as const, label: 'Policies', icon: 'check' as const },
  { id: 'done' as const, label: 'Done', icon: 'check' as const },
];

export default function ListingWizard() {
  const { addProperty } = useHost();
  const [step, setStep] = useState<'property' | 'rooms' | 'facilities' | 'done'>('property');
  const [loading, setLoading] = useState(false);
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const [address, setAddress] = useState(''); const [city, setCity] = useState(''); const [state, setState] = useState(''); const [country, setCountry] = useState('Nepal');
  const [zipCode, setZipCode] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [checkIn, setCheckIn] = useState('14:00'); const [checkOut, setCheckOut] = useState('11:00');
  const [floors, setFloors] = useState<Array<any>>([]);
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [minStay, setMinStay] = useState('1'); const [maxStay, setMaxStay] = useState('30');

  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
  const stepIdx = STEPS.findIndex(s => s.id === step);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      addProperty({
        id: `prop-${Date.now()}`, tenant_id: 'demo-host-1', name,
        type: propertyType.toUpperCase() as any, description, country, state: state || city, city,
        zip_code: zipCode || '00000', address, latitude: null, longitude: null,
        check_in_time_from: checkIn, check_in_time_to: '12:00', check_out_time_from: '00:00', check_out_time_to: checkOut,
        number_of_floors: floors.length || 1, total_rooms: floors.reduce((s: number, f: any) => s + f.rooms.length, 0),
        year_built: null, amenities: selectedAmenities, is_active: true, currency: 'NPR',
        timezone: 'Asia/Kathmandu', brand_color: SRS.teal, min_rate_floor: 0, logo_url: null, custom_domain: null,
        cancellation_policy: 'FLEXIBLE', photos: photos.map((uri, i) => ({ id: `ph-${Date.now()}-${i}`, photo_url: uri, category: 'exterior' })),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      setStep('done');
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed to create listing.'); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="close" size={18} color={SRS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List Your Property</Text>
        <Text style={styles.headerStep}>{stepIdx + 1}/{STEPS.length}</Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepRow}>
        {STEPS.filter(s => s.id !== 'done').map((s, i) => {
          const idx = STEPS.findIndex(x => x.id === s.id);
          return (
            <React.Fragment key={s.id}>
              <View style={[styles.stepDot, { backgroundColor: idx < stepIdx ? SRS.green : idx === stepIdx ? SRS.teal : GRAY[200] }]}>
                {idx < stepIdx ? <IconSymbol name="check" size={12} color="#FFF" /> : <Text style={styles.stepNum}>{i + 1}</Text>}
              </View>
              {i < 2 && <View style={[styles.stepLine, { backgroundColor: idx < stepIdx ? SRS.green : GRAY[200] }]} />}
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Step 1: Property */}
        {step === 'property' && (
          <View style={{ gap: SPACING.lg }}>
            <View><Text style={styles.pageTitle}>Tell us about your property</Text><Text style={styles.pageSub}>Share the details that attract the right guests</Text></View>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Property type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {PROPERTY_TYPES.map(pt => (
                  <TouchableOpacity key={pt} onPress={() => setPropertyType(pt)}
                    style={[styles.chip, { width: '22%', alignItems: 'center', borderColor: propertyType === pt ? SRS.teal : GRAY[200], backgroundColor: propertyType === pt ? SRS.teal + '10' : '#FFF' }]}>
                    <Text style={[styles.chipLabel, { color: propertyType === pt ? SRS.teal : SRS.navy }]}>{pt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
                {[{ label: 'Property name', val: name, set: setName, placeholder: 'e.g. Sunset Resort' },
                  { label: 'Address', val: address, set: setAddress, placeholder: 'Street address' },
                  { label: 'City', val: city, set: setCity, placeholder: 'e.g. Kathmandu' },
                  { label: 'State', val: state, set: setState, placeholder: 'e.g. Bagmati' },
                  { label: 'Zip Code', val: zipCode, set: setZipCode, placeholder: '44600', keyboard: 'number-pad' as const },
                  { label: 'Country', val: country, set: setCountry, placeholder: 'Nepal' },
                ].map(f => (
                  <View key={f.label} style={{ width: '47%', gap: SPACING.xs }}>
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                    <TextInput placeholder={f.placeholder} placeholderTextColor={GRAY[400]}
                      value={f.val} onChangeText={f.set} keyboardType={(f as any).keyboard || 'default'} style={styles.input} />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                {[{ label: 'Check-in', val: checkIn, set: setCheckIn }, { label: 'Check-out', val: checkOut, set: setCheckOut }].map(f => (
                  <View key={f.label} style={{ flex: 1, gap: SPACING.xs }}>
                    <Text style={styles.fieldLabel}>{f.label} time</Text>
                    <TextInput placeholder="14:00" placeholderTextColor={GRAY[400]} value={f.val} onChangeText={f.set} style={styles.input} />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput value={description} onChangeText={setDescription} placeholder="Describe your property..." placeholderTextColor={GRAY[400]}
                multiline numberOfLines={4} style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]} />
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Amenities</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {AMENITIES.map(a => {
                  const sel = selectedAmenities.includes(a);
                  return (
                    <TouchableOpacity key={a} onPress={() => setSelectedAmenities(toggle(selectedAmenities, a))}
                      style={[styles.chip, { borderColor: sel ? SRS.teal : GRAY[200], backgroundColor: sel ? SRS.teal + '10' : '#FFF' }]}>
                      <Text style={[styles.chipLabel, { color: sel ? SRS.teal : SRS.navy }]}>{a}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                <TextInput value={customAmenity} onChangeText={setCustomAmenity} placeholder="Add custom amenity..." placeholderTextColor={GRAY[400]}
                  onSubmitEditing={() => { const t = customAmenity.trim(); if (t && !selectedAmenities.includes(t)) { setSelectedAmenities(p => [...p, t]); setCustomAmenity(''); } }}
                  style={[styles.input, { flex: 1 }]} />
                <TouchableOpacity onPress={() => { const t = customAmenity.trim(); if (t && !selectedAmenities.includes(t)) { setSelectedAmenities(p => [...p, t]); setCustomAmenity(''); } }}
                  style={styles.addBtn}><IconSymbol name="add" size={16} color="#FFF" /></TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Property Photos</Text>
              <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500], marginBottom: SPACING.md }}>Upload photos to attract guests</Text>
              {photos.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md }}>
                  {photos.map((uri, i) => (
                    <View key={i} style={styles.photoThumb}>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <TouchableOpacity onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} style={styles.removeBtn}>
                        <IconSymbol name="close" size={10} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity onPress={() => setShowPhotoPicker(true)} style={styles.photoBtn}>
                <IconSymbol name="photo" size={20} color={SRS.teal} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: SRS.teal }}>{photos.length > 0 ? 'Add More Photos' : 'Tap to Add Photos'}</Text>
                <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[400] }}>{photos.length} selected</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Rooms */}
        {step === 'rooms' && (
          <View style={{ gap: SPACING.lg }}>
            <View><Text style={styles.pageTitle}>Set up your rooms</Text><Text style={styles.pageSub}>Add each room or unit you want to list</Text></View>
            <RoomSetup rooms={floors} onRoomsChange={setFloors} />
          </View>
        )}

        {/* Step 3: Facilities */}
        {step === 'facilities' && (
          <View style={{ gap: SPACING.lg }}>
            <View><Text style={styles.pageTitle}>Facilities & policies</Text><Text style={styles.pageSub}>Set the rules and requirements for your property</Text></View>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>House rules</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {HOUSE_RULES.map(r => {
                  const on = houseRules.includes(r);
                  return (
                    <TouchableOpacity key={r} onPress={() => setHouseRules(toggle(houseRules, r))}
                      style={[styles.chip, { borderColor: on ? SRS.teal : GRAY[200], backgroundColor: on ? SRS.teal + '08' : '#FFF' }]}>
                      <Text style={[styles.chipLabel, { color: on ? SRS.teal : SRS.navy }]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg }}>
                {[{ label: 'Min stay', val: minStay, set: setMinStay }, { label: 'Max stay', val: maxStay, set: setMaxStay }].map(f => (
                  <View key={f.label} style={{ flex: 1, gap: SPACING.xs }}>
                    <Text style={styles.fieldLabel}>{f.label} (nights)</Text>
                    <TextInput value={f.val} onChangeText={f.set} keyboardType="number-pad" style={styles.input} />
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Languages</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {LANGUAGES.map(l => {
                  const on = languages.includes(l);
                  return (
                    <TouchableOpacity key={l} onPress={() => setLanguages(toggle(languages, l))}
                      style={[styles.chip, { borderColor: on ? SRS.teal : GRAY[200], backgroundColor: on ? SRS.teal + '10' : '#FFF' }]}>
                      <Text style={[styles.chipLabel, { color: on ? SRS.teal : SRS.navy }]}>{l}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <View style={styles.doneSection}>
            <View style={styles.doneIcon}><IconSymbol name="check" size={36} color={SRS.green} /></View>
            <Text style={styles.doneTitle}>You're all set!</Text>
            <Text style={styles.doneSub}><Text style={{ fontWeight: '700' }}>{name || 'Your property'}</Text> in <Text style={{ fontWeight: '700' }}>{city || 'your city'}</Text> has been listed.</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Listing summary</Text>
              {[
                { label: 'Property', value: name || '-' }, { label: 'Type', value: propertyType || '-' },
                { label: 'Location', value: `${city}${country ? `, ${country}` : ''}` },
                { label: 'Rooms', value: String(floors.reduce((s: number, f: any) => s + f.rooms.length, 0)) },
              ].map(item => (
                <View key={item.label} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={styles.summaryValue}>{item.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn}>
              <IconSymbol name="hotel" size={16} color="#FFF" />
              <Text style={styles.doneBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      {step !== 'done' && (
        <View style={styles.bottomBar}>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            {step !== 'property' ? (
              <TouchableOpacity onPress={() => setStep(STEPS[stepIdx - 1].id)} style={styles.navBack}>
                <Text style={styles.navBackText}>Back</Text>
              </TouchableOpacity>
            ) : <View style={{ flex: 1 }} />}
            <TouchableOpacity onPress={step === 'facilities' ? handleSubmit : () => setStep(STEPS[stepIdx + 1].id)}
              disabled={loading} style={[styles.navNext, { opacity: loading ? 0.6 : 1 }]} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.navNextText}>{step === 'facilities' ? 'Submit listing' : 'Continue'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ImagePickerOverlay visible={showPhotoPicker} onClose={() => setShowPhotoPicker(false)} onImagePicked={(uri) => setPhotos(prev => [...prev, uri])} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.sm, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: GRAY[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h3, color: SRS.navy },
  headerStep: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[400] },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: '#FFF' },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  stepLine: { flex: 1, height: 3, borderRadius: 2 },
  body: { padding: SPACING.lg, paddingBottom: 120, gap: SPACING.lg },
  pageTitle: { ...TYPOGRAPHY.h2, color: SRS.navy },
  pageSub: { ...TYPOGRAPHY.body, color: GRAY[500], marginTop: 2 },
  card: { padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], gap: SPACING.md },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: SPACING.xs },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: SRS.navy },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.card, borderWidth: 1.5 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  addBtn: { width: 44, height: 44, borderRadius: RADIUS.card, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center' },
  photoThumb: { width: '30%', aspectRatio: 4 / 3, borderRadius: RADIUS.button, overflow: 'hidden', backgroundColor: GRAY[100] },
  removeBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(192,57,43,0.9)', alignItems: 'center', justifyContent: 'center' },
  photoBtn: { alignItems: 'center', paddingVertical: SPACING.lg, borderRadius: RADIUS.card, borderWidth: 1.5, borderColor: SRS.teal + '40', borderStyle: 'dashed', backgroundColor: SRS.teal + '06' },
  doneSection: { alignItems: 'center', paddingVertical: SPACING.xl * 2, gap: SPACING.md },
  doneIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: SRS.green + '18', alignItems: 'center', justifyContent: 'center' },
  doneTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, textAlign: 'center' },
  doneSub: { ...TYPOGRAPHY.body, color: GRAY[500], textAlign: 'center', lineHeight: 22 },
  summaryCard: { width: '100%', padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], gap: SPACING.sm },
  summaryTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { ...TYPOGRAPHY.body, color: GRAY[500] },
  summaryValue: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 16, paddingHorizontal: 32, borderRadius: RADIUS.card, backgroundColor: SRS.teal },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, paddingBottom: 40, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: GRAY[100] },
  navBack: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: GRAY[100] },
  navBackText: { fontSize: 14, fontWeight: '600', color: GRAY[600] },
  navNext: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: SRS.teal },
  navNextText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
