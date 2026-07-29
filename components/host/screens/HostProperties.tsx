import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, Switch } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useHost } from '@/lib/context/host-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';

const ACCENT = '#2563EB';
const PHOTO_CATEGORIES = ['exterior', 'lobby', 'rooms', 'dining', 'amenities'];

export function HostProperties() {
  const colors = useColors();
  const { properties, roomTypes, updateProperty, updateRoomType, getFilteredRoomTypes, togglePropertyActivation, setPropertyCoverPhoto } = useHost();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [photoCategory, setPhotoCategory] = useState<string>(PHOTO_CATEGORIES[0]);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [photoTargetId, setPhotoTargetId] = useState<string | null>(null);
  const [photoTargetCategory, setPhotoTargetCategory] = useState<string>(PHOTO_CATEGORIES[0]);
  const [expandedRoomType, setExpandedRoomType] = useState<string | null>(null);
  const [showRoomTypePicker, setShowRoomTypePicker] = useState(false);
  const [roomTypeTargetId, setRoomTypeTargetId] = useState<string | null>(null);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [brandColorInput, setBrandColorInput] = useState('');
  const [editingBrand, setEditingBrand] = useState(false);

  const PRESET_COLORS = ['#2563EB', '#7C3AED', '#0891B2', '#059669', '#CA8A04', '#DB2777', '#DC2626', '#1D4ED8', '#0D9488', '#B45309'];

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
    setEditingId(null);
    setEditForm({});
  };

  const startEditing = (property: any) => {
    setEditingId(property.id);
    setEditForm({
      name: property.name,
      description: property.description || '',
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      checkIn: property.check_in_time_from,
      checkOut: property.check_out_time_to,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveProperty = (id: string) => {
    const { name, description, address, city, state, country, checkIn, checkOut } = editForm;
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Property name is required.');
      return;
    }
    updateProperty(id, {
      name: name.trim(),
      description: description.trim() || null,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      check_in_time_from: checkIn,
      check_out_time_to: checkOut,
    });
    setEditingId(null);
    setEditForm({});
  };

  const updateField = (key: string, value: any) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAddPhoto = (propertyId: string, category: string, uri: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    const newPhoto = { id: `ph-${Date.now()}`, photo_url: uri, category };
    updateProperty(propertyId, { photos: [...property.photos, newPhoto] });
  };

  const handleRemovePhoto = (propertyId: string, photoId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    updateProperty(propertyId, { photos: property.photos.filter(p => p.id !== photoId) });
  };

  const handleAddRoomTypePhoto = (roomTypeId: string, uri: string) => {
    const rt = roomTypes.find(r => r.id === roomTypeId);
    if (!rt) return;
    updateRoomType(roomTypeId, { photos: [...rt.photos, uri] });
  };

  const handleRemoveRoomTypePhoto = (roomTypeId: string, index: number) => {
    const rt = roomTypes.find(r => r.id === roomTypeId);
    if (!rt) return;
    updateRoomType(roomTypeId, { photos: rt.photos.filter((_, i) => i !== index) });
  };

  if (properties.length === 0) {
    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 28, color: ACCENT }}>P</Text>
        </View>
        <Text className="text-lg font-bold text-foreground mb-2">No Properties Yet</Text>
        <Text className="text-sm text-muted text-center mb-6" style={{ maxWidth: 240 }}>
          Add your first property to start managing bookings and rooms.
        </Text>
        <TouchableOpacity onPress={() => router.push('/(host)/listing-wizard')}
          style={{ backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 }}
        >
          <Text className="text-white font-semibold">Add Property</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text className="text-2xl font-bold text-foreground mb-5">My Properties</Text>
      {properties.map((property, index) => {
        const isExpanded = expandedId === property.id;
        const isEditing = editingId === property.id;
        const propRoomTypes = getFilteredRoomTypes(property.id);
        const totalRooms = propRoomTypes.reduce((sum, rt) => sum + (rt.max_occupancy > 0 ? 1 : 0), 0);

        return (
          <View key={property.id} style={{ borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: 'hidden' }}>
            <TouchableOpacity onPress={() => toggleExpand(property.id)}
              style={{ padding: 16 }}
            >
              {isEditing ? (
                <View>
                  <TextInput
                    value={editForm.name}
                    onChangeText={v => updateField('name', v)}
                    placeholder="Property name"
                    placeholderTextColor={colors.muted}
                    style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, marginBottom: 4 }}
                  />
                  <Text style={{ fontSize: 13, color: colors.muted }}>
                    {property.type} · {editForm.city || property.city}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{property.name}</Text>
                    <Text className="text-xs text-muted mt-1">
                      {property.type} · {property.city} · {property.total_rooms} rooms
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <Switch
                        value={property.is_active}
                        onValueChange={() => togglePropertyActivation(property.id)}
                        trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                        thumbColor={property.is_active ? '#16A34A' : '#EF4444'}
                      />
                      <Text style={{ fontSize: 10, fontWeight: '600', color: property.is_active ? '#10B981' : '#EF4444' }}>
                        {property.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, color: ACCENT }}>{isExpanded ? '-' : '+'}</Text>
                </View>
              )}
            </TouchableOpacity>

            {isExpanded && (
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 16 }}>
                {isEditing ? (
                  <View>
                    <Text className="text-xs text-muted mb-1">Description</Text>
                    <TextInput
                      value={editForm.description}
                      onChangeText={v => updateField('description', v)}
                      placeholder="Property description"
                      placeholderTextColor={colors.muted}
                      multiline
                      numberOfLines={3}
                      style={{ fontSize: 14, color: colors.foreground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 12, minHeight: 60, textAlignVertical: 'top' }}
                    />
                    <Text className="text-xs text-muted mb-1">Address</Text>
                    <TextInput
                      value={editForm.address}
                      onChangeText={v => updateField('address', v)}
                      placeholder="Address"
                      placeholderTextColor={colors.muted}
                      style={{ fontSize: 14, color: colors.foreground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 12 }}
                    />
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="text-xs text-muted mb-1">City</Text>
                        <TextInput
                          value={editForm.city}
                          onChangeText={v => updateField('city', v)}
                          placeholder="City"
                          placeholderTextColor={colors.muted}
                          style={{ fontSize: 14, color: colors.foreground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 12 }}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-muted mb-1">State</Text>
                        <TextInput
                          value={editForm.state}
                          onChangeText={v => updateField('state', v)}
                          placeholder="State"
                          placeholderTextColor={colors.muted}
                          style={{ fontSize: 14, color: colors.foreground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 12 }}
                        />
                      </View>
                    </View>
                    <Text className="text-xs text-muted mb-1">Country</Text>
                    <TextInput
                      value={editForm.country}
                      onChangeText={v => updateField('country', v)}
                      placeholder="Country"
                      placeholderTextColor={colors.muted}
                      style={{ fontSize: 14, color: colors.foreground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 12 }}
                    />
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="text-xs text-muted mb-1">Check-in</Text>
                        <TextInput
                          value={editForm.checkIn}
                          onChangeText={v => updateField('checkIn', v)}
                          placeholder="14:00"
                          placeholderTextColor={colors.muted}
                          style={{ fontSize: 14, color: colors.foreground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 12 }}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-muted mb-1">Check-out</Text>
                        <TextInput
                          value={editForm.checkOut}
                          onChangeText={v => updateField('checkOut', v)}
                          placeholder="11:00"
                          placeholderTextColor={colors.muted}
                          style={{ fontSize: 14, color: colors.foreground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 12 }}
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-3 mt-2">
                      <TouchableOpacity onPress={cancelEditing}
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => saveProperty(property.id)}
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View className="mb-4">
                      <Text className="text-xs text-muted">Address</Text>
                      <Text className="text-sm text-foreground mt-0.5">{property.address}, {property.city}, {property.state}, {property.country}</Text>
                    </View>
                    <View className="flex-row gap-4 mb-4">
                      <View>
                        <Text className="text-xs text-muted">Check-in</Text>
                        <Text className="text-sm text-foreground mt-0.5">{property.check_in_time_from} - {property.check_in_time_to}</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-muted">Check-out</Text>
                        <Text className="text-sm text-foreground mt-0.5">{property.check_out_time_from} - {property.check_out_time_to}</Text>
                      </View>
                    </View>

                    {property.amenities.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-xs text-muted mb-2">Amenities</Text>
                        <View className="flex-row flex-wrap gap-2">
                          {property.amenities.map((amenity, i) => (
                            <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: ACCENT + '15' }}>
                              <Text style={{ fontSize: 11, color: ACCENT }}>{amenity}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Branding */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs text-muted">Branding</Text>
                        <TouchableOpacity onPress={() => { setEditingBrand(!editingBrand); setBrandColorInput(property.brand_color ?? ''); }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: editingBrand ? '#EF4444' : ACCENT }}>
                            {editingBrand ? 'Done' : 'Edit'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.background, gap: 12 }}>
                        {editingBrand ? (
                          <View>
                            <Text className="text-xs text-muted mb-2">Brand Color</Text>
                            <TextInput
                              value={brandColorInput}
                              onChangeText={setBrandColorInput}
                              placeholder="#2563EB"
                              placeholderTextColor={colors.muted}
                              autoCapitalize="none"
                              onBlur={() => { if (brandColorInput && brandColorInput !== property.brand_color) updateProperty(property.id, { brand_color: brandColorInput }); }}
                              style={{ fontSize: 13, color: colors.foreground, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, marginBottom: 8 }}
                            />
                            <View className="flex-row flex-wrap gap-2 mb-2">
                              {PRESET_COLORS.map(c => (
                                <TouchableOpacity key={c} onPress={() => { setBrandColorInput(c); updateProperty(property.id, { brand_color: c }); }}
                                  style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: brandColorInput === c ? 2 : 0, borderColor: '#fff' }}
                                />
                              ))}
                            </View>
                            <View className="flex-row items-center gap-2">
                              <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: brandColorInput || property.brand_color }} />
                              <Text style={{ fontSize: 12, color: colors.muted }}>
                                Preview: guest sees this color
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-3">
                            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: property.brand_color || ACCENT }} />
                            <Text style={{ fontSize: 13, color: colors.foreground }}>{property.brand_color || ACCENT}</Text>
                          </View>
                        )}
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-muted">Logo</Text>
                          <TouchableOpacity onPress={() => setShowLogoPicker(true)}
                            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: ACCENT + '15' }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>
                              {property.logo_url ? 'Change' : 'Upload'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {property.logo_url ? (
                          <Image source={{ uri: property.logo_url }} style={{ width: 60, height: 60, borderRadius: 8 }} resizeMode="cover" />
                        ) : (
                          <Text style={{ fontSize: 11, color: colors.muted }}>No logo uploaded</Text>
                        )}
                        {property.logo_url && (
                          <TouchableOpacity onPress={() => { updateProperty(property.id, { logo_url: null }); }}>
                            <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Remove Logo</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Cover Photo */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs text-muted">Cover Photo</Text>
                      </View>
                      {(() => {
                        const cover = property.photos.find(p => p.category === 'cover');
                        return cover ? (
                          <View>
                            <Image source={{ uri: cover.photo_url }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
                            <TouchableOpacity
                              onPress={() => {
                                setPhotoTargetId(property.id);
                                setPhotoTargetCategory('cover');
                                setShowPhotoPicker(true);
                              }}
                              style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>+</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={() => { setPhotoTargetId(property.id); setPhotoTargetCategory('cover'); setShowPhotoPicker(true); }}
                            style={{ width: '100%', height: 120, borderRadius: 12, borderWidth: 1.5, borderColor: ACCENT + '40', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT + '08' }}
                          >
                            <Ionicons name="camera-outline" size={24} color={ACCENT} />
                            <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600', marginTop: 4 }}>Upload Cover Photo</Text>
                          </TouchableOpacity>
                        );
                      })()}
                    </View>

                    {/* Photo Gallery */}
                    <View className="mb-4">
                      <Text className="text-xs text-muted mb-2">Photo Gallery ({property.photos.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                        {PHOTO_CATEGORIES.map(cat => {
                          const count = property.photos.filter(p => p.category === cat).length;
                          const isActive = photoCategory === cat;
                          return (
                            <TouchableOpacity key={cat} onPress={() => setPhotoCategory(cat)}
                              style={{
                                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 6,
                                backgroundColor: isActive ? ACCENT : colors.border,
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? '#fff' : colors.foreground, textTransform: 'capitalize' }}>
                                {cat} ({count})
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      {(() => {
                        const catPhotos = property.photos.filter(p => p.category === photoCategory);
                        return catPhotos.length === 0 ? (
                          <View style={{ padding: 16, borderRadius: 12, backgroundColor: colors.border + '40', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ fontSize: 12, color: colors.muted }}>{'No photos in "' + photoCategory + '"'}</Text>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {catPhotos.map(photo => (
                              <View key={photo.id} style={{ width: '30%', aspectRatio: 4 / 3, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.border }}>
                                <Image source={{ uri: photo.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                <TouchableOpacity
                                  onPress={() => handleRemovePhoto(property.id, photo.id)}
                                  style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.9)', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>×</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        );
                      })()}
                      <TouchableOpacity onPress={() => { setPhotoTargetId(property.id); setPhotoTargetCategory(photoCategory); setShowPhotoPicker(true); }}
                        style={{ paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: ACCENT + '40', alignItems: 'center', borderStyle: 'dashed' }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: ACCENT }}>+ Add Photo</Text>
                      </TouchableOpacity>
                    </View>

                    <View className="mb-4">
                      <Text className="text-xs text-muted">Cancellation Policy</Text>
                      <Text className="text-sm text-foreground mt-0.5">{property.cancellation_policy}</Text>
                    </View>

                    {propRoomTypes.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-xs text-muted mb-2">Room Types</Text>
                        {propRoomTypes.map((rt, i) => {
                          const isRtExpanded = expandedRoomType === rt.id;
                          return (
                            <View key={rt.id}
                              style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.background, marginBottom: 6 }}
                            >
                              <TouchableOpacity onPress={() => setExpandedRoomType(isRtExpanded ? null : rt.id)}
                                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                              >
                                <View style={{ flex: 1 }}>
                                  <Text className="text-sm font-semibold text-foreground">{rt.room_type_name}</Text>
                                  <Text className="text-xs text-muted mt-0.5">
                                    Max {rt.max_occupancy} guests · {rt.bed_configuration} · {rt.view_type}
                                    {rt.photos.length > 0 && ` · ${rt.photos.length} photos`}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 14, color: colors.muted }}>{isRtExpanded ? 'v' : '>'}</Text>
                              </TouchableOpacity>
                              {isRtExpanded && (
                                <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
                                  {/* Photos */}
                                  <Text className="text-xs text-muted mb-2">Photos</Text>
                                  {rt.photos.length === 0 ? (
                                    <View style={{ padding: 12, borderRadius: 8, backgroundColor: colors.border + '40', alignItems: 'center', marginBottom: 8 }}>
                                      <Text style={{ fontSize: 11, color: colors.muted }}>No photos</Text>
                                    </View>
                                  ) : (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                      {rt.photos.map((url, idx) => (
                                        <View key={idx} style={{ width: '23%', aspectRatio: 4 / 3, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.border }}>
                                          <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                          <TouchableOpacity
                                            onPress={() => handleRemoveRoomTypePhoto(rt.id, idx)}
                                            style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.9)', alignItems: 'center', justifyContent: 'center' }}
                                          >
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>×</Text>
                                          </TouchableOpacity>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                  <TouchableOpacity onPress={() => { setRoomTypeTargetId(rt.id); setShowRoomTypePicker(true); }}
                                    style={{ paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: ACCENT + '40', alignItems: 'center', borderStyle: 'dashed', marginBottom: 12 }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>+ Add Photo</Text>
                                  </TouchableOpacity>

                                  {/* Extra Charges */}
                                  <Text className="text-xs text-muted mb-2">Extra Charges</Text>
                                  {(rt as any).extra_charges && (rt as any).extra_charges.length > 0 ? (
                                    <View style={{ gap: 8, marginBottom: 8 }}>
                                      {(rt as any).extra_charges.map((ec: any) => (
                                        <View key={ec.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.border + '40' }}>
                                          <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>{ec.name}</Text>
                                            {ec.description && <Text style={{ fontSize: 10, color: colors.muted }}>{ec.description}</Text>}
                                          </View>
                                          <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>
                                            रू{ec.price.toLocaleString()}
                                            <Text style={{ fontSize: 10, fontWeight: '400', color: colors.muted }}> /{ec.charge_type === 'per_night' ? 'night' : 'stay'}</Text>
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  ) : (
                                    <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 8 }}>No extra charges configured</Text>
                                  )}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    <View className="flex-row gap-3 mt-2">
                      <TouchableOpacity onPress={() => startEditing(property)}
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: ACCENT, alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push('/(host)/listing-wizard')}
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Manage Property</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
      <ImagePickerOverlay
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onImagePicked={async (uri) => {
          if (photoTargetId) {
            if (photoTargetCategory === 'cover') {
              await setPropertyCoverPhoto(photoTargetId, uri);
            } else {
              handleAddPhoto(photoTargetId, photoTargetCategory, uri);
            }
          }
        }}
      />
      <ImagePickerOverlay
        visible={showRoomTypePicker}
        onClose={() => setShowRoomTypePicker(false)}
        onImagePicked={(uri) => {
          if (roomTypeTargetId) {
            handleAddRoomTypePhoto(roomTypeTargetId, uri);
          }
        }}
      />
      <ImagePickerOverlay
        visible={showLogoPicker}
        onClose={() => setShowLogoPicker(false)}
        onImagePicked={(uri) => {
          if (expandedId) {
            updateProperty(expandedId, { logo_url: uri });
          }
        }}
      />
    </ScrollView>
  );
}
