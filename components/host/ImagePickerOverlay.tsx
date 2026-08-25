import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BG, BLUE, GRAY } from '@/lib/constants/figma-tokens';
;
;

interface Props {
  visible: boolean;
  onClose: () => void;
  onImagePicked?: (uri: string) => void;
  onImagesPicked?: (uris: string[]) => void;
  multiple?: boolean;
  selectionLimit?: number;
}

export function ImagePickerOverlay({ visible, onClose, onImagePicked, onImagesPicked, multiple, selectionLimit }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      onClose();
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: !multiple,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: multiple,
      selectionLimit,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map(a => a.uri);
      if (multiple && onImagesPicked) {
        onImagesPicked(uris);
      } else {
        uris.forEach(uri => onImagePicked?.(uri));
      }
    }
    onClose();
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      onClose();
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      onImagePicked?.(result.assets[0].uri);
    }
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{ backgroundColor: BG.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 }}>
            {multiple ? 'Add Photos' : 'Add Photo'}
          </Text>
          <TouchableOpacity
            onPress={takePhoto}
            style={{ paddingVertical: 16, borderRadius: 12, backgroundColor: BLUE[600] + '10', alignItems: 'center', marginBottom: 8 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: BLUE[600] }}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickFromGallery}
            style={{ paddingVertical: 16, borderRadius: 12, backgroundColor: BLUE[600] + '10', alignItems: 'center', marginBottom: 8 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: BLUE[600] }}>Choose from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={{ paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: GRAY[600] }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}