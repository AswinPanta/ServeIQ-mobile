import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onImagePicked: (uri: string) => void;
}

export function ImagePickerOverlay({ visible, onClose, onImagePicked }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      onClose();
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      onImagePicked(result.assets[0].uri);
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
      onImagePicked(result.assets[0].uri);
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
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 }}>Add Photo</Text>
          <TouchableOpacity
            onPress={takePhoto}
            style={{ paddingVertical: 16, borderRadius: 12, backgroundColor: '#2563EB10', alignItems: 'center', marginBottom: 8 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#2563EB' }}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickFromGallery}
            style={{ paddingVertical: 16, borderRadius: 12, backgroundColor: '#2563EB10', alignItems: 'center', marginBottom: 8 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#2563EB' }}>Choose from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={{ paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#4B5563' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
