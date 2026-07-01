import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (review: { rating: number; title: string; comment: string; photos: string[] }) => void;
  hotelName: string;
}

export function ReviewModal({ visible, onClose, onSubmit, hotelName }: ReviewModalProps) {
  const colors = useColors();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPhoto = () => {
    const newPhoto = `https://via.placeholder.com/300x300?text=Photo+${photos.length + 1}`;
    setPhotos([...photos, newPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim() || !comment.trim()) {
      Alert.alert('Missing Information', 'Please fill in title and comment');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit({ rating, title, comment, photos });
      resetForm();
      onClose();
    }, 1000);
  };

  const resetForm = () => {
    setRating(5);
    setTitle('');
    setComment('');
    setPhotos([]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-auto bg-background rounded-t-3xl max-h-[95%]">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Write a Review</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-2xl text-foreground">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
            <Text className="text-sm text-muted mb-4">{hotelName}</Text>

            <View className="mb-6">
              <Text className="text-base font-semibold text-foreground mb-3">How would you rate your stay?</Text>
              <View className="flex-row gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    className="p-2"
                  >
                    <Text className="text-4xl">{star <= rating ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="text-center text-sm text-muted mt-2">{rating} out of 5 stars</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Review Title</Text>
              <TextInput
                placeholder="Summarize your experience"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
              />
              <Text className="text-xs text-muted mt-1">{title.length}/100</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Your Review</Text>
              <TextInput
                placeholder="Share your experience with other guests"
                placeholderTextColor={colors.muted}
                value={comment}
                onChangeText={setComment}
                maxLength={500}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
              />
              <Text className="text-xs text-muted mt-1">{comment.length}/500</Text>
            </View>

            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-foreground">Add Photos</Text>
                <Text className="text-xs text-muted">{photos.length}/5</Text>
              </View>

              <View className="flex-row flex-wrap gap-2 mb-3">
                {photos.map((photo, index) => (
                  <View key={index} className="relative">
                    <Image
                      source={{ uri: photo }}
                      className="w-20 h-20 rounded-lg bg-surface"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemovePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error items-center justify-center"
                    >
                      <Text className="text-white text-xs font-bold">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {photos.length < 5 && (
                  <TouchableOpacity
                    onPress={handleAddPhoto}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border items-center justify-center bg-surface"
                  >
                    <Text className="text-2xl">📷</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text className="text-xs text-muted">
                Add photos to help other guests get a better idea of the hotel
              </Text>
            </View>

            <View className="bg-primary/10 rounded-lg p-3 mb-6">
              <Text className="text-xs text-primary font-semibold">
                ℹ️ Your review will be published after moderation to ensure quality and authenticity.
              </Text>
            </View>
          </ScrollView>

          <View className="flex-row gap-3 px-6 py-4 border-t border-border">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 px-4 rounded-lg bg-surface border border-border"
            >
              <Text className="text-base font-semibold text-foreground text-center">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg',
                isSubmitting ? 'bg-primary/50' : 'bg-primary'
              )}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white text-center">Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
