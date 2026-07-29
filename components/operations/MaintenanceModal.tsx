import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HK_COLORS as C } from '@/lib/constants/housekeeping-theme';

const ISSUE_CATEGORIES = ['Plumbing', 'Electrical', 'HVAC', 'Furniture', 'Walls & Paint', 'Appliances', 'Other'] as const;
const PRIORITY_LEVELS = ['Low', 'Medium', 'High'] as const;

interface MaintenanceModalProps {
  visible: boolean;
  onClose: () => void;
  roomId?: string;
}

export function MaintenanceModal({ visible, onClose, roomId }: MaintenanceModalProps) {
  const [category, setCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [priority, setPriority] = useState<string>('Medium');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!category) {
      Alert.alert('Missing Category', 'Please select an issue category');
      return;
    }
    Alert.alert(
      'Report Submitted',
      `Maintenance issue for Room ${roomId || 'N/A'} has been reported.\n\nCategory: ${category}\nPriority: ${priority}`,
      [{ text: 'OK', onPress: onClose }]
    );
    // Reset form
    setCategory('');
    setPriority('Medium');
    setNotes('');
    setPhotoUri(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerContent}>
            <Text style={s.heading}>Report Maintenance Issue</Text>
            <View style={s.headerMeta}>
              <IconSymbol name="edit" size={10} color={C.textPrimary} />
              <Text style={s.headerMetaText}>Room {roomId || 'N/A'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <IconSymbol name="close" size={14} color={C.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Main Form Content */}
        <ScrollView style={s.scrollContent} contentContainerStyle={s.scrollContentInner}>
          {/* Photo Dropzone */}
          <TouchableOpacity style={s.photoDropzone} activeOpacity={0.7}>
            <IconSymbol name="camera" size={20} color={C.tealDark} />
            <Text style={s.photoDropzoneText}>Tap to take photo or upload image</Text>
            <Text style={s.photoDropzoneHint}>JPG/PNG up to 10MB</Text>
          </TouchableOpacity>

          {/* Category Dropdown */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>ISSUE CATEGORY</Text>
            <TouchableOpacity
              style={s.dropdown}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              activeOpacity={0.7}
            >
              <Text style={[s.dropdownText, !category && { color: C.textMuted }]}>
                {category || 'Select Category...'}
              </Text>
              <IconSymbol name={showCategoryDropdown ? 'chevron.up' : 'chevron.down'} size={12} color={C.textMuted} />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={s.dropdownOptions}>
                {ISSUE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.dropdownOption, category === cat && s.dropdownOptionActive]}
                    onPress={() => { setCategory(cat); setShowCategoryDropdown(false); }}
                  >
                    <Text style={[s.dropdownOptionText, category === cat && s.dropdownOptionTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Priority Toggle */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>PRIORITY LEVEL</Text>
            <View style={s.priorityRow}>
              {PRIORITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    s.priorityBtn,
                    priority === level && s.priorityBtnActive,
                    level === 'High' && priority === level && s.priorityBtnHigh,
                  ]}
                  onPress={() => setPriority(level)}
                >
                  {level === 'High' && priority === level && (
                    <IconSymbol name="warning" size={12} color="#FFF" />
                  )}
                  <Text style={[
                    s.priorityBtnText,
                    priority === level && s.priorityBtnTextActive,
                    level === 'High' && priority === level && { color: '#FFF' },
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes Textarea */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>ADDITIONAL NOTES</Text>
            <TextInput
              style={s.textarea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe the issue..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Footer / Action Area */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.submitBtn, !category && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!category}
            activeOpacity={0.85}
          >
            <IconSymbol name="paperplane.fill" size={14} color="#FFF" />
            <Text style={s.submitBtnText}>SUBMIT REPORT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  // Header - matches Figma: padding 24px 16px 8px, border-bottom 1px solid #C3C6CF
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  heading: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: '600',
    color: C.navy,
    letterSpacing: -0.5,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerMetaText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: C.textPrimary,
    letterSpacing: 0.24,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: C.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Main Form Content - matches Figma: padding 16px 16px 0, gap 16px
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 16,
    paddingBottom: 0,
    gap: 16,
  },
  // Photo Dropzone - matches Figma: border 2px dashed #C3C6CF, border-radius 8px, height 144px
  photoDropzone: {
    height: 144,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoDropzoneText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: C.navy,
  },
  photoDropzoneHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    letterSpacing: 0.24,
  },
  // Form Fields - gap 16px
  fieldGroup: {
    gap: 4,
  },
  // Label - matches Figma: Inter 12px weight 500, uppercase, letter-spacing 0.6px, color #43474E
  fieldLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: C.textPrimary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  // Dropdown - matches Figma: bg #FFFFFF, border 1px solid #C3C6CF, border-radius 4px, height 44px
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
  },
  dropdownText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: C.textHeading,
  },
  dropdownOptions: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropdownOptionActive: {
    backgroundColor: C.badgeBlue + '40',
  },
  dropdownOptionText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: C.textHeading,
  },
  dropdownOptionTextActive: {
    color: C.teal,
    fontWeight: '600',
  },
  // Priority Toggle - matches Figma: border 1px solid #73777F, border-radius 4px
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderWidth: 1,
    borderColor: C.textMuted,
    borderRadius: 4,
  },
  priorityBtnActive: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  priorityBtnHigh: {
    backgroundColor: C.dirty,
    borderColor: C.dirty,
  },
  priorityBtnText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: C.textPrimary,
    letterSpacing: 0.24,
  },
  priorityBtnTextActive: {
    color: '#FFF',
  },
  // Textarea - matches Figma: bg #FFFFFF, border 1px solid #C3C6CF, border-radius 4px, min-height 100px
  textarea: {
    minHeight: 100,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 62,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: C.textHeading,
  },
  // Footer - matches Figma: bg #F4F3F6, border-top 1px solid #C3C6CF, padding 16px
  footer: {
    padding: 16,
    backgroundColor: C.cardBg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  // Submit Button - matches Figma: bg #002645, border-radius 4px, height 48px, shadow
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: C.navy,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: C.border,
  },
  submitBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#FFF',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
