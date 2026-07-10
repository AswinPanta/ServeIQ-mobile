import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';

import type { GuestProfile } from '@/types/api';
import { safeGoBack } from '@/lib/utils';
export default function ProfileEditScreen() {
  const colors = useColors();
  const { user: authUser, setUser } = useAuth();
  const user = authUser as GuestProfile | null;
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profile_photo || null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nationality, setNationality] = useState(user?.nationality || '');
  const [bio, setBio] = useState('Travel enthusiast who loves exploring new places and experiencing local culture.');

  const requestPermissions = async (type: 'camera' | 'gallery') => {
    if (type === 'gallery') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery access to change profile picture');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access to take a photo');
        return false;
      }
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions('gallery');
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions('camera');
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      setUser({
        ...user,
        name,
        email,
        phone,
        nationality,
        profile_photo: profilePhoto ?? undefined,
      });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => safeGoBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save profile changes');
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center justify-between border-b border-border">
          <TouchableOpacity onPress={() => safeGoBack()}>
            <Text className="text-base text-muted">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-base font-semibold text-primary">Save</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Photo Section */}
        <View className="items-center py-6">
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Change Profile Photo',
                'Select an option',
                [
                  { text: 'Take Photo', onPress: pickImageFromCamera },
                  { text: 'Choose from Gallery', onPress: pickImageFromGallery },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            className="relative"
          >
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                className="w-24 h-24 rounded-full bg-surface"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center">
                <Text className="text-3xl font-bold text-primary">
                  {name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-xs">📷</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-sm text-muted mt-2">Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View className="px-6 gap-4">
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted}
              className="bg-surface rounded-xl px-4 py-3.5 text-base text-foreground border border-border"
              style={{ color: colors.foreground }}
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-surface rounded-xl px-4 py-3.5 text-base text-foreground border border-border"
              style={{ color: colors.foreground }}
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              className="bg-surface rounded-xl px-4 py-3.5 text-base text-foreground border border-border"
              style={{ color: colors.foreground }}
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Nationality</Text>
            <TextInput
              value={nationality}
              onChangeText={setNationality}
              placeholder="Enter your nationality"
              placeholderTextColor={colors.muted}
              className="bg-surface rounded-xl px-4 py-3.5 text-base text-foreground border border-border"
              style={{ color: colors.foreground }}
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-surface rounded-xl px-4 py-3.5 text-base text-foreground border border-border h-24"
              style={{ color: colors.foreground }}
            />
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
