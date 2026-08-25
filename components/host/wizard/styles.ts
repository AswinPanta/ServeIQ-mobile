import { StyleSheet, Platform } from 'react-native';
import { SRS, GRAY, getAccentColor } from '@/constants/portal-theme';
import { BG, TEXT } from '@/lib/constants/figma-tokens';
import { ACCENT } from './types';

// ─── Main Styles ───────────────────────────────────
export const styles = StyleSheet.create({
  portalPage: {
    flex: 1,
    backgroundColor: GRAY[50],
  },
  portalMain: {
    flex: 1,
  },
  portalMainContent: {
    padding: 24,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: BG.white,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GRAY[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: SRS.navy,
    fontFamily: 'PlayfairDisplay',
  },
  headerStepText: {
    fontSize: 13,
    color: GRAY[500],
    fontWeight: '500',
  },

  // Progress Bar
  progressWrapper: {
    backgroundColor: BG.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[100],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: SRS.navy,
  },
  progressPercent: {
    fontSize: 12,
    color: GRAY[500],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: GRAY[200],
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  progressStepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepCompleted: {
    backgroundColor: SRS.green,
  },
  progressStepCurrent: {
    backgroundColor: ACCENT,
  },
  progressStepUpcoming: {
    backgroundColor: GRAY[200],
  },
  progressStepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: GRAY[600],
  },
  progressStepLabel: {
    fontSize: 10,
    color: GRAY[500],
    textAlign: 'center',
  },

  // Step Content
  stepContentWrapper: {
    gap: 20,
  },

  // Type Selector (centered card)
  typeContainer: {
    justifyContent: 'center',
    paddingVertical: 40,
  },
  typeCard: {
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  typeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: SRS.navy,
    marginBottom: 8,
  },
  typeSubtitle: {
    fontSize: 14,
    color: GRAY[500],
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 500,
  },
  typeCardItem: {
    width: 140,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: GRAY[200],
    borderRadius: 12,
    backgroundColor: BG.white,
  },
  typeCardSelected: {
    borderColor: ACCENT,
    backgroundColor: getAccentColor(0.05),
  },
  typeCardCustom: {
    borderStyle: 'dashed',
    borderColor: GRAY[300],
  },
  typeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GRAY[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconSelected: {
    backgroundColor: ACCENT,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: SRS.navy,
  },
  typeLabelSelected: {
    color: ACCENT,
    fontWeight: '600',
  },

  // Step Cards
  stepCard: {
    backgroundColor: BG.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 24,
  },
  stepCardHeader: {
    marginBottom: 16,
  },
  stepCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SRS.navy,
    marginBottom: 4,
  },
  stepCardSubtitle: {
    fontSize: 13,
    color: GRAY[500],
  },

  // Form Elements
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: SRS.navy,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: SRS.navy,
  },
  formHint: {
    fontSize: 12,
    color: GRAY[500],
    marginTop: 4,
  },
  formHintInline: {
    fontSize: 12,
    color: GRAY[500],
    marginBottom: 6,
  },
  formRow2: {
    flexDirection: 'row',
    gap: 16,
  },
  formRow3: {
    flexDirection: 'row',
    gap: 16,
  },
  charCount: {
    fontSize: 12,
    color: GRAY[500],
    textAlign: 'right',
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    paddingHorizontal: 12,
  },

  // Select / Chips
  selectWrap: {
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    padding: 8,
    backgroundColor: BG.white,
    maxHeight: 120,
  },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: GRAY[100],
    borderWidth: 1,
    borderColor: GRAY[200],
  },
  countryDropdown: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  countrySearchInput: {
    borderBottomWidth: 1,
    borderBottomColor: GRAY[200],
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: SRS.navy,
  },
  countryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[100],
  },
  countryDropdownItemActive: {
    backgroundColor: getAccentColor(0.06),
  },
  countryDropdownText: {
    fontSize: 14,
    color: SRS.navy,
  },
  countryDropdownTextActive: {
    fontWeight: '600',
    color: ACCENT,
  },

  // Location on Map
  mapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: getAccentColor(0.06),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: ACCENT + '55',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  mapSelectedCard: {
    backgroundColor: getAccentColor(0.04),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 14,
    marginTop: 10,
  },

  // Photo Upload
  photoUploadZone: {
    borderWidth: 2,
    borderColor: GRAY[300],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: getAccentColor(0.03),
  },
  hintDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GRAY[400],
  },
  uploadHint: {
    fontSize: 12,
    color: GRAY[500],
  },
  photoPreviewGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  photoPreviewItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: GRAY[100],
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(192,57,43,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: ACCENT,
  },
  coverBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: BG.white,
  },
  coverSetBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    backgroundColor: 'rgba(15,23,42,0.65)',
    alignItems: 'center',
  },
  photoPreviewMore: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: GRAY[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewAdd: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: GRAY[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Amenities
  amenitySearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: BG.white,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[100],
  },
  amenityCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: GRAY[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityCheckboxActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  customAmenitySection: {
    borderTopWidth: 1,
    borderTopColor: GRAY[200],
    paddingTop: 12,
    marginTop: 8,
  },
  customAmenityTitle: {
    fontSize: 12,
    color: GRAY[500],
    marginBottom: 8,
  },
  addAmenityBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAmenityHint: {
    fontSize: 11,
    color: GRAY[400],
    marginTop: 6,
  },

  // Offers
  offerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY[200],
    marginBottom: 8,
    backgroundColor: BG.white,
  },
  offerItemEnabled: {
    backgroundColor: getAccentColor(0.05),
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addCustomOfferBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT + '40',
    alignItems: 'center',
    backgroundColor: BG.white,
  },

  // Navigation
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    backgroundColor: BG.white,
    borderTopWidth: 1,
    borderTopColor: GRAY[100],
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: GRAY[100],
  },
  btnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: ACCENT,
  },
  btnSaveDraftInline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT + '40',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: BG.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[200],
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: GRAY[200],
  },
  btnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GRAY[200],
  },
  btnSaveDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: ACCENT,
  },

  // Review Sidebar
  reviewSidebar: {
    gap: 16,
  },
  reviewGrid2: {
    flexDirection: 'row',
    gap: 16,
  },
  reviewPhotoItem: {
    width: 64,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: GRAY[100],
  },
  reviewAmenityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: getAccentColor(0.1),
  },
  reviewRoomTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: GRAY[100],
  },

  // Publish Card
  publishCard: {
    backgroundColor: BG.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  btnLaunch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    marginTop: 12,
  },
  btnSaveDraft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT + '40',
    justifyContent: 'center',
    marginTop: 8,
  },

  // Checklist
  checklistCard: {
    backgroundColor: BG.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 20,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: GRAY[500],
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: GRAY[200],
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
});
