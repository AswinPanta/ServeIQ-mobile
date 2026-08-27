import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BG, RED, SLATE, AMBER, PAYMENT } from '@/lib/constants/figma-tokens';
import { styles } from './styles';
import { NAVY, BLUE, TEAL, formatDate, PAYMENT_METHODS, gatewayUnavailableNote } from './constants';
import type { PaymentGateway, SelectedRoom, Step, GuestInfo } from './constants';

export function BookingHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={20} color={NAVY} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Booking</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

export function ProgressHeader({ stepLabels, displayStep }: {
  stepLabels: string[];
  displayStep: number;
}) {
  return (
    <View style={styles.progress}>
      {stepLabels.map((label, i) => (
        <React.Fragment key={label}>
          <View style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              i < displayStep && styles.progressDotDone,
              i === displayStep && styles.progressDotActive,
            ]}>
              {i < displayStep ? (
                <Ionicons name="checkmark" size={12} color={BG.white} />
              ) : (
                <Text style={[styles.progressNum, i === displayStep && styles.progressNumActive]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i <= displayStep && styles.progressLabelActive]} numberOfLines={1}>
              {label}
            </Text>
          </View>
          {i < stepLabels.length - 1 && (
            <View style={[styles.progressLine, i < displayStep && styles.progressLineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export function StepRooms({
  isLoading, roomsError, availableRooms, selectedRooms, nights, currency,
  onRetry, onToggleRoom, onUpdateQuantity,
}: {
  isLoading: boolean;
  roomsError: string | null;
  availableRooms: SelectedRoom[];
  selectedRooms: SelectedRoom[];
  nights: number;
  currency: string;
  onRetry: () => void;
  onToggleRoom: (room: SelectedRoom) => void;
  onUpdateQuantity: (roomId: string, delta: number) => void;
}) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Select your rooms</Text>
      <Text style={styles.stepSub}>Choose the perfect room for your stay</Text>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Finding available rooms...</Text>
        </View>
      ) : roomsError ? (
        <View style={styles.emptyBox}>
          <Ionicons name="alert-circle-outline" size={48} color={RED[500]} />
          <Text style={[styles.emptyText, { color: RED[500] }]}>{roomsError}</Text>
          <TouchableOpacity onPress={onRetry} style={{ marginTop: 12, backgroundColor: BLUE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: BG.white, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : availableRooms.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bed-outline" size={48} color={SLATE[300]} />
          <Text style={styles.emptyText}>No rooms available for these dates</Text>
          <TouchableOpacity onPress={onRetry} style={{ marginTop: 12, borderWidth: 1, borderColor: SLATE[300], paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: SLATE[500], fontWeight: '600' }}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        availableRooms.map(room => {
          const isSelected = selectedRooms.some(r => r.id === room.id);
          const selectedRoom = selectedRooms.find(r => r.id === room.id);
          const qty = selectedRoom?.quantity || 0;
          // Total quantity selected across all rooms of the same type
          const typeSelectedTotal = selectedRooms
            .filter(r => r.roomType === room.roomType)
            .reduce((sum, r) => sum + r.quantity, 0);
          const maxQty = room.maxQuantity ?? 1;
          const atMax = typeSelectedTotal >= maxQty;

          return (
            <TouchableOpacity
              key={room.id}
              onPress={() => onToggleRoom(room)}
              style={[styles.roomCard, isSelected && styles.roomCardSelected]}
              activeOpacity={0.7}
            >
              <Image source={{ uri: room.image }} style={styles.roomImage} />
              <View style={styles.roomBody}>
                <View style={styles.roomTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomMeta}>{room.bedType} bed · Up to {room.maxAdults} guests</Text>
                    <Text style={[styles.roomMeta, { fontSize: 11, marginTop: 2, color: atMax ? '#E63946' : '#6B7280' }]}>
                      {maxQty} available
                    </Text>
                  </View>
                  <View style={styles.roomPriceBox}>
                    <Text style={styles.roomPrice}>{currency} {room.price.toLocaleString()}</Text>
                    <Text style={styles.roomPerNight}>/night</Text>
                  </View>
                </View>

                <View style={styles.roomBadge}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={TEAL} />
                  <Text style={styles.roomBadgeText}>{room.cancellation}</Text>
                </View>

                {isSelected && (
                  <View style={styles.qtyRow}>
                    <Text style={styles.qtyLabel}>Quantity</Text>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity onPress={() => onUpdateQuantity(room.id, -1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={18} color={BLUE} />
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{qty}</Text>
                      <TouchableOpacity
                        onPress={() => onUpdateQuantity(room.id, 1)}
                        style={[styles.qtyBtn, atMax && { opacity: 0.35 }]}
                        disabled={atMax}
                      >
                        <Ionicons name="add" size={18} color={BLUE} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.qtyTotal}>{currency} {(room.price * qty * nights).toLocaleString()}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

export function StepDetails({
  selectedRooms, nights,  currency,
  guestInfo, guestErrors,
  onFieldChange, onClearError, onChangeRoom,
}: {
  selectedRooms: SelectedRoom[];
  nights: number;
  currency: string;
  guestInfo: GuestInfo;
  guestErrors: Record<string, string>;
  onFieldChange: (field: keyof GuestInfo, value: string) => void;
  onClearError: (field: string) => void;
  onChangeRoom: () => void;
}) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Enter your details</Text>
        <Text style={styles.stepSub}>Please fill in your information to complete the booking</Text>

        {selectedRooms.length > 0 && (
          <View style={styles.roomSummary}>
            {selectedRooms.map(r => (
              <View key={r.id} style={styles.roomSummaryRow}>
                <View style={styles.roomSummaryImgBox}>
                  {r.image ? (
                    <Image source={{ uri: r.image }} style={styles.roomSummaryImg} />
                  ) : (
                    <Ionicons name="bed-outline" size={18} color={BLUE} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomSummaryName}>{r.name}{r.quantity > 1 ? ` ×${r.quantity}` : ''}</Text>
                  <Text style={styles.roomSummaryMeta}>{r.bedType} bed · {r.quantity} × {nights} night{nights > 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.roomSummaryPrice}>{currency} {(r.price * r.quantity * nights).toLocaleString()}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={onChangeRoom} style={styles.roomSummaryChange}>
              <Text style={styles.roomSummaryChangeText}>Change room</Text>
            </TouchableOpacity>
          </View>
        )}

        {[
          { key: 'firstName', label: 'First name', placeholder: 'John', value: guestInfo.firstName, onChange: (v: string) => onFieldChange('firstName', v), required: true },
          { key: 'lastName', label: 'Last name (optional)', placeholder: 'Doe', value: guestInfo.lastName, onChange: (v: string) => onFieldChange('lastName', v), required: false },
          { key: 'email', label: 'Email address', placeholder: 'john@example.com', value: guestInfo.email, onChange: (v: string) => onFieldChange('email', v), keyboard: 'email-address' as const, required: true },
          { key: 'phone', label: 'Phone number', placeholder: '+977 98XXXXXXXX', value: guestInfo.phone, onChange: (v: string) => onFieldChange('phone', v), keyboard: 'phone-pad' as const, required: true },
        ].map(f => (
          <View key={f.key} style={styles.field}>
            <Text style={styles.fieldLabel}>{f.label} {f.required && <Text style={{ color: RED[500] }}>*</Text>}</Text>
            <TextInput
              placeholder={f.placeholder}
              placeholderTextColor={SLATE[400]}
              value={f.value}
              onChangeText={(v) => { f.onChange(v); if (guestErrors[f.key]) onClearError(f.key); }}
              keyboardType={f.keyboard || 'default'}
              autoCapitalize="none"
              style={[styles.input, guestErrors[f.key] && styles.inputError]}
            />
            {guestErrors[f.key] && <Text style={styles.errorText}>{guestErrors[f.key]}</Text>}
          </View>
        ))}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Country / Region</Text>
          <View style={styles.select}>
            <Text style={styles.selectText}>{guestInfo.country}</Text>
            <Ionicons name="chevron-down" size={16} color={SLATE[400]} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Special Requests</Text>
          <TextInput
            placeholder="Any special requests? (optional)"
            placeholderTextColor={SLATE[400]}
            value={guestInfo.specialRequests}
            onChangeText={(v) => onFieldChange('specialRequests', v)}
            multiline
            numberOfLines={3}
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function StepPayment({
  appliedPromo, promoCode, onPromoCodeChange, onApplyPromo, promoLoading, onClearPromo,
  selectedRooms, nights, currency, promoDiscount, total, checkIn, paymentMethod, onSelectPaymentMethod,
}: {
  appliedPromo: { code: string; discount: number } | null;
  promoCode: string;
  onPromoCodeChange: (v: string) => void;
  onApplyPromo: () => void;
  promoLoading: boolean;
  onClearPromo: () => void;
  selectedRooms: SelectedRoom[];
  nights: number;
  currency: string;
  promoDiscount: number;
  total: number;
  checkIn: string;
  paymentMethod: PaymentGateway;
  onSelectPaymentMethod: (m: PaymentGateway) => void;
}) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Finish booking</Text>
      <Text style={styles.stepSub}>Review your booking and complete payment</Text>

      {/* Promo code */}
      <View style={styles.promoBox}>
        <Text style={styles.fieldLabel}>Promo code</Text>
        {appliedPromo ? (
          <View style={styles.promoApplied}>
            <Ionicons name="checkmark-circle" size={16} color={TEAL} />
            <Text style={styles.promoCode}>{appliedPromo.code}</Text>
            <Text style={styles.promoDiscount}>-{appliedPromo.discount.toLocaleString()}</Text>
            <TouchableOpacity onPress={onClearPromo}>
              <Ionicons name="close-circle" size={20} color={SLATE[400]} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.promoRow}>
            <TextInput
              placeholder="Enter code"
              placeholderTextColor={SLATE[400]}
              value={promoCode}
              onChangeText={onPromoCodeChange}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={onApplyPromo} style={styles.promoBtn} disabled={promoLoading}>
              {promoLoading ? <ActivityIndicator size="small" color={BLUE} /> : <Text style={styles.promoBtnText}>Apply</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Price summary */}
      <View style={styles.priceBox}>
        <Text style={styles.priceTitle}>Price details</Text>
        {selectedRooms.map(r => (
          <View key={r.id} style={styles.priceRow}>
            <Text style={styles.priceLabel}>{r.name} x{r.quantity} × {nights}n</Text>
            <Text style={styles.priceVal}>{currency} {(r.price * r.quantity * nights).toLocaleString()}</Text>
          </View>
        ))}
        {promoDiscount > 0 && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: RED[600] }]}>Discount</Text>
            <Text style={[styles.priceVal, { color: RED[600] }]}>-{currency} {promoDiscount.toLocaleString()}</Text>
          </View>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Taxes & fees</Text>
          <Text style={styles.priceVal}>Included</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceRow}>
          <Text style={styles.priceTotalLabel}>Total</Text>
          <Text style={styles.priceTotalVal}>{currency} {total.toLocaleString()}</Text>
        </View>
      </View>

      {/* Cancellation */}
      <View style={styles.cancelBox}>
        <Ionicons name="shield-checkmark-outline" size={18} color={TEAL} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cancelTitle}>Free cancellation</Text>
          <Text style={styles.cancelDesc}>Cancel before {formatDate(checkIn)} for a full refund</Text>
        </View>
      </View>

      {/* Payment method */}
      <View style={styles.payBox}>
        <Text style={styles.fieldLabel}>Payment method</Text>
        {PAYMENT_METHODS.map(m => {
          const selected = paymentMethod === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => onSelectPaymentMethod(m.key)}
              style={[styles.payOption, selected && { borderColor: BLUE, backgroundColor: PAYMENT.successLight }]}
            >
              <View style={styles.payOptionRow}>
                <View style={[styles.payRadio, selected && { borderColor: BLUE }]}>
                  {selected && <View style={styles.payRadioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payName}>{m.name}</Text>
                  <Text style={styles.payDesc}>{m.desc}</Text>
                </View>
              </View>
              {selected && gatewayUnavailableNote(m.key) && (
                <View style={styles.payNote}>
                  <Ionicons name="information-circle-outline" size={14} color={AMBER[700]} />
                  <Text style={styles.payNoteText}>{gatewayUnavailableNote(m.key)}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

export function BottomBar({
  step, total, currency, isSubmitting, isProcessing, onBack, onNext, onComplete,
}: {
  step: Step;
  total: number;
  currency: string;
  isSubmitting: boolean;
  isProcessing: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}) {
  return (
    <View style={styles.bottomBar}>
      <View style={styles.bottomPrice}>
        <Text style={styles.bottomTotalLabel}>Total</Text>
        <Text style={styles.bottomTotalVal}>{currency} {total.toLocaleString()}</Text>
      </View>
      <View style={styles.bottomBtns}>
        {step > 0 && (
          <TouchableOpacity onPress={onBack} style={styles.btnBack}>
            <Text style={styles.btnBackText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={step === 2 ? onComplete : onNext}
          style={[styles.btnNext, step === 2 && styles.btnNextConfirm]}
          disabled={isSubmitting || isProcessing}
        >
          {isSubmitting || isProcessing ? (
            <ActivityIndicator color={BG.white} />
          ) : (
            <Text style={styles.btnNextText}>
              {step === 2 ? 'Complete booking' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function LoginGate({ onLogin, onRegister, onBack }: {
  onLogin: () => void;
  onRegister: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.gateBox}>
      <View style={styles.gateIcon}>
        <Ionicons name="lock-closed" size={30} color={BG.white} />
      </View>
      <Text style={styles.gateTitle}>Login required to book</Text>
      <Text style={styles.gateDesc}>
        Please log in or create an account to continue with your booking. Your room selection and dates will be kept.
      </Text>
      <TouchableOpacity style={styles.gateLoginBtn} onPress={onLogin} activeOpacity={0.85}>
        <Text style={styles.gateLoginBtnText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.gateRegisterBtn} onPress={onRegister} activeOpacity={0.85}>
        <Text style={styles.gateRegisterBtnText}>Create account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.gateCancelText}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
}
