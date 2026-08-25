import { StyleSheet, Platform } from 'react-native';
import { SLATE, BG, RED, GREEN, AMBER, PAYMENT, BLUE as BLUETokens } from '@/lib/constants/figma-tokens';
import { NAVY, BLUE, TEAL } from './constants';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 10, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[200] },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: NAVY },

  // Progress
  progress: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[200] },
  progressItem: { alignItems: 'center', width: 72 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: SLATE[200], alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  progressDotActive: { backgroundColor: BLUE },
  progressDotDone: { backgroundColor: TEAL },
  progressNum: { fontSize: 12, fontWeight: '700', color: SLATE[400] },
  progressNumActive: { color: BG.white },
  progressLabel: { fontSize: 9, color: SLATE[400], textAlign: 'center' },
  progressLabelActive: { color: NAVY, fontWeight: '600' },
  progressLine: { flex: 1, height: 2, backgroundColor: SLATE[200], marginBottom: 16, marginHorizontal: -4 },
  progressLineDone: { backgroundColor: TEAL },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 140, gap: 12 },

  // Steps
  stepTitle: { fontSize: 20, fontWeight: '700', color: NAVY, letterSpacing: -0.3 },
  stepSub: { fontSize: 13, color: SLATE[400], marginTop: -6, marginBottom: 4 },

  // Loading / Empty
  loadingBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 13, color: SLATE[400] },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: SLATE[400] },

  // Room cards
  roomCard: { backgroundColor: BG.white, borderRadius: 14, borderWidth: 1.5, borderColor: SLATE[200], overflow: 'hidden' },
  roomCardSelected: { borderColor: BLUE, backgroundColor: PAYMENT.successLight },
  roomImage: { width: '100%', height: 140 },
  roomBody: { padding: 14, gap: 8 },
  roomTop: { flexDirection: 'row', alignItems: 'flex-start' },
  roomName: { fontSize: 16, fontWeight: '700', color: NAVY },
  roomMeta: { fontSize: 12, color: SLATE[500], marginTop: 2 },
  roomPriceBox: { alignItems: 'flex-end' },
  roomPrice: { fontSize: 16, fontWeight: '700', color: TEAL },
  roomPerNight: { fontSize: 11, color: SLATE[400] },
  roomBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomBadgeText: { fontSize: 12, color: TEAL, fontWeight: '500' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: SLATE[100] },
  qtyLabel: { fontSize: 12, color: SLATE[400] },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: BLUETokens[50], alignItems: 'center', justifyContent: 'center' },
  qtyVal: { fontSize: 16, fontWeight: '700', color: NAVY, minWidth: 24, textAlign: 'center' },
  qtyTotal: { fontSize: 14, fontWeight: '700', color: TEAL },

  // Guest details
  guestDetails: { gap: 4 },

  // Room summary
  roomSummary: { backgroundColor: BG.white, borderRadius: 14, borderWidth: 1, borderColor: SLATE[200], padding: 14, gap: 10 },
  roomSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomSummaryImgBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: BLUETokens[50], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  roomSummaryImg: { width: '100%', height: '100%' },
  roomSummaryName: { fontSize: 14, fontWeight: '700', color: NAVY },
  roomSummaryMeta: { fontSize: 12, color: SLATE[500], marginTop: 1 },
  roomSummaryPrice: { fontSize: 14, fontWeight: '700', color: TEAL },
  roomSummaryChange: { borderTopWidth: 1, borderTopColor: SLATE[100], paddingTop: 10, alignItems: 'flex-start' },
  roomSummaryChangeText: { fontSize: 13, fontWeight: '600', color: BLUE },

  // Fields
  field: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: NAVY },
  input: { backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: SLATE[900] },
  inputError: { borderColor: RED[500], backgroundColor: RED[50] },
  errorText: { fontSize: 11, color: RED[500] },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  selectText: { fontSize: 15, color: SLATE[900] },

  // Promo
  promoBox: { gap: 6 },
  promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  promoBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, backgroundColor: BLUE },
  promoBtnText: { fontSize: 14, fontWeight: '600', color: BG.white },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: GREEN.pale, borderWidth: 1, borderColor: GREEN[200] },
  promoCode: { fontSize: 14, fontWeight: '600', color: TEAL, flex: 1 },
  promoDiscount: { fontSize: 14, fontWeight: '600', color: RED[600] },

  // Price
  priceBox: { padding: 16, borderRadius: 14, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], gap: 6 },
  priceTitle: { fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 13, color: SLATE[500], flex: 1 },
  priceVal: { fontSize: 13, fontWeight: '600', color: NAVY },
  priceDivider: { height: 1, backgroundColor: SLATE[200], marginVertical: 4 },
  priceTotalLabel: { fontSize: 16, fontWeight: '700', color: NAVY },
  priceTotalVal: { fontSize: 18, fontWeight: '700', color: TEAL },

  // Cancel
  cancelBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: GREEN.pale, borderWidth: 1, borderColor: GREEN[200] },
  cancelTitle: { fontSize: 13, fontWeight: '600', color: NAVY },
  cancelDesc: { fontSize: 12, color: SLATE[500], marginTop: 2 },

  // Payment method
  payBox: { gap: 8 },
  payOption: { padding: 14, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1.5, borderColor: SLATE[200], gap: 8 },
  payOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: AMBER[50], borderWidth: 1, borderColor: AMBER[200], borderRadius: 8, padding: 10 },
  payNoteText: { flex: 1, fontSize: 11, color: AMBER[800], lineHeight: 16 },
  payRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: SLATE[300], alignItems: 'center', justifyContent: 'center' },
  payRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE },
  payName: { fontSize: 14, fontWeight: '600', color: NAVY },
  payDesc: { fontSize: 12, color: SLATE[500], marginTop: 1 },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 16, backgroundColor: BG.white, borderTopWidth: 1, borderTopColor: SLATE[200], gap: 10 },
  bottomPrice: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomTotalLabel: { fontSize: 13, color: SLATE[500] },
  bottomTotalVal: { fontSize: 20, fontWeight: '700', color: NAVY },
  bottomBtns: { flexDirection: 'row', gap: 10 },
  btnBack: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: SLATE[100] },
  btnBackText: { fontSize: 15, fontWeight: '600', color: SLATE[500] },
  btnNext: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: BLUE },
  btnNextConfirm: { backgroundColor: TEAL },
  btnNextText: { fontSize: 15, fontWeight: '700', color: BG.white },

  // Login gate
  gateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gateIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  gateTitle: { fontSize: 20, fontWeight: '700', color: NAVY, marginBottom: 8, textAlign: 'center' },
  gateDesc: { fontSize: 14, color: SLATE[500], textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  gateLoginBtn: { width: '100%', paddingVertical: 15, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', marginBottom: 12 },
  gateLoginBtnText: { fontSize: 15, fontWeight: '700', color: BG.white },
  gateRegisterBtn: { width: '100%', paddingVertical: 15, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1.5, borderColor: BLUE, alignItems: 'center', marginBottom: 12 },
  gateRegisterBtnText: { fontSize: 15, fontWeight: '700', color: BLUE },
  gateCancelText: { fontSize: 13, color: SLATE[400], fontWeight: '600' },
});
