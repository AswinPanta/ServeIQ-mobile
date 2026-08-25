import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, Modal,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RoomSetup } from '@/components/host/RoomSetup';
import { MapLocationPicker } from '@/components/host/MapLocationPicker';
import { SRS, TYPOGRAPHY, GRAY } from '@/constants/portal-theme';
import { BG, ORANGE, RED } from '@/lib/constants/figma-tokens';
import { ACCENT, PROPERTY_TYPES, COUNTRIES } from './types';
import type { WizardCtx } from './types';
import { CounterInput, ToggleSwitch, StarRating, ReviewCard, ReviewField, reviewCs } from './controls';
import { styles } from './styles';

export default function ListingWizardSteps({ ctx }: { ctx: WizardCtx }) {
  const {
    setCurrentStep, loading, saving,
    propertyType, setPropertyType,
    propData, setPropData,
    fieldErrors, clearFieldError,
    location, setLocation,
    countrySearch, setCountrySearch,
    showCountryDropdown, setShowCountryDropdown,
    stateSearch, setStateSearch,
    showStateDropdown, setShowStateDropdown,
    stateOptions,
    showMapPicker, setShowMapPicker,
    handleLocationSelect, fullAddress,
    photos, setPhotos, coverPhotoIndex, setCoverPhotoIndex,
    logo, setLogo, setShowLogoPicker,
    starRating, setStarRating,
    amenities, setAmenities,
    customAmenity, setCustomAmenity,
    amenitySearch, setAmenitySearch,
    setShowPhotoPicker, filteredAmenities,
    floors, setFloors,
    offers, toggleOffer,
    checkInTime, setCheckInTime,
    checkOutTime, setCheckOutTime,
    showCustomOffer, setShowCustomOffer,
    customOfferData, setCustomOfferData,
    addCustomOffer,
    handleGoToStep, handlePublish, handleSaveDraft,
    stepNum, stepTotal, profileStrength,
    toggleAmenity,
  } = ctx;

  switch (ctx.currentStep) {
      // ──────────── STEP: TYPE ────────────
      case 'type':
        return (
          <View style={styles.typeContainer}>
            <View style={styles.typeCard}>
              <Text style={styles.typeTitle}>Select Your Property Type</Text>
              <Text style={styles.typeSubtitle}>
                Choose the category that best describes your property
              </Text>
              <View style={styles.typeGrid}>
                {PROPERTY_TYPES.map(pt => {
                  const selected = propertyType === pt.id;
                  const isCustom = pt.id === 'custom';
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      onPress={() => {
                        setPropertyType(pt.id);
                        if (pt.id !== 'custom') {
                          setTimeout(() => setCurrentStep('property'), 200);
                        }
                      }}
                      style={[
                        styles.typeCardItem,
                        selected && styles.typeCardSelected,
                        isCustom && styles.typeCardCustom,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.typeIconWrap, selected && styles.typeIconSelected]}>
                        <IconSymbol name={pt.icon as any} size={28} color={selected ? BG.white : GRAY[500]} />
                      </View>
                      <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );

      // ──────────── STEP: PROPERTY ────────────
      case 'property':
        return (
          <View style={styles.stepContentWrapper}>
            <View style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <Text style={styles.stepCardTitle}>General Information</Text>
                <Text style={styles.stepCardSubtitle}>Provide the foundational details of your property</Text>
              </View>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.formLabel}>Property Name *</Text>
                  <TextInput
                    value={propData.name}
                    onChangeText={t => { setPropData(p => ({ ...p, name: t })); clearFieldError('name'); }}
                    placeholder="e.g. Skyline Towers, Sunset Villas"
                    placeholderTextColor={GRAY[400]}
                    style={[styles.formInput, fieldErrors.name && { borderColor: RED[500] }]}
                    maxLength={255}
                  />
                  {fieldErrors.name ? (
                    <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.name}</Text>
                  ) : (
                    <Text style={styles.formHint}>This will be the display name for your dashboard</Text>
                  )}
                </View>
                <View style={styles.formRow3}>
                  <View>
                    <Text style={styles.formLabel}>Total Rooms</Text>
                    <TextInput
                      value={String(propData.totalRooms || '')}
                      onChangeText={t => setPropData(p => ({ ...p, totalRooms: parseInt(t) || 0 }))}
                      placeholder="eg.100"
                      placeholderTextColor={GRAY[400]}
                      keyboardType="number-pad"
                      style={styles.formInput}
                    />
                  </View>
                  <View>
                    <Text style={styles.formLabel}>No of Floors</Text>
                    <CounterInput value={propData.floors} onChange={v => setPropData(p => ({ ...p, floors: v }))} min={1} max={50} />
                  </View>
                  <View>
                    <Text style={styles.formLabel}>Year Built</Text>
                    <TextInput
                      value={String(propData.yearBuilt || '')}
                      onChangeText={t => setPropData(p => ({ ...p, yearBuilt: parseInt(t) || 0 }))}
                      placeholder="eg.2018"
                      placeholderTextColor={GRAY[400]}
                      keyboardType="number-pad"
                      style={styles.formInput}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.formLabel}>Property Description</Text>
                  <Text style={styles.formHintInline}>Highlight the best features and neighborhood vibes</Text>
                  <TextInput
                    value={propData.description}
                    onChangeText={t => setPropData(p => ({ ...p, description: t.slice(0, 2500) }))}
                    placeholder="Enter a detailed description of the property..."
                    placeholderTextColor={GRAY[400]}
                    multiline
                    numberOfLines={4}
                    style={[styles.formInput, { minHeight: 100, textAlignVertical: 'top' }]}
                  />
                  <Text style={styles.charCount}>{propData.description.length} / 2500 characters</Text>
                </View>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <IconSymbol name="phone" size={16} color={ACCENT} />
                <Text style={styles.stepCardTitle}>Contact Information</Text>
              </View>
              <View style={styles.formRow2}>
                <View>
                  <Text style={styles.formLabel}>Phone Number *</Text>
                  <View style={[styles.inputWithIcon, fieldErrors.phone && { borderColor: RED[500] }]}>                    
                    <IconSymbol name="phone" size={14} color={GRAY[400]} />
                    <TextInput
                      value={propData.phone}
                      onChangeText={t => {
                        const digitsOnly = t.replace(/\D/g, '').slice(0, 10);
                        setPropData(p => ({ ...p, phone: digitsOnly }));
                        clearFieldError('phone');
                      }}
                      placeholder="0000000000"
                      placeholderTextColor={GRAY[400]}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={[styles.formInput, { borderWidth: 0, paddingLeft: 8 }]}
                    />
                  </View>
                  {fieldErrors.phone ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.phone}</Text> : null}
                </View>
                <View>
                  <Text style={styles.formLabel}>Official Email *</Text>
                  <View style={[styles.inputWithIcon, fieldErrors.email && { borderColor: RED[500] }]}>                    
                    <IconSymbol name="email" size={14} color={GRAY[400]} />
                    <TextInput
                      value={propData.email}
                      onChangeText={t => { setPropData(p => ({ ...p, email: t })); clearFieldError('email'); }}
                      placeholder="contact@property.com"
                      placeholderTextColor={GRAY[400]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.formInput, { borderWidth: 0, paddingLeft: 8 }]}
                    />
                  </View>
                  {fieldErrors.email ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.email}</Text> : null}
                </View>
              </View>
            </View>
          </View>
        );

      // ──────────── STEP: LOCATION ────────────
      case 'location':
        return (
          <View style={styles.stepContentWrapper}>
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Physical Address</Text>
              <View style={styles.formRow2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Country *</Text>
                  <TouchableOpacity
                    onPress={() => setShowCountryDropdown(!showCountryDropdown)}
                    style={[styles.formInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, fieldErrors.country && { borderColor: RED[500] }]}
                  >
                    <Text style={{ fontSize: 14, color: location.country ? SRS.navy : GRAY[400] }}>
                      {location.country || 'Select country'}
                    </Text>
                    <Text style={{ fontSize: 12, color: GRAY[400] }}>{showCountryDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {fieldErrors.country ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.country}</Text> : null}
                  {showCountryDropdown && (<>
                    <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -2000, zIndex: 99 }} activeOpacity={1} onPress={() => { setShowCountryDropdown(false); setCountrySearch(''); }} />
                    <View style={styles.countryDropdown}>
                      <TextInput
                        value={countrySearch}
                        onChangeText={setCountrySearch}
                        placeholder="Search countries..."
                        placeholderTextColor={GRAY[400]}
                        style={styles.countrySearchInput}
                        autoFocus
                      />
                      <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                        {COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                          <TouchableOpacity
                            key={c}
                            onPress={() => {
                              setLocation(p => ({ ...p, country: c }));
                              setShowCountryDropdown(false);
                              setCountrySearch('');
                            }}
                            style={[styles.countryDropdownItem, location.country === c && styles.countryDropdownItemActive]}
                          >
                            <Text style={[styles.countryDropdownText, location.country === c && styles.countryDropdownTextActive]}>
                              {c}
                            </Text>
                            {location.country === c && <Text style={{ color: ACCENT, fontSize: 14 }}>✓</Text>}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    </>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>State/Province *</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowStateDropdown(!showStateDropdown);
                      setStateSearch('');
                    }}
                    style={[styles.formInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, fieldErrors.state && { borderColor: RED[500] }]}
                  >
                    <Text style={{ fontSize: 14, color: location.state ? SRS.navy : GRAY[400] }}>
                      {location.state || 'Select state'}
                    </Text>
                    <Text style={{ fontSize: 12, color: GRAY[400] }}>{showStateDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {fieldErrors.state ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.state}</Text> : null}
                  {showStateDropdown && (
                    <>
                      <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -2000, zIndex: 99 }} activeOpacity={1} onPress={() => { setShowStateDropdown(false); setStateSearch(''); }} />
                      <View style={[styles.countryDropdown, { zIndex: 100 }]}
                      >
                        <TextInput
                          value={stateSearch}
                          onChangeText={setStateSearch}
                          placeholder="Search states..."
                          placeholderTextColor={GRAY[400]}
                          style={styles.countrySearchInput}
                          autoFocus
                        />
                        <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                          {stateOptions.length > 0 ? (
                            stateOptions
                              .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                              .map(s => (
                                <TouchableOpacity
                                  key={s}
                                  onPress={() => {
                                    setLocation(p => ({ ...p, state: s }));
                                    setShowStateDropdown(false);
                                    setStateSearch('');
                                    clearFieldError('state');
                                  }}
                                  style={[styles.countryDropdownItem, location.state === s && styles.countryDropdownItemActive]}
                                >
                                  <Text style={[styles.countryDropdownText, location.state === s && styles.countryDropdownTextActive]}>
                                    {s}
                                  </Text>
                                  {location.state === s && <Text style={{ color: ACCENT, fontSize: 14 }}>✓</Text>}
                                </TouchableOpacity>
                              ))
                          ) : (
                            <View style={{ padding: 12 }}>
                              <Text style={{ fontSize: 13, color: GRAY[400], textAlign: 'center' }}>No states available for {location.country || 'this country'}</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  setShowStateDropdown(false);
                                  // Allow free text input by clearing the dropdown
                                }}
                                style={{ marginTop: 8, alignItems: 'center' }}
                              >
                                <Text style={{ fontSize: 13, color: ACCENT, fontWeight: '600' }}>Type manually instead</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </ScrollView>
                        {/* Free-text fallback for countries not in the mapping */}
                        {stateOptions.length > 0 && (
                          <View style={{ borderTopWidth: 1, borderTopColor: GRAY[200], padding: 8 }}>
                            <TextInput
                              value={location.state}
                              onChangeText={t => { setLocation(p => ({ ...p, state: t })); clearFieldError('state'); }}
                              placeholder="Or type custom state..."
                              placeholderTextColor={GRAY[400]}
                              style={{ fontSize: 13, color: SRS.navy, padding: 8 }}
                            />
                          </View>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.formRow2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>City *</Text>
                  <TextInput
                    value={location.city}
                    onChangeText={t => { setLocation(p => ({ ...p, city: t })); clearFieldError('city'); }}
                    placeholder="City"
                    placeholderTextColor={GRAY[400]}
                    style={[styles.formInput, fieldErrors.city && { borderColor: RED[500] }]}
                  />
                  {fieldErrors.city ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.city}</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>ZIP/Postal Code *</Text>
                  <TextInput
                    value={location.zip}
                    onChangeText={t => { setLocation(p => ({ ...p, zip: t })); clearFieldError('zip'); }}
                    placeholder="Zip Code"
                    placeholderTextColor={GRAY[400]}
                    keyboardType="number-pad"
                    style={[styles.formInput, fieldErrors.zip && { borderColor: RED[500] }]}
                  />
                  {fieldErrors.zip ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.zip}</Text> : null}
                </View>
              </View>
              <View>
                <Text style={styles.formLabel}>Street Address *</Text>
                <TextInput
                  value={location.street}
                  onChangeText={t => { setLocation(p => ({ ...p, street: t })); clearFieldError('street'); }}
                  placeholder="e.g. 123 Property Lane"
                  placeholderTextColor={GRAY[400]}
                  style={[styles.formInput, fieldErrors.street && { borderColor: RED[500] }]}
                />
                {fieldErrors.street ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.street}</Text> : null}
              </View>
              {/* Location on Map */}
              <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: GRAY[200] }}>
                <Text style={{ ...styles.formLabel, marginBottom: 4, color: SRS.navy }}>Location on Map</Text>
                <Text style={styles.formHint}>Pin the exact spot of your property on the map</Text>
                <TouchableOpacity
                  onPress={() => setShowMapPicker(true)}
                  style={styles.mapPickerBtn}
                  activeOpacity={0.8}
                >
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: ACCENT }}>
                    {location.latitude != null && location.longitude != null
                      ? `Pinned: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                      : 'Tap to open the map'}
                  </Text>
                  <Text style={{ fontSize: 16, color: GRAY[400] }}>›</Text>
                </TouchableOpacity>
                {location.latitude != null && location.longitude != null && (
                  <View style={styles.mapSelectedCard}>
                    <Text style={{ fontSize: 11, color: GRAY[500], fontWeight: '600' }}>SELECTED COORDINATES</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: SRS.navy, marginTop: 4, fontVariant: ['tabular-nums'] }}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                    {fullAddress && (
                      <Text style={{ fontSize: 12, color: GRAY[500], marginTop: 6 }} numberOfLines={2}>
                        {fullAddress}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Interactive map picker modal */}
            <MapLocationPicker
              visible={showMapPicker}
              onClose={() => setShowMapPicker(false)}
              onLocationSelect={handleLocationSelect}
              initialLat={location.latitude ?? undefined}
              initialLng={location.longitude ?? undefined}
            />
          </View>
        );

      // ──────────── STEP: PHOTOS & AMENITIES ────────────
      case 'photos':
        return (
          <View style={{ gap: 20 }}>
            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.stepCardTitle}>Property Photos</Text>
                <Text style={{ fontSize: 13, color: GRAY[500] }}>{photos.length} / 50 Uploaded</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPhotoPicker(true)}
                style={styles.photoUploadZone}
                activeOpacity={0.7}
              >
                <IconSymbol name="upload" size={32} color={GRAY[400]} />
                <Text style={{ fontSize: 14, color: SRS.navy, marginTop: 8 }}>Tap to upload photos</Text>
                <Text style={{ fontSize: 13, color: ACCENT, marginTop: 4 }}>or browse files from your device</Text>
                <Text style={{ fontSize: 12, color: GRAY[500], marginTop: 4 }}>You can select multiple photos at once</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <View style={styles.hintDot} />
                  <Text style={styles.uploadHint}>High resolution</Text>
                  <View style={styles.hintDot} />
                  <Text style={styles.uploadHint}>JPG, PNG, WEBP</Text>
                  <View style={styles.hintDot} />
                  <Text style={styles.uploadHint}>Up to 20MB</Text>
                </View>
              </TouchableOpacity>
              {photos.length > 0 && (
                <View style={styles.photoPreviewGrid}>
                  {photos.slice(0, 4).map((uri, i) => (
                    <View key={i} style={styles.photoPreviewItem}>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      {i === coverPhotoIndex && (
                        <View style={styles.coverBadge}>
                          <IconSymbol name="star" size={10} color={BG.white} />
                          <Text style={styles.coverBadgeText}>Cover</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => setCoverPhotoIndex(i)}
                        style={styles.coverSetBtn}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: BG.white }}>Set Cover</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          const removed = i;
                          setPhotos(prev => {
                            const next = prev.filter((_, idx) => idx !== removed);
                            return next;
                          });
                          setCoverPhotoIndex(prev => {
                            if (removed === prev) return 0;
                            if (removed < prev) return prev - 1;
                            return prev;
                          });
                        }}
                        style={styles.photoRemoveBtn}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: BG.white }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {photos.length > 4 && (
                    <View style={styles.photoPreviewMore}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: GRAY[600] }}>+{photos.length - 4}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowPhotoPicker(true)}
                    style={styles.photoPreviewAdd}
                  >
                    <IconSymbol name="add" size={20} color={GRAY[400]} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.stepCardTitle}>Property Owner Logo</Text>
                {logo && (
                  <TouchableOpacity onPress={() => setLogo(null)} activeOpacity={0.7}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#E11D48' }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.formHint}>
                Add your business or property logo. As the owner of this property, it will appear on your public listing and guest pages.
              </Text>
              {logo ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 }}>
                  <Image
                    source={{ uri: logo }}
                    style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: GRAY[100], borderWidth: 1, borderColor: GRAY[200] }}
                    resizeMode="contain"
                  />
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setShowLogoPicker(true)}
                      style={styles.coverSetBtn}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: BG.white }}>Replace</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 11, color: GRAY[500] }}>JPG, PNG, WEBP</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowLogoPicker(true)}
                  style={[styles.photoUploadZone, { marginTop: 14, paddingVertical: 26 }]}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="upload" size={34} color={GRAY[400]} />
                  <Text style={{ fontSize: 14, color: SRS.navy, marginTop: 8 }}>Tap to upload owner logo</Text>
                  <Text style={{ fontSize: 12, color: GRAY[500], marginTop: 4 }}>Square image recommended</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IconSymbol name="star" size={18} color={ACCENT} />
                <Text style={styles.stepCardTitle}>Official Star Rating</Text>
              </View>
              <Text style={styles.formHint}>Select the certified commercial rating of this property</Text>
              <StarRating rating={starRating} onChange={setStarRating} />
            </View>

            {/* Amenities */}
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Amenities</Text>
              <View style={styles.amenitySearchWrap}>
                <IconSymbol name="search" size={14} color={GRAY[400]} />
                <TextInput
                  value={amenitySearch}
                  onChangeText={setAmenitySearch}
                  placeholder="Search amenities..."
                  placeholderTextColor={GRAY[400]}
                  style={{ flex: 1, fontSize: 13, color: SRS.navy, padding: 0 }}
                />
              </View>
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                {filteredAmenities.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => toggleAmenity(a.name)}
                    style={styles.amenityItem}
                  >
                    <View style={[styles.amenityCheckbox, amenities.includes(a.name) && styles.amenityCheckboxActive]}>
                      {amenities.includes(a.name) && <IconSymbol name="check" size={12} color={BG.white} />}
                    </View>
                    <Text style={{ fontSize: 14 }}>{a.icon}</Text>
                    <Text style={{ flex: 1, fontSize: 13, color: SRS.navy }}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.customAmenitySection}>
                <Text style={styles.customAmenityTitle}>Add a custom amenity</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={customAmenity}
                    onChangeText={setCustomAmenity}
                    placeholder="e.g. Private Helipad, Wine Cellar..."
                    placeholderTextColor={GRAY[400]}
                    onSubmitEditing={() => {
                      const t = customAmenity.trim();
                      if (t && !amenities.includes(t)) {
                        setAmenities(p => [...p, t]);
                        setCustomAmenity('');
                      }
                    }}
                    style={[styles.formInput, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const t = customAmenity.trim();
                      if (t && !amenities.includes(t)) {
                        setAmenities(p => [...p, t]);
                        setCustomAmenity('');
                      }
                    }}
                    style={styles.addAmenityBtn}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: BG.white }}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.customAmenityHint}>
                  Press Enter or tap Add to include an amenity not in the list above.
                </Text>
              </View>
            </View>
          </View>
        );

      // ──────────── STEP: ROOMS ────────────
      case 'rooms':
        return (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ ...TYPOGRAPHY.h2, color: SRS.navy }}>Room Setup</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500] }}>
                Add each room type guests will be able to book at your property
              </Text>
            </View>
            <RoomSetup rooms={floors} onRoomsChange={setFloors} />
          </View>
        );

      // ──────────── STEP: PRICING & OFFERS ────────────
      case 'pricing':
        return (
          <View style={{ gap: 20, maxWidth: 500, alignSelf: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: GRAY[500], marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Step {stepNum} of {stepTotal}
              </Text>
              <Text style={{ ...TYPOGRAPHY.h2, color: SRS.navy }}>Pricing & Offers</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500] }}>
                Set your nightly rate and any special offers for guests
              </Text>
            </View>

            {/* Offers */}
            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <IconSymbol name="discount" size={18} color={ACCENT} />
                <Text style={styles.stepCardTitle}>Special Offers</Text>
              </View>
              <Text style={{ ...styles.formHint, marginBottom: 16 }}>
                Enable pre-set promotions or create custom offers
              </Text>

              {offers.map(offer => (
                <View key={offer.id} style={[styles.offerItem, offer.enabled && styles.offerItemEnabled]}>
                  <View style={styles.offerContent}>
                    <ToggleSwitch active={offer.enabled} onToggle={() => toggleOffer(offer.id)} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: SRS.navy }}>{offer.label}</Text>
                        <View style={[styles.offerBadge, { backgroundColor: offer.badgeColor }]}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: offer.badgeText }}>{offer.badge}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: GRAY[500] }}>{offer.desc}</Text>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setShowCustomOffer(true)}
                style={styles.addCustomOfferBtn}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>+ Add Custom Offer</Text>
              </TouchableOpacity>
            </View>

            {/* Stay Policies */}
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Stay Policies</Text>
              <Text style={{ ...styles.formHint, marginBottom: 20 }}>
                Define check-in/out windows and preferences
              </Text>
              <View style={styles.formRow2}>
                <View>
                  <Text style={styles.formLabel}>Check-in Time *</Text>
                  <TextInput
                    value={checkInTime}
                    onChangeText={t => { setCheckInTime(t); clearFieldError('checkInTime'); }}
                    placeholder="15:00"
                    placeholderTextColor={GRAY[400]}
                    style={[styles.formInput, fieldErrors.checkInTime && { borderColor: RED[500] }]}
                  />
                  {fieldErrors.checkInTime ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.checkInTime}</Text> : null}
                </View>
                <View>
                  <Text style={styles.formLabel}>Check-out Time *</Text>
                  <TextInput
                    value={checkOutTime}
                    onChangeText={t => { setCheckOutTime(t); clearFieldError('checkOutTime'); }}
                    placeholder="11:00"
                    placeholderTextColor={GRAY[400]}
                    style={[styles.formInput, fieldErrors.checkOutTime && { borderColor: RED[500] }]}
                  />
                  {fieldErrors.checkOutTime ? <Text style={{ fontSize: 12, color: RED[500], marginTop: 4 }}>{fieldErrors.checkOutTime}</Text> : null}
                </View>
              </View>
            </View>

            {/* Custom Offer Modal */}
            {showCustomOffer && (
              <Modal transparent visible={showCustomOffer} animationType="fade" onRequestClose={() => setShowCustomOffer(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCustomOffer(false)}>
                  <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                    <View style={styles.modalHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 18 }}>➕</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: SRS.navy }}>Create Custom Offer</Text>
                      </View>
                      <TouchableOpacity onPress={() => setShowCustomOffer(false)}>
                        <IconSymbol name="close" size={18} color={GRAY[500]} />
                      </TouchableOpacity>
                    </View>
                    <View style={{ padding: 24, gap: 16 }}>
                      <View>
                        <Text style={styles.formLabel}>Offer Title *</Text>
                        <TextInput
                          value={customOfferData.title}
                          onChangeText={t => setCustomOfferData(p => ({ ...p, title: t }))}
                          placeholder="e.g. Diwali Festival Special, Summer Sale..."
                          placeholderTextColor={GRAY[400]}
                          style={styles.formInput}
                        />
                      </View>
                      <View>
                        <Text style={styles.formLabel}>Description (optional)</Text>
                        <TextInput
                          value={customOfferData.description}
                          onChangeText={t => setCustomOfferData(p => ({ ...p, description: t }))}
                          placeholder="Briefly describe the offer..."
                          placeholderTextColor={GRAY[400]}
                          multiline
                          numberOfLines={3}
                          style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                        />
                      </View>
                    </View>
                    <View style={styles.modalFooter}>
                      <TouchableOpacity onPress={() => setShowCustomOffer(false)} style={styles.btnCancel}>
                        <Text style={{ fontSize: 13, color: SRS.navy, fontWeight: '500' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={addCustomOffer} style={styles.btnSaveDates}>
                        <IconSymbol name="save" size={14} color={BG.white} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: BG.white }}>Save Offer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
          </View>
        );

      // ──────────── STEP: REVIEW ────────────
      case 'review':
        return (
          <View style={{ gap: 20 }}>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ ...TYPOGRAPHY.h2, color: SRS.navy }}>Final Review & Launch</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500], lineHeight: 21 }}>
                Please review all property details before making your listing live.
              </Text>
            </View>

            {/* Main review content */}
            <View style={{ flex: 1 }}>
              {/* Basic Info */}
              <ReviewCard
                title="Basic Information"
                icon="📋"
                onEdit={() => handleGoToStep(1)}
              >
                <View style={styles.reviewGrid2}>
                  <ReviewField label="PROPERTY NAME" value={propData.name || 'Not set'} />
                  <ReviewField label="PROPERTY TYPE" value={PROPERTY_TYPES.find(t => t.id === propertyType)?.label || 'Not set'} />
                </View>
                {propData.description && (
                  <ReviewField label="DESCRIPTION" value={propData.description} style={{ marginTop: 12 }} />
                )}
                {starRating > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={reviewCs.fieldLabel}>STAR RATING</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <IconSymbol key={s} name="star" size={16} color={s <= starRating ? ORANGE[400] : GRAY[300]} />
                      ))}
                      <Text style={{ fontSize: 13, fontWeight: '500', color: SRS.navy, marginLeft: 4 }}>
                        {starRating} Star{starRating > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                )}
              </ReviewCard>

              {/* Location */}
              <ReviewCard
                title="Location Details"
                icon="📍"
                onEdit={() => handleGoToStep(2)}
              >
                <ReviewField label="ADDRESS" value={fullAddress || 'No address set'} />
                {location.mapLink && (
                  <ReviewField label="MAP LINK" value={location.mapLink} style={{ marginTop: 8 }} />
                )}
              </ReviewCard>

              {/* Media & Amenities */}
              <ReviewCard
                title="Media & Amenities"
                icon="📷"
                onEdit={() => handleGoToStep(3)}
              >
                <Text style={reviewCs.fieldLabel}>PHOTOS ({photos.length} UPLOADED)</Text>
                {photos.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    {photos.slice(0, 4).map((uri, i) => (
                      <View key={i} style={styles.reviewPhotoItem}>
                        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        {i === coverPhotoIndex && (
                          <View style={[styles.coverBadge, { top: 3, left: 3 }]}>
                            <IconSymbol name="star" size={10} color={BG.white} />
                            <Text style={styles.coverBadgeText}>Cover</Text>
                          </View>
                        )}
                      </View>
                    ))}
                    {photos.length > 4 && (
                      <View style={[styles.reviewPhotoItem, { backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: GRAY[600] }}>+{photos.length - 4}</Text>
                      </View>
                    )}
                  </View>
                )}
                {logo && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={reviewCs.fieldLabel}>OWNER LOGO</Text>
                    <Image
                      source={{ uri: logo }}
                      style={{ width: 60, height: 60, borderRadius: 12, marginTop: 6, backgroundColor: GRAY[100], borderWidth: 1, borderColor: GRAY[200] }}
                      resizeMode="contain"
                    />
                  </View>
                )}
                {amenities.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={reviewCs.fieldLabel}>AMENITIES</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {amenities.slice(0, 8).map(a => (
                        <View key={a} style={styles.reviewAmenityTag}>
                          <Text style={{ fontSize: 11, color: ACCENT }}>{a}</Text>
                        </View>
                      ))}
                      {amenities.length > 8 && (
                        <Text style={{ fontSize: 11, color: GRAY[500], alignSelf: 'center' }}>
                          +{amenities.length - 8} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </ReviewCard>

              {/* Offers & Rooms */}
              <ReviewCard
                title="Offers & Rooms"
                icon="🏷️"
                onEdit={() => handleGoToStep(5)}
              >
                {(() => {
                  const enabled = offers.filter(o => o.enabled);
                  return enabled.length > 0 ? (
                    <View style={{ gap: 6 }}>
                      {enabled.map(o => (
                        <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 13, color: SRS.navy }}>{o.label}</Text>
                          <View style={[styles.offerBadge, { backgroundColor: o.badgeColor }]}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: o.badgeText }}>{o.badge}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : <Text style={{ fontSize: 13, color: GRAY[500] }}>No offers enabled</Text>;
                })()}
                {floors.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={reviewCs.fieldLabel}>ROOMS</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {floors.map(f => (f.rooms || []).map((r: any) => (
                        <View key={r.id} style={styles.reviewRoomTag}>
                          <Text style={{ fontSize: 11, color: SRS.navy }}>
                            {r.roomNumber || r.name} - {r.roomType || 'Standard'}
                          </Text>
                        </View>
                      )))}
                    </View>
                  </View>
                )}
              </ReviewCard>
            </View>

            {/* Sidebar summary */}
            <View style={styles.reviewSidebar}>
              <View style={styles.publishCard}>
                <IconSymbol name="check" size={20} color={SRS.green} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: SRS.navy, marginTop: 8 }}>Ready to Publish</Text>
                <Text style={{ fontSize: 13, color: GRAY[500], textAlign: 'center', lineHeight: 20, marginTop: 4 }}>
                  Your property listing is complete. Once launched, it will be visible on the public portal.
                </Text>
                <TouchableOpacity
                  onPress={handlePublish}
                  disabled={loading || saving === 'publishing'}
                  style={[styles.btnLaunch, (loading || saving === 'publishing') && { opacity: 0.6 }]}
                >
                  {loading || saving === 'publishing' ? (
                    <ActivityIndicator color={BG.white} />
                  ) : (
                    <>
                      <IconSymbol name="check" size={16} color={BG.white} />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: BG.white }}>Launch Property</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveDraft}
                  style={[styles.btnSaveDraft, saving === 'saving' && { opacity: 0.5 }]}
                  disabled={saving === 'saving'}
                >
                  {saving === 'saving' ? (
                    <ActivityIndicator size="small" color={ACCENT} />
                  ) : (
                    <>
                      <IconSymbol name="save" size={16} color={ACCENT} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>Save as Draft</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Checklist */}
              <View style={styles.checklistCard}>
                <Text style={styles.checklistTitle}>ONBOARDING CHECKLIST</Text>
                {[
                  { label: 'Core Identity Verified', done: true },
                  { label: 'High-Res Media Loaded', done: photos.length > 0 },
                  { label: 'Owner Logo Uploaded', done: !!logo },
                  { label: 'Address & Geo-tagging', done: !!location.street },
                  { label: 'Regulatory Compliance', done: true },
                ].map(item => (
                  <View key={item.label} style={styles.checklistItem}>
                    <IconSymbol name="check" size={16} color={item.done ? SRS.green : GRAY[300]} />
                    <Text style={{ fontSize: 13, color: item.done ? SRS.navy : GRAY[400], marginLeft: 8 }}>
                      {item.label}
                    </Text>
                  </View>
                ))}
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: GRAY[500] }}>Profile Strength</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: profileStrength >= 80 ? SRS.green : ACCENT }}>
                      {profileStrength}%
                    </Text>
                  </View>
                  <View style={styles.strengthBar}>
                    <View style={[styles.strengthFill, {
                      width: `${profileStrength}%`,
                      backgroundColor: profileStrength >= 80 ? SRS.green : ACCENT,
                    }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
  }
}
